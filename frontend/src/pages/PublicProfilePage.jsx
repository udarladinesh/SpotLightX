import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicProfile } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  MapPin, 
  Calendar, 
  Settings, 
  ExternalLink, 
  Globe, 
  Instagram, 
  Youtube, 
  Github, 
  Twitter, 
  Sparkles, 
  Film, 
  Award,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const PublicProfilePage = () => {
  const { username } = useParams();
  const { user: authUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPublicProfile(username);
        if (data?.user) {
          setProfile(data.user);
        } else {
          setError('Creator not found');
        }
      } catch (err) {
        setError(err.response?.data?.message || `Creator '@${username}' could not be found.`);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchUser();
    }
  }, [username]);

  const copyPublicLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '16px',
        color: 'var(--text-secondary)'
      }}>
        <RefreshCw size={32} className="spin" color="var(--accent-purple)" />
        <p style={{ fontSize: '0.95rem' }}>Loading creator profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto', padding: '40px 24px' }}>
          <AlertCircle size={48} color="var(--status-warning)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Creator Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {error || `We couldn't find a Spotly creator with the handle @${username}.`}
          </p>
          <Link to="/" className="btn btn-primary">
            Back to Spotly Discovery
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = authUser?.username?.toLowerCase() === profile.username?.toLowerCase();
  const avatarUrl = profile.profileImage || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username}`;
  const joinedDate = profile.createdAt 
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  return (
    <div className="profile-page-container">
      <div className="container">
        {/* Profile Card */}
        <div className="glass-card profile-card">
          {/* Header Banner */}
          <div className="profile-banner">
            <div className="profile-banner-overlay" />
          </div>

          <div className="profile-main-content">
            {/* Avatar & Action row */}
            <div className="profile-top-row">
              <div className="profile-avatar-wrapper">
                <img 
                  src={avatarUrl} 
                  alt={profile.displayName || 'Avatar'} 
                  className="profile-avatar-img"
                />
              </div>

              <div className="profile-actions">
                <button onClick={copyPublicLink} className="btn btn-secondary btn-sm">
                  <ExternalLink size={14} />
                  <span>{copied ? 'Link Copied!' : 'Share'}</span>
                </button>

                {isOwnProfile && (
                  <Link to="/profile/edit" className="btn btn-primary btn-sm">
                    <Settings size={14} />
                    <span>Edit Profile</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="profile-info-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 className="profile-display-name">{profile.displayName}</h1>
                <span className="profile-role-badge">Creator</span>
              </div>
              
              <p className="profile-username">@{profile.username}</p>

              {profile.bio && (
                <p className="profile-bio">{profile.bio}</p>
              )}

              {/* Meta row: location, joined date */}
              <div className="profile-meta-row">
                {profile.location && (
                  <div className="profile-meta-item">
                    <MapPin size={15} color="var(--accent-cyan)" />
                    <span>{profile.location}</span>
                  </div>
                )}
                <div className="profile-meta-item">
                  <Calendar size={15} color="var(--text-muted)" />
                  <span>Joined {joinedDate}</span>
                </div>
              </div>

              {/* Social Links */}
              {profile.socialLinks && Object.values(profile.socialLinks).some(Boolean) && (
                <div className="profile-social-row">
                  {profile.socialLinks.website && (
                    <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer" className="social-pill" title="Website">
                      <Globe size={14} />
                      <span>Website</span>
                    </a>
                  )}
                  {profile.socialLinks.instagram && (
                    <a href={profile.socialLinks.instagram.startsWith('http') ? profile.socialLinks.instagram : `https://instagram.com/${profile.socialLinks.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="social-pill" title="Instagram">
                      <Instagram size={14} />
                      <span>Instagram</span>
                    </a>
                  )}
                  {profile.socialLinks.youtube && (
                    <a href={profile.socialLinks.youtube.startsWith('http') ? profile.socialLinks.youtube : `https://youtube.com/${profile.socialLinks.youtube}`} target="_blank" rel="noopener noreferrer" className="social-pill" title="YouTube">
                      <Youtube size={14} />
                      <span>YouTube</span>
                    </a>
                  )}
                  {profile.socialLinks.github && (
                    <a href={profile.socialLinks.github.startsWith('http') ? profile.socialLinks.github : `https://github.com/${profile.socialLinks.github}`} target="_blank" rel="noopener noreferrer" className="social-pill" title="GitHub">
                      <Github size={14} />
                      <span>GitHub</span>
                    </a>
                  )}
                  {profile.socialLinks.twitter && (
                    <a href={profile.socialLinks.twitter.startsWith('http') ? profile.socialLinks.twitter : `https://twitter.com/${profile.socialLinks.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="social-pill" title="Twitter">
                      <Twitter size={14} />
                      <span>Twitter</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Categories & Skills Sections */}
            <div className="profile-disciplines-grid">
              {/* Categories */}
              {profile.categories && profile.categories.length > 0 && (
                <div className="discipline-card">
                  <div className="discipline-header">
                    <Sparkles size={16} color="var(--accent-purple)" />
                    <h3>Talent Categories</h3>
                  </div>
                  <div className="discipline-pills">
                    {profile.categories.map((cat, i) => (
                      <span key={i} className="category-tag-badge">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <div className="discipline-card">
                  <div className="discipline-header">
                    <Award size={16} color="var(--accent-cyan)" />
                    <h3>Skills & Specialties</h3>
                  </div>
                  <div className="discipline-pills">
                    {profile.skills.map((skill, i) => (
                      <span key={i} className="skill-tag-badge">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Portfolio Section Preview */}
        <div className="glass-card portfolio-preview-card">
          <div className="portfolio-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Film size={20} color="var(--accent-purple)" />
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Spotly Video Showcase</h2>
            </div>
            <span className="nav-tag">Phase 3: Video Discovery</span>
          </div>

          <div className="portfolio-empty-state">
            <div className="portfolio-empty-icon">
              <Film size={36} color="var(--text-muted)" />
            </div>
            <h3>No Videos Published Yet</h3>
            <p>
              @{profile.username} has not uploaded any showcase videos yet. Videos will be discovered here once Phase 3 is active!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfilePage;
