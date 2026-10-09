import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Eye, Heart, MessageSquare } from 'lucide-react';

const VideoCard = ({ video }) => {
  if (!video) return null;

  const creator = video.creator || {};
  const avatarUrl =
    creator.profileImage ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${creator.username || 'creator'}`;

  // Format seconds to mm:ss
  const formatDuration = (sec) => {
    if (!sec || sec <= 0) return null;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatCount = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return num.toString();
  };

  const durationStr = formatDuration(video.duration);
  const uploadDate = video.createdAt
    ? new Date(video.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div className="video-card">
      <Link to={`/v/${video._id}`} className="video-card-thumbnail-wrap">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="video-card-thumbnail"
            loading="lazy"
          />
        ) : (
          <div className="video-card-placeholder">
            <Play size={32} color="var(--accent-purple)" />
          </div>
        )}

        <div className="video-card-overlay">
          <div className="video-card-play-btn">
            <Play size={20} fill="white" color="white" />
          </div>
        </div>

        {durationStr && <span className="video-duration-badge">{durationStr}</span>}
      </Link>

      <div className="video-card-content">
        <div className="video-card-meta-top">
          <span className="video-card-category">{video.category}</span>
          <span className="video-card-date">{uploadDate}</span>
        </div>

        <Link to={`/v/${video._id}`} className="video-card-title" title={video.title}>
          {video.title}
        </Link>

        {/* Creator Info & Social Metrics */}
        <div className="video-card-footer-row">
          <Link to={`/u/${creator.username}`} className="video-card-creator-link">
            <img src={avatarUrl} alt={creator.displayName || 'Creator'} className="video-card-avatar" />
            <div className="video-card-creator-text">
              <span className="video-card-creator-name">{creator.displayName || 'Spotly Creator'}</span>
              <span className="video-card-creator-handle">@{creator.username || 'creator'}</span>
            </div>
          </Link>

          <div className="video-card-metrics">
            <div className="video-metric-item" title={`${video.views || 0} views`}>
              <Eye size={12} />
              <span>{formatCount(video.views || 0)}</span>
            </div>
            {video.likeCount !== undefined && (
              <div className="video-metric-item" title={`${video.likeCount || 0} likes`}>
                <Heart size={12} fill={video.isLiked ? '#ef4444' : 'none'} color={video.isLiked ? '#ef4444' : 'currentColor'} />
                <span>{formatCount(video.likeCount || 0)}</span>
              </div>
            )}
            {video.commentCount !== undefined && (
              <div className="video-metric-item" title={`${video.commentCount || 0} comments`}>
                <MessageSquare size={12} />
                <span>{formatCount(video.commentCount || 0)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
