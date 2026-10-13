import { findFAQAnswer, searchServicesForContext, isOffTopicQuery, SCOPE_REFUSAL_MESSAGES } from "./chatbot-context.js";
import { generateGeminiReply, buildSystemPrompt } from "./gemini.js";

/**
 * POST /api/chat
 *
 * Request body:
 *   { "message": "How do I get a TIN number?", "locale": "en" }
 *
 * Response body:
 *   { "reply": "...", "tier": 2 | 3 | "scope-guard" | "context-fallback" | "scope-refusal" | "fallback" }
 */
export async function handleChatMessage(req, res) {
  try {
    const { message, locale = "en" } = req.body || {};

    // ─── Input Validation ──────────────────────────────────
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        reply: "Please provide a valid message.",
      });
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return res.status(400).json({
        reply: "Please provide a non-empty message.",
      });
    }

    if (trimmedMessage.length > 500) {
      return res.status(400).json({
        reply: "Message is too long. Please keep it under 500 characters.",
      });
    }

    const validLocale = ["en", "am", "sid"].includes(locale) ? locale : "en";

    // ─── TIER 1.5: Off-Topic Scope Guard ─────────────────
    if (isOffTopicQuery(trimmedMessage)) {
      return res.json({
        reply: SCOPE_REFUSAL_MESSAGES[validLocale] || SCOPE_REFUSAL_MESSAGES.en,
        tier: "scope-guard",
      });
    }

    // ─── TIER 2: Instant FAQ Lookup ──────────────────────
    const faqAnswer = await findFAQAnswer(trimmedMessage, validLocale);
    if (faqAnswer) {
      return res.json({ reply: faqAnswer, tier: 2 });
    }

    // ─── TIER 2.5: Service Keyword & Institution Lookup ──
    const serviceContext = await searchServicesForContext(trimmedMessage, validLocale);

    // ─── TIER 3: Gemini AI with Strict Scope Guard ───────
    if (process.env.GEMINI_API_KEY) {
      const systemPrompt = buildSystemPrompt(validLocale, serviceContext);
      const aiReply = await generateGeminiReply(trimmedMessage, systemPrompt);

      if (aiReply) {
        return res.json({ reply: aiReply, tier: 3 });
      }
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
        reply: contextReply[validLocale] || contextReply.en,
        tier: "context-fallback",
      });
    }

    // Scope refusal if query is completely outside Hawassa MESOB scope
    return res.json({
      reply: SCOPE_REFUSAL_MESSAGES[validLocale] || SCOPE_REFUSAL_MESSAGES.en,
      tier: "scope-refusal",
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return res.status(500).json({
      reply: "Hawassa MESOB Center is open Monday to Friday 8:30 AM – 5:00 PM, and Saturday 8:30 AM – 12:30 PM. For urgent inquiries, visit our center near the Municipal Roundabout or call +251 46 220 1100.",
      tier: "fallback",
    });
  }
}

export default { handleChatMessage };
