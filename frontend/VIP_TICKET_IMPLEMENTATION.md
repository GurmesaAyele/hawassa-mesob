# VIP Ticket Service - Implementation Guide

## Overview
Complete VIP Ticket service implementation following the Hawassa MESOB VIP Service API Integration Guide. This implementation includes institution/service selection, application form, Chapa payment integration, and payment verification with polling.

## Features Implemented

### 1. **Full-Screen Institution & Service Selection**
- Fetches all institutions with services from backend API
- Full-screen modal on step 1 for better user experience
- Expandable institution cards showing all available services
- Multi-service selection capability
- Visual feedback for selected services
- Institution logos displayed

### 2. **VIP Application Form**
- **Required Fields:**
  - Citizen Name (full name validation)
  - Citizen Phone (Ethiopian phone format: 09XXXXXXXX or +251XXXXXXXXX)
  - Service Selection (at least one service required)
  - Purpose (optional description)

- **Validation:**
  - Real-time form validation
  - Ethiopian phone number regex validation
  - Required field checks
  - Error messages displayed inline

### 3. **Chapa Payment Integration**
- POST `/api/vip-tickets` - Creates VIP application
- POST `/api/vip-payments/initialize` - Initializes Chapa checkout
- Automatic redirect to Chapa hosted checkout
- Application reference saved in localStorage for recovery

### 4. **Payment Callback & Verification**
- Dedicated callback page at `/vip/payment/callback`
- Automatic payment status polling (every 3 seconds)
- Maximum 20 polling attempts (60 seconds total)
- GET `/api/vip-payments/status/:reference` - Status checking

### 5. **Payment States Handled**
- ✅ **Success (isConfirmed=true):** Shows success screen with ticket details
- ⏳ **Pending (isPending=true):** Continues polling with visual feedback
- ❌ **Failed (canRetry=true):** Shows error message with retry option
- ⏱️ **Timeout:** Polling exceeds maximum attempts
- 🚫 **404:** Payment session not found

### 6. **Multi-Language Support**
- English, Amharic, and Sidama translations
- All UI elements translated
- Language switching supported

### 7. **Error Handling**
- HTTP 400: Validation errors displayed
- HTTP 404: Session not found
- HTTP 409: Already paid or already in queue
- HTTP 429: Rate limiting with user feedback
- HTTP 500/502: Gateway errors with retry option

## File Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── VIPTicket.jsx              # Main VIP Ticket component with modal
│   ├── pages/
│   │   └── VIPPaymentCallback.jsx     # Payment callback & verification page
│   ├── config/
│   │   └── api.js                      # API configuration (updated)
│   └── App.jsx                         # Routes (updated)
```

## API Endpoints Used

### Base URL
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://10.20.248.6:5000';
```

### Endpoints
1. **GET** `/api/institutions?locale={locale}&includeServices=true`
   - Fetches institutions with their services

2. **POST** `/api/vip-tickets`
   ```json
   {
     "citizenName": "Abebe Kebede",
     "citizenPhone": "0911223344",
     "serviceId": "service-uuid",
     "purpose": "Urgent service request"
   }
   ```
   - Creates VIP application
   - Returns: `{ success: true, data: { reference: "VIP-...", status: "PENDING", vipFee: 1000 } }`

3. **POST** `/api/vip-payments/initialize`
   ```json
   {
     "reference": "VIP-649796-8123",
     "email": "citizen@example.com",
     "returnUrl": "http://localhost:5173/vip/payment/callback"
   }
   ```
   - Initializes Chapa payment
   - Returns: `{ success: true, data: { checkoutUrl: "https://checkout.chapa.co/..." } }`

4. **GET** `/api/vip-payments/status/:reference`
   - Checks payment status
   - Returns: `{ success: true, data: { isConfirmed, isPending, canRetry, ... } }`

## User Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User clicks VIP Ticket button (left bottom corner)      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Full-screen modal shows all institutions                 │
│    - User expands institutions to view services             │
│    - User selects one or more services                      │
│    - Clicks "Proceed to Application"                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Application form appears                                 │
│    - Enter citizen name                                     │
│    - Enter Ethiopian phone number                           │
│    - Optional: Add purpose/reason                           │
│    - Review selected services                               │
│    - See VIP fee: 1,000 ETB                                 │
│    - Click "Submit & Pay"                                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend creates VIP application                          │
│    - POST /api/vip-tickets                                  │
│    - Returns application reference (VIP-XXXXXX-XXXX)        │
│    - Reference saved to localStorage                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Initialize Chapa payment                                 │
│    - POST /api/vip-payments/initialize                      │
│    - Returns Chapa checkout URL                             │
│    - Browser redirects to Chapa                             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. User completes payment on Chapa                          │
│    - Selects payment method (TeleBirr, CBE, etc.)           │
│    - Completes payment                                      │
│    - Chapa redirects back to callback URL                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Callback page loads                                      │
│    - Shows "Confirming payment..." spinner                  │
│    - Retrieves application reference from localStorage      │
│    - Starts polling payment status every 3 seconds          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Poll payment status                                      │
│    - GET /api/vip-payments/status/:reference                │
│    - Check isConfirmed, isPending, canRetry flags           │
│    - Max 20 attempts (60 seconds)                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
    ┌──────────┐           ┌──────────┐
    │ SUCCESS  │           │  FAILED  │
    └────┬─────┘           └────┬─────┘
         │                      │
         ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│ Show success    │    │ Show error      │
