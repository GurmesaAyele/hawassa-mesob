import { useState } from 'react';
import Navbar from '../components/Navbar';
import logo from '../assets/images/messob_logo.png';
import heroImg from '../assets/hero.png';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${heroImg})`,
        }}
      >
        <div className="absolute inset-0 bg-[#3d5a99]/70"></div>
      </div>

      <Navbar />
      
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center pt-14">
        <div className="max-w-4xl mx-auto px-6 text-center">
          {/* Logo and Title */}
          <div className="flex flex-col items-center mb-10">
            <div className="flex items-center gap-6 mb-6">
              <img 
                src={logo} 
                alt="Hawassa Mesob Logo" 
                className="w-32 h-32 animate-spin-slow"
              />
              <div className="text-left">
                <h1 className="text-5xl font-bold text-white leading-tight">
                      ሀዋሳ መሶብ
                </h1>
                <h2 className="text-4xl font-bold text-white mt-1">
                  HAWASSA MESOB
                </h2>
              </div>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
            All Services, One Place
          </h1>

          {/* Subtitle */}
          <p className="text-2xl text-white mb-4">
            Serving Hawassa City Residents
          </p>

          {/* Description */}
          <p className="text-lg text-white/90 mb-12">
            Access multiple city services faster, efficiently, and under one roof
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for Services or Organizations"
                className="w-full px-6 py-4 pr-14 rounded-full bg-[#4a6bb5]/80 text-white placeholder-white/70 border-none focus:outline-none focus:ring-2 focus:ring-white/30 text-base"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full hover:bg-white/10 transition-colors"
              >
                <svg 
                  className="w-5 h-5 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2.5} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Home;
