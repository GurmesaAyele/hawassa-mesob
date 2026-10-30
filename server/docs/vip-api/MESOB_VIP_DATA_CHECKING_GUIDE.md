# MESOB VIP Backend — Database Verification Guide

> **Authoritative Guide for Verifying Database State, Relationships, and Concurrency Invariants**  
> *Targeted for backend developers inspecting Prisma models and PostgreSQL tables.*

---

## Table of Contents

1. [Schema Mapping & PostgreSQL Tables](#1-schema-mapping--postgresql-tables)
2. [Prisma Studio vs. Read-Only SQL Inspection](#2-prisma-studio-vs-read-only-sql-inspection)
3. [Operation-by-Operation Verification](#3-operation-by-operation-verification)
   - [3.1 VIP Application Submission](#31-vip-application-submission)
   - [3.2 Pre-Payment Capacity Reservation](#32-pre-payment-capacity-reservation)
   - [3.3 Reservation Expiry & Release](#33-reservation-expiry--release)
   - [3.4 In-Person Check-In (`enqueueVipTicket`)](#34-in-person-check-in-enqueuevipticket)
   - [3.5 Service Start & Completion Lifecycle](#35-service-start--completion-lifecycle)
4. [Integrity Checks & Anomaly Detection Queries](#4-integrity-checks--anomaly-detection-queries)
   - [4.1 Queue Number Uniqueness on the Same Day](#41-queue-number-uniqueness-on-the-same-day)
   - [4.2 Flat 1,000 ETB Fee Across Multi-Service Applications](#42-flat-1000-etb-fee-across-multi-service-applications)
   - [4.3 Accurate Daily Capacity Accounting](#43-accurate-daily-capacity-accounting)
   - [4.4 Active Waiting vs. Completed / Cancelled Tickets](#44-active-waiting-vs-completed--cancelled-tickets)
5. [Current Schema Limitations & Future Synchronization](#5-current-schema-limitations--future-synchronization)

---

## 1. Schema Mapping & PostgreSQL Tables

Below is the verified mapping between Prisma models in [`schema.prisma`](file:///c:/Users/hp/Documents/mesobProject/hawassa-mesob/server/prisma/schema.prisma) and actual PostgreSQL database tables:

| Prisma Model Name | PostgreSQL Table Name | Primary Key | Key Relationships / Purpose |
| :--- | :--- | :--- | :--- |
| `ServiceProvider` | `service_providers` | `id` (text) | Government institutions (Ethio Telecom, CBE, Immigration, etc.) |
| `Service` | `services` | `id` (text) | Specific public services; `providerId` references `service_providers.id` |
| `vip_tickets` | `vip_tickets` | `id` (text) | VIP application records, walk-in queue numbers, timestamps, and payment tokens |
| `vip_ticket_services` | `vip_ticket_services` | `id` (text) | Many-to-many join table between `vip_tickets` and `services` |

---

## 2. Prisma Studio vs. Read-Only SQL Inspection

You can inspect changes using either of two methods:

### Method A: Prisma Studio (Visual Browser GUI)
From the `server` directory, run:
```bash
npx prisma studio
```
Open `http://localhost:5555` in your browser. Select `vip_tickets` and `vip_ticket_services` to inspect rows visually.

### Method B: PostgreSQL CLI / GUI (DBeaver, pgAdmin, psql)
Execute the safe, read-only SQL queries documented in this guide. **Never execute `UPDATE`, `DELETE`, or `DROP` statements directly.**

---

## 3. Operation-by-Operation Verification

### 3.1 VIP Application Submission

When a customer submits a VIP application via `POST /api/vip-tickets`:

#### Expected State Transitions:
- **`vip_tickets`**:
  - `id`: Unique UUID generated for the application.
  - `ticketCode`: Human-readable reference code formatted as `VIP-XXXXXX-XXXX` (e.g. `VIP-845123-A4B2`).
  - `citizenName`: Exact trimmed string submitted by citizen.
  - `citizenPhone`: Normalized phone string (e.g. `0911223344`).
  - `status`: Strictly set to `'PENDING'`.
  - `vipFee`: Fixed at `1000.0`.
  - `currency`: Strictly set to `'ETB'`.
  - `slotDate`: `NULL`.
  - `slotTime`: `NULL`.
  - `paymentRef`: `NULL`.
  - `queueNumber`: `NULL` (citizen is **not** in the queue).
  - `queueDate`: `NULL`.
  - `checkedInAt`: `NULL`.
  - `servedAt`: `NULL`.
  - `completedAt`: `NULL`.
- **`vip_ticket_services`**:
  - Exactly one row per service ID selected in `serviceIds`.
  - `ticketId` matches `vip_tickets.id`.
  - `serviceId` matches valid rows in `services`.

#### Verification Query:
```sql
-- Replace :ticket_code with the returned reference (e.g. 'VIP-845123-A4B2')
SELECT 
    t.id AS ticket_id,
    t."ticketCode",
    t."citizenName",
    t."citizenPhone",
    t.status,
    t."vipFee",
    t.currency,
    t."queueNumber",
    t."checkedInAt",
    COUNT(ts.id) AS associated_services_count
FROM vip_tickets t
LEFT JOIN vip_ticket_services ts ON t.id = ts."ticketId"
WHERE t."ticketCode" = :ticket_code
GROUP BY t.id, t."ticketCode", t."citizenName", t."citizenPhone", t.status, t."vipFee", t.currency, t."queueNumber", t."checkedInAt";
```

#### What to Check:
- `status` must be `PENDING`.
- `queueNumber` and `checkedInAt` must be `NULL`.
- `vipFee` must be `1000.0` regardless of `associated_services_count`.
- `associated_services_count` must equal the number of service IDs submitted.

---

### 3.2 Pre-Payment Capacity Reservation

When a customer reserves capacity via `POST /api/vip-tickets/reserve-capacity`:

#### Expected State Transitions:
- `vip_tickets.status` remains `'PENDING'` (capacity reservation does **not** mark the application paid).
- `vip_tickets.slotDate`: Set to today's date boundary (`YYYY-MM-DDT00:00:00.000Z`).
- `vip_tickets.paymentRef`: Stores the JSON reservation descriptor:
  ```json
  {
    "type": "CAPACITY_RESERVATION",
    "token": "res_8f7b2c14-...",
    "reservedAt": "2026-10-23T07:15:00.000Z",
    "expiresAt": "2026-10-23T07:30:00.000Z",
    "date": "2026-10-23"
  }
  ```
- `vip_tickets.queueNumber`: Still `NULL`.

#### Verification Query:
```sql
SELECT 
    "ticketCode",
    status,
    "slotDate",
    "paymentRef",
    "updatedAt"
FROM vip_tickets
WHERE "ticketCode" = :ticket_code;
```

#### What to Check:
- Verify that `"paymentRef"` contains valid JSON with `"type": "CAPACITY_RESERVATION"`.
- Verify that `"expiresAt"` is exactly 15 minutes after `"reservedAt"`.
- Verify that `"slotDate"` matches the current local date.

---

### 3.3 Reservation Expiry & Release

#### Scenario A: Explicit Release (`POST /api/vip-tickets/release-capacity`)
- `vip_tickets.slotDate` is cleared to `NULL`.
- `vip_tickets.paymentRef` is cleared to `NULL`.
- `vip_tickets.status` remains `'PENDING'`.

#### Scenario B: Natural Timeout Expiration
- Database row is not altered immediately, but `getTodayCapacityMetrics` compares `expiresAt` with `NOW()`. If `NOW() >= expiresAt`, the row is treated as expired and **does not** count against today's consumed capacity.

#### Verification Query:
```sql
-- Inspect whether a reservation has expired naturally
SELECT 
    "ticketCode",
    status,
    "paymentRef",
    CASE 
        WHEN "paymentRef" IS NULL THEN 'NO_RESERVATION'
        WHEN ("paymentRef"::jsonb->>'expiresAt')::timestamptz <= NOW() THEN 'EXPIRED'
        ELSE 'ACTIVE'
    END AS reservation_state,
    ROUND(EXTRACT(EPOCH FROM (("paymentRef"::jsonb->>'expiresAt')::timestamptz - NOW()))) AS seconds_remaining
FROM vip_tickets
WHERE "ticketCode" = :ticket_code;
```

---

### 3.4 In-Person Check-In (`enqueueVipTicket`)

When a citizen physically arrives at the center and checks in via `POST /api/vip-tickets/:id/enqueue`:

> [!IMPORTANT]
> Physical check-in requires the ticket to have verified payment (`status: 'CONFIRMED'`). Calling check-in on a `PENDING` ticket will be rejected with `400 Bad Request`.

#### Expected State Transitions:
- `vip_tickets.status`: Transitions from `'CONFIRMED'` to `'QUEUED'`.
- `vip_tickets.queueNumber`: Assigned an integer sequential number (e.g. `1`, `2`, `3`).
- `vip_tickets.queueDate`: Set to today's start-of-day boundary.
- `vip_tickets.checkedInAt`: Set to the current timestamp `NOW()`.

#### Verification Query:
```sql
SELECT 
    "ticketCode",
    status,
    "queueNumber",
    "queueDate",
    "checkedInAt",
    "servedAt",
    "completedAt"
FROM vip_tickets
WHERE "ticketCode" = :ticket_code;
```

#### What to Check:
- `status` must be `'QUEUED'`.
- `queueNumber` must be an integer $\ge 1$.
- `checkedInAt` must be populated.
- `servedAt` and `completedAt` must still be `NULL`.

---

### 3.5 Service Start & Completion Lifecycle

When future counter workflows are connected:

1. **Service Start** (Operator calls ticket):
   - `status`: Transitions from `'QUEUED'` to `'SERVING'`.
   - `servedAt`: Set to `NOW()`.
2. **Service Completion** (Operator marks service done):
   - `status`: Transitions from `'SERVING'` to `'USED'`.
   - `completedAt`: Set to `NOW()`.
   - Service duration can be computed as:
     $$\text{Duration (min)} = \text{ROUND}(\text{EXTRACT}(\text{EPOCH FROM } (\text{completedAt} - \text{servedAt})) / 60)$$

#### Verification Query:
```sql
SELECT 
    "ticketCode",
    status,
    "queueNumber",
    "checkedInAt",
    "servedAt",
    "completedAt",
    ROUND(EXTRACT(EPOCH FROM ("completedAt" - "servedAt")) / 60) AS duration_minutes
FROM vip_tickets
WHERE "queueDate" >= CURRENT_DATE 
  AND status = 'USED';
```

---

## 4. Integrity Checks & Anomaly Detection Queries

Run these read-only diagnostic queries to verify database consistency across the VIP queue:

### 4.1 Queue Number Uniqueness on the Same Day
Verify that no two tickets received the same queue number on the same date:
```sql
SELECT 
    "queueDate",
    "queueNumber",
    COUNT(*) AS collision_count,
    STRING_AGG("ticketCode", ', ') AS colliding_tickets
FROM vip_tickets
WHERE "queueNumber" IS NOT NULL
GROUP BY "queueDate", "queueNumber"
HAVING COUNT(*) > 1;
```
*Expected Result: 0 rows returned.*

---

### 4.2 Flat 1,000 ETB Fee Across Multi-Service Applications
Verify that multi-service applications are not charged more than 1,000 ETB:
```sql
SELECT 
    t."ticketCode",
    t."vipFee",
    COUNT(ts.id) AS service_count
FROM vip_tickets t
JOIN vip_ticket_services ts ON t.id = ts."ticketId"
GROUP BY t."ticketCode", t."vipFee"
HAVING t."vipFee" != 1000.0;
```
*Expected Result: 0 rows returned.*

---

### 4.3 Accurate Daily Capacity Accounting
Inspect today's total consumed capacity vs. places remaining under the configured limit (30):
```sql
WITH today_bounds AS (
    SELECT 
        (CURRENT_DATE AT TIME ZONE 'Africa/Addis_Ababa')::timestamptz AS start_of_day,
        ((CURRENT_DATE + INTERVAL '1 day') AT TIME ZONE 'Africa/Addis_Ababa')::timestamptz AS end_of_day
)
SELECT 
    COUNT(CASE WHEN t.status IN ('CONFIRMED', 'QUEUED', 'SERVING', 'USED') THEN 1 END) AS confirmed_or_admitted_count,
    COUNT(CASE 
        WHEN t.status = 'PENDING' 
         AND t."paymentRef" IS NOT NULL 
         AND (t."paymentRef"::jsonb->>'expiresAt')::timestamptz > NOW() 
        THEN 1 
    END) AS active_unexpired_reservations_count,
    -- Total capacity consumed
    (
        COUNT(CASE WHEN t.status IN ('CONFIRMED', 'QUEUED', 'SERVING', 'USED') THEN 1 END) +
        COUNT(CASE 
            WHEN t.status = 'PENDING' 
             AND t."paymentRef" IS NOT NULL 
             AND (t."paymentRef"::jsonb->>'expiresAt')::timestamptz > NOW() 
            THEN 1 
        END)
    ) AS total_capacity_consumed,
    -- Places remaining (under default 30 cap)
    GREATEST(0, 30 - (
        COUNT(CASE WHEN t.status IN ('CONFIRMED', 'QUEUED', 'SERVING', 'USED') THEN 1 END) +
        COUNT(CASE 
            WHEN t.status = 'PENDING' 
             AND t."paymentRef" IS NOT NULL 
             AND (t."paymentRef"::jsonb->>'expiresAt')::timestamptz > NOW() 
            THEN 1 
        END)
    )) AS places_remaining
FROM vip_tickets t, today_bounds b
WHERE (t."queueDate" BETWEEN b.start_of_day AND b.end_of_day)
   OR (t."slotDate" BETWEEN b.start_of_day AND b.end_of_day);
```

---

### 4.4 Active Waiting vs. Completed / Cancelled Tickets
Verify that tickets in `USED` or `CANCELLED` status are not appearing as active waiting customers:
```sql
SELECT 
    status,
    COUNT(*) AS ticket_count,
    CASE 
        WHEN status = 'QUEUED' THEN 'Counted in customersWaiting'
        WHEN status = 'SERVING' THEN 'Counted in customersServing'
        WHEN status = 'USED' THEN 'Counted in customersCompletedToday (EXCLUDED from waiting)'
        WHEN status = 'CANCELLED' THEN 'EXCLUDED from all queue counts'
        WHEN status IN ('PENDING', 'CONFIRMED') THEN 'EXCLUDED from active physical queue'
    END AS queue_accounting_role
FROM vip_tickets
WHERE "queueDate" >= CURRENT_DATE OR "createdAt" >= CURRENT_DATE
GROUP BY status;
```

---

## 5. Current Schema Limitations & Future Synchronization

1. **Temporary Reservation Storage in `paymentRef`**:
   - Because migrations against the shared Neon database are withheld, temporary capacity reservations are serialized as JSON in the existing `paymentRef` text column and the date is stored in `slotDate`.
   - When database synchronization is officially approved, dedicated columns should be added:
     ```prisma
     reservedUntil    DateTime?   /// Replaces JSON expiration string
     reservationToken String?     /// Ephemeral checkout token
     ```
2. **Database-Level Unique Constraint on `(queueDate, queueNumber)`**:
   - Currently, queue number uniqueness is guaranteed at the application/transaction level via PostgreSQL advisory locks (`pg_advisory_xact_lock`).
   - When migrations are run, an explicit database constraint should be added:
     ```prisma
     @@unique([queueDate, queueNumber])
     ```
