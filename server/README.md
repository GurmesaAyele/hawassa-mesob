# Hawassa MESOB Portal — Chatbot API Integration Guide

> **For frontend developers building the chatbot window UI.**
> Base URL on the local development network: `http://10.20.254.64:5000`

---

## Table of Contents

1. [Overview](#overview)
2. [Endpoint Reference](#endpoint-reference)
3. [Request Specification](#request-specification)
4. [Response Specification](#response-specification)
5. [Response Tiers Explained](#response-tiers-explained)
6. [Localization (Multilingual Support)](#localization-multilingual-support)
7. [Error Handling & Validation Errors](#error-handling--validation-errors)
8. [Rate Limiting](#rate-limiting)
9. [Complete Code Examples](#complete-code-examples)
10. [Rendering Best Practices](#rendering-best-practices)
11. [Health Check](#health-check)
12. [Frequently Asked Questions](#frequently-asked-questions)

---

## Overview

The MESOB Chatbot API is an intelligent, trilingual backend service that answers citizen questions about Hawassa MESOB Center services — including Fayda National ID enrollment, TIN numbers, trade licenses, construction permits, banking, and more.

It uses a **3-tier response architecture**:

| Tier | Source | When Used | Speed |
|------|--------|-----------|-------|
| **Tier 2** | Static FAQ lookup (DB + cache) | Simple routine questions | < 50ms |
| **Tier 3** | Gemini AI (Google) | Nuanced, conditional, situational questions | 3–12s |
| **Fallback** | Hardcoded safety reply | When all services fail | Instant |

---

## Endpoint Reference

### Chat Message

```
POST http://10.20.254.64:5000/api/chat
```

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **URL** | `http://10.20.254.64:5000/api/chat` |
| **Content-Type** | `application/json` |
| **Authentication** | None (public endpoint) |
| **Max Body Size** | 100 KB |

---

## Request Specification

### Request Body

Send a JSON object with the following fields:

```json
{
  "message": "string",
  "locale": "string",
  "sessionId": "string"
}
```

### Field Details

| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| `message` | `string` | ✅ Yes | The user's chat message | Non-empty after trimming; max **500 characters** |
| `locale` | `string` | ❌ No (defaults to `"en"`) | Language for the response | Only `"en"`, `"am"`, or `"sid"` |
| `sessionId` | `string` | ❌ No | Optional session tracking identifier | Must be a valid **UUID v1–v5** if provided |

### Locale Values

| Value | Language |
|-------|----------|
| `"en"` | English (default) |
| `"am"` | Amharic (አማርኛ) |
| `"sid"` | Sidaamu Afoo (Sidama) |

> **Important:** Sending any locale value other than `"en"`, `"am"`, or `"sid"` returns a `400 Bad Request`. Validate the locale on the client before sending — do not assume an invalid value will default silently.

---

## Response Specification

### Success Response — `200 OK`

All successful chat responses return HTTP `200` with the following JSON body:

```json
{
  "reply": "string",
  "tier": "number | string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `reply` | `string` | The chatbot answer in the requested language. May contain **Markdown** (bold text, numbered lists, emojis). |
| `tier` | `number or string` | Which tier served the response. See section below. |

### Example Success Response

```json
{
  "reply": "**Hawassa MESOB Center Operating Schedule**\n\n1. Monday – Friday: 8:30 AM – 5:00 PM\n2. Saturday: 8:30 AM – 12:30 PM\n3. Sunday & Public Holidays: Closed\n\nPhone: +251 46 220 1100",
  "tier": 2
}
```

---

## Response Tiers Explained

Use the `tier` field to adapt your UI:

| `tier` value | Type | Meaning | UI Recommendation |
|-------------|------|---------|-------------------|
| `2` | number | Instant FAQ answer from the database | Display immediately; no loading indicator needed |
| `3` | number | AI-generated response from Gemini | Show a typing indicator while waiting (3–12 seconds) |
| `"scope-guard"` | string | Off-topic question blocked at the scope gate | Show the reply — no special treatment needed |
| `"scope-refusal"` | string | Question outside MESOB scope | Show the reply as a polite refusal |
| `"context-fallback"` | string | AI unavailable; returning raw service data | Display the structured data in `reply` |
| `"fallback"` | string | All services failed; hardcoded safe reply | Show reply with an optional offline notice |
| `"rate-limit"` | string | Rate limit exceeded (HTTP 429) | Show a "please wait" message |

---

## Localization (Multilingual Support)

The chatbot is fully trilingual. The `locale` field controls the language of `reply`. Always pass the locale that matches the user's selected language in the UI.

```json
{ "message": "What documents do I need for Fayda ID?", "locale": "en" }
{ "message": "ለፋይዳ መታወቂያ ምን ሰነዶች ያስፈልጋሉ?",          "locale": "am" }
{ "message": "Fayda wolooma afidhanno gara hiittoonniiti?", "locale": "sid" }
```

---

## Error Handling & Validation Errors

All validation errors return `400 Bad Request` with a JSON body:

```json
{
  "reply": "Human-friendly message for optional UI display",
  "error": "Technical error description for debugging"
}
```

### Validation Error Reference

| Scenario | HTTP Status | `error` value |
|----------|-------------|---------------|
| Body is not a JSON object (e.g. array, null) | `400` | `"Malformed or non-object request body."` |
| `message` field is missing | `400` | `"Message must be a string."` |
| `message` is empty or whitespace only | `400` | `"Message cannot be empty or whitespace-only."` |
| `message` exceeds 500 characters | `400` | `"Message exceeds 500 characters."` |
| `locale` is not `"en"`, `"am"`, or `"sid"` | `400` | `"Unsupported locale specified."` |
| `sessionId` is present but not a valid UUID | `400` | `"Invalid sessionId format."` |
| JSON body is malformed / unparseable | `400` | `"Invalid JSON payload"` |
| Rate limit exceeded | `429` | `"Too many requests. Rate limit exceeded."` |
| Unexpected server error | `500` | `"Internal server error"` |

### Recommended Client-Side Error Handler

```javascript
async function sendChatMessage(message, locale = "en") {
  try {
    const response = await fetch("http://10.20.254.64:5000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, locale }),
    });

    if (response.status === 429) {
      return { reply: "Too many messages. Please wait a moment.", tier: "rate-limit" };
    }

    if (!response.ok) {
      const errData = await response.json();
      return { reply: errData.reply || "Something went wrong. Please try again.", tier: "error" };
    }

    return await response.json(); // { reply, tier }
  } catch {
    return { reply: "Could not connect to the MESOB service. Check your connection.", tier: "offline" };
  }
}
```

---

## Rate Limiting

| Limit | Value |
|-------|-------|
| **Max requests** | 30 per minute per IP address |
| **Window** | 60 seconds (rolling) |
| **HTTP Status when exceeded** | `429 Too Many Requests` |

### Rate Limit Headers (on every response)

| Header | Description |
|--------|-------------|
| `RateLimit-Limit` | Max allowed requests in the window |
| `RateLimit-Remaining` | Remaining requests before limit is hit |
| `RateLimit-Reset` | Seconds until the window resets |

```javascript
const response = await fetch("http://10.20.254.64:5000/api/chat", { ... });

const remaining = parseInt(response.headers.get("ratelimit-remaining"), 10);
const resetIn   = response.headers.get("ratelimit-reset");

if (remaining <= 3) {
  showWarning(`${remaining} messages left — resets in ${resetIn}s.`);
}
```

---

## Complete Code Examples

### Vanilla JavaScript / Fetch

```javascript
const CHAT_URL = "http://10.20.254.64:5000/api/chat";

async function sendMessageToMESOB(message, locale = "en", sessionId = null) {
  if (!message.trim() || message.length > 500) {
    throw new Error("Message must be between 1 and 500 characters.");
  }

  const payload = { message: message.trim(), locale };
  if (sessionId) payload.sessionId = sessionId;

  const response = await fetch(CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.reply || "Request failed");

  return data; // { reply: string, tier: number | string }
}

// Usage
const { reply, tier } = await sendMessageToMESOB("What is the fee for a trade license?", "en");
console.log(reply);
```

---

### React Hook

```jsx
import { useState } from "react";

const CHAT_URL = "http://10.20.254.64:5000/api/chat";

export function useChatbot(locale = "en") {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]   = useState(null);

  async function sendMessage(userText) {
    const text = userText.trim();
    if (!text || text.length > 500) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, locale }),
      });

      if (res.status === 429) throw new Error("Too many messages. Please wait a moment.");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.reply || "Something went wrong.");
      }

      const { reply, tier } = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: reply, tier }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return { messages, isLoading, error, sendMessage };
}
```

#### Chat Window Component

```jsx
import ReactMarkdown from "react-markdown";
import { useChatbot } from "./useChatbot";

export function ChatWindow({ locale = "en" }) {
  const [input, setInput] = useState("");
  const { messages, isLoading, error, sendMessage } = useChatbot(locale);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="chat-window">
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`bubble ${msg.role}`}>
            <ReactMarkdown>{msg.text}</ReactMarkdown>
          </div>
        ))}

        {/* Show typing indicator only for AI (tier 3) responses */}
        {isLoading && <div className="bubble assistant typing"><span/><span/><span/></div>}
        {error     && <div className="error-banner">{error}</div>}
      </div>

      <form onSubmit={handleSubmit} className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about MESOB Center services..."
          maxLength={500}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
```

---

### Axios

```javascript
import axios from "axios";

const chatAPI = axios.create({
  baseURL: "http://10.20.254.64:5000",
  headers: { "Content-Type": "application/json" },
  timeout: 15000, // 15 seconds — accounts for Gemini AI response time
});

export async function askChatbot(message, locale = "en") {
  const { data } = await chatAPI.post("/api/chat", { message: message.trim(), locale });
  return data; // { reply, tier }
}
```

---

## Rendering Best Practices

### Render `reply` as Markdown — Not Plain Text

AI and FAQ answers use Markdown formatting:

- `**bold text**` — service and institution names
- Numbered lists (`1.`, `2.`, `3.`) — procedural steps and document requirements
- Emojis (`🏢`, `📍`, `📋`, `💵`, `⏱️`) — section icons in structured service cards

| Framework | Recommended Library |
|-----------|---------------------|
| React | `react-markdown` |
| Vue | `vue-markdown-render` |
| Vanilla JS | `marked.js` |

```jsx
import ReactMarkdown from "react-markdown";
<ReactMarkdown>{reply}</ReactMarkdown>
```

### Typing Indicator

Only show a typing/loading animation when waiting for `tier === 3` (Gemini AI) responses.  
`tier === 2` FAQ responses arrive in under 50ms and should appear instantly — no animation needed.

### Quick-Reply Suggestion Buttons

```javascript
const SUGGESTIONS = {
  en: [
    "What are the working hours?",
    "How do I register for Fayda ID?",
    "Where is MESOB Center located?",
    "How much does a trade license cost?",
    "Book a VIP fast-track ticket",
  ],
  am: [
    "የስራ ሰዓቱ ምን ያህል ነው?",
    "ፋይዳ መታወቂያ እንዴት ይመዘገባሉ?",
    "የቲን ቁጥር ለማግኘት ምን ያስፈልጋል?",
  ],
  sid: [
    "Loosu sa'ate hiittoonniiti?",
    "Fayda wolooma hiitto borreessammo?",
    "TIN kiiro afidhanno hiitto?",
  ],
};
```

---

## Health Check

Check whether the server is reachable before mounting the chat widget:

```
GET http://10.20.254.64:5000/api/health
```

**Response:**

```json
{
  "status": "ok",
  "service": "mesob-hawassa-api",
  "timestamp": "2026-10-16T06:45:00.000Z"
}
```

```javascript
async function checkAPIHealth() {
  try {
    const res = await fetch("http://10.20.254.64:5000/api/health", {
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json();
    return data.status === "ok";
  } catch {
    return false;
  }
}

const isOnline = await checkAPIHealth();
if (isOnline) mountChatWidget();
else showOfflineMessage("Chatbot temporarily unavailable. Please try again later.");
```

---

## Frequently Asked Questions

**Q: Do I need an API key or token?**  
No. `/api/chat` is a public endpoint requiring no authentication header.

---

**Q: How do I handle the AI wait time?**  
Check `tier` in the response. If `tier === 3`, show a typing indicator before sending and hide it when the response arrives. `tier === 2` FAQ responses appear in under 50ms — no indicator needed.

---

**Q: Can I send Amharic text with `locale: "en"`?**  
Yes. The `locale` controls the *response language*, not the input language. The AI understands Amharic, Sidaamu Afoo, and English and will reply in whichever locale you specify.

---

**Q: What if the Gemini AI backend is down?**  
The server falls back automatically to a static service context reply (`tier: "context-fallback"`) or polite scope refusal (`tier: "scope-refusal"`). The `reply` field always contains a safe, displayable string.

---

**Q: I'm getting a CORS error. What do I do?**  
Ask the backend developer to add your frontend origin to the `CORS_ORIGIN` environment variable:

```
CORS_ORIGIN=http://10.20.254.64:5173,http://localhost:5173
```

Private LAN origins (`http://10.x.x.x:...`, `http://192.168.x.x:...`) are already allowed automatically during development.

---

**Q: Can I test from the browser console?**  
Yes, on any LAN-connected device:

```javascript
fetch("http://10.20.254.64:5000/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: "What are the working hours?", locale: "en" }),
}).then(r => r.json()).then(console.log);
```

---

*Last updated: October 2026 · Branch: `chatbot-integration`*
