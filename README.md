<div align="center">

# 🏛️ Hawassa MESOB Portal Backend API

### Unified Citizen Services, Authentic Public Institutions & AI-Powered Multilingual Assistant

[![Node.js Version](https://img.shields.io/badge/Node.js-v20+-68a063?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-v5.3-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169e1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-v6.19-2d3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Google Gemini AI](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285f4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Languages](https://img.shields.io/badge/Languages-EN%20%7C%20AM%20%7C%20SID-ff6b6b?style=for-the-badge)](#-multilingual-support)
[![Tests Passing](https://img.shields.io/badge/Tests-48%2F48%20Passing-brightgreen?style=for-the-badge)](#-automated-testing-suite)

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

### 1. 🎬 Official YouTube Videos API Client Integration Guide

```http
GET http://10.20.254.64:5000/api/videos
```

The Videos API delivers verified YouTube documentaries, inaugurations, walk-through guides, and service explanations with **trilingual localization** (`en`, `am`, `sid`), high-res thumbnail covers, embedded iframe player URLs, view counts, and duration stamps.

#### 1. Endpoints & Query Parameters

| Method | Endpoint | Query Parameters | Description |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/videos` | `?locale=en\|am\|sid`<br>`?category=Inauguration\|Services\|Documentary\|...`<br>`?search=...`<br>`?limit=8`<br>`?raw=true` | Returns all video records formatted for client display. The `search` and `category` filters match across all 3 languages simultaneously. |
| `GET` | `/api/videos/:id` | `?locale=en\|am\|sid&raw=true` | Fetch a single video item by ID with full metadata and `translations`. |
| `POST` | `/api/videos` | — | Submit a new YouTube video link. Accepts plain strings or `{ en, am, sid }` localized payloads. |
| `DELETE` | `/api/videos/:id` | — | Remove a video from the catalog by ID. |

#### 2. JSON Response Example (`GET /api/videos?locale=am&limit=1`)

```json
[
  {
    "id": "vid-1",
    "title": "የመሶብ ማዕከል የምረቃ ንግግር",
    "description": "በሀዋሳ ከተማ መሶብ ማዕከል የምረቃ ስነ-ስርዓት ላይ የቀረበ ይፋዊ የመክፈቻ ንግግር።",
    "category": "ምረቃ",
    "author": "መሶብ",
    "youtubeUrl": "https://www.youtube.com/watch?v=WGRWiVXvlQY",
    "embedUrl": "https://www.youtube.com/embed/WGRWiVXvlQY",
    "thumbnail": "https://img.youtube.com/vi/WGRWiVXvlQY/maxresdefault.jpg",
    "duration": "15:32",
    "views": "1.3M views",
    "date": "2024-05-10T10:00:00.000Z",
    "translations": {
      "title": {
        "en": "MESOB Center Inauguration Speech",
        "am": "የመሶብ ማዕከል የምረቃ ንግግር",
        "sid": "Mesob Xonchi Fanoote Ayyaani Xawishsha"
      },
      "description": {
        "en": "Official keynote speech delivered at the inauguration ceremony of the Hawassa City MESOB Center.",
        "am": "በሀዋሳ ከተማ መሶብ ማዕከል የምረቃ ስነ-ስርዓት ላይ የቀረበ ይፋዊ የመክፈቻ ንግግር።",
        "sid": "Hawaasa Katamara Mesob xonchi fanoote ayyaana aana shiqino babbaxxino xawishsha."
      },
      "category": {
        "en": "Inauguration",
        "am": "ምረቃ",
        "sid": "Fanoote"
      },
      "author": {
        "en": "MESOB",
        "am": "መሶብ",
        "sid": "MESOB"
      }
    }
  }
]
```

#### 3. Ready-to-Use React Hook (`useVideos.js`)

Save this file in `src/hooks/useVideos.js` or `src/features/videos/useVideos.js`:

```javascript
import { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://10.20.254.64:5000';

export function useVideos(locale = 'en', category = '', search = '') {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ locale });
      if (category) params.append('category', category);
      if (search) params.append('search', search);

      const res = await fetch(`${API_BASE}/api/videos?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const data = await res.json();
      setVideos(data);
    } catch (err) {
      setError(err.message || 'Failed to load videos.');
    } finally {
      setLoading(false);
    }
  }, [locale, category, search]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return { videos, loading, error, refresh: fetchVideos };
}
```

#### 4. Frontend Component (`VideosSection.jsx`) with Modal Player

This component renders responsive video cards with duration pills, views counts, hover effects, category filtering, and an interactive pop-up YouTube player:

```jsx
import React, { useState } from 'react';
import { useVideos } from './useVideos';

export default function VideosSection({ locale = 'en' }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeVideo, setActiveVideo] = useState(null);
  const { videos, loading, error, refresh } = useVideos(locale, selectedCategory);

  const categories = [
    { label: 'All', value: '' },
    { label: 'Inauguration', value: 'Inauguration' },
    { label: 'Services', value: 'Services' },
    { label: 'Documentary', value: 'Documentary' },
    { label: 'Innovation', value: 'Innovation' },
  ];

  return (
    <section className="bg-slate-950 py-20 px-6 text-slate-100">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-semibold text-blue-400 tracking-wider uppercase">
              Video Gallery
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-1">
              Hawassa MESOB in Action
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Watch keynote inauguration speeches, citizen workflow walkthroughs, and documentaries.
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading & Error States */}
        {loading && (
          <div className="text-center py-16 text-slate-400">Loading videos...</div>
        )}
        {error && (
          <div className="text-center py-12 text-red-400">
            {error} <button onClick={refresh} className="underline ml-2">Retry</button>
          </div>
        )}

        {/* Video Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {videos.map((vid) => (
            <div
              key={vid.id}
              onClick={() => setActiveVideo(vid)}
              className="group bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50 flex flex-col justify-between"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video overflow-hidden bg-slate-950">
                <img
                  src={vid.thumbnail}
                  alt={vid.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                  <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 fill-current ml-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                {/* Duration Badge */}
                <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                  {vid.duration}
                </span>
              </div>

              {/* Video Info */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                    <span className="text-blue-400 font-medium">{vid.category}</span>
                    <span>{vid.views}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors">
                    {vid.title}
                  </h3>
                  <p className="text-slate-400 text-xs line-clamp-2">
                    {vid.description}
                  </p>
                </div>
                <div className="text-[11px] text-slate-400 pt-3 mt-3 border-t border-slate-800/80">
                  By <span className="text-slate-300 font-medium">{vid.author}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Video Pop-up Modal Player */}
        {activeVideo && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setActiveVideo(null)}
          >
            <div
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden max-w-4xl w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 flex items-center justify-between border-b border-slate-800">
                <h4 className="text-white font-semibold truncate pr-4 text-sm sm:text-base">
                  {activeVideo.title}
                </h4>
                <button
                  onClick={() => setActiveVideo(null)}
                  className="text-slate-400 hover:text-white p-1 text-lg leading-none"
                >
                  ✕
                </button>
              </div>

              {/* YouTube 16:9 Iframe Embed */}
              <div className="relative aspect-video bg-black">
                <iframe
                  src={`${activeVideo.embedUrl}?autoplay=1`}
                  title={activeVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* Modal Footer Description */}
              <div className="p-4 text-xs sm:text-sm text-slate-300 bg-slate-950/60">
                <p className="leading-relaxed">{activeVideo.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
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

### 4. 📰 News API Client Integration Guide

```http
GET http://10.20.254.64:5000/api/news
```

The News API provides verified press releases, inaugurations, operational milestones, and public service updates for Hawassa City MESOB Center with **trilingual localization** (`en`, `am`, `sid`).

#### 1. Endpoints & Query Parameters

| Method | Endpoint | Query Parameters | Description |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/news` | `?locale=en\|am\|sid`<br>`?category=Public+Services`<br>`?search=Fayda`<br>`?limit=6`<br>`?raw=true` | Returns articles with localized strings (`locale`) or raw trilingual objects (`raw=true`). Search filter matches across all 3 languages. |
| `GET` | `/api/news/:id` | `?locale=en\|am\|sid&raw=true` | Fetch a single news article by ID. |
| `POST` | `/api/news` | — | Publish a new article (accepts plain strings or `{ en, am, sid }` objects). |
| `DELETE` | `/api/news/:id` | — | Delete an article by ID. |

#### 2. JSON Response Example (`GET /api/news?locale=am&limit=1`)

```json
[
  {
    "id": "news-1",
    "title": "የሀዋሳ ከተማ መሶብ ማዕከል የተዋሃዱ የዲጂታል አገልግሎት መስኮቶችን አስመረቀ",
    "content": "አዲሱ የሀዋሳ ከተማ መሶብ ማዕከል ከ13 በላይ ዋና ዋና የፌዴራል እና የክልል ተቋማትን በአንድ ጣራ ሥር አስተባብሯል። ዜጎች አሁን የፋይዳ ዲጂታል መታወቂያ፣ የፓስፖርት እድሳት፣ የመንጃ ፈቃድ፣ የመሬት ማረጋገጫ፣ የግብር ክሊራንስ እና የሲቪል ምዝገባ አገልግሎቶችን በራስ-ሰር የሰልፍ አስተዳደር ሥርዓት ማግኘት ይችላሉ።",
    "category": "የህዝብ አገልግሎቶች",
    "author": "የመሶብ ኮሙዩኒኬሽን ጉዳዮች መምሪያ",
    "date": "2024-05-12T09:00:00.000Z",
    "image": "https://img.youtube.com/vi/wjFu-pIMoXw/maxresdefault.jpg",
    "translations": {
      "title": {
        "en": "Hawassa MESOB Center Launches Unified Digital Service Windows",
        "am": "የሀዋሳ ከተማ መሶብ ማዕከል የተዋሃዱ የዲጂታል አገልግሎት መስኮቶችን አስመረቀ",
        "sid": "Hawaasa Quchumi Mesob Kaa'lote Xoncho Mittimmaame Digitaalu Owaante Fanfi"
      },
      "category": {
        "en": "Public Services",
        "am": "የህዝብ አገልግሎቶች",
        "sid": "Dagate Owaante"
      }
    }
  }
]
```

#### 3. Ready-to-Use React Hook (`useNews.js`)

```javascript
import { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://10.20.254.64:5000';

export function useNews(locale = 'en', category = '') {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ locale });
      if (category) params.append('category', category);

      const res = await fetch(`${API_BASE}/api/news?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const data = await res.json();
      setNews(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch news articles.');
    } finally {
      setLoading(false);
    }
  }, [locale, category]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return { news, loading, error, refresh: fetchNews };
}
```

#### 4. Frontend Component (`NewsSection.jsx`)

```jsx
import React, { useState } from 'react';
import { useNews } from './useNews';

export default function NewsSection({ locale = 'en' }) {
  const [activeCategory, setActiveCategory] = useState('');
  const { news, loading, error, refresh } = useNews(locale, activeCategory);

  const categories = [
    { key: '', label: 'All News' },
    { key: 'Public Services', label: 'Public Services' },
    { key: 'Governance', label: 'Governance' },
    { key: 'Digital ID', label: 'Digital ID' },
    { key: 'Utilities', label: 'Utilities' },
    { key: 'Immigration', label: 'Immigration' },
  ];

  return (
    <section className="bg-slate-900 py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-white mb-4">Latest Center News</h2>
        <p className="text-center text-slate-400 mb-8 max-w-2xl mx-auto">
          Updates, inaugurations, and operational notices from Hawassa MESOB Center.
        </p>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeCategory === cat.key
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading && <div className="text-center py-12 text-slate-400">Loading articles...</div>}
        {error && (
          <div className="text-center py-8 text-red-400">
            {error} <button onClick={refresh} className="underline ml-2">Retry</button>
          </div>
        )}

        {/* Responsive 3-Column News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((item) => (
            <article
              key={item.id}
              className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:border-slate-600 transition-all duration-300 flex flex-col"
            >
              {item.image && (
                <div className="h-48 overflow-hidden bg-slate-950">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 font-medium rounded-md border border-blue-500/20">
                      {item.category}
                    </span>
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3 line-clamp-2">{item.title}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed line-clamp-3 mb-4">{item.content}</p>
                </div>
                <div className="text-xs text-slate-400 border-t border-slate-700/60 pt-3">
                  By <span className="text-slate-200 font-medium">{item.author}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

### 5. 📢 Announcements API Client Integration Guide

```http
GET http://10.20.254.64:5000/api/announcements
```

The Announcements API returns urgent operational alerts, extended hours notices, service schedule adjustments, and priority desk notifications with **trilingual localization** (`en`, `am`, `sid`).

#### 1. Endpoints & Query Parameters

| Method | Endpoint | Query Parameters | Description |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/announcements` | `?locale=en\|am\|sid`<br>`?priority=high\|medium\|low`<br>`?type=update\|alert\|event\|general`<br>`?search=...`<br>`?limit=6`<br>`?raw=true` | Returns announcements localized into the selected language. Includes color-coded priority and category types. |
| `GET` | `/api/announcements/:id` | `?locale=en\|am\|sid&raw=true` | Fetch a single announcement by ID. |
| `POST` | `/api/announcements` | — | Publish an announcement (accepts strings or `{ en, am, sid }` objects). |
| `DELETE` | `/api/announcements/:id` | — | Delete an announcement by ID. |

#### 2. JSON Response Example (`GET /api/announcements?locale=sid&limit=1`)

```json
[
  {
    "id": "ann-1",
    "title": "Daganna Wolooma (Fayda) Borreessate Loosu Yanna Dheerinsate Egensiishsha",
    "content": "Loosaasine dagoomanna rosaano kaa'late yitanno heddonni, Hawaasa Mesob xonchi giddo noo Fayda woloomu borreessiishshi qara loosu barubba aana hawado qorichu nookkiinni soodo 2:00 sa'aatinni haaro hawado 12:00 geeshsha owaante aanno.",
    "priority": "high",
    "type": "update",
    "date": "2024-05-14T07:30:00.000Z",
    "translations": {
      "title": {
        "en": "Extended Operating Hours for National ID (Fayda) Registration",
        "am": "ለብሔራዊ መታወቂያ (ፋይዳ) ምዝገባ የተራዘመ የስራ ሰዓት ማስታወቂያ",
        "sid": "Daganna Wolooma (Fayda) Borreessate Loosu Yanna Dheerinsate Egensiishsha"
      }
    }
  }
]
```

#### 3. Ready-to-Use React Hook (`useAnnouncements.js`)

```javascript
import { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://10.20.254.64:5000';

export function useAnnouncements(locale = 'en', priority = '') {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ locale });
      if (priority) params.append('priority', priority);

      const res = await fetch(`${API_BASE}/api/announcements?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const data = await res.json();
      setAnnouncements(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch announcements.');
    } finally {
      setLoading(false);
    }
  }, [locale, priority]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  return { announcements, loading, error, refresh: fetchAnnouncements };
}
```

#### 4. Frontend Component (`AnnouncementsSection.jsx`)

```jsx
import React, { useState } from 'react';
import { useAnnouncements } from './useAnnouncements';

export default function AnnouncementsSection({ locale = 'en' }) {
  const [selectedPriority, setSelectedPriority] = useState('');
  const { announcements, loading, error, refresh } = useAnnouncements(locale, selectedPriority);

  // Color-coded priority badges
  const priorityStyles = {
    high: 'bg-red-500/10 text-red-400 border border-red-500/30',
    medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    low: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
  };

  // Category/Type badge styling
  const typeLabels = {
    update: 'Service Update',
    alert: 'System Alert',
    event: 'Public Event',
    general: 'General Notice',
  };

  return (
    <section className="bg-slate-950 py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white">Center Announcements</h2>
            <p className="text-slate-400 text-sm mt-1">
              Live operational notices, schedule updates, and service guidelines.
            </p>
          </div>

          {/* Priority Filter Buttons */}
          <div className="flex gap-2">
            {['', 'high', 'medium', 'low'].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPriority(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  selectedPriority === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {p || 'All'}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="text-center py-12 text-slate-400">Loading notices...</div>}
        {error && (
          <div className="text-center py-8 text-red-400">
            {error} <button onClick={refresh} className="underline ml-2">Retry</button>
          </div>
        )}

        {/* Announcement Cards Stack */}
        <div className="space-y-4">
          {announcements.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all duration-200"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${priorityStyles[item.priority] || priorityStyles.medium}`}>
                    {item.priority} Priority
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300 border border-slate-700">
                    {typeLabels[item.type] || item.type}
                  </span>
                </div>
                <time className="text-xs text-slate-400">{new Date(item.date).toLocaleDateString()}</time>
              </div>

              <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{item.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

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
  ✔ GET /api/videos?locale=am returns Amharic localized titles and translations
  ✔ GET /api/videos?locale=sid returns Sidaamu Afoo localized titles
▶ 8. Map & Location Endpoints
  ✔ GET /api/map returns Hawassa MESOB Center coordinates & embed iframe
▶ 9. Contact & Citizen Inquiries
  ✔ POST /api/contact receives and stores citizen feedback
▶ 10. News & Announcements Endpoints
  ✔ GET /api/news and GET /api/announcements return active bulletins

ℹ tests 48 | suites 12 | pass 48 | fail 0
```

---

<div align="center">
  <sub>Hawassa MESOB Center Portal • Developed for the Citizens of Hawassa City Administration, Sidama Region, Ethiopia</sub>
</div>
