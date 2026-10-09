import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Flame, Sparkles, Search } from 'lucide-react';

const Hero = () => {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-pill">
          <span className="dot"></span>
          <span>Next-Gen Discovery-First Video Platform</span>
        </div>

        <h1 className="hero-title">
          Where Emerging Talent <br />
          <span className="gradient-text">Takes Center Stage</span>
        </h1>

        <p className="hero-description">
          Spotly is built to break the barrier for rising creators. Powered by a transparent, 
          freshness-first discovery cycle, new voices in dance, music, code, art, and performance 
          get fair visibility without algorithm bias.
        </p>

        <div className="hero-cta-group">
          <Link to="/search" className="btn btn-primary">
            <Search size={18} />
            Search Showcases & Creators
          </Link>
          <Link to="/discover" className="btn btn-secondary">
            <Compass size={18} />
            Explore Discover Feeds
          </Link>
          <a href="#categories" className="btn btn-glass">
            <Sparkles size={18} />
            Categories
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;

