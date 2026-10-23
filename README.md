<div align="center">

# 🏛️ Hawassa MESOB Portal Backend API

### Unified Citizen Services, Authentic Public Institutions & AI-Powered Multilingual Assistant

[![Node.js Version](https://img.shields.io/badge/Node.js-v20+-68a063?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-v5.3-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169e1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-v6.19-2d3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Google Gemini AI](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285f4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Languages](https://img.shields.io/badge/Languages-EN%20%7C%20AM%20%7C%20SID-ff6b6b?style=for-the-badge)](#-multilingual-support)
[![Tests Passing](https://img.shields.io/badge/Tests-46%2F46%20Passing-brightgreen?style=for-the-badge)](#-automated-testing-suite)

<p align="center">
  <b>The single digital gateway for citizens of Hawassa City to explore government institutions, inspect document requirements, verify processing times & service fees, watch documentary videos, locate the physical MESOB Center on Google Maps, and consult a context-grounded AI assistant.</b>
</p>

---

[API Matrix](#-api-endpoints-matrix) • [Client Integration Guide (Institutions & Services Modal)](#-client-developer-guide-institutions--services-modal-workflow) • [Chatbot Integration](#-ai-chatbot-api-integration) • [Media, Map & News Endpoints](#-portal-features-api-videos-map-news-announcements) • [Admin CRUD](#-admin-management-api) • [Local Setup](#-local-development--setup)

</div>

---

## 🧭 System Architecture

```mermaid
graph TB
    subgraph Client ["Frontend Client (React / Vite)"]
        Grid["Institutions Grid & Cards"]
        Modal["Service Details Accordion Modal"]
        Chat["Multilingual AI Assistant Widget"]
        Media["YouTube Videos & News Feed"]
        MapUI["Google Maps Embed & Contact Form"]
    end

    subgraph Gateway ["Express API Gateway (:5000)"]
        Helmet["Helmet Security & CORP (cross-origin)"]
        CORS["CORS Guard (Localhost & 10.x LAN IPs)"]
        RateLimit["Rate Limiters (Chat: 30/min, API: 120/min)"]
        Static["Static Asset Server (/logos, /public)"]
    end

    subgraph Controllers ["Backend Modules"]
        InstCtrl["Institutions & Services Engine"]
        ChatCtrl["3-Tier Multilingual Chatbot"]
        MediaCtrl["Videos, News & Announcements"]
        MapCtrl["Hawassa MESOB Map & Location"]
    end

    subgraph Storage ["Data Layer"]
        PG[("PostgreSQL Database via Prisma")]
        Gemini["Google Gemini 2.5 Flash AI"]
        Logos["Authentic Institution SVG/PNG Logos"]
    end

    Client --> Helmet --> CORS --> RateLimit
    RateLimit --> Static --> Logos
    RateLimit --> InstCtrl --> PG
    RateLimit --> MediaCtrl --> PG
    RateLimit --> MapCtrl
    RateLimit --> ChatCtrl
    ChatCtrl -->|Tier 1 / 2 Instant Cache| Client
    ChatCtrl -->|Tier 3 Context-Grounded| PG
    PG --> Gemini --> Client
```

---

## 🌐 Server Base URL

All endpoints are hosted and served at:
```http
Local Machine: http://localhost:5000
Private LAN:   http://10.20.254.64:5000
```

---

## 📡 API Endpoints Matrix

### 1. Institutions & Services

| Method | Endpoint | Description | Query Parameters |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/institutions` | List all 13 authentic institutions with logos & service counts | `?locale=en\|am\|sid&page=1&limit=20&search=...&includeServices=true&raw=true` |
| `GET` | `/api/institutions/:id` | Single institution with nested active services list | `?locale=en\|am\|sid&raw=true&includeInactive=true` |
| `GET` | `/api/institutions/:id/services` | Paginated services belonging to a specific institution | `?locale=en\|am\|sid&page=1&limit=20&raw=true` |
| `GET` | `/api/services` | Flat catalog of all 24 services across institutions (filterable by institution) | `?providerId=:id&providerCode=ETHIO_POST&locale=en\|am\|sid&search=...` |
| `GET` | `/api/services/:id` | Single service details with embedded parent institution | `?locale=en\|am\|sid&raw=true` |
| `POST` | `/api/institutions` | **[Admin]** Create institution (supports instant nested services) | Body: `{ name, code, icon, floorRoomNumber, contactPhone, services: [...] }` |
| `PUT` | `/api/institutions/:id` | **[Admin]** Update institution details / status | Body: `{ name, code, icon, floorRoomNumber, contactPhone, isActive }` |
| `DELETE` | `/api/institutions/:id` | **[Admin]** Soft-delete (archive) or hard delete | `?permanent=true` (optional hard delete) |
| `POST` | `/api/institutions/:id/services` | **[Admin]** Add service(s) to an institution (single or batch) | Body: `{ title, description, requirements, estimatedFee, processingDays }` |
| `POST` | `/api/services` | **[Admin]** Add service globally | Body: `{ providerId, title, description, requirements, estimatedFee, processingDays }` |
| `PUT` | `/api/services/:id` | **[Admin]** Update service details / fee / requirements | Body: `{ title, description, requirements, estimatedFee, processingDays, isActive }` |
| `DELETE` | `/api/services/:id` | **[Admin]** Soft-delete (archive) or hard delete service | `?permanent=true` (optional hard delete) |

### 2. Static Logos & Brand Assets

| Method | Endpoint | Description |
| :---: | :--- | :--- |
| `GET` | `/logos/:filename` | Authentic institution logos (`post.png`, `sidama_bank.png`, `trade.png`, `electric.png`, `land.png`, `LABOR_AND_SKILLS.png`, `revenue.png`, `fayda.png`, `immigration.png`, `cbe.png`, `telecom.png`, `transport.png`, `vital_events.png`). Configured with `Cross-Origin-Resource-Policy: cross-origin`. |

### 3. Citizen Chatbot & Public Features

| Method | Endpoint | Description | Query / Body Params |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck and timestamp | Public |
| `POST` | `/api/chat` | Multilingual citizen inquiry AI chatbot (3-tier) | `{ message, locale, sessionId }` |
| `GET` | `/api/videos` | YouTube video gallery of Hawassa MESOB Center | Public |
| `GET` | `/api/videos/:id` | Single video item by ID | Public |
| `POST` | `/api/videos` | Add a new YouTube video link | `{ title, youtubeUrl, description, duration, author, category }` |
| `GET` | `/api/map` *(alias `/api/location`)* | Hawassa MESOB Center coordinates, Google Maps embed iframe, hours & contact | Public |
| `PUT` / `POST` | `/api/map` | Update MESOB location, address, hours, embed iframe URL | `{ address, operatingHours, phone, email, embedUrl, latitude, longitude }` |
| `GET` | `/api/contact` | Official MESOB contact details and hotline | Public |
| `POST` | `/api/contact` *(alias `/api/contact/submit`)* | Submit citizen contact form message | `{ name, email, phone, message }` |
| `GET` | `/api/contact/messages` | View all citizen contact submissions | Public / Admin |
| `GET` | `/api/news` | List published news articles | `?category=...&search=...&limit=...` |
| `GET` | `/api/news/:id` | Single news article by ID | Public |
| `POST` | `/api/news` | Publish a new news article | `{ title, content, author, category, image }` |
| `GET` | `/api/announcements` | Active announcements | `?priority=high\|medium\|low&type=update\|alert\|event` |
| `GET` | `/api/announcements/:id` | Single announcement by ID | Public |
| `POST` | `/api/announcements` | Publish a new announcement | `{ title, content, priority, type }` |

---

## 💡 Client Developer Guide: Institutions & Services Modal Workflow

This section explains how the client-side developer can use the backend API endpoints together to build the interactive workflow shown in the application:

1. **Screen 1**: Grid / Carousel of institution cards displaying each organization's authentic logo and name.
2. **Screen 2**: User clicks an institution card (e.g. **Ethiopian Postal Service**). An interactive modal pops up titled **"Ethiopian Postal Service Services"** with an accordion list of its provided services.
3. **Screen 3**: User expands a service (e.g. **National Examination Document Handling**). It reveals:
   - **Required Documents:** List of documents (National ID/passport, support letters, recipient address).
   - **Processing Time::** Clear handling duration.
   - **Service Fee::** Service fee or free-of-charge notice.

```
+-----------------------------------------------------------------------------------+
| STEP 1: Fetch Institutions                                                        |
| GET http://10.20.254.64:5000/api/institutions                                     |
| -> Renders 13 Institution Cards with authentic logos                              |
+-----------------------------------------------------------------------------------+
                                        |
                            (User clicks on a card)
                                        v
+-----------------------------------------------------------------------------------+
| STEP 2: Fetch Institution Services                                                |
| GET http://10.20.254.64:5000/api/institutions/:id                                 |
|   (or GET http://10.20.254.64:5000/api/institutions/:id/services)                 |
|   (or GET http://10.20.254.64:5000/api/services?providerId=:id)                   |
| -> Opens Modal titled "<Institution Name> Services"                               |
+-----------------------------------------------------------------------------------+
                                        |
                         (User expands accordion item)
                                        v
+-----------------------------------------------------------------------------------+
| STEP 3: Display Detailed Requirements, Processing Time & Fees                     |
| -> title / name           : "National Examination Document Handling"              |
| -> requirements           : ["National ID or Passport", "Support letters..."]     |
| -> duration / processing  : "1 day" (or "~15 minutes")                            |
| -> cost / estimatedFee    : "450 ETB"                                             |
+-----------------------------------------------------------------------------------+
```

---

### Step 1: Fetching the Institutions List

Call the institutions endpoint from your React component:

```http
GET http://10.20.254.64:5000/api/institutions?locale=en
```

#### JSON Response (`200 OK`)
```json
{
  "data": [
    {
      "id": "c2590f1a-eeae-46a0-a31b-ee13d315e818",
      "code": "ETHIO_POST",
      "name": "Ethiopian Postal Service",
      "logo": "/logos/post.png",
      "icon": "/logos/post.png",
      "serviceCount": 2,
      "isActive": true
    },
    {
      "id": "b6a831e5-8208-410c-99c5-349fc710e2f9",
      "code": "TRADE_AND_MARKET",
      "name": "Trade and Market",
      "logo": "/logos/trade.png",
      "icon": "/logos/trade.png",
      "serviceCount": 3,
      "isActive": true
    },
    {
      "id": "c6204c86-8bc5-46e3-85b3-21c68f121175",
      "code": "ETHIOPIAN_ELECTRIC_UTILITY",
      "name": "Ethiopian Electric Utility",
      "logo": "/logos/electric.png",
      "icon": "/logos/electric.png",
      "serviceCount": 2,
      "isActive": true
    },
    {
      "id": "52ba48bb-767d-411d-bd22-9216187515f4",
      "code": "SIDAMA_BANK",
      "name": "Sidama Bank",
      "logo": "/logos/sidama_bank.png",
      "icon": "/logos/sidama_bank.png",
      "serviceCount": 2,
      "isActive": true
    }
  ],
  "meta": {
    "total": 13,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

> 💡 **Image URL Resolution**: The `logo` field contains relative paths like `/logos/post.png`. To display images in your frontend, prepend the server URL:  
> `http://10.20.254.64:5000/logos/post.png`

---

### Step 2: Fetching Services on Institution Click

When a user clicks on an institution card, the client has **four seamless options**. You can query institutions using either their **Full UUID**, **Official Code** (e.g. `ETHIO_POST`), **Web Slug** (e.g. `ethio-post`), or **Short Pro Alias** (e.g. `post`):

#### Option A (Recommended): Single Institution with Embedded Services
```http
# Query by Full UUID:
GET http://10.20.254.64:5000/api/institutions/c2590f1a-eeae-46a0-a31b-ee13d315e818?locale=en

# Query by Pro Short Code or Slug (New!):
GET http://10.20.254.64:5000/api/institutions/ETHIO_POST?locale=en
GET http://10.20.254.64:5000/api/institutions/ethio-post?locale=en
GET http://10.20.254.64:5000/api/institutions/post?locale=en
```

> 🎯 **Pro Short Code Cheat-Sheet**:
> - `ETHIO_POST` / `ethio-post` / `post` -> Ethiopian Postal Service
> - `ICS` / `ics` -> Immigration and Citizenship Service
> - `EEU` / `eeu` / `electric` -> Ethiopian Electric Utility
> - `CBE` / `cbe` -> Commercial Bank of Ethiopia
> - `SIDAMA_BANK` / `sidama-bank` / `sidama` -> Sidama Bank
> - `HAWASSA_TRADE` / `trade` -> Trade and Market Services
> - `HAWASSA_LAND` / `land` -> Land Administration and Investment
> - `LABOR_AND_SKILLS` / `labor` -> Labor and Skill Services
> - `HAWASSA_REVENUE` / `revenue` -> Revenue Authority
> - `ETHIO_TELECOM` / `telecom` -> Ethio Telecom
> - `NATIONAL_ID_PROGRAM` / `fayda` / `nid` -> National ID Program
> - `JUSTICE_DEPT` / `justice` -> Justice Department
> - `URBAN_DEV_CONSTRUCTION` / `urban` -> Urban Development and Construction

#### Option B: Paginated Services Endpoint (Supports Code & Slug)
```http
GET http://10.20.254.64:5000/api/institutions/ETHIO_POST/services?locale=en
GET http://10.20.254.64:5000/api/institutions/post/services?locale=en
GET http://10.20.254.64:5000/api/institutions/c2590f1a-eeae-46a0-a31b-ee13d315e818/services?locale=en
```

#### Option C: Filter Global Services Catalog by Provider ID or Code
```http
GET http://10.20.254.64:5000/api/services?providerCode=ETHIO_POST&locale=en
GET http://10.20.254.64:5000/api/services?providerId=c2590f1a-eeae-46a0-a31b-ee13d315e818&locale=en
```

#### Option D (Zero Extra Network Requests): Pre-fetch with `includeServices=true`
```http
GET http://10.20.254.64:5000/api/institutions?includeServices=true&locale=en
```
Every institution object in `data` will already include its `services: [...]` array!

---

### Step 3: Service Data Schema & Accordion Fields

When fetching the services of **Ethiopian Postal Service**, the backend returns:

```json
{
  "id": "c2590f1a-eeae-46a0-a31b-ee13d315e818",
  "code": "ETHIO_POST",
  "name": "Ethiopian Postal Service",
  "logo": "/logos/post.png",
  "icon": "/logos/post.png",
  "services": [
    {
      "id": "457d08c9-be16-4de4-a172-2e17f9e262c3",
      "title": "National Examination Document Handling",
      "name": "National Examination Document Handling",
      "description": "Booking, express handling, and delivery of national examination documents and educational certificates. Processing time is ~15 minutes depending on document/shipment size. EMS fee: 450 ETB; some standard services free.",
      "requirements": [
        "National ID or Passport",
        "Support letters for registration or booking",
        "Full recipient address and contact details"
      ],
      "requiredDocuments": [
        "National ID or Passport",
        "Support letters for registration or booking",
        "Full recipient address and contact details"
      ],
      "estimatedFee": 450,
      "cost": "450 ETB",
      "processingDays": 1,
      "duration": "1 day",
      "isActive": true
    },
    {
      "id": "7a086be4-3b48-47bb-a873-be379a9bf696",
      "title": "National ID (NID) Card Printing & Distribution",
      "name": "National ID (NID) Card Printing & Distribution",
      "description": "Printing and distribution of physical Fayda National Digital ID cards in collaboration with the National ID Program.",
      "requirements": [
        "National ID (Fayda) Registration Slip or FIN Number (to be added)"
      ],
      "requiredDocuments": [
        "National ID (Fayda) Registration Slip or FIN Number (to be added)"
      ],
      "estimatedFee": null,
      "cost": "Free / Variable",
      "processingDays": null,
      "duration": "Same day / Variable",
      "isActive": true
    }
  ]
}
```

#### Data Field Mapping Table

| UI Element in Screenshot | Backend Property | Fallback / Formatting |
| :--- | :--- | :--- |
| **Modal Header** | `institution.name + " Services"` | `"Ethiopian Postal Service Services"` |
| **Institution Logo** | `BASE_URL + institution.logo` | `http://10.20.254.64:5000/logos/post.png` |
| **Accordion Item Title** | `service.title` or `service.name` | `"National Examination Document Handling"` |
| **Required Documents** | `service.requirements` or `service.requiredDocuments` | Array of strings (render with `<ul><li>...</li></ul>`) |
| **Processing Time** | `service.duration` or `service.processingDays` | `"1 day"`, or extracted from `service.description` |
| **Service Fee** | `service.cost` or `service.estimatedFee` | `"450 ETB"` or `"Free of charge"` |

---

### Step 4: Ready-to-Use React Implementation

Below is the clean, drop-in React implementation showing how to bind `InstitutionCard` and `InstitutionModal` with live API data.

#### 1. `useInstitutions.js` (Custom Hook)

```javascript
import { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://10.20.254.64:5000';

export function useInstitutions(locale = 'en') {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all institutions with their services included in 1 clean request
  const loadInstitutions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/institutions?includeServices=true&locale=${locale}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      
      // Ensure data is formatted with absolute image URLs
      const formatted = (json.data || []).map((inst) => ({
        ...inst,
        logo: inst.logo?.startsWith('http') ? inst.logo : `${API_BASE}${inst.logo}`,
      }));

      setInstitutions(formatted);
    } catch (err) {
      setError(err.message || 'Failed to fetch institutions');
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    loadInstitutions();
  }, [loadInstitutions]);

  return { institutions, loading, error, refresh: loadInstitutions };
}
```

#### 2. `InstitutionsSection.jsx` (Grid with Modal)

```jsx
import React, { useState } from 'react';
import { useInstitutions } from './useInstitutions';
import InstitutionCard from './InstitutionCard';
import InstitutionModal from './InstitutionModal';

export function InstitutionsSection({ locale = 'en' }) {
  const { institutions, loading, error } = useInstitutions(locale);
  const [selectedInstitution, setSelectedInstitution] = useState(null);

  const handleCardClick = (inst) => {
    setSelectedInstitution(inst);
  };

  const handleCloseModal = () => {
    setSelectedInstitution(null);
  };

  if (loading) {
    return <div className="p-12 text-center text-white">Loading institutions...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-400">Error: {error}</div>;
  }

  return (
    <section className="bg-[#0f172a] py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-white text-center mb-10">
          Service Provider Institutions
        </h2>

        {/* 4 Cards Per Row Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {institutions.map((inst) => (
            <InstitutionCard
              key={inst.id}
              institution={inst}
              onClick={() => handleCardClick(inst)}
            />
          ))}
        </div>

        {/* Modal Popup with Services Accordion */}
        {selectedInstitution && (
          <InstitutionModal
            institution={selectedInstitution}
            onClose={handleCloseModal}
          />
        )}
      </div>
    </section>
  );
}
```

#### 3. `InstitutionModal.jsx` (Accordion Displaying Requirements, Fee & Duration)

```jsx
import React, { useState } from 'react';

export default function InstitutionModal({ institution, onClose }) {
  const [expandedId, setExpandedId] = useState(
    institution.services?.[0]?.id || null // Open first item by default
  );

  if (!institution) return null;

  const toggleService = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#1e293b] border border-slate-700 w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-[#0f172a] px-6 py-4 flex items-center justify-between border-b border-slate-700">
          <h2 className="text-white text-xl font-bold">
            {institution.name} Services
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body / Services Accordion List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {(!institution.services || institution.services.length === 0) ? (
            <p className="text-slate-400 text-center py-8">No services listed for this institution.</p>
          ) : (
            institution.services.map((srv) => {
              const isExpanded = expandedId === srv.id;
              return (
                <div key={srv.id} className="bg-[#334155] rounded-xl overflow-hidden border border-slate-600/50">
                  {/* Accordion Title Header */}
                  <button
                    onClick={() => toggleService(srv.id)}
                    className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-600/40 transition-colors"
                  >
                    <span className="text-white font-semibold text-base">
                      {srv.title || srv.name}
                    </span>
                    <svg
                      className={`w-5 h-5 text-slate-300 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Accordion Content */}
                  {isExpanded && (
                    <div className="px-5 py-4 bg-[#1e293b]/80 border-t border-slate-700 text-sm space-y-3">
                      {/* Description */}
                      {srv.description && (
                        <p className="text-slate-300 leading-relaxed">{srv.description}</p>
                      )}

                      {/* Required Documents */}
                      {srv.requirements && srv.requirements.length > 0 && (
                        <div>
                          <p className="text-emerald-400 font-semibold mb-1">Required Documents:</p>
                          <ul className="list-disc list-inside space-y-1 text-slate-300">
                            {srv.requirements.map((reqText, idx) => (
                              <li key={idx}>{reqText}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Processing Time */}
                      <div>
                        <span className="text-slate-400 font-semibold">Processing Time:: </span>
                        <span className="text-slate-200 font-medium">
                          {srv.duration || (srv.processingDays ? `${srv.processingDays} days` : 'Same day / Variable')}
                        </span>
                      </div>

                      {/* Service Fee */}
                      <div>
                        <span className="text-slate-400 font-semibold">Service Fee:: </span>
                        <span className="text-amber-300 font-medium">
                          {srv.cost || (srv.estimatedFee ? `${srv.estimatedFee} ETB` : 'Free of charge')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
```

---

## 🤖 AI Chatbot API Integration

```http
POST http://10.20.254.64:5000/api/chat
Content-Type: application/json
```

The chatbot leverages a **3-tier hybrid intelligence architecture**:

1. **Tier 1 (Instant Greetings)**: Welcomes citizens in English, Amharic, or Sidaamu Afoo in `<5ms`.
2. **Tier 2 (Instant FAQ Match)**: High-speed keyword and exact phrase cache for top inquiries (`<50ms`).
3. **Tier 3 (Google Gemini 2.5 Flash)**: Context-grounded LLM injected with authentic Hawassa MESOB institutions, counter numbers, and fee schedules (`3–8s`).
4. **Scope-Guard & Prompt Defense**: Strictly prevents off-topic inquiries and system prompt leakage.

### 1. Request Body Schema

```json
{
  "message": "What documents do I need for Ethiopian Origin ID?",
  "locale": "en",
  "sessionId": "b47c87c2-9e32-4d2b-9831-7b0b8d2ef020"
}
```

| Field | Type | Required | Default | Rules |
| :--- | :---: | :---: | :---: | :--- |
| `message` | `string` | **Yes** | — | 1 to 500 characters. Sanitized against control codes. |
| `locale` | `string` | No | `"en"` | Supported: `"en"` (English), `"am"` (Amharic), `"sid"` (Sidaamu Afoo). |
| `sessionId` | `string` | No | — | Optional UUID (v1–v5). |

### 2. Response Body Schema

```json
{
  "reply": "**Requirements for Ethiopian Origin ID (Yellow Card):**\n\n1. Properly filled out application form\n2. Ordinary passport valid for >6 months\n3. Copy of entry visa or e-visa\n4. Machine-readable Ethiopian passport or birth certificate\n5. Fee: 300 USD regular / 400 USD urgent\n\n📍 Visit **Counter 1 & 2** at Hawassa MESOB Center.",
  "tier": 2
}
```

---

## 📺 Portal Features API (Videos, Map, News, Announcements)

### 1. YouTube Videos Gallery (`/api/videos`)

#### `GET /api/videos`
Returns the 8 curated Hawassa MESOB YouTube documentaries and citizen guides with automatic embed links and thumbnails:

```json
[
  {
    "id": "vid-1",
    "title": "MESOB Center Inauguration Speech",
    "youtubeUrl": "https://www.youtube.com/watch?v=WGRWiVXvlQY",
    "embedUrl": "https://www.youtube.com/embed/WGRWiVXvlQY",
    "thumbnail": "https://img.youtube.com/vi/WGRWiVXvlQY/maxresdefault.jpg",
    "description": "Official keynote speech delivered at the inauguration of Hawassa City MESOB Center.",
    "duration": "15:32",
    "views": "1.3M views",
    "category": "Inauguration"
  }
]
```

---

### 2. Map & Headquarters Location (`/api/map`)

#### `GET /api/map` *(or `/api/location`)*
Returns authentic coordinates, office operating hours, address, and the verified Google Maps iframe embed for Hawassa City MESOB Center:

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
    "coordinates": { "latitude": 7.0472875, "longitude": 38.4830077 },
    "embedUrl": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2561.4752292494895!2d38.48300768684871!3d7.047287523046484!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x17b145005515512d%3A0xe78217b9f10cede0!2sHAWASSA%20CITY%20MESOB%20CENTER!5e1!3m2!1sen!2set!4v1792568981976!5m2!1sen!2set",
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=HAWASSA+CITY+MESOB+CENTER"
  }
}
```

---

### 3. Citizen Contact Form (`/api/contact`)

#### `POST /api/contact` *(or `/api/contact/submit`)*
```json
{
  "name": "Abebe Kebede",
  "email": "abebe@example.com",
  "phone": "+251911223344",
  "message": "Inquiry regarding Fayda national ID card replacement."
}
```

---

### 4. News & Announcements (`/api/news` & `/api/announcements`)

- `GET /api/news`: Latest public service bulletins, center updates, and press releases.
- `GET /api/announcements`: High-priority operational alerts and extended hours notifications.

---

## 🛠️ Admin Management API

Center managers can administer institutions and services through CRUD endpoints.

### Query Parameters for Admins

| Param | Type | Purpose |
| :--- | :---: | :--- |
| `raw=true` | boolean | Returns complete trilingual JSONB `{ en, am, sid }` for populating admin edit inputs. |
| `includeInactive=true` | boolean | Includes deactivated/archived institutions and services. |

### Creating an Institution with Instant Services
```http
POST /api/institutions
Content-Type: application/json

{
  "name": {
    "en": "Hawassa Water & Sewerage",
    "am": "የሀዋሳ ከተማ የውሃ እና ፍሳሽ",
    "sid": "Hawaasa Quchumi Wotonna Fushshote"
  },
  "code": "HAWASSA_WATER",
  "icon": "/logos/water.png",
  "floorRoomNumber": "Counter 7 & 8",
  "contactPhone": "+251 46 220 4455",
  "services": [
    {
      "title": "New Water Meter Installation",
      "description": "Inspection and domestic meter setup.",
      "requirements": ["Kebele Resident ID", "Title deed"],
      "estimatedFee": 850.0,
      "processingDays": 5
    }
  ]
}
```

---

## 🌐 Multilingual Support

The portal natively supports the 3 official working languages of Hawassa City and the Sidama Region:

| Code | Language | Native Name | Status |
| :---: | :--- | :--- | :---: |
| `en` | English | English | Default |
| `am` | Amharic | አማርኛ | Fully Supported |
| `sid` | Sidaamu Afoo | Sidaamu Afoo | Fully Supported |

Query with `?locale=am` or `?locale=sid` on all institutions, services, news, and chat endpoints to get localized responses automatically.

---

## 🛡️ Security, Rate Limits & CORS

- **Helmet Security Headers**: Active with `Cross-Origin-Resource-Policy: cross-origin` to ensure images and logos load without browser blocking.
- **CORS Hardening**: Accepts requests from `localhost:5173`, `localhost:3000`, and private local networks (`10.x.x.x` and `192.168.x.x`).
- **Rate Limiting**:
  - Chatbot: **30 req / min / IP**
  - General API: **120 req / min / IP**
  - Includes standard `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset` HTTP headers.

---

## 🧪 Local Development & Setup

### Prerequisites
- **Node.js**: v20 or higher
- **PostgreSQL**: Running instance with database created

### Step-by-Step Setup

```bash
# 1. Clone the repository
git clone https://github.com/GurmesaAyele/hawassa-mesob.git
cd hawassa-mesob

# 2. Install Server Dependencies
cd server
npm install

# 3. Configure Environment Variables
# Create a .env file inside server/ with:
# PORT=5000
# DATABASE_URL="postgresql://postgres:password@localhost:5432/hawassa_mesob?schema=public"
# GEMINI_API_KEY="your-gemini-api-key"
# CORS_ORIGIN="http://localhost:5173,http://10.20.254.64:5173"

# 4. Generate Prisma Client & Run Migrations
npx prisma generate
npx prisma db push

# 5. Start Development Server
npm run dev
# Server runs on http://localhost:5000 (and LAN http://10.20.254.64:5000)
```

---

## 🔬 Automated Testing Suite

The backend repository includes an extensive, **100% automated test suite** covering security, rate limiting, CORS, input sanitization, multilingual fidelity, institutions, services, and chatbot tiers:

```bash
cd server
npm test
```

```text
▶ 1. Security Headers & Server Identification
  ✔ GET /api/health should include Helmet security headers and omit X-Powered-By
▶ 2. Input Validation & Body Sanitization (POST /api/chat)
  ✔ Valid English, Amharic, and Sidaamu Afoo queries return 200
  ✔ Empty / Whitespace / 500+ char messages return 400 Bad Request
  ✔ Malformed JSON body returns 400 Bad Request
▶ 3. Scope Guard & Prompt Injection Defense
  ✔ Off-topic questions trigger polite scope refusal
  ✔ System prompt leaks / injection attempts safely deflected
▶ 4. CORS Origin Hardening
  ✔ Trusted origins accepted; untrusted origins rejected with 403
▶ 5. Rate Limiting Enforcement
  ✔ POST /api/chat enforces per-IP limits with RateLimit headers
▶ 6. Institutions & Services API Endpoints
  ✔ GET /api/institutions returns verified service counts & logos
  ✔ GET /api/institutions/:id returns details + nested active services
  ✔ GET /api/services returns catalog with parent institution metadata
  ✔ Support for ?includeServices=true and ?providerId= filter
▶ 7. YouTube Videos & Media Endpoints
  ✔ GET /api/videos returns all 8 verified video items with embeds
▶ 8. Map & Location Endpoints
  ✔ GET /api/map returns Hawassa MESOB Center coordinates & embed iframe
▶ 9. Contact & Citizen Inquiries
  ✔ POST /api/contact receives and stores citizen feedback
▶ 10. News & Announcements Endpoints
  ✔ GET /api/news and GET /api/announcements return active bulletins

ℹ tests 46 | suites 12 | pass 46 | fail 0
```

---

<div align="center">
  <sub>Hawassa MESOB Center Portal • Developed for the Citizens of Hawassa City Administration, Sidama Region, Ethiopia</sub>
</div>
