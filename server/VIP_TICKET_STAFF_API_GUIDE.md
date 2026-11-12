# VIP Tickets Staff & Multi-Institution Tenant Isolation API Guide

This guide is for frontend developers integrating the **Dedicated Institution Staff Desks & VIP Ticket Processing** views on the Hawassa MESOB Admin Dashboard.

---

## 1. Architectural Overview: Institution Tenant Isolation

Hawassa MESOB connects citizens to multiple governmental and financial institutions (e.g., Commercial Bank of Ethiopia, Immigration & Nationality, Trade Authority). 

Each institution has dedicated desk staff who **only see and process VIP orders requested for their own institution**.

### Key Tenancy & Security Principles

1. **Staff $\leftrightarrow$ Institution Binding**:
   - Every `STAFF` account is strictly bound to an `institutionId` (e.g., CBE ID `e8b69e0e-056b-47e7-a147-cf37b178ee39`).
   - Center-wide administrators (`SUPER_ADMIN`) have global oversight across all institutions.
2. **Multi-Institution Fan-Out Orders**:
   - When a citizen orders multiple services across different institutions on a single VIP ticket (e.g. 1 CBE service + 1 Immigration service), the order is sent to each institution's staff desk separately.
   - **Cross-Institution Privacy**: CBE staff ONLY sees the citizen's CBE requested service. Immigration's requested service is completely withheld/masked from CBE staff.
3. **Independent Service Lifecycles**:
   - Each institution's desk staff advances their service order status independently (`pending` $\to$ `in-progress` $\to$ `completed`).
   - CBE staff completing their service does **not** close Immigration's pending service.
   - The ticket's `overallStatus` becomes `completed` only when **all** institutions finish serving the citizen.
4. **Verified Orders Queue**:
   - Staff desks display **verified/confirmed VIP orders** (`ticketStatus: "CONFIRMED"`, `QUEUED`, `SERVING`, `USED`). Unpaid/unverified drafts are filtered out of active staff queues.

---

## 2. Authentication & Desk Identification

### Endpoint: `POST /api/auth/login` and `GET /api/auth/me`

When staff authenticate, their bound institution is returned in `user.institution`.

