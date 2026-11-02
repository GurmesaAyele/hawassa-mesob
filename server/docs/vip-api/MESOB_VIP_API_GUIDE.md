# MESOB VIP Backend — Complete API Guide

> **Hawassa MESOB Center — VIP Priority Walk-In Service API Documentation**  
> *Authoritative developer guide for manual verification and integration.*

---

## Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [Global Conventions & Headers](#2-global-conventions--headers)
3. [Service Catalog Endpoints](#3-service-catalog-endpoints)
   - [3.1 List All Services (Flat Catalog with VIP Flags)](#31-list-all-services-flat-catalog-with-vip-flags)
   - [3.2 List VIP-Eligible Services](#32-list-vip-eligible-services)
   - [3.3 Get VIP Service Details](#33-get-vip-service-details)
   - [3.4 Get VIP Service Schedule Slots](#34-get-vip-service-schedule-slots)
4. [Queue Availability & Status Endpoints](#4-queue-availability--status-endpoints)
   - [4.1 Check Pre-Payment Queue Availability](#41-check-pre-payment-queue-availability)
   - [4.2 Get Real-Time Queue Monitor Status](#42-get-real-time-queue-monitor-status)
5. [VIP Application Management Endpoints](#5-vip-application-management-endpoints)
   - [5.1 Submit VIP Ticket Application](#51-submit-vip-ticket-application)
   - [5.2 Track Application (Dual-Factor Reference + Phone)](#52-track-application-dual-factor-reference--phone)
   - [5.3 List VIP Applications (Admin / Query Filtered)](#53-list-vip-applications-admin--query-filtered)
   - [5.4 Get Application by Reference Code](#54-get-application-by-reference-code)
   - [5.5 Get Application by Primary UUID](#55-get-application-by-primary-uuid)
6. [Capacity Reservation Endpoints](#6-capacity-reservation-endpoints)
   - [6.1 Reserve Capacity (Body-Based / Dynamic ID)](#61-reserve-capacity-body-based--dynamic-id)
   - [6.2 Release Capacity (Body-Based / Dynamic ID)](#62-release-capacity-body-based--dynamic-id)
7. [In-Person Check-In & Queue Position Endpoints](#7-in-person-check-in--queue-position-endpoints)
   - [7.1 Enqueue Confirmed Ticket (Physical Check-In)](#71-enqueue-confirmed-ticket-physical-check-in)
   - [7.2 Get Customer Queue Position](#72-get-customer-queue-position)
8. [Summary of Verified Endpoints](#8-summary-of-verified-endpoints)

---

## 1. Overview & Architecture

The Hawassa MESOB Center VIP priority system is an on-demand, walk-in priority queue operating under the following verified principles:

1. **Flat Fee Structure**: 1,000 ETB flat fee per application, regardless of whether 1 or multiple public services are bundled into the application.
2. **Clear Separation of Lifecycle Stages**:
   - `PENDING`: Application submitted. If capacity is held, an active reservation token is stored. Customer is **not** physically waiting in the queue.
   - `CONFIRMED`: Verified payment recorded. Capacity is permanently allocated for the day. Customer has **not** yet checked in at the center.
   - `QUEUED`: Customer physically arrives at Hawassa MESOB Center and checks in during operating hours (`08:00`–`16:00`). An atomic sequential daily queue number (e.g. `VIP-001`) is assigned.
   - `SERVING`: Counter operator is actively serving the citizen.
   - `USED`: Service has completed (`completedAt` recorded).
   - `CANCELLED`: Application voided or rejected.
3. **Capacity Protection**: Daily capacity (default 30, configurable via `VIP_DAILY_CAPACITY`) is guarded before payment using PostgreSQL transaction advisory locks (`SELECT pg_advisory_xact_lock(...)`).
4. **Honest Waiting-Time Visibility**: Waiting-time estimates are strictly calculated from empirical recorded service durations (`completedAt - servedAt`) when $\ge 3$ completed samples exist today. If insufficient data exists, `waitingTime: null` is returned with an explicit reason; fixed-duration countdowns are never invented.

---

## 2. Global Conventions & Headers

- **Base URL**: `http://localhost:5000` (configurable via `process.env.PORT`)
- **Default Headers**:
  - `Content-Type: application/json` (required for POST/PUT/PATCH requests)
  - `Accept: application/json`
- **Authentication**: No API keys or bearer tokens required for customer-facing routes. Secure actions (tracking, reservation release) enforce dual-factor verification using citizen phone number matching the recorded Ethiopian mobile number (`09...`, `07...`, or `+251...`).
- **Rate Limiting**:
  - Global API: 120 requests/minute (`/api/*`)
  - Application Tracking: 20 requests/minute (`POST /api/vip-tickets/track`)

---

## 3. Service Catalog Endpoints

### 3.1 List All Services (Flat Catalog with VIP Flags)

- **Name**: Flat Services Catalog
- **Method & Path**: `GET /api/services`
- **Auth Required**: None (Public)
- **Status**: **Verified Implemented**
- **Query Parameters**:
  - `providerId` *(optional, string)*: Filter by institution UUID.
  - `providerCode` *(optional, string)*: Filter by institution code (e.g. `ETHIO_POST`, `CBE`).
  - `locale` *(optional, string)*: Preferred language (`en`, `am`, `sid`).
  - `search` *(optional, string)*: Case-insensitive search keyword.
- **Request Body**: None

#### Example Request
```http
GET /api/services?locale=en HTTP/1.1
Host: localhost:5000
```

#### Expected 200 OK Response
```json
{
  "success": true,
  "count": 24,
  "data": [
    {
      "id": "srv_postal_001",
      "providerId": "inst_post_hawassa",
      "title": { "en": "National Examination Document Handling" },
      "description": { "en": "Secure dispatch and collection of educational credentials." },
      "requirements": ["Original Kebele ID or Passport", "Official Academic Transcript"],
      "estimatedFee": 150,
      "processingDays": 3,
      "isActive": true,
      "vipAvailable": true,
      "vipFee": 1000,
      "currency": "ETB",
      "provider": {
        "id": "inst_post_hawassa",
        "code": "ETHIO_POST",
        "name": { "en": "Ethiopian Postal Service" }
      }
    }
  ]
}
```

---

### 3.2 List VIP-Eligible Services

- **Name**: VIP Service Catalog Listing
- **Method & Path**: `GET /api/services/vip`
- **Auth Required**: None (Public)
- **Status**: **Verified Implemented**
- **Query Parameters**: `providerId`, `providerCode`, `locale`, `search`

#### Expected 200 OK Response
```json
{
  "success": true,
  "count": 24,
  "vipFee": 1000,
  "currency": "ETB",
  "data": [
    {
      "id": "srv_postal_001",
      "title": { "en": "National Examination Document Handling" },
      "vipAvailable": true,
      "vipFee": 1000,
      "currency": "ETB",
      "provider": { "name": { "en": "Ethiopian Postal Service" } }
    }
  ]
}
```

---

### 3.3 Get VIP Service Details

- **Name**: Single VIP Service Details
- **Method & Path**: `GET /api/services/vip/:id`
- **Auth Required**: None (Public)
- **Status**: **Verified Implemented**
- **Path Parameters**: `id` *(required, string)* — Service UUID

#### Expected 200 OK Response
```json
{
  "success": true,
  "data": {
    "id": "srv_postal_001",
    "title": { "en": "National Examination Document Handling" },
    "vipAvailable": true,
    "vipFee": 1000,
    "currency": "ETB",
    "provider": { "code": "ETHIO_POST", "name": { "en": "Ethiopian Postal Service" } }
  }
}
```

---

### 3.4 Get VIP Service Schedule Slots

- **Name**: Appointment / Booking Schedule Slots
- **Method & Path**: `GET /api/services/:id/vip-slots`
- **Auth Required**: None (Public)
- **Status**: **Verified Implemented**
- **Path Parameters**: `id` *(required, string)* — Service UUID
- **Query Parameters**: `date` *(optional, string)* — Date in `YYYY-MM-DD` format

#### Expected 200 OK Response
```json
{
  "success": true,
  "serviceId": "srv_postal_001",
  "date": "2026-10-23",
  "isWorkingDay": true,
  "slots": [
    {
      "slotTime": "08:30",
      "startTime": "08:30",
      "endTime": "09:00",
      "capacity": 5,
      "booked": 0,
      "remainingCapacity": 5,
      "isAvailable": true
    }
  ]
}
```

---

## 4. Queue Availability & Status Endpoints

### 4.1 Check Pre-Payment Queue Availability

- **Name**: Pre-Payment VIP Queue Availability & Health
- **Method & Path**: `GET /api/vip-tickets/queue/availability`
- **Auth Required**: None (Public)
- **Status**: **Verified Implemented**
- **Query Parameters**:
  - `reference` *(optional, string)*: Application reference code (e.g. `VIP-845123-A4B2`).
  - `ticketCode` *(optional, string)*: Alias for `reference`.
  - `ticketId` *(optional, string)*: Ticket primary UUID.
- **Side Effects on Database**: None (read-only query).

#### Example Request
```http
GET /api/vip-tickets/queue/availability HTTP/1.1
Host: localhost:5000
```

#### Expected 200 OK Response (General Inquiry)
```json
{
  "success": true,
  "acceptingCustomers": true,
  "available": true,
  "reason": null,
  "isOpenToday": true,
  "isWorkingDay": true,
  "placesRemaining": 29,
  "dailyCapacity": 30,
  "customersWaiting": 1,
  "customersServing": 0,
  "customersCompletedToday": 0,
  "completedToday": 0,
  "isQueueProgressing": false,
  "queueProgress": {
    "isProgressing": false,
    "statusMessage": "Waiting for VIP service desk to begin serving tickets for today.",
    "currentlyServing": null,
    "lastCompletedAt": null
  },
  "queuePosition": null,
  "customersAhead": null,
  "ticketLookup": null,
  "operatingHours": {
    "isOpen": true,
    "currentTime": "09:15",
    "openTime": "08:00",
    "closeTime": "16:00",
    "reason": null
  },
  "workingDay": {
    "isWorkingDay": true,
    "date": "2026-10-23",
    "dayName": "Friday",
    "reason": null
  },
  "waitingTime": null,
  "waitingTimeInfo": {
    "available": false,
    "estimatedMinutes": null,
    "reason": "Waiting time estimates are currently unavailable: insufficient recorded service completions today (0/3 required samples recorded). The center requires real completion data before providing an empirical estimate.",
    "completedSamplesCount": 0,
    "requiredSamplesCount": 3
  },
  "vipFee": 1000,
  "currency": "ETB",
  "feeNote": "VIP priority service fee is fixed at 1,000 ETB per application.",
  "queue": {
    "date": "2026-10-23",
    "activeInQueue": 1,
    "customersWaiting": 1,
    "customersServing": 0,
    "completedToday": 0,
    "customersCompletedToday": 0,
    "totalQueuedToday": 1,
    "totalCapacityConsumed": 1,
    "dailyCapacity": 30,
    "remainingCapacity": 29,
    "placesRemaining": 29,
    "isQueueProgressing": false
  }
}
```

#### Expected Error Responses:
- `500 Internal Server Error`: `{"error": "Failed to check VIP queue availability."}`

---

### 4.2 Get Real-Time Queue Monitor Status

- **Name**: VIP Queue Public / Staff Screen Monitor
- **Method & Path**: `GET /api/vip-tickets/queue/status`
- **Auth Required**: None (Public)
- **Status**: **Verified Implemented**
- **Query Parameters**: None
- **Side Effects on Database**: None (read-only query).

#### Example Request
```http
GET /api/vip-tickets/queue/status HTTP/1.1
Host: localhost:5000
```

#### Expected 200 OK Response
```json
{
  "success": true,
  "queue": {
    "date": "2026-10-23",
    "isWorkingDay": true,
    "isOpen": true,
    "isQueueProgressing": true,
    "progressStatusMessage": "VIP queue is actively progressing. Counter is currently serving ticket VIP-001.",
    "operatingHours": {
      "openTime": "08:00",
      "closeTime": "16:00",
      "currentTime": "10:30"
    },
    "counts": {
      "waiting": 2,
      "serving": 1,
      "completedToday": 3,
      "activeReservations": 1,
      "totalConsumed": 7
    },
    "capacity": {
      "daily": 30,
      "remaining": 23,
      "placesRemaining": 23
    },
    "currentlyServing": {
      "queueNumber": 1,
      "queueDisplay": "VIP-001",
      "ticketCode": "VIP-845123-A4B2",
      "servedAt": "2026-10-23T07:25:00.000Z"
    },
    "nextInQueue": {
      "queueNumber": 2,
      "queueDisplay": "VIP-002",
      "ticketCode": "VIP-845124-C9D1"
    },
    "lastCompletedAt": "2026-10-23T07:20:00.000Z"
  }
}
```

---

## 5. VIP Application Management Endpoints

### 5.1 Submit VIP Ticket Application

- **Name**: Submit VIP Application
- **Method & Path**: `POST /api/vip-tickets`
- **Auth Required**: None (Public)
- **Status**: **Verified Implemented**
- **Request Headers**: `Content-Type: application/json`
- **Request Body Fields**:
  - `citizenName` *(required, string, 2–150 characters)*: Citizen full name.
  - `citizenPhone` *(required, string)*: Valid Ethiopian or E.164 phone number (`09...`, `07...`, `+2519...`).
  - `purpose` *(required, string, 3–1000 characters)*: Description of business or visit purpose.
  - `serviceIds` *(required, array of strings)*: Non-empty array of unique service UUIDs.
  - `serviceId` *(optional, string)*: Single service fallback if `serviceIds` is omitted.
- **Side Effects on Database**:
  - Inserts 1 row into `vip_tickets` table (`status: "PENDING"`, `vipFee: 1000`, `currency: "ETB"`, `ticketCode: "VIP-XXXXXX-XXXX"`).
  - Inserts $N$ rows into `vip_ticket_services` join table linking each selected service.

#### Example Request
```http
POST /api/vip-tickets HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "citizenName": "Abebe Kebede",
  "citizenPhone": "0911223344",
  "purpose": "Urgent document processing for educational transcript",
  "serviceIds": ["srv_postal_001"]
}
```

#### Expected 201 Created Response
```json
{
  "success": true,
  "message": "VIP ticket application for 1 service(s) submitted successfully. Total flat fee: 1000 ETB. Application is pending review.",
  "data": {
    "reference": "VIP-123456-7890",
    "status": "PENDING",
    "purpose": "Urgent document processing for educational transcript",
    "serviceCount": 1,
    "services": [
      {
        "id": "srv_postal_001",
        "title": { "en": "National Examination Document Handling" },
        "estimatedFee": 150,
        "processingDays": 3,
        "isActive": true,
        "provider": {
          "id": "inst_post_hawassa",
          "code": "ETHIO_POST",
          "name": { "en": "Ethiopian Postal Service" }
        }
      }
    ],
    "service": { "id": "srv_postal_001" },
    "vipFee": 1000,
    "currency": "ETB",
    "isFlatFee": true,
    "maskedPhone": "09****3344",
    "maskedCitizenName": "Abebe K.",
    "appointment": {
      "isAssigned": false,
      "status": "UNASSIGNED",
      "slotDate": null,
      "slotTime": null,
      "message": "Appointment has not been scheduled yet. Your application is currently under review."
    },
    "queue": {
      "isQueued": false,
      "queueNumber": null,
      "queueDisplay": null,
      "queueDate": null,
      "checkedInAt": null,
      "servedAt": null,
      "completedAt": null,
      "message": "Application reference only. Not yet in queue. Physical check-in at Hawassa MESOB Center is required to join the priority walk-in queue."
    },
    "capacityReservation": null,
    "createdAt": "2026-10-23T07:00:00.000Z",
    "updatedAt": "2026-10-23T07:00:00.000Z"
  }
}
```

#### Expected Error Responses:
- `400 Bad Request`: Validation failure (missing name, phone, purpose, empty services, duplicate service IDs).
  ```json
  { "error": "Validation failed: 'citizenPhone' must be a valid phone number (e.g. 0912345678 or +251912345678)." }
  ```
- `404 Not Found`: Service ID does not exist in database catalog.
- `500 Internal Server Error`: `{"error": "Failed to submit VIP application. Please try again later."}`

---

### 5.2 Track Application (Dual-Factor Reference + Phone)

- **Name**: Customer Application Tracking
- **Method & Path**: `POST /api/vip-tickets/track`
- **Auth Required**: Dual-Factor Knowledge (Application Reference + Phone Number)
- **Status**: **Verified Implemented**
- **Rate Limit**: Dedicated 20 attempts/minute per IP (`trackRateLimiter`).
- **Request Body Fields**:
  - `reference` *(required, string)*: Application reference or UUID.
  - `phone` *(required, string)*: Registered citizen phone number.
- **Security Guard**: Returns a consistent `404` for unknown reference OR phone mismatch to prevent enumeration attacks. Masks citizen name and phone.

#### Example Request
```http
POST /api/vip-tickets/track HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "reference": "VIP-123456-7890",
  "phone": "0911223344"
}
```

#### Expected 200 OK Response
```json
{
  "success": true,
  "data": {
    "reference": "VIP-123456-7890",
    "status": "PENDING",
    "purpose": "Urgent document processing for educational transcript",
    "serviceCount": 1,
    "services": [...],
    "vipFee": 1000,
    "currency": "ETB",
    "maskedPhone": "09****3344",
    "maskedCitizenName": "Abebe K.",
    "queue": {
      "isQueued": false,
      "message": "Application reference only. Not yet in queue. Physical check-in at Hawassa MESOB Center is required to join the priority walk-in queue."
    },
    "capacityReservation": null
  }
}
```

#### Expected Error Responses:
- `400 Bad Request`: `{"error": "Validation failed: 'reference' is required."}`
- `404 Not Found`: `{"error": "No matching VIP application found with the provided reference and phone number."}`
- `429 Too Many Requests`: `{"error": "Too many tracking requests. Please wait a minute before trying again."}`

---

### 5.3 List VIP Applications (Admin / Query Filtered)

- **Name**: List VIP Applications
- **Method & Path**: `GET /api/vip-tickets`
- **Auth Required**: None (Public; PII is masked)
- **Status**: **Verified Implemented**
- **Query Parameters**:
  - `status` *(optional, string)*: Filter by `PENDING`, `CONFIRMED`, `QUEUED`, `SERVING`, `USED`, `CANCELLED`.
  - `phone` *(optional, string)*: Substring search on citizen phone.
  - `serviceId` *(optional, string)*: Filter by service UUID.
  - `limit` *(optional, integer, default 50, max 100)*: Items per page.
  - `page` *(optional, integer, default 1)*: Page number.

#### Expected 200 OK Response
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

---

### 5.4 Get Application by Reference Code

- **Name**: Lookup Application by Reference
- **Method & Path**: `GET /api/vip-tickets/reference/:code`
- **Auth Required**: None (PII masked)
- **Status**: **Verified Implemented**
- **Path Parameters**: `code` *(required, string)* — Ticket reference code (e.g. `VIP-123456-7890`)

#### Expected 200 OK Response
```json
{
  "success": true,
  "data": {
    "reference": "VIP-123456-7890",
    "status": "PENDING",
    "maskedPhone": "09****3344",
    "maskedCitizenName": "Abebe K.",
    "vipFee": 1000,
    "currency": "ETB"
  }
}
```

---

### 5.5 Get Application by Primary UUID

- **Name**: Lookup Application by ID
- **Method & Path**: `GET /api/vip-tickets/:id`
- **Auth Required**: None (PII masked)
- **Status**: **Verified Implemented**
- **Path Parameters**: `id` *(required, string)* — Application primary UUID

#### Expected 200 OK Response
Identical to Section 5.4 schema.

---

## 6. Capacity Reservation Endpoints

### 6.1 Reserve Capacity (Body-Based / Dynamic ID)

- **Name**: Pre-Payment Capacity Reservation
- **Method & Path**:
  - Body-based: `POST /api/vip-tickets/reserve-capacity`
  - Dynamic ID: `POST /api/vip-tickets/:id/reserve-capacity`
- **Auth Required**: None (Accepts optional `phone` for ownership verification)
- **Status**: **Verified Implemented**
- **Concurrency Protection**: Protected by PostgreSQL advisory lock `SELECT pg_advisory_xact_lock(...)` serialized on the current date string.
- **Request Body Fields**:
  - `ticketId` / `reference` / `ticketCode` *(required in body if not using `:id` in URL)*: Ticket identifier.
  - `phone` / `citizenPhone` *(optional, string)*: Verification phone number.
- **Side Effects on Database**:
  - Updates `vip_tickets`: sets `slotDate = startOfDay` (today), sets `paymentRef = JSON.stringify({ type: "CAPACITY_RESERVATION", token, reservedAt, expiresAt, date })`.
  - Leaves `status = "PENDING"` (does **not** mark paid without payment confirmation).

#### Example Request
```http
POST /api/vip-tickets/reserve-capacity HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "reference": "VIP-123456-7890",
  "phone": "0911223344"
}
```

#### Expected 201 Created Response (New Reservation)
```json
{
  "success": true,
  "message": "VIP capacity reserved successfully for today. Please complete payment within 15 minutes.",
  "data": {
    "ticketCode": "VIP-123456-7890",
    "status": "PENDING",
    "reservationToken": "res_8f7b2c14-9a3d-4e5f-b6a1-2c3d4e5f6a7b",
    "reservedAt": "2026-10-23T07:15:00.000Z",
    "expiresAt": "2026-10-23T07:30:00.000Z",
    "holdMinutes": 15,
    "expiresInSeconds": 900,
    "queueDate": "2026-10-23",
    "dailyCapacity": 30,
    "placesRemaining": 28,
    "vipFee": 1000,
    "currency": "ETB",
    "nextStep": "Proceed to verified payment. If payment is not completed within 15 minutes, this capacity will be released automatically."
  }
}
```

#### Expected 200 OK Response (Duplicate Check — Already Reserved)
```json
{
  "success": true,
  "alreadyReserved": true,
  "message": "An active VIP capacity reservation is already held for this application. Holds expire in 842 seconds.",
  "data": {
    "ticketCode": "VIP-123456-7890",
    "status": "PENDING",
    "reservationToken": "res_8f7b2c14-9a3d-4e5f-b6a1-2c3d4e5f6a7b",
    "expiresInSeconds": 842,
    "dailyCapacity": 30
  }
}
```

#### Expected Error Responses:
- `400 Bad Request`: Outside operating hours or application cancelled.
- `403 Forbidden`: Phone verification failed.
- `404 Not Found`: `{"error": "VIP ticket application not found."}`
- `503 Service Unavailable`: Daily capacity cap reached (`{"error": "VIP queue has reached today's maximum capacity of 30 customers..."}`).

---

### 6.2 Release Capacity (Body-Based / Dynamic ID)

- **Name**: Release Capacity Reservation
- **Method & Path**:
  - Body-based: `POST /api/vip-tickets/release-capacity`
  - Dynamic ID: `POST /api/vip-tickets/:id/release-capacity`
- **Auth Required**: Optional `phone` verification
- **Status**: **Verified Implemented**
- **Side Effects on Database**:
  - Updates `vip_tickets`: sets `slotDate = null`, `paymentRef = null`, `updatedAt = NOW()`.

#### Example Request
```http
POST /api/vip-tickets/release-capacity HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "reference": "VIP-123456-7890",
  "phone": "0911223344"
}
```

#### Expected 200 OK Response
```json
{
  "success": true,
  "released": true,
  "message": "VIP capacity reservation released successfully."
}
```

---

## 7. In-Person Check-In & Queue Position Endpoints

### 7.1 Enqueue Confirmed Ticket (Physical Check-In)

- **Name**: Physical In-Person VIP Check-In
- **Method & Path**: `POST /api/vip-tickets/:id/enqueue`
- **Auth Required**: None (Executed at MESOB Center terminal upon arrival)
- **Status**: **Verified Implemented**
- **Precondition**: **Ticket must be in `CONFIRMED` status** (payment verified).
- **Concurrency Protection**: Protected by PostgreSQL advisory lock on `hashtext('vip_enqueue_' || todayStr)`.
- **Side Effects on Database**:
  - Updates `vip_tickets`: sets `status = "QUEUED"`, `queueNumber = (MAX + 1)`, `queueDate = startOfDay`, `checkedInAt = NOW()`.

#### Example Request
```http
POST /api/vip-tickets/VIP-123456-7890/enqueue HTTP/1.1
Host: localhost:5000
```

#### Expected 200 OK Response
```json
{
  "success": true,
  "message": "VIP ticket checked in successfully. Your queue number is VIP-001.",
  "data": {
    "ticketCode": "VIP-123456-7890",
    "status": "QUEUED",
    "queueNumber": 1,
    "queuePosition": 1,
    "queueDisplay": "VIP-001",
    "queueDate": "2026-10-23",
    "checkedInAt": "2026-10-23T07:35:00.000Z",
    "positionAhead": 0,
    "customersAhead": 0,
    "totalWaiting": 1,
    "customersWaiting": 1,
    "customersServing": 0,
    "customersCompletedToday": 0,
    "isQueueProgressing": true,
    "dailyCapacity": 30,
    "placesRemaining": 29,
    "waitingTime": null,
    "waitingTimeInfo": {
      "available": false,
      "estimatedMinutes": null,
      "reason": "Waiting time estimates are currently unavailable: insufficient recorded service completions today (0/3 required samples recorded)..."
    }
  }
}
```

#### Expected Error Responses:
- `400 Bad Request`: Ticket is in `PENDING` status (`{"error": "Ticket must be in CONFIRMED status with verified payment before physical queue check-in. Current status: PENDING."}`).
- `409 Conflict`: Ticket is already `QUEUED`, `SERVING`, `USED`, or `CANCELLED`.
- `503 Service Unavailable`: Daily queue capacity reached.

---

### 7.2 Get Customer Queue Position

- **Name**: Customer Queue Position & Real-Time Progress
- **Method & Path**: `GET /api/vip-tickets/:id/queue-position`
- **Auth Required**: None (Zero PII exposed)
- **Status**: **Verified Implemented**
- **Path Parameters**: `id` *(required, string)* — Ticket UUID or ticket reference code (e.g. `VIP-123456-7890`)
- **Side Effects on Database**: None (read-only query).

#### Example Request
```http
GET /api/vip-tickets/VIP-123456-7890/queue-position HTTP/1.1
Host: localhost:5000
```

#### Expected 200 OK Response (For Enqueued Customer)
```json
{
  "success": true,
  "data": {
    "ticketCode": "VIP-123456-7890",
    "status": "QUEUED",
    "queueNumber": 1,
    "queuePosition": 1,
    "queueDisplay": "VIP-001",
    "positionAhead": 0,
    "customersAhead": 0,
    "customersWaiting": 1,
    "customersServing": 0,
    "customersCompletedToday": 0,
    "completedToday": 0,
    "isQueueProgressing": true,
    "progressStatusMessage": "VIP queue is actively progressing...",
    "currentlyServingNumber": null,
    "currentlyServingDisplay": null,
    "checkedInAt": "2026-10-23T07:35:00.000Z",
    "servedAt": null,
    "completedAt": null,
    "lastCompletedAt": null,
    "waitingTime": null,
    "waitingTimeInfo": {
      "available": false,
      "estimatedMinutes": null,
      "reason": "Waiting time estimates are currently unavailable: insufficient recorded service completions today (0/3 required samples recorded)..."
    }
  }
}
```

#### Expected Response When Not In Queue (`PENDING` or `CONFIRMED`):
```json
{
  "error": "Application is pending payment. An application reference is not a walk-in queue position. Physical check-in at Hawassa MESOB Center is required to join the priority walk-in queue.",
  "data": {
    "ticketCode": "VIP-123456-7890",
    "status": "PENDING",
    "isQueued": false,
    "customersWaiting": 1,
    "customersServing": 0,
    "customersCompletedToday": 0,
    "isQueueProgressing": false
  }
}
```

---

## 8. Summary of Verified Endpoints

| # | HTTP Method | Endpoint Path | Category | Status |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `GET` | `/api/services` | Service Catalog | **Verified Implemented** |
| 2 | `GET` | `/api/services/vip` | Service Catalog | **Verified Implemented** |
| 3 | `GET` | `/api/services/vip/:id` | Service Catalog | **Verified Implemented** |
| 4 | `GET` | `/api/services/:id/vip-slots` | Service Catalog | **Verified Implemented** |
| 5 | `GET` | `/api/vip-tickets/queue/availability` | Queue Availability | **Verified Implemented** |
| 6 | `GET` | `/api/vip-tickets/queue/status` | Queue Position & Status | **Verified Implemented** |
| 7 | `POST` | `/api/vip-tickets` | VIP Application | **Verified Implemented** |
| 8 | `POST` | `/api/vip-tickets/track` | Customer Tracking | **Verified Implemented** |
| 9 | `GET` | `/api/vip-tickets` | VIP Application | **Verified Implemented** |
| 10 | `GET` | `/api/vip-tickets/reference/:code` | VIP Application | **Verified Implemented** |
| 11 | `GET` | `/api/vip-tickets/:id` | VIP Application | **Verified Implemented** |
| 12 | `POST` | `/api/vip-tickets/reserve-capacity` | Capacity Reservation | **Verified Implemented** |
| 13 | `POST` | `/api/vip-tickets/:id/reserve-capacity` | Capacity Reservation | **Verified Implemented** |
| 14 | `POST` | `/api/vip-tickets/release-capacity` | Capacity Reservation | **Verified Implemented** |
| 15 | `POST` | `/api/vip-tickets/:id/release-capacity` | Capacity Reservation | **Verified Implemented** |
| 16 | `POST` | `/api/vip-tickets/:id/enqueue` | Check-In / Enqueue | **Verified Implemented** |
| 17 | `GET` | `/api/vip-tickets/:id/queue-position` | Queue Position & Status | **Verified Implemented** |

*(Total Verified Public Endpoints: 17)*
