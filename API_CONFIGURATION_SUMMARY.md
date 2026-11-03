# API Configuration Summary

## Overview

All API configuration has been centralized in:
- **Frontend:** `frontend/src/config/api.js`
- **Environment Variables:** `frontend/.env` and `server/.env`

## Changes Made

### ✅ Frontend Configuration

**File:** `frontend/.env`
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_NODE_ENV=development
```

**File:** `frontend/src/config/api.js`
- Base URL now uses environment variable: `import.meta.env.VITE_API_BASE_URL`
- Falls back to `http://localhost:5000` for local development
- All API endpoints centralized in `API_CONFIG.ENDPOINTS`

### ✅ Backend Configuration

**File:** `server/.env`
- Port: `5000`
- CORS origins include: `localhost:5173`, `localhost:5174`, `localhost:3000`
- All sensitive keys moved to `.env` file

### ✅ Removed Vite Proxy

The Vite proxy configuration has been removed from `vite.config.js` because:
- Backend is now running locally
- Direct API calls are faster and simpler
- CORS is properly configured on the backend

## API Endpoints Configuration

All endpoints are defined in `frontend/src/config/api.js`:

```javascript
ENDPOINTS: {
  INSTITUTIONS: '/api/institutions',
  NEWS: '/api/news',
  VIDEOS: '/api/videos',
  ANNOUNCEMENTS: '/api/announcements',
  SERVICES: '/api/services',
  CHATBOT: '/api/chat',
  CONTACT: '/api/contact',
  MAP: '/api/map',
  
  // VIP Ticket Endpoints
  VIP_TICKETS: '/api/vip-tickets',
  VIP_PAYMENTS_INITIALIZE: '/api/vip-payments/initialize',
  VIP_PAYMENTS_STATUS: '/api/vip-payments/status',
  VIP_PAYMENTS_VERIFY: '/api/vip-payments/verify',
  VIP_TICKETS_REFERENCE: '/api/vip-tickets/reference',
  VIP_TICKETS_ENQUEUE: '/api/vip-tickets'
}
```

## How to Use API in Components

### Import the configuration:
```javascript
import { API_CONFIG, apiCall, getLocaleCode } from '../config/api.js';
```

### Make API calls:
```javascript
// Simple GET request
const data = await apiCall(API_CONFIG.ENDPOINTS.INSTITUTIONS);

// GET request with query parameters
const locale = getLocaleCode(language);
const data = await apiCall(`${API_CONFIG.ENDPOINTS.INSTITUTIONS}?locale=${locale}`);

// POST request
const data = await apiCall(API_CONFIG.ENDPOINTS.VIP_TICKETS, {
  method: 'POST',
  body: JSON.stringify({ citizenName, citizenPhone, serviceId, purpose })
});
```

## Security Features

### ✅ Sensitive Data Protection
- All API keys and secrets stored in `.env` files
- `.env` files are gitignored (never committed)
- Separate configuration for development and production

### ✅ CORS Security
- Backend validates origin of all requests
- Only whitelisted origins are allowed
- Configurable via `CORS_ORIGIN` environment variable

### ✅ Rate Limiting
- API rate limiting configured in backend
- Protects against abuse and DDoS attacks
- Configurable limits in `.env`

## Environment-Specific Configuration

### Development
```env
VITE_API_BASE_URL=http://localhost:5000
```

### Production
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

## Files Structure

```
hawassa-mesob/
├── frontend/
│   ├── .env                    # Frontend environment variables (gitignored)
│   ├── .env.example            # Template for .env
│   └── src/
│       └── config/
│           └── api.js          # API configuration and helper functions
├── server/
│   ├── .env                    # Backend environment variables (gitignored)
│   ├── .env.example            # Template for .env
│   └── src/
│       └── app.js              # CORS and server configuration
└── ENVIRONMENT_SETUP.md        # Detailed setup guide
```

## Testing the Configuration

### 1. Start the Backend
```bash
cd server
npm run dev
```

### 2. Start the Frontend
```bash
cd frontend
npm run dev
```

### 3. Verify API Connection
- Open browser console
- Look for successful API calls to `http://localhost:5000`
- No CORS errors should appear

## Troubleshooting

### Issue: CORS Error
**Solution:** 
1. Check `CORS_ORIGIN` in `server/.env`
2. Add your frontend URL to the list
3. Restart backend server

### Issue: API Connection Failed
**Solution:**
1. Verify backend is running on port 5000
2. Check `VITE_API_BASE_URL` in `frontend/.env`
3. Restart frontend dev server

### Issue: Environment Variables Not Loading
**Solution:**
1. Restart the dev server (Vite requires restart for `.env` changes)
2. Verify environment variable names start with `VITE_`
3. Check that `.env` file exists in the correct directory

## Next Steps

1. ✅ Configuration complete
2. ⏭️ Test all API endpoints
3. ⏭️ Update production environment variables
4. ⏭️ Configure production CORS origins
5. ⏭️ Set up proper API keys for production

## Additional Resources

- Vite Environment Variables: https://vitejs.dev/guide/env-and-mode.html
- CORS Configuration: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- API Best Practices: https://restfulapi.net/
