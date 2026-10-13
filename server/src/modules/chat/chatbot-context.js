import { prisma } from "../../config/db.js";
import { HAWASSA_INSTITUTIONS } from "../../data/hawassa-data.js";

export const FALLBACK_FAQS = [
  {
    keywords: ["hello", "hi", "hey", "greetings", "selam", "ሰላም", "keero", "keer", "morning", "afternoon"],
    answer: {
      en: "Hello! Welcome to the Hawassa MESOB Center Assistant. How can I assist you today? You can ask about our 13 public institutions, services (e.g. Sidama Bank, CBE, TIN number, construction permits, trade licenses), or VIP ticket bookings.",
      am: "ሰላም! ወደ ሀዋሳ መሶብ ማዕከል ረዳት እንኳን ደህና መጡ። ዛሬ እንዴት ልረዳዎ እችላለሁ? ስለ 13ቱ ተቋማት፣ አገልግሎቶች (ለምሳሌ ሲዳማ ባንክ፣ ንግድ ባንክ፣ የቲን ቁጥር፣ የግንባታ ፈቃድ፣ የንግድ ፈቃድ) ወይም ስለ ቪአይፒ ቲኬት መጠየቅ ይችላሉ።",
      sid: "Keero! Hawaasa MESOOBE Bayichi Kaa'laanchoho bagaan daggini. Techo ma garinni kaa'lo'ne? 13 gashshootu biirooti agurrote (lawishshaho Sidaama Baanke, Daldalu Baanke, TIN kiiro, minate eegeera) woy VIP tikkeetete xa'ma dandiitinanni.",
    },
  },
  {
    keywords: ["sidama bank", "bank", "banking", "ሲዳማ ባንክ", "ባንክ", "sidaama baanke", "baanke", "cbe", "commercial bank"],
    answer: {
      en: "**Banking Services (Sidama Bank & CBE)**\nLocation: Hawassa MESOB Center Main Hall, Counters 7 & 8\n\nRequirements:\n1. Valid National ID (Fayda / Kebele Resident ID)\n2. Two passport-size photos for new account opening\n3. Registered mobile phone\n\nFee: Free for account opening\nProcessing time: 10–15 minutes\n\nServices: Account opening, government revenue & fee payments, money transfers, and digital banking.",
      am: "**የባንክ አገልግሎቶች (ሲዳማ ባንክ እና የኢትዮጵያ ንግድ ባንክ)**\nአድራሻ: የሀዋሳ መሶብ ማዕከል ዋና አዳራሽ፣ መስኮት 7 እና 8\n\nየሚያስፈልጉት:\n1. የታደሰ መታወቂያ (ፋይዳ / የቀበሌ መታወቂያ)\n2. ለሂሳብ መክፈቻ 2 ጉርድ ፎቶግራፎች\n3. ንቁ የስልክ ቁጥር\n\nክፍያ: ለሂሳብ መክፈት ነፃ\nየሚፈጅበት ጊዜ: ከ 10-15 ደቂቃ",
      sid: "**Baankete Agurrote (Sidaama Baanke fi CBE)**\nBayicho: Hawaasa MESOOBE Bayichi Waana Huuro, Masqoote 7 fi 8\n\nHasiissannori:\n1. Fayda woy Qabaleete wolooma\n2. Herrego fa'nate 2 suwisa\n3. Bilbila\n\nWaaga: Herrego fa'nate baatooshshu nookkiha\nYanna: 10–15 daqiiqa",
    },
  },
  {
    keywords: ["fayda", "fayida", "national id", "id card", "national identity", "ፋይዳ", "ብሔራዊ መታወቂያ", "መታወቂያ", "wolooma", "dagate wolooma", "fayda wolooma"],
    answer: {
      en: "**National ID (Fayda) Enrollment**\nLocation: Hawassa MESOB Center, Counters 3 & 4 (Biometric Desk)\n\nRequirements:\n1. Valid Kebele Resident ID or Passport / Birth Certificate\n2. In-person biometric capture (digital photo, fingerprints, and iris scan)\n3. Active mobile phone number for OTP verification\n\nFee: Free of charge (100% Free)\nProcessing time: 15–20 minutes (Digital ID number delivered immediately via SMS)",
      am: "**የብሔራዊ ዲጂታል መታወቂያ (ፋይዳ) ምዝገባ**\nአድራሻ: የሀዋሳ መሶብ ማዕከል፣ መስኮት 3 እና 4 (የባዮሜትሪክስ ክፍል)\n\nየሚያስፈልጉት:\n1. የታደሰ የቀበሌ መታወቂያ ወይም ፓስፖርት / የልደት ምስክር ወረቀት\n2. በአካል በመገኘት የጣት አሻራ፣ የፊት ፎቶ እና የአይን ባዮሜትሪክስ መስጠት\n3. ንቁ የስልክ ቁጥር ለኤስኤምኤስ ማረጋገጫ\n\nክፍያ: ሙሉ በሙሉ ነፃ (0 ብር)\nየሚፈጅበት ጊዜ: ከ 15-20 ደቂቃ",
      sid: "**Daganna Fayda Wolooma Borreessiro**\nBayicho: Hawaasa MESOOBE Bayicho, Masqoote 3 fi 4\n\nHasiissannori:\n1. Qabaleete wolooma woy Paaspoorte/Ilote wolooma\n2. Umikki daate aanoho agadha\n3. Hasiissanno bilbila\n\nWaaga: Baatooshshu nookkiha (100% Free)\nYanna: 15–20 daqiiqa",
    },
  },
  {
    keywords: ["hour", "hours", "time", "schedule", "open", "close", "ሰዓት", "ክፍት", "sa'ate", "yanna"],
    answer: {
      en: "**Hawassa MESOB Center Operating Schedule**\nLocation: Municipal Roundabout, Hawassa City\n\nSchedule:\n1. Monday – Friday: 8:30 AM – 5:00 PM\n2. Saturday: 8:30 AM – 12:30 PM\n3. Sunday & Public Holidays: Closed\n\nPhone: +251 46 220 1100",
      am: "**የሀዋሳ መሶብ ማዕከል የስራ ሰዓት**\nአድራሻ: ማዘጋጃ ቤት አደባባይ አጠገብ፣ ሀዋሳ ከተማ\n\nየስራ ቀናት:\n1. ከሰኞ እስከ ዓርብ: ከጠዋቱ 2:30 እስከ 11:00\n2. ቅዳሜ: ከጠዋቱ 2:30 እስከ 6:30\n3. እሁድ እና በበዓላት: ዝግ ነው\n\nስልክ: +251 46 220 1100",
      sid: "**Hawaasa MESOOBE Bayichi Loosu Yanna**\nBayicho: Katamu Biiro roond-abaawtete mule, Hawaasa Katama\n\nLoosu Barra:\n1. Saniyo – Arba'a: 2:30 – 11:00\n2. Qidaame: 2:30 – 6:30\n3. Wodi fi Ayyaanu Barra: Cufaminoho\n\nBilbila: +251 46 220 1100",
    },
  },
  {
    keywords: ["location", "address", "where", "direction", "reach", "አድራሻ", "የት", "bayicho", "doogo"],
    answer: {
      en: "**Hawassa MESOB Center Location**\nLocation: Hawassa City, Sidama Region, near the central Municipal Roundabout and City Administration Complex.\n\nPhone: +251 46 220 1100\nEmail: info@mesobhawassa.gov.et",
      am: "**የሀዋሳ መሶብ ማዕከል አድራሻ**\nአድራሻ: በሀዋሳ ከተማ ማዘጋጃ ቤት አደባባይ አጠገብ፣ በዋናው የአስተዳደር ህንፃዎች ዞን ይገኛል።\n\nስልክ: +251 46 220 1100\nኢሜይል: info@mesobhawassa.gov.et",
      sid: "**Hawaasa MESOOBE Bayichi Ofollote Bayicho**\nBayicho: Hawaasa Katama, Katamu Biiro roond-abaawtete mule afamanno.\n\nBilbila: +251 46 220 1100\nE-pposte: info@mesobhawassa.gov.et",
    },
  },
  {
    keywords: ["vip", "ticket", "fast", "track", "book", "appointment", "ቲኬት", "ቀጠሮ", "tikkeete", "amaddi"],
    answer: {
      en: "**VIP Fast-Track Ticket Booking**\nSkip the waiting queues with an online appointment pass.\n\nBooking Steps:\n1. Click 'VIP Ticket' on the top portal navigation bar\n2. Choose your institutional service\n3. Select your preferred date and 15-minute time slot\n4. Enter your name and phone number to download your verified QR Pass",
      am: "**የቪአይፒ ፈጣን ቲኬት ምዝገባ**\nሰልፍ ሳይጠብቁ በቀጠሮ አገልግሎት ለማግኘት የመስመር ላይ ማለፊያ ይውሰዱ።\n\nየአሰራር ቅደም ተከተል:\n1. በዋናው ገጽ ላይ 'VIP Ticket' የሚለውን ይጫኑ\n2. የሚፈልጉትን የመንግስት አገልግሎት ይምረጡ\n3. አመቺ ቀን እና የ 15 ደቂቃ ሰዓት ይምረጡ\n4. ስምዎን እና ስልክዎን አስገብተው የ QR ማለፊያዎን ያውርዱ",
      sid: "**VIP Tikkeete Amadde Agadha**\nDoogo hadhe seenshu nookkiha agurrote afi'ra dandiinanni.\n\nAmaddate Doogo:\n1. 'VIP Ticket' doogo hadhe\n2. Agurrote doori\n3. Barra fi 15 daqiiqa yanna doori\n4. Su'makki eessi QR koodde afi'ratto",
    },
  },
  {
    keywords: ["contact", "phone", "call", "email", "hotline", "ስልክ", "ኢሜይል", "ደውል", "bilbila", "xaadise"],
    answer: {
      en: "**Contact Hawassa MESOB Center**\nLocation: Municipal Roundabout, Hawassa City\n\nPhone: +251 46 220 1100 / +251 46 220 1101\nEmail: info@mesobhawassa.gov.et",
      am: "**የሀዋሳ መሶብ ማዕከል የእውቂያ አድራሻ**\nአድራሻ: ማዘጋጃ ቤት አደባባይ አጠገብ፣ ሀዋሳ ከተማ\n\nስልክ: +251 46 220 1100 / +251 46 220 1101\nኢሜይል: info@mesobhawassa.gov.et",
      sid: "**Hawaasa MESOOBE Bayicho Xaaddanno Doogo**\nBayicho: Katamu Biiro roond-abaawtete mule\n\nBilbila: +251 46 220 1100 / +251 46 220 1101\nE-pposte: info@mesobhawassa.gov.et",
    },
  },
  {
    keywords: ["tin", "tax", "revenues", "ግብር", "ቲን", "gibira"],
    answer: {
      en: "**Taxpayer TIN Issuance**\nProvider: Hawassa City Revenues Authority\nLocation: Hawassa MESOB Center, Counter 6\n\nRequirements:\n1. Duly filled TIN application form\n2. Valid National ID Card (Fayda / Kebele Resident ID)\n\nFee: Free of charge (0 ETB)\nProcessing time: Same day (Immediate issuance)",
      am: "**የግብር ከፋይ መለያ ቁጥር (ቲን) አሰጣጥ**\nአቅራቢ: የሀዋሳ ከተማ ገቢዎች ቢሮ\nአድራሻ: የሀዋሳ መሶብ ማዕከል፣ መስኮት 6\n\nየሚያስፈልጉት:\n1. የተሞላ የቲን ማመልከቻ ቅጽ\n2. የታደሰ ብሔራዊ መታወቂያ (ፋይዳ / የቀበሌ መታወቂያ)\n\nክፍያ: ነፃ (0 ብር)\nየሚፈጅበት ጊዜ: በዕለቱ (ወዲያውኑ ይሰጣል)",
      sid: "**Gibirshu Badate Kiiro (TIN) Uya**\nBiiro: Hawaasa Katamu Gibiru Biiro\nBayicho: Hawaasa MESOOBE Bayicho, Masqoote 6\n\nHasiissannori:\n1. TIN borro\n2. Fayda woy Qabaleete wolooma\n\nWaaga: Baatooshshu nookkiha (Free)\nYanna: Mittu barri giddo",
    },
  },
];

