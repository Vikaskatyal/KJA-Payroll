import { Users, Calculator, FileSpreadsheet, TrendingUp, ArrowRight } from 'lucide-react';
import { loadEmployees } from '../utils/storage';
import { loadPayrollHistory } from '../utils/storage';
import { formatCurrency } from '../utils/constants';
import type { PageId } from '../App';

interface DashboardProps {
  onNavigate: (page: PageId) => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const employees = loadEmployees();
  const history = loadPayrollHistory();
  const activeEmployees = employees.filter((e) => e.isActive);
  const lastPayroll = history.length > 0 ? history[history.length - 1] : null;

  return (
    <>
      <header className="main-header">
        <h2>Dashboard</h2>
        <div className="main-header-actions">
          <button className="btn btn-primary" onClick={() => onNavigate('payroll')}>
            <Calculator size={16} /> Generate Payroll
          </button>
        </div>
      </header>

      <div className="main-body">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card" onClick={() => onNavigate('employees')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon blue"><Users size={22} /></div>
            <div className="stat-info">
              <h4>Total Employees</h4>
              <div className="stat-value">{activeEmployees.length}</div>
              <div className="stat-sub">{employees.length - activeEmployees.length} inactive</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green"><TrendingUp size={22} /></div>
            <div className="stat-info">
              <h4>PF Applicable</h4>
              <div className="stat-value">{activeEmployees.filter((e) => e.pfApplicable).length}</div>
              <div className="stat-sub">employees</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange"><FileSpreadsheet size={22} /></div>
            <div className="stat-info">
              <h4>ESI Applicable</h4>
              <div className="stat-value">{activeEmployees.filter((e) => e.esiApplicable).length}</div>
              <div className="stat-sub">gross ≤ ₹21,000</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple"><Calculator size={22} /></div>
            <div className="stat-info">
              <h4>Last Payroll</h4>
              <div className="stat-value">
                {lastPayroll ? formatCurrency(lastPayroll.totalNetPayment) : '—'}
              </div>
              <div className="stat-sub">{lastPayroll ? lastPayroll.monthName + ' ' + lastPayroll.totalEmployees + ' emp' : 'No payroll generated'}</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              <QuickAction
                icon={<Users size={20} />}
                title="Add Employee"
                desc="Register new employee with salary structure"
                onClick={() => onNavigate('employees')}
                color="var(--primary-600)"
              />
              <QuickAction
                icon={<FileSpreadsheet size={20} />}
                title="Upload Attendance"
                desc="Upload monthly attendance Excel sheet"
                onClick={() => onNavigate('attendance')}
                color="var(--accent-600)"
              />
              <QuickAction
                icon={<Calculator size={20} />}
                title="Generate Payroll"
                desc="Process and download payroll output"
                onClick={() => onNavigate('payroll')}
                color="var(--warning-500)"
              />
            </div>
          </div>
        </div>

        {/* Recent Payroll History */}
        <div className="card">
          <div className="card-header">
            <h3>Payroll History</h3>
          </div>
          <div className="card-body">
            {history.length === 0 ? (
              <div className="empty-state">
                <Calculator size={48} />
                <h3>No payroll generated yet</h3>
                <p>Upload attendance data and generate your first payroll to see it here.</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Employees</th>
                      <th>Net Payment</th>
                      <th>Status</th>
                      <th>Generated On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...history].reverse().slice(0, 6).map((h) => (
                      <tr key={h.id}>
                        <td style={{ fontWeight: 600 }}>{h.monthName} {h.year}</td>
                        <td>{h.totalEmployees}</td>
                        <td className="amount">{formatCurrency(h.totalNetPayment)}</td>
                        <td>
                          <span className={`badge ${h.status === 'finalized' ? 'badge-success' : 'badge-warning'}`}>
                            {h.status === 'finalized' ? 'Finalized' : 'Draft'}
                          </span>
                        </td>
                        <td>{h.generatedOn}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function QuickAction({ icon, title, desc, onClick, color }: {
  icon: React.ReactNode; title: string; desc: string;
  onClick: () => void; color: string;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '16px 20px', borderRadius: 'var(--border-radius-sm)',
        border: '1px solid var(--gray-200)', cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = color;
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 12px ${color}15`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--gray-200)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}12`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-800)' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{desc}</div>
      </div>
      <ArrowRight size={16} color="var(--gray-400)" />
    </div>
  );
}
