import { prisma } from "../../config/db.js";
import { HAWASSA_INSTITUTIONS } from "../../data/hawassa-data.js";

export const FALLBACK_FAQS = [
  {
    keywords: ["hello", "hi", "hey", "greetings", "selam", "ሰላም", "keero", "keer", "morning", "afternoon"],
    answer: {
      en: "Hello! Welcome to the Hawassa MESOB Center Assistant. How can I assist you today? You can ask about our 13 public institutions, services (e.g. Ethiopian Origin ID, Fayda National ID, Trade licenses, Electric recharge, Telebirr, CBE, Sidama Bank, TIN registration, Postal services), or VIP ticket bookings.",
      am: "ሰላም! ወደ ሀዋሳ መሶብ ማዕከል ረዳት እንኳን ደህና መጡ። ዛሬ እንዴት ልረዳዎ እችላለሁ? ስለ 13ቱ ተቋማት፣ አገልግሎቶች (ለምሳሌ የትውልደ ኢትዮጵያውያን መታወቂያ፣ ፋይዳ፣ ንግድ ፈቃድ፣ ኤሌክትሪክ ካርድ፣ ቴሌብር፣ ንግድ ባንክ፣ ሲዳማ ባንክ፣ ቲን ቁጥር) ወይም ስለ ቪአይፒ ቲኬት መጠየቅ ይችላሉ።",
      sid: "Keero! Hawaasa MESOOBE Bayichi Kaa'laanchoho bagaan daggini. Techo ma garinni kaa'lo'ne? 13 gashshootu biirooti agurrote (lawishshaho Itiyoophiyu Dhalote Wolooma, Fayda, Daldalu Eegeera, Elektirike, Telebirre, Baanke, TIN kiiro) woy VIP tikkeetete xa'ma dandiitinanni.",
    },
  },
  {
    keywords: ["origin id", "yellow card", "ethiopian origin", "ቢጫ ካርድ", "የትውልደ ኢትዮጵያውያን መታወቂያ", "bicha kaarde"],
    answer: {
      en: "**Ethiopian Origin ID (Yellow Card)**\nProvider: Immigration and Citizenship Service (ICS)\nLocation: Hawassa MESOB Center\n\nKey Requirements:\n1. Completed application form\n2. Valid ordinary passport (valid > 6 months)\n3. Copy of entry visa & date stamp\n4. Machine-readable Ethiopian passport or authenticated birth certificate\n5. Parents' Ethiopian ID/passport (if parents are Ethiopian citizens)\n6. Recent passport-sized photograph\n\nFee: 300 USD (Regular) / 400 USD (Urgent)\nNote: In-person appearance is mandatory (proxy is not permitted). Daily penalty applies for late renewal.",
      am: "**የትውልደ ኢትዮጵያውያን መታወቂያ (ቢጫ ካርድ)**\nአቅራቢ፦ የኢሚግሬሽንና ዜግነት አገልግሎት\nአድራሻ፦ የሀዋሳ መሶብ ማዕከል\n\nዋና ዋና መስፈርቶች፦\n1. የተሞላ የማመልከቻ ቅጽ\n2. ከ6 ወር በላይ የሚያገለግል ህጋዊ ፓስፖርት\n3. የመግቢያ ቪዛ ቅጂ እና የቀን ማህተም\n4. በማሽን የሚነበብ የኢትዮጵያ ፓስፖርት ወይም የተረጋገጠ የልደት ሰርተፍኬት\n5. የወላጆች የኢትዮጵያ መታወቂያ/ፓስፖርት ቅጂ\n6. የቅርብ ጊዜ የፓስፖርት መጠን ፎቶግራፍ\n\nክፍያ፦ 300 USD (መደበኛ) / 400 USD (አጣዳፊ)\nማስታወሻ፦ በአካል መቅረብ ግዴታ ነው (በውክልና አይፈቀድም)። በወቅቱ ካልታደሰ የቀን ቅጣት አለው።",
      sid: "**Itiyoophiyu Dhalote Wolooma Kaarde (Bicha Kaarde)**\nBiiro: Imigreeshiinete fi Lamroomu Agurro\nBayicho: Hawaasa MESOOBE Bayicho\n\nHasiissannori:\n1. Wonshinoha huuccattote borro\n2. 6 aganira sa'e loosasira dandaanno seeramu paaspoorte\n3. E'ote viiza kopppe fi yannate xaphpho\n4. Maashineni nabbabbanno paaspoorte woy ilote wolooma\n5. Annu/Amatu wolooma kopppe\n6. Muli yannara ka'inoha paaspoorte foote\n\nWaaga: 300 USD (Qara) / 400 USD (Daafurrote)\nUmikki daate hasiisanno (riqiwotenni di-uyinanni).",
    },
  },
  {
    keywords: ["fayda", "fayida", "national id", "id card", "national identity", "ፋይዳ", "ብሔራዊ መታወቂያ", "መታወቂያ", "wolooma", "dagate wolooma", "fayda wolooma"],
    answer: {
      en: "**National ID (Fayda) Enrollment**\nLocation: Hawassa MESOB Center (Biometric Enrollment Desk)\n\nRequirements:\n1. Valid Kebele Resident ID or Passport / Birth Certificate / Student ID / Driving License\n2. In-person biometric capture (digital photo, 10 fingerprints, and iris scan)\n3. Active mobile phone number for OTP verification\n\nFee: 100% Free of charge (0 ETB)\nProcessing time: 8–10 minutes (Digital ID FIN delivered immediately via SMS)",
      am: "**የብሔራዊ ዲጂታል መታወቂያ (ፋይዳ) ምዝገባ**\nአድራሻ: የሀዋሳ መሶብ ማዕከል (የባዮሜትሪክስ ምዝገባ)\n\nየሚያስፈልጉት:\n1. የታደሰ የቀበሌ መታወቂያ / ፓስፖርት / የልደት ምስክር ወረቀት / የተማሪ መታወቂያ / መንጃ ፈቃድ\n2. በአካል በመገኘት የጣት አሻራ፣ የፊት ፎቶ እና የአይን ባዮሜትሪክስ መስጠት\n3. ንቁ የስልክ ቁጥር ለኤስኤምኤስ ማረጋገጫ\n\nክፍያ: ሙሉ በሙሉ ነፃ (0 ብር)\nየሚፈጅበት ጊዜ: ከ 8–10 ደቂቃ",
      sid: "**Daganna Fayda Wolooma Borreessiro**\nBayicho: Hawaasa MESOOBE Bayicho\n\nHasiissannori:\n1. Qabaleete wolooma woy Paaspoorte / Ilote wolooma / Rosu wolooma\n2. Umikki daate aanoho agadha\n3. Hasiissanno bilbila\n\nWaaga: Baatooshshu nookkiha (100% Free)\nYanna: 8–10 daqiiqa",
    },
  },
  {
    keywords: ["electricity", "electric", "power", "eeu", "recharge", "ኤሌክትሪክ", "ቆጣሪ", "መብራት", "elektirike"],
    answer: {
      en: "**Electricity Prepaid Meter Recharge**\nProvider: Ethiopian Electric Utility (EEU)\nLocation: Hawassa MESOB Center\n\nRequirement: Prepaid Electricity Recharge Card / Meter Card\nFee: Free of charge (0 ETB service fee)\nProcessing time: 2 minutes (Instant token issuance)",
      am: "**የቅድመ ክፍያ ኤሌክትሪክ ካርድ መሙላት**\nአቅራቢ፦ የኢትዮጵያ ኤሌክትሪክ አገልግሎት\nአድራሻ፦ የሀዋሳ መሶብ ማዕከል\n\nየሚያስፈልገው፦ የቅድመ ክፍያ ኤሌክትሪክ ቆጣሪ ካርድ\nክፍያ፦ ነፃ (የአገልግሎት ክፍያ የለውም)\nየሚፈጅበት ጊዜ፦ 2 ደቂቃ (ወዲያውኑ ይሰጣል)",
      sid: "**Balaxe Baantanni Elektirike Kaarde Wonsha**\nBiiro: Itiyoophiyu Elektirike Agurro\nBayicho: Hawaasa MESOOBE Bayicho\n\nHasiissannori: Balaxe baantanni elektirike kaarde\nWaaga: Baatooshshu nookkiha (0 ETB)\nYanna: 2 daqiiqa",
    },
  },
  {
    keywords: ["sidama bank", "bank", "banking", "ሲዳማ ባንክ", "ባንክ", "sidaama baanke", "baanke", "cbe", "commercial bank"],
    answer: {
      en: "**Banking Services (Sidama Bank & Commercial Bank of Ethiopia)**\nLocation: Hawassa MESOB Center Main Hall\n\nRequirements:\n1. Valid National ID (Fayda / Renewed Resident ID or Passport)\n2. Passport-size photographs\n3. Active mobile number registered in applicant's name\n4. Initial deposit for account opening\n\nFee: Free for account opening & digital banking setup\nProcessing time: 5–25 minutes",
      am: "**የባንክ አገልግሎቶች (ሲዳማ ባንክ እና የኢትዮጵያ ንግድ ባንክ)**\nአድራሻ: የሀዋሳ መሶብ ማዕከል ዋና አዳራሽ\n\nየሚያስፈልጉት:\n1. የታደሰ መታወቂያ (ፋይዳ / የቀበሌ መታወቂያ ወይም ፓስፖርት)\n2. የፓስፖርት መጠን ፎቶግራፍ\n3. በአመልካች ስም የተመዘገበ ንቁ የስልክ ቁጥር\n4. ለሂሳብ መክፈቻ የመጀመሪያ ተቀማጭ ገንዘብ\n\nክፍያ: ነፃ\nየሚፈጅበት ጊዜ: ከ 5–25 ደቂቃ",
      sid: "**Baankete Agurrote (Sidaamu Baanke fi CBE)**\nBayicho: Hawaasa MESOOBE Bayicho\n\nHasiissannori:\n1. Fayda woy Qabaleete wolooma woy Paaspoorte\n2. Paaspoorte kiiro foote\n3. Loosanno bilbila\n4. Umi qusate woxe\n\nWaaga: Baatooshshu nookkiha (Free)\nYanna: 5–25 daqiiqa",
    },
  },
  {
    keywords: ["tin", "tax", "revenues", "ግብር", "ቲን", "gibira"],
    answer: {
      en: "**Taxpayer TIN Issuance**\nProvider: Hawassa City Revenue Authority\nLocation: Hawassa MESOB Center\n\nRequirements:\n1. Valid National ID / Passport\n2. Business registration certificate (for businesses)\n\nFee: Free of charge (0 ETB)\nProcessing time: 10 minutes",
      am: "**የግብር ከፋይ መለያ ቁጥር (ቲን) አሰጣጥ**\nአቅራቢ: የሀዋሳ ከተማ ገቢዎች ባለስልጣን\nአድራሻ: የሀዋሳ መሶብ ማዕከል\n\nየሚያስፈልጉት:\n1. የታደሰ ብሔራዊ መታወቂያ ወይም ፓስፖርት\n2. የንግድ ምዝገባ ምስክር ወረቀት (ለንግድ ድርጅቶች)\n\nክፍያ: ነፃ (0 ብር)\nየሚፈጅበት ጊዜ: 10 ደቂቃ",
      sid: "**Gibirshu Badate Kiiro (TIN) Uya**\nBiiro: Hawaasa Katamu Gibiru Biiro\nBayicho: Hawaasa MESOOBE Bayicho\n\nHasiissannori:\n1. Daganna Wolooma woy Paaspoorte\n2. Daldalu borreessiro (daldalu diriyeetira)\n\nWaaga: Baatooshshu nookkiha (Free)\nYanna: 10 daqiiqa",
    },
  },
  {
    keywords: ["telebirr", "telecom", "ethio telecom", "ቴሌብር", "ቴሌኮም", "telebirri"],
    answer: {
      en: "**Ethio Telecom & Telebirr Services**\nProvider: Ethio Telecom\nLocation: Hawassa MESOB Center\n\nServices:\n1. Telebirr Service: Registration, tier upgrade, and PIN assistance (Free, 5 min)\n2. Enterprise Service: Enterprise license, TIN, registration paper, official stamp with application letter (Free, 5 min)",
      am: "**የኢትዮ ቴሌኮም እና የቴሌብር አገልግሎቶች**\nአቅራቢ፦ ኢትዮ ቴሌኮም\nአድራሻ፦ የሀዋሳ መሶብ ማዕከል\n\nአገልግሎቶች:\n1. የቴሌብር አገልግሎት፦ ምዝገባ፣ የሂሳብ ደረጃ ማሻሻያ እና የይለፍ ቃል እርዳታ (ነፃ፣ 5 ደቂቃ)\n2. የድርጅት አገልግሎት፦ የድርጅት ፈቃድ፣ TIN፣ የምዝገባ ሰነድ እና ማህተም የተደረገበት ደብዳቤ (ነፃ፣ 5 ደቂቃ)",
      sid: "**Itiyo Telekoome fi Telebirri Agurrote**\nBiiro: Itiyo Telekoome\nBayicho: Hawaasa MESOOBE Bayicho\n\nAgurubba:\n1. Telebirri Agurro: Wolooma ledo borreessa fi pini soorra (Free, 5 daqiiqa)\n2. Diriyeetete Agurro: Diriyeetete eegeera, TIN kakkalooshsha fi maashsha ledo (Free, 5 daqiiqa)",
    },
  },
  {
    keywords: ["trade", "license", "business registration", "ንግድ ፈቃድ", "ንግድ ምዝገባ", "daldalu"],
    answer: {
      en: "**Trade and Market Services**\nProvider: Trade and Market Services\nLocation: Hawassa MESOB Center\n\nServices:\n1. Business Registration: Request, 3x4 Photo, TIN, National ID (102 ETB, 15 min)\n2. License Renewal: Request & Tax Clearance (102 ETB, 15 min)\n3. Registering New Business: Application, 3x4 Photo, TIN, National ID (102 ETB, 15 min)\n4. Giving Business Name: 3 proposed names, 3x4 Photo, TIN, National ID (127 ETB, 20 min)\n5. Verify Names: 3 names, 3x4 Photo, TIN, National ID (27 ETB, 20 min)\n6. Modify License: Application, National ID, 3x4 Photo (82 ETB, 10 min)\n7. Amending Registration: Application, National ID, 3x4 Photo (102 ETB, 15 min)",
      am: "**የንግድና ገበያ አገልግሎት**\nአቅራቢ፦ የንግድና ገበያ መምሪያ\nአድራሻ፦ የሀዋሳ መሶብ ማዕከል\n\nአገልግሎቶች፦\n1. የንግድ ምዝገባ፦ ማመልከቻ፣ 3x4 ፎቶ፣ TIN፣ ብሔራዊ መታወቂያ (102 ብር፣ 15 ደቂቃ)\n2. የንግድ ፈቃድ ማደስ፦ ማመልከቻ እና የታክስ ክሊራንስ (102 ብር፣ 15 ደቂቃ)\n3. አዲስ ንግድ ምዝገባ፦ ማመልከቻ፣ 3x4 ፎቶ፣ TIN፣ መታወቂያ (102 ብር፣ 15 ደቂቃ)\n4. የንግድ ስም ማውጣት፦ 3 አማራጭ ስሞች፣ 3x4 ፎቶ፣ TIN፣ መታወቂያ (127 ብር፣ 20 ደቂቃ)\n5. ስም ማረጋገጥ፦ 3 አማራጭ ስሞች፣ ፎቶ፣ TIN፣ መታወቂያ (27 ብር፣ 20 ደቂቃ)\n6. የንግድ ፈቃድ ማሻሻል፦ ማመልከቻ፣ መታወቂያ፣ ፎቶ (82 ብር፣ 10 ደቂቃ)\n7. የንግድ ምዝገባ ማሻሻያ፦ ማመልከቻ፣ መታወቂያ፣ ፎቶ (102 ብር፣ 15 ደቂቃ)",
      sid: "**Daldalu fi Gabaate Agurro**\nBiiro: Daldalu fi Gabaate Biiro\nBayicho: Hawaasa MESOOBE Bayicho\n\nAgurubba:\n1. Daldalu Borreessiro: Huuccatto, 3x4 foote, TIN, Wolooma (102 ETB, 15 daqiiqa)\n2. Eegeera Haaroonsa: Huuccatto fi Gibirshu woraqata (102 ETB, 15 daqiiqa)\n3. Haaro Daldala Borreessa: Huuccatto, 3x4 foote, TIN, Wolooma (102 ETB, 15 daqiiqa)\n4. Daldalu Su'ma Fusha: 3 su'mma, 3x4 foote, TIN, Wolooma (127 ETB, 20 daqiiqa)\n5. Eegeera Soorira: Huuccatto, Wolooma, Foote (82 ETB, 10 daqiiqa)",
    },
  },
  {
    keywords: ["post", "postal", "ems", "examination", "ፖስታ", "ፈተና", "postaho"],
    answer: {
      en: "**Ethiopian Postal Service**\nProvider: Ethiopian Postal Service\nLocation: Hawassa MESOB Center\n\nServices:\n1. National Examination Document Handling: National ID / Passport, support letters, recipient address (EMS: 450 ETB, ~15 min)\n2. National ID (NID) Card Printing & Distribution: Delivery and collection of physical Fayda ID cards",
      am: "**የኢትዮጵያ ፖስታ አገልግሎት**\nአቅራቢ፦ የኢትዮጵያ ፖስታ አገልግሎት\nአድራሻ፦ የሀዋሳ መሶብ ማዕከል\n\nአገልግሎቶች፦\n1. የብሔራዊ ፈተናዎች ሰነድ አገልግሎት፦ መታወቂያ/ፓስፖርት፣ የድጋፍ ደብዳቤ፣ የተቀባይ አድራሻ (EMS: 450 ብር፣ 15 ደቂቃ)\n2. የብሔራዊ መታወቂያ (ፋይዳ) ካርድ ህትመትና ስርጭት፦ የታተሙ ካርዶችን ማድረስ እና ማሰራጨት",
      sid: "**Itiyoophiyu Postaho Agurro**\nBiiro: Itiyoophiyu Postaho Agurro\nBayicho: Hawaasa MESOOBE Bayicho\n\nAgurubba:\n1. Daganna Qara Fantooshshu Borro Agurro: Wolooma/paaspoorte, sokkote borro (EMS: 450 ETB, 15 daqiiqa)\n2. Fayda Wolooma Kaarde Attaminanna Beehate Agurro",
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

const SPECIFIC_INQUIRY_PATTERNS = [
  // ── English: Demographics, age, life stage, & eligibility ──
  /\bage\b/i,
  /\bhow old\b/i,
  /\bminimum\b/i,
  /\bmaximum\b/i,
  /\blimit\b/i,
  /\bchild(ren)?\b/i,
  /\bkid(s)?\b/i,
  /\bminor(s)?\b/i,
  /\bbaby\b/i,
  /\bnewborn\b/i,
  /\binfant(s)?\b/i,
  /\bteen(ager)?(s)?\b/i,
  /\byouth\b/i,
  /\bunder\s*18\b/i,
  /\bover\s*18\b/i,
  /\b18\s*years?\b/i,
  /\belder(ly)?\b/i,
  /\bsenior(s)?\b/i,
  /\bpension(er)?(s)?\b/i,
  /\bstudent(s)?\b/i,
  /\bpregnant\b/i,
  /\bdisab(led|ility)\b/i,
  /\bspecial\s*needs?\b/i,
  /\beligib(le|ility)\b/i,
  /\bqualif(y|ied|ication)\b/i,

  // ── English: Conditionals, Situational, & Procedural ("can I", "what if", "without") ──
  /\bcan i\b/i,
  /\bcan we\b/i,
  /\bcould i\b/i,
  /\bwould it be possible\b/i,
  /\bis it possible\b/i,
  /\bwhat if\b/i,
  /\bif i don'?t have\b/i,
  /\bwithout\b/i,
  /\binstead of\b/i,
  /\bdo i need\b/i,
  /\bdo we need\b/i,
  /\bshould i\b/i,
  /\bmust i\b/i,
  /\bam i required\b/i,
  /\bis it mandatory\b/i,
  /\bis it necessary\b/i,
  /\bhow can i\b/i,
  /\bhow do i\b/i,
  /\bwho can\b/i,
  /\bwho is allowed\b/i,
  /\bwhat should i do\b/i,
  /\bwhat do i bring\b/i,
  /\bwhat to bring\b/i,
  /\bwhat documents?\b/i,
  /\bwhat are the steps\b/i,
  /\bhow to get\b/i,
  /\bhow to apply\b/i,
  /\bhow to register\b/i,

  // ── English: Document status, changes, issues, & authenticity ──
  /\blost\b/i,
  /\bstolen\b/i,
  /\bdamaged\b/i,
  /\bbroken\b/i,
  /\brenew(al)?\b/i,
  /\breplace(ment)?\b/i,
  /\bvalid(ity)?\b/i,
  /\bexpire(d|s)?\b/i,
  /\bduplicate\b/i,
  /\bphotocopy\b/i,
  /\bsoft\s*copy\b/i,
  /\boriginal\b/i,
  /\bcorrect(ion)?\b/i,
  /\bamend(ment)?\b/i,
  /\bchange\s*name\b/i,
  /\bupdate\b/i,
  /\bmistake\b/i,
  /\berror\b/i,
  /\bspelling\b/i,
  /\bmismatch\b/i,
  /\bnotariz(ed|ation)\b/i,
  /\bauthenticat(ed|ion)\b/i,
  /\bcertif(ied|icate|ication)\b/i,

  // ── English: Representation, family, & guardianship ──
  /\bparent(s)?\b/i,
  /\bmother\b/i,
  /\bfather\b/i,
  /\bguardian(s)?\b/i,
  /\bfamily\b/i,
  /\bhusband\b/i,
  /\bwife\b/i,
  /\bspouse\b/i,
  /\bbrother\b/i,
  /\bsister\b/i,
  /\bson\b/i,
  /\bdaughter\b/i,
  /\brepresentative\b/i,
  /\bpower of attorney\b/i,
  /\bproxy\b/i,
  /\bon behalf\b/i,
  /\bdelegat(e|ion)\b/i,
  /\bauthorization\b/i,

  // ── English: Nationality, diaspora, & entity type ──
  /\bforeigner(s)?\b/i,
  /\bdiaspora\b/i,
  /\balien\b/i,
  /\bnon-ethiopian\b/i,
  /\bpassport holder\b/i,
  /\byellow card\b/i,
  /\borigin id\b/i,
  /\btourist\b/i,
  /\brefugee\b/i,
  /\binvestor(s)?\b/i,
  /\bcompany\b/i,
  /\bplc\b/i,
  /\benterprise\b/i,
  /\bassociation\b/i,
  /\bnon-resident\b/i,
  /\bvisa\b/i,
  /\bwork permit\b/i,
  /\bforeign employment\b/i,
  /\belectric(ity)?\b/i,
  /\brecharge\b/i,
  /\b(prepaid )?meter\b/i,
  /\btoken\b/i,
  /\bpost(al)?\b/i,
  /\bems\b/i,
  /\bexamination\b/i,
  /\btrade name\b/i,
  /\bnickname\b/i,

  // ── English: Turnaround time, urgency, & tracking ──
  /\bhow long\b/i,
  /\bhow many days\b/i,
  /\bturnaround\b/i,
  /\bduration\b/i,
  /\burgent\b/i,
  /\burgency\b/i,
  /\bexpress\b/i,
  /\bfast(er|est)?\b/i,
  /\bsame day\b/i,
  /\bemergency\b/i,
  /\bdeadline\b/i,
  /\bdelay(ed)?\b/i,
  /\bwait(ing)?\s*time\b/i,
  /\bqueue\b/i,
  /\bstep by step\b/i,
  /\bprocedure\b/i,
  /\bprocess\b/i,
  /\btrack(ing)?\b/i,
  /\bis it ready\b/i,
  /\bpick\s*up\b/i,
  /\bcollect(ion)?\b/i,

  // ── English: Fees, payment methods, & penalties ──
  /\bhow much\b/i,
  /\bcost\b/i,
  /\bfee(s)?\b/i,
  /\bprice\b/i,
  /\bcharge(s)?\b/i,
  /\bpenalty\b/i,
  /\bfine(s)?\b/i,
  /\blate fee\b/i,
  /\bis it free\b/i,
  /\bfree of charge\b/i,
  /\bpayment method\b/i,
  /\bpayment option\b/i,
  /\btelebirr\b/i,
  /\bcbe\s*birr\b/i,
  /\bbank slip\b/i,
  /\breceipt\b/i,
  /\bcash\b/i,

  // ── English: Biometrics, OTP, & capture tech ──
  /\bbiometric(s)?\b/i,
  /\bfingerprint(s)?\b/i,
  /\biris\b/i,
  /\bphoto(graph)?\b/i,
  /\botp\b/i,
  /\bsms\b/i,
  /\bverification code\b/i,
  /\bdid not receive\b/i,
  /\bfailed\b/i,
  /\brejected\b/i,
  /\bdenied\b/i,

  // ── Amharic: Demographics, age, & life stage ──
  /ዕድሜ/,
  /የእድሜ ገደብ/,
  /ስንት ዓመት/,
  /ስንት አመት/,
  /ህፃን/,
  /ህፃናት/,
  /ልጅ/,
  /ልጆች/,
  /ታዳጊ/,
  /አረጋዊ/,
  /አረጋውያን/,
  /ጡረተኛ/,
  /ተማሪ/,
  /ነፍሰ ጡር/,
  /አካል ጉዳት/,
  /አካል ጉዳተኛ/,

  // ── Amharic: Conditionals, questions, & scenarios ──
  /ይቻላል/,
  /እችላለሁ/,
  /እንችላለን/,
  /ይፈቀዳል/,
  /ይፈቀድልኛል/,
  /ባይኖረኝ/,
  /ከሌለኝ/,
  /ከሌለ/,
  /ካልያዝኩ/,
  /ካልተገኘሁ/,
  /ግዴታ/,
  /አስገዳጅ/,
  /ያስፈልጋል/,
  /ይጠየቃል/,
  /ምን ላድርግ/,
  /ምን ያስፈልጋል/,
  /ምን ያስፈልገኛል/,
  /ምን ይዤ/,
  /እንዴት ነው/,
  /እንዴት ማግኘት/,
  /እንዴት መመዝገብ/,
  /ማን ነው የሚችለው/,

  // ── Amharic: Document status, updates, & errors ──
  /የጠፋ/,
  /የጠፋብኝ/,
  /የተሰረቀ/,
  /የተበላሸ/,
  /የተበላሸብኝ/,
  /ማደስ/,
  /እድሳት/,
  /መቀየር/,
  /ማሻሻል/,
  /ስም መቀየር/,
  /ስህተት/,
  /መተካት/,
  /ጊዜው ያለፈ/,
  /ማራዘም/,
  /ኮፒ/,
  /ፎቶ ኮፒ/,
  /ዋናው/,
  /ማረጋገጫ/,
  /ማህተም/,

  // ── Amharic: Representation & Family ──
  /ወላጅ/,
  /እናት/,
  /አባት/,
  /አሳዳጊ/,
  /ውክልና/,
  /በውክልና/,
  /ወኪል/,
  /በእኔ ፈንታ/,
  /ቤተሰብ/,
  /የትዳር አጋር/,
  /የድጋፍ ደብዳቤ/,

  // ── Amharic: Nationality & Entity type ──
  /የውጭ ዜጋ/,
  /የውጭ አገር/,
  /ዲያስፖራ/,
  /ቢጫ ካርድ/,
  /ትውልደ ኢትዮጵያዊ/,
  /ኢንቨስተር/,
  /ኃላፊነቱ የተወሰነ/,
  /ድርጅት/,
  /ማህበር/,

  // ── Amharic: Process, urgency, & status ──
  /ስንት ቀን/,
  /ስንት ሰዓት/,
  /ምን ያህል ጊዜ/,
  /አስቸኳይ/,
  /በአስቸኳይ/,
  /በፍጥነት/,
  /በዕለቱ/,
  /ወዲያውኑ/,
  /ሰልፍ/,
  /ቅደም ተከተል/,
  /አሰራር/,
  /መውሰድ/,
  /መቀበል/,
  /ደርሷል/,

  // ── Amharic: Fees & Payment modes ──
  /ስንት ብር/,
  /ክፍያው ስንት/,
  /ዋጋው ስንት/,
  /ነፃ ነው/,
  /ክፍያ አለው/,
  /ቅጣት/,
  /የዘገየ/,
  /ቴሌብር/,
  /ሲቢኢ ብር/,
  /ጥሬ ገንዘብ/,
  /ደረሰኝ/,

  // ── Amharic: Biometrics & SMS verification ──
  /የጣት አሻራ/,
  /አይን/,
  /ፎቶ/,
  /መልእክት/,
  /ኤስኤምኤስ/,
  /ኮድ አልደረሰኝም/,

  // ── Sidaamu Afoo: Demographics & Age ──
  /\bdiri\b/i,
  /\bdiro\b/i,
  /\bdiri kiiro\b/i,
  /\bme'e diro\b/i,
  /\bme'e diri\b/i,
  /\bqaaqqu\b/i,
  /\bqaaqquulle\b/i,
  /\bosoole\b/i,
  /\brosootanch/i,
  /\bvederaala\b/i,
  /\bgeercho\b/i,
  /\bdhibbaataamo\b/i,

  // ── Sidaamu Afoo: Conditionals, questions, & procedural ──
  /\bdandeemmo\b/i,
  /\bdandiinanni\b/i,
  /\bdandeemmoni\b/i,
  /\bikkado\b/i,
  /\bnookkiro\b/i,
  /\bhoogiro\b/i,
  /\bhasiisanno\b/i,
  /\bhasiisannori\b/i,
  /\bhiittoonniiti\b/i,
  /\bma assiro\b/i,
  /\bmayi hasiisanno\b/i,
  /\baye dandaanno\b/i,

  // ── Sidaamu Afoo: Document status, updates, & verification ──
  /\bba'ino\b/i,
  /\bba'inori\b/i,
  /\bhaaroonsa\b/i,
  /\bhaaroonsate\b/i,
  /\bsoorrate\b/i,
  /\bsoorratenni\b/i,
  /\brigaawate\b/i,
  /\bhuntino\b/i,
  /\bso'ro\b/i,
  /\bqara\b/i,
  /\bfotokoppe\b/i,
  /\bbuuxisate\b/i,

  // ── Sidaamu Afoo: Representation & Family ──
  /\bannu\b/i,
  /\baama\b/i,
  /\bama\b/i,
  /\bmaate\b/i,
  /\bminaama\b/i,
  /\bminannaama\b/i,
  /\briqiwaanch/i,
  /\briqiwaanchimmate\b/i,
  /\bwoshshatto\b/i,

  // ── Sidaamu Afoo: Process, time, fees, & payment ──
  /\bme'e barra\b/i,
  /\bme'e yanna\b/i,
  /\bme'e woxe\b/i,
  /\bme'e baantanni\b/i,
  /\bbaatooshshu\b/i,
  /\bbaaso\b/i,
  /\bkaattote\b/i,
  /\brakkinohunni\b/i,
  /\bmullawa\b/i,
  /\btelebirre\b/i,
  /\bkashshe\b/i,
];

export function isSpecificDetailedInquiry(query) {
  if (!query || typeof query !== "string") return false;
  const trimmed = query.trim();
  const words = trimmed.split(/\s+/);

  // Pattern match across rich English, Amharic, and Sidama keywords
  if (SPECIFIC_INQUIRY_PATTERNS.some((rx) => rx.test(trimmed))) {
    return true;
  }

  // Conversational sentence questions (6+ words containing a question mark or question words)
  // Ensures natural user phrasing reaches Gemini AI while simple greetings/keywords hit Tier 2 static FAQ
  if (
    words.length >= 6 &&
    (trimmed.includes("?") ||
      /[?፧]/.test(trimmed) ||
      /\b(can|could|would|how|what|why|where|when|which|who|if|is|are|do|does|did)\b/i.test(trimmed))
  ) {
    return true;
  }

  return false;
}

export async function findFAQAnswer(query, locale = "en") {
  const lowerQuery = query.toLowerCase().trim();

  // If the query asks for specific criteria (e.g. age limits, lost ID, renewal exceptions),
  // let Tier 3 AI provide a tailored, direct answer instead of returning a generic FAQ summary.
  if (isSpecificDetailedInquiry(lowerQuery)) {
    return null;
  }

  try {
    const faqs = await prisma.chatbotFAQ.findMany({
      where: { isActive: true },
      select: {
        question: true,
        answer: true,
      },
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
      where: {
        isActive: true,
        provider: { isActive: true },
      },
      select: {
        id: true,
        title: true,
        description: true,
        requirements: true,
        estimatedFee: true,
        processingDays: true,
        provider: {
          select: {
            name: true,
            floorRoomNumber: true,
            isActive: true,
          },
        },
      },
    });
  } catch (err) {
    console.warn("DB service lookup failed, using static fallback:", err.message);
  }

  if (services.length === 0) {
    services = HAWASSA_INSTITUTIONS.flatMap((inst) =>
      inst.services.map((s) => ({
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
        provider: {
          name: inst.name,
          floorRoomNumber: inst.floorRoomNumber || null,
        },
      }))
    );
  }

  const scored = services
    .map((service) => {
      let score = 0;
      const title = (service.title || {})[locale] || (service.title || {}).en || "";
      const description = (service.description || {})[locale] || (service.description || {}).en || "";
      const providerName = (service.provider?.name || {})[locale] || (service.provider?.name || {}).en || "";

      if (title.toLowerCase().includes(lowerQuery) || lowerQuery.includes(title.toLowerCase())) score += 5;
      if (providerName.toLowerCase().includes(lowerQuery) || lowerQuery.includes(providerName.toLowerCase())) score += 5;
      if (description.toLowerCase().includes(lowerQuery)) score += 2;

      const queryWords = lowerQuery.split(/\s+/).filter((w) => w.length >= 3);
      for (const word of queryWords) {
        if (title.toLowerCase().includes(word)) score += 2;
        if (providerName.toLowerCase().includes(word)) score += 3;
        if (description.toLowerCase().includes(word)) score += 1;
      }

      const requirements = service.requirements || [];
      const reqText = requirements
        .map((r) => (typeof r === "object" ? r[locale] || r.en || "" : r))
        .join(" ")
        .toLowerCase();
      if (reqText.includes(lowerQuery)) score += 3;
      for (const word of queryWords) {
        if (reqText.includes(word)) score += 1;
      }

      return { service, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (scored.length === 0) return "";

  return scored
    .map(({ service }) => {
      const title = (service.title || {})[locale] || (service.title || {}).en || "";
      const desc = (service.description || {})[locale] || (service.description || {}).en || "";
      const provider = (service.provider?.name || {})[locale] || (service.provider?.name || {}).en || "";
      const requirements = service.requirements || [];
      const reqList = requirements
        .map((r) => (typeof r === "object" ? r[locale] || r.en || "" : r))
        .filter(Boolean)
        .join("; ");

      const floorInfo = service.provider?.floorRoomNumber ? `\nFloor/Room: ${service.provider.floorRoomNumber}` : "";

      let feeDisplay = "Inquire at center";
      if (service.estimatedFee === 0) {
        feeDisplay = "Free of charge (0 ETB)";
      } else if (service.estimatedFee !== null && service.estimatedFee !== undefined) {
        feeDisplay = `${service.estimatedFee} ETB`;
      }

      let procDisplay = "Same-day service / see description";
      if (service.processingDays !== null && service.processingDays !== undefined) {
        procDisplay = service.processingDays === 1 ? "Same-day (1 business day)" : `${service.processingDays} business days`;
      }

      return `Service: ${title}
Provider: ${provider}
Description: ${desc}
Requirements: ${reqList || "N/A"}
Fee: ${feeDisplay}
Processing Time: ${procDisplay}${floorInfo}`;
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
