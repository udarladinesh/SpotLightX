import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import CreatorCard from '../components/CreatorCard';
import { searchVideos, searchCreators } from '../services/searchService';
import {
  Search,
  Film,
  Users,
  Sparkles,
  Filter,
  X,
  RefreshCw,
  AlertCircle,
  Tag,
  Layers,
  Mic2,
  Tv,
  Palette,
  Music,
  Camera,
  Radio,
  Code2,
  Award,
  Compass
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

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state synchronization
  const rawTab = searchParams.get('tab');
  const activeTab = rawTab === 'creators' ? 'creators' : 'videos';
  const queryText = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || '';
  const selectedSkill = searchParams.get('skill') || '';

  // Local input state for typing
  const [searchInput, setSearchInput] = useState(queryText);
  const [skillInput, setSkillInput] = useState(selectedSkill);
  const [showSkillInput, setShowSkillInput] = useState(Boolean(selectedSkill));

  // Search Results & State
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Request race-condition safeguard
  const activeRequestRef = useRef(0);

  // Sync searchInput when URL query changes externally
  useEffect(() => {
    setSearchInput(queryText);
  }, [queryText]);

  useEffect(() => {
    setSkillInput(selectedSkill);
    if (selectedSkill) setShowSkillInput(true);
  }, [selectedSkill]);

  // Execute search submission
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      newParams.set('q', searchInput.trim());
    } else {
      newParams.delete('q');
    }
    setSearchParams(newParams);
  };

  // Tab change
  const handleTabChange = (tabName) => {
    if (tabName === activeTab) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tabName);
    setSearchParams(newParams);
  };

  // Category filter change
  const handleCategoryChange = (catName) => {
    const newParams = new URLSearchParams(searchParams);
    if (catName) {
      newParams.set('category', catName);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
  };

  // Skill filter submit
  const handleSkillSubmit = (e) => {
    if (e) e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (skillInput.trim()) {
      newParams.set('skill', skillInput.trim());
    } else {
      newParams.delete('skill');
    }
    setSearchParams(newParams);
  };

  // Clear specific filter
  const handleClearSkill = () => {
    setSkillInput('');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('skill');
    setSearchParams(newParams);
  };

  const handleClearAllFilters = () => {
    setSearchInput('');
    setSkillInput('');
    const newParams = new URLSearchParams();
    if (activeTab !== 'videos') {
      newParams.set('tab', activeTab);
    }
    setSearchParams(newParams);
  };

  // Main fetch function for page 1
  const executeSearch = useCallback(async () => {
    const requestId = ++activeRequestRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const params = {
        q: queryText,
        category: selectedCategory,
        skill: selectedSkill,
        page: 1,
        limit: 12
      };

      let response;
      if (activeTab === 'videos') {
        response = await searchVideos(params);
        if (requestId === activeRequestRef.current) {
          setResults(response.videos || []);
          setTotal(response.total || 0);
          setPage(1);
          setHasNextPage(Boolean(response.hasNextPage || response.pagination?.hasNextPage));
        }
      } else {
        response = await searchCreators(params);
        if (requestId === activeRequestRef.current) {
          setResults(response.creators || []);
          setTotal(response.total || 0);
          setPage(1);
          setHasNextPage(Boolean(response.hasNextPage || response.pagination?.hasNextPage));
        }
      }
    } catch (err) {
      if (requestId === activeRequestRef.current) {
        console.error('Search Request Error:', err);
        setError(
          err.response?.data?.message ||
            'Unable to complete search request. Please check your connection and try again.'
        );
        setResults([]);
        setTotal(0);
      }
    } finally {
      if (requestId === activeRequestRef.current) {
        setIsLoading(false);
      }
    }
  }, [activeTab, queryText, selectedCategory, selectedSkill]);

  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  // Load more pages handler
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasNextPage) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const params = {
        q: queryText,
        category: selectedCategory,
        skill: selectedSkill,
        page: nextPage,
        limit: 12
      };

      let response;
      if (activeTab === 'videos') {
        response = await searchVideos(params);
        const newVideos = response.videos || [];
        setResults((prev) => {
          const existingIds = new Set(prev.map((v) => v._id));
          const filteredNew = newVideos.filter((v) => !existingIds.has(v._id));
          return [...prev, ...filteredNew];
        });
      } else {
        response = await searchCreators(params);
        const newCreators = response.creators || [];
        setResults((prev) => {
          const existingIds = new Set(prev.map((c) => c._id));
          const filteredNew = newCreators.filter((c) => !existingIds.has(c._id));
          return [...prev, ...filteredNew];
        });
      }

      setPage(nextPage);
      setHasNextPage(Boolean(response.hasNextPage || response.pagination?.hasNextPage));
    } catch (err) {
      console.error('Load more search results failed:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const hasActiveFilters = Boolean(queryText || selectedCategory || selectedSkill);

  return (
    <div className="search-page">
      <div className="container search-container">
        {/* Page Header */}
        <header className="search-header">
          <div className="search-pill">
            <Search size={14} className="icon-pulse" />
            <span>Search & Discovery</span>
          </div>
          <h1 className="search-title">
            Explore <span className="gradient-text">Talent & Showcases</span>
          </h1>
          <p className="search-subtitle">
            Find emerging creators, choreographies, original beats, and skills across all disciplines.
          </p>

          {/* Search Bar Form */}
          <form onSubmit={handleSearchSubmit} className="search-bar-form">
            <div className="search-input-group">
              <Search size={20} className="search-input-icon" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search videos, creators, styles, or skills (e.g., hip-hop, beats, contemporary)..."
                className="search-input-field"
                aria-label="Search term"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('q');
                    setSearchParams(newParams);
                  }}
                  className="search-clear-btn"
                  title="Clear search text"
                >
                  <X size={16} />
                </button>
              )}
              <button type="submit" className="btn btn-primary search-submit-btn">
                <span>Search</span>
              </button>
            </div>
          </form>
        </header>

        {/* Tab Switcher: Videos vs Creators */}
        <div className="search-tabs-bar">
          <div className="search-tabs-nav">
            <button
              onClick={() => handleTabChange('videos')}
              className={`search-tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
            >
              <Film size={17} />
              <span>Showcases</span>
              {!isLoading && activeTab === 'videos' && (
                <span className="search-tab-count">{total}</span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('creators')}
              className={`search-tab-btn ${activeTab === 'creators' ? 'active' : ''}`}
            >
              <Users size={17} />
              <span>Creators</span>
              {!isLoading && activeTab === 'creators' && (
                <span className="search-tab-count">{total}</span>
              )}
            </button>
          </div>

          {/* Skill Filter Toggle Button */}
          <button
            onClick={() => setShowSkillInput(!showSkillInput)}
            className={`btn btn-glass btn-sm ${selectedSkill ? 'active-skill' : ''}`}
          >
            <Tag size={14} />
            <span>{selectedSkill ? `Skill: #${selectedSkill}` : 'Filter by Skill'}</span>
          </button>
        </div>

        {/* Skill Tag Input Box (if opened or skill selected) */}
        {showSkillInput && (
          <form onSubmit={handleSkillSubmit} className="search-skill-form glass-card">
            <Tag size={15} color="var(--accent-purple)" />
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="Filter by skill tag (e.g., popping, beatmaking, illustration)..."
              className="skill-input-field"
            />
            {selectedSkill && (
              <button
                type="button"
                onClick={handleClearSkill}
                className="btn btn-ghost btn-sm"
              >
                Clear Skill
              </button>
            )}
            <button type="submit" className="btn btn-primary btn-sm">
              Apply Skill
            </button>
          </form>
        )}

        {/* Category Filter Chips Bar */}
        <div className="search-category-bar">
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

        {/* Active Filter Chips & Results Count Bar */}
        <div className="search-feed-info">
          <div className="feed-info-left">
            <span className="feed-count-tag">
              {isLoading ? (
                'Searching Spotly...'
              ) : (
                <>
                  Found <strong>{total}</strong> {activeTab === 'videos' ? 'showcase' : 'creator'}
                  {total === 1 ? '' : 's'}
                  {queryText && (
                    <>
                      {' '}
                      matching "<strong>{queryText}</strong>"
                    </>
                  )}
                  {selectedCategory && (
                    <>
                      {' '}
                      in <span className="highlight-cat">{selectedCategory}</span>
                    </>
                  )}
                  {selectedSkill && (
                    <>
                      {' '}
                      tagged with <span className="highlight-cat">#{selectedSkill}</span>
                    </>
                  )}
                </>
              )}
            </span>
          </div>

          {hasActiveFilters && (
            <button onClick={handleClearAllFilters} className="btn-clear-filter">
              Clear All Filters
            </button>
          )}
        </div>

        {/* Main Search Results Display */}
        {isLoading ? (
          /* Loading Skeletons */
          <div className={activeTab === 'videos' ? 'discover-grid' : 'creators-grid'}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={activeTab === 'videos' ? 'video-card-skeleton' : 'creator-card-skeleton'}>
                {activeTab === 'videos' ? (
                  <>
                    <div className="skeleton-thumb shimmer" />
                    <div className="skeleton-content">
                      <div className="skeleton-line title shimmer" />
                      <div className="skeleton-line meta shimmer" />
                      <div className="skeleton-footer">
                        <div className="skeleton-avatar shimmer" />
                        <div className="skeleton-line author shimmer" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="creator-skeleton-body">
                    <div className="skeleton-avatar shimmer" />
                    <div className="skeleton-line title shimmer" style={{ width: '60%', margin: '12px auto' }} />
                    <div className="skeleton-line meta shimmer" style={{ width: '40%', margin: '0 auto 16px auto' }} />
                    <div className="skeleton-line text shimmer" style={{ width: '80%', margin: '0 auto' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="glass-card search-empty-card error">
            <AlertCircle size={44} color="var(--status-error)" />
            <h3>Search Request Failed</h3>
            <p>{error}</p>
            <button onClick={executeSearch} className="btn btn-primary btn-sm">
              <RefreshCw size={15} />
              <span>Try Again</span>
            </button>
          </div>
        ) : results.length === 0 ? (
          /* Empty Results State */
          <div className="glass-card search-empty-card">
            <div className="empty-card-icon-wrap">
              {activeTab === 'videos' ? (
                <Film size={36} color="var(--accent-purple)" />
              ) : (
                <Users size={36} color="var(--accent-indigo)" />
              )}
            </div>

            <h3>No matching {activeTab === 'videos' ? 'showcases' : 'creators'} found</h3>
            <p>
              {queryText ? (
                <>
                  We couldn't find any {activeTab === 'videos' ? 'videos' : 'creators'} matching "
                  <strong>{queryText}</strong>". Try checking for typos, searching broader terms, or
                  exploring other categories.
                </>
              ) : (
                <>
                  No {activeTab === 'videos' ? 'showcases' : 'creators'} match the selected category
                  or skill filters.
                </>
              )}
            </p>

            <div className="search-empty-actions">
              {hasActiveFilters && (
                <button onClick={handleClearAllFilters} className="btn btn-secondary">
                  Clear Filters
                </button>
              )}
              <Link to="/discover" className="btn btn-primary">
                <Compass size={16} />
                <span>Explore Discover Feed</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Results Grid & Pagination */
          <>
            {activeTab === 'videos' ? (
              <div className="discover-grid">
                {results.map((video) => (
                  <VideoCard key={video._id} video={video} />
                ))}
              </div>
            ) : (
              <div className="creators-grid">
                {results.map((creator) => (
                  <CreatorCard key={creator._id} creator={creator} />
                ))}
              </div>
            )}

            {/* Pagination / Load More */}
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
                      <span>Loading more results...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More Results</span>
                      <span className="load-more-remaining">
                        ({total - results.length} remaining)
                      </span>
                    </>
                  )}
                </button>
              ) : (
                <div className="feed-end-message">
                  <span className="dot-end" />
                  <span>
                    You've reached the end of {total} matching {activeTab === 'videos' ? 'showcase' : 'creator'}
                    {total === 1 ? '' : 's'}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
