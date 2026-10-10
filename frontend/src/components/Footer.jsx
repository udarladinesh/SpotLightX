import React from 'react';
import { Sparkles, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="#8b5cf6" />
          <span style={{ fontWeight: 700, color: '#ffffff' }}>Spotly</span>
          <span>&copy; {new Date().getFullYear()} — Where Emerging Talent Takes Center Stage</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="footer-phase-badge">Spotly Platform • Talent Discovery</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
