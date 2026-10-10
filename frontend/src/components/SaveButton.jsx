import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { saveVideo, unsaveVideo } from '../services/socialService';

const SaveButton = ({
  videoId,
  initialSaved = false,
  size = 'md',
  showLabel = false,
  onSaveChange = null
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setSaved(Boolean(initialSaved));
  }, [initialSaved]);

  // Synchronous ref lock to prevent duplicate clicks before React re-render
  const isLockedRef = React.useRef(false);

  const handleToggleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname, message: 'Sign in to save videos to your collection!' } });
      return;
    }

    // Immediately drop duplicate clicks
    if (isLockedRef.current || loading || !videoId) return;
    isLockedRef.current = true;

    const previousSaved = saved;
    const newSaved = !saved;

    // Optimistic update
    setSaved(newSaved);
    if (newSaved) setAnimating(true);
    setLoading(true);
    setError(null);

    try {
      if (newSaved) {
        await saveVideo(videoId);
      } else {
        await unsaveVideo(videoId);
      }
      if (onSaveChange) onSaveChange(newSaved);
    } catch (err) {
      setSaved(previousSaved);
      setError(err.response?.data?.message || 'Failed to update saved status.');
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
    <div className="save-button-wrapper" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        onClick={handleToggleSave}
        disabled={loading}
        className={`social-action-btn save-btn ${saved ? 'saved' : ''} ${animating ? 'bookmark-pop' : ''} btn-${size}`}
        title={saved ? 'Remove from saved' : 'Save to bookmarks'}
        aria-label={saved ? 'Saved' : 'Save'}
      >
        <Bookmark
          size={iconSize}
          className={`save-icon ${saved ? 'filled' : ''}`}
          fill={saved ? '#06b6d4' : 'none'}
          color={saved ? '#06b6d4' : 'currentColor'}
        />
        {showLabel && (
          <span className="social-action-label">{saved ? 'Saved' : 'Save'}</span>
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

export default SaveButton;
