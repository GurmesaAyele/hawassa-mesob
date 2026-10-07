import React from 'react';
import Hero from '../components/home/Hero';
import ServiceCategories from '../components/home/ServiceCategories';
import PopularServices from '../components/home/PopularServices';
import HowItWorks from '../components/home/HowItWorks';

const HomePage = () => {
  return (
    <div>
      <Hero />
      <ServiceCategories />
      <PopularServices />
      <HowItWorks />
    </div>
  );
};

export default HomePage;
