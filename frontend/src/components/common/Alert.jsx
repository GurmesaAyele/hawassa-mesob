import React from 'react';

const Alert = ({ 
  type = 'info',
  title,
  children,
  icon,
  onClose,
  className = '',
}) => {
  const types = {
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: '✓',
      iconBg: 'bg-green-100 text-green-600',
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: '✕',
      iconBg: 'bg-red-100 text-red-600',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: '⚠',
      iconBg: 'bg-yellow-100 text-yellow-600',
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: 'ℹ',
      iconBg: 'bg-blue-100 text-blue-600',
    },
  };

  const config = types[type] || types.info;
  const displayIcon = icon || config.icon;

  return (
    <div 
      className={`
        flex gap-3 p-4 rounded-lg border
        ${config.container}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      role="alert"
    >
      {displayIcon && (
        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${config.iconBg}`}>
          <span className="text-sm font-bold">{displayIcon}</span>
        </div>
      )}
      
      <div className="flex-1">
        {title && (
          <h4 className="font-semibold mb-1">{title}</h4>
        )}
        <div className="text-sm">{children}</div>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-current opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close alert"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Alert;
