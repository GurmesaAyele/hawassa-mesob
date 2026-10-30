# Hawassa MESOB Center — Client Features API Integration Guide

This guide documents the newly exposed server-side API endpoints for **YouTube Videos**, **Google Maps & Headquarters Location**, **Contact Form & Message Submissions**, **Latest News**, and **Official Announcements**.

---

## 1. Quick Reference: Endpoints Table

| Feature | HTTP Method | Endpoint | Purpose |
|---------|-------------|----------|---------|
| **YouTube Videos** | `GET` | `/api/videos` | Fetch all Hawassa MESOB center YouTube videos |
| **YouTube Videos** | `GET` | `/api/videos/:id` | Fetch a single video by ID |
| **YouTube Videos** | `POST` | `/api/videos` | Add a new YouTube video link to the catalog |
| **Maps & Location** | `GET` | `/api/map` (or `/api/location`) | Get Hawassa MESOB map embed, coordinates, address, and hours |
| **Maps & Location** | `PUT` / `POST` | `/api/map` | Update headquarters details, hours, phone, email, embed URL |
| **Contact Info** | `GET` | `/api/contact` | Get contact information for the Contact page |
| **Contact Message** | `POST` | `/api/contact` (or `/api/contact/submit`) | Submit citizen feedback / contact form message |
| **Latest News** | `GET` | `/api/news` | Fetch all news articles |
| **Latest News** | `POST` | `/api/news` | Publish a new news article |
| **Announcements** | `GET` | `/api/announcements` | Fetch active announcements with priority and type |
| **Announcements** | `POST` | `/api/announcements` | Publish a new announcement |

---

## 2. YouTube Videos API

### `GET /api/videos`
Returns all official Hawassa MESOB video entries, including the 8 configured video links:
1. `https://www.youtube.com/watch?v=WGRWiVXvlQY` (Inauguration Speech)
2. `https://www.youtube.com/watch?v=dXdAxoC4Pcc` (Inauguration - PM Abiy Ahmed)
3. `https://www.youtube.com/watch?v=wjFu-pIMoXw` (MESOB Services Overview)
4. `https://www.youtube.com/watch?v=TM7kuszz7K4` (Pilot Program)
5. `https://www.youtube.com/watch?v=3JnTYAwhol0` (What is MESOB)
6. `https://www.youtube.com/watch?v=bEKtsJp4Jis` (EBC Documentary Stream)
7. `https://www.youtube.com/watch?v=qDwlrvp4Ibo` (Citizen Walk-Through)
8. `https://www.youtube.com/watch?v=InTR4CRuKXo` (Digital Transformation)

#### Response Example
```json
[
  {
    "id": "vid-1",
    "title": "MESOB Center Inauguration Speech",
    "youtubeUrl": "https://www.youtube.com/watch?v=WGRWiVXvlQY",
    "embedUrl": "https://www.youtube.com/embed/WGRWiVXvlQY",
    "thumbnail": "https://img.youtube.com/vi/WGRWiVXvlQY/maxresdefault.jpg",
    "description": "Official keynote speech delivered at the inauguration ceremony of the Hawassa City MESOB Center.",
    "duration": "15:32",
    "views": "1.3M views",
    "author": "MESOB",
    "category": "Inauguration",
    "date": "2024-05-10T10:00:00.000Z"
  }
]
```

### `POST /api/videos`
Add a video dynamically. The backend automatically parses the YouTube ID, creates the embed URL, and assigns high-resolution thumbnails.

#### Request Body
```json
{
  "title": "New Public Service Tour",
  "youtubeUrl": "https://www.youtube.com/watch?v=WGRWiVXvlQY",
  "description": "Optional video description",
  "duration": "10:15",
  "author": "MESOB",
  "category": "Services"
}
```

---

## 3. Maps & Location API (with Form to Write Info)

### `GET /api/map` (or `/api/location`)
Returns the complete location profile for the Hawassa City MESOB Center, matching the UI cards in the design:

#### Response Example
```json
{
  "contact": {
    "address": "MESOB Center, Hawassa, Ethiopia",
    "plusCode": "2FWM+V23, Hawassa, Ethiopia",
    "operatingHours": "Monday - Friday: 8:00 AM - 6:00 PM",
    "officeHoursDetailed": [
      { "days": "Monday - Friday", "hours": "8:00 AM - 6:00 PM" },
      { "days": "Saturday", "hours": "8:30 AM - 12:30 PM" },
      { "days": "Sunday", "hours": "Closed" }
    ],
    "phone": "+251974270600",
    "phoneDisplay": "+251 97 427 0600",
    "email": "admin@hawassamesobcenter.et",
    "website": "https://hawassamesobcenter.et"
  },
  "map": {
    "placeName": "HAWASSA CITY MESOB CENTER",
    "coordinates": {
      "latitude": 7.0472875,
      "longitude": 38.4830077
    },
    "rating": {
      "score": 5.0,
      "reviewsCount": 1
    },
    "embedUrl": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2561.4752292494895!2d38.48300768684871!3d7.047287523046484!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x17b145005515512d%3A0xe78217b9f10cede0!2sHAWASSA%20CITY%20MESOB%20CENTER!5e1!3m2!1sen!2set!4v1792568981976!5m2!1sen!2set",
    "iframeHtml": "<iframe src=\"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2561.4752292494895!2d38.48300768684871!3d7.047287523046484!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x17b145005515512d%3A0xe78217b9f10cede0!2sHAWASSA%20CITY%20MESOB%20CENTER!5e1!3m2!1sen!2set!4v1792568981976!5m2!1sen!2set\" width=\"600\" height=\"450\" style=\"border:0;\" allowfullscreen=\"\" loading=\"lazy\" referrerpolicy=\"strict-origin-when-cross-origin\"></iframe>",
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=HAWASSA+CITY+MESOB+CENTER",
    "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=7.0472875,38.4830077"
  },
  "updatedAt": "2026-10-21T10:52:00.000Z"
}
```

