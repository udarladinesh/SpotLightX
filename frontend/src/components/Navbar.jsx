import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  User, 
  LogOut, 
  Settings, 
  LogIn, 
  UserPlus, 
  ChevronDown,
  Layers,
  ExternalLink,
  Upload,
  Film,
  Bookmark,
  Compass,
  Search,
  Bell,
  BarChart2,
  Menu,
  X
} from 'lucide-react';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown and mobile menu on route change
  useEffect(() => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username || 'spotly'}`;
  const avatarUrl = user?.profileImage || defaultAvatar;

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        {/* Brand & Main Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/" className="brand" aria-label="Spotly Home">
            <div className="brand-icon">
              <Sparkles size={22} />
            </div>
            <span>Spotly</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="navbar-links-group hide-mobile">
            <Link
              to="/discover"
              className={`navbar-main-link ${location.pathname === '/discover' ? 'active' : ''}`}
            >
              <Compass size={17} />
              <span>Discover</span>
            </Link>

            <Link
              to="/search"
              className={`navbar-main-link ${location.pathname === '/search' ? 'active' : ''}`}
            >
              <Search size={17} />
              <span>Search</span>
            </Link>

            {isAuthenticated && (
              <Link
                to="/analytics"
                className={`navbar-main-link ${location.pathname === '/analytics' ? 'active' : ''}`}
              >
                <BarChart2 size={17} />
                <span>Analytics</span>
              </Link>
            )}
          </div>
        </div>

        {/* Navigation & Auth Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Platform Identity Badge */}
          <span className="nav-tag hide-mobile">
            <Layers size={13} style={{ marginRight: '5px', verticalAlign: '-1px' }} />
            Talent Discovery
          </span>

          {isAuthenticated ? (
            /* Logged In User Actions */
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Notification Bell */}
              <NotificationBell />

              {/* Upload CTA */}
              <Link to="/upload" className="btn btn-primary btn-sm hide-small-mobile">
                <Upload size={14} />
                <span>Upload</span>
              </Link>

              {/* User Dropdown */}
              <div className="user-menu-container" ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="user-nav-btn"
                  aria-expanded={dropdownOpen}
                  aria-label="User profile and menu"
                >
                  <img 
                    src={avatarUrl} 
                    alt={user?.displayName || 'User Avatar'} 
                    className="nav-avatar"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = defaultAvatar;
                    }}
                  />
                  <span className="nav-username hide-small-mobile">{user?.displayName || user?.username}</span>
                  <ChevronDown size={15} color="var(--text-secondary)" />
                </button>

                {dropdownOpen && (
                  <div className="user-dropdown-menu">
                    <div className="dropdown-user-info">
                      <p className="dropdown-name">{user?.displayName}</p>
                      <p className="dropdown-handle">@{user?.username}</p>
                    </div>
                    
                    <div className="dropdown-divider" />

                    <Link to="/notifications" className="dropdown-item">
                      <Bell size={16} />
                      <span>Notifications</span>
                    </Link>

                    <Link to="/analytics" className="dropdown-item">
                      <BarChart2 size={16} />
                      <span>Creator Analytics</span>
                    </Link>

                    <Link to="/search" className="dropdown-item">
                      <Search size={16} />
                      <span>Search Talent</span>
                    </Link>

                    <Link to="/discover" className="dropdown-item">
                      <Compass size={16} />
                      <span>Discover Feed</span>
                    </Link>

                    <Link to="/profile" className="dropdown-item">
                      <User size={16} />
                      <span>My Profile</span>
                    </Link>

                    <Link to="/my-videos" className="dropdown-item">
                      <Film size={16} />
                      <span>My Videos</span>
                    </Link>

                    <Link to="/saved-videos" className="dropdown-item">
                      <Bookmark size={16} />
                      <span>Saved Showcases</span>
                    </Link>

                    <Link to={`/u/${user?.username}`} className="dropdown-item">
                      <ExternalLink size={16} />
                      <span>Public View</span>
                    </Link>

                    <Link to="/profile/edit" className="dropdown-item">
                      <Settings size={16} />
                      <span>Edit Profile</span>
                    </Link>

                    <div className="dropdown-divider" />

                    <button onClick={handleLogout} className="dropdown-item logout-btn">
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Logged Out Buttons */
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                <LogIn size={15} />
                <span>Sign In</span>
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm hide-small-mobile">
                <UserPlus size={15} />
                <span>Join</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="mobile-menu-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <>
          <div className="mobile-nav-backdrop" onClick={() => setMobileMenuOpen(false)} />
          <div className="mobile-nav-drawer" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
            <div className="mobile-nav-header">
              <Link to="/" className="brand" onClick={() => setMobileMenuOpen(false)}>
                <div className="brand-icon">
                  <Sparkles size={18} />
                </div>
                <span>Spotly</span>
              </Link>
              <button
                type="button"
                className="mobile-nav-close-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {isAuthenticated && user && (
              <div className="mobile-nav-user-card">
                <img
                  src={avatarUrl}
                  alt={user?.displayName || 'Avatar'}
                  className="mobile-nav-avatar"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = defaultAvatar;
                  }}
                />
                <div>
                  <div className="mobile-nav-user-name">{user?.displayName}</div>
                  <div className="mobile-nav-user-handle">@{user?.username}</div>
                </div>
              </div>
            )}

            <div className="mobile-nav-links">
              <Link
                to="/discover"
                className={`mobile-nav-link ${location.pathname === '/discover' ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Compass size={18} />
                <span>Discover Feed</span>
              </Link>

              <Link
                to="/search"
                className={`mobile-nav-link ${location.pathname === '/search' ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Search size={18} />
                <span>Search Talent & Showcases</span>
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/upload"
                    className={`mobile-nav-link ${location.pathname === '/upload' ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Upload size={18} />
                    <span>Upload Showcase</span>
                  </Link>

                  <Link
                    to="/analytics"
                    className={`mobile-nav-link ${location.pathname === '/analytics' ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <BarChart2 size={18} />
                    <span>Creator Analytics</span>
                  </Link>

                  <Link
                    to="/notifications"
                    className={`mobile-nav-link ${location.pathname === '/notifications' ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Bell size={18} />
                    <span>Notifications</span>
                  </Link>

                  <Link
                    to="/profile"
                    className={`mobile-nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User size={18} />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/my-videos"
                    className={`mobile-nav-link ${location.pathname === '/my-videos' ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Film size={18} />
                    <span>My Showcases</span>
                  </Link>

                  <Link
                    to="/saved-videos"
                    className={`mobile-nav-link ${location.pathname === '/saved-videos' ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Bookmark size={18} />
                    <span>Saved Bookmarks</span>
                  </Link>

                  <Link
                    to="/profile/edit"
                    className={`mobile-nav-link ${location.pathname === '/profile/edit' ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings size={18} />
                    <span>Edit Profile Settings</span>
                  </Link>

                  <div className="mobile-nav-divider" />

                  <button type="button" onClick={handleLogout} className="mobile-nav-link mobile-logout-btn">
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <div className="mobile-nav-auth-actions">
                  <Link
                    to="/login"
                    className="btn btn-secondary btn-block"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LogIn size={16} />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary btn-block"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <UserPlus size={16} />
                    <span>Join Spotly</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;
