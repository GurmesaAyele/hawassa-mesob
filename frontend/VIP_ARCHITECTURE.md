# VIP Ticket Service - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │           VIPTicket.jsx Component (Modal)              │   │
│  │                                                        │   │
│  │  Step 1: Institution & Service Selection              │   │
│  │  ┌──────────────────────────────────────────────┐    │   │
│  │  │ • Fetch institutions from API                │    │   │
│  │  │ • Display with logos                         │    │   │
│  │  │ • Expandable service lists                   │    │   │
│  │  │ • Multi-select checkboxes                    │    │   │
│  │  │ • Visual feedback for selection              │    │   │
│  │  └──────────────────────────────────────────────┘    │   │
│  │                      ↓                                 │   │
│  │  Step 2: Application Form                             │   │
│  │  ┌──────────────────────────────────────────────┐    │   │
│  │  │ • Citizen name (required)                    │    │   │
│  │  │ • Phone number (Ethiopian format)            │    │   │
│  │  │ • Purpose (optional)                         │    │   │
│  │  │ • Real-time validation                       │    │   │
│  │  │ • Submit → Create application                │    │   │
│  │  └──────────────────────────────────────────────┘    │   │
│  │                      ↓                                 │   │
│  │  Step 3: Payment Processing                           │   │
│  │  ┌──────────────────────────────────────────────┐    │   │
│  │  │ • Initialize Chapa payment                   │    │   │
│  │  │ • Redirect to Chapa checkout                 │    │   │
│  │  │ • Save reference to localStorage             │    │   │
│  │  └──────────────────────────────────────────────┘    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │     VIPPaymentCallback.jsx Page (Full Screen)      │   │
│  │                                                    │   │
│  │  Step 4: Payment Verification                     │   │
│  │  ┌──────────────────────────────────────────┐    │   │
│  │  │ • Retrieve reference from localStorage   │    │   │
│  │  │ • Poll payment status (3 sec intervals) │    │   │
│  │  │ • Max 20 attempts (60 seconds)          │    │   │
│  │  │ • Show loading/progress                 │    │   │
│  │  └──────────────────────────────────────────┘    │   │
│  │                      ↓                             │   │
│  │  Step 5: Result Display                           │   │
│  │  ┌──────────────────────────────────────────┐    │   │
│  │  │ Success: Show ticket details            │    │   │
│  │  │ Failed: Show error + retry              │    │   │
│  │  │ Timeout: Show check later option        │    │   │
│  │  └──────────────────────────────────────────┘    │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────────────────────────────────────────────────────┐   │
│  │               api.js Configuration                 │   │
│  │                                                    │   │
│  │  • BASE_URL from env                              │   │
│  │  • All endpoint paths                             │   │
│  │  • Helper functions                               │   │
│  │  • Locale mapping                                 │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND API (Node.js)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GET  /api/institutions?locale=en&includeServices=true         │
│  ├─ Returns: Array of institutions with services               │
│  └─ Used by: VIPTicket Step 1                                  │
│                                                                 │
│  POST /api/vip-tickets                                          │
│  ├─ Body: { citizenName, citizenPhone, serviceId, purpose }   │
│  ├─ Returns: { reference: "VIP-XXXXXX-XXXX", status, fee }    │
│  └─ Used by: VIPTicket Step 2                                  │
│                                                                 │
│  POST /api/vip-payments/initialize                             │
│  ├─ Body: { reference, email, returnUrl }                     │
│  ├─ Returns: { checkoutUrl, merchantReference }               │
│  ├─ Creates: Payment session in database                       │
│  └─ Used by: VIPTicket Step 3                                  │
│                                                                 │
│  GET  /api/vip-payments/status/:reference                      │
│  ├─ Returns: { isConfirmed, isPending, canRetry, ... }        │
│  └─ Used by: VIPPaymentCallback polling                        │
│                                                                 │
│  GET  /api/vip-payments/verify/:reference (Optional)           │
│  ├─ Triggers: Server-side verification with Chapa             │
│  └─ Used by: Fallback/manual verification                      │
│                                                                 │
│  GET  /api/vip-tickets/reference/:reference (Future)           │
│  ├─ Returns: Application and queue status                      │
│  └─ Used by: Status lookup feature (not yet in UI)            │
│                                                                 │
│  POST /api/vip-tickets/:id/enqueue (Staff Only)                │
│  ├─ Triggers: Physical check-in at MESOB Center               │
│  └─ Returns: { queueNumber: "VIP-001" }                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Server-to-Server HTTPS
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CHAPA PAYMENT GATEWAY                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Hosted Checkout Page                                           │
│  ├─ Payment method selection                                   │
│  ├─ TeleBirr, CBE, CBEBirr, etc.                              │
│  ├─ User completes payment                                     │
│  └─ Redirects back to: /vip/payment/callback                  │
│                                                                 │
│  Webhook (Backend)                                              │
│  ├─ Real-time payment notifications                            │
│  ├─ Backend updates payment status                             │
│  └─ Used for instant verification                              │
│                                                                 │
│  Verification API (Backend)                                     │
│  ├─ Server requests payment status                             │
│  ├─ Returns: Success/Failed/Pending                            │
│  └─ Used by: /api/vip-payments/verify                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Bank Integration
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      PAYMENT PROVIDERS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  • TeleBirr (Ethio Telecom)                                    │
│  • Commercial Bank of Ethiopia (CBE)                            │
│  • CBEBirr                                                      │
│  • Other supported banks and mobile money                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Application Creation Flow