### `PUT /api/map` (Form to Write/Update Info)
Allows updating the headquarters information, hours, contact numbers, email, or Google Maps embed URL directly from the client form:

#### Request Body
```json
{
  "address": "MESOB Center, Hawassa, Ethiopia",
  "operatingHours": "Monday - Friday: 8:00 AM - 6:00 PM",
  "phone": "+251974270600",
  "email": "admin@hawassamesobcenter.et",
  "embedUrl": "https://www.google.com/maps/embed?pb=...",
  "latitude": 7.0471372,
  "longitude": 38.4825464
}
```

---

## 4. Contact Form Submissions API

### `POST /api/contact` (or `/api/contact/submit`)
Used by citizen contact forms (such as on `Contact.jsx` or the home page).

#### Request Body
```json
{
  "name": "Abebe Kebede",
  "email": "abebe@example.com",
  "phone": "+251911223344",
  "message": "Inquiry regarding Fayda national ID card replacement."
}
```

#### Response (`201 Created`)
```json
{
  "success": true,
  "message": "Thank you for contacting Hawassa MESOB Center. Your message has been received.",
  "data": {
    "id": "msg-1792405800000",
    "name": "Abebe Kebede",
    "email": "abebe@example.com",
    "phone": "+251911223344",
    "message": "Inquiry regarding Fayda national ID card replacement.",
    "createdAt": "2026-10-19T13:48:00.000Z"
  }
}
```

---

## 5. News API

### `GET /api/news`
Returns published news articles. Supports optional query parameters: `?category=...`, `?search=...`, and `?limit=...`.

#### Response Example
```json
[
  {
    "id": "news-1",
    "title": "Hawassa MESOB Center Launches Unified Digital Service Windows",
    "content": "The newly inaugurated Hawassa City MESOB Center integrates over 13 key federal and regional public institutions under one roof...",
    "date": "2024-05-12T09:00:00.000Z",
    "image": "https://img.youtube.com/vi/wjFu-pIMoXw/maxresdefault.jpg",
    "author": "MESOB Communications Desk",
    "category": "Public Services"
  }
]
```

### `POST /api/news`
```json
{
  "title": "Public Wi-Fi Installed in Waiting Lounges",
  "content": "Free high-speed internet is now available for citizens while waiting.",
  "author": "IT Department",
  "category": "Technology"
}
```

---

## 6. Announcements API

### `GET /api/announcements`
Returns all active announcements. Supports `?priority=high|medium|low`, `?type=event|update|alert|general`, and `?limit=...`.

#### Response Example
```json
[
  {
    "id": "ann-1",
    "title": "Extended Operating Hours for National ID (Fayda) Registration",
    "content": "To accommodate employed citizens and students, the Fayda Biometric Registration desk at Hawassa MESOB Center is now open weekdays continuously from 8:00 AM to 6:00 PM without lunchtime interruption.",
    "date": "2024-05-14T07:30:00.000Z",
    "priority": "high",
    "type": "update"
  }
]
```

---

## 7. Frontend Ready-to-Use React Components

The following components are now created in your `frontend/src/components/` directory:

1. **`MapLocationSection.jsx`**:
   - Renders the interactive Google Maps embed with the "View on Google Maps" button on the left.
   - Renders the "MESOB Headquarters" card on the right with Address, Operating Hours, Phone, Email, and "Get Directions" button.
   - Added to `frontend/src/pages/AboutUs.jsx`.

2. **`MapInfoForm.jsx`**:
   - A ready-to-use form that client developers or admins can embed on an admin page or inside a modal to update the location, hours, and contact details via `PUT /api/map`.

3. **`VideosSection.jsx`**:
   - Fetches and displays YouTube video cards from `GET /api/videos` with 16:9 responsive embeds, views count, duration, and descriptions.

4. **`NewsSection.jsx`**:
   - Fetches and displays the news grid from `GET /api/news`.

5. **`AnnouncementsSection.jsx`**:
   - Fetches announcements from `GET /api/announcements` with color-coded priority badges and category icons.
