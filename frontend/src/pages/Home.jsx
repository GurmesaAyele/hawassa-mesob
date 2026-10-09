import { useState } from 'react';
import Navbar from '../components/Navbar';
import logo from '../assets/images/messob_logo.png';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    // Handle search functionality
    console.log('Searching for:', searchQuery);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3d5a99] to-[#2a4073]">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Background overlay */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
        
        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Logo and Title */}
          <div className="flex flex-col items-center mb-8">
            <img 
              src={logo} 
              alt="Hawassa Mesob Logo" 
              className="w-32 h-32 mb-6 animate-spin-slow"
            />
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-bold text-white">
                አዲስ መሶብ
              </h1>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                HAWASSA MESOB
              </h2>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            All Services, One Place
          </h1>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-white mb-4">
            Serving Hawassa City Residents
          </p>

          {/* Description */}
          <p className="text-base sm:text-lg text-white/90 mb-12 max-w-2xl mx-auto">
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
                className="w-full px-6 py-4 rounded-full bg-[#4a6bb5]/80 backdrop-blur-sm text-white placeholder-white/70 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
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
                    strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>
    </div>
  );
};

export default Home;
