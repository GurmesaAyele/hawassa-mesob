# Hawassa MESOB Portal: Admin Dashboard Server API & Client Integration Guide

This guide details the server-side administrative implementation and provides instructions for the frontend developer on how to connect and consume the API in `AdminDashboard.jsx` and `adminApi.js`.

---

## 1. Role & Permission Architecture

The server enforces strict Role-Based Access Control (RBAC) across all administrative routes using JSON Web Tokens (JWT) and `HttpOnly` cookies.

| Role | Intended User | Permissions & Scope |
| :--- | :--- | :--- |
| **`SUPER_ADMIN`** | **Manager of Hawassa MESOB** | **Full Unrestricted Access**:<br>• Institutions (Add, Edit, Deactivate, Permanent Delete)<br>• Services (Add, Edit, Deactivate, Delete)<br>• Home Content (News, Announcements, YouTube Videos)<br>• Location & Map Settings (Coordinates, Hours, Contacts)<br>• **Citizen Contact Inbox (Read messages & toggle read/unread status)** |
| **`OPERATOR`** | **IT Operations Team** | **Operational Dashboard Access**:<br>• Institutions (Add, Edit, Deactivate, Permanent Delete)<br>• Services (Add, Edit, Deactivate, Delete)<br>• Home Content (News, Announcements, YouTube Videos)<br>• Location & Map Settings (Coordinates, Hours, Contacts)<br>• <ins>**BLOCKED FROM MESSAGES**</ins>: Cannot view, list, or update citizen contact messages (`403 Forbidden`). |
| **`CITIZEN` / Public** | **General Visitors** | **Public Access Only**:<br>• Browse institutions and active services<br>• View announcements, news, and videos<br>• Query AI Chatbot (`POST /api/chat`)<br>• Submit contact message (`POST /api/contact`)<br>• Denied from entering admin dashboard (`403 Forbidden`). |

---

## 2. Client-Side Implementation Guide

Follow these 3 simple steps to integrate the admin dashboard with the server API:

### Step 1: Update `frontend/src/services/adminApi.js`

Add `credentials: "include"` to your fetch helper so the browser automatically sends the secure `mesob_admin_token` cookie with each request. Also add the auth methods:

```javascript
// frontend/src/services/adminApi.js
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");
const API_ROOT = `${API_BASE_URL}/api`;

async function request(path, options = {}) {
  let response;
  try {
    const isFormData = options.body instanceof FormData;
    response = await fetch(`${API_ROOT}${path}`, {
      ...options,
      credentials: "include", // <--- CRITICAL: Sends HttpOnly admin session cookie
      headers: options.body && !isFormData
        ? { "Content-Type": "application/json", ...options.headers }
        : options.headers,
    });
  } catch {
    throw new Error(`Cannot connect to the API at ${API_ROOT}. Check that the backend is running.`);
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || `Request failed (${response.status}).`);
  }

  return payload;
}

export const adminApi = {
  // ─── Authentication Endpoints ───
  login: (credentials) => request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials), // { email, password }
  }),
  me: () => request("/auth/me"),
  logout: () => request("/auth/logout", { method: "POST" }),

  // ─── Existing Dashboard Endpoints (Preserved 100%) ───
  institutions: () => list("/institutions"),
  services: () => list("/services"),
  messages: () => request("/contact/messages"),
  updateMessage: (id, isReviewed) => request(`/contact/messages/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ isReviewed }),
  }),
  siteSettings: () => request("/map"),
  updateSiteSettings: (settings) => request("/map", {
    method: "PUT",
    body: JSON.stringify(settings),
  }),
  news: () => list("/news"),
  announcements: () => list("/announcements"),
  videos: () => list("/videos"),
  createInstitution: (data) => request("/institutions", {
    method: "POST",
    body: data instanceof FormData ? data : JSON.stringify(data),
  }),
  updateInstitution: (id, data) => request(`/institutions/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: data instanceof FormData ? data : JSON.stringify(data),
  }),
  deactivateInstitution: (id) => request(`/institutions/${encodeURIComponent(id)}`, { method: "DELETE" }),
  deleteInstitution: (id) => request(`/institutions/${encodeURIComponent(id)}?permanent=true`, { method: "DELETE" }),
  createService: (data) => request("/services", { method: "POST", body: JSON.stringify(data) }),
  updateService: (id, data) => request(`/services/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  deactivateService: (id) => request(`/services/${encodeURIComponent(id)}`, { method: "DELETE" }),
  createNews: (data) => request("/news", { method: "POST", body: JSON.stringify(data) }),
  updateNews: (id, data) => request(`/news/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  deleteNews: (id) => request(`/news/${encodeURIComponent(id)}`, { method: "DELETE" }),
  createAnnouncement: (data) => request("/announcements", { method: "POST", body: JSON.stringify(data) }),
  updateAnnouncement: (id, data) => request(`/announcements/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  deleteAnnouncement: (id) => request(`/announcements/${encodeURIComponent(id)}`, { method: "DELETE" }),
  createVideo: (data) => request("/videos", { method: "POST", body: JSON.stringify(data) }),
  updateVideo: (id, data) => request(`/videos/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  deleteVideo: (id) => request(`/videos/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
```

---

### Step 2: Role-Based Filtering in `AdminDashboard.jsx`

In `frontend/src/pages/AdminDashboard.jsx`:
1. Check the logged-in user's role via `adminApi.me()`.
2. Hide the `"messages"` tab if `currentUser.role !== "SUPER_ADMIN"`.
3. Only call `adminApi.messages()` if the user is a `SUPER_ADMIN`. (Calling it as an `OPERATOR` returns `403 Forbidden`).

Here is the exact implementation pattern:

```jsx
// Inside AdminDashboard.jsx:

// 1. Filter sections dynamically:
const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

const visibleSections = useMemo(() => {
  return [
    { id: "institutions", label: "Institutions" },
    { id: "services", label: "Services" },
    ...(isSuperAdmin ? [{ id: "messages", label: "Messages" }] : []),
    { id: "site-settings", label: "Location & contact" },
    { id: "home", label: "Home content" },
  ];
}, [isSuperAdmin]);

// 2. Refresh data conditionally:
const refreshData = useCallback(async () => {
  try {
    const promises = [
      adminApi.institutions(),
      adminApi.services(),
    ];

    // Only query contact messages if user is SUPER_ADMIN
    if (isSuperAdmin) {
      promises.push(adminApi.messages());
    }

    const [institutionRows, serviceRows, messageResponse] = await Promise.all(promises);

    setInstitutions(institutionRows);
    setServices(serviceRows);
    if (messageResponse) {
      setMessages(messageResponse.data || []);
      setUnreadCount(messageResponse.meta?.unreadCount || 0);
    }
    setError("");
    return true;
  } catch (requestError) {
    setError(requestError.message);
    return false;
  }
}, [isSuperAdmin]);
```

---

### Step 3: Institution Logo Uploads (`InstitutionManager.jsx`)

The server fully supports `multipart/form-data` through Cloudinary:
- Field name: `logo`
- Accepted types: `image/jpeg`, `image/png`, `image/webp`
- Max file size: `2 MB`
- Validation: Server inspects file magic bytes (signatures `FF D8 FF`, `89 50 4E 47`, etc.) to block forged extensions.
- Storage: Uploaded images are stored in Cloudinary folder `hawassa-mesob/logos/` and their public HTTPS URL is saved into the database `service_providers.icon` field.
- The existing `InstitutionManager.jsx` form already formats `FormData` with field `logo`: no form changes are needed!

---

## 3. API Endpoints Reference Matrix

### Authentication Endpoints

| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | `POST` | Public (Rate Limited) | Body: `{ email, password }`<br>Returns: `{ user: { id, email, name, role }, token }`<br>Sets `HttpOnly` cookie `mesob_admin_token`. |
| `/api/auth/logout` | `POST` | Public | Clears `mesob_admin_token` cookie. |
| `/api/auth/me` | `GET` | Authenticated | Returns current user profile and role `{ user: { id, email, name, role } }`. |

### Institutions & Services

| Endpoint | Method | Access | Notes |
| :--- | :--- | :--- | :--- |
| `/api/institutions` | `GET` | Public | Query: `?raw=true&includeInactive=true&limit=50` returns `{ data: [...] }`. |
| `/api/institutions/:id` | `GET` | Public | Returns single institution with services. |
| `/api/institutions` | `POST` | `SUPER_ADMIN`, `OPERATOR` | Accepts JSON or `multipart/form-data` with `logo` file. |
| `/api/institutions/:id` | `PUT` | `SUPER_ADMIN`, `OPERATOR` | Accepts JSON or `multipart/form-data` with `logo` file. |
| `/api/institutions/:id` | `DELETE` | `SUPER_ADMIN`, `OPERATOR` | Soft deactivates (`?permanent=true` hard deletes). |
| `/api/services` | `GET` | Public | Query: `?raw=true&includeInactive=true&limit=50` returns `{ data: [...] }`. |
| `/api/services` | `POST` | `SUPER_ADMIN`, `OPERATOR` | Creates service under `providerId`. |
| `/api/services/:id` | `PATCH` / `PUT` | `SUPER_ADMIN`, `OPERATOR` | Updates service fields and fees. |
| `/api/services/:id` | `DELETE` | `SUPER_ADMIN`, `OPERATOR` | Soft deactivates (`?permanent=true` hard deletes). |

### Citizen Contact Messages (Inbox)

| Endpoint | Method | Access | Notes |
| :--- | :--- | :--- | :--- |
| `/api/contact/messages` | `GET` | **`SUPER_ADMIN` ONLY** | Returns `{ data: [...], meta: { total, unreadCount } }`.<br>**`OPERATOR` gets `403 Forbidden`**. |
| `/api/contact/messages/:id` | `PATCH` | **`SUPER_ADMIN` ONLY** | Body: `{ isReviewed: boolean }`. Updates read/unread status.<br>**`OPERATOR` gets `403 Forbidden`**. |
| `/api/messages` | `GET` | **`SUPER_ADMIN` ONLY** | Alias route matching `/api/contact/messages`. |
| `/api/messages/:id` | `PATCH` | **`SUPER_ADMIN` ONLY** | Alias route matching `/api/contact/messages/:id`. |

### Homepage Content & Site Settings

| Endpoint | Method | Access | Notes |
| :--- | :--- | :--- | :--- |
| `/api/news` | `GET` | Public | Query: `?raw=true&includeInactive=true` returns `{ data: [...] }`. |
| `/api/news` | `POST` | `SUPER_ADMIN`, `OPERATOR` | Creates news article. |
| `/api/news/:id` | `PUT` | `SUPER_ADMIN`, `OPERATOR` | Updates news article. |
| `/api/news/:id` | `DELETE` | `SUPER_ADMIN`, `OPERATOR` | Deletes news article. |
| `/api/announcements` | `GET` | Public | Query: `?raw=true&includeInactive=true` returns `{ data: [...] }`. |
| `/api/announcements` | `POST` | `SUPER_ADMIN`, `OPERATOR` | Creates announcement. |
| `/api/announcements/:id` | `PUT` | `SUPER_ADMIN`, `OPERATOR` | Updates announcement. |
| `/api/announcements/:id` | `DELETE` | `SUPER_ADMIN`, `OPERATOR` | Deletes announcement. |
| `/api/videos` | `GET` | Public | Query: `?raw=true&includeInactive=true` returns `{ data: [...] }`. |
| `/api/videos` | `POST` | `SUPER_ADMIN`, `OPERATOR` | Creates video and extracts YouTube embed/thumbnail. |
| `/api/videos/:id` | `PUT` | `SUPER_ADMIN`, `OPERATOR` | Updates video details. |
| `/api/videos/:id` | `DELETE` | `SUPER_ADMIN`, `OPERATOR` | Deletes video. |
| `/api/map` | `GET` | Public | Returns `{ contact, map }`. (Alias: `/api/location`). |
| `/api/map` | `PUT` / `POST` | `SUPER_ADMIN`, `OPERATOR` | Updates location, business hours, and map settings. |

---

## 4. Operator Account Management CLI

To safely provision administrators without hardcoding passwords in Git:

```bash
# Provision a SUPER_ADMIN (Manager)
node scripts/create-admin.js manager@hawassa.gov.et YourStrongPassword123! "MESOB Manager" SUPER_ADMIN

# Provision an OPERATOR (IT Team)
node scripts/create-admin.js it.operator@hawassa.gov.et YourStrongPassword123! "MESOB IT Operator" OPERATOR
```

### Pre-Provisioned Development Test Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| `SUPER_ADMIN` | `superadmin@mesob.hawassa.gov.et` | `AdminSuperSecret2026!` |
| `OPERATOR` | `operator@mesob.hawassa.gov.et` | `OperatorPass2026!` |

---

## 5. Security & Verification

1. **Automated Test Suite**: Run `npm test` inside `server/` to execute all 81 automated tests verifying:
   - Login, logout, session expiration.
   - 401 on unauthenticated access across all mutations and admin queries.
   - 403 Forbidden when `OPERATOR` attempts to access contact messages.
   - Successful CRUD for `OPERATOR` on institutions, services, news, announcements, videos, and map settings.
   - Full access for `SUPER_ADMIN` on all features.
   - Logo upload validation rejecting non-image buffers.
   - Public endpoint regressions (visitor service browsing, AI chatbot, citizen contact form).
