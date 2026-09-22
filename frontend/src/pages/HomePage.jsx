import React from 'react';
import Hero from '../components/Hero';
import HealthWidget from '../components/HealthWidget';
import CategoriesPreview from '../components/CategoriesPreview';

const HomePage = () => {
  return (
    <div>
      <Hero />
      <HealthWidget />
      <CategoriesPreview />
    </div>
  );
};

export default HomePage;
