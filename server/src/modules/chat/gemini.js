import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Generate a reply using Gemini AI with automatic model fallback.
 * Tries multiple model versions in order until one succeeds.
 *
 * @param {string} prompt - User's message
 * @param {string} systemPrompt - System prompt with scope restrictions and service context
 * @returns {Promise<string|null>} AI reply or null if all models fail
 */
export async function generateGeminiReply(prompt, systemPrompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️  GEMINI_API_KEY is not set. Chatbot Tier 3 (Gemini) will be unavailable.");
    return null;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ];

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: {
          role: "system",
          parts: [{ text: systemPrompt }],
        },
      });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 350,
          temperature: 0.3,
        },
      });

      const text = result.response.text();
      if (text) return text;
    } catch (err) {
      console.warn(`Gemini model ${modelName} failed:`, err.message || err);
    }
  }

  return null;
}

/**
 * Build a strict, token-efficient system prompt for the MESOB chatbot.
 * Grounds the model in the service context and locale.
 *
 * @param {string} locale - "en" | "am" | "sid"
 * @param {string} serviceContext - Formatted service context string from searchServicesForContext
 * @returns {string} Complete system prompt
 */
export function buildSystemPrompt(locale, serviceContext) {
  const langMap = {
    en: "English",
    am: "Amharic",
    sid: "Sidaamu Afoo (Sidama language)",
  };

  const language = langMap[locale] || "English";

  const standardRefusals = {
    en: "I cannot help you with that. I am only able to assist with inquiries and services related to Hawassa MESOB Center.",
    am: "ይቅርታ፣ በዚህ ጉዳይ ላይ ልረዳዎ አልችልም። እኔ አገልግሎት የምሰጠው ከሀዋሳ መሶብ ማዕከል ጋር በተያያዙ ጉዳዮች እና አገልግሎቶች ላይ ብቻ ነው።",
    sid: "Konnira kaa'lahe didandeemmo. Ane kaa'lo Hawaasa MESOOBE Bayichi agurrote fi xa'mubba callaho.",
  };

  const refusal = standardRefusals[locale] || standardRefusals.en;

  return `You are the official, strictly scoped AI assistant for Hawassa MESOB Center in the Sidama Region, Ethiopia.

CRITICAL SCOPE RESTRICTION:
- You ONLY answer questions directly related to Hawassa MESOB Center, its 13 government institutions, public services (such as Fayda / National ID Card enrollment, TIN issuance, Trade Bureau licenses, Construction Permits, Housing, Revenues, Sidama Bank, Commercial Bank of Ethiopia (CBE), Ethio Telecom, Ethiopost, Immigration/Passport), VIP fast-track tickets, operating hours, fees, requirements, and center location.
- If the user asks about ANYTHING ELSE (including general knowledge like "what is the capital of ethiopia", weather, politics outside MESOB, mathematics, science, sports, coding, cooking, personal advice, etc.):
  YOU MUST STRICTLY REFUSE AND REPLY WITH ONLY THIS EXACT SENTENCE:
  "${refusal}"
- NEVER answer general knowledge questions, even if you know the answer.

RESPONSE RULES:
- Reply ONLY in ${language}.
- Be concise, accurate, and professional.
- Use clean, modern structured Markdown markup:
  * Start with a bold heading or title: **[Service or Institution Name]**
  * Include location: Location: [Counter Desk or Hall]
  * Format prerequisites and requirements as a numbered list:
    Requirements:
    1. [First document or item]
    2. [Second document or item]
  * State the fee clearly: Fee: [Amount in ETB or Free of charge]
  * State processing time clearly: Processing time: [Time / Days]
- Never output walls of plain text. Use line breaks and clear labels.
- Ground your answers in the SERVICE CONTEXT below.

SERVICE CONTEXT:
${serviceContext || "General Hawassa MESOB Center services (Fayda / National ID, TIN number, Trade registrations, Bank services, Construction permits, VIP ticket booking)."}

MESOB CENTER HOURS & LOCATION:
- Location: Hawassa City, Sidama Region, near Municipal Roundabout
- Working Hours: Monday to Friday 8:30 AM – 5:00 PM, Saturday 8:30 AM – 12:30 PM. Closed Sundays and public holidays.`;
}

export default {
  generateGeminiReply,
  buildSystemPrompt,
};
