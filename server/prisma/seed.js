import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Verifying Hawassa MESOB Center online Neon database...");

  const instCount = await prisma.serviceProvider.count();
  const servCount = await prisma.service.count();
  const videoCount = await prisma.video.count();
  const newsCount = await prisma.newsItem.count();
  const annCount = await prisma.announcement.count();
  const mapLocation = await prisma.mapLocation.findFirst();
  const faqCount = await prisma.chatbotFAQ.count();

  console.log(`🏛️ Cloud Database Status:`);
  console.log(`   - Institutions: ${instCount}`);
  console.log(`   - Services: ${servCount}`);
  console.log(`   - Videos: ${videoCount}`);
  console.log(`   - News: ${newsCount}`);
  console.log(`   - Announcements: ${annCount}`);
  console.log(`   - Map Location: ${mapLocation ? "Active" : "None"}`);
  console.log(`   - Chatbot FAQs: ${faqCount}`);

  // Seed FAQs if not yet present
  if (faqCount === 0) {
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
          category: "fayda_age_eligibility",
          question: {
            en: "Can a 1-year-old child register for a Fayda ID? What is the minimum age?",
            am: "የ 1 ዓመት ህፃን ለፋይዳ መታወቂያ መመዝገብ ይችላል? ዝቅተኛው እድሜ ስንት ነው?",
            sid: "Mitte diru qaaqqi Fayda woloomara borreessama dandaanno? Xaphihu diro me'eho?",
          },
          answer: {
            en: "No, a 1-year-old child cannot register for a Fayda ID, as the minimum age for child enrollment is generally 5 years old. Infants and toddlers do not meet the standard age eligibility for individual biometric enrollment. Children can typically be enrolled starting at 5 years of age (accompanied by a parent or legal guardian with the child's birth certificate and parent's ID).\n\nIs there anything else you would like to know?",
            am: "አይ፣ የ1 ዓመት ህፃን ለፋይዳ መታወቂያ መመዝገብ አይችልም፤ ለህፃናት ምዝገባ ዝቅተኛው የእድሜ ገደብ በአጠቃላይ 5 ዓመት ነው። ጨቅላ ህፃናት እና የ1 ዓመት ልጆች ለግል ባዮሜትሪክስ ምዝገባ መስፈርቱን አያሟሉም። ህፃናት ከ5 ዓመት እድሜያቸው ጀምሮ በወላጅ ወይም በአሳዳጊ ታጅበው መመዝገብ ይችላሉ።\n\nሌላ ማወቅ የሚፈልጉት ነገር አለ?",
            sid: "Diiro, mitte diru qaaqqi Fayda woloomara borreessama didandaanno; qaaqqullu borreessirora xaphihu diro roore woyte 5 dirooti. Muli ilantinori fi xoncho qaaqqulle biometrikete borreessirora hasiisanno diri kaima di-wonshitanno. Qaaqqulle 5 diru kaiminni annu woy amate ledo dagganno woyte borreessisi'ra dandiitanno.\n\nWole afa hasidhinanniri no?",
          },
          quickButtonLabel: {
            en: "Fayda Minimum Age",
            am: "የፋይዳ ዝቅተኛ እድሜ",
            sid: "Fayda Diri Kaima",
          },
          isActive: true,
        },
      ],
    });
    console.log("✅ Seeded default Chatbot FAQs.");
  }

  console.log("🎉 Cloud database verified successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Verification error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
