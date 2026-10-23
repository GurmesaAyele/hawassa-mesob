import { API_CONFIG } from '../config/api';
import { useState, useEffect } from 'react';

const InstitutionCard = ({ institution, onClick, index }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    // Initial check
    checkDarkMode();
    
    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  // Light mode colors - exact 14 pastel colors
  const lightModeColors = [
    '#DDFBE8',  // 1
    '#FFF0DC',  // 2
    '#F4E8FF',  // 3
    '#FCE3E4',  // 4
    '#FFF8C7',  // 5
    '#FFF8C7',  // 6
    '#CFF8F1',  // 7
    '#DCEBFC',  // 8
    '#DDFBE8',  // 9
    '#DCEBFC',  // 10
    '#E2E8FF',  // 11
    '#FFF0DC',  // 12
    '#F4E8FF',  // 13
    '#FCE3E4',  // 14
  ];

  // Dark mode colors - exact 14 dark colors from screenshot
  const darkModeColors = [
    '#12382B',  // 1
    '#49251D',  // 2
    '#351954',  // 3
    '#501D25',  // 4
    '#452D1B',  // 5
    '#12383A',  // 6
    '#1B3066',  // 7
    '#12382B',  // 8
    '#203D70',  // 9
    '#452D1B',  // 10
    '#12383A',  // 11
    '#1B3066',  // 12
    '#12382B',  // 13
    '#49251D',  // 14
  ];

  // Get color by index to maintain order
  const getCardColor = () => {
    if (institution.bgColor) return institution.bgColor;
    // Use modulo to cycle through colors if more than 14 institutions
    const colors = isDarkMode ? darkModeColors : lightModeColors;
    return colors[index % colors.length];
  };

  // Build full logo URL
  const getLogoUrl = (logoPath) => {
    if (!logoPath) return null;
    // If already a full URL, return as is
    if (logoPath.startsWith('http')) return logoPath;
    // Otherwise, prepend the base URL
    return `${API_CONFIG.BASE_URL}${logoPath}`;
  };

  const logoUrl = getLogoUrl(institution.logo || institution.icon);
  const backgroundColor = getCardColor();
  // Text color: #172033 in light mode, #FFFFFF in dark mode
  const textColor = isDarkMode ? '#FFFFFF' : '#172033';

  return (
    <button
      onClick={() => onClick(institution)}
      style={{ backgroundColor }}
      className="rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-600 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 flex flex-col items-center justify-center text-center h-64 w-full"
    >
      {/* Institution Logo */}
      <div className="w-24 h-24 mb-4 bg-white rounded-xl flex items-center justify-center p-3 shadow-sm">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={institution.name}
            className="w-full h-full object-contain"
            onError={(e) => {
              console.error('Logo failed to load:', logoUrl);
              // Fallback if image fails to load
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="w-full h-full items-center justify-center text-gray-400 text-2xl font-bold"
          style={{ display: logoUrl ? 'none' : 'flex' }}
        >
          {institution.name?.charAt(0) || '?'}
        </div>
      </div>

      {/* Institution Name - Dark in light mode, White in dark mode */}
      <h3 className="font-bold text-lg leading-tight px-2" style={{ color: textColor }}>
        {institution.name || 'Unknown Institution'}
      </h3>

      {/* Institution Details (if any) */}
      {institution.description && (
        <p className="text-sm mt-2 line-clamp-2" style={{ color: textColor }}>
          {institution.description}
        </p>
      )}
    </button>
  );
};

export default InstitutionCard;
