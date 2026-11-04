# Hawassa MESOB VIP Payments — Postman Manual Testing Guide

This guide provides step-by-step instructions for manually testing the Chapa v1 payment integration for VIP applications in Postman.

---

## 1. Postman Setup

Set the following variables in your Postman Environment or Collection:

| Variable | Sample Value | Notes |
| :--- | :--- | :--- |
| `baseUrl` | `http://localhost:5000` | Local development backend |
| `vipReference` | *(Populated from Step 1)* | e.g. `VIP-649796-8123` |
| `merchantReference` | *(Populated from Step 2)* | e.g. `VPMVO8CATC0A0F285E` |
| `citizenEmail` | `citizen@example.com` | Valid email address |

---

## 2. Step-by-Step Test Scenarios

### Scenario 1: Fresh VIP Application
* **Method**: `POST`
* **URL**: `{{baseUrl}}/api/vip-tickets`
* **Headers**: `Content-Type: application/json`
* **Body**:
  ```json
  {
    "citizenName": "Abebe Kebede",
    "citizenPhone": "0911223344",
    "email": "citizen.applicant@gmail.com",
    "purpose": "Priority passport renewal and legal document authentication",
    "serviceIds": ["srv_test_001"]
  }
  ```
  *(Note: Replace `srv_test_001` with an active service ID from `GET {{baseUrl}}/api/services`)*
* **Expected Result**: HTTP `201 Created`
* **Action**: Copy `data.reference` (e.g. `VIP-649796-8123`) to `{{vipReference}}`.

---

### Scenario 2: Initialize Chapa v1 Hosted Checkout
* **Method**: `POST`
* **URL**: `{{baseUrl}}/api/vip-payments/initialize`
* **Headers**: `Content-Type: application/json`
* **Body**:
  ```json
  {
    "reference": "{{vipReference}}"
  }
  ```
  *(Note: Citizen email is automatically resolved from the stored VIP ticket so the citizen does not have to re-enter it)*
* **Expected Result**: HTTP `201 Created`
  ```json
  {
    "success": true,
    "message": "Chapa hosted checkout session initialized successfully.",
    "data": {
      "applicationReference": "VIP-...",
      "merchantReference": "VPM...",
      "checkoutUrl": "https://checkout.chapa.co/checkout/payment/...",
      "amount": 1000,
      "currency": "ETB",
      "status": "PENDING",
      "persisted": true
    }
  }
  ```
* **Verification Checks**:
  1. `merchantReference` is unique and $\le 20$ characters long.
  2. `amount` is `1000` (1,000 ETB, not 100,000 cents).
  3. `checkoutUrl` is a live Chapa checkout link.
  4. `persisted` is `true`.
* **Action**: Copy `merchantReference` to `{{merchantReference}}`.

---

### Scenario 3: Verify Unpaid Transaction Stays Pending
* **Method**: `GET`
* **URL**: `{{baseUrl}}/api/vip-payments/verify/{{merchantReference}}`
* **Expected Result**: HTTP `200 OK`
  ```json
  {
    "success": false,
    "message": "Payment is currently pending.",
    "data": {
      "applicationReference": "VIP-...",
      "merchantReference": "VPM...",
      "paymentStatus": "PENDING",
      "ticketStatus": "PENDING"
    }
  }
  ```
* **Check**: VIP ticket status remains `PENDING`. Unpaid transactions are never confirmed.

---

### Scenario 4: Complete Sandbox Payment
1. Open the `checkoutUrl` in your browser.
2. Select a sandbox payment method (e.g., test Telebirr, CBE Birr, or Test Card).
3. Complete the on-screen simulated payment prompt.

---

### Scenario 5: Authoritative Server Verification (Successful Payment)
* **Method**: `GET`
* **URL**: `{{baseUrl}}/api/vip-payments/verify/{{merchantReference}}`
  *(Note: You can also pass `{{vipReference}}`)*
* **Expected Result**: HTTP `200 OK`
  ```json
  {
    "success": true,
    "message": "Payment successfully verified. VIP application is now CONFIRMED.",
    "data": {
      "applicationReference": "VIP-...",
      "merchantReference": "VPM...",
      "paymentStatus": "SUCCESS",
      "ticketStatus": "CONFIRMED",
      "amount": 1000,
      "currency": "ETB",
      "verifiedAt": "..."
    }
  }
  ```

---

### Scenario 6: Idempotent Verification
* **Method**: `GET`
* **URL**: `{{baseUrl}}/api/vip-payments/verify/{{merchantReference}}`
* **Expected Result**: HTTP `200 OK`
  - Returns `message: "Payment already verified and confirmed."`
  - Re-executing verification does NOT create duplicate database records or re-query Chapa.

---

### Scenario 7: Status Polling (Frontend Return Flow)
* **Method**: `GET`
* **URL**: `{{baseUrl}}/api/vip-payments/status/{{vipReference}}`
* **Expected Result**: HTTP `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "applicationReference": "VIP-...",
      "merchantReference": "VPM...",
      "paymentStatus": "SUCCESS",
      "ticketStatus": "CONFIRMED",
      "isVerified": true,
      "isConfirmed": true,
      "isPending": false,
      "canRetry": false
    }
  }
  ```

---

### Scenario 8: Test Webhook with Invalid Signature
* **Method**: `POST`
* **URL**: `{{baseUrl}}/api/vip-payments/webhook`
* **Headers**:
  - `Content-Type: application/json`
  - `x-chapa-signature: 0000000000000000000000000000000000000000000000000000000000000000`
* **Body**:
  ```json
  {
    "tx_ref": "{{merchantReference}}",
    "status": "success"
  }
  ```
* **Expected Result**: HTTP `401 Unauthorized` (`error: "Unauthorized: Invalid webhook signature."`).

---

### Scenario 9: Queue Check-In Verification
* **Method**: `POST`
* **URL**: `{{baseUrl}}/api/vip-tickets/{{vipReference}}/enqueue`
* **Expected Result**:
  - If during working hours: Assigned daily queue number (`VIP-001`) and transitions to `QUEUED`.
  - Confirms that payment verification only made the ticket `CONFIRMED` and physically separated queue check-in.
