import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import {
  fetchFreshVideos,
  fetchTrendingVideos,
  fetchFollowingVideos
} from '../services/discoverService';
import {
  Sparkles,
  Flame,
  Users,
  Compass,
  Filter,
  RefreshCw,
  LogIn,
  UserPlus,
  Upload,
  AlertCircle,
  Film,
  Music,
  Mic2,
  Tv,
  Palette,
  Camera,
  Radio,
  Code2,
  Award,
  Layers
} from 'lucide-react';

const CATEGORIES = [
  { name: 'Dance & Movement', icon: Sparkles },
  { name: 'Singing & Vocals', icon: Mic2 },
  { name: 'Acting & Drama', icon: Tv },
  { name: 'Choreography', icon: Compass },
  { name: 'Art & Design', icon: Palette },
  { name: 'Music & Production', icon: Music },
  { name: 'Photography & Film', icon: Camera },
  { name: 'Public Speaking', icon: Radio },
  { name: 'Tech & Programming', icon: Code2 },
  { name: 'Creative Performance', icon: Award }
];

const DiscoverPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // URL state synchronization
  const rawTab = searchParams.get('tab');
  const validTabs = ['fresh', 'trending', 'following'];
  const activeTab = validTabs.includes(rawTab) ? rawTab : 'fresh';
  const selectedCategory = searchParams.get('category') || '';

  // Data & UI states
  const [videos, setVideos] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Request race-condition safeguard
  const activeRequestRef = useRef(0);

  // Tab change handler
  const handleTabChange = (tabName) => {
    if (tabName === activeTab) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tabName);
    setSearchParams(newParams);
  };

  // Category change handler
  const handleCategoryChange = (catName) => {
    const newParams = new URLSearchParams(searchParams);
    if (catName) {
      newParams.set('category', catName);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
  };

  // Main fetch function for page 1
  const loadFeed = useCallback(async () => {
    const requestId = ++activeRequestRef.current;
    setIsLoading(true);
    setError(null);

    try {
      // If following tab and not logged in, avoid network error and show clean auth banner
      if (activeTab === 'following' && !isAuthenticated) {
        setVideos([]);
        setTotal(0);
        setHasNextPage(false);
        setIsLoading(false);
        return;
      }

      const params = {
        page: 1,
        limit: 12,
        category: selectedCategory
      };

      let response;
      if (activeTab === 'fresh') {
        response = await fetchFreshVideos(params);
      } else if (activeTab === 'trending') {
        response = await fetchTrendingVideos(params);
      } else if (activeTab === 'following') {
        response = await fetchFollowingVideos(params);
      }

      if (requestId === activeRequestRef.current) {
        setVideos(response.videos || []);
        setTotal(response.total || 0);
        setPage(1);
        setHasNextPage(Boolean(response.hasNextPage || response.pagination?.hasNextPage));
      }
    } catch (err) {
      if (requestId === activeRequestRef.current) {
        console.error('Discovery Feed Fetch Error:', err);
        setError(
          err.response?.data?.message ||
            'Unable to load discovery feed. Please check your connection and try again.'
        );
        setVideos([]);
      }
    } finally {
      if (requestId === activeRequestRef.current) {
        setIsLoading(false);
      }
    }
  }, [activeTab, selectedCategory, isAuthenticated]);

  // Trigger load when tab or category changes
  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Load more pages handler
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasNextPage) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const params = {
        page: nextPage,
        limit: 12,
        category: selectedCategory
      };

      let response;
      if (activeTab === 'fresh') {
        response = await fetchFreshVideos(params);
      } else if (activeTab === 'trending') {
        response = await fetchTrendingVideos(params);
      } else if (activeTab === 'following') {
        response = await fetchFollowingVideos(params);
      }

      const newVideos = response.videos || [];
      setVideos((prev) => {
        const existingIds = new Set(prev.map((v) => v._id));
        const filteredNew = newVideos.filter((v) => !existingIds.has(v._id));
        return [...prev, ...filteredNew];
      });

      setPage(nextPage);
      setHasNextPage(Boolean(response.hasNextPage || response.pagination?.hasNextPage));
    } catch (err) {
      console.error('Load more videos failed:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="discover-page">
      <div className="container discover-container">
        {/* Page Header */}
        <header className="discover-header">
          <div className="discover-pill">
            <Compass size={14} className="icon-pulse" />
            <span>Talent Discovery Hub</span>
          </div>
          <h1 className="discover-title">
            Discover <span className="gradient-text">Fresh Talent</span> & Trending Showcases
          </h1>
          <p className="discover-subtitle">
            Explore newly published creations and rising performers across all disciplines with fair,
            transparent, rule-based visibility.
          </p>
        </header>

        {/* Discovery Feed Tabs */}
        <div className="discover-tabs-bar">
          <div className="discover-tabs-nav">
            <button
              onClick={() => handleTabChange('fresh')}
              className={`discover-tab-btn ${activeTab === 'fresh' ? 'active' : ''}`}
            >
              <Sparkles size={17} />
              <span>Fresh Feed</span>
              <span className="tab-pill-badge">Newest</span>
            </button>

            <button
              onClick={() => handleTabChange('trending')}
              className={`discover-tab-btn ${activeTab === 'trending' ? 'active' : ''}`}
            >
              <Flame size={17} />
              <span>Trending</span>
              <span className="tab-pill-badge">Hot</span>
            </button>

            <button
              onClick={() => handleTabChange('following')}
              className={`discover-tab-btn ${activeTab === 'following' ? 'active' : ''}`}
            >
              <Users size={17} />
              <span>Following</span>
              {isAuthenticated && (
                <span className="tab-pill-badge circle">
                  <span className="live-dot" />
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category Filter Chips Bar */}
        <div className="discover-category-bar">
          <div className="category-chips-scroll">
            <button
              onClick={() => handleCategoryChange('')}
              className={`category-chip ${selectedCategory === '' ? 'active' : ''}`}
            >
              <Layers size={14} />
              <span>All Disciplines</span>
            </button>

            {CATEGORIES.map((cat) => {
              const IconComp = cat.icon;
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => handleCategoryChange(cat.name)}
                  className={`category-chip ${isSelected ? 'active' : ''}`}
                >
                  <IconComp size={14} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feed Meta Info Bar */}
        <div className="discover-feed-info">
          <div className="feed-info-left">
            <span className="feed-count-tag">
              {isLoading ? (
                'Loading showcases...'
              ) : (
                <>
                  Showing <strong>{videos.length}</strong> of <strong>{total}</strong> showcases
                  {selectedCategory && (
                    <>
                      {' '}
                      in <span className="highlight-cat">{selectedCategory}</span>
                    </>
                  )}
                </>
              )}
            </span>
          </div>

          {selectedCategory && (
            <button onClick={() => handleCategoryChange('')} className="btn-clear-filter">
              Clear Category Filter
            </button>
          )}
        </div>

        {/* Main Content Area */}
        {isLoading ? (
          /* Loading Skeletons */
          <div className="discover-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="video-card-skeleton">
                <div className="skeleton-thumb shimmer" />
                <div className="skeleton-content">
                  <div className="skeleton-line title shimmer" />
                  <div className="skeleton-line meta shimmer" />
                  <div className="skeleton-footer">
                    <div className="skeleton-avatar shimmer" />
                    <div className="skeleton-line author shimmer" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="glass-card discover-error-card">
            <AlertCircle size={44} color="var(--status-error)" />
            <h3>Unable to Load Discovery Feed</h3>
            <p>{error}</p>
            <button onClick={loadFeed} className="btn btn-primary btn-sm">
              <RefreshCw size={15} />
              <span>Retry</span>
            </button>
          </div>
        ) : activeTab === 'following' && !isAuthenticated ? (
          /* Unauthenticated Following Tab State */
          <div className="glass-card discover-auth-card">
            <div className="auth-card-icon-wrap">
              <Users size={32} color="var(--accent-indigo)" />
            </div>
            <h2>Sign in to view your Following Feed</h2>
            <p>
              Keep up with your favorite rising dancers, vocalists, producers, and creative artists
              by following them on Spotly.
            </p>
            <div className="auth-card-actions">
              <Link to="/login" className="btn btn-primary">
                <LogIn size={16} />
                <span>Sign In</span>
              </Link>
              <Link to="/register" className="btn btn-secondary">
                <UserPlus size={16} />
                <span>Create Account</span>
              </Link>
            </div>
          </div>
        ) : videos.length === 0 ? (
          /* Empty States */
          <div className="glass-card discover-empty-card">
            <div className="empty-card-icon-wrap">
              {activeTab === 'following' ? (
                <Users size={36} color="var(--accent-purple)" />
              ) : selectedCategory ? (
                <Filter size={36} color="var(--accent-cyan)" />
              ) : (
                <Film size={36} color="var(--accent-indigo)" />
              )}
            </div>

            {activeTab === 'following' ? (
              <>
                <h3>You aren't following any creators yet</h3>
                <p>
                  Explore the <strong>Fresh</strong> and <strong>Trending</strong> feeds to find
                  emerging creators in your favorite categories and follow them!
                </p>
                <button
                  onClick={() => handleTabChange('trending')}
                  className="btn btn-primary"
                  style={{ marginTop: '16px' }}
                >
                  <Flame size={16} />
                  <span>Explore Trending Showcases</span>
                </button>
              </>
            ) : selectedCategory ? (
              <>
                <h3>No showcases found in "{selectedCategory}"</h3>
                <p>
                  Be the first creator to showcase your talent in this category and get discovered
                  by fans and spotters worldwide!
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
                  <button onClick={() => handleCategoryChange('')} className="btn btn-secondary">
                    View All Categories
                  </button>
                  {isAuthenticated && (
                    <Link to="/upload" className="btn btn-primary">
                      <Upload size={16} />
                      <span>Upload Showcase</span>
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <>
                <h3>No published showcases available</h3>
                <p>
                  Check back in a moment or upload your own showcase to start building your creative
                  portfolio!
                </p>
                {isAuthenticated && (
                  <Link to="/upload" className="btn btn-primary" style={{ marginTop: '16px' }}>
                    <Upload size={16} />
                    <span>Upload Video</span>
                  </Link>
                )}
              </>
            )}
          </div>
        ) : (
          /* Video Grid & Pagination */
          <>
            <div className="discover-grid">
              {videos.map((video) => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>

            {/* Pagination / Load More Footer */}
            <div className="discover-pagination-wrap">
              {hasNextPage ? (
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="btn btn-secondary btn-load-more"
                >
                  {isLoadingMore ? (
                    <>
                      <RefreshCw size={16} className="icon-spin" />
                      <span>Loading more showcases...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More Showcases</span>
                      <span className="load-more-remaining">
                        ({total - videos.length} remaining)
                      </span>
                    </>
                  )}
                </button>
              ) : (
                <div className="feed-end-message">
                  <span className="dot-end" />
                  <span>You've explored all {total} showcases in this view</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DiscoverPage;
