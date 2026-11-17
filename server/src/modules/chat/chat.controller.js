import { findFAQAnswer, searchServicesForContext, isOffTopicQuery, SCOPE_REFUSAL_MESSAGES } from "./chatbot-context.js";
import { generateGeminiReply, buildSystemPrompt } from "./gemini.js";

/**
 * Detect the intended language from the message content and locale preference.
 * - Ethiopic/Ge'ez script range [\u1200-\u137F] is definitively Amharic ('am').
 * - Common Sidaamu Afoo keywords/markers identify Sidama ('sid').
 * - Otherwise falls back to requestedLocale ('en', 'am', 'sid') or 'en'.
 *
 * @param {string} text - User message
 * @param {string} requestedLocale - "en" | "am" | "sid"
 * @returns {"en" | "am" | "sid"} Effective locale code
 */
export function detectLanguage(text, requestedLocale = "en") {
  if (!text || typeof text !== "string") {
    return ["am", "sid", "en"].includes(requestedLocale) ? requestedLocale : "en";
  }

  // 1. Detect Ge'ez / Ethiopic Unicode script range [\u1200-\u137F]
  if (/[\u1200-\u137F]/.test(text)) {
    return "am";
  }

  // 2. Detect common Sidaamu Afoo vocabulary/markers
  const sidamaMarkers = /\b(keero|keer|dagi|daggini|agurro|agurrote|bayicho|xa'ma|xa'mubba|mittu|wole|ayirrado|hasiissanno|dandeemmo|dandiinanni|wolooma|loosanno|loosatenni|baankete|eegeera|kaarde|qusate|woxe|baatooshshu|fantooshshu)\b/i;
  if (sidamaMarkers.test(text)) {
    return "sid";
  }

  // 3. Fallback to valid requested locale, else 'en'
  if (["am", "sid", "en"].includes(requestedLocale)) {
    return requestedLocale;
  }

  return "en";
}

/**
 * POST /api/chat
 *
 * Request body:
 *   { "message": "How do I get a TIN number?", "locale": "en" }
 *
 * Response body:
 *   { "reply": "...", "tier": 2 | 3 | "scope-guard" | "context-fallback" | "scope-refusal" | "fallback", "locale": "en" | "am" | "sid" }
 */
