# Institutions Section API Integration Guide

## Overview
The Institutions section is designed to dynamically fetch and display institution data from your backend API.

## Current Status
✅ **Development Mode**: Currently using mock data for testing
🔄 **Production Mode**: Ready to connect to your backend API

## How to Connect Your API

### Step 1: Update API Configuration
Edit the file: `src/config/api.js`

```javascript
export const API_CONFIG = {
  BASE_URL: 'YOUR_BACKEND_URL', // e.g., 'https://api.hawassamesob.com'
  ENDPOINTS: {
    INSTITUTIONS: '/api/institutions',
    // ... other endpoints
  }
};
```

### Step 2: Enable API Integration
In `src/pages/Home.jsx`, find the `fetchInstitutions` function and:

1. **Uncomment these lines:**
```javascript
const data = await apiCall(API_CONFIG.ENDPOINTS.INSTITUTIONS);
setInstitutions(data);
```

2. **Remove/Comment out the mock data block:**
```javascript
// const mockData = [ ... ];
// setInstitutions(mockData);
```

### Step 3: Expected API Response Format

Your backend API should return a JSON array with this structure:

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

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | Yes | Unique identifier for the institution |
| `name` | string | Yes | Institution name |
| `logo` | string | No | URL to institution logo image |
| `description` | string | No | Brief description of the institution |
| `bgColor` | string | No | Tailwind CSS gradient class for card background |
| `services` | array | No | List of services offered by the institution |

### Service Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | Yes | Unique identifier for the service |
| `name` | string | Yes | Service name |
| `description` | string | No | Detailed service description |
| `duration` | string | No | Expected processing time |
| `cost` | string | No | Service fee |
| `requirements` | string | No | Required documents or conditions |

## Features Implemented

### ✅ Dynamic Data Loading
- Fetches institutions from API on component mount
- Loading spinner during data fetch
- Error handling with retry button
- Empty state for no results

### ✅ Responsive Grid Layout
- **Desktop**: 4 cards per row
- **Tablet**: 2 cards per row
- **Mobile**: 1 card per row

### ✅ Pagination
- Shows 8 institutions per page (2 rows × 4 cards)
- Previous/Next navigation buttons
- Page counter display
- Disabled state for boundary pages

### ✅ Reusable Components
- `InstitutionCard`: Individual institution display
- `InstitutionModal`: Service details popup

### ✅ Institution Modal Features
- Click any institution card to open modal
- Displays institution logo and description
- Lists all services with expand/collapse
- "No services listed" message when empty
- Expandable service details with descriptions
- Close button and ESC key support

### ✅ Error Handling
- Network error handling
- Missing logo fallback (shows first letter)
- Image loading error fallback
- Empty services graceful display

## Styling & Design

### Dark Theme Consistency
- Background: `#1a1f2e` (dark navy)
- Cards: Gradient backgrounds with hover effects
- Modal: `#1e293b` with `#0f172a` header
- Text: White with gray variants

### Card Colors
8 pre-defined gradient backgrounds cycle automatically:
- Green, Amber, Purple, Red, Blue, Emerald, Orange, Indigo

### Animations
- Hover scale effect on cards
- Fade-in modal animation
- Smooth expand/collapse for services
- Loading spinner

## Testing

### With Mock Data (Current)
1. Run the development server: `npm run dev`
2. Navigate to the Institutions section
3. Click on any institution card
4. Verify modal opens with services (or "No services listed")

### With Real API
1. Update `src/config/api.js` with your API URL
2. Uncomment API call in `fetchInstitutions()`
3. Remove mock data
4. Test API response format matches expected structure
5. Verify all features work with live data

## API Endpoint Requirements

### GET /api/institutions

**Success Response (200 OK):**
```json
{
  "data": [ /* array of institutions */ ],
  "success": true
}
```

Or simply return the array directly:
```json
[ /* array of institutions */ ]
```

**Error Response (4xx/5xx):**
```json
{
  "error": "Error message",
  "success": false
}
```

## Environment Variables (Optional)

You can use environment variables for API configuration:

Create `.env` file:
```env
VITE_API_BASE_URL=https://api.hawassamesob.com
```

The `api.js` config automatically uses this if available.

## Troubleshooting

### Issue: "Failed to load institutions"
- Check API endpoint URL is correct
- Verify CORS is enabled on backend
- Check network tab for error details
- Ensure API returns correct JSON format

### Issue: Cards not showing
- Verify API response has data
- Check browser console for errors
- Ensure institution objects have required fields (id, name)

### Issue: Modal not opening
- Check institution has onClick handler
- Verify selectedInstitution state is updating
- Check for console errors

### Issue: Services not displaying
- Verify services array exists in institution object
- Check service objects have id and name fields
- Ensure services array is not null

## Next Steps

1. ✅ Review this integration guide
2. ⏳ Provide your backend API endpoint
3. ⏳ Update `src/config/api.js` with your URL
4. ⏳ Test with your live API
5. ⏳ Remove mock data once confirmed working

## Support

If you encounter any issues or need modifications to match your API structure, let me know!
