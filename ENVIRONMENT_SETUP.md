# Environment Configuration Guide

This guide explains how to set up environment variables for both frontend and backend.

## Frontend Environment Variables

**Location:** `frontend/.env`

The frontend uses environment variables to configure the API connection.

### Required Variables:

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:5000

# Environment mode
VITE_NODE_ENV=development
```

### Important Notes:

- All Vite environment variables must be prefixed with `VITE_`
- For production, update `VITE_API_BASE_URL` to your production backend URL
- The `.env` file is gitignored - never commit it to version control
- Use `.env.example` as a template for other developers

## Backend Environment Variables

**Location:** `server/.env`

The backend requires several environment variables for database, AI, payments, and CORS configuration.

### Required Variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/mesob_hawassa?schema=public"

# Server
PORT=5000
NODE_ENV=development

# CORS - IMPORTANT: Add all frontend URLs here
CORS_ORIGIN="http://localhost:5173,http://localhost:5174,http://localhost:3000"

# Gemini AI (Optional - for chatbot)
GEMINI_API_KEY="your-google-gemini-api-key-here"

# Chapa Payments (Required for VIP tickets)
CHAPA_SECRET_KEY="CHASECK_TEST-your-chapa-secret-key-here"
CHAPA_PUBLIC_KEY="CHAPUBK_TEST-your-chapa-public-key-here"
CHAPA_WEBHOOK_SECRET="your-chapa-webhook-secret-here"
CHAPA_BASE_URL="https://api.chapa.co/v1"
CHAPA_RETURN_URL="http://localhost:5173/vip/payment/callback"

# JWT Authentication
JWT_SECRET="generate-a-strong-32-character-random-secret-key"

# Cloudinary (Optional - for image uploads)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### Setting Up:

1. Copy `.env.example` to `.env` in both frontend and backend directories
2. Update the values with your actual credentials
3. Never commit `.env` files to git

## CORS Configuration

The backend CORS configuration is critical for allowing frontend requests.

**Default allowed origins:**
- `http://localhost:5173` (Vite default port)
- `http://localhost:5174` (Vite alternate port)
- `http://localhost:3000` (Alternative development port)
- `http://127.0.0.1:5173`
- `http://127.0.0.1:3000`

**To add more origins:**

Update the `CORS_ORIGIN` environment variable in `server/.env`:

```env
CORS_ORIGIN="http://localhost:5173,http://localhost:5174,http://your-ip:5173"
```

## Running the Application

### Backend:

```bash
cd server
npm install
npm run dev
```

The backend will run on http://localhost:5000

### Frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on http://localhost:5173 or http://localhost:5174

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:

1. Check that your backend is running
2. Verify the `CORS_ORIGIN` in `server/.env` includes your frontend URL
3. Restart the backend server after changing `.env`
4. Check that `VITE_API_BASE_URL` in `frontend/.env` matches your backend URL

### API Connection Failed

If API requests fail:

1. Verify backend is running on the correct port (default: 5000)
2. Check `VITE_API_BASE_URL` in `frontend/.env` matches backend URL
3. Restart frontend dev server after changing `.env`
4. Check browser console for specific error messages

## Security Notes

⚠️ **IMPORTANT:**

- Never commit `.env` files to version control
- Never share API keys or secrets publicly
- Use different credentials for development and production
- Regularly rotate API keys and secrets
- Use strong random strings for `JWT_SECRET`

## Production Deployment

For production:

1. Update `VITE_API_BASE_URL` to your production backend URL
2. Update `CORS_ORIGIN` to include only your production frontend URL
3. Set `NODE_ENV=production`
4. Use production API keys and secrets
5. Enable HTTPS for both frontend and backend
6. Update `CHAPA_RETURN_URL` to your production callback URL
