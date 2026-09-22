import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HealthWidget from './components/HealthWidget';
import CategoriesPreview from './components/CategoriesPreview';
import Footer from './components/Footer';

function App() {
  return (
    <div className="app">
      <Navbar />
      <main>
        <Hero />
        <HealthWidget />
        <CategoriesPreview />
      </main>
      <Footer />
    </div>
  );
}

export default App;
