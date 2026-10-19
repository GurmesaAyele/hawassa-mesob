import { PrismaClient } from "@prisma/client";
import { HAWASSA_INSTITUTIONS } from "../src/data/hawassa-data.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Hawassa MESOB Center database seed...");

  // 1. Clean existing chatbot-related records
  await prisma.service.deleteMany();
  await prisma.serviceProvider.deleteMany();
  await prisma.chatbotFAQ.deleteMany();

  // 2. Seed Hawassa Institutions and their Services
  for (const inst of HAWASSA_INSTITUTIONS) {
    await prisma.serviceProvider.create({
      data: {
        id: inst.id,
        code: inst.code,
        name: inst.name,
        icon: inst.logoUrl,
        floorRoomNumber: inst.floorRoomNumber || null,
        contactPhone: inst.contactPhone || null,
        services: {
          create: inst.services.map((s) => ({
            id: s.id,
            title: s.title,
            description: s.description || {
              en: `Official government service provided at Hawassa MESOB Center for ${inst.name.en}.`,
              am: `በሀዋሳ መሶብ ማዕከል በ${inst.name.am} የሚሰጥ ይፋዊ የመንግስት አገልግሎት።`,
              sid: `Hawaasa MESOOBE Bayicho ${inst.name.sid} uyitanno seeramu agurrote.`,
            },
            requirements: s.requirements.map((r) => r.requirement || r),
            estimatedFee: s.estimatedFee,
            processingDays: s.processingDays,
          })),
        },
      },
    });
  }

  console.log(`✅ Seeded ${HAWASSA_INSTITUTIONS.length} authentic Hawassa institutions & services.`);

  // 3. Seed Chatbot FAQs
  await prisma.chatbotFAQ.createMany({
    data: [
      {
        category: "schedule",
        question: {
          en: "What are the working hours of Hawassa MESOB Center?",
          am: "የሀዋሳ መሶብ ማዕከል የስራ ሰዓት ስንት ነው?",
          sid: "Hawaasa MESOOBE Bayichi loosu sa'ate me'eho?",
        },
        answer: {
          en: "Hawassa MESOB Center is open Monday through Friday from 8:30 AM to 5:00 PM, and Saturdays from 8:30 AM to 12:30 PM. Closed on Sundays.",
          am: "የሀዋሳ መሶብ ማዕከል ከሰኞ እስከ ዓርብ ከጠዋቱ 2:30 እስከ 11:00 እንዲሁም ቅዳሜ ከጠዋቱ 2:30 እስከ 6:30 ክፍት ነው።",
          sid: "Hawaasa MESOOBE Bayichi Saniyo'nni Arba'ra geeshsha soodho 2:30 sa'ate'nni hawari 11:00 geeshsha, Qidaame 2:30 - 6:30 geeshsha fa'ninoho.",
        },
        quickButtonLabel: {
          en: "Working Hours",
          am: "የስራ ሰዓት",
          sid: "Loosu Sa'ate",
        },
        isActive: true,
      },
      {
        category: "location",
        question: {
          en: "Where is Hawassa MESOB Center located?",
          am: "የሀዋሳ መሶብ ማዕከል የት ይገኛል?",
          sid: "Hawaasa MESOOBE Bayichi hiikko no?",
        },
        answer: {
          en: "Hawassa MESOB Center is located in Hawassa City, Sidama Region, near the central Municipal Roundabout and City Administration Complex.\n\nPhone: +251 46 220 1100\nEmail: info@mesobhawassa.gov.et",
          am: "የሀዋሳ መሶብ ማዕከል በሀዋሳ ከተማ ማዘጋጃ ቤት አደባባይ አጠገብ፣ በዋናው የአስተዳደር ህንፃዎች ዞን ይገኛል።\n\nስልክ: +251 46 220 1100\nኢሜይል: info@mesobhawassa.gov.et",
          sid: "Hawaasa MESOOBE Bayichi Ofollote Bayicho Hawaasa Katama, Katamu Biiro roond-abaawtete mule afamanno.\n\nBilbila: +251 46 220 1100\nE-pposte: info@mesobhawassa.gov.et",
        },
        quickButtonLabel: {
          en: "Location",
          am: "አድራሻ",
          sid: "Bayicho",
        },
        isActive: true,
      },
      {
        category: "service",
        question: {
          en: "How do I get a Fayda National ID?",
          am: "ፋይዳ ብሔራዊ መታወቂያ እንዴት ማግኘት እችላለሁ?",
          sid: "Fayda wolooma hiikki afi'reemmo?",
        },
        answer: {
          en: "**National ID (Fayda) Enrollment**\nLocation: Hawassa MESOB Center, Counters 3 & 4 (Biometric Desk)\n\nRequirements:\n1. Valid Kebele Resident ID or Passport / Birth Certificate\n2. In-person biometric capture (digital photo, fingerprints, and iris scan)\n3. Active mobile phone number for OTP verification\n\nFee: Free of charge (100% Free)\nProcessing time: 15–20 minutes (Digital ID number delivered immediately via SMS)",
          am: "**የብሔራዊ ዲጂታል መታወቂያ (ፋይዳ) ምዝገባ**\nአድራሻ: የሀዋሳ መሶብ ማዕከል፣ መስኮት 3 እና 4 (የባዮሜትሪክስ ክፍል)\n\nየሚያስፈልጉት:\n1. የታደሰ የቀበሌ መታወቂያ ወይም ፓስፖርት / የልደት ምስክር ወረቀት\n2. በአካል በመገኘት የጣት አሻራ፣ የፊት ፎቶ እና የአይን ባዮሜትሪክስ መስጠት\n3. ንቁ የስልክ ቁጥር ለኤስኤምኤስ ማረጋገጫ\n\nክፍያ: ሙሉ በሙሉ ነፃ (0 ብር)\nየሚፈጅበት ጊዜ: ከ 15-20 ደቂቃ",
          sid: "**Daganna Fayda Wolooma Borreessiro**\nBayicho: Hawaasa MESOOBE Bayicho, Masqoote 3 fi 4\n\nHasiissannori:\n1. Qabaleete wolooma woy Paaspoorte/Ilote wolooma\n2. Umikki daate aanoho agadha\n3. Hasiissanno bilbila\n\nWaaga: Baatooshshu nookkiha (100% Free)\nYanna: 15–20 daqiiqa",
        },
        quickButtonLabel: {
          en: "Fayda / National ID",
          am: "ፋይዳ መታወቂያ",
          sid: "Fayda Wolooma",
        },
        isActive: true,
      },
    ],
  });

  console.log("✅ Seeded Chatbot FAQs.");
  console.log("🎉 Seed finished successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
