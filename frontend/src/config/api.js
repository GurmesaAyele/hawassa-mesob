// Resolve API base URL with mobile/LAN support
const getApiBaseUrl = () => {
  // Prefer explicit environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // For local development
  // If accessed via IP address (e.g., from mobile on LAN), use same hostname for API
  const currentHostname = window.location.hostname;
  
  // If localhost or 127.0.0.1, keep it (desktop development)
  if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  
  // If accessed via IP or other hostname (mobile LAN access), use that hostname
  // Assumes backend runs on port 5000 on the same machine
  return `http://${currentHostname}:5000`;
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
