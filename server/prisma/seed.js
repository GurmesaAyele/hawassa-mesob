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
            en: "**Fayda ID Minimum Age & Child Eligibility**\n\nNo, a 1-year-old child cannot register for a Fayda ID, as the minimum age for child enrollment is generally 5 years old.\n\n**Key Age Guidelines for Fayda ID:**\n1. **Minimum Age:** Children are typically eligible for enrollment starting at 5 years of age (often integrated with school registration requirements).\n2. **Infants and Toddlers:** Infants and 1-year-olds do not meet the standard age eligibility for individual biometric enrollment.\n3. **Child Enrollment (Ages 5–17):** Minors can register in-person at Hawassa MESOB Center accompanied by a parent or legal guardian with the child's official Birth Certificate and the parent's valid Kebele ID or Passport.\n4. **Fee:** 100% Free of charge (0 ETB)\n5. **Processing Time:** 8–10 minutes.",
            am: "**የፋይዳ ዲጂታል መታወቂያ ዝቅተኛ የእድሜ ገደብ እና የህፃናት ምዝገባ**\n\nአይ፣ የ1 ዓመት ህፃን ለፋይዳ መታወቂያ መመዝገብ አይችልም፤ ለህፃናት ምዝገባ ዝቅተኛው የእድሜ ገደብ በአጠቃላይ 5 ዓመት ነው።\n\n**ዋና ዋና የእድሜ መመሪያዎች፦**\n1. **ዝቅተኛ ዕድሜ፦** ህፃናት ከ5 ዓመት እድሜ ጀምሮ ለመመዝገብ ብቁ ናቸው (ብዙውን ጊዜ ከትምህርት ቤት ምዝገባ መስፈርቶች ጋር የተሳሰረ ነው)።\n2. **ጨቅላ ህፃናት እና ታዳጊዎች፦** ጨቅላ ህፃናት እና የ1 ዓመት ልጆች ለግል ባዮሜትሪክስ ምዝገባ መደበኛውን የእድሜ መስፈርት አያሟሉም።\n3. **የህፃናት (5+ ዓመት) ምዝገባ፦** እድሜያቸው 5 ዓመት እና ከዚያ በላይ የሆኑ ህፃናት በሀዋሳ መሶብ ማዕከል ከወላጅ ወይም ህጋዊ አሳዳጊ ጋር በመቅረብ፣ የልደት ሰርተፍኬት እና የወላጅ መታወቂያ ይዘው መመዝገብ ይችላሉ።\n4. **ክፍያ፦** ሙሉ በሙሉ ነፃ (0 ብር)\n5. **የሚፈጅበት ጊዜ፦** ከ 8–10 ደቂቃ።",
            sid: "**Fayda Wolooma Xaphihu Diro fi Qaaqqulle Borreessiro**\n\nDiiro, mitte diru qaaqqi Fayda woloomara borreessama didandaanno; qaaqqullu borreessirora xaphihu diro roore woyte 5 dirooti.\n\n**Qara Diri Biddishsha Fayda Woloomara:**\n1. **Xaphihu Diro:** Qaaqqulle 5 diru kaiminni borreessamate ikkadooti (roore woyte rosu minira borreessamate hasiisanno ledo xaadooshshe afi'rino).\n2. **Muli Ilantinori fi Xoncho Qaaqqulle:** Muli ilantinori fi mitte diru qaaqqulle biometrikete borreessirora hasiisanno diri kaima di-wonshitanno.\n3. **5 Dirinna Sayinori:** 5 dirinna sayino qaaqqulle annu woy amate ledo dagganno woyte, ilote borro fi amatu/annu wolooma ledo Hawaasa MESOOBE Bayicho borreessisi'ra dandiitanno.\n4. **Waaga:** Baatooshshu nookkiha (100% Free)\n5. **Yanna:** 8–10 daqiiqa.",
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
