import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { servicesData } from '../../data';
import { ROUTES } from '../../utils/constants';

const Hero = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const filtered = servicesData
        .filter(service => 
          service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
        .map(service => ({
          ...service,
          title: service.name,
        }));
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`${ROUTES.SERVICES}?search=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    navigate(`/services/${suggestion.id}`);
    setShowSuggestions(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop")',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-800/85 to-blue-900/90"></div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo and Title */}
          <div className="flex flex-col items-center mb-8">
            {/* MESOB Logo */}
            <div className="w-32 h-32 mb-6">
              <div className="w-full h-full rounded-full border-8 border-yellow-500 bg-white bg-opacity-10 p-2 flex items-center justify-center relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-white">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="50" cy="50" r="4" fill="currentColor"/>
                    {[...Array(16)].map((_, i) => {
                      const angle = (i * 22.5 - 90) * (Math.PI / 180);
                      const x1 = 50 + 30 * Math.cos(angle);
                      const y1 = 50 + 30 * Math.sin(angle);
                      const x2 = 50 + 38 * Math.cos(angle);
                      const y2 = 50 + 38 * Math.sin(angle);
                      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="2"/>;
                    })}
                  </svg>
                </div>
              </div>
            </div>

            {/* Amharic Text */}
            <div className="text-white text-2xl md:text-3xl mb-2 font-light tracking-wide">
              አዲስ መሶብ
            </div>

            {/* ADDIS MESOB */}
            <h1 className="text-white text-4xl md:text-5xl font-bold mb-2 tracking-wide">
              ADDIS MESOB
            </h1>
          </div>

          {/* Main Heading */}
          <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            All Services, One Place
          </h2>

          {/* Subtitle */}
          <p className="text-white text-lg md:text-xl mb-3 opacity-95">
            Serving Addis Ababa City Residents
          </p>

          {/* Description */}
          <p className="text-white text-base md:text-lg mb-10 opacity-90 max-w-3xl mx-auto">
            Access multiple city services faster, efficiently, and under one roof
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Search for Services or Organizations"
                className="w-full px-6 py-4 pr-14 bg-white bg-opacity-95 hover:bg-opacity-100 text-gray-800 placeholder-gray-500 rounded-full text-base focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all shadow-lg"
              />
              <button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors"
                aria-label="Search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl max-h-96 overflow-y-auto">
                <ul className="py-2">
                  {suggestions.map((suggestion) => (
                    <li
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-3"
                    >
                      <span className="text-2xl">{suggestion.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{suggestion.name}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">{suggestion.description}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
