import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Film, MapPin, Sparkles, ArrowRight } from 'lucide-react';
import FollowButton from './FollowButton';

const CreatorCard = ({ creator }) => {
  if (!creator) return null;

  const avatarUrl =
    creator.profileImage ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${creator.username || 'creator'}`;

  const formatCount = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return num.toString();
  };

  const categories = Array.isArray(creator.categories) ? creator.categories : [];
  const skills = Array.isArray(creator.skills) ? creator.skills : [];

  return (
    <div className="creator-card">
      <div className="creator-card-header">
        <Link to={`/u/${creator.username}`} className="creator-card-avatar-wrap">
          <img
            src={avatarUrl}
            alt={creator.displayName || 'Creator'}
            className="creator-card-avatar"
            loading="lazy"
          />
        </Link>
        <div className="creator-card-identity">
          <Link to={`/u/${creator.username}`} className="creator-card-name" title={creator.displayName}>
            {creator.displayName || 'Spotly Creator'}
          </Link>
          <span className="creator-card-handle">@{creator.username}</span>
          {creator.location && (
            <span className="creator-card-location">
              <MapPin size={12} />
              <span>{creator.location}</span>
            </span>
          )}
        </div>
      </div>

      {creator.bio && (
        <p className="creator-card-bio" title={creator.bio}>
          {creator.bio}
        </p>
      )}

      {/* Talent Category & Skills Chips */}
      {(categories.length > 0 || skills.length > 0) && (
        <div className="creator-card-tags">
          {categories.slice(0, 2).map((cat, idx) => (
            <span key={`cat-${idx}`} className="creator-tag category">
              <Sparkles size={10} />
              {cat}
            </span>
          ))}
          {skills.slice(0, 3).map((sk, idx) => (
            <span key={`sk-${idx}`} className="creator-tag skill">
              #{sk}
            </span>
          ))}
          {skills.length > 3 && (
            <span className="creator-tag more">+{skills.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer: Metrics and Actions */}
      <div className="creator-card-footer">
        <div className="creator-card-stats">
          <div className="creator-stat-item" title={`${creator.followerCount || 0} followers`}>
            <Users size={13} />
            <span>
              <strong>{formatCount(creator.followerCount || 0)}</strong> followers
            </span>
          </div>
          <div className="creator-stat-item" title={`${creator.videoCount || 0} published showcases`}>
            <Film size={13} />
            <span>
              <strong>{formatCount(creator.videoCount || 0)}</strong> showcases
            </span>
          </div>
        </div>

        <div className="creator-card-actions">
          <FollowButton
            targetUserId={creator._id}
            targetUsername={creator.username}
            initialFollowing={creator.isFollowing}
            initialFollowerCount={creator.followerCount}
            size="sm"
          />
          <Link to={`/u/${creator.username}`} className="btn btn-ghost btn-sm btn-icon-only" title="View Profile">
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CreatorCard;