│ - Ticket detail │    │ - Error message │
│ - Reference     │    │ - Retry button  │
│ - Check-in info │    │ - Home button   │
└─────────────────┘    └─────────────────┘
```

## Payment Status Response Structure

### Success Response
```json
{
  "success": true,
  "data": {
    "applicationReference": "VIP-649796-8123",
    "merchantReference": "VPMVO8CATC0A0F285E",
    "paymentStatus": "SUCCESS",
    "ticketStatus": "CONFIRMED",
    "amount": 1000,
    "currency": "ETB",
    "paymentMethod": "telebirr",
    "isVerified": true,
    "isConfirmed": true,
    "isPending": false,
    "canRetry": false
  }
}
```

### Pending Response
```json
{
  "success": true,
  "data": {
    "applicationReference": "VIP-649796-8123",
    "paymentStatus": "PENDING",
    "ticketStatus": "PENDING",
    "isConfirmed": false,
    "isPending": true,
    "canRetry": false
  }
}
```

### Failed Response
```json
{
  "success": true,
  "data": {
    "applicationReference": "VIP-649796-8123",
    "paymentStatus": "FAILED",
    "ticketStatus": "PENDING",
    "isConfirmed": false,
    "isPending": false,
    "canRetry": true,
    "errorMessage": "Transaction was cancelled by user"
  }
}
```

## Security Considerations

1. **Never trust query parameters** from Chapa callback
2. **Always verify** payment status server-side
3. **Use localStorage** to persist application reference across redirect
4. **Clear localStorage** after successful payment confirmation
5. **Never expose** Chapa secret keys in frontend code
6. **Only use** backend-provided checkout URLs

## Testing Checklist

- [ ] VIP button visible in bottom-left corner
- [ ] Full-screen modal opens on click
- [ ] Institutions load from backend API
- [ ] Services expand/collapse correctly
- [ ] Multi-service selection works
- [ ] Form validation catches invalid inputs
- [ ] Ethiopian phone format validated correctly
- [ ] Application creation succeeds
- [ ] Chapa redirect happens automatically
- [ ] Callback page loads after payment
- [ ] Polling shows progress (attempt counter)
- [ ] Success state displays ticket details
- [ ] Failed state shows retry option
- [ ] Timeout shows appropriate message
- [ ] Multi-language switching works
- [ ] localStorage cleanup on success

## Environment Variables

Create `.env` file in frontend root:

```env
VITE_API_BASE_URL=http://10.20.248.6:5000
```

For production:
```env
VITE_API_BASE_URL=https://your-production-api.com
```

## Error Recovery

### If payment fails:
1. Error message displayed to user
2. "Retry Payment" button available
3. Clicking retry re-initializes payment with same application reference
4. No duplicate application created

### If polling times out:
1. User sees timeout message
2. Application reference still saved
3. User can check status later
4. Payment may still succeed on backend

### If page refreshed during payment:
1. Application reference persists in localStorage
2. User can manually check status
3. Consider implementing status lookup by reference

## Next Steps

### Recommended Enhancements:
1. **Status Lookup Page:** Allow users to check status by entering reference
2. **Queue Display:** Show queue number after check-in
3. **Email Receipts:** Collect email and send confirmation
4. **SMS Notifications:** Send SMS with ticket reference
5. **Print Ticket:** Allow printing/downloading ticket as PDF
6. **History:** Show user's past VIP applications
7. **Analytics:** Track conversion rates and abandonment

### Backend Requirements:
1. Ensure all endpoints return consistent response structure
2. Implement proper error handling for all edge cases
3. Set up webhook for Chapa payment notifications
4. Implement rate limiting on payment endpoints
5. Add logging for payment verification failures
6. Set up monitoring for payment processing times

## Support & Maintenance

### Common Issues:

**Issue:** Payment stuck in pending
- **Solution:** Check backend logs for Chapa verification errors
- **User Action:** Wait for timeout, then check status later

**Issue:** 404 on status check
- **Solution:** Verify application reference exists in database
- **User Action:** Start new application

**Issue:** 409 Already Paid
- **Solution:** Check if ticket already confirmed
- **User Action:** Navigate to confirmation page

**Issue:** Rate limit exceeded
- **Solution:** Implement exponential backoff
- **User Action:** Wait 30 seconds before retry

## Contact

For questions about this implementation, refer to:
- **API Documentation:** `Hawassa-MESOB-VIP-API-Integration-Guide.docx`
- **Backend Team:** For endpoint issues and payment verification
- **Frontend Team:** For UI/UX improvements

---

**Version:** 1.0  
**Last Updated:** 2026-11-02  
**Status:** ✅ Complete and Ready for Testing
