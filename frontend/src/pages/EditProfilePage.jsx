import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOwnProfile, updateOwnProfile } from '../services/userService';
import { 
  Save, 
  ArrowLeft, 
  Sparkles, 
  Check, 
  X, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  User, 
  MapPin, 
  Globe, 
  Instagram, 
  Youtube, 
  Github, 
  Twitter, 
  Lock, 
  Tag, 
  Image as ImageIcon 
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

const EditProfilePage = () => {
  const { user: authUser, updateUser } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(authUser?.displayName || '');
  const [bio, setBio] = useState(authUser?.bio || '');
  const [location, setLocation] = useState(authUser?.location || '');
  const [profileImage, setProfileImage] = useState(authUser?.profileImage || '');
  const [categories, setCategories] = useState(authUser?.categories || []);
  const [skills, setSkills] = useState(authUser?.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [socialLinks, setSocialLinks] = useState({
    website: authUser?.socialLinks?.website || '',
    instagram: authUser?.socialLinks?.instagram || '',
    youtube: authUser?.socialLinks?.youtube || '',
    github: authUser?.socialLinks?.github || '',
    twitter: authUser?.socialLinks?.twitter || ''
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch freshest profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getOwnProfile();
        if (data?.user) {
          const u = data.user;
          setDisplayName(u.displayName || '');
          setBio(u.bio || '');
          setLocation(u.location || '');
          setProfileImage(u.profileImage || '');
          setCategories(u.categories || []);
          setSkills(u.skills || []);
          setSocialLinks({
            website: u.socialLinks?.website || '',
            instagram: u.socialLinks?.instagram || '',
            youtube: u.socialLinks?.youtube || '',
            github: u.socialLinks?.github || '',
            twitter: u.socialLinks?.twitter || ''
          });
        }
      } catch (err) {
        console.warn('Failed to load profile data:', err);
      }
    };
    loadProfile();
  }, []);

  const toggleCategory = (cat) => {
    if (categories.includes(cat)) {
      setCategories(categories.filter((c) => c !== cat));
    } else {
      setCategories([...categories, cat]);
    }
  };

  const handleAddSkill = (e) => {
    if (e) e.preventDefault();
    const trimmed = skillInput.trim();
    if (!trimmed) return;

    if (skills.length >= 20) {
      setErrorMsg('Maximum 20 skills allowed.');
      return;
    }

    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg('This skill is already added.');
      return;
    }

    setSkills([...skills, trimmed]);
    setSkillInput('');
    setErrorMsg('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!displayName.trim()) {
      setErrorMsg('Display name cannot be empty.');
      return;
    }

    if (displayName.trim().length < 2 || displayName.trim().length > 50) {
      setErrorMsg('Display name must be between 2 and 50 characters.');
      return;
    }

    if (bio.trim().length > 300) {
      setErrorMsg('Bio cannot exceed 300 characters.');
      return;
    }

    setSaving(true);
    try {
      const result = await updateOwnProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        location: location.trim(),
        profileImage: profileImage.trim(),
        categories,
        skills,
        socialLinks
      });

      if (result.success && result.user) {
        updateUser(result.user);
        setSuccessMsg('Your profile has been saved successfully!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          navigate('/profile');
        }, 1200);
      } else {
        setErrorMsg(result.message || 'Failed to update profile.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-page-container" style={{ padding: '40px 0 80px' }}>
      <div className="container" style={{ maxWidth: '780px' }}>
        {/* Navigation back */}
        <div style={{ marginBottom: '20px' }}>
          <Link to="/profile" className="btn btn-secondary btn-sm">
            <ArrowLeft size={14} />
            <span>Back to Profile</span>
          </Link>
        </div>

        <div className="glass-card" style={{ padding: '36px 30px' }}>
          {/* Header */}
          <div style={{ marginBottom: '28px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
            <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Edit Creator Profile</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
              Update your public creator info, specialties, talent categories, and social media handles.
            </p>
          </div>

          {/* Success / Error Alerts */}
          {successMsg && (
            <div className="auth-alert success" style={{ marginBottom: '20px' }}>
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="auth-alert error" style={{ marginBottom: '20px' }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Protected Username & Email Row (Immutable) */}
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">
                  <Lock size={12} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                  Username (Fixed)
                </label>
                <input
                  type="text"
                  className="form-input disabled-input"
                  value={`@${authUser?.username || ''}`}
                  disabled
                  readOnly
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">
                  <Lock size={12} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                  Account Email (Fixed)
                </label>
                <input
                  type="text"
                  className="form-input disabled-input"
                  value={authUser?.email || ''}
                  disabled
                  readOnly
                />
              </div>
            </div>

            {/* Display Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="displayName">
                Display Name / Stage Name <span style={{ color: 'var(--accent-pink)' }}>*</span>
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
                  disabled={saving}
                  required
                />
              </div>
            </div>

            {/* Bio */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="form-label" htmlFor="bio">
                  Creator Bio
                </label>
                <span style={{ fontSize: '0.75rem', color: bio.length > 280 ? 'var(--status-warning)' : 'var(--text-muted)' }}>
                  {bio.length} / 300
                </span>
              </div>
              <textarea
                id="bio"
                className="form-textarea"
                rows="3"
                placeholder="Tell viewers and collaborators about your style, background, and creative passion..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
                disabled={saving}
              />
            </div>

            {/* Location & Profile Image URL */}
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="location">
                  Location
                </label>
                <div className="input-wrapper">
                  <MapPin size={18} className="input-icon" />
                  <input
                    id="location"
                    type="text"
                    className="form-input"
                    placeholder="e.g. San Francisco, CA"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="profileImage">
                  Custom Profile Image URL
                </label>
                <div className="input-wrapper">
                  <ImageIcon size={18} className="input-icon" />
                  <input
                    id="profileImage"
                    type="url"
                    className="form-input"
                    placeholder="https://example.com/avatar.jpg"
                    value={profileImage}
                    onChange={(e) => setProfileImage(e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            {/* Talent Categories */}
            <div className="form-group">
              <label className="form-label">
                <Sparkles size={14} style={{ marginRight: '5px', verticalAlign: '-1px' }} />
                Talent Categories (Select all that apply)
              </label>
              <div className="chips-container">
                {TALENT_CATEGORIES.map((cat) => {
                  const isSelected = categories.includes(cat);
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

            {/* Interactive Skills Tag Manager */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">
                  <Tag size={14} style={{ marginRight: '5px', verticalAlign: '-1px' }} />
                  Specialties & Skills ({skills.length}/20)
                </label>
                <span className="form-hint" style={{ margin: 0 }}>Press Enter to add</span>
              </div>
              
              <div className="skill-input-row" style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Freestyle, Locking, Beat Production, React"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  disabled={saving || skills.length >= 20}
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="btn btn-secondary"
                  disabled={saving || !skillInput.trim() || skills.length >= 20}
                >
                  <Plus size={16} />
                  <span>Add</span>
                </button>
              </div>

              <div className="tag-badges-container">
                {skills.map((skill, index) => (
                  <span key={index} className="skill-edit-pill">
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="skill-remove-btn"
                      title={`Remove ${skill}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div className="form-group" style={{ marginTop: '10px' }}>
              <label className="form-label">
                <Globe size={14} style={{ marginRight: '5px', verticalAlign: '-1px' }} />
                Social Profiles & Website
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="input-wrapper">
                  <Globe size={16} className="input-icon" />
                  <input
                    type="url"
                    className="form-input"
                    placeholder="Website URL (e.g. https://myportfolio.com)"
                    value={socialLinks.website}
                    onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                    disabled={saving}
                  />
                </div>

                <div className="input-wrapper">
                  <Instagram size={16} className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Instagram handle or URL (e.g. @dancer_maya)"
                    value={socialLinks.instagram}
                    onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                    disabled={saving}
                  />
                </div>

                <div className="input-wrapper">
                  <Youtube size={16} className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="YouTube channel URL"
                    value={socialLinks.youtube}
                    onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                    disabled={saving}
                  />
                </div>

                <div className="input-wrapper">
                  <Github size={16} className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="GitHub username or URL"
                    value={socialLinks.github}
                    onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })}
                    disabled={saving}
                  />
                </div>

                <div className="input-wrapper">
                  <Twitter size={16} className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Twitter / X handle (e.g. @maya_dances)"
                    value={socialLinks.twitter}
                    onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <Link to="/profile" className="btn btn-secondary" disabled={saving}>
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfilePage;
