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
      missionText: 'To establish a seamless, efficient, and secure one-stop service center where Ethiopian residents can access essential government and organizational services in a single location, reducing bureaucracy, enhancing service efficiency, and fostering trust between residents and service providers.',
      visionTitle: 'Our Vision',
      visionText: 'To become Ethiopia\'s premier digital and physical service hub, integrating multiple organizations into a single, efficient, and secure platform that transforms public service delivery, enhances resident satisfaction, and sets a global benchmark for one-stop government service centers.'
    },
    Amharic: {
      title: 'ስለ ሀዋሳ መሶብ',
      subtitle: 'የሁሉም የመንግስት አገልግሎቶች አንድ ማዕከል በሀዋሳ ከተማ',
      tagline: 'የህዝብ አገልግሎት አቅርቦትን በአዳዲስ ነገሮች፣ ቅልጡፍነት እና የኢትዮጵያ ዜጎችን ለመገለገል ቁርጠኝነት በመጠቀም ለውጥ እናድርገዋለን።',
      missionTitle: 'ተልእኮ',
      missionText: 'ኢትዮጵያውያን ዜጎች አስፈላጊ የመንግስት እና የድርጅት አገልግሎቶችን በአንድ ቦታ እንዲያገኙ፣ ባይሮክራሲ እንዲቀንስ፣ የአገልግሎት ቅልጡፍነት እንዲጨምር እና በዜጎች እና በአገልግሎት አቅራቢዎች መካከል እምነት እንዲፈጠር የሚያገለግል ምቹ፣ ቅልጡፍ እና ደህንነቱ የተጠበቀ የአንድ ማዕከል አገልግሎት ማዕከል ለመፍጠር።',
      visionTitle: 'ራዕይ',
      visionText: 'ኢትዮጵያ የዲጂታል እና የፊዚካል አገልግሎት ማዕከል ለመሆን፣ ብዙ ድርጅቶችን በአንድ ቅልጡፍ እና ደህንነቱ የተጠበቀ መድረኳ ላይ በማዋሃድ የህዝብ አገልግሎት አቅርቦትን ለመለወጥ፣ የዜጎች እርካታ ለመጨመር እና የአንድ ማዕከል የመንግስት አገልግሎት ማዕከሎች ዓለም አቀፍ መስፈርት ለመዘጋጀት።'
    },
    Sidama: {
      title: 'Hawassa Mesob Mashala',
      subtitle: 'Hawassa Katama mootummaa oosuwaa hunda mittu darga',
      tagline: 'Umaayi oosuwaa loosi\'te, aymi hiikkamino, Ityophiyaa mannu oosate hasaawate beekko gede, haroonsi\'te, looissamino, kiiro garincho woote.',
      missionTitle: 'Noo Kiiro',
      missionText: 'Ityophiyaa mannu hullufa woote mootummaa oosuwaa mittu darga afino garincho, aydiide foichchoote, oosuwaa hiiqqanna gochchate, mannu noo oosuwaa looissoonsanni shiiqqa woliino albaancha kiiro.',
      visionTitle: 'Noo Hara',
      visionText: 'Ityophiyaa digitaalanna fiizikaala oosuwaa darga gidoonsote, baala biirota mittu hiikkamino heeggera darga borro woloonse, umaayi oosuwaa loosi\'te gochchate, mannu shiiqqa gochchate, mittu darga mootummaa oosuwaa darga aadunyaa fole gochchate.'
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
      <section className="py-16 px-6 bg-white dark:bg-[#172231] transition-colors">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Mission Card */}
          <div className="w-full min-h-[280px] bg-[#1F2A39] rounded-[20px] border-2 border-[#334155] p-10 transition-all hover:shadow-2xl">
            <div className="flex items-start gap-5">
              {/* Icon Container */}
              <div className="flex-shrink-0 w-[48px] h-[48px] bg-[#2563EB] rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="8" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="11" strokeWidth="2"/>
                </svg>
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
                  {t.missionTitle}
                </h2>
                <p className="text-lg text-gray-300 leading-[1.6]">
                  {t.missionText}
                </p>
              </div>
            </div>
          </div>

          {/* Vision Card */}
          <div className="w-full min-h-[280px] bg-[#1F2A39] rounded-[20px] border-2 border-[#334155] p-10 transition-all hover:shadow-2xl">
            <div className="flex items-start gap-5">
              {/* Icon Container */}
              <div className="flex-shrink-0 w-[48px] h-[48px] bg-[#D97706] rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
                  {t.visionTitle}
                </h2>
                <p className="text-lg text-gray-300 leading-[1.6]">
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
