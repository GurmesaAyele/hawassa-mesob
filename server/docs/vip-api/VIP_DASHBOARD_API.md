# Hawassa MESOB Center — Public VIP Dashboard API Guide

> **Authoritative Developer Documentation for Centralized Public VIP Dashboard Integration**  
> *Base API URL: `http://localhost:5000/api`*

---

## 1. Overview & Architectural Principles

The Hawassa MESOB Center Public VIP Dashboard provides an open, real-time, public-facing view of VIP center operations, priority queue status, daily capacity, and government service catalogs without exposing private citizen information or transaction secrets.

### Security & Privacy Guarantees
- **Zero PII Exposure**: Citizen names, phone numbers, email addresses, and internal database UUIDs are strictly stripped from all public DTOs.
- **No Transaction Secrets**: Chapa payment references, idempotency keys, merchant references, checkout URLs, and QR code Data URIs are never returned.
- **Anonymized Queue Calling**: Only public queue display identifiers (e.g. `VIP-001`, `VIP-002`) are surfaced. Private ticket codes (`VIP-XXXXXX-XXXX`) are eliminated from public monitor feeds.
- **Honest Waiting Times**: Waiting times are derived strictly from empirical counter completions today (`completedAt - servedAt`) when $\ge 3$ completed samples exist. Arbitrary countdowns are never invented.
- **Multi-Service Lifecycle Integrity**: One VIP application may bundle services across different institutions. A ticket is only completed when all bundled services are finished.

---

## 2. API Endpoints Reference

### 2.1 Centralized Public VIP Dashboard

```http
GET /api/vip-dashboard
```

- **Authentication**: None (Public)
- **Rate Limit**: 120 req/min (Global API rate limiter)
- **Cache-Control**: `public, no-cache, must-revalidate, max-age=5`
- **Query Parameters**:
  - `locale` *(optional, string)*: Language preference (`"en"`, `"am"`, `"sid"`). Defaults to `"en"`.
- **Purpose**: Power the main public VIP dashboard screen in a single consolidated request.

#### Example Request
```http
GET /api/vip-dashboard?locale=en HTTP/1.1
Host: localhost:5000
Accept: application/json
```

#### Example 200 OK Response (Production Contract)
```json
{
  "success": true,
  "data": {
    "center": {
      "name": "Hawassa MESOB Center",
      "isOpen": true,
      "workday": true,
      "openingTime": "08:00",
      "closingTime": "16:00",
      "timezone": "Africa/Addis_Ababa",
      "currentTime": "10:30",
      "statusMessage": "Center is open and accepting VIP priority customers."
    },
    "queue": {
      "waiting": 3,
      "currentlyServing": {
        "queueNumber": 1,
        "queueDisplay": "VIP-001",
        "servedAt": "2026-11-13T07:25:00.000Z"
      },
      "nextInQueue": {
        "queueNumber": 2,
        "queueDisplay": "VIP-002"
      },
      "completedToday": 5,
      "activeReservations": 1,
      "estimatedWaitingTime": 12,
      "estimatedWaitingTimeInfo": {
        "available": true,
        "estimatedMinutes": 12,
        "averageServiceMinutes": 12,
        "completedSamplesCount": 5
      },
      "lastCompletedAt": "2026-11-13T07:20:00.000Z",
      "isQueueProgressing": true,
      "progressStatusMessage": "VIP queue is actively progressing. Counter is currently serving ticket VIP-001."
    },
    "capacity": {
      "dailyCapacity": 30,
      "consumedToday": 9,
      "remainingCapacity": 21,
      "acceptingCustomers": true
    },
    "statistics": {
      "totalTickets": 142,
      "confirmedTickets": 25,
      "pendingTickets": 8,
      "completedTickets": 105,
      "queuedTickets": 3,
      "servingTickets": 1
    },
    "institutions": [
      {
        "id": "inst_ethio_post",
        "code": "ETHIO_POST",
        "name": "Ethiopian Postal Service",
        "localizedName": {
          "en": "Ethiopian Postal Service",
          "am": "የኢትዮጵያ ፖስታ አገልግሎት",
          "sid": "Itophiyu Postu Looso"
        },
        "icon": "https://example.com/icons/post.png",
        "logoUrl": "https://example.com/icons/post.png",
        "floorRoomNumber": "Floor 1, Room 102",
        "contactPhone": "+251462200001",
        "isActive": true,
        "serviceCount": 3
      }
    ],
    "services": [
      {
        "id": "srv_postal_001",
        "title": "National Examination Document Handling",
        "localizedTitle": {
          "en": "National Examination Document Handling",
          "am": "የብሔራዊ ፈተና ሰነዶች አያያዝ"
        },
        "description": "Secure dispatch and collection of educational credentials.",
        "requirements": ["Original Kebele ID or Passport", "Academic Transcript"],
        "estimatedFee": 150,
        "processingDays": 3,
        "vipAvailable": true,
        "vipFee": 1000,
        "currency": "ETB",
        "institution": {
          "id": "inst_ethio_post",
          "code": "ETHIO_POST",
          "name": "Ethiopian Postal Service",
          "icon": "https://example.com/icons/post.png",
          "floorRoomNumber": "Floor 1, Room 102"
        }
      }
    ],
    "lastUpdated": "2026-11-13T10:30:00.000Z"
  }
}
```

