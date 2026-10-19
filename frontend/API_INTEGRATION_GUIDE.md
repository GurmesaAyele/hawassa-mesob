# Complete API Integration Guide - Hawassa Mesob Portal

## Overview
This document provides complete API integration details for all sections that fetch data from the backend.

## API Configuration Location
**File:** `src/config/api.js`

Update the `BASE_URL` with your backend API URL:
```javascript
export const API_CONFIG = {
  BASE_URL: 'https://your-backend-api.com', // Update this!
  ENDPOINTS: { ... }
};
```

---

## 1. Institutions API

### Endpoint
```
GET /api/institutions
```

### Expected Response Format
```json
[
  {
    "id": 1,
    "name": "Institution Name",
    "logo": "https://example.com/logo.png",
    "description": "Institution description (optional)",
    "bgColor": "bg-gradient-to-br from-green-800 to-green-900",
    "services": [
      {
        "id": 1,
        "name": "Service Name",
        "description": "Service description (optional)",
        "duration": "2-3 business days (optional)",
        "cost": "500 ETB (optional)",
        "requirements": "List of requirements (optional)"
      }
    ]
  }
]
```

### Field Specifications

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | Yes | Unique identifier |
| `name` | string | Yes | Institution name |
| `logo` | string (URL) | No | Logo image URL |
| `description` | string | No | Brief description |
| `bgColor` | string | No | Tailwind gradient class |
| `services` | array | No | List of services |

### Service Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | Yes | Service unique ID |
| `name` | string | Yes | Service name |
| `description` | string | No | Service details |
| `duration` | string | No | Processing time |
| `cost` | string | No | Service fee |
| `requirements` | string | No | Required documents |

### Features
- 4 cards per row (responsive)
- Pagination (8 items per page)
- Click to open modal with services
- Loading/error/empty states

---

## 2. News API

### Endpoint
```
GET /api/news
```

### Expected Response Format
```json
[
  {
    "id": 1,
    "title": "News Title",
    "content": "Full news content text",
    "date": "2024-01-15T10:30:00Z",
    "image": "https://example.com/news-image.jpg",
    "author": "Author Name"
  }
]
```

### Field Specifications

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | Yes | Unique identifier |
| `title` | string | Yes | News headline |
| `content` | string | Yes | Full news content |
| `date` | string (ISO 8601) | No | Publication date |
| `image` | string (URL) | No | News image URL |
| `author` | string | No | Author name |

### Features
- 3 cards per row (responsive)
- Image display with fallback
- Date and author display
- Content preview (3 lines max)

---

## 3. Videos API

### Endpoint
```
GET /api/videos
```

### Expected Response Format
```json
[
  {
    "id": 1,
    "title": "Video Title",
    "youtubeUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
    "description": "Video description (optional)",
    "thumbnail": "https://example.com/thumbnail.jpg",
    "date": "2024-01-15T10:30:00Z"
  }
]
```

### Field Specifications

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | Yes | Unique identifier |
| `title` | string | Yes | Video title |
| `youtubeUrl` | string (URL) | Yes | YouTube video URL |
| `description` | string | No | Video description |
| `thumbnail` | string (URL) | No | Thumbnail image (auto from YouTube if not provided) |
| `date` | string (ISO 8601) | No | Upload date |

### YouTube URL Formats Supported
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://www.youtube.com/v/VIDEO_ID`

### Features
- 3 videos per row (responsive)
- Embedded YouTube player
- Auto-extracts video ID from URL
- Responsive video embed (16:9 ratio)
- Description and date display

---

## 4. Announcements API

### Endpoint
```
GET /api/announcements
```

### Expected Response Format
```json
[
  {
    "id": 1,
    "title": "Announcement Title",
    "content": "Full announcement content text",
    "date": "2024-01-15T10:30:00Z",
    "priority": "high",
    "type": "alert"
  }
]
```

