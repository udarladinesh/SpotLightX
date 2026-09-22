import React from 'react';
import { 
  Sparkles, 
  Mic2, 
  Tv, 
  Palette, 
  Music, 
  Camera, 
  Radio, 
  Code2, 
  Compass, 
  Award 
} from 'lucide-react';

const categories = [
  {
    name: 'Dance & Movement',
    desc: 'Hip hop, contemporary, classical, fusion, freestyle',
    icon: Sparkles,
    color: '#8b5cf6'
  },
  {
    name: 'Singing & Vocals',
    desc: 'Acoustic covers, originals, classical, indie vocals',
    icon: Mic2,
    color: '#ec4899'
  },
  {
    name: 'Acting & Drama',
    desc: 'Monologues, theatrical scenes, voice acting, skits',
    icon: Tv,
    color: '#06b6d4'
  },
  {
    name: 'Choreography',
    desc: 'Original routines, stage directing, group choreography',
    icon: Compass,
    color: '#f59e0b'
  },
  {
    name: 'Art & Design',
    desc: 'Digital illustration, canvas painting, 3D animation, concept art',
    icon: Palette,
    color: '#10b981'
  },
  {
    name: 'Music & Production',
    desc: 'Beatmaking, instrumental performance, sound design',
    icon: Music,
    color: '#6366f1'
  },
  {
    name: 'Photography & Film',
    desc: 'Cinematography, short reels, lighting artistry, visual stories',
    icon: Camera,
    color: '#3b82f6'
  },
  {
    name: 'Public Speaking',
    desc: 'Debates, storytelling, spoken word poetry, keynotes',
    icon: Radio,
    color: '#eab308'
  },
  {
    name: 'Tech & Programming',
    desc: 'Creative coding, software demos, robotics, game dev showcases',
    icon: Code2,
    color: '#14b8a6'
  },
  {
    name: 'Creative Performance',
    desc: 'Magic, acrobatics, stand-up comedy, multi-disciplinary art',
    icon: Award,
    color: '#f43f5e'
  }
];

const CategoriesPreview = () => {
  return (
    <section id="categories" className="categories-section">
      <div className="container">
        <div className="section-header">
          <div className="section-tag">Platform Categories</div>
          <h2 className="section-title">Built for Diverse Creative Disciplines</h2>
          <p className="section-subtitle">
            Every skill has a home on Spotly. From performing arts to creative engineering, 
            creators get discovered through structured categories and skill tags.
          </p>
        </div>

        <div className="categories-grid">
          {categories.map((cat, index) => {
            const IconComponent = cat.icon;
            return (
              <div key={index} className="category-card">
                <div 
                  className="category-icon-wrap" 
                  style={{ 
                    backgroundColor: `${cat.color}18`, 
                    color: cat.color 
                  }}
                >
                  <IconComponent size={22} />
                </div>
                <div className="category-name">{cat.name}</div>
                <div className="category-desc">{cat.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoriesPreview;
