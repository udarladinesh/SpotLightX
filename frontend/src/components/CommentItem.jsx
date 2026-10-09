import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Clock, AlertCircle } from 'lucide-react';

const CommentItem = ({ comment, currentUser, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!comment) return null;

  const author = comment.user || {};
  const isOwner = currentUser && (currentUser._id === author._id || currentUser.username === author.username);
  const avatarUrl = author.profileImage || `https://api.dicebear.com/7.x/bottts/svg?seed=${author.username || 'commenter'}`;

  // Time formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(comment._id);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className={`comment-item-card ${isDeleting ? 'deleting' : ''}`}>
      <div className="comment-item-avatar-col">
        <Link to={`/u/${author.username}`}>
          <img
            src={avatarUrl}
            alt={author.displayName || 'User'}
            className="comment-avatar-img"
          />
        </Link>
      </div>

      <div className="comment-item-content-col">
        <div className="comment-item-header">
          <div className="comment-item-author-info">
            <Link to={`/u/${author.username}`} className="comment-author-name">
              {author.displayName || 'Spotly Fan'}
            </Link>
            <span className="comment-author-handle">@{author.username || 'user'}</span>
            <span className="comment-time">
              <Clock size={12} style={{ marginRight: '3px', verticalAlign: '-1px' }} />
              {formatDate(comment.createdAt)}
            </span>
          </div>

          {isOwner && (
            <div className="comment-actions">
              {showConfirm ? (
                <div className="comment-delete-confirm">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Delete?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="btn btn-sm comment-confirm-btn"
                  >
                    {isDeleting ? '...' : 'Yes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirm(false)}
                    disabled={isDeleting}
                    className="btn btn-sm comment-cancel-btn"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirm(true)}
                  className="comment-delete-btn"
                  title="Delete comment"
                  aria-label="Delete comment"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        <p className="comment-text-body">{comment.text}</p>
      </div>
    </div>
  );
};

export default CommentItem;
