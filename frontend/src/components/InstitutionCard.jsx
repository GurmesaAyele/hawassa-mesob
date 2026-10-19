const InstitutionCard = ({ institution, onClick }) => {
  // Fallback colors if institution doesn't have one
  const cardColors = [
    'bg-gradient-to-br from-green-800 to-green-900',
    'bg-gradient-to-br from-amber-800 to-amber-900',
    'bg-gradient-to-br from-purple-800 to-purple-900',
    'bg-gradient-to-br from-red-800 to-red-900',
    'bg-gradient-to-br from-blue-800 to-blue-900',
    'bg-gradient-to-br from-emerald-800 to-emerald-900',
    'bg-gradient-to-br from-orange-800 to-orange-900',
    'bg-gradient-to-br from-indigo-800 to-indigo-900',
  ];

  const getCardColor = (index) => {
    return institution.bgColor || cardColors[index % cardColors.length];
  };

  return (
    <button
      onClick={() => onClick(institution)}
      className={`${getCardColor(institution.id)} rounded-2xl p-6 shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 flex flex-col items-center justify-center text-center h-64 w-full`}
    >
      {/* Institution Logo */}
      <div className="w-24 h-24 mb-4 bg-white rounded-xl flex items-center justify-center p-3">
        {institution.logo ? (
          <img
            src={institution.logo}
            alt={institution.name}
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback if image fails to load
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="w-full h-full items-center justify-center text-gray-400 text-2xl font-bold hidden"
          style={{ display: institution.logo ? 'none' : 'flex' }}
        >
          {institution.name?.charAt(0) || '?'}
        </div>
      </div>

      {/* Institution Name */}
      <h3 className="text-white font-bold text-lg leading-tight px-2">
        {institution.name || 'Unknown Institution'}
      </h3>

      {/* Institution Details (if any) */}
      {institution.description && (
        <p className="text-white/80 text-sm mt-2 line-clamp-2">
          {institution.description}
        </p>
      )}
    </button>
  );
};

export default InstitutionCard;
