import React from 'react';
import { Compass, Flame } from 'lucide-react';

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
          <a href="#health-status" className="btn btn-primary">
            <Flame size={18} />
            System Health Monitor
          </a>
          <a href="#categories" className="btn btn-secondary">
            <Compass size={18} />
            Explore Talent Categories
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
