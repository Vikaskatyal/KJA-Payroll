import { useState, useEffect } from 'react';
import { Calculator, Download, FileText, FileSpreadsheet, CreditCard } from 'lucide-react';
import { AttendanceSheet } from '../types/attendance';
import { PayrollSummary, PayrollRecord, PayrollHistory } from '../types/payroll';
import { loadEmployees, loadPayrollHistory, savePayrollHistory, savePayrollData, loadDuesFromLastCycle, saveDuesFromLastCycle, loadSettings, generateId } from '../utils/storage';
import { calculatePayroll } from '../utils/calculations';
import { generatePayrollExcel, generateBankStatement } from '../utils/excelGenerator';
import { generatePayslipPDF, generateAllPayslips } from '../utils/pdfGenerator';
import { MONTHS, formatCurrency, formatNumber, getCalendarDays } from '../utils/constants';

interface Props {
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function PayrollGeneration({ addToast }: Props) {
  const [attendance, setAttendance] = useState<AttendanceSheet | null>(null);
  const [payroll, setPayroll] = useState<PayrollSummary | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const employees = loadEmployees();
  const settings = loadSettings();

  // Check for attendance in sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('current_attendance');
    if (stored) {
      const parsed = JSON.parse(stored) as AttendanceSheet;
      setAttendance(parsed);
      setMonth(parsed.month);
      setYear(parsed.year);
    }
  }, []);

  const handleGenerate = () => {
    if (!attendance) {
      addToast('Please upload attendance first', 'error');
      return;
    }
    const totalCalendarDays = getCalendarDays(month, year);
    const duesFromLastCycle = loadDuesFromLastCycle(month, year);
    const records: PayrollRecord[] = [];
    let skipped = 0;

    attendance.records.forEach((atRec, idx) => {
      const emp = employees.find((e) => e.empCode === atRec.empCode);
      if (!emp) { skipped++; return; }

      const dueFromLast = duesFromLastCycle[emp.empCode] || 0;
      const record = calculatePayroll(emp, atRec, month, year, totalCalendarDays, dueFromLast);
      record.sNo = records.length + 1;
      records.push(record);
    });

    // Save dues for next month
    const newDues: Record<string, number> = {};
    records.forEach((r) => { newDues[r.empCode] = r.deductions.dueInNextCycle; });
    saveDuesFromLastCycle(month, year, newDues);

    const monthName = MONTHS[month - 1];
    const summary: PayrollSummary = {
      month, year, monthName,
      generatedOn: new Date().toLocaleDateString('en-IN'),
      generatedBy: settings.companyName,
      totalEmployees: records.length,
      totalGrossSalary: records.reduce((s, r) => s + r.earnings.grossSalary, 0),
      totalNetPayment: records.reduce((s, r) => s + r.netPaymentForMonth, 0),
      totalPFEmployee: records.reduce((s, r) => s + r.deductions.employeePF, 0),
      totalPFEmployer: records.reduce((s, r) => s + r.deductions.employerPF, 0),
      totalESIEmployee: records.reduce((s, r) => s + r.deductions.employeeESI, 0),
      totalESIEmployer: records.reduce((s, r) => s + r.deductions.employerESI, 0),
      totalPT: records.reduce((s, r) => s + r.deductions.professionalTax, 0),
      totalTDS: records.reduce((s, r) => s + r.deductions.tds, 0),
      records,
    };

    setPayroll(summary);
    savePayrollData(month, year, summary);

    // Save to history
    const history = loadPayrollHistory();
    const existing = history.findIndex((h) => h.month === month && h.year === year);
    const historyEntry: PayrollHistory = {
      id: existing >= 0 ? history[existing].id : generateId(),
      month, year, monthName,
      generatedOn: new Date().toLocaleDateString('en-IN'),
      totalEmployees: records.length,
      totalNetPayment: summary.totalNetPayment,
      status: 'draft',
    };
    if (existing >= 0) { history[existing] = historyEntry; } else { history.push(historyEntry); }
    savePayrollHistory(history);

    setStep(3);
    if (skipped > 0) addToast(`${skipped} employees skipped (not in master)`, 'error');
    else addToast(`Payroll generated for ${records.length} employees`, 'success');
  };

  return (
    <>
      <header className="main-header">
        <h2>Payroll Generation</h2>
        <div className="main-header-actions">
          {payroll && (
            <>
              <button className="btn btn-outline btn-sm" onClick={() => generateBankStatement(payroll)}>
                <CreditCard size={14} /> Bank Statement
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => generatePayrollExcel(payroll)}>
                <FileSpreadsheet size={14} /> Download Excel
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => generateAllPayslips(payroll.records, month, year, settings.companyName)}>
                <FileText size={14} /> All Payslips
              </button>
            </>
          )}
        </div>
      </header>

      <div className="main-body">
        {/* Step Indicator */}
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <span className="step-label">Select Period</span>
          </div>
          <div className="step-connector" />
          <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <span className="step-label">Review Data</span>
          </div>
          <div className="step-connector" />
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span className="step-label">Results</span>
          </div>
        </div>

        {/* Step 1: Period + Attendance Check */}
        {step === 1 && (
          <div className="card">
            <div className="card-header"><h3>Select Payroll Period</h3></div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 24 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Month</label>
                  <select className="form-select" value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ width: 180 }}>
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Year</label>
                  <select className="form-select" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ width: 120 }}>
                    {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ padding: 16, background: attendance ? '#ecfdf5' : '#fff7ed', borderRadius: 8, marginBottom: 20 }}>
                {attendance ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#059669' }}>
                    <Calculator size={20} />
                    <div>
                      <div style={{ fontWeight: 600 }}>Attendance data loaded</div>
                      <div style={{ fontSize: 12 }}>{attendance.records.length} records • {MONTHS[attendance.month - 1]} {attendance.year} • {attendance.totalCalendarDays} calendar days</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#c2410c' }}>
                    ⚠ No attendance data loaded. Please upload attendance first from the Attendance Upload page.
                  </div>
                )}
              </div>

              <button className="btn btn-primary" onClick={() => { if (attendance) setStep(2); else addToast('Upload attendance first', 'error'); }}>
                Next: Review Data
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 2 && attendance && (
          <div className="card">
            <div className="card-header">
              <h3>Review Attendance Data ({attendance.records.length} employees)</h3>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-container" style={{ maxHeight: 400 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Code</th><th>Name</th><th>Salary</th><th>LWP</th><th>TA Days</th><th>Remarks</th><th>In Master?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.records.map((r, i) => {
                      const found = employees.find((e) => e.empCode === r.empCode);
                      return (
                        <tr key={i} style={!found ? { background: '#fef2f2' } : undefined}>
                          <td style={{ fontWeight: 600 }}>{r.empCode}</td>
                          <td>{r.name}</td>
                          <td className="amount">{formatNumber(r.salary)}</td>
                          <td className="amount">{r.lwpDays}</td>
                          <td className="amount">{r.workingDaysForTA}</td>
                          <td>{r.remarks}</td>
                          <td>{found ? <span className="badge badge-success">✓</span> : <span className="badge badge-danger">✗</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ padding: 16, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-primary btn-lg" onClick={handleGenerate}>
                <Calculator size={16} /> Generate Payroll
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && payroll && (
          <>
            {/* Summary Strip */}
            <div className="payroll-summary-strip">
              {[
                ['Employees', String(payroll.totalEmployees)],
                ['Gross Salary', formatCurrency(payroll.totalGrossSalary)],
                ['Net Payment', formatCurrency(payroll.totalNetPayment)],
                ['PF (Emp+Er)', formatCurrency(payroll.totalPFEmployee + payroll.totalPFEmployer)],
                ['ESI (Emp+Er)', formatCurrency(payroll.totalESIEmployee + payroll.totalESIEmployer)],
                ['PT', formatCurrency(payroll.totalPT)],
              ].map(([label, value]) => (
                <div className="pss-item" key={label}>
                  <label>{label}</label>
                  <div className="pss-value">{value}</div>
                </div>
              ))}
            </div>

            {/* Payroll Table */}
            <div className="card">
              <div className="card-header">
                <h3>Payroll Details — {payroll.monthName} {payroll.year}</h3>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div className="table-container" style={{ maxHeight: 500 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>#</th><th>Code</th><th>Name</th><th>LWP</th>
                        <th>Basic</th><th>Bonus</th><th>Conveyance</th><th>Other</th>
                        <th>TA</th><th>Gross</th>
                        <th>PF</th><th>ESI</th><th>PT</th><th>TDS</th>
                        <th>Net Amt</th><th>Due Next</th><th>Net Pay</th>
                        <th>Payslip</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payroll.records.map((r) => (
                        <tr key={r.empCode}>
                          <td>{r.sNo}</td>
                          <td style={{ fontWeight: 600 }}>{r.empCode}</td>
                          <td>{r.name}</td>
                          <td className="amount">{r.lwpDays}</td>
                          <td className="amount">{formatNumber(r.earnings.basic)}</td>
                          <td className="amount">{formatNumber(r.earnings.bonus)}</td>
                          <td className="amount">{formatNumber(r.earnings.conveyance)}</td>
                          <td className="amount">{formatNumber(r.earnings.otherAllowance)}</td>
                          <td className="amount">{formatNumber(r.earnings.travellingAllowance)}</td>
                          <td className="amount" style={{ fontWeight: 600 }}>{formatNumber(r.earnings.grossSalary)}</td>
                          <td className="amount" style={{ color: r.deductions.employeePF > 0 ? 'var(--danger-500)' : undefined }}>{r.deductions.employeePF > 0 ? formatNumber(r.deductions.employeePF) : '-'}</td>
                          <td className="amount">{r.deductions.employeeESI > 0 ? formatNumber(r.deductions.employeeESI) : '-'}</td>
                          <td className="amount">{r.deductions.professionalTax > 0 ? formatNumber(r.deductions.professionalTax) : '-'}</td>
                          <td className="amount">{r.deductions.tds > 0 ? formatNumber(r.deductions.tds) : '-'}</td>
                          <td className="amount" style={{ fontWeight: 600 }}>{formatNumber(r.netAmount)}</td>
                          <td className="amount">{formatNumber(r.deductions.dueInNextCycle)}</td>
                          <td className="amount" style={{ fontWeight: 700, color: 'var(--accent-600)' }}>{formatNumber(r.netPaymentForMonth)}</td>
                          <td>
                            <button className="btn btn-ghost btn-sm" onClick={() => generatePayslipPDF(r, month, year, settings.companyName)} title="Download Payslip">
                              <FileText size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {/* Totals */}
                      <tr className="totals-row">
                        <td colSpan={4}>TOTALS</td>
                        <td className="amount">{formatNumber(payroll.records.reduce((s, r) => s + r.earnings.basic, 0))}</td>
                        <td className="amount">{formatNumber(payroll.records.reduce((s, r) => s + r.earnings.bonus, 0))}</td>
                        <td className="amount">{formatNumber(payroll.records.reduce((s, r) => s + r.earnings.conveyance, 0))}</td>
                        <td className="amount">{formatNumber(payroll.records.reduce((s, r) => s + r.earnings.otherAllowance, 0))}</td>
                        <td className="amount">{formatNumber(payroll.records.reduce((s, r) => s + r.earnings.travellingAllowance, 0))}</td>
                        <td className="amount" style={{ fontWeight: 700 }}>{formatNumber(payroll.totalGrossSalary)}</td>
                        <td className="amount">{formatNumber(payroll.totalPFEmployee)}</td>
                        <td className="amount">{formatNumber(payroll.totalESIEmployee)}</td>
                        <td className="amount">{formatNumber(payroll.totalPT)}</td>
                        <td className="amount">{formatNumber(payroll.totalTDS)}</td>
                        <td className="amount" style={{ fontWeight: 700 }}>{formatNumber(payroll.records.reduce((s, r) => s + r.netAmount, 0))}</td>
                        <td className="amount">{formatNumber(payroll.records.reduce((s, r) => s + r.deductions.dueInNextCycle, 0))}</td>
                        <td className="amount" style={{ fontWeight: 700, color: 'var(--accent-600)' }}>{formatNumber(payroll.totalNetPayment)}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
