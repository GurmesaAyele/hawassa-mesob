# Hawassa MESOB VIP Tickets — Chapa Payment Integration API Guide

This guide documents the official Chapa v1 payment integration for Hawassa MESOB VIP ticket applications.

---

## 1. Overview & Payment Lifecycle

The VIP payment integration follows an authoritative, server-verified lifecycle:

```
[Citizen Submits VIP Application]
              │
              ▼
   POST /api/vip-tickets (Status: PENDING)
              │
              ▼
   POST /api/vip-payments/initialize (Requires reference & citizen email)
              │
              ├── Chapa v1 Transaction Initialized
              ├── Returns Chapa Hosted Checkout URL
              ▼
[Citizen Redirected to Chapa Hosted Checkout]
              │
              ├── Completes Payment on Chapa (Telebirr / CBE / Card sandbox)
              ▼
[Citizen Redirects back to Frontend Return URL]
              │
              ▼
[Frontend Displays Verification / Processing Screen]
              │
              ├── Calls GET /api/vip-payments/status/:reference
              ├── OR Calls GET /api/vip-payments/verify/:reference
              ▲
              │ (Simultaneously, Webhook POST /api/vip-payments/webhook verifies)
              ▼
   Ticket status transitions atomically: PENDING ➔ CONFIRMED
              │
              ▼
[Frontend Displays VIP Confirmation with Reference Code]
              │
              ▼
[Citizen physically arrives at Hawassa MESOB Center during operating hours]
              │
              ▼
   POST /api/vip-tickets/:id/enqueue ➔ Walk-In Queue Assignment (e.g. VIP-001)
```

---

## 2. Business & Security Rules

1. **Fixed Fee**: The VIP application fee is strictly **1,000 ETB**, regardless of the number of selected services.
2. **Amount Representation**: In Chapa v1, amount is represented as major units (`1000` ETB), formatted as documented by Chapa (`"1000"`). It is never scaled to minor cents.
3. **Reference Separation**:
   - **Application Reference (`applicationReference`)**: Internal MESOB ticket reference, e.g., `VIP-649796-8123`.
   - **Merchant Reference (`merchantReference`)**: Unique 18-character transaction reference generated for Chapa (`tx_ref`), e.g., `VPMVO8CATC0A0F285E`.
   - **Provider Reference (`providerReference`)**: Chapa's internal reference ID returned upon completion.
4. **Flexible Reference Resolution**: Both `GET /api/vip-payments/verify/:reference` and `GET /api/vip-payments/status/:reference` accept either the `merchantReference` (`VPM...`) OR the citizen's application reference (`VIP-...`).
5. **Authoritative Server Verification**: The frontend must **never** trust browser redirect query parameters (`?status=success`) as proof of payment. Only backend verification against Chapa's official API marks a ticket as `CONFIRMED`.
6. **Separation of Concerns**:
   - `vip_tickets.status`: Application lifecycle (`PENDING` ➔ `CONFIRMED` ➔ `QUEUED` ➔ `SERVING` ➔ `USED` / `CANCELLED`).
   - `vip_payments.status`: Provider payment transaction state (`PENDING` ➔ `SUCCESS` / `FAILED` / `CANCELLED` / `EXPIRED`).
   - Queue assignment happens only during physical walk-in check-in (`POST /api/vip-tickets/:id/enqueue`).

---

## 3. Endpoints

### 3.1 Initialize Payment
Start a Chapa v1 hosted checkout session for an existing VIP application.

* **URL**: `/api/vip-payments/initialize`
* **Method**: `POST`
* **Headers**: `Content-Type: application/json`

#### Request Body
```json
{
  "reference": "VIP-649796-8123",
  "email": "citizen@example.com",
  "returnUrl": "http://localhost:5173/vip/payment/callback",
  "callbackUrl": "https://your-domain.com/api/vip-payments/webhook"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `reference` | String | **Yes** | VIP ticket code (`VIP-...`) or ticket UUID. |
| `email` | String | Optional | Customer email override for legacy tickets; by default resolved from stored ticket. |
| `returnUrl` | String | Optional | Frontend return redirect URL override. |
| `callbackUrl`| String | Optional | Webhook notification URL override. |

#### Success Response (`201 Created` or `200 OK` for reused active session)
```json
{
  "success": true,
  "message": "Chapa hosted checkout session initialized successfully.",
  "data": {
    "applicationReference": "VIP-649796-8123",
    "merchantReference": "VPMVO8CATC0A0F285E",
    "checkoutUrl": "https://checkout.chapa.co/checkout/payment/...",
    "amount": 1000,
    "currency": "ETB",
    "status": "PENDING",
    "persisted": true
  }
}
```

#### Error Responses
* `400 Bad Request`: Missing `reference` or invalid email address.
* `404 Not Found`: VIP application does not exist.
* `409 Conflict`: Application already confirmed/paid, or active in queue.
* `500 Internal Server Error`: Checkout session generated, but database persistence failed (`persisted: false`).
* `502 Bad Gateway`: Chapa provider initialization failure.

---

### 3.2 Poll Payment Status
Proactive status polling endpoint used by the frontend to display payment progress. If a payment is in `PENDING` state, this endpoint actively queries Chapa v1 for verification while enforcing a 3-second cooldown and concurrency protection.

* **URL**: `/api/vip-payments/status/:reference`
* **Method**: `GET`
* **Path Parameter**: `:reference` — VIP application reference (`VIP-...`) OR merchant reference (`VPM...`).

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "applicationReference": "VIP-649796-8123",
    "ticketCode": "VIP-649796-8123",
    "merchantReference": "VPMVO8CATC0A0F285E",
    "providerReference": "chapa-ref-12345",
    "paymentStatus": "SUCCESS",
    "ticketStatus": "CONFIRMED",
    "amount": 1000,
    "currency": "ETB",
    "paymentMethod": "telebirr",
    "checkoutUrl": "https://checkout.chapa.co/checkout/payment/...",
    "isVerified": true,
    "isConfirmed": true,
    "isPending": false,
    "canRetry": false,
    "qrCodeUrl": "data:image/svg+xml;utf8,%3Csvg...",
    "errorMessage": null,
    "updatedAt": "2026-10-25T14:30:00.000Z"
  }
}
```

