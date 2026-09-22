import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getVideoById, deleteVideo } from '../services/videoService';
import { useAuth } from '../context/AuthContext';
import {
  Play,
  Sparkles,
  Tag,
  Eye,
  Calendar,
  Share2,
  Settings,
  Trash2,
  ExternalLink,
  MapPin,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';

const VideoDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getVideoById(id);
        if (data?.video) {
          setVideo(data.video);
        } else {
          setError('Video not found.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load video.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVideo();
    }
  }, [id]);

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteVideo(id);
      navigate('/my-videos');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete video.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px', color: 'var(--text-secondary)' }}>
        <RefreshCw size={36} className="spin" color="var(--accent-purple)" />
        <p>Loading Spotly Showcase...</p>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '480px', margin: '0 auto', padding: '40px 24px' }}>
          <AlertCircle size={48} color="var(--status-warning)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Showcase Unavailable</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error || 'This video does not exist or has been removed.'}</p>
          <Link to="/" className="btn btn-primary">
            Back to Spotly Discovery
          </Link>
        </div>
      </div>
    );
  }

  const creator = video.creator || {};
  const isOwner = authUser && (authUser._id === creator._id || authUser.username === creator.username);
  const avatarUrl = creator.profileImage || `https://api.dicebear.com/7.x/bottts/svg?seed=${creator.username || 'creator'}`;
  const uploadDate = new Date(video.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="video-details-page-container">
      <div className="container">
        {/* Back Link */}
        <div style={{ marginBottom: '16px' }}>
          <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm">
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
        </div>

        <div className="video-player-grid">
          {/* Main Video & Content Column */}
          <div className="video-player-main-col">
            {/* HTML5 Video Player */}
            <div className="video-player-wrapper">
              <video
                src={video.videoUrl}
                poster={video.thumbnailUrl || undefined}
                controls
                playsInline
                autoPlay={false}
                className="spotly-html5-player"
              >
                Your browser does not support HTML5 video playback.
              </video>
            </div>

            {/* Video Header & Meta */}
            <div className="glass-card video-meta-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <span className="category-tag-badge">{video.category}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Calendar size={13} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                  {uploadDate}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Eye size={13} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                  {video.views || 0} views
                </span>
              </div>

              <h1 className="video-details-title">{video.title}</h1>

              {/* Action Bar */}
              <div className="video-actions-bar">
                <button onClick={copyShareLink} className="btn btn-secondary btn-sm">
                  <Share2 size={15} />
                  <span>{copied ? 'Link Copied!' : 'Share Video'}</span>
                </button>

                {isOwner && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link to={`/v/${video._id}/edit`} className="btn btn-secondary btn-sm">
                      <Settings size={14} />
                      <span>Edit Video</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="btn btn-secondary btn-sm delete-btn"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Description */}
              {video.description && (
                <div className="video-details-description">
                  <h3 style={{ fontSize: '0.95rem', marginBottom: '6px', color: 'var(--text-primary)' }}>About This Showcase</h3>
                  <p style={{ whiteSpace: 'pre-line', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                    {video.description}
                  </p>
                </div>
              )}

              {/* Skills Tags */}
              {video.skills && video.skills.length > 0 && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                    Featured Specialties & Skills
                  </h3>
                  <div className="discipline-pills">
                    {video.skills.map((skill, index) => (
                      <span key={index} className="skill-tag-badge">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Creator Sidebar Column */}
          <div className="video-player-sidebar-col">
            <div className="glass-card creator-showcase-sidebar">
              <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                <Link to={`/u/${creator.username}`}>
                  <img src={avatarUrl} alt={creator.displayName} className="creator-sidebar-avatar" />
                </Link>
                <h2 style={{ fontSize: '1.2rem', marginTop: '10px', marginBottom: '2px' }}>
                  <Link to={`/u/${creator.username}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {creator.displayName}
                  </Link>
                </h2>
                <p style={{ color: 'var(--accent-purple)', fontSize: '0.85rem', margin: 0 }}>@{creator.username}</p>
                <span className="profile-role-badge" style={{ marginTop: '6px', display: 'inline-block' }}>Creator</span>
              </div>

              {creator.bio && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, textAlign: 'center', marginBottom: '16px' }}>
                  {creator.bio}
                </p>
              )}

              {creator.location && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
                  <MapPin size={13} color="var(--accent-cyan)" />
                  <span>{creator.location}</span>
                </div>
              )}

              <Link to={`/u/${creator.username}`} className="btn btn-secondary btn-block btn-sm">
                <ExternalLink size={14} />
                <span>View Full Portfolio</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="glass-card modal-card">
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--status-error)' }}>
                <Trash2 size={24} />
              </div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', textAlign: 'center' }}>Delete Showcase?</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center', marginBottom: '24px' }}>
                Are you sure you want to delete <strong>"{video.title}"</strong>? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowDeleteModal(false)} className="btn btn-secondary btn-block" disabled={deleting}>
                  Cancel
                </button>
                <button type="button" onClick={handleDelete} className="btn btn-primary btn-block" style={{ background: 'var(--status-error)' }} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete Video'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoDetailsPage;
