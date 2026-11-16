// Resolve API base URL with mobile/LAN, reverse-proxy, and environment support
export const getApiBaseUrl = () => {
  // If running in browser environment
  if (typeof window !== 'undefined') {
    const currentHostname = window.location.hostname;
    
    // 1. Desktop local development (localhost or 127.0.0.1)
    if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
      const devUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';
      return devUrl.replace(/\/+$/, '');
    }
    
    // 2. Mobile LAN access (testing via local network IP e.g. 192.168.x.x, 10.x.x.x)
    if (/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(currentHostname)) {
      return `http://${currentHostname}:5000`;
    }

    // 3. Deployed production (e.g. Vercel):
    // If VITE_DIRECT_API is set to 'true', use the explicit backend URL directly
    if (import.meta.env.VITE_DIRECT_API === 'true') {
      const explicitUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://hawassa-mesob-api.onrender.com';
      return explicitUrl.replace(/\/+$/, '');
    }

    // By default on deployed environments, use empty string "" so requests use relative paths
    // (/api/..., /uploads/...) and are reverse-proxied by Vercel directly to Render.
    // This completely eliminates CORS errors, mixed-content warnings, and trailing-slash issues.
    return '';
  }

  // Fallback for SSR or build-time evaluation
  const fallback = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
  return fallback.replace(/\/+$/, '');
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  
  // Endpoints
  ENDPOINTS: {
    // Expected response format: Array of institution objects
    // [{ id, name, logo?, description?, bgColor?, services?: [{ id, name, description?, duration?, cost?, requirements? }] }]
    INSTITUTIONS: '/api/institutions',
    
    // Expected response format: Array of news objects
    // [{ id, title, content, date, image?, author? }]
    NEWS: '/api/news',
    
    // Expected response format: Array of video objects
    // [{ id, title, youtubeUrl, description?, thumbnail?, date? }]
    VIDEOS: '/api/videos',
    
    // Expected response format: Array of announcement objects
    // [{ id, title, content, date, priority?, type? }]
    ANNOUNCEMENTS: '/api/announcements',
    
    SERVICES: '/api/services',
    CHATBOT: '/api/chat', // Chatbot API (now uses proxy)
    CONTACT: '/api/contact',
    MAP: '/api/map', // Map data endpoint
    
    // VIP Ticket Endpoints (per API integration guide)
    VIP_TICKETS: '/api/vip-tickets',
    VIP_DASHBOARD: '/api/vip-dashboard',
    VIP_DASHBOARD_STATS: '/api/vip-dashboard/stats',
    VIP_TRACK: '/api/vip-tickets/track',
    VIP_PAYMENTS_INITIALIZE: '/api/vip-payments/initialize',
    VIP_PAYMENTS_STATUS: '/api/vip-payments/status',
    VIP_PAYMENTS_VERIFY: '/api/vip-payments/verify',
    VIP_TICKETS_REFERENCE: '/api/vip-tickets/reference',
    VIP_TICKETS_ENQUEUE: '/api/vip-tickets'
  }
};

// Language to locale code mapping
export const getLocaleCode = (language) => {
  const localeMap = {
    'English': 'en',
    'Amharic': 'am',
    'Sidama': 'sid'
  };
  return localeMap[language] || 'en';
};

// Safe localization helper: extracts localized string from multilingual object or returns string as-is
export const resolveLocalizedValue = (val, language = 'English') => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    const locale = getLocaleCode(language);
    if (val[locale] && typeof val[locale] === 'string') {
      return val[locale];
    }
    const langLower = String(language).toLowerCase();
    if (val[langLower] && typeof val[langLower] === 'string') {
      return val[langLower];
    }
    if (val.en && typeof val.en === 'string') return val.en;
    if (val.am && typeof val.am === 'string') return val.am;
    if (val.sid && typeof val.sid === 'string') return val.sid;

    for (const key of Object.keys(val)) {
      if (typeof val[key] === 'string' && val[key].trim()) {
        return val[key];
      }
    }
    return '';
  }
  return String(val);
};

// Helper function to build full URL
export const buildUrl = (endpoint) => {
  // If endpoint is already a full URL, return as is
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  const base = (API_CONFIG.BASE_URL || '').replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
};

// Helper function for API calls with error handling and locale support
export const apiCall = async (endpoint, options = {}) => {
  try {
    const url = buildUrl(endpoint);
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
};
