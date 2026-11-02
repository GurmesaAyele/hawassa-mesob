// ─────────────────────────────────────────────────────────────
// SAMPLE DATA – replace with the real Hawassa MESOB information
// (later you can load this from your backend: fetch("/api/services")).
// fee.amount is in ETB; use amount: 0 for free services.
// ─────────────────────────────────────────────────────────────

export const SITE = {
  updated: "2026-10-01",
  hours: {
    en: "Monday – Friday, 8:30 AM – 5:30 PM (local time)",
    am: "ሰኞ – አርብ፣ ከጠዋቱ 2:30 – ከቀኑ 11:30 (በኢትዮጵያ ሰዓት አቆጣጠር)",
  },
  address: {
    en: "Hawassa City, Sidama Region, Ethiopia",
    am: "ሀዋሳ ከተማ፣ ሲዳማ ክልል፣ ኢትዮጵያ",
  },
  phone: "+251 000 000 000",
};

export const ORGANIZATIONS = [
  { id: "civil", name: { en: "Civil Registration & Residency", am: "የሲቪል ምዝገባና ነዋሪነት" }, floor: { en: "Ground floor, Hall A", am: "ምድር ቤት፣ አዳራሽ ሀ" } },
  { id: "trade", name: { en: "Trade & Market Development", am: "ንግድና ገበያ ልማት" }, floor: { en: "Ground floor, Hall B", am: "ምድር ቤት፣ አዳራሽ ለ" } },
  { id: "revenue", name: { en: "Revenue Authority", am: "ገቢዎች ባለስልጣን" }, floor: { en: "First floor, Desk 1–6", am: "1ኛ ፎቅ፣ ጠረጴዛ 1–6" } },
  { id: "land", name: { en: "Land Development & Management", am: "መሬት ልማትና አስተዳደር" }, floor: { en: "First floor, Hall C", am: "1ኛ ፎቅ፣ አዳራሽ ሐ" } },
  { id: "transport", name: { en: "Transport Authority", am: "ትራንስፖርት ባለስልጣን" }, floor: { en: "Ground floor, Hall D", am: "ምድር ቤት፣ አዳራሽ መ" } },
  { id: "labor", name: { en: "Labor & Skills", am: "ስራና ክህሎት" }, floor: { en: "Second floor", am: "2ኛ ፎቅ" } },
];