---

### 3.3 Authoritative Payment Verification
Explicitly triggers a server-to-server verification check against Chapa v1 (`GET https://api.chapa.co/v1/transaction/verify/{tx_ref}`) and atomically confirms the ticket, generating the digital VIP ticket and QR code.

* **URL**: `/api/vip-payments/verify/:reference`
* **Method**: `GET`
* **Path Parameter**: `:reference` — Merchant reference (`VPM...`) OR VIP application reference (`VIP-...`).

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Payment successfully verified. VIP application is now CONFIRMED.",
  "data": {
    "applicationReference": "VIP-649796-8123",
    "ticketCode": "VIP-649796-8123",
    "merchantReference": "VPMVO8CATC0A0F285E",
    "providerReference": "chapa-ref-12345",
    "paymentStatus": "SUCCESS",
    "ticketStatus": "CONFIRMED",
    "isVerified": true,
    "isConfirmed": true,
    "isPending": false,
    "canRetry": false,
    "qrCodeUrl": "data:image/svg+xml;utf8,%3Csvg...",
    "amount": 1000,
    "currency": "ETB",
    "paymentMethod": "telebirr",
    "verifiedAt": "2026-10-25T14:30:00.000Z"
  }
}
```

#### Pending or Non-Success State (`200 OK`, `success: false`)
```json
{
  "success": false,
  "message": "Payment is currently pending.",
  "data": {
    "applicationReference": "VIP-649796-8123",
    "ticketCode": "VIP-649796-8123",
    "merchantReference": "VPMVO8CATC0A0F285E",
    "providerReference": null,
    "paymentStatus": "PENDING",
    "ticketStatus": "PENDING",
    "isVerified": false,
    "isConfirmed": false,
    "isPending": true,
    "canRetry": false,
    "qrCodeUrl": null
  }
}
```

---

### 3.4 Webhook Notification
Automated asynchronous payment notification endpoint called directly by Chapa upon transaction completion.

* **URL**: `/api/vip-payments/webhook`
* **Method**: `POST`
* **Headers**: `x-chapa-signature: <hmac-sha256-hex>`
* **Signature Verification**: HMAC-SHA256 computed over exact raw request body buffer using `CHAPA_WEBHOOK_SECRET` (or `CHAPA_SECRET_KEY`).
* **Behavior**:
  - Rejects invalid signatures with HTTP 401.
  - Does NOT trust payload alone; executes authoritative server-to-server verification.
  - Returns HTTP 200 on successful processing.
  - Returns HTTP 502 on transient network errors so Chapa retries delivery.

---

## 4. Frontend Integration Guide

The frontend payment journey should be implemented as follows:

1. **Submit Application**: Citizen submits application via `POST /api/vip-tickets` and receives `ticketCode` (e.g. `VIP-649796-8123`).
2. **Initialize Payment**: Frontend calls `POST /api/vip-payments/initialize` with `{ "reference": ticketCode, "email": citizenEmail }`.
3. **Redirect to Checkout**: Frontend redirects the browser to the returned `data.checkoutUrl`.
4. **Return Callback Handling**:
   - Customer completes checkout on Chapa and is redirected to the configured frontend return URL (`/vip/payment/callback`).
   - Do **not** mark payment successful based on URL parameters.
   - Show a loading spinner: *"Confirming your VIP payment with Hawassa MESOB..."*
   - Call `GET /api/vip-payments/verify/:reference` (passing `merchantReference` or `ticketCode`).
   - If response reports `success: true` and `data.ticketStatus === "CONFIRMED"`, show the confirmation screen.
   - If payment is still `PENDING`, poll `GET /api/vip-payments/status/:reference` every 3 seconds (up to 30 seconds).
   - If `canRetry === true`, display: *"Payment was not completed. Click here to try again."*
5. **Physical Check-In**:
   - Confirmed tickets display: *"Application Confirmed! When you arrive at Hawassa MESOB Center, check in at the reception or kiosk to enter the priority walk-in queue."*

---

## 5. Required Environment Variables

| Variable | Description |
| :--- | :--- |
| `CHAPA_SECRET_KEY` | Secret key from Chapa Dashboard (`CHASECK_TEST-...` or `CHASECK_LIVE-...`). |
| `CHAPA_PUBLIC_KEY` | Public key from Chapa Dashboard (`CHAPUBK_TEST-...` or `CHAPUBK_LIVE-...`). |
| `CHAPA_WEBHOOK_SECRET`| Optional secret if distinct from `CHAPA_SECRET_KEY`. |
| `CHAPA_BASE_URL` | `https://api.chapa.co/v1` |
| `CHAPA_RETURN_URL` | Frontend callback URL (e.g. `http://localhost:5173/vip/payment/callback`). |
| `CHAPA_CALLBACK_URL` | Public backend webhook URL (e.g. `https://your-api.domain.com/api/vip-payments/webhook`). |
