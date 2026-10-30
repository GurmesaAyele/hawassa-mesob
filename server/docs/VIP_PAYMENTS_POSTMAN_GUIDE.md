# Hawassa MESOB VIP Payments — Postman Manual Testing Guide

This guide provides step-by-step manual testing instructions for validating the Chapa v2 payment integration for VIP applications in Postman.

---

## 1. Postman Setup

Set the following variables in your Postman Environment or Collection:

| Variable | Sample Value | Notes |
| :--- | :--- | :--- |
| `baseUrl` | `http://localhost:5000` | Local development backend |
| `vipReference` | *(Populated dynamically from Step 1)* | e.g. `VIP-845123-A4B2` |
| `merchantReference` | *(Populated dynamically from Step 2)* | e.g. `VP7A2F8B12C3D4E5` |
| `citizenPhone` | `0911223344` | Test applicant phone number |

---

## 2. Testing Steps

### Step 1: Submit a Fresh VIP Application
* **Method**: `POST`
* **URL**: `{{baseUrl}}/api/vip-tickets`
* **Headers**: `Content-Type: application/json`
* **Body**:
  ```json
  {
    "citizenName": "Abebe Kebede",
    "citizenPhone": "0911223344",
    "purpose": "Priority passport renewal and legal document authentication",
    "serviceIds": ["srv_test_001"]
  }
  ```
  *(Note: Replace `srv_test_001` with an active service ID from `GET {{baseUrl}}/api/services`)*
* **Expected Result**: HTTP `201 Created`
* **Action**: Copy `data.reference` (e.g. `VIP-845123-A4B2`) to `{{vipReference}}`. Verify `data.status` is `"PENDING"`.

---

### Step 2: Initialize Chapa Hosted Checkout
* **Method**: `POST`
* **URL**: `{{baseUrl}}/api/vip-payments/initialize`
* **Headers**: `Content-Type: application/json`
* **Body**:
  ```json
  {
    "reference": "{{vipReference}}"
  }
  ```
* **Expected Result**: HTTP `201 Created`
  ```json
  {
    "success": true,
    "message": "Chapa hosted checkout session initialized successfully.",
    "data": {
      "applicationReference": "VIP-...",
      "merchantReference": "VP...",
      "checkoutUrl": "https://checkout.chapa.co/...",
      "amount": 100000,
      "currency": "ETB",
      "status": "PENDING"
    }
  }
  ```
* **Verification Checks**:
  1. `merchantReference` is unique and $\le 20$ characters long.
  2. `amount` is `100000` (100,000 integer cents = 1,000 ETB).
  3. `checkoutUrl` is a valid Chapa URL.
* **Action**: Copy `merchantReference` to `{{merchantReference}}`. Open `checkoutUrl` in a browser.

---

### Step 3: Test Idempotent Re-initialization
* **Method**: `POST`
* **URL**: `{{baseUrl}}/api/vip-payments/initialize`
* **Body**: Same as Step 2.
* **Expected Result**: HTTP `200 OK`
  - Returns `message: "Reused active checkout session for this VIP application."`
  - Returns the **same** `merchantReference` and `checkoutUrl` without initiating duplicate charges.

---

### Step 4: Complete Test Payment in Chapa Hosted Checkout
1. Open the `checkoutUrl` from Step 2 in your browser.
2. Select any test payment option (e.g., Telebirr, CBE Birr, or Test Card).
3. Follow Chapa's on-screen test prompt to complete test authorization.
4. Chapa redirects back to `CHAPA_RETURN_URL`.

---

### Step 5: Check Payment Status (Polling Test)
* **Method**: `GET`
* **URL**: `{{baseUrl}}/api/vip-payments/status/{{vipReference}}`
* **Expected Result**: HTTP `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "applicationReference": "VIP-...",
      "merchantReference": "VP...",
      "paymentStatus": "PENDING" (or "SUCCESS" if webhook already completed),
      "ticketStatus": "PENDING" (or "CONFIRMED"),
      "amount": 100000,
      "currency": "ETB",
      "isVerified": false
    }
  }
  ```

---

### Step 6: Authoritative Server Verification
* **Method**: `GET`
* **URL**: `{{baseUrl}}/api/vip-payments/verify/{{merchantReference}}`
* **Expected Result**: HTTP `200 OK`
  ```json
  {
    "success": true,
    "message": "Payment successfully verified. VIP application is now CONFIRMED.",
    "data": {
      "applicationReference": "VIP-...",
      "merchantReference": "VP...",
      "paymentStatus": "SUCCESS",
      "ticketStatus": "CONFIRMED",
      "amount": 100000,
      "currency": "ETB",
      "verifiedAt": "2026-10-25T..."
    }
  }
  ```
* **Verification Checks**:
  1. `ticketStatus` is now `"CONFIRMED"`.
  2. `paymentStatus` is `"SUCCESS"`.

---

### Step 7: Verify Ticket Confirmation in Core VIP API
* **Method**: `GET`
* **URL**: `{{baseUrl}}/api/vip-tickets/reference/{{vipReference}}`
* **Expected Result**: HTTP `200 OK`
  - `data.status` is `"CONFIRMED"`.
  - Queue is not yet assigned (`queue.isQueued` is `false`), verifying that queue assignment is decoupled from payment.

---

### Step 8: Test Prevent Duplicate Payment on Confirmed Ticket
* **Method**: `POST`
* **URL**: `{{baseUrl}}/api/vip-payments/initialize`
* **Body**:
  ```json
  {
    "reference": "{{vipReference}}"
  }
  ```
* **Expected Result**: HTTP `409 Conflict`
  ```json
  {
    "success": false,
    "error": "VIP application has already been confirmed and paid."
  }
  ```

---

### Step 9: Webhook Signature Verification Tests

#### Test 9A: Unauthorized Webhook (Invalid Signature)
* **Method**: `POST`
* **URL**: `{{baseUrl}}/api/vip-payments/webhook`
* **Headers**:
  * `Content-Type: application/json`
  * `x-chapa-signature: invalid_signature_hex_123`
* **Body**:
  ```json
  {
    "event": "charge.success",
    "reference": "{{merchantReference}}"
  }
  ```
* **Expected Result**: HTTP `401 Unauthorized`
  ```json
  {
    "error": "Unauthorized: Invalid webhook signature."
  }
  ```

#### Test 9B: Authorized Webhook (Valid HMAC Signature)
* Compute HMAC-SHA256 of the raw body using your `CHAPA_WEBHOOK_SECRET` in Node:
  ```js
  crypto.createHmac('sha256', process.env.CHAPA_WEBHOOK_SECRET).update(bodyString).digest('hex')
  ```
* Pass the resulting hex string in `x-chapa-signature`.
* **Expected Result**: HTTP `200 OK`
  ```json
  {
    "received": true,
    "verified": true,
    "status": "SUCCESS"
  }
  ```

---

### Step 10: Priority Walk-in Check-In (Existing Flow)
* **Method**: `POST`
* **URL**: `{{baseUrl}}/api/vip-tickets/{{vipReference}}/enqueue`
* **Expected Result**: HTTP `200 OK`
  - VIP ticket joins the queue with sequential queue number (e.g. `VIP-001`).
  - Confirms complete compatibility with Hawassa MESOB's walk-in queue system!
