import { LayoutDashboard, Users, FileSpreadsheet, Calculator, Settings, LogOut } from 'lucide-react';
import type { PageId } from '../App';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

const navItems: { id: PageId; label: string; icon: React.ReactNode; section?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard />, section: 'OVERVIEW' },
  { id: 'employees', label: 'Employee Master', icon: <Users />, section: 'MANAGE' },
  { id: 'attendance', label: 'Attendance Upload', icon: <FileSpreadsheet /> },
  { id: 'payroll', label: 'Payroll Generation', icon: <Calculator /> },
  { id: 'settings', label: 'Settings', icon: <Settings />, section: 'SYSTEM' },
];

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { user, signOut } = useAuth();
  let lastSection = '';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">KJA</div>
          <div className="sidebar-logo-text">
            <h1>KJA Client</h1>
            <p>Payroll Management</p>
          </div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const showSection = item.section && item.section !== lastSection;
          if (item.section) lastSection = item.section;
          return (
            <div key={item.id}>
              {showSection && (
                <div className="sidebar-section-label">{item.section}</div>
              )}
              <button
                className={`sidebar-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                {item.icon}
                {item.label}
              </button>
            </div>
          );
        })}
      </nav>

      {/* User info + Logout */}
      {user && (
        <div style={{ padding: '0 10px 8px' }}>
          <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email}
          </div>
          <button className="sidebar-logout-btn" onClick={signOut}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      )}

      <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>
          Powered by
        </div>
        <div style={{ fontSize: 13, color: 'white', fontWeight: 600, marginTop: 4 }}>
          Savika Consultancy Services Pvt. Ltd.
        </div>
      </div>
    </aside>
  );
}