```
User                Frontend              Backend               Database
 │                     │                     │                     │
 │  Fill Form          │                     │                     │
 ├──────────────────> │                     │                     │
 │                     │  POST /vip-tickets  │                     │
 │                     ├──────────────────> │                     │
 │                     │                     │  INSERT application │
 │                     │                     ├──────────────────> │
 │                     │                     │  return ID + ref    │
 │                     │                     │ <────────────────── │
 │                     │  { reference, ... } │                     │
 │                     │ <────────────────── │                     │
 │  Show reference     │                     │                     │
 │ <────────────────── │                     │                     │
 │                     │                     │                     │
 │                     │  Save to localStorage                     │
 │                     ├─────────────────┐   │                     │
 │                     │                 │   │                     │
 │                     │ <───────────────┘   │                     │
```

### 2. Payment Initialization Flow

```
Frontend            Backend             Chapa API           Database
 │                     │                     │                 │
 │  POST /initialize   │                     │                 │
 ├──────────────────> │                     │                 │
 │                     │  Create session     │                 │
 │                     ├──────────────────> │                 │
 │                     │  { checkoutUrl }    │                 │
 │                     │ <────────────────── │                 │
 │                     │  INSERT payment     │                 │
 │                     ├────────────────────────────────────> │
 │  { checkoutUrl }    │                     │                 │
 │ <────────────────── │                     │                 │
 │                     │                     │                 │
 │  Redirect           │                     │                 │
 ├───────────────────────────────────────> │                 │
 │                     │                     │                 │
```

### 3. Payment Verification Flow

```
User @ Chapa       Frontend           Backend            Chapa API       Database
 │                    │                  │                  │               │
 │  Complete payment  │                  │                  │               │
 ├─────────────────> │                  │                  │               │
 │                    │                  │                  │               │
 │  Redirect          │                  │                  │               │
 │ <───────────────── │                  │                  │               │
 │                    │                  │                  │               │
 │  Load callback page│                  │                  │               │
 ├──────────────────> │                  │                  │               │
 │                    │                  │                  │               │
 │                    │  Poll: GET /status/:ref             │               │
 │                    ├───────────────> │                  │               │
 │                    │                  │  Query payment   │               │
 │                    │                  ├────────────────────────────────> │
 │                    │                  │  { status: PENDING }             │
 │                    │                  │ <──────────────────────────────── │
 │                    │  { isPending }   │                  │               │
 │                    │ <─────────────── │                  │               │
 │                    │                  │                  │               │
 │                    │  Wait 3 seconds  │                  │               │
 │                    ├─────────┐        │                  │               │
 │                    │         │        │                  │               │
 │                    │ <───────┘        │                  │               │
 │                    │                  │                  │               │
 │                    │  Poll again      │                  │               │
 │                    ├───────────────> │                  │               │
 │                    │                  │  Verify w/ Chapa │               │
 │                    │                  ├───────────────> │               │
 │                    │                  │  { status: SUCCESS }            │
 │                    │                  │ <─────────────── │               │
 │                    │                  │  UPDATE confirmed│               │
 │                    │                  ├────────────────────────────────> │
 │                    │  { isConfirmed } │                  │               │
 │                    │ <─────────────── │                  │               │
 │                    │                  │                  │               │
 │  Show success      │                  │                  │               │
 │ <────────────────── │                  │                  │               │
```

