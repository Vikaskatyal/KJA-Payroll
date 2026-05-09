import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Download, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { AttendanceSheet, AttendanceRecord } from '../types/attendance';
import { parseAttendanceExcel, generateAttendanceTemplate } from '../utils/excelParser';
import { loadEmployees } from '../utils/storage';
import { MONTHS, formatNumber, getCalendarDays } from '../utils/constants';
import type { PageId } from '../App';

interface Props {
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onNavigate: (page: PageId) => void;
}

export default function AttendanceUpload({ addToast, onNavigate }: Props) {
  const [attendance, setAttendance] = useState<AttendanceSheet | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const fileRef = useRef<HTMLInputElement>(null);

  const employees = loadEmployees();

  const handleFile = async (file: File) => {
    setLoading(true);
    try {
      const parsed = await parseAttendanceExcel(file);
      // Override with selected month/year
      parsed.month = month;
      parsed.year = year;
      parsed.totalCalendarDays = getCalendarDays(month, year);
      setAttendance(parsed);

      // Check for unmatched employees
      const unmatchedCount = parsed.records.filter(
        (r) => !employees.find((e) => e.empCode === r.empCode)
      ).length;

      if (unmatchedCount > 0) {
        addToast(`${unmatchedCount} employee(s) not found in master. Please add them first.`, 'error');
      } else {
        addToast(`Parsed ${parsed.records.length} attendance records for ${MONTHS[month - 1]} ${year}`, 'success');
      }

      // Store in sessionStorage for payroll generation
      sessionStorage.setItem('current_attendance', JSON.stringify(parsed));
    } catch (err) {
      addToast(`Failed to parse: ${(err as Error).message}`, 'error');
    }
    setLoading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const getMatchStatus = (record: AttendanceRecord) => {
    return employees.find((e) => e.empCode === record.empCode);
  };

  return (
    <>
      <header className="main-header">
        <h2>Attendance Upload</h2>
        <div className="main-header-actions">
          <button className="btn btn-outline btn-sm" onClick={() => generateAttendanceTemplate(month, year)}>
            <Download size={14} /> Download Template
          </button>
          {attendance && (
            <button className="btn btn-primary" onClick={() => onNavigate('payroll')}>
              Generate Payroll <ArrowRight size={14} />
            </button>
          )}
        </div>
      </header>

      <div className="main-body">
        {/* Month/Year Selection */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Month</label>
                <select className="form-select" value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ width: 160 }}>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Year</label>
                <select className="form-select" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ width: 120 }}>
                  {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', paddingBottom: 10 }}>
                Calendar Days: <strong>{getCalendarDays(month, year)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Zone */}
        {!attendance && (
          <div
            className={`upload-zone ${isDragging ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <div className="upload-zone-icon">
              {loading ? (
                <div style={{ width: 24, height: 24, border: '3px solid var(--primary-200)', borderTopColor: 'var(--primary-600)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              ) : (
                <Upload size={24} />
              )}
            </div>
            <h4>{loading ? 'Processing...' : 'Upload Attendance Excel'}</h4>
            <p>
              Drag and drop your attendance file here, or{' '}
              <span className="browse-link">browse</span>
            </p>
            <p style={{ marginTop: 8, fontSize: 12, color: 'var(--gray-400)' }}>
              Supports .xlsx, .xls files
            </p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden onChange={handleFileInput} />
          </div>
        )}

        {/* Parsed Data Preview */}
        {attendance && (
          <div className="card">
            <div className="card-header">
              <h3>
                <FileSpreadsheet size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Attendance Data — {MONTHS[attendance.month - 1]} {attendance.year}
                <span className="badge badge-info" style={{ marginLeft: 12 }}>{attendance.records.length} records</span>
              </h3>
              <button className="btn btn-outline btn-sm" onClick={() => { setAttendance(null); sessionStorage.removeItem('current_attendance'); }}>
                Re-upload
              </button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-container" style={{ maxHeight: 500 }}>
                <table>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Emp Code</th>
                      <th>Name</th>
                      <th>Location</th>
                      <th>Salary</th>
                      <th>Remarks</th>
                      <th>LWP</th>
                      <th>TA Days</th>
                      <th>TA/Day</th>
                      <th>OT Hrs</th>
                      <th>OT×2</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.records.map((rec, idx) => {
                      const matched = getMatchStatus(rec);
                      return (
                        <tr key={idx} style={!matched ? { background: '#fef2f2' } : undefined}>
                          <td>{rec.sNo}</td>
                          <td style={{ fontWeight: 600 }}>{rec.empCode}</td>
                          <td>{rec.name}</td>
                          <td>{rec.location}</td>
                          <td className="amount">{formatNumber(rec.salary)}</td>
                          <td>
                            <span className={`badge ${rec.remarks.toLowerCase().includes('full') ? 'badge-success' : 'badge-warning'}`}>
                              {rec.remarks || 'N/A'}
                            </span>
                          </td>
                          <td className="amount">{rec.lwpDays}</td>
                          <td className="amount">{rec.workingDaysForTA}</td>
                          <td className="amount">{formatNumber(rec.travellingCostPerDay)}</td>
                          <td className="amount">{rec.overtimeHoursRegular}</td>
                          <td className="amount">{rec.overtimeHoursDouble}</td>
                          <td>
                            {matched ? (
                              <span style={{ color: 'var(--accent-600)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <CheckCircle size={14} /> Matched
                              </span>
                            ) : (
                              <span style={{ color: 'var(--danger-500)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <AlertTriangle size={14} /> Not Found
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
