import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/images/messob_logo.png';

const Navbar = () => {
  const [language, setLanguage] = useState('English');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showAboutDropdown, setShowAboutDropdown] = useState(false);
  const [darkMode, setDarkMode] = useState(true); // Default to true (dark mode on)
  const navigate = useNavigate();
  const location = useLocation();

  const languages = ['English', 'Amharic', 'Sidama'];

  // Translations for navbar
  const translations = {
    English: {
      home: 'Home',
      institutions: 'Institutions',
      services: 'Services',
      contact: 'Contact',
      serviceCatalogue: 'Service Catalogue',
      about: 'About',
      aboutUs: 'About Us',
      news: 'News',
      videos: 'Videos',
      announcements: 'Announcements'
    },
    Amharic: {
      home: 'ዋና ገጽ',
      institutions: 'ተቋማት',
      services: 'አገልግሎቶች',
      contact: 'ያግኙን',
      serviceCatalogue: 'የአገልግሎት ዝርዝር',
      about: 'ስለ',
      aboutUs: 'ስለ እኛ',
      news: 'ዜና',
      videos: 'ቪዲዮዎች',
      announcements: 'ማስታወቂያዎች'
    },
    Sidama: {
      home: 'Umi Qoola',
      institutions: 'Qoqqowu Biiro',
      services: 'Oosuwa',
      contact: 'Nooro Qoolate',
      serviceCatalogue: 'Oosuwa Diramate',
      about: 'Nooni',
      aboutUs: 'Nooni Mashala',
      news: 'Odoosu',
      videos: 'Videyo',
      announcements: 'Beekisuute'
    }
  };

  useEffect(() => {
    // Check for saved dark mode preference - default is TRUE (dark mode on by default)
    const savedDarkMode = localStorage.getItem('darkMode');
    const isDarkMode = savedDarkMode === null ? true : savedDarkMode === 'true';
    setDarkMode(isDarkMode);
    
    // Force add/remove dark class on html element
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
      console.log('Dark mode enabled on load');
    } else {
      html.classList.remove('dark');
      console.log('Dark mode disabled on load');
    }

    // Check for saved language preference
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    // Close dropdowns when clicking outside
    const handleClickOutside = (event) => {
      // Close About dropdown
      if (showAboutDropdown && !event.target.closest('.about-dropdown-container')) {
        setShowAboutDropdown(false);
      }
      // Close Language dropdown
      if (showLanguageDropdown && !event.target.closest('.language-dropdown-container')) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showAboutDropdown, showLanguageDropdown]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    console.log('Dark mode toggled:', newDarkMode); // Debug log
    
    // Force add/remove dark class on html element
    const html = document.documentElement;
    if (newDarkMode) {
      html.classList.add('dark');
      console.log('Dark class added');
    } else {
      html.classList.remove('dark');
      console.log('Dark class removed');
    }
    
    // Force a small re-render
    window.dispatchEvent(new Event('resize'));
  };

  const handleLanguageSelect = (lang) => {
    setLanguage(lang);
    setShowLanguageDropdown(false);
    localStorage.setItem('language', lang);
    // Dispatch custom event for language change
    window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));
  };

  const scrollToSection = (sectionId) => {
    // If not on home page, navigate to home first
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: sectionId } });
      return;
    }

    // If on home page, scroll to section
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleNavigation = (path) => {
    // Check if path has hash (e.g., /about-us#news)
    if (path.includes('#')) {
      const [pathname, hash] = path.split('#');
      navigate(pathname, { state: { scrollTo: hash } });
    } else {
      navigate(path);
    }
  };

  // Handle scroll on navigation from other pages or with hash
  useEffect(() => {
    if (location.state?.scrollTo) {
      setTimeout(() => {
        const element = document.getElementById(location.state.scrollTo);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [location]);

  const t = translations[language] || translations.English;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16" style={{
      background: 'linear-gradient(to right, #294491 0%, #203B87 45%, #756951 72%, #CB9D2A 100%)'
    }}>
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo */}
        <button onClick={() => handleNavigation('/')} className="flex items-center gap-2">
          <img 
            src={logo} 
            alt="Hawassa Mesob Logo" 
            className="h-14 w-14 rounded-full object-cover"
            style={{ animation: 'spin-slow 8s linear infinite' }}
          />
        </button>

        {/* Navigation Links - Right aligned with better spacing */}
        <div className="flex items-center gap-6 ml-12">
          <button 
            onClick={() => scrollToSection('home')}
            className="text-white px-3 py-2 text-base font-medium hover:bg-white/5 transition-colors whitespace-nowrap"
          >
            {t.home}
          </button>
          <button 
            onClick={() => scrollToSection('institutions')}
            className="text-white px-3 py-2 text-base font-medium hover:bg-white/5 transition-colors whitespace-nowrap"
          >
            {t.institutions}
          </button>
          <button 
            onClick={() => scrollToSection('services')}
            className="text-white px-3 py-2 text-base font-medium hover:bg-white/5 transition-colors whitespace-nowrap"
          >
            {t.services}
          </button>
          <button 
            onClick={() => scrollToSection('contact')}
            className="text-white px-3 py-2 text-base font-medium hover:bg-white/5 transition-colors whitespace-nowrap"
          >
            {t.contact}
          </button>
          <button 
            onClick={() => handleNavigation('/service-catalogue')}
            className="text-white px-3 py-2 text-base font-medium hover:bg-white/5 transition-colors whitespace-nowrap"
          >
            {t.serviceCatalogue}
          </button>
          
          {/* About Dropdown */}
          <div 
            className="relative about-dropdown-container"
            onMouseEnter={() => setShowAboutDropdown(true)}
            onMouseLeave={() => setShowAboutDropdown(false)}
          >
            <button 
              onClick={(e) => {
                e.stopPropagation();
                // Toggle dropdown on click (for mobile/touch devices)
                setShowAboutDropdown(!showAboutDropdown);
              }}
              className="text-white px-3 py-2 text-base font-medium hover:bg-white/10 transition-colors whitespace-nowrap flex items-center gap-1"
            >
              {t.about}
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${showAboutDropdown ? 'rotate-180' : ''}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                  clipRule="evenodd" 
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showAboutDropdown && (
              <div 
                className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50 animate-fadeIn"
                onMouseEnter={() => setShowAboutDropdown(true)}
                onMouseLeave={() => setShowAboutDropdown(false)}
              >
                <button
                  onClick={() => {
                    handleNavigation('/about-us');
                    setShowAboutDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {t.aboutUs}
                </button>
                <button
                  onClick={() => {
                    handleNavigation('/about-us#news');
                    setShowAboutDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {t.news}
                </button>
                <button
                  onClick={() => {
                    handleNavigation('/about-us#videos');
                    setShowAboutDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {t.videos}
                </button>
                <button
                  onClick={() => {
                    handleNavigation('/about-us#announcements');
                    setShowAboutDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {t.announcements}
                </button>
              </div>
            )}
          </div>

          {/* Dark Mode Toggle - Light in light mode, dark slate in dark mode, swap icons */}
          <button 
            onClick={toggleDarkMode}
            className="ml-6 p-2.5 rounded-full bg-white dark:bg-[#374151] hover:bg-gray-200 dark:hover:bg-gray-500 hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {darkMode ? (
              // Show SUN icon in dark mode (to switch to light)
              <svg 
                className="w-5 h-5 text-gray-800 dark:text-white" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" 
                  clipRule="evenodd" 
                />
              </svg>
            ) : (
              // Show MOON icon in light mode (to switch to dark)
              <svg 
                className="w-5 h-5 text-gray-800" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>

          {/* Language Selector - Pill shape with globe emoji */}
          <div className="relative ml-2 language-dropdown-container">
            <button 
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#374151] text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-500 hover:scale-105 font-medium transition-all duration-200 whitespace-nowrap shadow-sm hover:shadow-md"
              style={{ borderRadius: '9999px' }}
            >
              {/* Globe Emoji */}
              <span className="text-base">🌐</span>
              <span className="text-sm">{language}</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path 
                  fillRule="evenodd" 
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                  clipRule="evenodd" 
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showLanguageDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageSelect(lang)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      language === lang ? 'bg-[#3d5a99] text-white hover:bg-[#2d4a7f]' : 'text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
