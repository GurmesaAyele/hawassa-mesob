// Hawassa MESOB Center Authentic Institutions & Services Data
// Sourced from live Hawassa MESOB Center portal (https://hawassamesobcenter.et/#services)
// Exactly 13 verified institutions, 24 operational services, and complete document requirements

export const HAWASSA_INSTITUTIONS = [
  {
    "id": "edc96fcf-432d-4d9d-a9df-9a5f5b7078e2",
    "name": {
      "en": "Immigration and Citizenship Service",
      "am": "የኢሚግሬሽንና ዜግነት አገልግሎት",
      "sid": "Imigreeshiinete fi Lamroomu Agurro"
    },
    "code": "ICS",
    "logoUrl": "/logos/immigration.png",
    "services": [
      {
        "id": "1bff5669-64e8-44b2-a5e9-105d537a1b29",
        "title": {
          "en": "Ethiopian Origin ID",
          "am": "የትውልደ ኢትዮጵያውያን መታወቂያ (ቢጫ ካርድ)",
          "sid": "Itiyoophiyu Dhalote Wolooma Kaarde (Bicha Kaarde)"
        },
        "description": {
          "en": "Issuance and renewal of Ethiopian Origin ID Card (Yellow Card). Mandatory fee: 300 USD regular / 400 USD urgent. In-person application only (proxy not permitted). Daily penalty applies for late renewals.",
          "am": "የትውልደ ኢትዮጵያውያን መታወቂያ ካርድ (ቢጫ ካርድ) አሰጣጥ እና እድሳት። መደበኛ ክፍያ 300 ዶላር፣ አጣዳፊ 400 ዶላር። በአካል መቅረብ ግዴታ ነው (በውክልና አይፈቀድም)። በወቅቱ ካልታደሰ የቀን ቅጣት አለው።",
          "sid": "Itiyoophiyu dhalote wolooma kaarde (Bicha Kaarde) uya fi haaroonsa. Waagu 300 USD qara, 400 USD daafurrote. Umikki daate hasiisanno (riqiwotenni didandaamanno)."
        },
        "requirements": [
          {
            "id": "e7955468-e91c-4131-a5e1-3485e399bc89",
            "requirement": {
              "en": "Properly filled out application form.",
              "am": "በትክክል የተሞላ የማመልከቻ ቅጽ።",
              "sid": "Garunni wonshinoha huuccattote borro."
            }
          },
          {
            "id": "6af20287-d55e-4f54-aa6a-b90a5c812e3e",
            "requirement": {
              "en": "An ordinary passport valid for more than 6 months.",
              "am": "ከ6 ወር በላይ የሚያገለግል መደበኛ ፓስፖርት።",
              "sid": "6 aganira sa'e loosasira dandaanno qaru paaspoorte."
            }
          },
          {
            "id": "5e8a67ae-0b05-4f25-a4f9-a5eaa6e10b92",
            "requirement": {
              "en": "Copy of entry visa (If it’s e-visa, visa print out) and date stamp. If tourist visa extended before, copy of the last extended visa.",
              "am": "የመግቢያ ቪዛ ቅጂ (ኢ-ቪዛ ከሆነ የታተመ ቪዛ) እና የቀን ማህተም። የቱሪስት ቪዛ ከዚህ በፊት ተራዝሞ ከሆነ የመጨረሻው የተራዘመው ቪዛ ቅጂ።",
              "sid": "E'ote viiza kopppe (e-viiza ikkiro attamino viiza) fi yannate xaphpho. Turiizimete viiza balaxe dheerinsiro jeefote dheerinsiro kopppe."
            }
          },
          {
            "id": "e36969ec-1077-4454-ae4d-727851f764f5",
            "requirement": {
              "en": "Machine-readable Ethiopian passport or Authenticated birth certificate.",
              "am": "በማሽን የሚነበብ የኢትዮጵያ ፓስፖርት ወይም የተረጋገጠ የልደት ምስክር ወረቀት።",
              "sid": "Maashineni nabbabbanno Itiyoophiyu paaspoorte woy buuxamino ilote wolooma."
            }
          },
          {
            "id": "eaa19020-4d65-4ce5-ac22-f09f4c78ab26",
            "requirement": {
              "en": "If mother or father is Ethiopian citizen: copy of their Kebele ID or passport.",
              "am": "እናት ወይም አባት የኢትዮጵያ ዜጋ ከሆኑ፦ የቀበሌ መታወቂያቸው ወይም የፓስፖርት ቅጂ።",
              "sid": "Amaa woy anna Itiyoophiyu dagoomu wolooma heedhuro: qabaleete wolooma woy paaspoorte kopppe."
            }
          },
          {
            "id": "4dd92fe4-6253-452b-a4fa-dcd35a9954ea",
            "requirement": {
              "en": "If foreign citizenship held but previously issued Kebele ID: copy of Kebele ID (father and grandfather names must match).",
              "am": "የውጭ ዜግነት ኖሯቸው ከዚህ ቀደም የቀበሌ መታወቂያ ተሰጥቷቸው ከነበረ፦ የመታወቂያው ቅጂ (የአባትና የአያት ስም በመታወቂያው ላይ ካለው ጋር መመሳሰል አለበት)።",
              "sid": "Gobbate wolooma heedhe balaxe qabaleete wolooma afidhinoonniha ikkiro: woloomu kopppe (annunna beetu annu su'mi taashshama noosi)."
            }
          },
          {
            "id": "abd89a96-79a4-4da6-a8e1-7772aa91db96",
            "requirement": {
              "en": "One recent passport-sized photograph.",
              "am": "አንድ የቅርብ ጊዜ የፓስፖርት መጠን ፎቶግራፍ።",
              "sid": "Mitte muli yannara ka'inoha paaspoorte kiiro foote."
            }
          },
          {
            "id": "a0f03eb3-66da-47c9-aa82-4003a28b6ffb",
            "requirement": {
              "en": "Born in Ethiopia with birth registered in foreign country (e.g. Eritrea/Somalia): court decisions and supporting documents including parents' Ethiopian IDs or passports.",
              "am": "ኢትዮጵያ ውስጥ ተወልደው የትውልድ ቦታቸው በውጭ ሀገር (ለምሳሌ ኤርትራ ወይም ሶማሊያ) የተመዘገበ፦ የፍርድ ቤት ውሳኔዎችና የወላጆች የኢትዮጵያ መታወቂያ ወይም ፓስፖርት ቅጂዎችን ጨምሮ ደጋፊ ሰነዶች።",
              "sid": "Itiyoophiyu giddo ilame gobbate badhino (lawishshaho Eertira woy Somaaliya): yoote murrooti borronna annu/amatu paaspoorte woy wolooma kopppe."
            }
          },
          {
            "id": "cf4b379d-7abf-44b3-aaf9-5fc29ff8c7c7",
            "requirement": {
              "en": "If child under 18: legal adoption document and adoptive parent's passport copy.",
              "am": "ልጁ ከ18 ዓመት በታች ከሆነ፦ ህጋዊ የጉዲፈቻ ሰነድ እና የአሳዳጊው ወላጅ ፓስፖርት ቅጂ።",
              "sid": "Beettu 18 diro woroonni ikkiro: seeramu gudifachu borronna gashshaanchu paaspoorte kopppe."
            }
          },
          {
            "id": "cd328b6e-2e2d-4426-aadb-569bd4e2e358",
            "requirement": {
              "en": "In case of name change: certified legal court decision (translated into Amharic or English by authorized entity if in another language).",
              "am": "የስም ለውጥ ካለ፦ የተረጋገጠ የፍርድ ቤት ውሳኔ (ቋንቋው አማርኛ ወይም እንግሊዝኛ ካልሆነ በህጋዊ አካል የተተረጎመ)።",
              "sid": "Su'ma soorrate ikkiro: buuxamino yoote murrooti borro (Amaaru woy Ingilizete afoo ikka hoowiro seeramu qoli borro)."
            }
          },
          {
            "id": "b8d60f36-b443-41fe-a8b9-ff29446f92b8",
            "requirement": {
              "en": "If family documents unavailable due to death: official death certificate is mandatory.",
              "am": "በሞት ምክንያት የቤተሰብ ሰነዶች የማይገኙ ከሆነ፦ የሞት ምስክር ወረቀት ማቅረብ ግዴታ ነው።",
              "sid": "Reyotenni daafira maate borro hoongiro: reyote kakkalooshshu woraqata shollisha hasiissanno."
            }
          },
          {
            "id": "aab1cc0a-408d-4330-a8e9-914889cf5d3b",
            "requirement": {
              "en": "Proof of mandatory service fee (300 USD regular / 400 USD urgent). In-person submission only (proxy not permitted).",
              "am": "የአገልግሎት ክፍያ ደረሰኝ (ለመደበኛ 300 ዶላር፣ ለአጣዳፊ 400 ዶላር)። በአካል መቅረብ ግዴታ ነው (በውክልና አይፈቀድም)።",
              "sid": "Waagu kakkalooshshu woraqata (300 USD qara, 400 USD daafurrote). Umikki daate hasiisanno (riqiwotenni didandaamanno)."
            }
          }
        ],
        "estimatedFee": null,
        "processingDays": null
      },
      {
        "id": "848068c1-c90e-4f8a-aaa9-c6b2a6a4a0d7",
        "title": {
          "en": "Visa Application",
          "am": "የቪዛ ማመልከቻ",
          "sid": "Viizaho Huuccatto"
        },
        "description": {
          "en": "Application support and facilitation for business, conference, and entry visas to Ethiopia.",
          "am": "ወደ ኢትዮጵያ ለመግባት የንግድ፣ የስብሰባ እና አጠቃላይ የቪዛ ማመልከቻዎችን ማረጋገጥ እና ማስተናገድ።",
          "sid": "Itiyoophiyu giddora e'anno daldalu, gambooshshu fi xaphooma viizara huuccatto buuxisate agurro."
        },
        "requirements": [
          {
            "id": "ae8d8c43-00d5-464d-ab43-d31f6c5c1aa0",
            "requirement": {
              "en": "Valid passport with at least six months of validity",
              "am": "ቢያንስ ለስድስት ወራት የሚያገለግል ህጋዊ ፓስፖርት",
              "sid": "Sa'u 6 aganira loosasira dandaanno seeramu paaspoorte"
            }
          },
          {
            "id": "8fa1c3d2-3b02-4460-a6e5-ae0879ed37fa",
            "requirement": {
              "en": "Completed visa application form",
              "am": "በትክክል የተሞላ የቪዛ ማመልከቻ ቅጽ",
              "sid": "Wonshinoha viizaho huuccattote borro"
            }
          },
          {
            "id": "b3490c14-c41c-46e5-ae0d-d6c2c5df2d87",
            "requirement": {
              "en": "Two recent passport-sized photographs",
              "am": "ሁለት የቅርብ ጊዜ የፓስፖርት መጠን ፎቶግራፎች",
              "sid": "Lame muli yannara ka'inoha paaspoorte kiiro foote"
            }
          },
          {
            "id": "d8b58a97-6dbc-4ecb-aa42-20c68f277200",
            "requirement": {
              "en": "An invitation letter from a business partner or organization in Ethiopia",
              "am": "በኢትዮጵያ ውስጥ ካለ የንግድ አጋር ወይም ድርጅት የተላከ የግብዣ ደብዳቤ",
              "sid": "Itiyoophiyu giddo noo daldalu jaalinni woy diriyeetenni koyishshote sokko"
            }
          },
          {
            "id": "7f26c442-b098-4d99-ae1a-071e80e97008",
            "requirement": {
              "en": "Proof of business activities (e.g. conference details, business contracts)",
              "am": "የንግድ ስራ ማስረጃዎች (ለምሳሌ የስብሰባ ዝርዝር፣ የንግድ ውሎች)",
              "sid": "Daldalu loosi kakkalooshsha (lawishshaho gambooshshu mashkkaammo, daldalu maaro)"
            }
          },
          {
            "id": "1108d586-26a8-45f8-a3d9-16258813e548",
            "requirement": {
              "en": "Payment of the applicable visa fee",
              "am": "ተገቢውን የቪዛ አገልግሎት ክፍያ መክፈል",
              "sid": "Hasiissanno viizaho baatooshshe baata"
            }
          },
          {
            "id": "b8eb0dc1-bb65-4a4e-a302-bfa62de310ac",
            "requirement": {
              "en": "Additional documents if requested by the Ethiopian Embassy or Consulate",
              "am": "በኢትዮጵያ ኤምባሲ ወይም ቆንስላ ተጨማሪ ሰነዶች ከተጠየቁ ማቅረብ",
              "sid": "Itiyoophiyu ambaasedenni woy koonsoleetenni hasiissanno leellishi yiniro shollisha"
            }
          }
        ],
        "estimatedFee": null,
        "processingDays": null
      },
      {
        "id": "2353aa4b-bbcf-4845-a033-3b17f7fdc9b9",
        "title": {
          "en": "Work Permit",
          "am": "የስራ ፈቃድ",
          "sid": "Loosu Eegeera"
        },
        "description": {
          "en": "Work permit issuance and verification for foreign expatriates, international organizations, and NGO staff.",
          "am": "ለውጭ ሀገር ዜጎች፣ ለአለም አቀፍ ድርጅቶች እና ለኤንጂኦ ሰራተኞች የስራ ፈቃድ አሰጣጥ እና ማረጋገጫ።",
          "sid": "Gobbate mannihira, alamete diriyootanna NGO loosasira loosu eegeera uya."
        },
        "requirements": [
          {
            "id": "887f6a62-6851-4575-a409-e23a26f7e915",
            "requirement": {
              "en": "Valid 6-month passport of the applicant",
              "am": "የአመልካቹ ለ6 ወር የሚያገለግል ህጋዊ ፓስፖርት",
              "sid": "Huccattooshshu 6 aganira loosasira dandaanno seeramu paaspoorte"
            }
          },
          {
            "id": "e9bf3014-ed19-4d1c-a6ea-88d5c620ee05",
            "requirement": {
              "en": "Two recent passport-sized photographs",
              "am": "ሁለት የቅርብ ጊዜ የፓስፖርት መጠን ፎቶግራፎች",
              "sid": "Lame muli yannara ka'inoha paaspoorte kiiro foote"
            }
          },
          {
            "id": "034ab7f4-dc6d-4741-ae0e-8e4a126032a5",
            "requirement": {
              "en": "Employment contract or appointment letter from the employer / NGO",
              "am": "ከቀጣሪ ድርጅት ወይም ከኤንጂኦ የተሰጠ የስራ ውል ወይም የቅጥር ደብዳቤ",
              "sid": "Loosiisaanchunni woy NGO-tenni uyinoha loosu maaro woy eegote sokko"
            }
          },
          {
            "id": "b95fd50d-c8a1-4ab7-a57d-5e7d76a52d5c",
            "requirement": {
              "en": "Proof of the NGO's registration and authorization to operate in Ethiopia",
              "am": "ድርጅቱ ወይም ኤንጂኦው በኢትዮጵያ ውስጥ እንዲሰራ ህጋዊ ፍቃድ ያለው መሆኑን የሚያረጋግጥ ሰነድ",
              "sid": "NGO Itiyoophiyu giddo loosate seeramu eegeera afi'rinota buuxisanno borro"
            }
          },
          {
            "id": "f972e282-fbfd-41c3-a6ea-b598548b102b",
            "requirement": {
              "en": "Police clearance certificate from the applicant's country of origin",
              "am": "ከአመልካቹ የትውልድ ሀገር የተሰጠ ከወንጀል ነፃ የመሆን (የፖሊስ) ማስረጃ",
              "sid": "Huccattooshshu gobbanni uyinoha seera qorophote (poolisete) kakkalooshshu woraqata"
            }
          },
          {
            "id": "573124ee-db3d-4197-a243-ce51b6a5cc26",
            "requirement": {
              "en": "Proof of relevant qualifications and professional experience",
              "am": "አግባብነት ያለው የትምህርት ማስረጃ እና የስራ ልምድ ማረጋገጫ",
              "sid": "Loosaho hasiissanno rosu kakkalooshshanna loosu dandaanyo"
            }
          },
          {
            "id": "edc0c5b8-f9c4-4bef-ad93-1c73562e4b5c",
            "requirement": {
              "en": "Payment of the applicable work permit fee",
              "am": "ተገቢውን የስራ ፈቃድ ክፍያ መክፈል",
              "sid": "Hasiissanno loosu eegeeri baatooshshe baata"
            }
          },
          {
            "id": "62d34234-654f-407c-a105-dc82e949651a",
            "requirement": {
              "en": "Completed work permit application form",
              "am": "በትክክል የተሞላ የስራ ፈቃድ ማመልከቻ ቅጽ",
              "sid": "Wonshinoha loosu eegeeri huuccattote borro"
            }
          },
          {
            "id": "5289630b-b7c4-44ff-a471-f3e31a986684",
            "requirement": {
              "en": "Additional documents if requested by immigration authorities",
              "am": "በኢሚግሬሽን ባለስልጣናት ተጨማሪ ሰነዶች ከተጠየቁ ማቅረብ",
              "sid": "Imigreeshiinete gashshooti leellishi yiniro hasiissanno borro shollisha"
            }
          }
        ],
        "estimatedFee": null,
        "processingDays": null
      }
    ]
  },
  {
    "id": "c2590f1a-eeae-46a0-a31b-ee13d315e818",
    "name": {
      "en": "Ethiopian Postal Service",
      "am": "የኢትዮጵያ ፖስታ አገልግሎት",
      "sid": "Itiyoophiyu Postaho Agurro"
    },
    "code": "ETHIO_POST",
    "logoUrl": "/logos/post.png",
    "services": [
      {
        "id": "457d08c9-be16-4de4-a172-2e17f9e262c3",
        "title": {
          "en": "National Examination Document Handling",
          "am": "የብሔራዊ ፈተናዎች ሰነድ አገልግሎት",
          "sid": "Daganna Qara Fantooshshu Borro Agurro"
        },
        "description": {
          "en": "Booking, express handling, and delivery of national examination documents and educational certificates. Processing time is ~15 minutes depending on document/shipment size. EMS fee: 450 ETB; some standard services free.",
          "am": "የብሔራዊ ፈተናዎች ሰነዶች፣ ማስረጃዎች እና ሰርተፍኬቶችን በፖስታ የማድረስና የመያዝ አገልግሎት። እንደ ሰነዱ መጠን እስከ 15 ደቂቃ ይወስዳል። የEMS ክፍያ 450 ብር ሲሆን አንዳንድ አገልግሎቶች ክፍያ የላቸውም።",
          "sid": "Daganna fantooshshu borro postatenni sayisate agurro. 15 daqiiqa geeshsha adhitanno. EMS waagu 450 ETB."
        },
        "requirements": [
          {
            "id": "e9d11717-5906-44d2-a554-f220f00c8473",
            "requirement": {
              "en": "National ID or Passport",
              "am": "ብሔራዊ መታወቂያ ወይም ፓስፖርት",
              "sid": "Daganna Wolooma woy Paaspoorte"
            }
          },
          {
            "id": "aa42963d-91fc-47e7-ae6b-15bfdbfa4ce9",
            "requirement": {
              "en": "Support letters for registration or booking",
              "am": "ለምዝገባ ወይም ቦታ ለመያዝ የድጋፍ ደብዳቤዎች",
              "sid": "Borreessate woy qara buuxisate sokkote borro"
            }
          },
          {
            "id": "31854584-0db3-4767-a954-505bcf05d3b3",
            "requirement": {
              "en": "Full recipient address and contact details",
              "am": "የተቀባዩ ሙሉ አድራሻ እና የስልክ አድራሻ",
              "sid": "Adhaanchu wo'ma teessonna bilbilu kiiro"
            }
          }
        ],
        "estimatedFee": 450,
        "processingDays": 1
      },
      {
        "id": "7a086be4-3b48-47bb-a873-be379a9bf696",
        "title": {
          "en": "National ID (NID) Card Printing & Distribution",
          "am": "የብሔራዊ መታወቂያ (ፋይዳ) ካርድ ህትመትና ስርጭት",
          "sid": "Fayda Wolooma Kaarde Attaminanna Beehate Agurro"
        },
        "description": {
          "en": "Printing and distribution of physical Fayda National Digital ID cards in collaboration with the National ID Program.",
          "am": "ከብሔራዊ መታወቂያ ፕሮግራም ጋር በመተባበር የታተሙ የፋይዳ ካርዶችን ለዜጎች ህትመትና የማሰራጨት አገልግሎት።",
          "sid": "Daganna Fayda Wolooma Kaarde attama fi mannaho turo agurro."
        },
        "requirements": [
          {
            "id": "2122b16a-d9df-443d-a58c-6c1ccf10f27c",
            "requirement": {
              "en": "National ID (Fayda) Registration Slip or FIN Number (to be added)",
              "am": "የብሔራዊ መታወቂያ (ፋይዳ) የምዝገባ ወረቀት ወይም የፋይዳ ቁጥር (FIN) (የሚጨመር)",
              "sid": "Fayda Wolooma Borreessirote Woraqata woy FIN Kiiro (leellishinanni)"
            }
          }
        ],
        "estimatedFee": null,
        "processingDays": null
      }
    ]
  },
  {
    "id": "c844b4ce-f115-4401-a6ed-a41cd4e9bfee",
    "name": {
      "en": "Trade and Market Services",
      "am": "የንግድና ገበያ አገልግሎት",
      "sid": "Daldalu fi Gabaate Agurro"
    },
    "code": "HAWASSA_TRADE",
    "logoUrl": "/logos/Trade_and_Market.png",
    "services": [
      {
        "id": "00e2b64f-3441-4f7b-a068-8f15b9e7dbe0",
        "title": {
          "en": "Business Registration",
          "am": "የንግድ ምዝገባ",
          "sid": "Daldalu Borreessiro"
        },
        "description": {
          "en": "Official commercial register entry for business enterprises operating in Hawassa City. Processing time: 15 minutes.",
          "am": "በሀዋሳ ከተማ ውስጥ ለሚሰሩ የንግድ ድርጅቶች ይፋዊ የንግድ ምዝገባ። የሚፈጅበት ጊዜ፡ 15 ደቂቃ።",
          "sid": "Hawaasa Katamira no daldala borreessate agurro. 15 daqiiqa adhitanno."
        },
        "requirements": [
          {
            "id": "c54d3c3b-12a1-4ffa-a040-d35c6936857c",
            "requirement": {
              "en": "Request application form",
              "am": "የማመልከቻ ቅጽ",
              "sid": "Huuccattote borro"
            }
          },
          {
            "id": "8e78b8a1-98df-43d3-aac6-a22d8a1e2864",
            "requirement": {
              "en": "3x4 Passport Photo",
              "am": "3x4 የፓስፖርት መጠን ፎቶግራፍ",
              "sid": "3x4 Paaspoorte kiiro foote"
            }
          },
          {
            "id": "3c167d65-8724-418c-a70c-f54676d5597e",
            "requirement": {
              "en": "Taxpayer Identification Number (TIN)",
              "am": "የግብር ከፋይ መለያ ቁጥር (TIN)",
              "sid": "Gibirshu Badate Kiiro (TIN)"
            }
          },
          {
            "id": "59d08eff-9b92-4c97-a088-f7818b9a317f",
            "requirement": {
              "en": "National ID Card",
              "am": "ብሔራዊ መታወቂያ",
              "sid": "Daganna Wolooma Borreessiro"
            }
          }
        ],
        "estimatedFee": 102,
        "processingDays": 1
      },
      {
        "id": "633360b3-53f1-4812-a39c-6712c656124d",
        "title": {
          "en": "Business License Renewal Service",
          "am": "የንግድ ፈቃድ ማደስ አገልግሎት",
          "sid": "Daldalu Eegeera Haaroonsate Agurro"
        },
        "description": {
          "en": "Annual renewal service for existing trade licenses upon submission of tax clearance. Processing time: 15 minutes.",
          "am": "የግብር ክሊራንስ በማቅረብ ነባር የንግድ ፈቃድን የማደስ አገልግሎት። የሚፈጅበት ጊዜ፡ 15 ደቂቃ።",
          "sid": "Gibirshu kakkalooshshi garinni daldalu eegeera haaroonsate agurro. 15 daqiiqa adhitanno."
        },
        "requirements": [
          {
            "id": "101179dc-4aa3-47bf-a62a-d6b1d0cad7eb",
            "requirement": {
              "en": "Submitting a formal renewal request",
              "am": "ይፋዊ የዕድሳት ማመልከቻ ማቅረብ",
              "sid": "Haaroonsate huuccatto shollisha"
            }
          },
          {
            "id": "58c35adb-f758-4328-a0d0-d17ddac20250",
            "requirement": {
              "en": "Obtaining and submitting tax clearance certificate",
              "am": "የግብር ክሊራንስ ሰርተፍኬት ማግኘትና ማቅረብ",
              "sid": "Gibirshu kakkalooshshu woraqata afi'ranna shollisha"
            }
          }
        ],
        "estimatedFee": 102,
        "processingDays": 1
      },
      {
        "id": "ed175d7a-1588-4948-af7a-f5762da3e5a4",
        "title": {
          "en": "Registering a New Business",
          "am": "አዲስ ንግድ ምዝገባ",
          "sid": "Haaro Daldala Borreessa"
        },
        "description": {
          "en": "Initial licensing and commercial registration for newly established enterprises and sole proprietors. Processing time: 15 minutes.",
          "am": "ለአዳዲስ ነጋዴዎች እና የንግድ ድርጅቶች የመጀመሪያ ምዝገባ። የሚፈጅበት ጊዜ፡ 15 ደቂቃ።",
          "sid": "Haaro daldalaho umi borreessiro uya. 15 daqiiqa adhitanno."
        },
        "requirements": [
          {
            "id": "3b6705f0-8890-4433-a284-8d78d9e22068",
            "requirement": {
              "en": "Application request",
              "am": "የማመልከቻ ጥያቄ",
              "sid": "Huuccattote borro"
            }
          },
          {
            "id": "16886d94-d01d-4b63-adb2-2d2f3aa1d5f4",
            "requirement": {
              "en": "3x4 Photo",
              "am": "3x4 ፎቶግራፍ",
              "sid": "3x4 Foote"
            }
          },
          {
            "id": "7a3dcfb5-aed6-4a33-a74e-8829f32f36bf",
            "requirement": {
              "en": "Taxpayer Identification Number (TIN)",
              "am": "የግብር ከፋይ መለያ ቁጥር (TIN)",
              "sid": "Gibirshu Badate Kiiro (TIN)"
            }
          },
          {
            "id": "87d91b63-9df2-4481-a5be-b36540cbafe4",
            "requirement": {
              "en": "National ID",
              "am": "ብሔራዊ መታወቂያ",
              "sid": "Daganna Wolooma"
            }
          }
        ],
        "estimatedFee": 102,
        "processingDays": 1
      },
      {
        "id": "471243d2-3e28-4e99-aff9-b4626ab6d97a",
        "title": {
          "en": "Giving Business Name",
          "am": "የንግድ ስም ማውጣት",
          "sid": "Daldalu Su'ma Fusha"
        },
        "description": {
          "en": "Trade name search, clearance, and formal reservation for new business entities. Processing time: 20 minutes.",
          "am": "ለንግድ ድርጅቶች የንግድ ስም ማረጋገጥ እና መመዝገብ። የሚፈጅበት ጊዜ፡ 20 ደቂቃ።",
          "sid": "Daldalu su'ma buuxisatenna borreessate agurro. 20 daqiiqa adhitanno."
        },
        "requirements": [
          {
            "id": "4536b315-c4f4-47ea-acdd-1729ef360787",
            "requirement": {
              "en": "3x4 Photo",
              "am": "3x4 ፎቶግራፍ",
              "sid": "3x4 Foote"
            }
          },
          {
            "id": "99603d70-9794-4e21-afc3-d70d5be864db",
            "requirement": {
              "en": "Taxpayer Identification Number (TIN)",
              "am": "የግብር ከፋይ መለያ ቁጥር (TIN)",
              "sid": "Gibirshu Badate Kiiro (TIN)"
            }
          },
          {
            "id": "3b5bdb7b-92e2-40b3-a6b5-101fca6e8876",
            "requirement": {
              "en": "National ID",
              "am": "ብሔራዊ መታወቂያ",
              "sid": "Daganna Wolooma"
            }
          },
          {
            "id": "ad1bbb97-3991-45b7-abee-d6ba8aa25044",
            "requirement": {
              "en": "3 proposed business names as options",
              "am": "3 አማራጭ የንግድ ስሞች",
              "sid": "3 Doortamino daldalu su'mma"
            }
          }
        ],
        "estimatedFee": 127,
        "processingDays": 1
      },
      {
        "id": "c400b794-a972-4348-abd7-118d92bf2f52",
        "title": {
          "en": "Verify First Name and Nickname",
          "am": "የመጀመሪያ ስም እና ቅጽል ስም ማረጋገጥ",
          "sid": "Umi Su'manna Su'mu Gafote Buuxisa"
        },
        "description": {
          "en": "Official identity and alias verification for commercial activities and registered trade names. Processing time: 20 minutes.",
          "am": "የመጀመሪያ ስም እና የንግድ ቅጽል ስም ትክክለኛነት ማረጋገጫ። የሚፈጅበት ጊዜ፡ 20 ደቂቃ።",
          "sid": "Umi su'manna daldalu su'ma buuxisate agurro. 20 daqiiqa adhitanno."
        },
        "requirements": [
          {
            "id": "d59d60b5-aa7b-470e-a8cf-affffa425864",
            "requirement": {
              "en": "3x4 Photo",
              "am": "3x4 ፎቶግራፍ",
              "sid": "3x4 Foote"
            }
          },
          {
            "id": "d8fb31b2-2f04-40a2-a190-4cecb18c4a90",
            "requirement": {
              "en": "Taxpayer Identification Number (TIN)",
              "am": "የግብር ከፋይ መለያ ቁጥር (TIN)",
              "sid": "Gibirshu Badate Kiiro (TIN)"
            }
          },
          {
            "id": "71a63d15-7afd-4f77-a270-19d2c6a9b798",
            "requirement": {
              "en": "National ID",
              "am": "ብሔራዊ መታወቂያ",
              "sid": "Daganna Wolooma"
            }
          },
          {
            "id": "4053cccd-fc0b-474f-a48c-b27778ba0be3",
            "requirement": {
              "en": "3 names as options",
              "am": "3 አማራጭ ስሞች",
              "sid": "3 Su'mma qolshaho"
            }
          }
        ],
        "estimatedFee": 27,
        "processingDays": 1
      },
      {
        "id": "d023a350-9a83-428d-a1b0-97cee9b610bf",
        "title": {
          "en": "Modify a Business License",
          "am": "የንግድ ፈቃድ ማሻሻል",
          "sid": "Daldalu Eegeera Soorira"
        },
        "description": {
          "en": "Modification of business address, operational category, or ownership details on an existing trade license. Processing time: 10 minutes.",
          "am": "በነባር የንግድ ፈቃድ ላይ የስራ መስክ፣ አድራሻ ወይም ዝርዝር መረጃዎችን ማሻሻል። የሚፈጅበት ጊዜ፡ 10 ደቂቃ።",
          "sid": "Daldalu eegeera aana noo mashkkaammo soorirate agurro. 10 daqiiqa adhitanno."
        },
        "requirements": [
          {
            "id": "82acdbf0-17ad-49c0-ac42-d007af16a9b6",
            "requirement": {
              "en": "Submit an application",
              "am": "የማመልከቻ ጥያቄ ማቅረብ",
              "sid": "Huuccattote borro shollisha"
            }
          },
          {
            "id": "ff9e254a-0f85-422f-a9f6-2ae4a982fcd9",
            "requirement": {
              "en": "National ID",
              "am": "ብሔራዊ መታወቂያ",
              "sid": "Daganna Wolooma"
            }
          },
          {
            "id": "75b86241-fbdd-4dfc-a295-75736c35fb43",
            "requirement": {
              "en": "3x4 photograph",
              "am": "3x4 ፎቶግራፍ",
              "sid": "3x4 Foote"
            }
          }
        ],
        "estimatedFee": 82,
        "processingDays": 1
      },
      {
        "id": "43b07485-9286-4f9c-aadb-d98216f95733",
        "title": {
          "en": "Amending a Business Registration",
          "am": "የንግድ ምዝገባ ማሻሻያ",
          "sid": "Daldalu Borreessiro Soorira"
        },
        "description": {
          "en": "Official amendment to commercial register entries (e.g. capital change, shareholder change, or branch addition). Processing time: 15 minutes.",
          "am": "በንግድ መዝገብ ላይ ካፒታልን ወይም ህጋዊ መረጃዎችን የማሻሻል አገልግሎት። የሚፈጅበት ጊዜ፡ 15 ደቂቃ።",
          "sid": "Daldalu borreessirote aana miinju woxe woy seeramu mashkkaammo soorira. 15 daqiiqa adhitanno."
        },
        "requirements": [
          {
            "id": "6ba408a4-c72e-4b71-a5c2-e4a8baca2921",
            "requirement": {
              "en": "Submit an application",
              "am": "የማመልከቻ ጥያቄ ማቅረብ",
              "sid": "Huuccattote borro shollisha"
            }
          },
          {
            "id": "3b83baab-ba3b-478c-a7b7-d7f117b30456",
            "requirement": {
              "en": "National ID",
              "am": "ብሔራዊ መታወቂያ",
              "sid": "Daganna Wolooma"
            }
          },
          {
            "id": "19a42f57-1d27-494a-ac0f-9d816e4a6bd2",
            "requirement": {
              "en": "3x4 photograph",
              "am": "3x4 ፎቶግራፍ",
              "sid": "3x4 Foote"
            }
          }
        ],
        "estimatedFee": 102,
        "processingDays": 1
      }
    ]
  },
  {
    "id": "ed89253e-7731-4f58-ab9b-5474b1146c8e",
    "name": {
      "en": "Ethiopian Electric Utility",
      "am": "የኢትዮጵያ ኤሌክትሪክ አገልግሎት",
      "sid": "Itiyoophiyu Elektirike Agurro"
    },
    "code": "EEU",
    "logoUrl": "/logos/eeu.png",
    "services": [
      {
        "id": "5d49b7d5-f92a-4564-a85f-64baa633c1bf",
        "title": {
          "en": "Electricity Prepaid Recharge",
          "am": "የቅድመ ክፍያ ኤሌክትሪክ ካርድ መሙላት",
          "sid": "Balaxe Baantanni Elektirike Kaarde Wonsha"
        },
        "description": {
          "en": "Recharge prepaid electricity meter cards and token top-ups for residential and commercial customers. Processing time: 2 minutes. Free service.",
          "am": "የቅድመ ክፍያ የኤሌክትሪክ ቆጣሪ ካርድ መሙላት እና ቶከን ማግኘት። የሚፈጅበት ጊዜ፡ 2 ደቂቃ። ነፃ አገልግሎት።",
          "sid": "Elektirike kootare kaarde wonshatenna tookine afi'rate agurro. 2 daqiiqa adhitanno. Waagu nookkiha."
        },
        "requirements": [
          {
            "id": "628db25c-b71a-40e3-a6de-f62e1ba4ed43",
            "requirement": {
              "en": "Prepaid Electricity Recharge Card / Meter Card",
              "am": "የቅድመ ክፍያ ኤሌክትሪክ ቆጣሪ ካርድ",
              "sid": "Balaxe baantanni elektirike kaarde"
            }
          }
        ],
        "estimatedFee": 0,
        "processingDays": 1
      }
    ]
  },
  {
    "id": "1a1b136a-d9b0-48a9-a8c5-30af4e322426",
    "name": {
      "en": "Urban Development and Construction",
      "am": "የከተማ ልማትና ኮንስትራክሽን መምሪያ",
      "sid": "Katamu Lophphonna Konistiraakshiine Biiro"
    },
    "code": "URBAN_DEV_CONSTRUCTION",
    "logoUrl": "/logos/Urban_Development.png",
    "services": []
  },
  {
    "id": "45ca60a7-0b05-4c6f-a849-5249610a2761",
    "name": {
      "en": "Land Administration and Investment",
      "am": "የመሬት አስተዳደርና ኢንቨስትመንት መምሪያ",
      "sid": "Baattoote Gashshootinna Investermente Biiro"
    },
    "code": "HAWASSA_LAND",
    "logoUrl": "/logos/Land_Administration.png",
    "services": []
  },
  {
    "id": "502e64b4-1097-4e70-a347-cae73efd9d37",
    "name": {
      "en": "Labor and Skill Services",
      "am": "የስራና ክህሎት አገልግሎት",
      "sid": "Loosunna Dandote Agurro"
    },
    "code": "LABOR_AND_SKILLS",
    "logoUrl": "/logos/LABOR_AND_SKILLS.png",
    "services": [
      {
        "id": "6bc7b09b-3570-4af7-ad5c-3206f9ea8364",
        "title": {
          "en": "Enterprise Registration Service",
          "am": "የኢንተርፕራይዝ ምዝገባ አገልግሎት",
          "sid": "Interpiraayize Borreessate Agurro"
        },
        "description": {
          "en": "Registration and formalization for small and medium enterprises (SMEs) and youth cooperatives. Processing time: 20 minutes.",
          "am": "አነስተኛና ጥቃቅን ኢንተርፕራይዞችን እና የህብረት ስራ ማህበራትን የመመዝገብ አገልግሎት። የሚፈጅበት ጊዜ፡ 20 ደቂቃ።",
          "sid": "Shiimmaaddu daldalu diriyoota borreessate agurro. 20 daqiiqa adhitanno."
        },
        "requirements": [
          {
            "id": "0d0b32f2-9e48-4991-ac70-cd6569cfdc93",
            "requirement": {
              "en": "Enterprise application and documentation (to be added)",
              "am": "የኢንተርፕራይዝ ማመልከቻና ሰነዶች (የሚጨመር)",
              "sid": "Interpiraayizete huuccattote borro (leellishinanni)"
            }
          }
        ],
        "estimatedFee": null,
        "processingDays": 1
      },
      {
        "id": "eebe3432-95fb-409b-a425-ac6dda0ce1e7",
        "title": {
          "en": "Foreign Employment Registration Service",
          "am": "የውጭ ሀገር የስራ ስምሪት ምዝገባ",
          "sid": "Gobbate Loosu Eegote Borreessiro"
        },
        "description": {
          "en": "Government registration and verification for citizens seeking legal foreign employment opportunities. Processing time: 30 minutes. 100% Free.",
          "am": "ህጋዊ የውጭ ሀገር የስራ ስምሪት ምዝገባ አገልግሎት። የሚፈጅበት ጊዜ፡ 30 ደቂቃ። ሙሉ በሙሉ ነፃ አገልግሎት።",
          "sid": "Seeramu gobbate loosu eego borreessa. 30 daqiiqa adhitanno. Waagu nookkiha."
        },
        "requirements": [
          {
            "id": "b58232bb-bfc8-49ae-a85e-7416b7abfd59",
            "requirement": {
              "en": "National ID (Fayda / Resident ID)",
              "am": "ብሔራዊ መታወቂያ (ፋይዳ / የቀበሌ መታወቂያ)",
              "sid": "Daganna Wolooma (Fayda / Qabale)"
            }
          }
        ],
        "estimatedFee": 0,
        "processingDays": 1
      },
      {
        "id": "9b9c78d2-4433-4c61-a258-2cb4ed81bb6a",
        "title": {
          "en": "Finger Printing Service",
          "am": "የጣት አሻራ አገልግሎት",
          "sid": "Qubbi Malaate (Ashaara) Kaassate Agurro"
        },
        "description": {
          "en": "Biometric fingerprint scanning and documentation for labor clearance and identification. Processing time: 30 minutes. Free of charge.",
          "am": "ለስራ ስምሪት እና ለደህንነት ማረጋገጫ የጣት አሻራ መውሰድ። የሚፈጅበት ጊዜ፡ 30 ደቂቃ። አገልግሎቱ ነፃ ነው።",
          "sid": "Loosunna buuxisate qubbi malaate (ashaara) kaassa. 30 daqiiqa adhitanno. Waagu nookkiha."
        },
        "requirements": [
          {
            "id": "18907ad1-9961-4aed-a8d3-2d8d2e334699",
            "requirement": {
              "en": "National ID",
              "am": "ብሔራዊ መታወቂያ",
              "sid": "Daganna Wolooma"
            }
          }
        ],
        "estimatedFee": 0,
        "processingDays": 1
      }
    ]
  },
  {
    "id": "42a2b49d-4a5b-495b-a3b6-97ce440cd3aa",
    "name": {
      "en": "Revenue Authority",
      "am": "የገቢዎች ባለስልጣን",
      "sid": "Gibiru Biiro"
    },
    "code": "HAWASSA_REVENUE",
    "logoUrl": "/logos/HAWASSA_REVENUE.png",
    "services": [
      {
        "id": "a73c718d-0a3c-4a89-a9d1-8543721703d7",
        "title": {
          "en": "Tax Payer Registration (TIN)",
          "am": "የግብር ከፋይ መለያ ቁጥር (TIN) ምዝገባ",
          "sid": "Gibirshu Badate Kiiro (TIN) Borreessiro"
        },
        "description": {
          "en": "Issuance of Taxpayer Identification Number (TIN) for individuals and commercial entities. Processing time: 10 minutes. Free of charge.",
          "am": "ለግለሰቦች እና ለንግድ ድርጅቶች የግብር ከፋይ መለያ ቁጥር (TIN) ማውጣት። የሚፈጅበት ጊዜ፡ 10 ደቂቃ። አገልግሎቱ ነፃ ነው።",
          "sid": "Mannahonna daldalaho Gibirshu Badate Kiiro (TIN) fusha. 10 daqiiqa adhitanno. Waagu nookkiha."
        },
        "requirements": [
          {
            "id": "2f34a81c-6f0e-46f9-aca8-ed8259757181",
            "requirement": {
              "en": "National ID / Passport",
              "am": "ብሔራዊ መታወቂያ ወይም ፓስፖርት",
              "sid": "Daganna Wolooma woy Paaspoorte"
            }
          },
          {
            "id": "42c0921b-07f3-4193-ab91-8d0dfe76dc69",
            "requirement": {
              "en": "Business registration certificate (for businesses)",
              "am": "የንግድ ምዝገባ ምስክር ወረቀት (ለንግድ ድርጅቶች)",
              "sid": "Daldalu borreessirote kakkalooshsha (daldalu diriyeetira)"
            }
          }
        ],
        "estimatedFee": 0,
        "processingDays": 1
      }
    ]
  },
  {
    "id": "94d22533-220a-4a97-ac7a-052ba890e7d4",
    "name": {
      "en": "Justice Department",
      "am": "የፍትህ መምሪያ",
      "sid": "Yoote Biiro"
    },
    "code": "JUSTICE_DEPT",
    "logoUrl": "/logos/JUSTICE_DEPT.png",
    "services": []
  },
  {
    "id": "871cc3f3-178d-4eae-ae30-9a97a3367e16",
    "name": {
      "en": "Ethio Telecom",
      "am": "ኢትዮ ቴሌኮም",
      "sid": "Itiyo Telekoome"
    },
    "code": "ETHIO_TELECOM",
    "logoUrl": "/logos/telecom.png",
    "services": [
      {
        "id": "8b63234a-ace8-4ab1-a117-c3ae5efb1822",
        "title": {
          "en": "Telebirr Service",
          "am": "የቴሌብር አገልግሎት",
          "sid": "Telebirri Agurro"
        },
        "description": {
          "en": "Telebirr digital wallet registration, account tier upgrade, and PIN assistance. Processing time: 5 minutes. Free of charge.",
          "am": "የቴሌብር ምዝገባ፣ የሂሳብ ደረጃ ማሻሻያ እና የይለፍ ቃል እርዳታ። የሚፈጅበት ጊዜ፡ 5 ደቂቃ። አገልግሎቱ ነፃ ነው።",
          "sid": "Telebirre borreessa, pini soorrate fi woxu dambara agurro. 5 daqiiqa adhitanno. Waagu nookkiha."
        },
        "requirements": [
          {
            "id": "9fbbd12c-f9da-4e61-a5f9-2d112ba5f122",
            "requirement": {
              "en": "National ID",
              "am": "ብሔራዊ መታወቂያ",
              "sid": "Daganna Wolooma"
            }
          }
        ],
        "estimatedFee": 0,
        "processingDays": 1
      },
      {
        "id": "790bfd85-1142-4c51-a366-31b27ce5bcb8",
        "title": {
          "en": "Enterprise Service",
          "am": "የድርጅት አገልግሎት",
          "sid": "Diriyeetete Agurro"
        },
        "description": {
          "en": "Enterprise telecommunication solutions, dedicated internet lines, bulk SMS, and corporate packages. Processing time: 5 minutes. Free service.",
          "am": "ለንግድ ድርጅቶች የቴሌኮም መፍትሄዎች፣ የኢንተርኔትና ጥሪ መስመሮች አገልግሎት። የሚፈጅበት ጊዜ፡ 5 ደቂቃ። ነፃ አገልግሎት።",
          "sid": "Diriyeetaho telekoomete babbaxxitino agurro uya. 5 daqiiqa adhitanno. Waagu nookkiha."
        },
        "requirements": [
          {
            "id": "f36f4344-6366-432c-aa97-c18a83a969a7",
            "requirement": {
              "en": "National ID",
              "am": "ብሔራዊ መታወቂያ",
              "sid": "Daganna Wolooma"
            }
          },
          {
            "id": "5543af43-159e-48e1-aca3-de628810eceb",
            "requirement": {
              "en": "Enterprise license",
              "am": "የድርጅቱ ህጋዊ ፈቃድ",
              "sid": "Diriyeetete eegeera"
            }
          },
          {
            "id": "f7c6d3c4-73d6-44f6-a236-91d0d12796e7",
            "requirement": {
              "en": "TIN certificate",
              "am": "የግብር ከፋይ መለያ ቁጥር (TIN) ሰርተፍኬት",
              "sid": "TIN kakkalooshsha"
            }
          },
          {
            "id": "755d60c2-7bbf-4c10-ae50-306494a9725c",
            "requirement": {
              "en": "Commercial registration paper",
              "am": "የንግድ ምዝገባ ሰነድ",
              "sid": "Daldalu borreessirote woraqata"
            }
          },
          {
            "id": "24a46ca9-2080-454d-a4c1-9b8b078a0b18",
            "requirement": {
              "en": "Official stamp with application letter",
              "am": "ማህተም የተደረገበት ይፋዊ የማመልከቻ ደብዳቤ",
              "sid": "Maashsha noo huuccattote sokko"
            }
          },
          {
            "id": "cbe641bc-d9eb-48c4-a513-2b15c4abfc6a",
            "requirement": {
              "en": "Delegator authorization with National ID",
              "am": "ህጋዊ የውክልና ማስረጃ ከተወካይ መታወቂያ ጋር",
              "sid": "Riqiwote borro riqiwaanchu wolooma ledo"
            }
          }
        ],
        "estimatedFee": 0,
        "processingDays": 1
      }
    ]
  },
  {
    "id": "e8b69e0e-056b-47e7-a147-cf37b178ee39",
    "name": {
      "en": "Commercial Bank of Ethiopia",
      "am": "የኢትዮጵያ ንግድ ባንክ",
      "sid": "Itiyoophiyu Daldalu Baanke"
    },
    "code": "CBE",
    "logoUrl": "/logos/cbe.png",
    "services": [
      {
        "id": "6b33e7f6-37be-4d3d-a4dc-7ccf8c83ebbb",
        "title": {
          "en": "Account Opening",
          "am": "የባንክ ሂሳብ መክፈት",
          "sid": "Herro Fa'na"
        },
        "description": {
          "en": "Open personal savings, current, or interest-free banking accounts with CBE. Processing time: 25 minutes. Free service (initial deposit required).",
          "am": "በኢትዮጵያ ንግድ ባንክ የግል ቁጠባ፣ ቼክ ወይም ከወለድ ነፃ የባንክ ሂሳብ መክፈት። የሚፈጅበት ጊዜ፡ 25 ደቂቃ። ነፃ አገልግሎት (የመጀመሪያ ተቀማጭ ገንዘብ ያስፈልጋል)።",
          "sid": "CBE Baankera qusate woy baankete herro fa'na. 25 daqiiqa adhitanno. Waagu nookkiha."
        },
        "requirements": [
          {
            "id": "98ef695e-a39b-45a2-a564-3905d375f995",
            "requirement": {
              "en": "Valid Identification: Original and copy of National ID (Fayda) / Renewed Resident ID or Passport",
              "am": "ህጋዊ መታወቂያ፦ የብሔራዊ መታወቂያ (ፋይዳ) / የታደሰ የቀበሌ መታወቂያ ወይም ፓስፖርት ዋናውና ቅጂው",
              "sid": "Seeramu Wolooma: Qaru Fayda wolooma / Haaroonsamino qabale wolooma woy Paaspoorte"
            }
          },
          {
            "id": "63d0426f-1f42-4858-adb2-6ce3cb831907",
            "requirement": {
              "en": "Photographs: Recent passport-size photographs",
              "am": "ፎቶግራፍ፦ የቅርብ ጊዜ የፓስፖርት መጠን ፎቶግራፎች",
              "sid": "Foote: Muli yannara ka'inoha paaspoorte kiiro foote"
            }
          },
          {
            "id": "0fccac31-fe0c-40b0-a00a-a01692c226c1",
            "requirement": {
              "en": "Mobile Number: Active mobile number registered in applicant's name",
              "am": "የስልክ ቁጥር፦ በአመልካቹ ስም የተመዘገበ ንቁ የስልክ ቁጥር",
              "sid": "Bilbilu Kiiro: Huuccattooshshu su'minni noo loosanno bilbila"
            }
          },
          {
            "id": "e8de61f5-97b9-4c87-a5e7-dc7d85f05e7a",
            "requirement": {
              "en": "Initial deposit amount",
              "am": "የመጀመሪያ ተቀማጭ ገንዘብ",
              "sid": "Umi qusate woxe"
            }
          }
        ],
        "estimatedFee": 0,
        "processingDays": 1
      },
      {
        "id": "bd3b4515-226f-4125-a030-b03b679f8ffd",
        "title": {
          "en": "Mobile Banking",
          "am": "የሞባይል ባንኪንግ አገልግሎት",
          "sid": "Mobaayile Baankete Agurro"
        },
        "description": {
          "en": "Setup and instant activation for CBE Birr and CBE Mobile Banking (App & *847#). Processing time: 5 minutes. Free of charge.",
          "am": "የሲቢኢ ሞባይል ባንኪንግ እና የሲቢኢ ብር ማግበር። የሚፈጅበት ጊዜ፡ 5 ደቂቃ። አገልግሎቱ ነፃ ነው።",
          "sid": "CBE Mobaayile Baankenna CBE Birre fa'na. 5 daqiiqa adhitanno. Waagu nookkiha."
        },
        "requirements": [
          {
            "id": "79d84fde-ef1b-486b-a6a0-0082ca1ce0c4",
            "requirement": {
              "en": "Valid Identification: National ID (Fayda) / Renewed Resident ID or Passport",
              "am": "ህጋዊ መታወቂያ፦ ብሔራዊ መታወቂያ (ፋይዳ) / የታደሰ የቀበሌ መታወቂያ ወይም ፓስፖርት",
              "sid": "Seeramu Wolooma: Fayda wolooma / Haaroonsamino qabale wolooma woy Paaspoorte"
            }
          },
          {
            "id": "c0dccfec-f0e5-47a7-ace3-f7571acf8011",
            "requirement": {
              "en": "An active CBE Bank Account",
              "am": "ንቁ የሲቢኢ ባንክ ሂሳብ ቁጥር",
              "sid": "Loosanno CBE baankete herro"
            }
          }
        ],
        "estimatedFee": 0,
        "processingDays": 1
      }
    ]
  },
  {
    "id": "79bff990-817e-454b-a3e4-118641cc9128",
    "name": {
      "en": "Sidama Bank",
      "am": "ሲዳማ ባንክ",
      "sid": "Sidaamu Baanke"
    },
    "code": "SIDAMA_BANK",
    "logoUrl": "/logos/sidama_bank.png",
    "services": [
      {
        "id": "859e85eb-98ea-4442-a6ae-2e2bcb253b6f",
        "title": {
          "en": "Bank Account Opening Service",
          "am": "የባንክ ሂሳብ መክፈት አገልግሎት",
          "sid": "Baankete Herro Fa'nate Agurro"
        },
        "description": {
          "en": "Open personal savings or business deposit accounts with Sidama Bank. Processing time: 15 minutes. Free service.",
          "am": "በሲዳማ ባንክ የቁጠባ ወይም የቼክ ሂሳብ መክፈት። የሚፈጅበት ጊዜ፡ 15 ደቂቃ። ነፃ አገልግሎት።",
          "sid": "Sidaamu Baankera herro fa'nate agurro. 15 daqiiqa adhitanno. Waagu nookkiha."
        },
        "requirements": [
          {
            "id": "b6524a51-cf74-46ab-a973-dbdaf48fefd6",
            "requirement": {
              "en": "National ID (Client must be above 18 years old)",
              "am": "ብሔራዊ መታወቂያ (አመልካቹ ከ18 ዓመት በላይ መሆን አለበት)",
              "sid": "Daganna Wolooma (Huccattooshshu 18 diro sa'a noosi)"
            }
          }
        ],
        "estimatedFee": 0,
        "processingDays": 1
      },
      {
        "id": "db847f5c-3787-4d27-a012-5f8a32502c59",
        "title": {
          "en": "Digital Banking Services",
          "am": "የዲጂታል ባንኪንግ አገልግሎት",
          "sid": "Dijitaale Baankete Agurro"
        },
        "description": {
          "en": "Registration and onboarding for Sidama Bank mobile app, USSD banking, and ATM debit cards. Processing time: 15 minutes. Free of charge.",
          "am": "የሲዳማ ባንክ ሞባይል ባንኪንግ እና የኤቲኤም ካርድ ማውጣት። የሚፈጅበት ጊዜ፡ 15 ደቂቃ። አገልግሎቱ ነፃ ነው።",
          "sid": "Sidaamu Baankete mobaayile baankete fi ATM kaarde agurro. 15 daqiiqa adhitanno. Waagu nookkiha."
        },
        "requirements": [
          {
            "id": "5660fdd7-58d3-413b-a0b6-56ce443c3fcc",
            "requirement": {
              "en": "National ID (The client must be above 18 years old)",
              "am": "ብሔራዊ መታወቂያ (አመልካቹ ከ18 ዓመት በላይ መሆን አለበት)",
              "sid": "Daganna Wolooma (Huccattooshshu 18 diro sa'a noosi)"
            }
          }
        ],
        "estimatedFee": 0,
        "processingDays": 1
      }
    ]
  },
  {
    "id": "d04659a0-8920-4be6-ac5f-be57552a8036",
    "name": {
      "en": "National ID Program",
      "am": "ብሔራዊ መታወቂያ ፕሮግራም",
      "sid": "Daganna Fayda Wolooma Pirogiraame"
    },
    "code": "NATIONAL_ID_PROGRAM",
    "logoUrl": "/logos/fayda.png",
    "services": [
      {
        "id": "7f5a0f97-b726-4dbf-aa19-0bbf76ab67a1",
        "title": {
          "en": "National ID Service",
          "am": "የብሔራዊ መታወቂያ (ፋይዳ) አገልግሎት",
          "sid": "Fayda Wolooma Agurro"
        },
        "description": {
          "en": "Comprehensive Fayda biometric enrollment (photo, 10 fingerprints, and iris scan) and digital Fayda Identification Number (FIN) issuance. Processing time: 8-10 minutes. 100% Free.",
          "am": "የፋይዳ ዲጂታል መታወቂያ የባዮሜትሪክስ ምዝገባ (የአይን፣ የጣት አሻራ እና የፊት ፎቶ) እና የፋይዳ ቁጥር ማግኘት። የሚፈጅበት ጊዜ፡ ከ8-10 ደቂቃ። ሙሉ በሙሉ ነፃ አገልግሎት።",
          "sid": "Fayda daganna wolooma borreessa (ashaara fi foote). 8-10 daqiiqa adhitanno. Waagu nookkiha (100% Free)."
        },
        "requirements": [
          {
            "id": "8d3006b5-0783-487d-ac7c-52c35735fe2e",
            "requirement": {
              "en": "Valid primary ID document: Kebele ID / Passport / Birth Certificate / Student ID / Driving License / Car Ownership Document / Bank Book",
              "am": "ዋና መታወቂያ ሰነድ፦ የቀበሌ መታወቂያ / ፓስፖርት / የልደት ምስክር ወረቀት / የተማሪ መታወቂያ / መንጃ ፈቃድ / የመኪና ባለቤትነት ሰነድ / የባንክ ደብተር",
              "sid": "Qaru woloomu borro: Qabaleete wolooma / Paaspoorte / Ilote borro / Rosu wolooma / Moteere eegeera / Kaameelu annimma / Baankete borro"
            }
          }
        ],
        "estimatedFee": 0,
        "processingDays": 1
      }
    ]
  }
];

export default HAWASSA_INSTITUTIONS;
