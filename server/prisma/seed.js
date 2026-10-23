import { PrismaClient } from "@prisma/client";
import { HAWASSA_INSTITUTIONS } from "../src/data/hawassa-data.js";
import { INITIAL_VIDEOS } from "../src/modules/videos/videos.data.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Hawassa MESOB Center database seed...");

  // 1. Clean existing records
  await prisma.service.deleteMany();
  await prisma.serviceProvider.deleteMany();
  await prisma.chatbotFAQ.deleteMany();
  await prisma.video.deleteMany();

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
          en: "**National ID (Fayda) Enrollment**\nLocation: Hawassa MESOB Center (Biometric Enrollment Desk)\n\nRequirements:\n1. Valid Kebele Resident ID or Passport / Birth Certificate / Student ID\n2. In-person biometric capture (digital photo, 10 fingerprints, and iris scan)\n3. Active mobile phone number for OTP verification\n\nFee: 100% Free of charge (0 ETB)\nProcessing time: 8–10 minutes (Digital ID FIN delivered immediately via SMS)",
          am: "**የብሔራዊ ዲጂታል መታወቂያ (ፋይዳ) ምዝገባ**\nአድራሻ: የሀዋሳ መሶብ ማዕከል (የባዮሜትሪክስ ምዝገባ)\n\nየሚያስፈልጉት:\n1. የታደሰ የቀበሌ መታወቂያ ወይም ፓስፖርት / የልደት ምስክር ወረቀት / የተማሪ መታወቂያ\n2. በአካል በመገኘት የጣት አሻራ፣ የፊት ፎቶ እና የአይን ባዮሜትሪክስ መስጠት\n3. ንቁ የስልክ ቁጥር ለኤስኤምኤስ ማረጋገጫ\n\nክፍያ: ሙሉ በሙሉ ነፃ (0 ብር)\nየሚፈጅበት ጊዜ: ከ 8–10 ደቂቃ",
          sid: "**Daganna Fayda Wolooma Borreessiro**\nBayicho: Hawaasa MESOOBE Bayicho\n\nHasiissannori:\n1. Qabaleete wolooma woy Paaspoorte / Ilote wolooma\n2. Umikki daate aanoho agadha\n3. Hasiissanno bilbila\n\nWaaga: Baatooshshu nookkiha (100% Free)\nYanna: 8–10 daqiiqa",
        },
        quickButtonLabel: {
          en: "Fayda / National ID",
          am: "ፋይዳ መታወቂያ",
          sid: "Fayda Wolooma",
        },
        isActive: true,
      },
      {
        category: "service",
        question: {
          en: "How can I apply for an Ethiopian Origin ID (Yellow Card)?",
          am: "የትውልደ ኢትዮጵያውያን መታወቂያ (ቢጫ ካርድ) እንዴት ማውጣት እችላለሁ?",
          sid: "Itiyoophiyu dhalote wolooma (Bicha Kaarde) hiikki fushsheemmo?",
        },
        answer: {
          en: "**Ethiopian Origin ID (Yellow Card)**\nProvider: Immigration and Citizenship Service (ICS)\nLocation: Hawassa MESOB Center\n\nKey Requirements:\n1. Completed application form\n2. Ordinary passport valid for more than 6 months\n3. Copy of entry visa & date stamp\n4. Machine-readable Ethiopian passport or authenticated birth certificate\n5. Parents' Ethiopian ID/passport (if parents are Ethiopian citizens)\n6. Recent passport-sized photograph\n\nFee: 300 USD (Regular) / 400 USD (Urgent)\nNote: In-person appearance is mandatory (proxy not permitted). Daily penalty applies for late renewals.",
          am: "**የትውልደ ኢትዮጵያውያን መታወቂያ (ቢጫ ካርድ)**\nአቅራቢ፦ የኢሚግሬሽንና ዜግነት አገልግሎት\nአድራሻ፦ የሀዋሳ መሶብ ማዕከል\n\nዋና ዋና መስፈርቶች፦\n1. የተሞላ የማመልከቻ ቅጽ\n2. ከ6 ወር በላይ የሚያገለግል ህጋዊ ፓስፖርት\n3. የመግቢያ ቪዛ ቅጂ እና የቀን ማህተም\n4. በማሽን የሚነበብ የኢትዮጵያ ፓስፖርት ወይም የተረጋገጠ የልደት ሰርተፍኬት\n5. የወላጆች የኢትዮጵያ መታወቂያ/ፓስፖርት ቅጂ\n6. የቅርብ ጊዜ የፓስፖርት መጠን ፎቶግራፍ\n\nክፍያ፦ 300 USD (መደበኛ) / 400 USD (አጣዳፊ)\nማስታወሻ፦ በአካል መቅረብ ግዴታ ነው (በውክልና አይፈቀድም)። በወቅቱ ካልታደሰ የቀን ቅጣት አለው።",
          sid: "**Itiyoophiyu Dhalote Wolooma Kaarde (Bicha Kaarde)**\nBiiro: Imigreeshiinete fi Lamroomu Agurro\nBayicho: Hawaasa MESOOBE Bayicho\n\nHasiissannori:\n1. Wonshinoha huuccattote borro\n2. 6 aganira sa'e loosasira dandaanno seeramu paaspoorte\n3. E'ote viiza kopppe fi yannate xaphpho\n4. Maashineni nabbabbanno paaspoorte woy ilote wolooma\n5. Annu/Amatu wolooma kopppe\n6. Muli yannara ka'inoha paaspoorte foote\n\nWaaga: 300 USD (Qara) / 400 USD (Daafurrote)\nUmikki daate hasiisanno (riqiwotenni di-uyinanni).",
        },
        quickButtonLabel: {
          en: "Yellow Card / Origin ID",
          am: "ቢጫ ካርድ",
          sid: "Bicha Kaarde",
        },
        isActive: true,
      },
      {
        category: "service",
        question: {
          en: "How do I recharge my prepaid electricity meter?",
          am: "የቅድመ ክፍያ ኤሌክትሪክ ቆጣሪ ካርድ እንዴት መሙላት እችላለሁ?",
          sid: "Balaxe baantanni elektirike kaarde hiikki wonsheemmo?",
        },
        answer: {
          en: "**Electricity Prepaid Recharge**\nProvider: Ethiopian Electric Utility (EEU)\nLocation: Hawassa MESOB Center\n\nRequirement: Prepaid Electricity Recharge Card / Meter Card\nFee: Free of charge (0 ETB)\nProcessing time: 2 minutes (Instant token issuance)",
          am: "**የቅድመ ክፍያ ኤሌክትሪክ ካርድ መሙላት**\nአቅራቢ፦ የኢትዮጵያ ኤሌክትሪክ አገልግሎት\nአድራሻ፦ የሀዋሳ መሶብ ማዕከል\n\nየሚያስፈልገው፦ የቅድመ ክፍያ ኤሌክትሪክ ቆጣሪ ካርድ\nክፍያ፦ ነፃ (0 ብር)\nየሚፈጅበት ጊዜ፦ 2 ደቂቃ (ወዲያውኑ ይሰጣል)",
          sid: "**Balaxe Baantanni Elektirike Kaarde Wonsha**\nBiiro: Itiyoophiyu Elektirike Agurro\nBayicho: Hawaasa MESOOBE Bayicho\n\nHasiissannori: Balaxe baantanni elektirike kaarde\nWaaga: Baatooshshu nookkiha (0 ETB)\nYanna: 2 daqiiqa",
        },
        quickButtonLabel: {
          en: "Electric Recharge",
          am: "ኤሌክትሪክ መሙላት",
          sid: "Elektirike Wonsha",
        },
        isActive: true,
      },
    ],
  });

  console.log("✅ Seeded Chatbot FAQs.");
  
  // 4. Seed Official YouTube Videos
  for (const v of INITIAL_VIDEOS) {
    await prisma.video.create({
      data: {
        id: v.id,
        title: v.title,
        youtubeUrl: v.youtubeUrl,
        embedUrl: v.embedUrl,
        thumbnail: v.thumbnail,
        description: v.description,
        duration: v.duration,
        views: v.views,
        author: v.author,
        category: v.category,
        date: new Date(v.date),
      },
    });
  }

  console.log(`✅ Seeded ${INITIAL_VIDEOS.length} trilingual Hawassa MESOB YouTube videos.`);
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
