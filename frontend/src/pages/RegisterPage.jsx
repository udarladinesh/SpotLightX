import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  UserPlus, 
  Sparkles, 
  AlertCircle, 
  RefreshCw, 
  User, 
  Mail, 
  KeyRound, 
  AtSign,
  Check,
  Tag
} from 'lucide-react';

const TALENT_CATEGORIES = [
  'Dance & Movement',
  'Singing & Vocals',
  'Acting & Drama',
  'Choreography',
  'Art & Design',
  'Music & Production',
  'Photography & Film',
  'Public Speaking',
  'Tech & Programming',
  'Creative Performance'
];

const RegisterPage = () => {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const { register, isAuthenticated, authError } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const toggleCategory = (cat) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    // Frontend validations
    if (!displayName.trim() || !username.trim() || !email.trim() || !password) {
      setValidationError('Please fill in all required fields.');
      return;
    }

    if (displayName.trim().length < 2) {
      setValidationError('Display name must be at least 2 characters.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      setValidationError('Username must be between 3 and 30 characters.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setValidationError('Username can only contain letters, numbers, and underscores.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const result = await register({
      displayName: displayName.trim(),
      username: cleanUsername,
      email: email.trim().toLowerCase(),
      password,
      confirmPassword,
      categories: selectedCategories
    });
    setSubmitting(false);

    if (result.success) {
      navigate('/profile', { replace: true });
    } else {
      setValidationError(result.error || 'Registration failed. Please check your details.');
    }
  };

  return (
    <div className="auth-page-container">
      <div className="glass-card auth-card" style={{ maxWidth: '540px' }}>
        {/* Header */}
        <div className="auth-header">
          <div className="auth-icon-badge">
            <Sparkles size={24} color="#8b5cf6" />
          </div>
          <h1 className="auth-title">Join Spotly</h1>
          <p className="auth-subtitle">
            Showcase your skills, build your creator portfolio, and get discovered.
          </p>
        </div>

        {/* Validation / Auth Error Alert */}
        {(validationError || authError) && (
          <div className="auth-alert error">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{validationError || authError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Display Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="displayName">
              Full Name or Stage Name <span style={{ color: 'var(--accent-pink)' }}>*</span>
            </label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input
                id="displayName"
                type="text"
                className="form-input"
                placeholder="e.g. Maya Chen"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
          </div>

          {/* Username */}
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username <span style={{ color: 'var(--accent-pink)' }}>*</span>
            </label>
            <div className="input-wrapper">
              <AtSign size={18} className="input-icon" />
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="e.g. maya_dances"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
            <span className="form-hint">Unique handle, 3-30 chars, letters/numbers/underscores only.</span>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address <span style={{ color: 'var(--accent-pink)' }}>*</span>
            </label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
          </div>

          {/* Password & Confirm */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label" htmlFor="password">
                Password <span style={{ color: 'var(--accent-pink)' }}>*</span>
              </label>
              <div className="input-wrapper">
                <KeyRound size={18} className="input-icon" />
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="Min 6 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label" htmlFor="confirmPassword">
                Confirm Password <span style={{ color: 'var(--accent-pink)' }}>*</span>
              </label>
              <div className="input-wrapper">
                <KeyRound size={18} className="input-icon" />
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-input"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
            </div>
          </div>

          {/* Primary Talent Categories Selection */}
          <div className="form-group">
            <label className="form-label">
              <Tag size={14} style={{ marginRight: '5px', verticalAlign: '-1px' }} />
              Select Your Creative Disciplines (Optional)
            </label>
            <div className="chips-container">
              {TALENT_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`chip-btn ${isSelected ? 'active' : ''}`}
                  >
                    {isSelected && <Check size={13} />}
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
            style={{ marginTop: '8px' }}
          >
            {submitting ? (
              <>
                <RefreshCw size={16} className="spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <UserPlus size={16} />
                <span>Create Spotly Account</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link to="/login" className="auth-link">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
