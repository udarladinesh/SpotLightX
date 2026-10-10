import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { likeVideo, unlikeVideo } from '../services/socialService';

const LikeButton = ({
  videoId,
  initialLiked = false,
  initialCount = 0,
  size = 'md',
  onCountChange = null,
  showCount = true
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [error, setError] = useState(null);

  // Synchronous ref lock to prevent duplicate clicks before React re-render
  const isLockedRef = React.useRef(false);

  useEffect(() => {
    setLiked(Boolean(initialLiked));
    setLikeCount(Number(initialCount) || 0);
  }, [initialLiked, initialCount]);

  const handleToggleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname, message: 'Sign in to like videos!' } });
      return;
    }

    // Immediately drop duplicate clicks
    if (isLockedRef.current || loading || !videoId) return;
    isLockedRef.current = true;

    const previousLiked = liked;
    const previousCount = likeCount;

    // Optimistic UI update
    const newLiked = !liked;
    const newCount = newLiked ? previousCount + 1 : Math.max(0, previousCount - 1);
    setLiked(newLiked);
    setLikeCount(newCount);
    if (newLiked) setAnimating(true);
    setLoading(true);
    setError(null);

    try {
      if (newLiked) {
        const data = await likeVideo(videoId);
        if (typeof data.likeCount === 'number') {
          setLikeCount(data.likeCount);
          if (onCountChange) onCountChange(data.likeCount);
        }
      } else {
        const data = await unlikeVideo(videoId);
        if (typeof data.likeCount === 'number') {
          setLikeCount(data.likeCount);
          if (onCountChange) onCountChange(data.likeCount);
        }
      }
    } catch (err) {
      // Rollback on error
      setLiked(previousLiked);
      setLikeCount(previousCount);
      setError(err.response?.data?.message || 'Failed to update like.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setAnimating(false);
        isLockedRef.current = false;
      }, 300);
    }
  };

  const iconSizes = {
    sm: 15,
    md: 18,
    lg: 22
  };

  const iconSize = iconSizes[size] || 18;

  return (
    <div className="like-button-wrapper" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        onClick={handleToggleLike}
        disabled={loading}
        className={`social-action-btn like-btn ${liked ? 'liked' : ''} ${animating ? 'heart-pop' : ''} btn-${size}`}
        title={liked ? 'Unlike showcase' : 'Like showcase'}
        aria-label={liked ? 'Unlike' : 'Like'}
      >
        <Heart
          size={iconSize}
          className={`like-icon ${liked ? 'filled' : ''}`}
          fill={liked ? '#ef4444' : 'none'}
          color={liked ? '#ef4444' : 'currentColor'}
        />
        {showCount && (
          <span className="social-action-count">{likeCount}</span>
        )}
      </button>

      {error && (
        <span className="social-action-error-tooltip">
          {error}
        </span>
      )}
    </div>
  );
};

export default LikeButton;
