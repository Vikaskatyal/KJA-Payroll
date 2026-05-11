import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

type AuthMode = 'login' | 'signup' | 'forgot';

export default function LoginPage() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const result = await signIn(email, password);
        if (result.error) setError(result.error);
      } else if (mode === 'signup') {
        const result = await signUp(email, password);
        if (result.error) {
          setError(result.error);
        } else {
          setSuccess('Account created! Please check your email to verify your account.');
          setMode('login');
        }
      } else if (mode === 'forgot') {
        const result = await resetPassword(email);
        if (result.error) {
          setError(result.error);
        } else {
          setSuccess('Password reset email sent. Check your inbox.');
          setMode('login');
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left side - Branding */}
        <div className="login-branding">
          <div className="login-brand-content">
            <div className="login-logo-icon">KJA</div>
            <h1>KJA Client</h1>
            <p className="login-brand-subtitle">Payroll Management</p>
            <div className="login-brand-divider" />
            <p className="login-brand-description">
              Manage employees, generate payroll, and download payslips — all in one place.
            </p>
            <div className="login-brand-features">
              <div className="login-feature">
                <span className="login-feature-icon">👥</span>
                <span>Employee Master Management</span>
              </div>
              <div className="login-feature">
                <span className="login-feature-icon">📊</span>
                <span>Attendance Upload & Tracking</span>
              </div>
              <div className="login-feature">
                <span className="login-feature-icon">💰</span>
                <span>Automated Payroll Generation</span>
              </div>
              <div className="login-feature">
                <span className="login-feature-icon">📄</span>
                <span>PDF Payslips & Excel Reports</span>
              </div>
            </div>
          </div>
          <div className="login-brand-footer">
            Powered by <strong>Savika Consultancy Services Pvt. Ltd.</strong>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="login-form-section">
          <div className="login-form-wrapper">
            <h2>
              {mode === 'login' && 'Welcome back'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'forgot' && 'Reset password'}
            </h2>
            <p className="login-form-subtitle">
              {mode === 'login' && 'Sign in to access your payroll dashboard'}
              {mode === 'signup' && 'Get started with KJA Client Payroll'}
              {mode === 'forgot' && 'Enter your email and we\'ll send a reset link'}
            </p>

            {error && (
              <div className="login-alert login-alert-error">
                <span>⚠</span> {error}
              </div>
            )}

            {success && (
              <div className="login-alert login-alert-success">
                <span>✓</span> {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="login-field">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                />
              </div>

              {mode !== 'forgot' && (
                <div className="login-field">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                </div>
              )}

              {mode === 'login' && (
                <div className="login-forgot-link">
                  <button
                    type="button"
                    className="login-text-btn"
                    onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button type="submit" className="login-submit-btn" disabled={loading}>
                {loading ? (
                  <span className="login-spinner" />
                ) : (
                  <>
                    {mode === 'login' && 'Sign In'}
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'forgot' && 'Send Reset Link'}
                  </>
                )}
              </button>
            </form>

            <div className="login-switch">
              {mode === 'login' ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className="login-text-btn"
                    onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="login-text-btn"
                    onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
