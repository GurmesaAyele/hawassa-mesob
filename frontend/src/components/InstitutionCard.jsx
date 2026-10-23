import { API_CONFIG } from '../config/api';

const InstitutionCard = ({ institution, onClick }) => {
  // Same exact hex colors for both light and dark mode
  const cardColors = [
    'bg-[#DDFBE8]',      // Light mint green
    'bg-[#FFF0DC]',      // Light peach
    'bg-[#F4E8FF]',      // Light lavender
    'bg-[#FCE3E4]',      // Light pink
    'bg-[#FFF8C7]',      // Light yellow
    'bg-[#CFF8F1]',      // Light cyan/mint
    'bg-[#DCEBFC]',      // Light blue
    'bg-[#E2E8FF]',      // Light periwinkle
  ];

  const getCardColor = (index) => {
    return institution.bgColor || cardColors[index % cardColors.length];
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

  return (
    <button
      onClick={() => onClick(institution)}
      className={`${getCardColor(institution.id)} rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-600 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 flex flex-col items-center justify-center text-center h-64 w-full`}
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

      {/* Institution Name - Always dark text since cards are always pastel */}
      <h3 className="text-gray-900 font-bold text-lg leading-tight px-2">
        {institution.name || 'Unknown Institution'}
      </h3>

      {/* Institution Details (if any) */}
      {institution.description && (
        <p className="text-gray-700 text-sm mt-2 line-clamp-2">
          {institution.description}
        </p>
      )}
    </button>
  );
};

export default InstitutionCard;
