import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyVideos, deleteVideo } from '../services/videoService';
import {
  Film,
  Plus,
  Play,
  Settings,
  Trash2,
  Eye,
  Calendar,
  AlertCircle,
  RefreshCw,
  Clock,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

const MyVideosPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyVideos();
      if (data?.videos) {
        setVideos(data.videos);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch your videos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteVideo(deleteTarget._id);
      setVideos(videos.filter((v) => v._id !== deleteTarget._id));
      setActionSuccess(`"${deleteTarget.title}" was deleted.`);
      setDeleteTarget(null);
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete video.');
    } finally {
      setDeleting(false);
    }
  };

  const formatDuration = (sec) => {
    if (!sec || sec <= 0) return null;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="profile-page-container">
      <div className="container">
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Film size={24} color="var(--accent-purple)" />
              <h1 style={{ fontSize: '1.85rem', margin: 0 }}>My Videos & Showcases</h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Manage your talent showcases, watch performance, and edit video details.
            </p>
          </div>

          <Link to="/upload" className="btn btn-primary">
            <Plus size={16} />
            <span>Upload New Video</span>
          </Link>
        </div>

        {/* Success Alert */}
        {actionSuccess && (
          <div className="auth-alert success" style={{ marginBottom: '20px' }}>
            <CheckCircle2 size={18} />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: '14px', color: 'var(--text-secondary)' }}>
            <RefreshCw size={28} className="spin" color="var(--accent-purple)" />
            <p>Loading your showcases...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="auth-alert error" style={{ margin: '20px 0' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && videos.length === 0 && (
          <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--border-subtle)' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '18px', background: 'rgba(99, 102, 241, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--accent-purple)' }}>
              <Film size={36} />
            </div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>No Videos Uploaded Yet</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 24px', fontSize: '0.9rem' }}>
              You haven't published any videos yet. Upload a performance, routine, or showcase to kick off your Spotly discovery journey!
            </p>
            <Link to="/upload" className="btn btn-primary">
              <Plus size={16} />
              <span>Upload Your First Showcase</span>
            </Link>
          </div>
        )}

        {/* Video Grid */}
        {!loading && !error && videos.length > 0 && (
          <div className="creator-videos-grid">
            {videos.map((vid) => {
              const duration = formatDuration(vid.duration);
              const dateStr = new Date(vid.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <div key={vid._id} className="glass-card my-video-item">
                  <div className="my-video-thumb-wrap">
                    {vid.thumbnailUrl ? (
                      <img src={vid.thumbnailUrl} alt={vid.title} className="my-video-thumb" />
                    ) : (
                      <div className="my-video-thumb-placeholder">
                        <Play size={28} color="var(--accent-purple)" />
                      </div>
                    )}
                    {duration && <span className="video-duration-badge">{duration}</span>}
                    <span className={`video-status-chip ${vid.status}`}>
                      {vid.status === 'draft' ? 'Draft' : 'Published'}
                    </span>
                  </div>

                  <div className="my-video-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="category-tag-badge" style={{ fontSize: '0.725rem', padding: '2px 8px' }}>
                        {vid.category}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dateStr}</span>
                    </div>

                    <h3 className="my-video-title" title={vid.title}>
                      <Link to={`/v/${vid._id}`}>{vid.title}</Link>
                    </h3>

                    <div className="my-video-stats">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Eye size={13} color="var(--text-muted)" />
                        <span>{vid.views || 0} views</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Sparkles size={13} color="var(--accent-cyan)" />
                        <span>{vid.skills?.length || 0} skills</span>
                      </div>
                    </div>

                    <div className="my-video-actions">
                      <Link to={`/v/${vid._id}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                        <Play size={14} />
                        <span>Watch</span>
                      </Link>
                      <Link to={`/v/${vid._id}/edit`} className="btn btn-secondary btn-sm" title="Edit Video">
                        <Settings size={14} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(vid)}
                        className="btn btn-secondary btn-sm delete-btn"
                        title="Delete Video"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="modal-overlay">
            <div className="glass-card modal-card">
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--status-error)' }}>
                <Trash2 size={24} />
              </div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', textAlign: 'center' }}>Delete Video?</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center', marginBottom: '24px' }}>
                Are you sure you want to permanently delete <strong>"{deleteTarget.title}"</strong>? This will remove the video and its cloud assets immediately.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="btn btn-secondary btn-block"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="btn btn-primary btn-block"
                  style={{ background: 'var(--status-error)' }}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete Video'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyVideosPage;
