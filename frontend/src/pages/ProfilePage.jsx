import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOwnProfile } from '../services/userService';
import { getMyVideos } from '../services/videoService';
import VideoCard from '../components/VideoCard';
import SocialStats from '../components/SocialStats';
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
  Plus,
  Bookmark
} from 'lucide-react';

const ProfilePage = () => {
  const { user: authUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(authUser);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        setLoading(true);
        const data = await getOwnProfile();
        if (data?.user) {
          setProfile(data.user);
          updateUser(data.user);
        }
      } catch (error) {
        console.warn('Could not refresh profile:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchVideos = async () => {
      try {
        setLoadingVideos(true);
        const data = await getMyVideos();
        if (data?.videos) {
          setVideos(data.videos);
        }
      } catch (err) {
        console.warn('Could not fetch videos:', err);
      } finally {
        setLoadingVideos(false);
      }
    };

    fetchLatest();
    fetchVideos();
  }, []);

  const user = profile || authUser;
  const avatarUrl = user?.profileImage || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username || 'spotly'}`;
  const joinedDate = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  const copyPublicLink = () => {
    const url = `${window.location.origin}/u/${user?.username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

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
                  alt={user?.displayName || 'Avatar'} 
                  className="profile-avatar-img"
                />
              </div>

              <div className="profile-actions">
                <button onClick={copyPublicLink} className="btn btn-secondary btn-sm">
                  <ExternalLink size={14} />
                  <span>{copied ? 'Link Copied!' : 'Share Profile'}</span>
                </button>
                <Link to="/saved-videos" className="btn btn-secondary btn-sm">
                  <Bookmark size={14} />
                  <span>Saved</span>
                </Link>
                <Link to="/upload" className="btn btn-primary btn-sm">
                  <Plus size={14} />
                  <span>Upload Video</span>
                </Link>
                <Link to="/profile/edit" className="btn btn-secondary btn-sm">
                  <Settings size={14} />
                  <span>Edit Profile</span>
                </Link>
              </div>
            </div>

            {/* Profile Info */}
            <div className="profile-info-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 className="profile-display-name">{user?.displayName}</h1>
                <span className="profile-role-badge">Creator</span>
              </div>
              
              <p className="profile-username">@{user?.username}</p>

              {/* Social Stats (Followers & Following) */}
              <div style={{ margin: '12px 0 16px' }}>
                <SocialStats
                  followerCount={user?.followerCount}
                  followingCount={user?.followingCount}
                  userId={user?._id}
                />
              </div>

              {user?.bio ? (
                <p className="profile-bio">{user.bio}</p>
              ) : (
                <p className="profile-bio empty">
                  No bio added yet. <Link to="/profile/edit" style={{ color: 'var(--accent-purple)' }}>Click here to add your creator bio</Link>.
                </p>
              )}

              {/* Meta row: location, joined date */}
              <div className="profile-meta-row">
                {user?.location && (
                  <div className="profile-meta-item">
                    <MapPin size={15} color="var(--accent-cyan)" />
                    <span>{user.location}</span>
                  </div>
                )}
                <div className="profile-meta-item">
                  <Calendar size={15} color="var(--text-muted)" />
                  <span>Joined {joinedDate}</span>
                </div>
              </div>

              {/* Social Links */}
              {user?.socialLinks && Object.values(user.socialLinks).some(Boolean) && (
                <div className="profile-social-row">
                  {user.socialLinks.website && (
                    <a href={user.socialLinks.website} target="_blank" rel="noopener noreferrer" className="social-pill" title="Website">
                      <Globe size={14} />
                      <span>Website</span>
                    </a>
                  )}
                  {user.socialLinks.instagram && (
                    <a href={user.socialLinks.instagram.startsWith('http') ? user.socialLinks.instagram : `https://instagram.com/${user.socialLinks.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="social-pill" title="Instagram">
                      <Instagram size={14} />
                      <span>Instagram</span>
                    </a>
                  )}
                  {user.socialLinks.youtube && (
                    <a href={user.socialLinks.youtube.startsWith('http') ? user.socialLinks.youtube : `https://youtube.com/${user.socialLinks.youtube}`} target="_blank" rel="noopener noreferrer" className="social-pill" title="YouTube">
                      <Youtube size={14} />
                      <span>YouTube</span>
                    </a>
                  )}
                  {user.socialLinks.github && (
                    <a href={user.socialLinks.github.startsWith('http') ? user.socialLinks.github : `https://github.com/${user.socialLinks.github}`} target="_blank" rel="noopener noreferrer" className="social-pill" title="GitHub">
                      <Github size={14} />
                      <span>GitHub</span>
                    </a>
                  )}
                  {user.socialLinks.twitter && (
                    <a href={user.socialLinks.twitter.startsWith('http') ? user.socialLinks.twitter : `https://twitter.com/${user.socialLinks.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="social-pill" title="Twitter">
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
              <div className="discipline-card">
                <div className="discipline-header">
                  <Sparkles size={16} color="var(--accent-purple)" />
                  <h3>Talent Categories</h3>
                </div>
                {user?.categories && user.categories.length > 0 ? (
                  <div className="discipline-pills">
                    {user.categories.map((cat, i) => (
                      <span key={i} className="category-tag-badge">
                        {cat}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="discipline-empty">
                    No categories selected. <Link to="/profile/edit" style={{ color: 'var(--accent-indigo)' }}>Choose categories</Link>.
                  </p>
                )}
              </div>

              {/* Skills */}
              <div className="discipline-card">
                <div className="discipline-header">
                  <Award size={16} color="var(--accent-cyan)" />
                  <h3>Skills & Specialties</h3>
                </div>
                {user?.skills && user.skills.length > 0 ? (
                  <div className="discipline-pills">
                    {user.skills.map((skill, i) => (
                      <span key={i} className="skill-tag-badge">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="discipline-empty">
                    No skills listed. <Link to="/profile/edit" style={{ color: 'var(--accent-cyan)' }}>Add your skills</Link>.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Video Showcase & Portfolio Grid */}
        <div className="glass-card portfolio-preview-card">
          <div className="portfolio-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Film size={20} color="var(--accent-purple)" />
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>My Showcase Portfolio ({videos.length})</h2>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to="/upload" className="btn btn-primary btn-sm">
                <Plus size={14} />
                <span>Upload</span>
              </Link>
              <Link to="/my-videos" className="btn btn-secondary btn-sm">
                <span>Manage</span>
              </Link>
            </div>
          </div>

          {loadingVideos ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '10px', color: 'var(--text-secondary)' }}>
              <RefreshCw size={20} className="spin" />
              <span>Loading showcase videos...</span>
            </div>
          ) : videos.length > 0 ? (
            <div className="portfolio-videos-grid">
              {videos.map((vid) => (
                <VideoCard key={vid._id} video={vid} />
              ))}
            </div>
          ) : (
            <div className="portfolio-empty-state">
              <div className="portfolio-empty-icon">
                <Film size={36} color="var(--text-muted)" />
              </div>
              <h3>No Showcases Uploaded Yet</h3>
              <p style={{ marginBottom: '16px' }}>
                Upload your first performance video to kick off your Spotly discovery portfolio!
              </p>
              <Link to="/upload" className="btn btn-primary btn-sm">
                <Plus size={14} />
                <span>Upload Your First Video</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
