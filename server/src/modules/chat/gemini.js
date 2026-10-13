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
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.8-flash",
    "gemini-2.5-flash",
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

MESOB SCOPE & SERVICE ELIGIBILITY:
- You ONLY answer questions directly related to Hawassa MESOB Center, its 13 government institutions, and public services (Fayda / National ID Card enrollment, TIN issuance, Trade licenses, Construction Permits, Housing, Revenues, Sidama Bank, CBE Bank, Ethio Telecom, Ethiopost, Immigration, VIP tickets, operating hours, fees, prerequisites, and procedures).
- Questions about eligibility, minimum age requirements, required document alternatives, fees, and steps for MESOB services ARE IN-SCOPE and MUST be answered directly.
- National ID (Fayda) Eligibility & Age Rules:
  * Open to all Ethiopian residents of all ages (including newborns).
  * Biometric capture (iris, digital photo, and fingerprints) applies to individuals aged 5 years and above.
  * Minors (under 18) require an official Birth Certificate and must be accompanied by a parent/guardian with a valid Kebele ID.
  * Adults (18+) require a renewed Kebele ID, Passport, or Birth Certificate.
  * Location: Counters 3 & 4 (Biometric Desk). Initial enrollment is 100% Free.
- If the user asks about ANYTHING completely unrelated to MESOB (general knowledge like "capital of france", weather, politics outside MESOB, mathematics, sports, coding, cooking recipes, personal advice):
  YOU MUST STRICTLY REFUSE AND REPLY WITH ONLY THIS EXACT SENTENCE:
  "${refusal}"

RESPONSE RULES:
- Reply ONLY in ${language}.
- Be concise, accurate, and professional.
- First, DIRECTLY answer the user's specific question (e.g. state the exact age requirement, fee, or specific condition asked).
- Then, format the official center steps and details using clean Markdown:
  * Heading: **[Service or Institution Name]**
  * Location: [Counter Desk or Hall]
  * Requirements: [Numbered list of documents/steps]
  * Fee: [Amount in ETB or Free of charge]
  * Processing time: [Turnaround time]
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
