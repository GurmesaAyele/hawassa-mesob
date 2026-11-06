# Send Message API & Client Integration Guide

This guide is for frontend developers implementing or modifying the **Send Message / Contact Us** section on the Home Page.

---

## 1. API Overview

The MESOB backend provides a public endpoint to receive citizen inquiries, feedback, and support messages. Messages submitted through this endpoint are stored in the database and appear directly in the **Super Admin Message Inbox**.

| Property | Details |
| :--- | :--- |
| **Endpoint** | `POST /api/contact` *(alias: `POST /api/contact/submit`)* |
| **Base URL** | `http://localhost:5000` *(or `import.meta.env.VITE_API_BASE_URL`)* |
| **Authentication** | **None** (Public endpoint) |
| **Content-Type** | `application/json` |
| **Rate Limit** | Protected by global IP rate limiter |

---

## 2. Request Specification

### Request Headers
```http
Content-Type: application/json
```

### Request Body Parameters

| Field | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `name` | `string` | **Yes** | Full name of the citizen/sender. Must not be empty. | `"Abebe Bikila"` |
| `email` | `string` | **Yes** | Sender's email address for replies. Must not be empty. | `"abebe@example.com"` |
| `phone` | `string` | No | Sender's phone number. | `"0911223344"` or `"+251911223344"` |
| `message` | `string` | **Yes** | The inquiry or message content. Must not be empty. | `"I need information about business licensing renewal."` |

### Example Request Payload
```json
{
  "name": "Abebe Bikila",
  "email": "abebe.bikila@example.com",
  "phone": "0911223344",
  "message": "Hello, I would like to inquire about the renewal process for a trade license."
}
```

---

## 3. Responses

### 201 Created (Success)
Returned when the message is successfully validated and stored.

```json
{
  "success": true,
  "message": "Thank you for contacting Hawassa MESOB Center. Your message has been received.",
  "data": {
    "id": "msg-1730623456789",
    "name": "Abebe Bikila",
    "email": "abebe.bikila@example.com",
    "phone": "0911223344",
    "message": "Hello, I would like to inquire about the renewal process for a trade license.",
    "isReviewed": false,
    "createdAt": "2026-11-03T08:43:00.000Z"
  }
}
```

### 400 Bad Request (Validation Error)
Returned when a required field (`name`, `email`, or `message`) is missing or blank.

```json
{
  "error": "Validation failed: 'email' is required"
}
```

### 429 Too Many Requests
Returned if the client exceeds the rate limit.

```json
{
  "error": "Too many requests. Please try again later."
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to submit contact message"
}
```

---

## 4. Frontend Implementation

### Step 1: API Service Layer (`src/services/messageApi.js`)
Ensure the service helper in `src/services/messageApi.js` handles requests and network failures cleanly:

```javascript
// src/services/messageApi.js
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");

/**
 * Submit citizen contact message to the MESOB backend.
 * @param {Object} payload
 * @param {string} payload.name - Sender name (required)
 * @param {string} payload.email - Sender email (required)
 * @param {string} [payload.phone] - Sender phone (optional)
 * @param {string} payload.message - Message body (required)
 * @returns {Promise<Object>} Created message data
 */
export async function submitMessage({ name, email, phone, message }) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        phone: phone ? phone.trim() : undefined,
        message: message.trim(),
      }),
    });
  } catch (networkErr) {
    throw new Error("Unable to connect to the server. Please check your internet connection.");
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || `Failed to send message (HTTP ${response.status})`);
  }

  return payload;
}
```

---

### Step 2: Home Page Send Message Section Component

Use this reference component in your Home Page with form state, validation, human verification (CAPTCHA word), loading states, and feedback banners:

```jsx
import React, { useState, useEffect } from 'react';
import { submitMessage } from '../services/messageApi';

const VERIFICATION_WORDS = ['SECURE', 'VERIFY', 'HUMAN', 'ACCESS', 'TRUST', 'SAFETY'];

export default function SendMessageSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    verification: '',
  });

  const [verificationWord, setVerificationWord] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: string }

  // Generate a random CAPTCHA word on mount
  useEffect(() => {
    refreshVerificationWord();
  }, []);

  const refreshVerificationWord = () => {
    const nextWord = VERIFICATION_WORDS[Math.floor(Math.random() * VERIFICATION_WORDS.length)];
    setVerificationWord(nextWord);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    // 1. Client-side CAPTCHA verification
    if (formData.verification.trim().toUpperCase() !== verificationWord) {
      setFeedback({
        type: 'error',
        text: 'Human verification failed. Please type the exact letters shown.',
      });
      return;
    }

    // 2. Client-side input validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setFeedback({
        type: 'error',
        text: 'Please fill in all required fields (Name, Email, Message).',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 3. API Call
      await submitMessage({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
      });

      // 4. Success handling
      setFeedback({
        type: 'success',
        text: 'Thank you! Your message has been sent successfully.',
      });

      // Reset form & generate new CAPTCHA
      setFormData({ name: '', email: '', phone: '', message: '', verification: '' });
      refreshVerificationWord();
    } catch (err) {
      // 5. Error handling
      setFeedback({
        type: 'error',
        text: err.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-16 px-4 bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Send Us a Message
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          Have questions or feedback about Hawassa MESOB services? Reach out to us directly.
        </p>

        {/* Feedback Alert */}
        {feedback && (
          <div
            role={feedback.type === 'error' ? 'alert' : 'status'}
            className={`mb-6 p-4 rounded-xl text-sm font-medium ${
              feedback.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-300'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300'
            }`}
          >
            {feedback.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g. Abebe Bikila"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="e.g. abebe@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Phone Field (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Phone Number <span className="text-xs text-gray-500 font-normal">(Optional)</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. 0911223344"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Message Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Your Message <span className="text-red-500">*</span>
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Write your questions, requests, or feedback here..."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
            />
          </div>

          {/* Human Verification (CAPTCHA) */}
          <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-center mb-2">
              Security Check: Enter the word below
            </span>
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="px-5 py-2 bg-white dark:bg-gray-800 font-mono font-bold tracking-widest text-xl text-gray-800 dark:text-gray-100 rounded-lg shadow-sm">
                {verificationWord}
              </span>
              <button
                type="button"
                onClick={refreshVerificationWord}
                title="Change Word"
                className="p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                ↻
              </button>
            </div>
            <input
              type="text"
              name="verification"
              value={formData.verification}
              onChange={handleChange}
              required
              placeholder="Type the word above"
              className="w-full text-center px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isSubmitting ? 'Sending Message...' : 'Send Message'}
          </button>
        </form>
      </div>
    </section>
  );
}
```

---

## 5. Key Integration Rules & Best Practices

1. **Always Trim Strings**: Call `.trim()` on `name`, `email`, and `message` to prevent sending empty whitespace payloads.
2. **Prevent Duplicate Submissions**: Keep the submit button disabled while `isSubmitting` is `true`.
3. **Environment Variable Configuration**: Ensure the frontend `.env` defines `VITE_API_BASE_URL=http://localhost:5000` (or the production domain) with no trailing slash.
4. **Where Messages Go**: Submissions are automatically recorded and accessible by administrators at `GET /api/contact/messages` and visible in the Admin Dashboard Message Center.

