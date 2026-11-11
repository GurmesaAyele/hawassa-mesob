import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/images/messob_logo.png';

const Navbar = () => {
  const [language, setLanguage] = useState('English');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showAboutDropdown, setShowAboutDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true); // Default to true (dark mode on)
  const [isScrolled, setIsScrolled] = useState(false);
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
    // Scroll handler for navbar background transition
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);

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
      window.removeEventListener('scroll', handleScroll);
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
    // Close mobile menu
    setMobileMenuOpen(false);
    
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
    // Close mobile menu
    setMobileMenuOpen(false);
    
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
    <>
      <nav 
        className="fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-500 ease-in-out"
        style={{
          background: isScrolled 
            ? 'linear-gradient(to right, #24458F 0%, #1E3A7A 45%, #8B7355 72%, #D9A520 100%)'
            : 'transparent',
          backdropFilter: isScrolled ? 'none' : 'blur(10px)',
          WebkitBackdropFilter: isScrolled ? 'none' : 'blur(10px)',
          boxShadow: isScrolled ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none',
          border: 'none'
        }}
      >
        <div className="flex items-center justify-between h-full px-4 sm:px-6">
          {/* Logo */}
          <button onClick={() => handleNavigation('/')} className="flex items-center gap-2 z-50">
            <img 
              src={logo} 
              alt="Hawassa Mesob Logo" 
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover"
              style={{ animation: 'spin-slow 8s linear infinite' }}
            />
          </button>

          {/* Desktop Navigation Links - Hidden on mobile */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-6 ml-12">
            <button 
              onClick={() => scrollToSection('home')}
              className="text-white px-2 xl:px-3 py-2 text-sm xl:text-base font-medium hover:bg-white/5 transition-colors whitespace-nowrap"
            >
              {t.home}
            </button>
            <button 
              onClick={() => scrollToSection('institutions')}
              className="text-white px-2 xl:px-3 py-2 text-sm xl:text-base font-medium hover:bg-white/5 transition-colors whitespace-nowrap"
            >
              {t.institutions}
            </button>
            <button 
              onClick={() => scrollToSection('services')}
              className="text-white px-2 xl:px-3 py-2 text-sm xl:text-base font-medium hover:bg-white/5 transition-colors whitespace-nowrap"
            >
              {t.services}
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="text-white px-2 xl:px-3 py-2 text-sm xl:text-base font-medium hover:bg-white/5 transition-colors whitespace-nowrap"
            >
              {t.contact}
            </button>
            <button 
              onClick={() => handleNavigation('/service-catalogue')}
              className="text-white px-2 xl:px-3 py-2 text-sm xl:text-base font-medium hover:bg-white/5 transition-colors whitespace-nowrap"
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
                  setShowAboutDropdown(!showAboutDropdown);
                }}
                className="text-white px-2 xl:px-3 py-2 text-sm xl:text-base font-medium hover:bg-white/10 transition-colors whitespace-nowrap flex items-center gap-1"
              >
                {t.about}
                <svg 
                  className={`w-3 h-3 xl:w-4 xl:h-4 transition-transform duration-200 ${showAboutDropdown ? 'rotate-180' : ''}`} 
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

            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleDarkMode}
              className="ml-4 xl:ml-6 p-2 xl:p-2.5 rounded-full bg-white dark:bg-[#374151] hover:bg-gray-200 dark:hover:bg-gray-500 hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {darkMode ? (
                <svg 
                  className="w-4 h-4 xl:w-5 xl:h-5 text-gray-800 dark:text-white" 
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
                <svg 
                  className="w-4 h-4 xl:w-5 xl:h-5 text-gray-800" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {/* Language Selector */}
            <div className="relative ml-2 language-dropdown-container">
              <button 
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="flex items-center gap-1.5 xl:gap-2 px-3 xl:px-4 py-1.5 xl:py-2 bg-white dark:bg-[#374151] text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-500 hover:scale-105 font-medium transition-all duration-200 whitespace-nowrap shadow-sm hover:shadow-md text-xs xl:text-sm"
                style={{ borderRadius: '9999px' }}
              >
                <span className="text-sm xl:text-base">🌐</span>
                <span>{language}</span>
                <svg className="w-3 h-3 xl:w-4 xl:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path 
                    fillRule="evenodd" 
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </button>

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

          {/* Mobile Right Side: Dark Mode + Language + Hamburger */}
          <div className="flex lg:hidden items-center gap-2 sm:gap-3">
            {/* Dark Mode Toggle - Mobile */}
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-white dark:bg-[#374151] hover:bg-gray-200 dark:hover:bg-gray-500 transition-all duration-200 shadow-sm"
            >
              {darkMode ? (
                <svg 
                  className="w-4 h-4 text-gray-800 dark:text-white" 
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
                <svg 
                  className="w-4 h-4 text-gray-800" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {/* Language Selector - Mobile */}
            <div className="relative language-dropdown-container">
              <button 
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-white dark:bg-[#374151] text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-500 font-medium transition-all duration-200 shadow-sm text-xs"
                style={{ borderRadius: '9999px' }}
              >
                <span className="text-sm">🌐</span>
                <span className="hidden sm:inline">{language}</span>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path 
                    fillRule="evenodd" 
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </button>

              {showLanguageDropdown && (
                <div className="absolute right-0 mt-2 w-32 sm:w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageSelect(lang)}
                      className={`w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        language === lang ? 'bg-[#3d5a99] text-white hover:bg-[#2d4a7f]' : 'text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div 
        className={`fixed top-16 right-0 bottom-0 w-64 sm:w-80 bg-white dark:bg-gray-800 shadow-xl z-40 transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="p-4 space-y-2">
            <button 
              onClick={() => scrollToSection('home')}
              className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
            >
              {t.home}
            </button>
            <button 
              onClick={() => scrollToSection('institutions')}
              className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
            >
              {t.institutions}
            </button>
            <button 
              onClick={() => scrollToSection('services')}
              className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
            >
              {t.services}
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
            >
              {t.contact}
            </button>
            <button 
              onClick={() => handleNavigation('/service-catalogue')}
              className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
            >
              {t.serviceCatalogue}
            </button>

            {/* About Section in Mobile Menu */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t.about}</p>
              <button
                onClick={() => handleNavigation('/about-us')}
                className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t.aboutUs}
              </button>
              <button
                onClick={() => handleNavigation('/about-us#news')}
                className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t.news}
              </button>
              <button
                onClick={() => handleNavigation('/about-us#videos')}
                className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t.videos}
              </button>
              <button
                onClick={() => handleNavigation('/about-us#announcements')}
                className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t.announcements}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
