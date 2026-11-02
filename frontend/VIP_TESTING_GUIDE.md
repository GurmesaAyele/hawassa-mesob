# VIP Ticket Service - Testing Guide

## 🧪 Quick Start Testing

### Prerequisites
1. ✅ Backend API running at `http://10.20.248.6:5000`
2. ✅ Chapa test account configured
3. ✅ Test institutions and services in database
4. ✅ Frontend dev server running: `npm run dev`

---

## 🎯 Test Scenarios

### Test 1: Complete Happy Path
**Objective:** Test the full flow from selection to payment confirmation

1. **Start the Application**
   ```bash
   cd frontend
   npm run dev
   ```
   Open: `http://localhost:5173`

2. **Click VIP Ticket Button**
   - Location: Bottom-left corner (golden ticket icon)
   - Expected: Full-screen modal opens

3. **Select Institution & Services**
   - Click on any institution to expand
   - Select one or more services
   - Expected: Services highlight in gold (#CB9D2A)
   - Click "Proceed to Application"

4. **Fill Application Form**
   - Enter name: `Test User`
   - Enter phone: `0911223344`
   - Enter purpose: `Testing VIP service`
   - Click "Submit & Pay"

5. **Payment Redirect**
   - Expected: Redirect to Chapa checkout
   - URL should contain: `checkout.chapa.co`

6. **Complete Payment**
   - Choose test payment method
   - Complete payment on Chapa
   - Expected: Redirect back to `/vip/payment/callback`

7. **Payment Verification**
   - Expected: Loading spinner with "Confirming payment..."
   - Poll counter increases every 3 seconds
   - After verification: Success screen appears

8. **Success Screen**
   - Expected to see:
     - ✅ Green checkmark
     - VIP reference number (VIP-XXXXXX-XXXX)
     - Payment amount: 1,000 ETB
     - Check-in instructions

---

### Test 2: Form Validation
**Objective:** Verify input validation works correctly

1. Open VIP Ticket modal
2. Proceed to form without selecting services
   - Expected: Alert "Please select at least one service"

3. Click "Proceed to Application" after selecting services
4. Try to submit empty form
   - Expected: Error message "Full name is required"

5. Enter name: `Test User`
6. Try invalid phone numbers:
   - `123` - Expected: Error "Invalid Ethiopian phone number"
   - `+1234567890` - Expected: Error
   - `abc123` - Expected: Error

7. Enter valid phone: `0911223344`
8. Submit form
   - Expected: Form submits successfully

---

### Test 3: Multi-Service Selection
**Objective:** Test selecting multiple services

1. Open VIP Ticket modal
2. Expand first institution
3. Select 3 services
   - Expected: All 3 highlighted
   - Summary shows "3 service(s) selected"

4. Expand second institution
5. Select 2 more services
   - Expected: Now 5 services selected
   - All highlighted across institutions

6. Click selected service again
   - Expected: Deselects (highlight removed)

7. Proceed to form
   - Expected: All 5 services listed in form

---

### Test 4: Payment Failure & Retry
**Objective:** Test error handling and retry mechanism

1. Complete steps to payment
2. On Chapa page, cancel/fail payment
3. Return to callback page
   - Expected: Error message appears
   - "Retry Payment" button visible

4. Click "Retry Payment"
   - Expected: Redirects to Chapa again
   - Same application reference used

5. Complete payment successfully
   - Expected: Success screen

---

### Test 5: Language Switching
**Objective:** Test multi-language support

1. Open VIP Ticket modal (English)
2. Verify text in English:
   - "VIP Ticket Service"
   - "Fast Track Service - 1,000 ETB"

3. Switch language to Amharic in navbar
4. Reopen VIP modal
   - Expected: Text in Amharic
   - "ቪአይፒ ትኬት አገልግሎት"

5. Switch to Sidama
   - Expected: Text in Sidama
   - "VIP Tiketi Oosate"

6. Test all steps in Amharic
   - Institution selection
   - Form labels
   - Success messages

---

### Test 6: Payment Timeout
**Objective:** Test polling timeout behavior

**Option A: Simulate by stopping backend**
1. Start payment flow
2. While on callback page, stop backend API
3. Wait for 60 seconds
   - Expected: "Timeout" message after 20 polling attempts

**Option B: Use browser dev tools**
1. Open Developer Tools → Network tab
2. Start payment flow
3. On callback page, block `/api/vip-payments/status/*` requests
4. Expected: Timeout message appears

---

### Test 7: Browser Refresh During Payment
**Objective:** Test state persistence

1. Start payment flow
2. After clicking "Submit & Pay"
3. Note the application reference
4. Close/refresh browser before redirect
5. Reopen application
6. Check localStorage:
   ```javascript
   localStorage.getItem('vip_application_reference')
   ```
   - Expected: Reference still stored

7. Manually navigate to callback page
8. Reference should auto-load and poll

---

### Test 8: Already Paid Application
**Objective:** Test duplicate payment prevention

1. Complete full payment flow
2. Save the application reference
3. Try to initialize payment again with same reference
   - Expected: HTTP 409 error
   - Message: "Application already confirmed and paid"
   - Redirect to confirmation page

---

### Test 9: Invalid Phone Numbers
**Objective:** Test Ethiopian phone validation

Test these phone numbers:

| Phone Number | Expected Result |
|--------------|----------------|
| `0911223344` | ✅ Valid |
| `+251911223344` | ✅ Valid |
| `0711223344` | ✅ Valid (starts with 07) |
| `0611223344` | ❌ Invalid (must be 09 or 07) |
| `911223344` | ❌ Invalid (must start with 0 or +251) |
| `+25111223344` | ❌ Invalid (wrong format) |
| `091122334` | ❌ Invalid (too short) |
| `09112233445` | ❌ Invalid (too long) |

---

### Test 10: Mobile Responsiveness
**Objective:** Test on different screen sizes

1. **Desktop (1920x1080)**
   - Modal: 520px width
   - Full-screen on step 1
   - All elements visible

2. **Tablet (768x1024)**
   - Modal: Responsive width
   - Touch-friendly buttons
   - Scrollable content

3. **Mobile (375x667)**
   - Full-width modal
   - Touch targets ≥ 44px
   - No horizontal scroll

Use Chrome DevTools Device Toolbar to test

---

## 🔍 Debug Checklist

### Backend API Health
```bash
# Test institutions endpoint
curl http://10.20.248.6:5000/api/institutions?locale=en

# Test VIP tickets endpoint (should fail without body)
curl -X POST http://10.20.248.6:5000/api/vip-tickets
```

### Browser Console Logs
Look for these console logs:

```javascript
// Step 1: Institution fetch
"Fetching institutions from: http://10.20.248.6:5000/api/institutions?locale=en"
"Institutions API response:" [...]

// Step 2: Application creation
"Creating VIP application:" {...}
"VIP application response:" {...}

// Step 3: Payment initialization
"Initializing payment:" {...}
"Payment initialization response:" {...}
"Redirecting to checkout:" "https://checkout.chapa.co/..."

// Step 4: Payment polling
"Payment status check:" {...}
"Payment still pending, continuing to poll..."
```

### Network Tab Inspection

1. Open DevTools → Network
2. Filter: `XHR` or `Fetch`
3. Look for these requests:

```
GET  /api/institutions?locale=en&includeServices=true
POST /api/vip-tickets
POST /api/vip-payments/initialize
GET  /api/vip-payments/status/:reference (multiple times)
```

### LocalStorage Check

Open Console and run:
```javascript
// Check if reference is saved
localStorage.getItem('vip_application_reference')

// Check language
localStorage.getItem('language')

// Clear if needed
localStorage.clear()
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: Modal Doesn't Open
**Symptoms:** Click VIP button, nothing happens

**Debug:**
```javascript
// Console
console.log('isOpen state:', isOpen)
```

**Fix:**
- Check if VIPTicket component is imported in Home.jsx
- Verify z-index is high enough (should be 50)
- Check for JavaScript errors in console

---

### Issue 2: No Institutions Showing
**Symptoms:** Modal opens but empty or shows "Loading..."

**Debug:**
```bash
# Test backend directly
curl http://10.20.248.6:5000/api/institutions?locale=en

# Check response
```

**Fix:**
- Verify backend is running
- Check CORS settings on backend
- Verify API_BASE_URL in api.js
- Check network tab for errors

---

### Issue 3: Form Validation Not Working
**Symptoms:** Can submit with invalid data

**Debug:**
```javascript
// In VIPTicket.jsx, check validateForm()
console.log('Form errors:', formErrors)
```

**Fix:**
- Verify validateForm() is called before submit
- Check regex pattern for phone validation
- Ensure formErrors state updates

---

### Issue 4: Payment Redirect Fails
**Symptoms:** Form submits but no redirect

**Debug:**
```javascript
// Check response
console.log('Payment response:', result)
console.log('Checkout URL:', result.data.checkoutUrl)
```

**Fix:**
- Verify backend returns checkoutUrl
- Check if window.location.href is being set
- Verify popup blockers aren't interfering

---

### Issue 5: Callback Page Never Confirms
**Symptoms:** Stuck in "Confirming payment..." forever

**Debug:**
```javascript
// Check polling
console.log('Poll attempt:', pollingAttempts)
console.log('Payment status:', paymentStatus)
```

**Fix:**
- Verify backend payment verification is working
- Check Chapa webhook is configured
- Manually verify payment via backend logs
- Check if polling is actually happening (network tab)

---

### Issue 6: 404 on Callback Route
**Symptoms:** Page not found error on /vip/payment/callback

**Fix:**
- Verify route added to App.jsx:
  ```jsx
  <Route path="/vip/payment/callback" element={<VIPPaymentCallback />} />
  ```
- Check import statement
- Clear build and restart dev server

---

## 📊 Performance Testing

### Load Testing
Test with multiple concurrent users:

```bash
# Use Apache Bench (ab)
ab -n 100 -c 10 http://10.20.248.6:5000/api/institutions

# Or use Artillery
artillery quick --count 10 --num 50 http://10.20.248.6:5000/api/institutions
```

### Expected Response Times
- Institution fetch: < 500ms
- Application creation: < 1000ms
- Payment initialization: < 2000ms
- Payment status check: < 500ms

---

## ✅ Final Checklist

Before marking testing as complete:

- [ ] All 10 test scenarios pass
- [ ] Form validation works for all cases
- [ ] Multi-language switching works
- [ ] Payment flow completes successfully
- [ ] Error handling works (failures, timeouts)
- [ ] Mobile responsive on all screen sizes
- [ ] No console errors in any step
- [ ] LocalStorage persistence works
- [ ] Retry mechanism works
- [ ] Success screen displays correctly
- [ ] Reference number is readable and copyable
- [ ] Check-in instructions are clear
- [ ] "Done" button closes modal correctly
- [ ] No memory leaks (check with React DevTools)

---

## 🐛 Report Template

When reporting bugs, use this template:

```markdown
**Bug Title:** [Short description]

**Environment:**
- Browser: Chrome 120.0.0
- OS: Windows 11
- Frontend: localhost:5173
- Backend: 10.20.248.6:5000

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Screenshots:**
[Attach screenshots]

**Console Errors:**
```
[Paste console errors]
```

**Network Logs:**
[Any relevant API errors]

**Additional Notes:**
Any other relevant information
```

---

## 📈 Test Coverage

| Feature | Test Cases | Status |
|---------|-----------|--------|
| Institution Loading | 3 | ✅ |
| Service Selection | 5 | ✅ |
| Form Validation | 8 | ✅ |
| Payment Flow | 6 | ✅ |
| Error Handling | 7 | ✅ |
| Multi-language | 4 | ✅ |
| Responsive Design | 3 | ✅ |
| State Management | 4 | ✅ |

**Total Test Cases:** 40  
**Expected Pass Rate:** 100%

---

**Testing Guide Version:** 1.0  
**Last Updated:** November 2, 2026  
**For Questions:** Contact QA Team
