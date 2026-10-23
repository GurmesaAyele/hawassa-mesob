/**
 * Hawassa MESOB Center - Announcements Data
 * Multilingual Dataset: English (en), Amharic (am), and Sidaamu Afoo (sid).
 * Sourced from official Hawassa MESOB public alerts and operation bulletins.
 */

export const INITIAL_ANNOUNCEMENTS = [
  {
    id: "ann-1",
    title: {
      en: "Extended Operating Hours for National ID (Fayda) Registration",
      am: "ለብሔራዊ መታወቂያ (ፋይዳ) ምዝገባ የተራዘመ የስራ ሰዓት ማስታወቂያ",
      sid: "Daganna Wolooma (Fayda) Borreessate Loosu Yanna Dheerinsate Egensiishsha",
    },
    content: {
      en: "To accommodate employed citizens and students, the Fayda Biometric Registration desk at Hawassa MESOB Center is now open weekdays continuously from 8:00 AM to 6:00 PM without lunchtime interruption.",
      am: "ተቀጣሪ ዜጎችን እና ተማሪዎችን ለማስተናገድ ሲባል በሀዋሳ መሶብ ማዕከል የሚገኘው የፋይዳ ባዮሜትሪክ ምዝገባ ዴስክ በስራ ቀናት ያለ ምሳ ሰዓት እረፍት ከጠዋቱ 2:00 እስከ ምሽቱ 12:00 ሰዓት ድረስ ክፍት ሆኖ አገልግሎት ይሰጣል።",
      sid: "Loosaasine dagoomanna rosaano kaa'late yitanno heddonni, Hawaasa Mesob xonchi giddo noo Fayda woloomu borreessiishshi qara loosu barubba aana hawado qorichu nookkiinni soodo 2:00 sa'aatinni haaro hawado 12:00 geeshsha owaante aanno.",
    },
    date: "2024-05-14T07:30:00.000Z",
    priority: "high",
    type: "update",
  },
  {
    id: "ann-2",
    title: {
      en: "Scheduled System Maintenance on Electronic Payment Gateways",
      am: "በኤሌክትሮኒክ የክፍያ መረቦች ላይ የታቀደ የሲስተም ጥገና ማስታወቂያ",
      sid: "Elektiroonikisete Woxu Baatooshshi Biddiishshi Aana Loosamanno Haaroonsate Egensiishsha",
    },
    content: {
      en: "Routine server maintenance will take place this Sunday between 1:00 AM and 4:00 AM. In-person service transactions at the center will remain fully operational during standard Monday morning working hours.",
      am: "መደበኛ የሰርቨር ማሻሻያ በዚህ እሁድ ሌሊት ከ7:00 እስከ 10:00 ሰዓት ድረስ ይካሄዳል። ሰኞ ጠዋት በማዕከሉ የሚሰጡት ሁሉም በአካል የሚሰጡ የአገልግሎት መስኮቶች በመደበኛ የስራ ሰዓት ሙሉ በሙሉ ክፍት ይሆናሉ።",
      sid: "Seeramu kompiyuterete biddiishshi haaroonsa konni Sambatu huluullo 7:00 sa'aatinni 10:00 sa'aata geeshsha loosamanno. Wocawaanjote soodo Mesob xonchi giddo baalanti dagate owaante garunni dandiitanno.",
    },
    date: "2024-05-16T12:00:00.000Z",
    priority: "medium",
    type: "alert",
  },
  {
    id: "ann-3",
    title: {
      en: "Public Holiday Notice: Center Service Windows Schedule",
      am: "የህዝብ በዓላት ማስታወቂያ፡ የማዕከሉ የአገልግሎት መስኮቶች መርሃ-ግብር",
      sid: "Dagate Ayyaani Egensiishsha: Xonchu Owaantete Biddiishshi Yanna",
    },
    content: {
      en: "Please note that public counter service windows at Hawassa MESOB Center will be closed on official national public holidays. Dedicated 24/7 emergency utility helpdesks remain active.",
      am: "በህጋዊ የብሔራዊ በዓላት ቀናት በሀዋሳ መሶብ ማዕከል የሚገኙ የአገልግሎት መስኮቶች ዝግ እንደሚሆኑ በትህትና እናሳውቃለን። ሆኖም የ24/7 የድንገተኛ ኤሌክትሪክ እና ውሃ ድጋፍ መስመሮች ያለ ማቋረጥ ክፍት ሆነው ይቆያሉ።",
      sid: "Seeru dagate ayyaani barubba aana Hawaasa Mesob xonchi dagate owaante cufantanno daafira balanfe egensiinseemmo. Ikkollana, 24/7 danote elektiriketenna wotonna kaa'lote silke loosu aana heedhanno.",
    },
    date: "2024-05-17T09:00:00.000Z",
    priority: "low",
    type: "event",
  },
  {
    id: "ann-4",
    title: {
      en: "VIP Ticket Online Pre-Booking Available",
      am: "የቪአይፒ (VIP) ፈጣን አገልግሎት ትኬት የኦንላይን ቅድመ-ቦታ ማስያዣ ይፋ ሆነ",
      sid: "VIP Kaa'lote Qara Tikeete Interneetetenni Balanfe Qadha Dandiinanni",
    },
    content: {
      en: "Citizens can now pre-book VIP service window slots directly through the web portal or Telegram chatbot to receive priority expedited processing for passport, origin ID, and investment clearance services.",
      am: "ዜጎች አሁን በድረ-ገጹ ወይም በቴሌግራም ቻትቦት በቀጥታ የቪአይፒ (VIP) ቅድመ-ቀጠሮ በመያዝ ለፓስፖርት፣ ለቢጫ ካርድ እና ለኢንቨስትመንት ፈቃድ ፈጣን እና ቅድሚያ የሚሰጠውን አገልግሎት ማግኘት ይችላሉ።",
      sid: "Dagoomu webisayitetenni woy Telegiraamu borrote xonchinni balanfe VIP qara kiiro adhite paaspoorte, Bicha Kaarde fi investermentete fajjora balaxote owaante muli yannara afi'ra dandiitanno.",
    },
    date: "2024-05-19T10:00:00.000Z",
    priority: "high",
    type: "general",
  },
  {
    id: "ann-5",
    title: {
      en: "Priority Window Dedicated for Seniors, Expectant Mothers, and Persons with Disabilities",
      am: "ለአረጋውያን፣ ለነፍሰ-ጡር እናቶች እና ለአካል ጉዳተኞች የተለየ የቅድሚያ መስኮት ተከፈተ",
      sid: "Geedhaho, Gobbannate fi Bishshu Kaa'lo Hasidhirannoraho Balaxote Xoncho Fanfi",
    },
    content: {
      en: "Hawassa MESOB Center Counter 12 has been designated exclusively as a Priority Service Desk for senior citizens (60+), pregnant mothers, and citizens with disabilities with dedicated accessibility assistance.",
      am: "በሀዋሳ መሶብ ማዕከል መስኮት 12 ዕድሜያቸው ከ60 ዓመት በላይ ለሆኑ አረጋውያን፣ ለነፍሰ-ጡር እናቶች እና ለአካል ጉዳተኞች ብቻ ልዩ የቅድሚያ መስጫ ሆኖ ተመድቧል፤ የተሟላ ድጋፍም ይሰጣል።",
      sid: "Hawaasa Mesob xonchi giddo xoncho 12 60 diro sainoraho, gobbannate fi bishshu kaa'lo hasidhirannoraho calla balaxote owaante aate biddi assinoonni.",
    },
    date: "2024-05-21T08:00:00.000Z",
    priority: "high",
    type: "update",
  },
  {
    id: "ann-6",
    title: {
      en: "Digital Verification Required for Land Titling & Title Deed Transactions",
      am: "ለመሬት ይዞታ ማረጋገጫ እና የባለቤትነት ስም ዝውውር የዲጂታል ማረጋገጫ ግዴታ ሆነ",
      sid: "Baattoote Gashshooti fi Wolooma Daddalatenna Soorrate Digitaalu Buuxo Hasiissanno",
    },
    content: {
      en: "All citizens processing land transfers, lease certifications, and replacement deed documentation at Counter 6 must present an active National ID (Fayda) or Kebele Biometric Card for instant verification.",
      am: "በመስኮት 6 የመሬት ስም ዝውውር፣ የይዞታ ማረጋገጫ እና ምትክ የካርታ ሰነድ የሚጠይቁ ዜጎች በሙሉ ፈጣን ዲጂታል ማረጋገጫ ለማካሄድ የፋይዳ ብሔራዊ መታወቂያ ወይም የቀበሌ ባዮሜትሪክ መታወቂያ ማቅረብ ግዴታ ነው።",
      sid: "Xoncho 6 aana baatto soorrate, liizete buuxonnaho haaro kaarta afi'rate hasidhanno manni baalu muli yannara buuxisiisate Fayda daganna wolooma leellisha noonsa.",
    },
    date: "2024-05-23T11:00:00.000Z",
    priority: "medium",
    type: "alert",
  },
];
