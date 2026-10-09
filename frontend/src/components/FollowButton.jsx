import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { followUser, unfollowUser, getFollowStatus } from '../services/socialService';

const FollowButton = ({
  targetUserId,
  targetUsername = '',
  initialFollowing = false,
  initialFollowerCount = 0,
  onFollowChange = null,
  size = 'md',
  variant = 'primary'
}) => {
  const { user: authUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState(null);

  // Check if target is own profile
  const isSelf =
    authUser &&
    targetUserId &&
    (authUser._id === targetUserId ||
      authUser._id?.toString() === targetUserId?.toString() ||
      (targetUsername && authUser.username?.toLowerCase() === targetUsername.toLowerCase()));

  useEffect(() => {
    setFollowing(Boolean(initialFollowing));
    setFollowerCount(Number(initialFollowerCount) || 0);
  }, [initialFollowing, initialFollowerCount]);

  // Fetch follow status if targetUserId is available and user is logged in
  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated && targetUserId && !isSelf) {
      getFollowStatus(targetUserId)
        .then((data) => {
          if (isMounted && typeof data.following === 'boolean') {
            setFollowing(data.following);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, targetUserId, isSelf]);

  if (isSelf) {
    return null; // Do not display follow button on user's own profile
  }

  const handleToggleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login', {
        state: { from: window.location.pathname, message: 'Sign in to follow creators on Spotly!' }
      });
      return;
    }

    if (loading || !targetUserId) return;

    const prevFollowing = following;
    const prevCount = followerCount;

    // Optimistic update
    const newFollowing = !following;
    const newCount = newFollowing ? prevCount + 1 : Math.max(0, prevCount - 1);

    setFollowing(newFollowing);
    setFollowerCount(newCount);
    setLoading(true);
    setError(null);

    try {
      if (newFollowing) {
        const data = await followUser(targetUserId);
        const count = typeof data.followerCount === 'number' ? data.followerCount : newCount;
        setFollowerCount(count);
        if (onFollowChange) onFollowChange(true, count);
      } else {
        const data = await unfollowUser(targetUserId);
        const count = typeof data.followerCount === 'number' ? data.followerCount : newCount;
        setFollowerCount(count);
        if (onFollowChange) onFollowChange(false, count);
      }
    } catch (err) {
      // Rollback
      setFollowing(prevFollowing);
      setFollowerCount(prevCount);
      setError(err.response?.data?.message || 'Failed to update follow status.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="follow-button-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={handleToggleFollow}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={loading}
        className={`btn btn-${size} follow-btn ${following ? 'is-following' : 'not-following'} ${
          following ? 'btn-secondary' : variant === 'primary' ? 'btn-primary' : 'btn-secondary'
        }`}
        aria-label={following ? 'Unfollow creator' : 'Follow creator'}
      >
        {loading ? (
          <>
            <RefreshCw size={14} className="spin" />
            <span>Updating...</span>
          </>
        ) : following ? (
          <>
            <UserCheck size={14} color="var(--accent-cyan)" />
            <span>{isHovered ? 'Unfollow' : 'Following'}</span>
          </>
        ) : (
          <>
            <UserPlus size={14} />
            <span>Follow</span>
          </>
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

export default FollowButton;
