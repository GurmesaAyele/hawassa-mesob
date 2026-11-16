// Production deployed endpoints
export const PRODUCTION_API_URL = 'https://hawassa-mesob-api.onrender.com';
export const PRODUCTION_CLIENT_URL = 'https://hawassa-mesob.vercel.app';

// Resolve API base URL with mobile/LAN, Vercel, and local development support
const getApiBaseUrl = () => {
  // 1. Prefer explicit environment variable if set (strip any trailing slashes)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
  }
  
  // 2. Client-side browser hostname detection
  if (typeof window !== 'undefined' && window.location) {
    const currentHostname = window.location.hostname;
    
    // When running on Vercel deployment or production build, route to Render API
    if (
      currentHostname === 'hawassa-mesob.vercel.app' ||
      currentHostname.endsWith('.vercel.app') ||
      import.meta.env.PROD
    ) {
      return PRODUCTION_API_URL;
    }
    
    // Desktop local development
    if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    
    // Mobile/LAN local network access (e.g. 192.168.x.x, 10.x.x.x)
    if (/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(currentHostname)) {
      return `http://${currentHostname}:5000`;
    }
  }
  
  // Fallback: Production mode defaults to Render API, otherwise localhost
  return import.meta.env.PROD ? PRODUCTION_API_URL : 'http://localhost:5000';
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
  return `${API_CONFIG.BASE_URL}${endpoint}`;
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
