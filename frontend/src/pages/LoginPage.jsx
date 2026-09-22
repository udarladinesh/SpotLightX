import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Sparkles, AlertCircle, RefreshCw, KeyRound, User } from 'lucide-react';

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login, isAuthenticated, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/profile';

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim() || !password) {
      setErrorMsg('Please enter both your email/username and password.');
      return;
    }

    setSubmitting(true);
    const result = await login({ identifier: identifier.trim(), password });
    setSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setErrorMsg(result.error || 'Invalid email/username or password.');
    }
  };

  return (
    <div className="auth-page-container">
      <div className="glass-card auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-icon-badge">
            <Sparkles size={24} color="#8b5cf6" />
          </div>
          <h1 className="auth-title">Welcome Back to Spotly</h1>
          <p className="auth-subtitle">
            Sign in to access your creator dashboard and talent portfolio.
          </p>
        </div>

        {/* Error Alert */}
        {(errorMsg || authError) && (
          <div className="auth-alert error">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg || authError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="identifier">
              Email or Username
            </label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input
                id="identifier"
                type="text"
                className="form-input"
                placeholder="e.g. dancer_maya or maya@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                disabled={submitting}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div className="input-wrapper">
              <KeyRound size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={submitting}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <RefreshCw size={16} className="spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn size={16} />
                <span>Sign In to Spotly</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          <span>New to Spotly?</span>
          <Link to="/register" className="auth-link">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