### Field Specifications

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | Yes | Unique identifier |
| `title` | string | Yes | Announcement title |
| `content` | string | Yes | Full announcement text |
| `date` | string (ISO 8601) | No | Publication date |
| `priority` | string | No | Priority level: "high", "medium", "low" |
| `type` | string | No | Type: "event", "update", "alert", "general" |

### Priority Badges
- **High**: Red badge
- **Medium**: Yellow badge
- **Low**: Green badge

### Type Icons
- **Event**: Calendar icon
- **Update**: Refresh icon
- **Alert**: Warning icon
- **General**: Info icon

### Features
- Full-width list layout
- Priority badges with colors
- Type-specific icons
- Border-left accent color
- Formatted date display

---

## Common Features Across All Sections

### Loading State
All sections show:
- Animated spinner during data fetch
- "Loading..." indicator

### Error State
All sections show:
- Red error message with icon
- "Try Again" button to retry fetch
- Error logged to console

### Empty State
All sections show:
- Relevant icon (newspaper, video, megaphone)
- "No [items] available at the moment" message
- Centered layout

---

## Date Format
All dates should be in **ISO 8601 format**:
```
2024-01-15T10:30:00Z
```

The frontend will format them as:
```
January 15, 2024
```

---

## CORS Configuration
Your backend must allow requests from the frontend origin:

```javascript
// Example Express.js CORS setup
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173', // Development
  // origin: 'https://hawassamesob.com', // Production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
```

---

## Error Handling

### HTTP Status Codes
- **200 OK**: Successful request, return data
- **404 Not Found**: Endpoint not found
- **500 Internal Server Error**: Server error
- **503 Service Unavailable**: Backend down

### Error Response Format (Optional but Recommended)
```json
{
  "error": "Error message",
  "success": false
}
```

---

## Testing Your API

### 1. Update API Configuration
Edit `src/config/api.js`:
```javascript
BASE_URL: 'https://your-api-url.com'
```

### 2. Test Each Endpoint
Use tools like:
- Postman
- cURL
- Browser DevTools (Network tab)

Example cURL test:
```bash
curl -X GET https://your-api-url.com/api/institutions
```

### 3. Verify Response Format
Ensure your API returns data in the exact format specified above.

### 4. Check CORS
Open browser console and check for CORS errors.

---

## Component Files

| Section | Component File | API Endpoint |
|---------|---------------|--------------|
| Institutions | `InstitutionCard.jsx`, `InstitutionModal.jsx` | `/api/institutions` |
| News | `NewsSection.jsx` | `/api/news` |
| Videos | `VideosSection.jsx` | `/api/videos` |
| Announcements | `AnnouncementsSection.jsx` | `/api/announcements` |

---

## Navbar Dropdown
The "About Us" button in the navbar now has a dropdown menu on hover with links to:
- News
- Videos  
- Announcements

Clicking any dropdown item scrolls to the respective section.

---

## Environment Variables (Optional)

Create `.env` file in frontend root:
```env
VITE_API_BASE_URL=https://your-backend-api.com
```

The app will automatically use this if defined.

---

## Quick Start Checklist

- [ ] Update `BASE_URL` in `src/config/api.js`
- [ ] Implement `/api/institutions` endpoint
- [ ] Implement `/api/news` endpoint
- [ ] Implement `/api/videos` endpoint
- [ ] Implement `/api/announcements` endpoint
- [ ] Test each endpoint with sample data
- [ ] Configure CORS on backend
- [ ] Verify data format matches specification
- [ ] Deploy and test in production

---

## Support

If you need any modifications to match your backend API structure or have questions, let me know!

## Summary

✅ **4 API endpoints ready for integration**  
✅ **All sections show nothing until data is fetched**  
✅ **YouTube video embedding with URL auto-detection**  
✅ **Complete loading/error/empty state handling**  
✅ **Responsive design on all screen sizes**  
✅ **Dropdown menu in navbar for easy navigation**  
✅ **Modular API configuration**  
