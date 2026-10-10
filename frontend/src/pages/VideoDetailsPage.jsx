import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getVideoById, deleteVideo } from '../services/videoService';
import { useAuth } from '../context/AuthContext';
import LikeButton from '../components/LikeButton';
import SaveButton from '../components/SaveButton';
import FollowButton from '../components/FollowButton';
import SocialStats from '../components/SocialStats';
import CommentSection from '../components/CommentSection';
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
  CheckCircle2,
  Heart,
  MessageSquare
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
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [videoPlaybackError, setVideoPlaybackError] = useState(false);

  const fetchVideo = async () => {
    try {
      setLoading(true);
      setError(null);
      setVideoPlaybackError(false);
      const data = await getVideoById(id);
      if (data?.video) {
        setVideo(data.video);
        setLikeCount(data.video.likeCount || 0);
        setCommentCount(data.video.commentCount || 0);
      } else {
        setError('Video not found.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load video.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
      <div className="video-details-page-container">
        <div className="container">
          <div className="video-details-skeleton-grid">
            <div className="video-skeleton-main">
              <div className="skeleton-video-player shimmer" />
              <div className="glass-card" style={{ padding: '24px 28px', marginTop: '20px' }}>
                <div className="skeleton-line shimmer" style={{ width: '25%', height: '18px', marginBottom: '14px' }} />
                <div className="skeleton-line shimmer" style={{ width: '70%', height: '32px', marginBottom: '20px' }} />
                <div className="skeleton-line shimmer" style={{ width: '40%', height: '36px', marginBottom: '24px' }} />
                <div className="skeleton-line shimmer" style={{ width: '100%', height: '80px' }} />
              </div>
            </div>
            <div className="video-skeleton-sidebar">
              <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
                <div className="skeleton-avatar shimmer" style={{ width: '80px', height: '80px', margin: '0 auto 16px', borderRadius: '50%' }} />
                <div className="skeleton-line shimmer" style={{ width: '60%', height: '20px', margin: '0 auto 10px' }} />
                <div className="skeleton-line shimmer" style={{ width: '40%', height: '14px', margin: '0 auto 20px' }} />
                <div className="skeleton-line shimmer" style={{ width: '80%', height: '38px', margin: '0 auto' }} />
              </div>
            </div>
          </div>
        </div>
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
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={fetchVideo} className="btn btn-secondary">
              <RefreshCw size={15} />
              <span>Retry</span>
            </button>
            <Link to="/discover" className="btn btn-primary">
              Discover Talent
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const creator = video.creator || {};
  const isOwner = authUser && (authUser._id === creator._id || authUser.username === creator.username);
  const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${creator.username || 'creator'}`;
  const avatarUrl = creator.profileImage || defaultAvatar;
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
          <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" aria-label="Go back to previous page">
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
        </div>

        <div className="video-player-grid">
          {/* Main Video & Content Column */}
          <div className="video-player-main-col">
            {/* HTML5 Video Player with graceful error recovery */}
            <div className="video-player-wrapper">
              {videoPlaybackError ? (
                <div className="video-player-error-overlay">
                  <AlertCircle size={40} color="var(--status-warning)" />
                  <h3 style={{ fontSize: '1.15rem', marginTop: '12px', marginBottom: '6px' }}>Playback Unavailable</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '360px', marginBottom: '16px', textAlign: 'center' }}>
                    Unable to stream this video file. Check your internet connection or reload the player.
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setVideoPlaybackError(false);
                      const vidEl = document.getElementById('spotly-video-player');
                      if (vidEl) vidEl.load();
                    }}
                  >
                    <RefreshCw size={14} />
                    <span>Retry Playback</span>
                  </button>
                </div>
              ) : (
                <video
                  id="spotly-video-player"
                  src={video.videoUrl}
                  poster={video.thumbnailUrl || undefined}
                  controls
                  playsInline
                  autoPlay={false}
                  className="spotly-html5-player"
                  onError={() => setVideoPlaybackError(true)}
                >
                  Your browser does not support HTML5 video playback.
                </video>
              )}
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

              {/* Action Bar (Like, Save, Share, Edit/Delete) */}
              <div className="video-actions-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <LikeButton
                    videoId={video._id}
                    initialLiked={video.isLiked}
                    initialCount={likeCount}
                    onCountChange={(newCount) => setLikeCount(newCount)}
                  />

                  <SaveButton
                    videoId={video._id}
                    initialSaved={video.isSaved}
                    showLabel={true}
                  />

                  <button onClick={copyShareLink} className="btn btn-secondary btn-sm">
                    <Share2 size={15} />
                    <span>{copied ? 'Link Copied!' : 'Share'}</span>
                  </button>
                </div>

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

            {/* Comments Section */}
            <div className="glass-card" style={{ marginTop: '24px', padding: '24px' }}>
              <CommentSection
                videoId={video._id}
                initialCommentCount={commentCount}
                onCountChange={(newCount) => setCommentCount(newCount)}
              />
            </div>
          </div>

          {/* Creator Sidebar Column */}
          <div className="video-player-sidebar-col">
            <div className="glass-card creator-showcase-sidebar">
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <Link to={`/u/${creator.username}`}>
                  <img
                    src={avatarUrl}
                    alt={creator.displayName}
                    className="creator-sidebar-avatar"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = defaultAvatar;
                    }}
                  />
                </Link>
                <h2 style={{ fontSize: '1.2rem', marginTop: '10px', marginBottom: '2px' }}>
                  <Link to={`/u/${creator.username}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {creator.displayName}
                  </Link>
                </h2>
                <p style={{ color: 'var(--accent-purple)', fontSize: '0.85rem', margin: 0 }}>@{creator.username}</p>
                <span className="profile-role-badge" style={{ marginTop: '6px', display: 'inline-block' }}>Creator</span>
              </div>

              {/* Follow Button & Social Stats in Creator Card */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                {creator._id && (
                  <SocialStats userId={creator._id} />
                )}
                {creator._id && !isOwner && (
                  <FollowButton
                    targetUserId={creator._id}
                    targetUsername={creator.username}
                    size="sm"
                  />
                )}
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

        {/* Accessible Delete Modal */}
        {showDeleteModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
            <div className="glass-card modal-card">
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--status-error)' }}>
                <Trash2 size={24} />
              </div>
              <h2 id="delete-dialog-title" style={{ fontSize: '1.25rem', marginBottom: '8px', textAlign: 'center' }}>Delete Showcase?</h2>
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