**Example Response (`200 OK`):**
```json
{
  "message": "Authentication successful.",
  "user": {
    "id": "cmw8xoq210000fcyk7irp35mv",
    "email": "staff@mesob.hawassa.gov.et",
    "name": "Hawassa MESOB CBE Staff",
    "role": "STAFF",
    "institutionId": "e8b69e0e-056b-47e7-a147-cf37b178ee39",
    "institution": {
      "id": "e8b69e0e-056b-47e7-a147-cf37b178ee39",
      "code": "CBE",
      "name": {
        "en": "Commercial Bank of Ethiopia",
        "am": "የኢትዮጵያ ንግድ ባንክ",
        "sid": "Itiyoophiyu Daldalu Baanke"
      },
      "icon": "building-library",
      "floorRoomNumber": "Ground Floor, Hall B"
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

---

## 3. Dedicated Staff Queue Endpoints

### Endpoint: `GET /api/admin/vip-tickets`

Retrieves the paginated list of VIP orders scoped strictly to the authenticated staff member's institution.

#### Query Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `page` | `integer` | `1` | Page number ($\ge 1$). |
| `limit` | `integer` | `25` | Number of items per page (max `100`). |
| `status` | `string` | *(all)* | Filter by processing status: `pending`, `in-progress`, `completed`. |
| `includeUnconfirmed` | `boolean` | `false` | Set `true` to include unverified/draft applications. |
| `institutionId` | `string` | *(none)* | *(Super Admin only)* Filter orders by institution ID. |

#### Example Request (CBE Desk Staff)
```http
GET /api/admin/vip-tickets?status=pending
Authorization: Bearer <staff_token>
```

#### Success Response (`200 OK`)
```json
{
  "data": [
    {
      "id": "tkt_cuid12345",
      "reference": "VIP-950963-5E8A",
      "person": "Abebe Kebede",
      "phone": "0911234567",
      "email": "citizen@example.com",
      "service": "Bank Account Opening",
      "services": [
        {
          "id": "srv_cbe_01",
          "ticketServiceId": "ts_cuid999",
          "name": "Bank Account Opening",
          "status": "pending",
          "estimatedFee": 0,
          "processingDays": 1,
          "provider": {
            "id": "e8b69e0e-056b-47e7-a147-cf37b178ee39",
            "code": "CBE",
            "name": "Commercial Bank of Ethiopia"
          }
        }
      ],
      "status": "pending",
      "overallStatus": "in-progress",
      "ticketStatus": "CONFIRMED",
      "institutionId": "e8b69e0e-056b-47e7-a147-cf37b178ee39",
      "issuedAt": "2026-11-12T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 25,
    "totalPages": 1,
    "statusCounts": {
      "pending": 1,
      "in-progress": 0,
      "completed": 0
    },
    "institutionId": "e8b69e0e-056b-47e7-a147-cf37b178ee39"
  }
}
```

> [!NOTE]
> Even if the citizen requested both CBE and Immigration services, CBE staff will **only** see the CBE service in `services` and `service`. The Immigration service is securely isolated.

---

### Endpoint: `PATCH /api/admin/vip-tickets/:id/service-status`
### Sub-Resource: `PATCH /api/admin/vip-tickets/:id/services/:serviceId/status`

Advances the service processing status of an institution's VIP service order.

#### Authorization Rules
- **STAFF**: Can **only** update services belonging to their assigned institution. Attempting to update another institution's service returns **`403 Forbidden`**.
- **Forward Progression**: Staff can only advance `pending` $\to$ `in-progress` $\to$ `completed`. Backward transitions return `400 Bad Request`.
- **SUPER_ADMIN**: Can update any institution's service with corrective rollback authority.

#### Request Body
```json
{
  "status": "in-progress",
  "notes": "Citizen verified at Counter 4"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "VIP order service status updated to 'in-progress'.",
  "data": {
    "id": "tkt_cuid12345",
    "reference": "VIP-950963-5E8A",
    "status": "in-progress",
    "overallStatus": "in-progress"
  },
  "history": {
    "previousStatus": "pending",
    "newStatus": "in-progress",
    "changedBy": "Hawassa MESOB CBE Staff",
    "notes": "Citizen verified at Counter 4",
    "createdAt": "2026-11-12T10:15:00.000Z"
  }
}
```

---

## 4. Frontend Helper Reference

`frontend/src/services/adminApi.js`:

```javascript
// Fetch VIP orders for authenticated staff desk
const response = await adminApi.vipTickets.list({
  status: "pending", // "all", "pending", "in-progress", "completed"
});

// Advance service processing status
await adminApi.vipTickets.updateServiceStatus(
  ticket.id,
  "in-progress", // nextStatus
  "Counter notes", // optional notes
  ticket.services[0]?.id // target serviceId
);
```

---

## 5. Super Admin Staff Management API

Super Admins have full authority to provision, inspect, update, reassign, deactivate, reset passwords for, and delete staff accounts across all institutions.

### Endpoint Overview

| Action | HTTP Method | Endpoint | Required Role | Description |
| :--- | :---: | :--- | :---: | :--- |
| **Create Staff** | `POST` | `/api/admin/staff` | `SUPER_ADMIN` | Create a new staff account bound to an institution |
| **List Staff** | `GET` | `/api/admin/staff` | `SUPER_ADMIN` | List all staff with filtering, search, and pagination |
| **Get Staff** | `GET` | `/api/admin/staff/:id` | `SUPER_ADMIN` | Get single staff profile with bound institution |
| **Update Staff** | `PATCH` | `/api/admin/staff/:id` | `SUPER_ADMIN` | Update name, email, phone, institution, status, or password |
| **Delete Staff** | `DELETE` | `/api/admin/staff/:id` | `SUPER_ADMIN` | Permanently delete a staff account |

---

### 5.1 Create Staff Member (`POST /api/admin/staff`)

Creates a new staff account and binds it to an institution.

#### Request Body
```json
{
  "name": "Abebe Kebede",
  "email": "cbe.staff@mesob.hawassa.gov.et",
  "password": "StaffSecretPassword2026!",
  "institutionId": "e8b69e0e-056b-47e7-a147-cf37b178ee39",
  "phone": "0911002233",
  "isActive": true
}
```
> [!NOTE]
> You may supply either `institutionId` (UUID/cuid) or `institutionCode` (e.g., `"CBE"`, `"ICS"`, `"TELECOM"`).

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Staff member created successfully.",
  "data": {
    "id": "cmw8xoq210000fcyk7irp35mv",
    "email": "cbe.staff@mesob.hawassa.gov.et",
    "name": "Abebe Kebede",
    "phone": "0911002233",
    "role": "STAFF",
    "institutionId": "e8b69e0e-056b-47e7-a147-cf37b178ee39",
    "isActive": true,
    "createdAt": "2026-11-12T10:00:00.000Z",
    "updatedAt": "2026-11-12T10:00:00.000Z",
    "institution": {
      "id": "e8b69e0e-056b-47e7-a147-cf37b178ee39",
      "code": "CBE",
      "name": { "en": "Commercial Bank of Ethiopia", "am": "የኢትዮጵያ ንግድ ባንክ" },
      "icon": "https://...",
      "floorRoomNumber": "Counter 4"
    }
  }
}
```

---

### 5.2 List Staff Members (`GET /api/admin/staff`)

Supports query parameters:
- `page`: default `1`
- `limit`: default `20` (max `100`)
- `institutionId` or `institutionCode`: Filter staff belonging to a specific institution.
- `search`: Case-insensitive text search matching name, email, or phone.
- `status`: `"active"`, `"inactive"`, or `"all"` (default `"all"`).

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "cmw8xoq210000fcyk7irp35mv",
      "name": "Abebe Kebede",
      "email": "cbe.staff@mesob.hawassa.gov.et",
      "phone": "0911002233",
      "role": "STAFF",
      "institutionId": "e8b69e0e-056b-47e7-a147-cf37b178ee39",
      "isActive": true,
      "institution": {
        "id": "e8b69e0e-056b-47e7-a147-cf37b178ee39",
        "code": "CBE",
        "name": { "en": "Commercial Bank of Ethiopia" }
      }
    }
  ],
  "meta": {
    "total": 14,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### 5.3 Get Single Staff Member (`GET /api/admin/staff/:id`)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "cmw8xoq210000fcyk7irp35mv",
    "name": "Abebe Kebede",
    "email": "cbe.staff@mesob.hawassa.gov.et",
    "phone": "0911002233",
    "role": "STAFF",
    "institutionId": "e8b69e0e-056b-47e7-a147-cf37b178ee39",
    "isActive": true,
    "institution": {
      "id": "e8b69e0e-056b-47e7-a147-cf37b178ee39",
      "code": "CBE",
      "name": { "en": "Commercial Bank of Ethiopia" }
    }
  }
}
```

---

### 5.4 Update Staff Member (`PATCH /api/admin/staff/:id`)

All fields in the body are optional:
- `name`: string (min 2 chars)
- `email`: string (valid email format, uniqueness verified)
- `phone`: string or `null`
- `institutionId` or `institutionCode`: Reassign to a different institution
- `isActive`: boolean (`true` to activate, `false` to deactivate)
- `password`: string (min 6 chars to reset staff password)

#### Example Request
```http
PATCH /api/admin/staff/cmw8xoq210000fcyk7irp35mv
Content-Type: application/json
Authorization: Bearer <super_admin_jwt>

