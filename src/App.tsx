import { useState, useCallback } from 'react';
import './index.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import EmployeeMaster from './components/EmployeeMaster';
import AttendanceUpload from './components/AttendanceUpload';
import PayrollGeneration from './components/PayrollGeneration';
import Settings from './components/Settings';
import Toast, { ToastMessage } from './components/Toast';

export type PageId = 'dashboard' | 'employees' | 'attendance' | 'payroll' | 'settings';

function AuthenticatedApp() {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard onNavigate={setActivePage} addToast={addToast} />;
      case 'employees':
        return <EmployeeMaster addToast={addToast} />;
      case 'attendance':
        return <AttendanceUpload addToast={addToast} onNavigate={setActivePage} />;
      case 'payroll':
        return <PayrollGeneration addToast={addToast} />;
      case 'settings':
        return <Settings addToast={addToast} />;
      default:
        return <Dashboard onNavigate={setActivePage} addToast={addToast} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="main-content">
        {renderPage()}
      </main>
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

function AppGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
}

export default App;
