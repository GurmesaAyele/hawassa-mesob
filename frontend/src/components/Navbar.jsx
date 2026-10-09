import { Link } from 'react-router-dom';
import { useState } from 'react';
import logo from '../assets/images/messob_logo.png';

const Navbar = () => {
  const [language, setLanguage] = useState('English');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#3d5a99]/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={logo} 
              alt="Hawassa Mesob Logo" 
              className="h-9 w-9 animate-spin-slow"
            />
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            <Link 
              to="/" 
              className="text-[#ffd54f] px-4 py-2 text-[15px] font-normal hover:bg-white/5 transition-colors"
            >
              Home
            </Link>
            <Link 
              to="/institutions" 
              className="text-white px-4 py-2 text-[15px] font-normal hover:bg-white/5 transition-colors"
            >
              Institutions
            </Link>
            <Link 
              to="/services" 
              className="text-white px-4 py-2 text-[15px] font-normal hover:bg-white/5 transition-colors"
            >
              Services
            </Link>
            <Link 
              to="/contact" 
              className="text-white px-4 py-2 text-[15px] font-normal hover:bg-white/5 transition-colors"
            >
              Contact
            </Link>
            <Link 
              to="/service-catalogue" 
              className="text-white px-4 py-2 text-[15px] font-normal hover:bg-white/5 transition-colors"
            >
              Service Catalogue
            </Link>
            <Link 
              to="/about-us" 
              className="text-white px-4 py-2 text-[15px] font-normal hover:bg-white/5 transition-colors"
            >
              About Us
            </Link>
          </div>

          {/* Right side icons */}
          <div className="flex items-center gap-2">
            {/* Sun Icon */}
            <button className="p-2 rounded-full bg-[#ffd54f] hover:bg-[#ffed4e] transition-colors">
              <svg 
                className="w-5 h-5 text-[#3d5a99]" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" 
                  clipRule="evenodd" 
                />
              </svg>
            </button>

            {/* Language Selector */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#8b6f47] text-white hover:bg-[#9d7e54] transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" 
                  clipRule="evenodd" 
                />
              </svg>
              <span className="text-sm">{language}</span>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path 
                  fillRule="evenodd" 
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                  clipRule="evenodd" 
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
