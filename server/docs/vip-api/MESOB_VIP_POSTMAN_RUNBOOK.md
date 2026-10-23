# MESOB VIP Backend — Postman Execution Runbook

> **Step-by-Step Manual API Inspection and Verification Runbook**  
> *Follow this exact sequence in Postman to verify the complete VIP customer lifecycle.*

---

## Table of Contents

1. [Pre-Execution Setup & Environment](#1-pre-execution-setup--environment)
2. [Step-by-Step Manual Execution Sequence](#2-step-by-step-manual-execution-sequence)
   - [Step 1: Retrieve Service Catalog](#step-1-retrieve-service-catalog)
   - [Step 2: Inspect Pre-Payment Queue Availability](#step-2-inspect-pre-payment-queue-availability)
   - [Step 3: Inspect Real-Time Queue Monitor](#step-3-inspect-real-time-queue-monitor)
   - [Step 4: Submit a New VIP Application](#step-4-submit-a-new-vip-application)
   - [Step 5: Verify Application via Reference Lookup](#step-5-verify-application-via-reference-lookup)
   - [Step 6: Reserve VIP Capacity Before Payment](#step-6-reserve-vip-capacity-before-payment)
   - [Step 7: Verify Reserved State via Queue Availability](#step-7-verify-reserved-state-via-queue-availability)
   - [Step 8: Track Application via Phone & Reference](#step-8-track-application-via-phone--reference)
   - [Step 9: Test Reservation Release & Immediate Re-Reservation](#step-9-test-reservation-release--immediate-re-reservation)
   - [Step 10: Attempt In-Person Check-In (Verify Payment Gate)](#step-10-attempt-in-person-check-in-verify-payment-gate)
   - [Step 11: Attempt Queue Position Lookup (Unchecked Ticket)](#step-11-attempt-queue-position-lookup-unchecked-ticket)
   - [Step 12: Execute Error & Input Validation Checks](#step-12-execute-error--input-validation-checks)
3. [Understanding Preconditions & Blocked Transitions](#3-understanding-preconditions--blocked-transitions)
4. [Verification Summary Checklist](#4-verification-summary-checklist)

---

## 1. Pre-Execution Setup & Environment

1. **Start the Express API Server**:
   From the repository's `server/` directory:
   ```bash
   npm run dev
   ```
   Ensure server prints:
   `🚀 Hawassa MESOB API running on http://localhost:5000`
2. **Import Postman Collection**:
   - Open Postman.
   - Click **Import** $\rightarrow$ Select [`MESOB_VIP.postman_collection.json`](file:///c:/Users/hp/Documents/mesobProject/hawassa-mesob/server/docs/vip-api/MESOB_VIP.postman_collection.json).
3. **Verify Collection Variables**:
   In Postman, click on the imported collection **Hawassa MESOB Center — VIP Priority Walk-In API** $\rightarrow$ **Variables**:
   - `baseUrl`: `http://localhost:5000`
   - `citizenPhone`: `0911223344`
   - Other variables (`serviceId`, `secondServiceId`, `vipReference`, `reservationToken`) will be auto-populated by the built-in Postman test scripts.

---

## 2. Step-by-Step Manual Execution Sequence

---

### Step 1: Retrieve Service Catalog
- **Request**: Folder `1. Service Catalog` $\rightarrow$ `1.1 List All Services (Flat Catalog with VIP Flags)`
- **HTTP**: `GET {{baseUrl}}/api/services?locale=en`
- **Prerequisites**: Server running.
- **Expected Response**: `200 OK`
  - Array of services with `vipAvailable: true`, `vipFee: 1000`, `currency: "ETB"`.
- **Values Saved by Script**:
  - `{{serviceId}}` is set to the first service UUID (e.g. `srv_postal_001`).
  - `{{secondServiceId}}` is set to the second service UUID.
- **Database Inspection**: Read-only check against `services` table.
- **Success Criteria**: `data` array length $\ge 1$; collection variable `serviceId` is populated.

---

### Step 2: Inspect Pre-Payment Queue Availability
- **Request**: Folder `4. Queue Availability` $\rightarrow$ `4.1 Check General Queue Availability`
- **HTTP**: `GET {{baseUrl}}/api/vip-tickets/queue/availability`
- **Prerequisites**: None.
- **Expected Response**: `200 OK`
  - `acceptingCustomers`: `true` (during working hours `08:00`–`16:00`).
  - `dailyCapacity`: `30`.
  - `placesRemaining`: $\le 30$.
  - `customersWaiting`: integer count of currently enqueued citizens.
  - `waitingTime`: `null` (honestly indicating that service-duration data is not yet available).
- **Values to Save**: Note `placesRemaining`.
- **Success Criteria**: Availability response returns all required fields; no hardcoded fixed-minute countdowns appear.

---

### Step 3: Inspect Real-Time Queue Monitor
- **Request**: Folder `6. Queue Position and Status` $\rightarrow$ `6.1 Real-Time Queue Monitor Status`
- **HTTP**: `GET {{baseUrl}}/api/vip-tickets/queue/status`
- **Prerequisites**: None.
- **Expected Response**: `200 OK`
  - Returns `queue.counts.waiting`, `queue.counts.serving`, `queue.counts.completedToday`, `queue.isQueueProgressing`.
  - `currentlyServing` and `nextInQueue` display tickets without exposing citizen names or phone numbers.
- **Success Criteria**: Zero PII exposed.

---

### Step 4: Submit a New VIP Application
- **Request**: Folder `2. VIP Application` $\rightarrow$ `2.1 Submit Multi-Service VIP Application`
- **HTTP**: `POST {{baseUrl}}/api/vip-tickets`
- **Request Body**:
  ```json
  {
    "citizenName": "Abebe Kebede",
    "citizenPhone": "{{citizenPhone}}",
    "purpose": "Urgent document authentication and legal dispatch",
    "serviceIds": ["{{serviceId}}"]
  }
  ```
- **Prerequisites**: `{{serviceId}}` populated from Step 1.
- **Expected Response**: `201 Created`
  - `data.reference`: Formatted reference code `VIP-XXXXXX-XXXX`.
  - `data.status`: Strictly `"PENDING"`.
  - `data.vipFee`: Fixed at `1000`.
  - `data.queue.isQueued`: Strictly `false`.
- **Values Saved by Script**:
  - `{{vipReference}}` is set to `data.reference`.
- **Database Inspection**:
  ```sql
  SELECT * FROM vip_tickets WHERE "ticketCode" = '{{vipReference}}';
  ```
  - Row exists with `status = 'PENDING'`, `slotDate = NULL`, `paymentRef = NULL`, `queueNumber = NULL`.
- **Success Criteria**: New ticket created in `PENDING` status; citizen is **not** placed in queue.

---

### Step 5: Verify Application via Reference Lookup
- **Request**: Folder `2. VIP Application` $\rightarrow$ `2.2 Get Application by Reference`
- **HTTP**: `GET {{baseUrl}}/api/vip-tickets/reference/{{vipReference}}`
- **Prerequisites**: `{{vipReference}}` populated from Step 4.
- **Expected Response**: `200 OK`
  - Returns masked citizen name (`Abebe K.`) and masked phone (`09****3344`).
- **Success Criteria**: PII is properly masked.

---

### Step 6: Reserve VIP Capacity Before Payment
- **Request**: Folder `5. Capacity Reservation` $\rightarrow$ `5.1 Reserve Capacity Before Payment (Body-Based)`
- **HTTP**: `POST {{baseUrl}}/api/vip-tickets/reserve-capacity`
- **Request Body**:
  ```json
  {
    "reference": "{{vipReference}}",
    "phone": "{{citizenPhone}}"
  }
  ```
- **Prerequisites**: Ticket exists in `PENDING` status.
- **Expected Response**: `201 Created`
  - `data.status`: Remains `"PENDING"`.
  - `data.reservationToken`: `res_...` token generated.
  - `data.holdMinutes`: `15`.
  - `data.expiresInSeconds`: $\approx 900$.
- **Values Saved by Script**:
  - `{{reservationToken}}` is set to `data.reservationToken`.
- **Database Inspection**:
  ```sql
  SELECT "ticketCode", status, "slotDate", "paymentRef" 
  FROM vip_tickets WHERE "ticketCode" = '{{vipReference}}';
  ```
  - `slotDate` is populated with today's date boundary.
  - `paymentRef` contains `CAPACITY_RESERVATION` JSON.
  - `status` remains `PENDING`.
- **Success Criteria**: 15-minute capacity reservation created without advancing ticket to confirmed or paid.

---

### Step 7: Verify Reserved State via Queue Availability
- **Request**: Folder `4. Queue Availability` $\rightarrow$ `4.2 Check Queue Availability with Specific Ticket Reference`
- **HTTP**: `GET {{baseUrl}}/api/vip-tickets/queue/availability?reference={{vipReference}}`
- **Prerequisites**: Ticket has active reservation from Step 6.
- **Expected Response**: `200 OK`
  - `ticketLookup.found`: `true`.
  - `ticketLookup.hasActiveReservation`: `true`.
  - `ticketLookup.message`: Explains application is pending payment.
  - `placesRemaining`: Decremented by 1 compared to Step 2.
- **Success Criteria**: Remaining places accurately decremented by 1; active reservation recognized.

---

### Step 8: Track Application via Phone & Reference
- **Request**: Folder `3. Customer Tracking` $\rightarrow$ `3.1 Track VIP Application (Dual-Factor Reference + Phone)`
- **HTTP**: `POST {{baseUrl}}/api/vip-tickets/track`
- **Request Body**:
  ```json
  {
    "reference": "{{vipReference}}",
    "phone": "{{citizenPhone}}"
  }
  ```
- **Prerequisites**: `{{vipReference}}` and `{{citizenPhone}}`.
- **Expected Response**: `200 OK`
  - Returns application details and shows `capacityReservation.hasActiveReservation: true` with countdown in `expiresInSeconds`.
- **Success Criteria**: Tracking works seamlessly with dual-factor verification.

---

### Step 9: Test Reservation Release & Immediate Re-Reservation
1. **Send Release Request**:
   - **Request**: Folder `5. Capacity Reservation` $\rightarrow$ `5.3 Release Capacity Reservation (Body-Based)`
   - **HTTP**: `POST {{baseUrl}}/api/vip-tickets/release-capacity`
   - **Expected Response**: `200 OK` (`{"released": true, "message": "VIP capacity reservation released successfully."}`).
   - **Database Check**: `slotDate` and `paymentRef` become `NULL` in `vip_tickets`.
2. **Re-Reserve Capacity**:
   - Re-send Request `5.1 Reserve Capacity Before Payment (Body-Based)`.
   - **Expected Response**: `201 Created` with a new reservation token and fresh 15-minute hold.
- **Success Criteria**: Capacity is immediately freed upon release and can be re-acquired.

---

### Step 10: Attempt In-Person Check-In (Verify Payment Gate)
- **Request**: Folder `7. Check-In / Enqueue` $\rightarrow$ `7.1 Physical Check-In / Enqueue Ticket`
- **HTTP**: `POST {{baseUrl}}/api/vip-tickets/{{vipReference}}/enqueue`
- **Prerequisites**: Ticket is currently in `PENDING` status.
- **Expected Response**: **`400 Bad Request`**
  ```json
  {
    "error": "Ticket must be in CONFIRMED status with verified payment before physical queue check-in. Current status: PENDING."
  }
  ```
- **Database Inspection**: `vip_tickets` row remains unchanged.
- **Success Criteria**: **Payment Verification Gate works as designed.** Citizens cannot enter the active walk-in queue without verified payment confirmation.

---

### Step 11: Attempt Queue Position Lookup (Unchecked Ticket)
- **Request**: Folder `6. Queue Position and Status` $\rightarrow$ `6.2 Customer Queue Position Lookup`
- **HTTP**: `GET {{baseUrl}}/api/vip-tickets/{{vipReference}}/queue-position`
- **Prerequisites**: Ticket is in `PENDING` status.
- **Expected Response**: `400 Bad Request`
  ```json
  {
    "error": "Application is pending payment. An application reference is not a walk-in queue position. Physical check-in at Hawassa MESOB Center is required to join the priority walk-in queue.",
    "data": {
      "ticketCode": "{{vipReference}}",
      "status": "PENDING",
      "isQueued": false,
      "customersWaiting": 0
    }
  }
  ```
- **Success Criteria**: System clearly informs the citizen that an application reference alone is not a queue position.

---

### Step 12: Execute Error & Input Validation Checks
Run each request in Folder `8. Error and Validation Checks`:

| Request | Expected Status | Validation Verified |
| :--- | :--- | :--- |
| `8.1 Reject Application with Missing Phone` | `400 Bad Request` | Fails field validation (`'citizenPhone' is required`) |
| `8.2 Reject Application with Duplicate Service IDs` | `400 Bad Request` | Fails duplicate check (`Duplicate service ID found`) |
| `8.3 Reject Application with Non-Existent Service ID` | `404 Not Found` | Rejects IDs not in catalog |
| `8.4 Reject Tracking with Mismatched Phone Number` | `404 Not Found` | Security: Uniform 404 prevents enumeration |
| `8.5 Reject Physical Check-In on Unconfirmed Ticket` | `400 Bad Request` | Enforces payment gate before physical queue check-in |

---

## 3. Understanding Preconditions & Blocked Transitions

To prevent incorrect assumptions during manual testing:

```
[ Citizen Applies ]  ──>  status: PENDING (queueNumber: NULL)
                                |
[ Reserve Capacity ] ──>  status: PENDING (15-min hold in paymentRef)
                                |
[ Payment Provider ] ──>  status: CONFIRMED  <--- [ BLOCKED IN THIS PHASE ]
                                |                   (Requires CBE / Telebirr webhook)
[ In-Person Check-In]──>  status: QUEUED (queueNumber: VIP-001 assigned)
                                |
[ Counter Call ]     ──>  status: SERVING (servedAt recorded) <--- [ FUTURE STAFF PHASE ]
                                |
[ Service Done ]     ──>  status: USED (completedAt recorded) <--- [ FUTURE STAFF PHASE ]
```

- **Why Check-In (`enqueue`) cannot be completed for a newly created application**:
  The application is in `PENDING` status. Advancing to `CONFIRMED` requires verified payment confirmation from CBE or Telebirr (intentionally excluded from this phase). Bypassing this rule by manually editing the database to `CONFIRMED` is possible for testing, but the backend API correctly blocks check-in of unpaid tickets.
- **Why Waiting Time returns `null`**:
  Average duration is calculated only when $\ge 3$ completed services today have real `servedAt` and `completedAt` timestamps. Because staff counter screens are not yet implemented, no completion timestamps exist in the live database, so the backend honestly returns `waitingTime: null`.

---

## 4. Verification Summary Checklist

- [ ] All 17 endpoints return expected JSON response structures.
- [ ] Flat fee of 1,000 ETB verified across single and multi-service applications.
- [ ] PII is properly masked on public endpoints and tracking endpoints.
- [ ] Capacity reservation holds capacity for 15 minutes and releases cleanly.
- [ ] Physical check-in rejects tickets in `PENDING` status.
- [ ] Queue position check distinguishes active queue from unadmitted applications.
- [ ] Waiting-time estimation honestly returns `null` with explicit explanation when empirical data is absent.
