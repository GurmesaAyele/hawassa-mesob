import React, { useState, useRef, useEffect } from 'react';

const SearchBar = ({ 
  placeholder = 'Search...',
  onSearch,
  onFocus,
  onBlur,
  suggestions = [],
  onSuggestionClick,
  showSuggestions = false,
  value: controlledValue,
  onChange: controlledOnChange,
  size = 'md',
  className = '',
}) => {
  const [internalValue, setInternalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const onChange = controlledOnChange || setInternalValue;

  const sizes = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-3 px-4',
    lg: 'py-4 px-6 text-lg',
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (onSearch) {
        onSearch(value);
      }
    }
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    // Delay to allow suggestion click
    setTimeout(() => {
      if (onBlur) onBlur(e);
    }, 200);
  };

  const handleSuggestionClick = (suggestion) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    }
    setIsFocused(false);
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`
            w-full
            ${sizes[size]}
            pl-12
            pr-4
            border border-gray-300
            rounded-lg
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            transition-all duration-200
          `.trim().replace(/\s+/g, ' ')}
        />
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && isFocused && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-large max-h-96 overflow-y-auto animate-slide-down"
        >
          <ul className="py-2">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-3"
              >
                {suggestion.icon && (
                  <span className="text-2xl">{suggestion.icon}</span>
                )}
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{suggestion.title || suggestion.name}</div>
                  {suggestion.description && (
                    <div className="text-sm text-gray-500 line-clamp-1">{suggestion.description}</div>
                  )}
                </div>
                {suggestion.category && (
                  <span className="badge badge-primary text-xs">{suggestion.category}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