const OFF_TOPIC_REGEXES = [
  /\bcapital of\b/i,
  /\bpresident of\b/i,
  /\bprime minister of\b/i,
  /\bwho is\b/i,
  /\bweather\b/i,
  /\bjoke\b/i,
  /\bpoem\b/i,
  /\brecipe\b/i,
  /\bhow to cook\b/i,
  /\bwhat is \d+/i,
  /\btranslate to (french|spanish|german|arabic|chinese)\b/i,
  /\bwho won\b/i,
  /\bfootball\b/i,
  /\bsoccer\b/i,
  /\bworld cup\b/i,
  /ዋና ከተማ/,
  /ፕሬዝዳንት/,
  /ጠቅላይ ሚኒስትር/,
  /ቀልድ/,
  /ግጥም/,
  /እግር ኳስ/,
  /የአየር ሁኔታ/,
  /\bwaana katama\b/i,
  /\bgashshaancho\b/i,
];

export function isOffTopicQuery(query) {
  return OFF_TOPIC_REGEXES.some((rx) => rx.test(query));
}

export const SCOPE_REFUSAL_MESSAGES = {
  en: "I cannot help you with that. I am only able to assist with inquiries and services related to Hawassa MESOB Center.",
  am: "ይቅርታ፣ በዚህ ጉዳይ ላይ ልረዳዎ አልችልም። እኔ አገልግሎት የምሰጠው ከሀዋሳ መሶብ ማዕከል ጋር በተያያዙ ጉዳዮች እና አገልግሎቶች ላይ ብቻ ነው።",
  sid: "Konnira kaa'lahe didandeemmo. Ane kaa'lo Hawaasa MESOOBE Bayichi agurrote fi xa'mubba callaho.",
};

