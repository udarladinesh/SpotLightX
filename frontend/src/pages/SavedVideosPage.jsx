import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, RefreshCw, AlertCircle, Compass, Film } from 'lucide-react';
import { getSavedVideos } from '../services/socialService';
import VideoCard from '../components/VideoCard';

const SavedVideosPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchSaved = async (pageNumber = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await getSavedVideos(pageNumber, 12);
      if (append) {
        setVideos((prev) => [...prev, ...(data.videos || [])]);
      } else {
        setVideos(data.videos || []);
      }
      setTotalCount(data.total || 0);
      setPage(data.page || pageNumber);
      setHasMore((data.page || pageNumber) < (data.totalPages || 1));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load saved showcases.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchSaved(1, false);
  }, []);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchSaved(page + 1, true);
    }
  };

  return (
    <div className="saved-videos-page-container">
      <div className="container">
        {/* Page Header */}
        <div className="page-header-banner glass-card" style={{ padding: '32px 28px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div className="brand-icon" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' }}>
              <Bookmark size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Saved Showcases</h1>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
                Your personal collection of inspiring talent performances & creative showcases.
              </p>
            </div>
          </div>
          {totalCount > 0 && (
            <span className="saved-count-pill" style={{ marginTop: '16px', display: 'inline-block' }}>
              {totalCount} {totalCount === 1 ? 'Showcase Bookmarked' : 'Showcases Bookmarked'}
            </span>
          )}
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="saved-loading-state" style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
            <RefreshCw size={36} className="spin" color="var(--accent-cyan)" style={{ margin: '0 auto 16px' }} />
            <p>Loading your saved showcases...</p>
          </div>
        ) : error ? (
          <div className="glass-card" style={{ maxWidth: '500px', margin: '40px auto', padding: '40px 24px', textAlign: 'center' }}>
            <AlertCircle size={44} color="var(--status-warning)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Unable to Load Collection</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>{error}</p>
            <button onClick={() => fetchSaved(1, false)} className="btn btn-secondary btn-sm">
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        ) : videos.length > 0 ? (
          <div>
            <div className="saved-videos-grid">
              {videos.map((vid) => (
                <VideoCard key={vid._id} video={vid} />
              ))}
            </div>

            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="btn btn-secondary"
                >
                  {loadingMore ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>Loading More...</span>
                    </>
                  ) : (
                    <span>Load More Saved Videos</span>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card saved-empty-card" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '560px', margin: '40px auto' }}>
            <div className="saved-empty-icon-wrap" style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', color: 'var(--accent-cyan)' }}>
              <Bookmark size={30} />
            </div>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '10px' }}>Your Collection is Empty</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '24px' }}>
              Explore emerging creators across dance, vocals, acting, production, and more. Bookmark showcases you love to revisit anytime!
            </p>
            <Link to="/" className="btn btn-primary">
              <Compass size={16} />
              <span>Explore Emerging Talent</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedVideosPage;