{
  "name": "Abebe Kebede Updated",
  "phone": "0911998877",
  "institutionCode": "ICS",
  "isActive": true
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Staff member updated successfully.",
  "data": {
    "id": "cmw8xoq210000fcyk7irp35mv",
    "name": "Abebe Kebede Updated",
    "email": "cbe.staff@mesob.hawassa.gov.et",
    "phone": "0911998877",
    "role": "STAFF",
    "institutionId": "ics_uuid_67890",
    "isActive": true,
    "institution": {
      "id": "ics_uuid_67890",
      "code": "ICS",
      "name": { "en": "Immigration & Citizenship Service" }
    }
  }
}
```

---

### 5.5 Delete Staff Member (`DELETE /api/admin/staff/:id`)

Permanently deletes the staff account.

#### Example Request
```http
DELETE /api/admin/staff/cmw8xoq210000fcyk7irp35mv
Authorization: Bearer <super_admin_jwt>
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Staff member account deleted successfully.",
  "data": {
    "id": "cmw8xoq210000fcyk7irp35mv",
    "email": "cbe.staff@mesob.hawassa.gov.et",
    "name": "Abebe Kebede Updated"
  }
}
```

---

### 5.6 Frontend Service Helper (`frontend/src/services/adminApi.js`)

Super admin client method template:

```javascript
export const staffApi = {
  // List staff with search and filters
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/staff${qs ? `?${qs}` : ""}`);
  },

  // Get single staff by ID
  getById: (id) => request(`/admin/staff/${encodeURIComponent(id)}`),

  // Create staff member
  create: (data) =>
    request("/admin/staff", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update staff member (profile, reassign, status, or password)
  update: (id, data) =>
    request(`/admin/staff/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Delete staff member
  delete: (id) =>
    request(`/admin/staff/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};
```
