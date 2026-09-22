import React from 'react';
import { Sparkles, Layers } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <div className="brand">
          <div className="brand-icon">
            <Sparkles size={22} />
          </div>
          <span>Spotly</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="nav-tag">
            <Layers size={13} style={{ marginRight: '5px', verticalAlign: '-1px' }} />
            Phase 1: Foundation
          </span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
