import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getOverview,
  getVideoAnalytics,
  getTopVideos,
  getFollowerAnalytics,
  getRecentActivity
} from '../services/analyticsService';
import {
  BarChart2,
  TrendingUp,
  Eye,
  Heart,
  MessageSquare,
  Bookmark,
  Users,
  UserCheck,
  Film,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Calendar,
  Award,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Activity,
  Percent,
  UploadCloud
} from 'lucide-react';

const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toLocaleString();
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const AnalyticsPage = () => {
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Analytics Data
  const [overview, setOverview] = useState(null);
  const [topVideos, setTopVideos] = useState([]);
  const [topVideosFormula, setTopVideosFormula] = useState('');
  const [followerPeriod, setFollowerPeriod] = useState('30d');
  const [followerStats, setFollowerStats] = useState(null);
  const [followerLoading, setFollowerLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  
  // Video Performance Pagination
  const [videosPage, setVideosPage] = useState(1);
  const [videoLimit] = useState(6);
  const [videoData, setVideoData] = useState({ videos: [], total: 0, totalPages: 1 });
  const [videosLoading, setVideosLoading] = useState(false);

  // Fetch all initial dashboard data
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [ovRes, topRes, folRes, actRes, vidRes] = await Promise.all([
        getOverview(),
        getTopVideos(),
        getFollowerAnalytics(followerPeriod),
        getRecentActivity(15),
        getVideoAnalytics(videosPage, videoLimit)
      ]);

      setOverview(ovRes.overview || ovRes);
      setTopVideos(topRes.topVideos || []);
      setTopVideosFormula(topRes.formula || 'views + (likes * 3) + (comments * 5) + (saves * 4)');
      setFollowerStats(folRes);
      setActivities(actRes.activities || []);
      setVideoData({
        videos: vidRes.videos || [],
        total: vidRes.total || 0,
        totalPages: vidRes.totalPages || 1
      });
    } catch (err) {
      console.error('Failed to load creator analytics:', err);
      setError(err.response?.data?.message || 'Failed to load creator analytics. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [followerPeriod, videosPage, videoLimit]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle Follower Period Change separately
  const handlePeriodChange = async (period) => {
    if (period === followerPeriod) return;
    setFollowerPeriod(period);
    setFollowerLoading(true);
    try {
      const res = await getFollowerAnalytics(period);
      setFollowerStats(res);
    } catch (err) {
      console.error('Failed to update follower period:', err);
    } finally {
      setFollowerLoading(false);
    }
  };

  // Handle Video Page Change
  const handlePageChange = async (newPage) => {
    if (newPage < 1 || newPage > videoData.totalPages || newPage === videosPage) return;
    setVideosPage(newPage);
    setVideosLoading(true);
    try {
      const res = await getVideoAnalytics(newPage, videoLimit);
      setVideoData({
        videos: res.videos || [],
        total: res.total || 0,
        totalPages: res.totalPages || 1
      });
    } catch (err) {
      console.error('Failed to paginate video analytics:', err);
    } finally {
      setVideosLoading(false);
    }
  };

  return (
    <div className="analytics-page">
      <div className="container">
        {/* Header */}
        <header className="analytics-header">
          <div className="analytics-title-group">
            <div className="analytics-badge">
              <BarChart2 size={15} />
              <span>Phase 8: Creator Analytics & Insights</span>
            </div>
            <h1>Creator Performance Dashboard</h1>
            <p className="analytics-subtitle">
              Real-time engagement telemetry, follower growth metrics, and showcase analytics for @{user?.username}.
            </p>
          </div>

          <div className="analytics-actions">
            <button
              onClick={() => fetchDashboardData(true)}
              className="btn btn-secondary btn-sm"
              disabled={refreshing || loading}
              title="Refresh Analytics Telemetry"
            >
              <RefreshCw size={14} className={refreshing ? 'spin-icon' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <Link to="/upload" className="btn btn-primary btn-sm">
              <UploadCloud size={14} />
              <span>New Showcase</span>
            </Link>
          </div>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="analytics-error-banner" role="alert">
            <AlertCircle size={18} />
            <div className="error-text">
              <strong>Unable to load analytics</strong>
              <p>{error}</p>
            </div>
            <button onClick={() => fetchDashboardData()} className="btn btn-secondary btn-sm">
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading ? (
          <div className="analytics-loading-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="analytics-skeleton-card" />
            ))}
          </div>
        ) : (
          <>
            {/* Section A: Overview Metrics Cards */}
            <section className="analytics-section">
              <div className="section-header">
                <h2>
                  <Activity size={18} /> Overview Performance
                </h2>
                <span className="section-note">Calculated across your published showcases only</span>
              </div>

              <div className="overview-cards-grid">
                {/* 1. Total Videos */}
                <div className="overview-card">
                  <div className="overview-card-header">
                    <span className="card-label">Published Showcases</span>
                    <div className="card-icon-wrapper video">
                      <Film size={18} />
                    </div>
                  </div>
                  <div className="card-value">{formatNumber(overview?.totalVideos || 0)}</div>
                  <div className="card-subtext">Active public portfolio</div>
                </div>

                {/* 2. Total Views */}
                <div className="overview-card">
                  <div className="overview-card-header">
                    <span className="card-label">Total Views</span>
                    <div className="card-icon-wrapper views">
                      <Eye size={18} />
                    </div>
                  </div>
                  <div className="card-value">{formatNumber(overview?.totalViews || 0)}</div>
                  <div className="card-subtext">Audience reach</div>
                </div>

                {/* 3. Total Likes */}
                <div className="overview-card">
                  <div className="overview-card-header">
                    <span className="card-label">Total Likes</span>
                    <div className="card-icon-wrapper likes">
                      <Heart size={18} />
                    </div>
                  </div>
                  <div className="card-value">{formatNumber(overview?.totalLikes || 0)}</div>
                  <div className="card-subtext">Community appreciation</div>
                </div>

                {/* 4. Total Comments */}
                <div className="overview-card">
                  <div className="overview-card-header">
                    <span className="card-label">Total Comments</span>
                    <div className="card-icon-wrapper comments">
                      <MessageSquare size={18} />
                    </div>
                  </div>
                  <div className="card-value">{formatNumber(overview?.totalComments || 0)}</div>
                  <div className="card-subtext">Audience conversations</div>
                </div>

                {/* 5. Total Saves */}
                <div className="overview-card">
                  <div className="overview-card-header">
                    <span className="card-label">Total Bookmarks</span>
                    <div className="card-icon-wrapper saves">
                      <Bookmark size={18} />
                    </div>
                  </div>
                  <div className="card-value">{formatNumber(overview?.totalSaves || 0)}</div>
                  <div className="card-subtext">Saved by discovery scouts</div>
                </div>

                {/* 6. Total Followers */}
                <div className="overview-card">
                  <div className="overview-card-header">
                    <span className="card-label">Followers</span>
                    <div className="card-icon-wrapper followers">
                      <Users size={18} />
                    </div>
                  </div>
                  <div className="card-value">{formatNumber(overview?.totalFollowers || 0)}</div>
                  <div className="card-subtext">Following {overview?.totalFollowing || 0} creators</div>
                </div>
              </div>
            </section>

            {/* Section D: Engagement Deep-Dive */}
            <section className="analytics-section">
              <div className="engagement-summary-banner">
                <div className="engagement-metric-box">
                  <div className="metric-pill">
                    <TrendingUp size={16} />
                    <span>Platform Engagement Rate</span>
                  </div>
                  <div className="big-rate">
                    {overview?.engagementRate ?? 0}%
                  </div>
                  <p className="metric-formula-explanation">
                    Formula: (Likes + Comments + Saves) / Views × 100
                  </p>
                </div>

                <div className="interactions-breakdown">
                  <div className="breakdown-title">
                    <span>Total Social Interactions</span>
                    <strong>{formatNumber(overview?.totalInteractions || 0)}</strong>
                  </div>
                  <div className="interaction-bar-container">
                    {overview?.totalInteractions > 0 ? (
                      <>
                        <div
                          className="interaction-bar-segment likes"
                          style={{
                            width: `${((overview?.totalLikes || 0) / overview.totalInteractions) * 100}%`
                          }}
                          title={`Likes: ${overview?.totalLikes || 0}`}
                        />
                        <div
                          className="interaction-bar-segment comments"
                          style={{
                            width: `${((overview?.totalComments || 0) / overview.totalInteractions) * 100}%`
                          }}
                          title={`Comments: ${overview?.totalComments || 0}`}
                        />
                        <div
                          className="interaction-bar-segment saves"
                          style={{
                            width: `${((overview?.totalSaves || 0) / overview.totalInteractions) * 100}%`
                          }}
                          title={`Saves: ${overview?.totalSaves || 0}`}
                        />
                      </>
                    ) : (
                      <div className="interaction-bar-segment empty" style={{ width: '100%' }} />
                    )}
                  </div>
                  <div className="interaction-legend">
                    <span className="legend-item likes">
                      <span className="dot" /> Likes ({overview?.totalLikes || 0})
                    </span>
                    <span className="legend-item comments">
                      <span className="dot" /> Comments ({overview?.totalComments || 0})
                    </span>
                    <span className="legend-item saves">
                      <span className="dot" /> Saves ({overview?.totalSaves || 0})
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Two Column Layout: Top Videos & Follower Growth */}
            <div className="analytics-two-columns">
              {/* Section B: Top-Performing Videos */}
              <section className="analytics-column">
                <div className="section-header">
                  <h2>
                    <Award size={18} /> Top-Performing Showcases
                  </h2>
                  <span className="formula-badge" title="Statistical engagement calculation, not AI recommendation">
                    Score: {topVideosFormula}
                  </span>
                </div>

                {topVideos.length === 0 ? (
                  <div className="analytics-empty-box">
                    <Film size={32} />
                    <p>No published showcases yet.</p>
                    <Link to="/upload" className="btn btn-secondary btn-sm">
                      Upload your first showcase
                    </Link>
                  </div>
                ) : (
                  <div className="top-videos-list">
                    {topVideos.map((item, index) => (
                      <div key={item.video?.id || index} className="top-video-card">
                        <div className="rank-badge">#{index + 1}</div>
                        <Link to={`/v/${item.video?._id}`} className="top-video-thumb-link">
                          {item.video?.thumbnailUrl ? (
                            <img
                              src={item.video.thumbnailUrl}
                              alt={item.video?.title}
                              className="top-video-thumb"
                            />
                          ) : (
                            <div className="top-video-thumb-placeholder">
                              <Film size={20} />
                            </div>
                          )}
                        </Link>
                        <div className="top-video-info">
                          <Link to={`/v/${item.video?._id}`} className="top-video-title">
                            {item.video?.title}
                          </Link>
                          <div className="top-video-category">{item.video?.category}</div>
                          <div className="top-video-stats">
                            <span><Eye size={12} /> {formatNumber(item.views)}</span>
                            <span><Heart size={12} /> {formatNumber(item.likes)}</span>
                            <span><MessageSquare size={12} /> {formatNumber(item.comments)}</span>
                            <span><Bookmark size={12} /> {formatNumber(item.saves)}</span>
                          </div>
                        </div>
                        <div className="top-video-score">
                          <span className="score-number">{formatNumber(item.engagementScore)}</span>
                          <span className="score-label">Score</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Section C: Follower Analytics */}
              <section className="analytics-column">
                <div className="section-header">
                  <h2>
                    <Users size={18} /> Follower Growth
                  </h2>
                  <div className="period-selector-chips">
                    {['7d', '30d', '90d', 'all'].map((p) => (
                      <button
                        key={p}
                        className={`period-chip ${followerPeriod === p ? 'active' : ''}`}
                        onClick={() => handlePeriodChange(p)}
                        disabled={followerLoading}
                      >
                        {p.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="follower-summary-cards">
                  <div className="follower-mini-card">
                    <span className="mini-label">Total Followers</span>
                    <strong className="mini-val">{formatNumber(followerStats?.currentFollowers || 0)}</strong>
                  </div>
                  <div className="follower-mini-card">
                    <span className="mini-label">New in {followerPeriod.toUpperCase()}</span>
                    <strong className="mini-val highlight">+{formatNumber(followerStats?.newFollowers || 0)}</strong>
                  </div>
                  <div className="follower-mini-card">
                    <span className="mini-label">Following</span>
                    <strong className="mini-val">{formatNumber(followerStats?.currentFollowing || 0)}</strong>
                  </div>
                </div>

                {/* Follower Growth Chart (Pure SVG, 0 dependency bloat, no fake data) */}
                <div className="follower-chart-container">
                  <div className="chart-header-info">
                    <span>Daily New Followers ({followerPeriod.toUpperCase()})</span>
                  </div>

                  {followerLoading ? (
                    <div className="chart-loading-state">
                      <RefreshCw size={20} className="spin-icon" />
                      <span>Updating period data...</span>
                    </div>
                  ) : followerStats?.growthHistory && followerStats.growthHistory.length > 0 ? (
                    <div className="svg-chart-wrapper">
                      {/* Responsive SVG Bar Chart */}
                      <svg
                        viewBox="0 0 400 160"
                        className="follower-growth-svg"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
                          </linearGradient>
                        </defs>
                        {/* Horizontal grid lines */}
                        <line x1="10" y1="30" x2="390" y2="30" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                        <line x1="10" y1="80" x2="390" y2="80" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                        <line x1="10" y1="130" x2="390" y2="130" stroke="rgba(255,255,255,0.08)" />

                        {(() => {
                          const history = followerStats.growthHistory;
                          const maxCount = Math.max(...history.map((h) => h.newFollowers), 1);
                          const totalBars = history.length;
                          const barWidth = Math.min(28, Math.max(8, (360 / totalBars) * 0.7));
                          const step = 360 / totalBars;

                          return history.map((item, idx) => {
                            const barHeight = Math.max(4, (item.newFollowers / maxCount) * 95);
                            const x = 20 + idx * step + (step - barWidth) / 2;
                            const y = 130 - barHeight;

                            return (
                              <g key={item.date} className="chart-bar-group">
                                <rect
                                  x={x}
                                  y={y}
                                  width={barWidth}
                                  height={barHeight}
                                  rx="4"
                                  fill="url(#barGradient)"
                                  className="growth-bar"
                                />
                                <text
                                  x={x + barWidth / 2}
                                  y={y - 5}
                                  textAnchor="middle"
                                  fill="#cbd5e1"
                                  fontSize="9"
                                  fontWeight="600"
                                >
                                  {item.newFollowers}
                                </text>
                                <text
                                  x={x + barWidth / 2}
                                  y={145}
                                  textAnchor="middle"
                                  fill="#64748b"
                                  fontSize="8"
                                >
                                  {item.date ? item.date.slice(5) : ''}
                                </text>
                              </g>
                            );
                          });
                        })()}
                      </svg>
                    </div>
                  ) : (
                    <div className="chart-empty-state">
                      <Users size={28} />
                      <p>No new followers recorded during this {followerPeriod.toUpperCase()} period.</p>
                      <span className="sub">Real historical data will appear here as users follow your profile.</span>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Section E: Recent Activity Stream */}
            <section className="analytics-section">
              <div className="section-header">
                <h2>
                  <Activity size={18} /> Recent Creator Interactions
                </h2>
                <span className="section-note">Last 15 engagements on your portfolio</span>
              </div>

              {activities.length === 0 ? (
                <div className="analytics-empty-box">
                  <Activity size={32} />
                  <p>No recent activity yet. When fans interact with your showcases, you'll see them here.</p>
                </div>
              ) : (
                <div className="activity-stream-grid">
                  {activities.map((act) => (
                    <div key={act.id || act._id} className="activity-card">
                      <div className="activity-sender">
                        {act.sender?.profileImage ? (
                          <img
                            src={act.sender.profileImage}
                            alt={act.sender.displayName}
                            className="activity-avatar"
                          />
                        ) : (
                          <div className="activity-avatar-placeholder">
                            {act.sender?.displayName?.[0] || 'U'}
                          </div>
                        )}
                        <div className="activity-sender-meta">
                          <Link to={`/u/${act.sender?.username}`} className="activity-sender-name">
                            {act.sender?.displayName || 'Anonymous'}
                          </Link>
                          <span className="activity-time">{formatTimeAgo(act.createdAt)}</span>
                        </div>
                      </div>

                      <div className="activity-message">
                        <span className={`activity-type-badge ${act.type.toLowerCase()}`}>
                          {act.type}
                        </span>
                        <p>{act.message}</p>
                      </div>

                      {act.video && (
                        <Link to={`/v/${act.video._id}`} className="activity-video-preview">
                          {act.video.thumbnailUrl && (
                            <img src={act.video.thumbnailUrl} alt={act.video.title} />
                          )}
                          <span className="activity-video-title">{act.video.title}</span>
                        </Link>
                      )}

                      {act.comment && (
                        <div className="activity-comment-snippet">
                          "{act.comment.text}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Section F: Video Performance Details Table */}
            <section className="analytics-section">
              <div className="section-header">
                <h2>
                  <Film size={18} /> Showcase Performance Telemetry
                </h2>
                <span className="section-note">
                  Showing {videoData.videos.length} of {videoData.total} published showcases
                </span>
              </div>

              {videosLoading ? (
                <div className="analytics-loading-box">
                  <RefreshCw size={24} className="spin-icon" />
                  <p>Loading showcases...</p>
                </div>
              ) : videoData.videos.length === 0 ? (
                <div className="analytics-empty-box">
                  <Film size={36} />
                  <p>No published showcases found in your portfolio.</p>
                  <Link to="/upload" className="btn btn-primary btn-sm">
                    Upload Your First Showcase
                  </Link>
                </div>
              ) : (
                <div className="video-performance-table-wrapper">
                  <table className="video-performance-table">
                    <thead>
                      <tr>
                        <th>Showcase</th>
                        <th>Category</th>
                        <th>Views</th>
                        <th>Likes</th>
                        <th>Comments</th>
                        <th>Saves</th>
                        <th>Engagement</th>
                        <th>Score</th>
                        <th>Published</th>
                      </tr>
                    </thead>
                    <tbody>
                      {videoData.videos.map((vid) => (
                        <tr key={vid.id || vid._id}>
                          <td className="showcase-cell">
                            <Link to={`/v/${vid._id}`} className="showcase-cell-link">
                              {vid.thumbnailUrl ? (
                                <img src={vid.thumbnailUrl} alt={vid.title} className="table-thumb" />
                              ) : (
                                <div className="table-thumb-placeholder"><Film size={14} /></div>
                              )}
                              <span className="table-title">{vid.title}</span>
                            </Link>
                          </td>
                          <td>
                            <span className="table-category-tag">{vid.category}</span>
                          </td>
                          <td className="num-cell">{formatNumber(vid.views)}</td>
                          <td className="num-cell">{formatNumber(vid.likes)}</td>
                          <td className="num-cell">{formatNumber(vid.comments)}</td>
                          <td className="num-cell">{formatNumber(vid.saves)}</td>
                          <td className="num-cell highlight-rate">
                            {vid.engagementRate}%
                          </td>
                          <td className="num-cell score-cell">
                            {formatNumber(vid.engagementScore)}
                          </td>
                          <td className="date-cell">
                            {new Date(vid.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination Controls */}
                  {videoData.totalPages > 1 && (
                    <div className="analytics-pagination">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handlePageChange(videosPage - 1)}
                        disabled={videosPage <= 1 || videosLoading}
                      >
                        <ChevronLeft size={16} />
                        <span>Previous</span>
                      </button>
                      <span className="pagination-info">
                        Page {videosPage} of {videoData.totalPages}
                      </span>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handlePageChange(videosPage + 1)}
                        disabled={videosPage >= videoData.totalPages || videosLoading}
                      >
                        <span>Next</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
