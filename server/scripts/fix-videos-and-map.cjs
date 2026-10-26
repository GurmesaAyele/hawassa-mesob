const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const FULL_VIDEOS = [
  {
    id: "vid-1",
    title: {
      en: "MESOB Center Inauguration Speech",
      am: "የመሶብ ማዕከል የምረቃ ንግግር",
      sid: "Mesob Xonchi Fanoote Ayyaani Xawishsha"
    },
    description: {
      en: "Official keynote speech delivered at the inauguration ceremony of the Hawassa City MESOB Center.",
      am: "በሀዋሳ ከተማ መሶብ ማዕከል የምረቃ ስነ-ስርዓት ላይ የቀረበ ይፋዊ የመክፈቻ ንግግር።",
      sid: "Hawaasa Katamara Mesob xonchi fanoote ayyaana aana shiqino babbaxxino xawishsha."
    },
    category: {
      en: "Inauguration",
      am: "ምረቃ",
      sid: "Fanoote"
    },
    author: {
      en: "MESOB",
      am: "መሶብ",
      sid: "MESOB"
    },
    youtubeUrl: "https://www.youtube.com/watch?v=WGRWiVXvlQY",
    embedUrl: "https://www.youtube.com/embed/WGRWiVXvlQY",
    thumbnail: "https://img.youtube.com/vi/WGRWiVXvlQY/maxresdefault.jpg",
    duration: "15:32",
    views: "1.3M views",
    date: new Date("2024-05-10T10:00:00.000Z")
  },
  {
    id: "vid-2",
    title: {
      en: "MESOB Center Inauguration | Prime Minister Abiy Ahmed",
      am: "የመሶብ ማዕከል ምረቃ | ጠቅላይ ሚኒስትር ዐቢይ አህመድ",
      sid: "Mesob Xonchi Fanoote | Kaimi Ministir Abiy Ahmed"
    },
    description: {
      en: "Prime Minister Abiy Ahmed's address on modernizing public administration at the Hawassa MESOB opening.",
      am: "ጠቅላይ ሚኒስትር ዐቢይ አህመድ የሀዋሳ መሶብ ማዕከል ሲመረቅ የመንግስት አስተዳደርን ስለማዘመን ያደረጉት ንግግር።",
      sid: "Kaimi Ministir Abiy Ahmed Hawaasa Mesob xonchi fanamanna dagate owaante haaromsiro daafira coyi'rino xawishsha."
    },
    category: {
      en: "Inauguration",
      am: "ምረቃ",
      sid: "Fanoote"
    },
    author: {
      en: "MESOB",
      am: "መሶብ",
      sid: "MESOB"
    },
    youtubeUrl: "https://www.youtube.com/watch?v=dXdAxoC4Pcc",
    embedUrl: "https://www.youtube.com/embed/dXdAxoC4Pcc",
    thumbnail: "https://img.youtube.com/vi/dXdAxoC4Pcc/maxresdefault.jpg",
    duration: "8:15",
    views: "87.0K views",
    date: new Date("2024-05-10T11:30:00.000Z")
  },
  {
    id: "vid-3",
    title: {
      en: "MESOB Services | Unified Center Operations Overview",
      am: "የመሶብ አገልግሎቶች | የተቀናጀ የማዕከሉ አሰራር አጠቃላይ እይታ",
      sid: "Mesob Owaante | Mittimmate Xonchi Loosi Xaphooma"
    },
    description: {
      en: "Comprehensive guide to all 24+ operational government services accessible in one location.",
      am: "በአንድ ማዕከል የሚገኙ ከ24 በላይ የመንግስት አገልግሎቶች አጠቃላይ መመሪያ።",
      sid: "Mitto qooxeessira aamanno 24+ aleenni ikkino mangistete owaante xaphooma biddishsha."
    },
    category: {
      en: "Services",
      am: "አገልግሎቶች",
      sid: "Owaante"
    },
    author: {
      en: "MESOB",
      am: "መሶብ",
      sid: "MESOB"
    },
    youtubeUrl: "https://www.youtube.com/watch?v=wjFu-pIMoXw",
    embedUrl: "https://www.youtube.com/embed/wjFu-pIMoXw",
    thumbnail: "https://img.youtube.com/vi/wjFu-pIMoXw/maxresdefault.jpg",
    duration: "12:45",
    views: "221.0K views",
    date: new Date("2024-05-12T09:00:00.000Z")
  },
  {
    id: "vid-4",
    title: {
      en: "MESOB Pilot Program Results & Citizen Feedback",
      am: "የመሶብ የሙከራ ትግበራ ውጤቶች እና የህዝብ አስተያየቶች",
      sid: "Mesob Caccafu Loosi Guma nna Dagate Hedo"
    },
    description: {
      en: "Results and citizen feedback during the initial pilot phase of the Hawassa MESOB Center.",
      am: "የሀዋሳ መሶብ ማዕከል በመጀመሪያው የሙከራ ጊዜ ያስመዘገባቸው ውጤቶች እና የዜጎች አስተያየቶች።",
      sid: "Hawaasa Mesob xonchira umi caccafu yanna giddora afantino gumanna dagate hedo."
    },
    category: {
      en: "Overview",
      am: "አጠቃላይ እይታ",
      sid: "Xaphooma"
    },
    author: {
      en: "MESOB",
      am: "መሶብ",
      sid: "MESOB"
    },
    youtubeUrl: "https://www.youtube.com/watch?v=TM7kuszz7K4",
    embedUrl: "https://www.youtube.com/embed/TM7kuszz7K4",
    thumbnail: "https://img.youtube.com/vi/TM7kuszz7K4/maxresdefault.jpg",
    duration: "6:20",
    views: "113.0K views",
    date: new Date("2024-05-13T14:20:00.000Z")
  },
  {
    id: "vid-5",
    title: {
      en: "What is MESOB | Full MESOB Capability & Vision",
      am: "መሶብ ምንድነው | ሙሉ የመሶብ ብቃት እና ራዕይ",
      sid: "Mesob Mayyaate | Mesob Gudumaale Dandiinna Wolqa"
    },
    description: {
      en: "Explaining the vision and technology backbone of the unified public service center model.",
      am: "የተቀናጀ የህዝብ አገልግሎት ማዕከል ሞዴል ራዕይ እና የቴክኖሎጂ መሰረት ማብራሪያ።",
      sid: "Mitto ikkino dagate owaante xonchi aana noo ajuujanna teknoloojete kaima xawisa."
    },
    category: {
      en: "Explainer",
      am: "ማብራሪያ",
      sid: "Xawishsha"
    },
    author: {
      en: "MESOB",
      am: "መሶብ",
      sid: "MESOB"
    },
    youtubeUrl: "https://www.youtube.com/watch?v=3JnTYAwhol0",
    embedUrl: "https://www.youtube.com/embed/3JnTYAwhol0",
    thumbnail: "https://img.youtube.com/vi/3JnTYAwhol0/maxresdefault.jpg",
    duration: "4:55",
    views: "78.0K views",
    date: new Date("2024-05-14T08:00:00.000Z")
  },
  {
    id: "vid-6",
    title: {
      en: "MESOB Mobile EBC Documentary Stream",
      am: "የመሶብ የኢቢሲ ዶክመንተሪ ልዩ ዘገባ",
      sid: "Mesob EBC Dokimentere Gariiro"
    },
    description: {
      en: "Ethiopian Broadcasting Corporation (EBC) documentary feature covering the Hawassa MESOB Center.",
      am: "የኢትዮጵያ ብሮድካስቲንግ ኮርፖሬሽን (ኢቢሲ) ስለ ሀዋሳ መሶብ ማዕከል ያዘጋጀው ልዩ ዘገባ።",
      sid: "Itoophphu Broodkaasting Korporeeshine (EBC) Hawaasa Mesob xonchi daafira qixxeessino dokimentere."
    },
    category: {
      en: "Documentary",
      am: "ዘጋቢ ፊልም",
      sid: "Dokimentere"
    },
    author: {
      en: "MESOB",
      am: "መሶብ",
      sid: "MESOB"
    },
    youtubeUrl: "https://www.youtube.com/watch?v=bEKtsJp4Jis",
    embedUrl: "https://www.youtube.com/embed/bEKtsJp4Jis",
    thumbnail: "https://img.youtube.com/vi/bEKtsJp4Jis/maxresdefault.jpg",
    duration: "15:30",
    views: "189.0K views",
    date: new Date("2024-05-15T18:00:00.000Z")
  },
  {
    id: "vid-7",
    title: {
      en: "Hawassa MESOB Center Citizen Journey Walk-Through",
      am: "የሀዋሳ መሶብ ማዕከል የዜጎች አገልግሎት ጉዞ ቅኝት",
      sid: "Hawaasa Mesob Xonchira Dagate Owaante Doogo Dawooto"
    },
    description: {
      en: "Step-by-step walkthrough showing citizen reception, ticketing, biometric scan, and instant delivery.",
      am: "የዜጎች አቀባበል፣ ሰልፍ አስተዳደር፣ ባዮሜትሪክ እና ፈጣን አገልግሎት አሰጣጥ ደረጃ በደረጃ እይታ።",
      sid: "Dagate haa'nanni gara, qeeraalu bikkanna biometrike xawisanno doogo."
    },
    category: {
      en: "Walk-Through",
      am: "ቅኝት",
      sid: "Dawooto"
    },
    author: {
      en: "MESOB",
      am: "መሶብ",
      sid: "MESOB"
    },
    youtubeUrl: "https://www.youtube.com/watch?v=qDwlrvp4Ibo",
    embedUrl: "https://www.youtube.com/embed/qDwlrvp4Ibo",
    thumbnail: "https://img.youtube.com/vi/qDwlrvp4Ibo/maxresdefault.jpg",
    duration: "11:15",
    views: "95.4K views",
    date: new Date("2024-05-16T12:00:00.000Z")
  },
  {
    id: "vid-8",
    title: {
      en: "Digital Transformation & One-Stop Services at Hawassa MESOB",
      am: "ዲጂታል ሽግግር እና የአንድ ማዕከል አገልግሎቶች በሀዋሳ መሶብ",
      sid: "Dijitaale Haaromso nna Mittu Qooxeessi Owaante Hawaasa Mesobira"
    },
    description: {
      en: "How digital ID (Fayda), automated queues, and cashless payments eliminate corruption and long queues.",
      am: "ፋይዳ ዲጂታል መታወቂያ፣ ራስ-ሰር ወረፋ እና ያለጥሬ ገንዘብ ክፍያ መዘግየትና ሙስናን እንዴት እንደሚያስቀሩ።",
      sid: "Fayda dijitaale addaxxiro, kuraasu qeeraalu haaromso nna buuxo koraphpho giddonsanni gashshanno gara."
    },
    category: {
      en: "Innovation",
      am: "ፈጠራ",
      sid: "Kalaqo"
    },
    author: {
      en: "MESOB",
      am: "መሶብ",
      sid: "MESOB"
    },
    youtubeUrl: "https://www.youtube.com/watch?v=InTR4CRuKXo",
    embedUrl: "https://www.youtube.com/embed/InTR4CRuKXo",
    thumbnail: "https://img.youtube.com/vi/InTR4CRuKXo/maxresdefault.jpg",
    duration: "9:40",
    views: "64.2K views",
    date: new Date("2024-05-17T15:45:00.000Z")
  }
];

async function main() {
  console.log('--- Cleaning and updating videos in Neon DB ---');
  // Delete existing videos and re-insert valid JSON records
  await prisma.video.deleteMany({});

  for (const v of FULL_VIDEOS) {
    await prisma.video.create({
      data: v,
    });
    console.log(`Saved video: ${v.id}`);
  }

  // Update map location operating hours to match test & in-memory format
  const mapLoc = await prisma.mapLocation.findUnique({
    where: { id: 'default-location' },
  });

  if (mapLoc) {
    const contact = typeof mapLoc.contact === 'object' ? mapLoc.contact : {};
    contact.operatingHours = 'Monday - Friday: 8:00 AM - 6:00 PM';
    await prisma.mapLocation.update({
      where: { id: 'default-location' },
      data: { contact },
    });
    console.log('Updated mapLocation operatingHours');
  }

  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