export const SERVICES = [
  {
    id: "birth-cert",
    org: "civil",
    popular: true,
    name: { en: "Birth certificate", am: "የልደት የምስክር ወረቀት" },
    summary: { en: "Register a birth and receive the certificate.", am: "ልደትን መመዝገብና የምስክር ወረቀት ማግኘት።" },
    fee: { amount: 0 },
    time: { en: "Same day", am: "በዚያው ቀን" },
    requirements: [
      { en: "Notification of birth from the health facility", am: "ከጤና ተቋም የተሰጠ የልደት ማሳወቂያ" },
      { en: "ID cards of both parents", am: "የሁለቱም ወላጆች መታወቂያ" },
      { en: "Marriage certificate (if available)", am: "የጋብቻ ሰርተፊኬት (ካለ)" },
    ],
    steps: [
      { en: "Take a queue ticket at the reception desk.", am: "ከእንግዳ መቀበያ የሰልፍ ቁጥር ይውሰዱ።" },
      { en: "Submit your documents at the Civil Registration desk.", am: "ሰነዶችዎን በሲቪል ምዝገባ ጠረጴዛ ያስረክቡ።" },
      { en: "Check the details and collect the certificate.", am: "መረጃውን አረጋግጠው የምስክር ወረቀቱን ይቀበሉ።" },
    ],
    notes: [{ en: "Late registration may need an extra witness.", am: "ዘግይቶ ምዝገባ ተጨማሪ ምስክር ሊያስፈልግ ይችላል።" }],
  },
  {
    id: "marriage-cert",
    org: "civil",
    name: { en: "Marriage certificate", am: "የጋብቻ የምስክር ወረቀት" },
    summary: { en: "Register a marriage.", am: "ጋብቻን መመዝገብ።" },
    fee: { amount: 100 },
    time: { en: "1 day", am: "1 ቀን" },
    requirements: [
      { en: "ID cards of both spouses", am: "የሁለቱም የትዳር አጋሮች መታወቂያ" },
      { en: "Two passport-size photos of each spouse", am: "የእያንዳንዳቸው ሁለት ፓስፖርት መጠን ፎቶ" },
      { en: "Two witnesses with ID cards", am: "መታወቂያ ያላቸው ሁለት ምስክሮች" },
    ],
    steps: [
      { en: "Submit documents at the Civil Registration desk.", am: "ሰነዶችን በሲቪል ምዝገባ ጠረጴዛ ያስረክቡ።" },
      { en: "Pay the fee at the cashier.", am: "ክፍያውን በገንዘብ ተቀባይ ይክፈሉ።" },
      { en: "Collect the certificate.", am: "የምስክር ወረቀቱን ይቀበሉ።" },
    ],
    notes: [],
  },
  {
    id: "business-license-new",
    org: "trade",
    popular: true,
    name: { en: "New business license", am: "አዲስ የንግድ ፈቃድ" },
    summary: { en: "Get a license to start a business.", am: "ንግድ ለመጀመር ፈቃድ ማግኘት።" },
    fee: { amount: 500, note: { en: "Varies by business type", am: "እንደ ንግድ አይነት ይለያያል" } },
    time: { en: "1–2 days", am: "1–2 ቀናት" },
    requirements: [
      { en: "Valid ID card of the owner", am: "የባለቤቱ ትክክለኛ መታወቂያ" },
      { en: "Two passport-size photos", am: "ሁለት ፓስፖርት መጠን ፎቶ" },
      { en: "Business premises lease or ownership proof", am: "የንግድ ቦታ የኪራይ ውል ወይም የባለቤትነት ማስረጃ" },
      { en: "Tax Identification Number (TIN)", am: "የግብር ከፋይ መለያ ቁጥር (TIN)" },
    ],
    steps: [
      { en: "Get a TIN at the Revenue Authority desk if you do not have one.", am: "TIN ከሌለዎት በገቢዎች ጠረጴዛ ያውጡ።" },
      { en: "Submit the application at the Trade desk.", am: "ማመልከቻውን በንግድ ጠረጴዛ ያስገቡ።" },
      { en: "Pay the fee, then collect your license.", am: "ክፍያውን ከፍለው ፈቃድዎን ይቀበሉ።" },
    ],
    notes: [{ en: "Some activities need an approval letter from a sector office first.", am: "አንዳንድ ስራዎች መጀመሪያ ከሴክተር መስሪያ ቤት የድጋፍ ደብዳቤ ይፈልጋሉ።" }],
  },
  {
    id: "business-license-renew",
    org: "trade",
    popular: true,
    name: { en: "Business license renewal", am: "የንግድ ፈቃድ እድሳት" },
    summary: { en: "Renew your yearly business license.", am: "ዓመታዊ የንግድ ፈቃድ ማሳደስ።" },
    fee: { amount: 300 },
    time: { en: "Same day", am: "በዚያው ቀን" },
    requirements: [
      { en: "Previous business license", am: "የቀደመው የንግድ ፈቃድ" },
      { en: "Tax clearance certificate", am: "የታክስ ክሊራንስ" },
      { en: "Valid ID card of the owner", am: "የባለቤቱ ትክክለኛ መታወቂያ" },
    ],
    steps: [
      { en: "Get the tax clearance at the Revenue Authority desk.", am: "የታክስ ክሊራንስ በገቢዎች ጠረጴዛ ያውጡ።" },
      { en: "Submit renewal documents at the Trade desk.", am: "የእድሳት ሰነዶችን በንግድ ጠረጴዛ ያስገቡ።" },
      { en: "Pay and collect the renewed license.", am: "ከፍለው የታደሰውን ፈቃድ ይቀበሉ።" },
    ],
    notes: [{ en: "Late renewal may add a penalty.", am: "ዘግይቶ ማሳደስ ቅጣት ሊኖረው ይችላል።" }],
  },
  {
    id: "tin",
    org: "revenue",
    name: { en: "Tax Identification Number (TIN)", am: "የግብር ከፋይ መለያ ቁጥር (TIN)" },
    summary: { en: "Register as a taxpayer.", am: "እንደ ግብር ከፋይ መመዝገብ።" },
    fee: { amount: 0 },
    time: { en: "Same day", am: "በዚያው ቀን" },
    requirements: [
      { en: "Valid ID card", am: "ትክክለኛ መታወቂያ" },
      { en: "One passport-size photo", am: "አንድ ፓስፖርት መጠን ፎቶ" },
      { en: "Residence or business address", am: "የመኖሪያ ወይም የንግድ አድራሻ" },
    ],
    steps: [
      { en: "Fill in the registration form at the Revenue desk.", am: "የምዝገባ ቅጹን በገቢዎች ጠረጴዛ ይሙሉ።" },
      { en: "Your TIN certificate is printed for you.", am: "የTIN ሰርተፊኬትዎ ታትሞ ይሰጥዎታል።" },
    ],
    notes: [],
  },
  {
    id: "tax-clearance",
    org: "revenue",
    name: { en: "Tax clearance", am: "የታክስ ክሊራንስ" },
    summary: { en: "Prove that your taxes are paid.", am: "ግብርዎን እንደከፈሉ ማረጋገጥ።" },
    fee: { amount: 50 },
    time: { en: "1 day", am: "1 ቀን" },
    requirements: [
      { en: "TIN certificate", am: "የTIN ሰርተፊኬት" },
      { en: "Proof of tax payment receipts", am: "የግብር ክፍያ ደረሰኞች" },
      { en: "Valid business license", am: "ትክክለኛ የንግድ ፈቃድ" },
    ],
    steps: [
      { en: "Submit documents at the Revenue desk.", am: "ሰነዶችን በገቢዎች ጠረጴዛ ያስገቡ።" },
      { en: "Wait for the account check.", am: "የሂሳብ ማረጋገጫውን ይጠብቁ።" },
      { en: "Collect the clearance letter.", am: "የክሊራንስ ደብዳቤውን ይቀበሉ።" },
    ],
    notes: [],
  },
  {
    id: "land-holding",
    org: "land",
    name: { en: "Land holding certificate", am: "የይዞታ ማረጋገጫ ካርታ" },
    summary: { en: "Get proof that you hold a plot of land.", am: "የቦታ ይዞታ ማረጋገጫ ማግኘት።" },
    fee: { amount: 600 },
    time: { en: "7 days", am: "7 ቀናት" },
    requirements: [
      { en: "Valid ID card", am: "ትክክለኛ መታወቂያ" },
      { en: "Previous title deed or lease agreement", am: "የቀድሞ ካርታ ወይም የሊዝ ውል" },
      { en: "Site plan", am: "የቦታ ፕላን" },
    ],
    steps: [
      { en: "Submit the application at the Land desk.", am: "ማመልከቻውን በመሬት ጠረጴዛ ያስገቡ።" },
      { en: "A surveyor confirms the plot.", am: "ቀያሽ ቦታውን ያረጋግጣል።" },
      { en: "Pay the fee and collect the certificate.", am: "ክፍያ ከፍለው ካርታውን ይቀበሉ።" },
    ],
    notes: [{ en: "The process may take longer if a boundary dispute is reported.", am: "የድንበር ክርክር ካለ ሂደቱ ሊራዘም ይችላል።" }],
  },
  {
    id: "driving-license-renew",
    org: "transport",
    popular: true,
    name: { en: "Driving license renewal", am: "የመንጃ ፈቃድ እድሳት" },
    summary: { en: "Renew an expiring driving license.", am: "የሚያበቃ የመንጃ ፈቃድ ማሳደስ።" },
    fee: { amount: 350 },
    time: { en: "2 days", am: "2 ቀናት" },
    requirements: [
      { en: "Old driving license", am: "አሮጌው የመንጃ ፈቃድ" },
      { en: "Valid ID card", am: "ትክክለኛ መታወቂያ" },
      { en: "Medical certificate", am: "የጤና ምርመራ ሰርተፊኬት" },
      { en: "Two passport-size photos", am: "ሁለት ፓስፖርት መጠን ፎቶ" },
    ],
    steps: [
      { en: "Submit documents at the Transport desk.", am: "ሰነዶችን በትራንስፖርት ጠረጴዛ ያስገቡ።" },
      { en: "Have your photo and fingerprints taken.", am: "ፎቶና የጣት አሻራ ይሰጡ።" },
      { en: "Pay the fee and collect the license.", am: "ክፍያ ከፍለው ፈቃዱን ይቀበሉ።" },
    ],
    notes: [],
  },
  {
    id: "work-permit",
    org: "labor",
    name: { en: "Employment registration", am: "የስራ ምዝገባ" },
    summary: { en: "Register as a job seeker.", am: "እንደ ስራ ፈላጊ መመዝገብ።" },
    fee: { amount: 0 },
    time: { en: "Same day", am: "በዚያው ቀን" },
    requirements: [
      { en: "Valid ID card", am: "ትክክለኛ መታወቂያ" },
      { en: "Education certificates", am: "የትምህርት ማስረጃዎች" },
    ],
    steps: [
      { en: "Fill in the registration form.", am: "የምዝገባ ቅጹን ይሙሉ።" },
      { en: "Receive your registration card.", am: "የምዝገባ ካርድዎን ይቀበሉ።" },
    ],
    notes: [],
  },
];
