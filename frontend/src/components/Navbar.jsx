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
  BarChart2
} from 'lucide-react';
import NotificationBell from './NotificationBell';


const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
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

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const avatarUrl = user?.profileImage || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username || 'spotly'}`;

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        {/* Brand & Main Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link to="/" className="brand">
            <div className="brand-icon">
              <Sparkles size={22} />
            </div>
            <span>Spotly</span>
          </Link>

          {/* Discover Main Link */}
          <Link
            to="/discover"
            className={`navbar-main-link ${location.pathname === '/discover' ? 'active' : ''}`}
          >
            <Compass size={17} />
            <span>Discover</span>
          </Link>

          {/* Search Main Link */}
          <Link
            to="/search"
            className={`navbar-main-link ${location.pathname === '/search' ? 'active' : ''}`}
          >
            <Search size={17} />
            <span>Search</span>
          </Link>

          {/* Analytics Main Link (Authenticated Creators) */}
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

        {/* Navigation & Auth Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Phase Badge */}
          <span className="nav-tag hide-mobile">
            <Layers size={13} style={{ marginRight: '5px', verticalAlign: '-1px' }} />
            Phase 8: Creator Analytics
          </span>

          {isAuthenticated ? (
            /* Logged In User Actions */
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Notification Bell */}
              <NotificationBell />

              {/* Upload CTA */}
              <Link to="/upload" className="btn btn-primary btn-sm">
                <Upload size={14} />
                <span>Upload</span>
              </Link>

              {/* User Dropdown */}
              <div className="user-menu-container" ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="user-nav-btn"
                  aria-expanded={dropdownOpen}
                >
                  <img 
                    src={avatarUrl} 
                    alt={user?.displayName || 'User Avatar'} 
                    className="nav-avatar"
                  />
                  <span className="nav-username">{user?.displayName || user?.username}</span>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                <LogIn size={15} />
                <span>Sign In</span>
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <UserPlus size={15} />
                <span>Join Spotly</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
