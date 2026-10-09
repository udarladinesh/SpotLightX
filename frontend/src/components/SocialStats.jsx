import React, { useState, useEffect } from 'react';
import { Users, UserCheck } from 'lucide-react';
import { getUserSocialStats } from '../services/socialService';

const SocialStats = ({
  userId = null,
  followerCount: propFollowerCount = null,
  followingCount: propFollowingCount = null,
  className = ''
}) => {
  const [followerCount, setFollowerCount] = useState(propFollowerCount ?? 0);
  const [followingCount, setFollowingCount] = useState(propFollowingCount ?? 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (propFollowerCount !== null) {
      setFollowerCount(propFollowerCount);
    }
    if (propFollowingCount !== null) {
      setFollowingCount(propFollowingCount);
    }
  }, [propFollowerCount, propFollowingCount]);

  useEffect(() => {
    // If props were not provided directly, fetch from API
    if (userId && (propFollowerCount === null || propFollowingCount === null)) {
      let isMounted = true;
      setLoading(true);
      getUserSocialStats(userId)
        .then((data) => {
          if (isMounted) {
            if (typeof data.followerCount === 'number') setFollowerCount(data.followerCount);
            if (typeof data.followingCount === 'number') setFollowingCount(data.followingCount);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [userId, propFollowerCount, propFollowingCount]);

  // Format numbers (e.g. 1.2K)
  const formatCount = (num) => {
    if (typeof num !== 'number') return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return num.toString();
  };

  return (
    <div className={`social-stats-container ${className}`}>
      <div className="social-stat-item" title={`${followerCount} Followers`}>
        <Users size={15} color="var(--accent-purple)" className="social-stat-icon" />
        <span className="social-stat-number">{formatCount(followerCount)}</span>
        <span className="social-stat-label">
          {followerCount === 1 ? 'Follower' : 'Followers'}
        </span>
      </div>

      <div className="social-stat-divider" />

      <div className="social-stat-item" title={`${followingCount} Following`}>
        <UserCheck size={15} color="var(--accent-cyan)" className="social-stat-icon" />
        <span className="social-stat-number">{formatCount(followingCount)}</span>
        <span className="social-stat-label">Following</span>
      </div>
    </div>
  );
};

export default SocialStats;