## Component Hierarchy

```
App.jsx
 │
 ├─ Router
 │   ├─ Route: /
 │   │   └─ Home.jsx
 │   │       ├─ Navbar
 │   │       ├─ VIPTicket.jsx ◄────── VIP Button (Always Visible)
 │   │       ├─ Chatbot
 │   │       └─ Footer
 │   │
 │   ├─ Route: /vip/payment/callback
 │   │   └─ VIPPaymentCallback.jsx ◄── Payment Return Page
 │   │       ├─ Navbar
 │   │       ├─ Polling Logic
 │   │       ├─ Status Display
 │   │       └─ Footer
 │   │
 │   └─ Other routes...
 │
 └─ Config
     └─ api.js ◄──── Shared by all components
```

## State Management

### VIPTicket Component State

```javascript
// Step progression
step: 1 | 2 | 3 | 4

// Institutions data
institutions: Institution[]
institutionsLoading: boolean
expandedInstitution: string | null
selectedServices: Service[]

// Form data
formData: {
  citizenName: string
  citizenPhone: string
  purpose: string
}
formErrors: Record<string, string>

// Application data
applicationReference: string | null
applicationData: ApplicationData | null

// Payment status
paymentStatus: PaymentStatus | null
isPolling: boolean
pollingAttempts: number
```

### VIPPaymentCallback Component State

```javascript
// Status tracking
status: 'loading' | 'success' | 'failed' | 'timeout'
paymentData: PaymentData | null
errorMessage: string
pollingAttempts: number

// Language
language: 'English' | 'Amharic' | 'Sidama'
```

## LocalStorage Usage

```javascript
// Saved by VIPTicket after application creation
localStorage.setItem('vip_application_reference', 'VIP-XXXXXX-XXXX')

// Retrieved by VIPPaymentCallback on mount
const reference = localStorage.getItem('vip_application_reference')

// Cleared after successful payment confirmation
localStorage.removeItem('vip_application_reference')
```

## API Response Contracts

### Institution Response
```typescript
{
  id: string
  name: string
  logo?: string
  icon?: string
  code?: string
  services?: [
    {
      id: string
      name?: string
      title?: string
      description?: string
      duration?: string
      cost?: number
      requirements?: string[]
    }
  ]
}
```

### Application Creation Response
```typescript
{
  success: true
  message: string
  data: {
    reference: string        // "VIP-649796-8123"
    status: string          // "PENDING"
    citizenName: string
    maskedPhone: string     // "09****3344"
    vipFee: number         // 1000
    currency: string       // "ETB"
    isFlatFee: boolean
  }
}
```

### Payment Initialization Response
```typescript
{
  success: true
  message: string
  data: {
    applicationReference: string
    merchantReference: string
    checkoutUrl: string
    amount: number
    currency: string
    status: string
    persisted: boolean
  }
}
```

### Payment Status Response
```typescript
{
  success: true
  data: {
    applicationReference: string
    merchantReference: string
    providerReference?: string
    paymentStatus: 'SUCCESS' | 'PENDING' | 'FAILED' | 'CANCELLED' | 'EXPIRED'
    ticketStatus: 'PENDING' | 'CONFIRMED' | 'QUEUED' | 'SERVING' | 'USED'
    amount: number
    currency: string
    paymentMethod?: string
    isVerified: boolean
    isConfirmed: boolean
    isPending: boolean
    canRetry: boolean
    errorMessage?: string
    updatedAt: string
  }
}
```

## Security Considerations

### What Frontend Does NOT Do:
- ❌ Store payment credentials
- ❌ Handle payment processing directly
- ❌ Expose Chapa API keys
- ❌ Trust URL query parameters for payment status
- ❌ Store sensitive personal data

### What Frontend DOES Do:
- ✅ Validates user input before submission
- ✅ Uses HTTPS for all API calls
- ✅ Verifies payment status via backend API only
- ✅ Sanitizes user input
- ✅ Implements CSRF protection (via backend)
- ✅ Uses secure localStorage (for non-sensitive reference)

---

**Architecture Version:** 1.0  
**Last Updated:** November 2, 2026  
**Maintained By:** Hawassa MESOB Development Team
