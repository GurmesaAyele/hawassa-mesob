// API Configuration
// Update these endpoints when your backend is ready

export const API_CONFIG = {
  // Base URL for your backend API
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://10.20.254.64:5000',
  
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
    CHATBOT: 'http://10.20.254.64:5000/api/chat', // Your existing chatbot API
    VIP_TICKET: '/api/vip-ticket',
    CONTACT: '/api/contact',
    MAP: '/api/map' // Map data endpoint
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
