# VIP API Testing Guide

## Test the Backend Directly

### 1. Test if endpoint exists
```bash
curl -X POST http://10.20.248.6:5000/api/vip-tickets \
  -H "Content-Type: application/json"
```

Expected: Should return error about missing fields (400) or method exists

### 2. Test with minimal data
```bash
curl -X POST http://10.20.248.6:5000/api/vip-tickets \
  -H "Content-Type: application/json" \
  -d '{
    "citizenName": "Test User",
    "citizenPhone": "0911223344",
    "serviceId": "test-service-id",
    "purpose": "Testing"
  }'
```

Expected: Should return either success or specific validation error

### 3. Check what service IDs exist

First, get institutions with services:
```bash
curl http://10.20.248.6:5000/api/institutions?locale=en&includeServices=true
```

Look for service `id` fields in the response. The serviceId should be a UUID like:
```
"id": "6b33e7f6-37be-4d3d-a4dc-7ccf8c83ebbb"
```

### 4. Test with real service ID

Copy a real service ID from step 3, then:
```bash
curl -X POST http://10.20.248.6:5000/api/vip-tickets \
  -H "Content-Type: application/json" \
  -d '{
    "citizenName": "Test User",
    "citizenPhone": "0911223344",
    "serviceId": "PASTE_REAL_SERVICE_ID_HERE",
    "purpose": "Testing VIP application"
  }'
```

## Common Backend Issues

### Issue 1: Service ID doesn't exist in database
**Error:** 500 Internal Server Error or "Service not found"
**Fix:** Backend needs to check if serviceId is valid before creating application

### Issue 2: Database connection issue
**Error:** 500 Internal Server Error
**Fix:** Check backend database connection

### Issue 3: Missing required fields in backend schema
**Error:** 500 Internal Server Error or validation error
**Fix:** Backend needs to validate and return proper 400 error

### Issue 4: Institution services don't have IDs
**Error:** Frontend sends `undefined` or `null` as serviceId
**Fix:** Backend needs to ensure all services have proper ID fields

## Debug Steps

1. **Check backend logs** when you submit the form
   - Look for the actual error in backend console
   - Check database query errors

2. **Verify service structure** from API:
   ```bash
   curl http://10.20.248.6:5000/api/institutions?locale=en&includeServices=true | json_pp
   ```
   
   Each service should have:
   ```json
   {
     "id": "uuid-here",
     "name": "Service Name",
     "title": "Service Title"
   }
   ```

3. **Check if services are properly associated** with institutions in database

4. **Verify VIP tickets table** exists and has correct schema:
   ```sql
   -- Expected columns
   id, reference, citizen_name, citizen_phone, service_id, purpose, status, vip_fee, created_at
   ```

## Temporary Workaround

If backend is not ready, you can temporarily mock the VIP application creation in the frontend for testing the UI flow:

```javascript
// In VIPTicket.jsx handleFormSubmit, temporarily replace with:

// TEMPORARY MOCK - Remove after backend is fixed
const mockResponse = {
  success: true,
  data: {
    reference: `VIP-${Math.random().toString().slice(2, 8)}-${Math.random().toString().slice(2, 6)}`,
    status: 'PENDING',
    citizenName: formData.citizenName,
    maskedPhone: formData.citizenPhone.replace(/(\d{2})(\d+)(\d{4})/, '$1****$3'),
    vipFee: 1000,
    currency: 'ETB',
    isFlatFee: true
  }
};

console.log('MOCK response:', mockResponse);
const reference = mockResponse.data.reference;
setApplicationReference(reference);
setApplicationData(mockResponse.data);
localStorage.setItem('vip_application_reference', reference);

// Skip payment initialization for now
alert(`Mock VIP Application Created!\nReference: ${reference}\n\nBackend integration pending.`);
setIsSubmitting(false);
return;
```

This will let you test the UI flow while backend is being fixed.
