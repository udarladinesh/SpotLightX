import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Sparkles } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>
      <div className="glass-card" style={{ maxWidth: '520px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'rgba(99, 102, 241, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          color: 'var(--accent-purple)'
        }}>
          <Compass size={32} />
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>404</h1>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '12px' }}>
          Page Not Found
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '0.95rem' }}>
          The page or creator you are looking for does not exist or has taken another stage.
        </p>
        <Link to="/" className="btn btn-primary">
          <Sparkles size={16} />
          <span>Back to Spotly Discovery</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
