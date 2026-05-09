import { useState, useRef } from 'react';
import { Plus, Upload, Download, Search, Edit2, Trash2, X, Users } from 'lucide-react';
import { Employee, INDIAN_STATES, DEFAULT_LOCATIONS } from '../types/employee';
import { loadEmployees, saveEmployees, generateId } from '../utils/storage';
import { formatCurrency, formatNumber } from '../utils/constants';
import { parseEmployeeMasterExcel, generateEmployeeTemplate } from '../utils/excelParser';

interface Props {
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function EmployeeMaster({ addToast }: Props) {
  const [employees, setEmployees] = useState<Employee[]>(loadEmployees());
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.empCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = (emp: Employee) => {
    let updated: Employee[];
    if (editingEmployee) {
      updated = employees.map((e) => (e.id === emp.id ? emp : e));
    } else {
      updated = [...employees, emp];
    }
    setEmployees(updated);
    saveEmployees(updated);
    setShowModal(false);
    setEditingEmployee(null);
    addToast(editingEmployee ? 'Employee updated' : 'Employee added', 'success');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this employee?')) return;
    const updated = employees.filter((e) => e.id !== id);
    setEmployees(updated);
    saveEmployees(updated);
    addToast('Employee deleted', 'info');
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await parseEmployeeMasterExcel(file);
      const merged = [...employees];
      let added = 0;
      let updated = 0;
      imported.forEach((imp) => {
        const existing = merged.findIndex((m) => m.empCode === imp.empCode);
        if (existing >= 0) {
          merged[existing] = { ...merged[existing], ...imp, id: merged[existing].id };
          updated++;
        } else {
          merged.push(imp);
          added++;
        }
      });
      setEmployees(merged);
      saveEmployees(merged);
      addToast(`Imported: ${added} added, ${updated} updated`, 'success');
    } catch (err) {
      addToast(`Import failed: ${(err as Error).message}`, 'error');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <>
      <header className="main-header">
        <h2>Employee Master</h2>
        <div className="main-header-actions">
          <button className="btn btn-outline btn-sm" onClick={generateEmployeeTemplate}>
            <Download size={14} /> Template
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>
            <Upload size={14} /> Import Excel
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={handleBulkUpload} />
          <button className="btn btn-primary" onClick={() => { setEditingEmployee(null); setShowModal(true); }}>
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </header>

      <div className="main-body">
        {/* Search */}
        <div className="search-input-wrapper" style={{ maxWidth: 360, marginBottom: 20 }}>
          <Search />
          <input className="form-input" placeholder="Search by name, code, or location..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="card">
            <div className="card-body">
              <div className="empty-state">
                <Users size={48} />
                <h3>No employees found</h3>
                <p>Add employees manually or import from Excel to get started.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Emp Code</th>
                      <th>Name</th>
                      <th>Location</th>
                      <th>Basic</th>
                      <th>Gross Salary</th>
                      <th>PF</th>
                      <th>ESI</th>
                      <th>State</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((emp) => (
                      <tr key={emp.id}>
                        <td style={{ fontWeight: 600 }}>{emp.empCode}</td>
                        <td>{emp.name}</td>
                        <td>{emp.location}</td>
                        <td className="amount">{formatNumber(emp.salaryComponents.basic)}</td>
                        <td className="amount">{formatCurrency(emp.grossSalary)}</td>
                        <td>
                          <span className={`badge ${emp.pfApplicable ? 'badge-success' : 'badge-gray'}`}>
                            {emp.pfApplicable ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${emp.esiApplicable ? 'badge-success' : 'badge-gray'}`}>
                            {emp.esiApplicable ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td>{emp.state}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditingEmployee(emp); setShowModal(true); }}>
                            <Edit2 size={14} />
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(emp.id)} style={{ color: 'var(--danger-500)' }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <EmployeeModal
          employee={editingEmployee}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingEmployee(null); }}
        />
      )}
    </>
  );
}

// ===== Employee Add/Edit Modal =====
function EmployeeModal({ employee, onSave, onClose }: {
  employee: Employee | null;
  onSave: (emp: Employee) => void;
  onClose: () => void;
}) {
  const isEdit = !!employee;
  const [form, setForm] = useState({
    empCode: employee?.empCode || '',
    name: employee?.name || '',
    location: employee?.location || DEFAULT_LOCATIONS[0],
    department: employee?.department || '',
    designation: employee?.designation || '',
    dateOfJoining: employee?.dateOfJoining || '',
    bankAccountNo: employee?.bankAccountNo || '',
    pfApplicable: employee?.pfApplicable || false,
    uan: employee?.uan || '',
    tdsApplicable: employee?.tdsApplicable || false,
    tdsAmount: employee?.tdsAmount || 0,
    state: employee?.state || 'Chhattisgarh',
    basic: employee?.salaryComponents.basic || 0,
    bonus: employee?.salaryComponents.bonus || 0,
    hra: employee?.salaryComponents.hra || 0,
    specialAllowance: employee?.salaryComponents.specialAllowance || 0,
    conveyance: employee?.salaryComponents.conveyance || 0,
    medicalAllowance: employee?.salaryComponents.medicalAllowance || 0,
    otherAllowance: employee?.salaryComponents.otherAllowance || 0,
    travellingAllowancePerDay: employee?.salaryComponents.travellingAllowancePerDay || 0,
  });

  const grossSalary = form.basic + form.bonus + form.hra + form.specialAllowance + form.conveyance + form.medicalAllowance + form.otherAllowance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empCode || !form.name) return;

    const emp: Employee = {
      id: employee?.id || generateId(),
      empCode: form.empCode,
      name: form.name,
      location: form.location,
      department: form.department,
      designation: form.designation,
      dateOfJoining: form.dateOfJoining,
      bankAccountNo: form.bankAccountNo,
      pfApplicable: form.pfApplicable,
      uan: form.uan,
      tdsApplicable: form.tdsApplicable,
      tdsAmount: form.tdsAmount,
      esiApplicable: grossSalary <= 21000,
      salaryComponents: {
        basic: form.basic,
        bonus: form.bonus,
        hra: form.hra,
        specialAllowance: form.specialAllowance,
        conveyance: form.conveyance,
        medicalAllowance: form.medicalAllowance,
        otherAllowance: form.otherAllowance,
        travellingAllowancePerDay: form.travellingAllowancePerDay,
      },
      grossSalary,
      isActive: true,
      state: form.state,
    };
    onSave(emp);
  };

  const set = (field: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 'min(95vw, 780px)' }}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Employee' : 'Add New Employee'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Personal Info */}
            <div className="form-section-title">Employee Information</div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Employee Code *</label>
                <input className="form-input" value={form.empCode} onChange={(e) => set('empCode', e.target.value)} placeholder="KG0001" required />
              </div>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Employee Name" required />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <select className="form-select" value={form.location} onChange={(e) => set('location', e.target.value)}>
                  {DEFAULT_LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">State (for PT)</label>
                <select className="form-select" value={form.state} onChange={(e) => set('state', e.target.value)}>
                  {INDIAN_STATES.map((s) => <option key={s.code} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date of Joining</label>
                <input className="form-input" type="date" value={form.dateOfJoining} onChange={(e) => set('dateOfJoining', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Bank Account No.</label>
                <input className="form-input" value={form.bankAccountNo} onChange={(e) => set('bankAccountNo', e.target.value)} placeholder="Account Number" />
              </div>
            </div>

            {/* Statutory */}
            <div className="form-section-title">Statutory Compliance</div>
            <div className="form-grid">
              <div className="form-group">
                <div className="form-checkbox-group">
                  <input type="checkbox" id="pf" checked={form.pfApplicable} onChange={(e) => set('pfApplicable', e.target.checked)} />
                  <label htmlFor="pf">PF Applicable</label>
                </div>
                {form.pfApplicable && (
                  <div style={{ marginTop: 8 }}>
                    <label className="form-label">UAN</label>
                    <input className="form-input" value={form.uan} onChange={(e) => set('uan', e.target.value)} placeholder="UAN Number" />
                  </div>
                )}
              </div>
              <div className="form-group">
                <div className="form-checkbox-group">
                  <input type="checkbox" id="tds" checked={form.tdsApplicable} onChange={(e) => set('tdsApplicable', e.target.checked)} />
                  <label htmlFor="tds">TDS Applicable</label>
                </div>
                {form.tdsApplicable && (
                  <div style={{ marginTop: 8 }}>
                    <label className="form-label">TDS Amount (per month)</label>
                    <input className="form-input" type="number" value={form.tdsAmount || ''} onChange={(e) => set('tdsAmount', Number(e.target.value))} />
                  </div>
                )}
              </div>
            </div>

            {/* Salary Components */}
            <div className="form-section-title">
              Salary Components
              <span style={{ float: 'right', fontSize: 14, color: 'var(--accent-600)', fontWeight: 700 }}>
                Gross: {formatCurrency(grossSalary)}
              </span>
            </div>
            <div className="form-grid">
              {[
                ['basic', 'Basic'],
                ['bonus', 'Bonus'],
                ['hra', 'HRA'],
                ['specialAllowance', 'Special Allowance'],
                ['conveyance', 'Conveyance'],
                ['medicalAllowance', 'Medical Allowance'],
                ['otherAllowance', 'Other Allowance'],
                ['travellingAllowancePerDay', 'TA Per Day'],
              ].map(([field, label]) => (
                <div className="form-group" key={field}>
                  <label className="form-label">{label}</label>
                  <input
                    className="form-input" type="number"
                    value={(form as Record<string, unknown>)[field] as number || ''}
                    onChange={(e) => set(field, Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>

            {grossSalary <= 21000 && (
              <div style={{ padding: '10px 14px', background: '#ecfdf5', borderRadius: 8, fontSize: 13, color: '#059669', marginTop: 12 }}>
                ✓ ESI applicable (Gross ≤ ₹21,000)
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{isEdit ? 'Update' : 'Add Employee'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
