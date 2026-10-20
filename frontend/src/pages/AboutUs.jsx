import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import NewsSection from '../components/NewsSection';
import VideosSection from '../components/VideosSection';
import AnnouncementsSection from '../components/AnnouncementsSection';
import Chatbot from '../components/Chatbot';
import VIPTicket from '../components/VIPTicket';
import Footer from '../components/Footer';

const AboutUs = () => {
  const [language, setLanguage] = useState('English');

  // Listen for language changes from navbar
  useEffect(() => {
    const handleLanguageChange = (event) => {
      setLanguage(event.detail);
    };

    window.addEventListener('languageChange', handleLanguageChange);
    
    // Get initial language from localStorage
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    return () => {
      window.removeEventListener('languageChange', handleLanguageChange);
    };
  }, []);

  // Translations
  const translations = {
    English: {
      title: 'About Hawassa Mesob',
      subtitle: 'Your one-stop center for all government services in Hawassa City',
      tagline: 'Transforming public service delivery through innovation, efficiency, and dedication to serving Ethiopian residents.',
      missionTitle: 'Our Mission',
      missionText: 'Our mission is to simplify and modernize public service delivery by establishing a seamless, efficient, and secure one-stop service center where Ethiopian residents can access essential government and organizational services in a single location — reducing bureaucracy, enhancing efficiency, and fostering trust between residents and service providers through innovation, technology, and human-centered design.',
      visionTitle: 'Our Vision',
      visionText: 'Our vision is to become Africa\'s premier digital and physical service hub — seamlessly integrating multiple organizations into a single, efficient, and secure platform that transforms public service delivery, enhances resident satisfaction, and sets a global benchmark for one-stop government service centers.'
    },
    Amharic: {
      title: 'ስለ ሀዋሳ መሶብ',
      subtitle: 'የሁሉም የመንግስት አገልግሎቶች አንድ ማዕከል በሀዋሳ ከተማ',
      tagline: 'የህዝብ አገልግሎት አቅርቦትን በአዳዲስ ነገሮች፣ ቅልጡፍነት እና የኢትዮጵያ ዜጎችን ለመገለገል ቁርጠኝነት በመጠቀም ለውጥ እናድርገዋለን።',
      missionTitle: 'ተልዕኮአችን',
      missionText: 'የኢትዮጵያ ነዋሪዎች አስፈላጊ የመንግስት እና ድርጅታዊ አገልግሎቶችን በአንድ ቦታ ማግኘት የሚችሉበት - ቢሮክራሲ በመቀነስ፣ ቅልጥፍናን በማሳደግ እና በነዋሪዎች እና በአገልግሎት ሰጪዎች መካከል በፈጠራ፣ በቴክኖሎጂ እና ሰውን ያማከለ ንድፍ የሚያገኙበት እንከን የለሽ፣ ቀልጣፋ እና ደህንነቱ የተጠበቀ የአንድ ማቆሚያ አገልግሎት ማዕከል በማቋቋም የህዝብ አገልግሎት አሰጣጥን ማቃለል እና ማዘመን ተልዕኮአችን ነው።',
      visionTitle: 'ራዕያችን',
      visionText: 'ራዕያችን የአፍሪካ ቀዳሚ የዲጂታል እና የአካል አገልግሎት ማዕከል መሆን ነው - ብዙ ድርጅቶችን ያለችግር ወደ አንድ፣ ቀልጣፋ እና ደህንነቱ የተጠበቀ መድረክ በማዋሃድ የህዝብ አገልግሎት አሰጣጥን የሚቀይር፣ የነዋሪዎችን እርካታ የሚያጎለብት እና የአንድ ጊዜ ማቆሚያ የመንግስት አገልግሎት ማእከላት አለም አቀፍ መመዘኛ የሚያስቀምጥ።'
    },
    Sidama: {
      title: 'Hawassa Mesob Mashala',
      subtitle: 'Hawassa Katama mootummaa oosuwaa hunda mittu darga',
      tagline: 'Umaayi oosuwaa loosi\'te, aymi hiikkamino, Ityophiyaa mannu oosate hasaawate beekko gede, haroonsi\'te, looissamino, kiiro garincho woote.',
      missionTitle: 'Noo Kiiro',
      missionText: 'Noo kiiro Ityophiyaa mannu hullufa mootummaa oosuwaa mittu darga afino garincho foichchoote, biyorokraasiyye foichchoote, aymi hiikkamino gochchate, mannunna oosuwaa looissoonsanni umaayi, teknolojiyye, mannu wolte-fokka ikkiro borro shiiqqa woliino albaancha umi daana.',
      visionTitle: 'Noo Hara',
      visionText: 'Noo hara Afrikaa hullufa digitaalanna fiizikaala oosuwaa darga gidoonsote - baala biirota mittu aymi hiikkamino heeggera darga borro woloonse umaayi oosuwaa gochchate, mannu shiiqqa gochchate, mittu darga mootummaa oosuwaa aadunyaa fole gidoonsate.'
    }
  };

  const t = translations[language] || translations.English;
  return (
    <div className="min-h-screen transition-colors">
      <Navbar />
      <Chatbot />
      <VIPTicket />
      
      {/* Page Header */}
      <div className="pt-24 pb-12 px-6 bg-gradient-to-br from-[#294491] to-[#CB9D2A]">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-4">{t.title}</h1>
          <p className="text-xl text-white/90 mb-3">
            {t.subtitle}
          </p>
          <p className="text-lg text-white/80 max-w-4xl mx-auto">
            {t.tagline}
          </p>
        </div>
      </div>

      {/* Mission and Vision Cards */}
      <section className="py-16 px-6 bg-white dark:bg-[#0F1419] transition-colors">
        <div className="max-w-7xl mx-auto space-y-7">
          {/* Mission Card */}
          <div className="relative w-full min-h-[200px] bg-gray-50 dark:bg-[#1F2A39] rounded-[18px] border-2 border-gray-200 dark:border-[#2D3748] p-6 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 cursor-pointer overflow-hidden">
            {/* Blue Top Border Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-t-[18px]"></div>
            
            <div className="flex items-start gap-3.5">
              {/* Icon Container */}
              <div className="flex-shrink-0 w-[44px] h-[44px] bg-[#3B82F6] rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="8" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="11" strokeWidth="2"/>
                </svg>
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <h2 className="text-[38px] font-bold text-gray-900 dark:text-[#F8FAFC] mb-2.5 leading-tight">
                  {t.missionTitle}
                </h2>
                <p className="text-[24px] text-gray-700 dark:text-[#CBD5E1] leading-[1.5] font-normal">
                  {t.missionText}
                </p>
              </div>
            </div>
          </div>

          {/* Vision Card */}
          <div className="relative w-full min-h-[200px] bg-gray-50 dark:bg-[#1F2A39] rounded-[18px] border-2 border-gray-200 dark:border-[#2D3748] p-6 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 cursor-pointer overflow-hidden">
            {/* Orange/Yellow Top Border Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F59E0B] to-[#EAB308] rounded-t-[18px]"></div>
            
            <div className="flex items-start gap-3.5">
              {/* Icon Container */}
              <div className="flex-shrink-0 w-[44px] h-[44px] bg-[#F59E0B] rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <h2 className="text-[38px] font-bold text-gray-900 dark:text-[#F8FAFC] mb-2.5 leading-tight">
                  {t.visionTitle}
                </h2>
                <p className="text-[24px] text-gray-700 dark:text-[#CBD5E1] leading-[1.5] font-normal">
                  {t.visionText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* News Section */}
      <NewsSection />

      {/* Videos Section */}
      <VideosSection />

      {/* Announcements Section */}
      <AnnouncementsSection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AboutUs;
