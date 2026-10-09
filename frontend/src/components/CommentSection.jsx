import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Send, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getVideoComments, addComment, deleteComment } from '../services/socialService';
import CommentItem from './CommentItem';

const MAX_COMMENT_LENGTH = 500;

const CommentSection = ({ videoId, initialCommentCount = 0, onCountChange = null }) => {
  const { user, isAuthenticated } = useAuth();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [postError, setPostError] = useState(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(initialCommentCount);

  // Fetch initial comments
  useEffect(() => {
    let isMounted = true;

    const fetchComments = async () => {
      if (!videoId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await getVideoComments(videoId, 1, 15);
        if (isMounted) {
          setComments(data.comments || []);
          setTotalCount(data.totalComments || 0);
          setHasMore(data.page < data.totalPages);
          setPage(1);
          if (onCountChange && typeof data.totalComments === 'number') {
            onCountChange(data.totalComments);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Failed to load comments.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchComments();

    return () => {
      isMounted = false;
    };
  }, [videoId]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const data = await getVideoComments(videoId, nextPage, 15);
      setComments((prev) => [...prev, ...(data.comments || [])]);
      setPage(nextPage);
      setHasMore(data.page < data.totalPages);
    } catch (err) {
      console.warn('Failed to load more comments:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return;

    const trimmed = newCommentText.trim();
    if (!trimmed) {
      setPostError('Please write something before posting.');
      return;
    }

    if (trimmed.length > MAX_COMMENT_LENGTH) {
      setPostError(`Comment cannot exceed ${MAX_COMMENT_LENGTH} characters.`);
      return;
    }

    try {
      setSubmitting(true);
      setPostError(null);
      const data = await addComment(videoId, trimmed);
      if (data?.comment) {
        setComments((prev) => [data.comment, ...prev]);
        const updatedTotal = totalCount + 1;
        setTotalCount(updatedTotal);
        setNewCommentText('');
        if (onCountChange) onCountChange(updatedTotal);
      }
    } catch (err) {
      setPostError(err.response?.data?.message || 'Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(videoId, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      const updatedTotal = Math.max(0, totalCount - 1);
      setTotalCount(updatedTotal);
      if (onCountChange) onCountChange(updatedTotal);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete comment.');
    }
  };

  const remainingChars = MAX_COMMENT_LENGTH - newCommentText.length;
  const isOverLimit = remainingChars < 0;

  return (
    <section className="comments-section-container">
      {/* Header */}
      <div className="comments-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={20} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Community Feedback</h2>
          <span className="comments-count-pill">{totalCount}</span>
        </div>
      </div>

      {/* Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handlePostComment} className="comment-post-form">
          <div className="comment-input-wrapper">
            <textarea
              rows={3}
              value={newCommentText}
              onChange={(e) => {
                setNewCommentText(e.target.value);
                if (postError) setPostError(null);
              }}
              placeholder="Share constructive feedback or cheer on this emerging talent..."
              className={`comment-textarea ${isOverLimit ? 'error' : ''}`}
              disabled={submitting}
            />

            <div className="comment-form-footer">
              <span className={`char-counter ${isOverLimit ? 'limit-exceeded' : ''}`}>
                {newCommentText.length}/{MAX_COMMENT_LENGTH}
              </span>

              <button
                type="submit"
                disabled={submitting || !newCommentText.trim() || isOverLimit}
                className="btn btn-primary btn-sm comment-submit-btn"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={14} className="spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Post Comment</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {postError && (
            <div className="comment-error-banner">
              <AlertCircle size={15} />
              <span>{postError}</span>
            </div>
          )}
        </form>
      ) : (
        <div className="comment-auth-prompt-card">
          <Sparkles size={24} color="var(--accent-purple)" style={{ margin: '0 auto 8px' }} />
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Join the conversation! <Link to="/login" state={{ from: window.location.pathname }} className="gradient-text" style={{ fontWeight: 600 }}>Sign in</Link> or{' '}
            <Link to="/register" state={{ from: window.location.pathname }} className="gradient-text" style={{ fontWeight: 600 }}>Create an account</Link> to leave feedback.
          </p>
        </div>
      )}

      {/* Comment List */}
      <div className="comments-list-wrapper">
        {loading ? (
          <div className="comments-loading-state">
            <RefreshCw size={24} className="spin" color="var(--accent-purple)" />
            <span>Loading community feedback...</span>
          </div>
        ) : error ? (
          <div className="comments-error-state">
            <AlertCircle size={24} color="var(--status-warning)" />
            <span>{error}</span>
          </div>
        ) : comments.length > 0 ? (
          <>
            <div className="comments-items-list">
              {comments.map((comment) => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  currentUser={user}
                  onDelete={handleDeleteComment}
                />
              ))}
            </div>

            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="btn btn-secondary btn-sm"
                >
                  {loadingMore ? (
                    <>
                      <RefreshCw size={14} className="spin" />
                      <span>Loading more...</span>
                    </>
                  ) : (
                    <span>Load More Comments</span>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="comments-empty-state">
            <div className="empty-state-icon-circle">
              <MessageSquare size={28} color="var(--text-muted)" />
            </div>
            <h3>No feedback yet</h3>
            <p>Be the first talent spotter to comment on this performance!</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default CommentSection;