export async function handleChatMessage(req, res) {
  try {
    // ─── Request Body Type Validation ───────────────────────────
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({
        reply: "Invalid request payload. Expected a JSON object.",
        error: "Malformed or non-object request body.",
      });
    }

    const { message, locale, sessionId } = req.body;

    // ─── Message Validation & Sanitization ─────────────────────
    if (typeof message !== "string") {
      return res.status(400).json({
        reply: "Please provide a valid message string.",
        error: "Message must be a string.",
      });
    }

    // Strip unprintable control characters (excluding standard whitespace)
    const sanitizedMessage = message.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();

    if (sanitizedMessage.length === 0) {
      return res.status(400).json({
        reply: "Please provide a non-empty message.",
        error: "Message cannot be empty or whitespace-only.",
      });
    }

    if (sanitizedMessage.length > 500) {
      return res.status(400).json({
        reply: "Message is too long. Please keep it under 500 characters.",
        error: "Message exceeds 500 characters.",
      });
    }

    // ─── Locale Validation (Strict allowlist) ───────────────────
    const ALLOWED_LOCALES = ["en", "am", "sid"];
    let validLocale = "en";

    if (locale !== undefined) {
      if (typeof locale !== "string" || !ALLOWED_LOCALES.includes(locale)) {
        return res.status(400).json({
          reply: "Invalid locale. Supported locales are 'en', 'am', or 'sid'.",
          error: "Unsupported locale specified.",
        });
      }
      validLocale = locale;
    }

    // ─── SessionId Validation (UUID format) ─────────────────────
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (sessionId !== undefined) {
      if (typeof sessionId !== "string" || !UUID_REGEX.test(sessionId)) {
        return res.status(400).json({
          reply: "Invalid sessionId. Expected a valid UUID.",
          error: "Invalid sessionId format.",
        });
      }
    }

    const trimmedMessage = sanitizedMessage;
    // Auto-detect message language (e.g. Ge'ez script -> Amharic, Sidama keywords -> Sidama)
    // Ensures response is always returned in the language the citizen asked in!
    const effectiveLocale = detectLanguage(trimmedMessage, validLocale);

    // ─── TIER 1.5: Off-Topic Scope Guard ─────────────────
    if (isOffTopicQuery(trimmedMessage)) {
      return res.json({
        reply: SCOPE_REFUSAL_MESSAGES[effectiveLocale] || SCOPE_REFUSAL_MESSAGES.en,
        tier: "scope-guard",
        locale: effectiveLocale,
      });
    }

    // ─── TIER 2: Instant FAQ Lookup ──────────────────────
    const faqAnswer = await findFAQAnswer(trimmedMessage, effectiveLocale);
    if (faqAnswer) {
      return res.json({ reply: faqAnswer, tier: 2, locale: effectiveLocale });
    }

    // ─── TIER 2.5: Service Keyword & Institution Lookup ──
    const serviceContext = await searchServicesForContext(trimmedMessage, effectiveLocale);

    // ─── TIER 3: Gemini AI with Strict Scope Guard ───────
    if (process.env.GEMINI_API_KEY) {
      const systemPrompt = buildSystemPrompt(effectiveLocale, serviceContext);
      const aiReply = await generateGeminiReply(trimmedMessage, systemPrompt);

      if (aiReply) {
        return res.json({ reply: aiReply, tier: 3, locale: effectiveLocale });
      }
    }

    // If Gemini was unavailable, timed out, or returned empty, check FAQ safety net
    // (disabling detailed inquiry bypass so common queries like passport, sports, etc. get friendly guidance)
    const safetyNetFaq = await findFAQAnswer(trimmedMessage, effectiveLocale, false);
    if (safetyNetFaq) {
      return res.json({ reply: safetyNetFaq, tier: "faq-safety-net", locale: effectiveLocale });
    }

    // If Gemini was unavailable or returned empty, but we found service context:
    if (serviceContext) {
      const firstSection = serviceContext.split("\n\n---\n\n")[0];
      const contextReply = {
        en: `Here is the relevant service information from Hawassa MESOB Center:\n\n${firstSection}`,
        am: `ከሀዋሳ መሶብ ማዕከል የሚመለከተው የአገልግሎት መረጃ:\n\n${firstSection}`,
        sid: `Hawaasa MESOOBE Bayichi hasiisanno agurrote mashalaqqe:\n\n${firstSection}`,
      };
      return res.json({
        reply: contextReply[effectiveLocale] || contextReply.en,
        tier: "context-fallback",
        locale: effectiveLocale,
      });
    }

    // Scope refusal if query is completely outside Hawassa MESOB scope
    return res.json({
      reply: SCOPE_REFUSAL_MESSAGES[effectiveLocale] || SCOPE_REFUSAL_MESSAGES.en,
      tier: "scope-refusal",
      locale: effectiveLocale,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    const fallbackReplies = {
      en: "Hawassa MESOB Center is open Monday to Friday 8:30 AM – 5:00 PM, and Saturday 8:30 AM – 12:30 PM. For urgent inquiries, visit our center near the Municipal Roundabout or call +251 46 220 1100.",
      am: "የሀዋሳ መሶብ ማዕከል ከሰኞ እስከ አርብ ከጠዋቱ 2:30 እስከ 11:00፣ ቅዳሜ ከጠዋቱ 2:30 እስከ 6:30 ክፍት ነው። ለአስቸኳይ ጥያቄዎች በማዘጋጃ ቤት አደባባይ አጠገብ የሚገኘውን ማዕከላችንን ይጎብኙ ወይም በስልክ ቁጥር +251 46 220 1100 ይደውሉ።",
      sid: "Hawaasa MESOOBE Bayichi Saniyoni – Arba'a sa'ate 2:30 – 11:00, Qidaame sa'ate 2:30 – 6:30 fa'nanno. Hasiissanno xa'mubbara Katamu Biiro roond-abaawtete mule daate woy bilbilunni +251 46 220 1100 xaaddate dandiitinanni.",
    };
    const errLocale = detectLanguage(req.body?.message, req.body?.locale);
    return res.status(500).json({
      reply: fallbackReplies[errLocale] || fallbackReplies.en,
      tier: "fallback",
      locale: errLocale,
    });
  }
}

export default { handleChatMessage, detectLanguage };
