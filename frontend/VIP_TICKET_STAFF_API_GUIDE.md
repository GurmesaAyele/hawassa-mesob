# VIP Tickets Staff & Admin API Integration Guide

This guide is for frontend developers integrating the **Staff Portal & VIP Ticket Processing** views on the Hawassa MESOB Admin Dashboard.

---

## 1. Architectural Overview & Role Matrix

The backend introduces the **`STAFF`** user role and a separate **`serviceProcessingStatus`** lifecycle so staff work progress remains completely independent from citizen payment status and queue numbers.

### Role Authorization Matrix

| Capability | `SUPER_ADMIN` | `OPERATOR` | `STAFF` | `CITIZEN` |
| :--- | :---: | :---: | :---: | :---: |
| **Sign in to Admin Dashboard** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No (403) |
| **Browse Admin VIP Ticket Work List** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No (403) |
| **Advance VIP Service Status** (`pending` $\to$ `in-progress` $\to$ `completed`) | ✅ Yes | ❌ No (403) | ✅ Yes | ❌ No (403) |
| **Roll back / Reset VIP Status** (Super Admin override) | ✅ Yes | ❌ No (403) | ❌ No (400) | ❌ No (403) |
| **Manage Institutions, Services, News, Site Settings** | ✅ Yes | ✅ Yes | ❌ No (403) | ❌ No (403) |
| **Access Citizen Contact Message Inbox** | ✅ Yes | ❌ No (403) | ❌ No (403) | ❌ No (403) |

### Dual Lifecycle Separation

- **`status` (`TicketStatus`)**: Tracks citizen payment and center queue entry (`PENDING`, `CONFIRMED`, `QUEUED`, `SERVING`, `USED`, `CANCELLED`).
- **`serviceProcessingStatus` (`ServiceProcessingStatus`)**: Tracks back-office staff service fulfillment (`pending`, `in-progress`, `completed`).

---

## 2. Authentication & Session Handling

