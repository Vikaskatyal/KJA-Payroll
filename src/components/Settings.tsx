import { useState } from 'react';
import { Save } from 'lucide-react';
import { loadSettings, saveSettings, AppSettings } from '../utils/storage';
import { INDIAN_STATES } from '../types/employee';
import { PF_RATE_EMPLOYEE, PF_BASIC_LIMIT, ESI_RATE_EMPLOYEE, ESI_RATE_EMPLOYER, ESI_GROSS_LIMIT } from '../utils/constants';

interface Props {
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function Settings({ addToast }: Props) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings());

  const handleSave = () => {
    saveSettings(settings);
    addToast('Settings saved', 'success');
  };

  return (
    <>
      <header className="main-header">
        <h2>Settings</h2>
        <div className="main-header-actions">
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={16} /> Save Settings
          </button>
        </div>
      </header>

      <div className="main-body">
        {/* Company Info */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h3>Company Information</h3></div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input className="form-input" value={settings.companyName} onChange={(e) => setSettings({ ...settings, companyName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Company Address</label>
                <input className="form-input" value={settings.companyAddress} onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Default State</label>
                <select className="form-select" value={settings.defaultState} onChange={(e) => setSettings({ ...settings, defaultState: e.target.value })}>
                  {INDIAN_STATES.map((s) => <option key={s.code} value={s.name}>{s.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Statutory Rates Reference */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h3>Statutory Rates (Reference)</h3></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              {/* PF */}
              <div style={{ padding: 16, background: 'var(--gray-50)', borderRadius: 8 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Provident Fund (PF)</h4>
                <div style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.8 }}>
                  <div>Employee Contribution: <strong>{(PF_RATE_EMPLOYEE * 100)}%</strong> of Basic</div>
                  <div>Employer Contribution: <strong>{(PF_RATE_EMPLOYEE * 100)}%</strong> of Basic</div>
                  <div>Basic Limit: <strong>₹{PF_BASIC_LIMIT.toLocaleString()}</strong></div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>PF applicable per employee setting</div>
                </div>
              </div>
              {/* ESI */}
              <div style={{ padding: 16, background: 'var(--gray-50)', borderRadius: 8 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Employee State Insurance (ESI)</h4>
                <div style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.8 }}>
                  <div>Employee Contribution: <strong>{(ESI_RATE_EMPLOYEE * 100)}%</strong></div>
                  <div>Employer Contribution: <strong>{(ESI_RATE_EMPLOYER * 100)}%</strong></div>
                  <div>Gross Limit: <strong>₹{ESI_GROSS_LIMIT.toLocaleString()}</strong></div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>Auto-applied when gross ≤ limit</div>
                </div>
              </div>
              {/* PT */}
              <div style={{ padding: 16, background: 'var(--gray-50)', borderRadius: 8 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Professional Tax Slabs</h4>
                <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                  {INDIAN_STATES.filter((s) => s.name === settings.defaultState).map((state) => (
                    <div key={state.code}>
                      <strong>{state.name}</strong>
                      {state.ptSlabs.map((slab, i) => (
                        <div key={i} style={{ marginTop: 4 }}>
                          ₹{slab.minSalary.toLocaleString()} – ₹{slab.maxSalary > 999999 ? '∞' : slab.maxSalary.toLocaleString()}: <strong>₹{slab.tax}</strong>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              {/* Due Cycle */}
              <div style={{ padding: 16, background: 'var(--gray-50)', borderRadius: 8 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Due in Next Cycle</h4>
                <div style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.8 }}>
                  <div>Formula: <strong>Basic ÷ 3</strong></div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>Held amount released in next month's payment</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="card">
          <div className="card-header"><h3>Data Management</h3></div>
          <div className="card-body">
            <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16 }}>
              All data is stored locally in your browser. Export your data before clearing the browser cache.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline btn-sm" onClick={() => {
                const data = {
                  employees: localStorage.getItem('payroll_employees'),
                  history: localStorage.getItem('payroll_history'),
                  settings: localStorage.getItem('payroll_settings'),
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `payroll_backup_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                addToast('Data exported', 'success');
              }}>
                Export All Data
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    try {
                      const data = JSON.parse(ev.target?.result as string);
                      if (data.employees) localStorage.setItem('payroll_employees', data.employees);
                      if (data.history) localStorage.setItem('payroll_history', data.history);
                      if (data.settings) localStorage.setItem('payroll_settings', data.settings);
                      addToast('Data imported. Please refresh.', 'success');
                    } catch { addToast('Invalid backup file', 'error'); }
                  };
                  reader.readAsText(file);
                };
                input.click();
              }}>
                Import Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