---

### 2.2 Public VIP Aggregate Statistics

```http
GET /api/vip-dashboard/stats
```

- **Authentication**: None (Public)
- **Rate Limit**: 120 req/min
- **Cache-Control**: `public, no-cache, must-revalidate, max-age=5`
- **Purpose**: Real-time aggregated statistics calculated via database-level aggregation queries.

#### Example 200 OK Response
```json
{
  "success": true,
  "data": {
    "tickets": {
      "total": 142,
      "pending": 8,
      "confirmed": 25,
      "queued": 3,
      "serving": 1,
      "completed": 105,
      "cancelled": 0
    },
    "today": {
      "date": "2026-11-13",
      "createdToday": 12,
      "completedToday": 5,
      "waiting": 3,
      "serving": 1,
      "capacityConsumed": 9,
      "capacityRemaining": 21,
      "dailyCapacity": 30
    },
    "serviceProcessing": {
      "pending": 8,
      "inProgress": 4,
      "completed": 130
    },
    "institutions": {
      "totalActive": 12,
      "totalVipServices": 38
    },
    "payments": {
      "totalSuccessful": 125,
      "totalAmountCollected": 125000,
      "currency": "ETB"
    },
    "lastUpdated": "2026-11-13T10:30:00.000Z"
  }
}
```

---

### 2.3 Real-Time Queue Monitor Status (Hardened)

```http
GET /api/vip-tickets/queue/status
```

- **Authentication**: None (Public)
- **Security Update**: `ticketCode` has been removed from `currentlyServing` and `nextInQueue`. Empirical waiting-time estimation has been incorporated.
- **Response Structure**:
```json
{
  "success": true,
  "queue": {
    "date": "2026-11-13",
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
      "waiting": 3,
      "serving": 1,
      "completedToday": 5,
      "activeReservations": 1,
      "totalConsumed": 9
    },
    "capacity": {
      "daily": 30,
      "remaining": 21,
      "placesRemaining": 21
    },
    "currentlyServing": {
      "queueNumber": 1,
      "queueDisplay": "VIP-001",
      "servedAt": "2026-11-13T07:25:00.000Z"
    },
    "nextInQueue": {
      "queueNumber": 2,
      "queueDisplay": "VIP-002"
    },
    "lastCompletedAt": "2026-11-13T07:20:00.000Z",
    "estimatedWaitingTime": 12,
    "estimatedWaitingTimeInfo": {
      "available": true,
      "estimatedMinutes": 12
    }
  }
}
```

---

### 2.4 Staff Service Processing Update (Multi-Service Synchronized)

```http
PATCH /api/admin/vip-tickets/:id/service-status
```

- **Authentication**: Required (`SUPER_ADMIN` or `STAFF` role).
- **Body Parameters**:
  - `status` *(required, string)*: `"pending"`, `"in-progress"`, `"completed"`.
  - `notes` *(optional, string)*: Processing notes.
  - `serviceId` *(optional, string)*: Target service UUID for multi-service tickets.
- **Operational Rules**:
  - If `serviceId` is provided: Updates the specific service's status. The overall ticket transitions to `USED`/`COMPLETED` only after **all** associated services on the ticket reach `completed`. If some services remain unfinished, the ticket lifecycle status stays `SERVING` and `serviceProcessingStatus` stays `in-progress`.
  - If `serviceId` is omitted: Updates the entire ticket and marks all its services accordingly.
  - Automatically updates `ticket.status` (`QUEUED`/`CONFIRMED` $\to$ `SERVING` $\to$ `USED`), `servedAt`, and `completedAt` timestamps under an atomic transaction.

---

## 3. Data Safety & Field Mapping Table

| Public Dashboard Field | Source Field | Safety Classification |
| :--- | :--- | :--- |
| `center.name` | System configuration | Public |
| `center.isOpen` | Computed from server clock + operating schedule | Public |
| `center.currentTime` | Server local time (UTC+3) | Public |
| `queue.waiting` | `count(queueDate=today, status='QUEUED')` | Public Aggregate |
| `queue.currentlyServing.queueDisplay` | Formatted `VIP-${queueNumber}` | Public Anonymized |
| `queue.nextInQueue.queueDisplay` | Formatted `VIP-${queueNumber}` | Public Anonymized |
| `capacity.remainingCapacity` | Daily Cap minus Confirmed & Reserved | Public Aggregate |
| `statistics.totalTickets` | `count(vip_tickets)` | Public Aggregate |
| `institutions` | Active `service_providers` (name, logo, floor/room) | Public Catalog |
| `services` | Active VIP-eligible services & requirements | Public Catalog |
| *REDACTED* | `citizenName`, `citizenPhone`, `email` | **PII — Never Exposed** |
| *REDACTED* | `ticketCode`, `paymentRef`, `qrCodeUrl` | **Secret — Never Exposed** |
| *REDACTED* | `id`, `ticketId`, `changedById`, staff internal notes | **Internal — Never Exposed** |