export async function findFAQAnswer(query, locale = "en") {
  const lowerQuery = query.toLowerCase().trim();

  try {
    const faqs = await prisma.chatbotFAQ.findMany({
      where: { isActive: true },
    });

    for (const faq of faqs) {
      const question = (faq.question || {})[locale] || "";
      if (
        question.toLowerCase().includes(lowerQuery) ||
        lowerQuery.includes(question.toLowerCase())
      ) {
        const answer = (faq.answer || {})[locale];
        if (answer) return answer;
      }
    }
  } catch (error) {
    console.warn("DB FAQ lookup failed, using static fallback:", error.message);
  }

  for (const faq of FALLBACK_FAQS) {
    const matched = faq.keywords.some((kw) => {
      if (kw.includes(" ")) {
        return lowerQuery.includes(kw);
      }
      const rx = new RegExp(`(^|[^a-zA-Z0-9\u1200-\u137F])${kw}([^a-zA-Z0-9\u1200-\u137F]|$)`, "i");
      return rx.test(lowerQuery);
    });

    if (matched) {
      return faq.answer[locale] || faq.answer.en;
    }
  }

  return null;
}

export async function searchServicesForContext(query, locale = "en") {
  const lowerQuery = query.toLowerCase();

  let services = [];
  try {
    services = await prisma.service.findMany({
      where: { isActive: true },
      include: { provider: true },
    });
  } catch (err) {
    console.warn("DB service lookup failed, using static fallback:", err.message);
  }

  if (services.length === 0) {
    services = HAWASSA_INSTITUTIONS.flatMap((inst) =>
      inst.services.map((s) => ({
        id: s.id,
        title: s.title,
        description: {
          en: `Official government service provided at Hawassa MESOB Center for ${inst.name.en}.`,
          am: `በሀዋሳ መሶብ ማዕከል በ${inst.name.am} የሚሰጥ ይፋዊ የመንግስት አገልግሎት።`,
          sid: `Hawaasa MESOOBE Bayicho ${inst.name.sid} uyitanno seeramu agurrote.`,
        },
        requirements: s.requirements.map((r) => r.requirement),
        estimatedFee: s.estimatedFee,
        processingDays: s.processingDays,
        provider: {
          name: inst.name,
          floorRoomNumber: "Main Hall, Counter 1-15",
        },
      }))
    );
  }

  const scored = services
    .map((service) => {
      let score = 0;
      const title = (service.title || {})[locale] || "";
      const description = (service.description || {})[locale] || "";
      const providerName = (service.provider.name || {})[locale] || "";

      if (title.toLowerCase().includes(lowerQuery) || lowerQuery.includes(title.toLowerCase())) score += 5;
      if (providerName.toLowerCase().includes(lowerQuery) || lowerQuery.includes(providerName.toLowerCase())) score += 5;
      if (description.toLowerCase().includes(lowerQuery)) score += 2;

      const queryWords = lowerQuery.split(/\s+/).filter((w) => w.length >= 3);
      for (const word of queryWords) {
        if (title.toLowerCase().includes(word)) score += 2;
        if (providerName.toLowerCase().includes(word)) score += 3;
        if (description.toLowerCase().includes(word)) score += 1;
      }

      return { service, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (scored.length === 0) return "";

  return scored
    .map(({ service }) => {
      const title = (service.title || {})[locale] || "";
      const desc = (service.description || {})[locale] || "";
      const provider = (service.provider.name || {})[locale] || "";
      const requirements = service.requirements || [];
      const reqList = requirements
        .map((r) => (typeof r === "object" ? r[locale] || "" : r))
        .filter(Boolean)
        .join(", ");

      return `Service: ${title}
Provider: ${provider}
Description: ${desc}
Requirements: ${reqList || "N/A"}
Fee: ${service.estimatedFee ? `${service.estimatedFee} ETB` : "Free"}
Processing: ${service.processingDays ? `${service.processingDays} business days` : "1 business day"}
Floor/Room: ${service.provider.floorRoomNumber || "Main Hall, Service Counter"}`;
    })
    .join("\n\n---\n\n");
}

export default {
  searchServicesForContext,
  findFAQAnswer,
  isOffTopicQuery,
  SCOPE_REFUSAL_MESSAGES,
  FALLBACK_FAQS,
};
