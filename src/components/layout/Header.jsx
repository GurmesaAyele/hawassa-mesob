import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { APP_NAME, ROUTES, LANGUAGES } from '../../utils/constants';
import Button from '../common/Button';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Close mobile menu on route change
    setIsMobileMenuOpen(false);
  }, [location]);

  const navItems = [
    { label: 'Home', path: ROUTES.HOME },
    { label: 'Services', path: ROUTES.SERVICES },
    { label: 'Organizations', path: ROUTES.ORGANIZATIONS },
    { label: 'How It Works', path: ROUTES.HOW_IT_WORKS },
    { label: 'News', path: ROUTES.NEWS },
    { label: 'About', path: ROUTES.ABOUT },
    { label: 'Contact', path: ROUTES.CONTACT },
  ];

  const isActivePath = (path) => {
    if (path === ROUTES.HOME) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLanguageChange = (langCode) => {
    setCurrentLanguage(langCode);
    setIsLanguageDropdownOpen(false);
    // TODO: Implement actual language change logic
    console.log('Language changed to:', langCode);
  };

  const selectedLanguage = LANGUAGES.find(lang => lang.code === currentLanguage);

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-40 transition-all duration-300
        ${isScrolled ? 'bg-white shadow-md py-3' : 'bg-white py-4'}
      `}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-white font-bold text-xl">HM</span>
            </div>
            <div className="hidden md:block">
              <div className="font-bold text-xl text-gray-900">
                {APP_NAME}
              </div>
              <div className="text-xs text-gray-500 -mt-1">
                One-Stop Service Center
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  px-4 py-2 rounded-lg font-medium text-sm transition-colors
                  ${isActivePath(item.path)
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }
                `}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Search Icon */}
            <Link
              to={ROUTES.SEARCH}
              className="hidden md:flex items-center justify-center w-10 h-10 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>

            {/* Language Selector */}
            <div className="hidden md:block relative">
              <button
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Select language"
                aria-expanded={isLanguageDropdownOpen}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span className="font-medium">{selectedLanguage.code.toUpperCase()}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Language Dropdown */}
              {isLanguageDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-large border border-gray-200 py-2 animate-slide-down">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`
                        w-full text-left px-4 py-2 text-sm transition-colors
                        ${lang.code === currentLanguage
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div>{lang.name}</div>
                      <div className="text-xs opacity-75">{lang.nativeName}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Track Application Button */}
            <Button
              to={ROUTES.TRACK}
              variant="outline"
              size="sm"
              className="hidden md:inline-flex"
            >
              Track Application
            </Button>

            {/* Login Button */}
            <Button
              to={ROUTES.LOGIN}
              variant="primary"
              size="sm"
              className="hidden md:inline-flex"
            >
              Login
            </Button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden flex items-center justify-center w-10 h-10 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-200 animate-slide-down">
            <nav className="flex flex-col space-y-1 mt-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    px-4 py-3 rounded-lg font-medium transition-colors
                    ${isActivePath(item.path)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Actions */}
            <div className="mt-4 space-y-2">
              <Button to={ROUTES.SEARCH} variant="ghost" fullWidth>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search Services
              </Button>
              <Button to={ROUTES.TRACK} variant="outline" fullWidth>
                Track Application
              </Button>
              <Button to={ROUTES.LOGIN} variant="primary" fullWidth>
                Login
              </Button>

              {/* Mobile Language Selector */}
              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm font-medium text-gray-700 mb-2">Language</div>
                <div className="space-y-1">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`
                        w-full text-left px-4 py-2 rounded-lg text-sm transition-colors
                        ${lang.code === currentLanguage
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      {lang.name} ({lang.nativeName})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