### Endpoint: `POST /api/auth/login`
Staff accounts authenticate through the standard admin login endpoint.

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "staff.member@mesob.hawassa.gov.et",
  "password": "StaffSecretPassword2026!"
}
```

**Success Response (`200 OK`):**
```json
{
  "message": "Authentication successful.",
  "user": {
    "id": "usr_cuid12345",
    "email": "staff.member@mesob.hawassa.gov.et",
    "name": "Abebe Kebede",
    "role": "STAFF"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```
*Sets an `HttpOnly`, `SameSite=Lax` session cookie (`mesob_admin_token`) expiring in 24 hours.*

### Endpoint: `GET /api/auth/me`
Fetches current authenticated profile.

**Success Response (`200 OK`):**
```json
{
  "user": {
    "id": "usr_cuid12345",
    "email": "staff.member@mesob.hawassa.gov.et",
    "name": "Abebe Kebede",
    "role": "STAFF"
  }
}
```

---

## 3. Admin VIP Tickets List

### Endpoint: `GET /api/admin/vip-tickets`

Retrieves a paginated list of VIP applications with unmasked applicant information for staff handling.

#### Query Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `page` | `integer` | `1` | Page number (must be $\ge 1$). |
| `limit` | `integer` | `25` | Number of records per page (capped at `100`). |
| `status` | `string` | *(all)* | Filter by processing status: `pending`, `in-progress`, or `completed`. |

#### Example Request
```http
GET /api/admin/vip-tickets?page=1&limit=25&status=pending
Cookie: mesob_admin_token=...
```

#### Success Response (`200 OK`)
```json
{
  "data": [
    {
      "id": "a7d5d9ff-f6b2-4d08-9a83-48d45adbc1cb",
      "reference": "VIP-950963-5E8A",
      "person": "Gurmesa Ayele",
      "phone": "0916970942",
      "email": "gurmesa@example.com",
      "service": "Ethiopian Origin ID, Visa Application",
      "services": [
        {
          "id": "srv-101",
          "name": "Ethiopian Origin ID",
          "estimatedFee": 500,
          "processingDays": 3,
          "provider": {
            "id": "prov-1",
            "code": "IMMIGRATION",
            "name": "Immigration & Nationality Department"
          }
        },
        {
          "id": "srv-102",
          "name": "Visa Application",
          "estimatedFee": 500,
          "processingDays": 2,
          "provider": {
            "id": "prov-1",
            "code": "IMMIGRATION",
            "name": "Immigration & Nationality Department"
          }
        }
      ],
      "purpose": "Urgent travel and business verification",
      "vipFee": 1000,
      "currency": "ETB",
      "ticketStatus": "CONFIRMED",
      "status": "pending",
      "issuedAt": "2026-11-09T01:30:00.000Z",
      "updatedAt": "2026-11-09T01:30:00.000Z",
      "queueNumber": 4,
      "queueDisplay": "VIP-004"
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 25,
    "totalPages": 2,
    "statusCounts": {
      "pending": 18,
      "in-progress": 14,
      "completed": 10
    }
  }
}
```

> [!NOTE]
> `meta.statusCounts` returns the global counts across **all** tickets regardless of the active filter or page, allowing the dashboard status filter tabs to display dynamic counts effortlessly.

---

## 4. Status Transition & Audit Trail

### Endpoint: `PATCH /api/admin/vip-tickets/:id/service-status`

Advances or updates the service-processing status of a VIP application.

#### Permissions & Transition Rules
- **`STAFF`**: Allowed forward transitions only:
  - `pending` $\to$ `in-progress`
  - `in-progress` $\to$ `completed`
  - Any backward transition (e.g., `completed` $\to$ `pending`) returns `400 Bad Request`.
- **`SUPER_ADMIN`**: Can perform any transition, including corrective resets.
- **`OPERATOR`**: Disallowed (`403 Forbidden`).
- **Idempotency**: If target status equals the current status, returns `200 OK` without creating duplicate audit rows.

#### Request Body

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `status` | `string` | **Yes** | Target status: `"pending"`, `"in-progress"`, or `"completed"`. |
| `notes` | `string` | No | Optional processing notes or comments. |

**Example Request:**
```http
PATCH /api/admin/vip-tickets/a7d5d9ff-f6b2-4d08-9a83-48d45adbc1cb/service-status
Content-Type: application/json
Cookie: mesob_admin_token=...

{
  "status": "in-progress",
  "notes": "Verified origin documents with immigration desk"
}
```

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "VIP ticket service-processing status updated from 'pending' to 'in-progress'.",
  "data": {
    "id": "a7d5d9ff-f6b2-4d08-9a83-48d45adbc1cb",
    "reference": "VIP-950963-5E8A",
    "person": "Gurmesa Ayele",
    "status": "in-progress",
    "updatedAt": "2026-11-09T01:35:12.000Z"
  },
  "history": {
    "id": "hist-999",
    "previousStatus": "pending",
    "newStatus": "in-progress",
    "changedBy": "Abebe Kebede",
    "notes": "Verified origin documents with immigration desk",
    "createdAt": "2026-11-09T01:35:12.000Z"
  }
}
```

---

## 5. Single VIP Ticket Details & Full Audit Trail

### Endpoint: `GET /api/admin/vip-tickets/:id`

Retrieves complete details for a ticket including the complete audit history.

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": "a7d5d9ff-f6b2-4d08-9a83-48d45adbc1cb",
    "reference": "VIP-950963-5E8A",
    "person": "Gurmesa Ayele",
    "phone": "0916970942",
    "status": "in-progress",
    "history": [
      {
        "id": "hist-2",
        "previousStatus": "pending",
        "newStatus": "in-progress",
        "changedById": "usr-1",
        "changedByName": "Abebe Kebede",
        "notes": "Verified origin documents",
        "createdAt": "2026-11-09T01:35:12.000Z"
      }
    ]
  }
}
```

---

## 6. Frontend Integration Helper (`frontend/src/services/adminApi.js`)

Add the following methods to `adminApi` in `frontend/src/services/adminApi.js`:

```javascript
export const adminApi = {
  // ... existing methods

  /**
   * Fetch VIP tickets with pagination and filtering
   * @param {Object} params - { page: 1, limit: 25, status: 'pending' }
   */
  vipTickets: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", params.page);
    if (params.limit) query.set("limit", params.limit);
    if (params.status && params.status !== "all") query.set("status", params.status);
    const qs = query.toString();
    return request(`/admin/vip-tickets${qs ? `?${qs}` : ""}`);
  },

  /**
   * Update the service-processing status of a VIP ticket
   * @param {string} ticketId
   * @param {string} status - 'pending' | 'in-progress' | 'completed'
   * @param {string} [notes]
   */
  updateVipServiceStatus: (ticketId, status, notes = "") => {
    return request(`/admin/vip-tickets/${encodeURIComponent(ticketId)}/service-status`, {
      method: "PATCH",
      body: JSON.stringify({ status, notes }),
    });
  },

  /**
   * Get ticket details with audit history
   * @param {string} ticketId
   */
  vipTicketDetails: (ticketId) => {
    return request(`/admin/vip-tickets/${encodeURIComponent(ticketId)}`);
  },
};
```
