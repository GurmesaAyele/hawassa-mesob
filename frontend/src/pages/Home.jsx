import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Chatbot from '../components/Chatbot';
import VIPTicket from '../components/VIPTicket';
import InstitutionCard from '../components/InstitutionCard';
import InstitutionModal from '../components/InstitutionModal';
import Footer from '../components/Footer';
import { API_CONFIG, apiCall, getLocaleCode } from '../config/api';
import footerLogo from '../assets/images/hawasssa_mesob.png';
import heroImg from '../assets/hero.png';

// Import mesob images
import mesob1 from '../assets/images/mesob1.jfif';
import mesob2 from '../assets/images/mesob2.jfif';
import mesob3 from '../assets/images/mesob3.jfif';
import mesob4 from '../assets/images/mesob4.jfif';
import mesob5 from '../assets/images/mesob5.jfif';
import mesob6 from '../assets/images/mesob6.jfif';
import mesob7 from '../assets/images/mesob7.jfif';
import mesob8 from '../assets/images/mesob8.jfif';
import mesob9 from '../assets/images/mesob9.jfif';
import mesob10 from '../assets/images/mesob10.jfif';
import mesob11 from '../assets/images/mesob11.jfif';
import mesob12 from '../assets/images/mesob12.jfif';
import mesob13 from '../assets/images/mesob13.jfif';
import mesob14 from '../assets/images/mesob14.jfif';
import mesob15 from '../assets/images/mesob15.jfif';
import mesob16 from '../assets/images/mesob16.jfif';
import mesob17 from '../assets/images/mesob17.jfif';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState('English');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    verification: ''
  });
  const [verificationWord, setVerificationWord] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Institutions state
  const [institutions, setInstitutions] = useState([]);
  const [institutionsLoading, setInstitutionsLoading] = useState(false);
  const [institutionsError, setInstitutionsError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const itemsPerPage = 8; // 4 cards per row × 2 rows

  // Map state
  const [mapData, setMapData] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState(null);

  // Array of mesob images for slideshow
  const mesobImages = [
    mesob1, mesob2, mesob3, mesob4, mesob5, mesob6, mesob7, mesob8, mesob9,
    mesob10, mesob11, mesob12, mesob13, mesob14, mesob15, mesob16, mesob17
  ];

  // Image slideshow effect - change every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % mesobImages.length);
    }, 3000); // 3 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [mesobImages.length]);

  // Fetch institutions from API
  useEffect(() => {
    fetchInstitutions();
  }, [language]); // Re-fetch when language changes

  // Fetch map data from API
  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    setMapLoading(true);
    setMapError(null);

    try {
      const fullUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MAP}`;
      console.log('=== MAP API CALL ===');
      console.log('Fetching map data from:', fullUrl);
      
      const data = await apiCall(API_CONFIG.ENDPOINTS.MAP);
      
      console.log('Map API raw response:', data);
      console.log('Map data type:', typeof data);
      console.log('Map data keys:', data ? Object.keys(data) : 'null');
      
      // Handle different response structures
      let processedData = data;
      
      // Check if data is wrapped in a "data" property
      if (data && data.data) {
        processedData = data.data;
        console.log('Using data.data:', processedData);
      }
      
      // Check if it's an array (take first item)
      if (Array.isArray(processedData) && processedData.length > 0) {
        processedData = processedData[0];
        console.log('Using first array item:', processedData);
      }
      
      console.log('Final processed map data:', processedData);
      
      setMapData(processedData);
      setMapLoading(false);
    } catch (error) {
      console.error('Error fetching map data:', error);
      console.error('Error details:', error.message, error.stack);
      setMapError('Failed to load map data. Please try again later.');
      setMapLoading(false);
    }
  };

  const fetchInstitutions = async () => {
    setInstitutionsLoading(true);
    setInstitutionsError(null);

    try {
      const locale = getLocaleCode(language);
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INSTITUTIONS}?locale=${locale}`;
      console.log('Fetching institutions from:', url);
      
      // Fetch institutions from your backend API
      const data = await apiCall(`${API_CONFIG.ENDPOINTS.INSTITUTIONS}?locale=${locale}`);
      console.log('Institutions API response:', data);
      
      // Check if data is wrapped in a property like "data" or "institutions"
      let institutionsArray = data;
      if (data.data) {
        institutionsArray = data.data;
      } else if (data.institutions) {
        institutionsArray = data.institutions;
      }
      
      console.log('Institutions array:', institutionsArray);
      
      // Ensure data is an array
      setInstitutions(Array.isArray(institutionsArray) ? institutionsArray : []);
      setInstitutionsLoading(false);
    } catch (error) {
      console.error('Error fetching institutions:', error);
      setInstitutionsError('Failed to load institutions. Please try again later.');
      setInstitutionsLoading(false);
      setInstitutions([]); // Set empty array on error
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(institutions.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInstitutions = institutions.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleInstitutionClick = async (institution) => {
    try {
      // Fetch full institution details with services (Option A - Recommended)
      const locale = getLocaleCode(language);
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INSTITUTIONS}/${institution.id}?locale=${locale}`;
      console.log('Fetching institution services from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Institution with services:', data);
      
      setSelectedInstitution(data);
    } catch (err) {
      console.error('Error fetching institution services:', err);
      // Fallback to showing institution without services
      setSelectedInstitution(institution);
    }
  };

  const handleCloseModal = () => {
    setSelectedInstitution(null);
  };

  // Generate random verification word on component mount
  useEffect(() => {
    const words = ['SECURE', 'VERIFY', 'HUMAN', 'ACCESS', 'TRUST', 'SAFETY'];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setVerificationWord(randomWord);
  }, []);

  // Hero section translations
  const heroTranslations = {
    English: {
      mainHeading: 'All Services, One Place',
      subtitle: 'Serving Hawassa City Residents',
      description: 'Access multiple city services faster, efficiently, and under one roof',
      searchPlaceholder: 'Search for Services or Organizations'
    },
    Amharic: {
      mainHeading: 'ሁሉም አገልግሎቶች ፣ በአንድ ቦታ',
      subtitle: 'ለሀዋሳ ከተማ ነዋሪዎች',
      description: 'በርካታ የከተማ አገልግሎቶችን በፍጥነት በተቀላጠፈ ሁኔታ በአንድ ጣራ ሥር ያግኙ',
      searchPlaceholder: 'የመንግስት አገልግሎት ይፈልጉ'
    },
    Sidama: {
      mainHeading: 'Baalu Oosuwa, Mittu Dargu', // TODO: Add Sidama translation
      subtitle: 'Hawassa Katama Mannu Oosate',
      description: 'Katama Oosuwa Baala, Albi Loosamme, Mittu Dargu Afiinni',
      searchPlaceholder: 'Gawajju Oosuwa woy Biiro Hasa'
    }
  };

  // Seamless Public Services section translations
  const servicesTranslations = {
    English: {
      seamless: 'Seamless',
      publicServices: 'Public Services',
      inCity: 'in Hawassa.',
      accessDesc: 'Access government services from 9 public institutions in one place.',
      exploreBtn: 'Explore Services',
      learnBtn: 'Learn More',
      // Feature cards
      digitalTitle: 'Digital Services',
      digitalDesc: 'Apply for permits online',
      supportTitle: 'Citizen Support',
      supportDesc: '24/7 assistance available',
      processingTitle: 'Quick Processing',
      processingDesc: 'Fast and efficient service'
    },
    Amharic: {
      // TODO: Add Amharic translations below
      seamless: 'ምቹ', // Add translation here
      publicServices: 'የሕዝብ አገልግሎት', // Add translation here
      inCity: 'በሀዋሳ ', // Add translation here
      accessDesc: '18 የመንግሥት ተቋማት አገልግሎቶችን በአንድ ማዕከል ያግኙ:: ', // Add translation here
      exploreBtn: 'አገልግሎቶችን ይመልከቱ', // Add translation here
      learnBtn: 'ተጨማሪ ይመልከቱ', // Add translation here
      // Feature cards
      digitalTitle: 'ድጅታል አገልግሎቶች', // Add translation here
      digitalDesc: 'በመረበ መቀመጫ ፍቃድ ያመልክቱ', // Add translation here
      supportTitle: 'የዜጋ ድጋፍ', // Add translation here
      supportDesc: '24/7 ድጋፍ ይገኛል', // Add translation here
      processingTitle: 'ፈጣን አገልግሎት', // Add translation here
      processingDesc: 'ፈጣን እና ቀልጣፋ አገልግሎት በአንድ ቦታ' // Add translation here
    },
    Sidama: {
      // TODO: Add Sidama translations below
      seamless: 'Seamless', // Add translation here
      publicServices: 'Public Services', // Add translation here
      inCity: 'in Hawassa.', // Add translation here
      accessDesc: 'Access government services from 9 public institutions in one place.', // Add translation here
      exploreBtn: 'Explore Services', // Add translation here
      learnBtn: 'Learn More', // Add translation here
      // Feature cards
      digitalTitle: 'Digital Services', // Add translation here
      digitalDesc: 'Apply for permits online', // Add translation here
      supportTitle: 'Citizen Support', // Add translation here
      supportDesc: '24/7 assistance available', // Add translation here
      processingTitle: 'Quick Processing', // Add translation here
      processingDesc: 'Fast and efficient service' // Add translation here
    }
  };

  // Contact form translations
  const contactTranslations = {
    English: {
      heading: 'Send Message',
      nameLabel: 'Name',
      namePlaceholder: 'Enter your name',
      emailLabel: 'Email',
      emailPlaceholder: 'Enter your email',
      phoneLabel: 'Phone',
      phonePlaceholder: 'Enter your phone number',
      messageLabel: 'Message',
      messagePlaceholder: 'Enter your message',
      verificationText: "Type the word you see below to verify you're human:",
      verificationPlaceholder: 'Enter the word',
      submitBtn: 'Send Message',
      required: '*'
    },
    Amharic: {
      // TODO: Add Amharic translations below
      heading: 'መልእክት ይላኩ', // Add translation here
      nameLabel: 'ስም *', // Add translation here
      namePlaceholder: 'ስምዎን ያስገቡ', // Add translation here
      emailLabel: 'ኢሜይል *', // Add translation here
      emailPlaceholder: 'ኢሜይልዎን ያስገቡ', // Add translation here
      phoneLabel: 'ስልክ', // Add translation here
      phonePlaceholder: 'ስልክ ቁጥርዎን ያስገቡ', // Add translation here
      messageLabel: 'መልእክት *', // Add translation here
      messagePlaceholder: 'መልእክትዎን ያስገቡ', // Add translation here
      verificationText: "እርስዎ ሰው መሆንዎን ለማረጋገጥ ከዚህ በታች የሚታየውን ቃል ይፃፉ:", // Add translation here
      verificationPlaceholder: 'ቃሉን ያስገቡ', // Add translation here
      submitBtn: 'መልእክት ላክ', // Add translation here
      required: '*' // Keep as is
    },
    Sidama: {
      // TODO: Add Sidama translations below
      heading: 'Send Message', // Add translation here
      nameLabel: 'Name', // Add translation here
      namePlaceholder: 'Enter your name', // Add translation here
      emailLabel: 'Email', // Add translation here
      emailPlaceholder: 'Enter your email', // Add translation here
      phoneLabel: 'Phone', // Add translation here
      phonePlaceholder: 'Enter your phone number', // Add translation here
      messageLabel: 'Message', // Add translation here
      messagePlaceholder: 'Enter your message', // Add translation here
      verificationText: "Type the word you see below to verify you're human:", // Add translation here
      verificationPlaceholder: 'Enter the word', // Add translation here
      submitBtn: 'Send Message', // Add translation here
      required: '*' // Keep as is
    }
  };

  // Map section translations
  const mapTranslations = {
    English: {
      title: 'Find Us',
      subtitle: 'Visit our location in Hawassa City',
      loading: 'Loading map data...',
      errorTitle: 'Failed to load map data',
      emptyMessage: 'Location information will be available soon',
      addressLabel: 'Address',
      phoneLabel: 'Phone',
      emailLabel: 'Email',
      workingHoursLabel: 'Working Hours',
      websiteBtn: 'Visit Website',
      plusCode: 'Plus Code',
      review: 'review',
      reviews: 'reviews'
    },
    Amharic: {
      title: 'አድራሻችን',
      subtitle: 'በሀዋሳ ከተማ ያለንበትን ቦታ ይጎብኙ',
      loading: 'የካርታ መረጃ በመጫን ላይ...',
      errorTitle: 'የካርታ መረጃ መጫን አልተቻለም',
      emptyMessage: 'የአድራሻ መረጃ በቅርቡ ይገኛል',
      addressLabel: 'አድራሻ',
      phoneLabel: 'ስልክ',
      emailLabel: 'ኢሜይል',
      workingHoursLabel: 'የስራ ሰዓታት',
      websiteBtn: 'ድህረ ገጽ ይጎብኙ',
      plusCode: 'ፕላስ ኮድ',
      review: 'ግምገማ',
      reviews: 'ግምገማዎች'
    },
    Sidama: {
      title: 'Nooni Qoola',
      subtitle: 'Hawassa Katama noo borrote hul',
      loading: 'Kaarta maalla laaqqa gede...',
      errorTitle: 'Kaarta maalla laaqqa dandaabokki',
      emptyMessage: 'Borro maalla ammayyo hegerannooti',
      addressLabel: 'Borro',
      phoneLabel: 'Bilbila',
      emailLabel: 'Imeela',
      workingHoursLabel: 'Oso Saatto',
      websiteBtn: 'Websaayiti Hul',
      plusCode: 'Palaasi Koodi',
      review: 'yaanni',
      reviews: 'yaannoha'
    }
  };

  useEffect(() => {
    // Check for saved language preference
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    // Listen for language change events from Navbar
    const handleLanguageChange = (event) => {
      setLanguage(event.detail);
    };

    window.addEventListener('languageChange', handleLanguageChange);

    return () => {
      window.removeEventListener('languageChange', handleLanguageChange);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (formData.verification.toUpperCase() !== verificationWord) {
      alert('Verification failed. Please enter the correct word.');
      return;
    }
    console.log('Form submitted:', formData);
    alert('Message sent successfully!');
    // Reset form
    setFormData({ name: '', email: '', phone: '', message: '', verification: '' });
    // Generate new verification word
    const words = ['SECURE', 'VERIFY', 'HUMAN', 'ACCESS', 'TRUST', 'SAFETY'];
    setVerificationWord(words[Math.floor(Math.random() * words.length)]);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const t = heroTranslations[language] || heroTranslations.English;
  const st = servicesTranslations[language] || servicesTranslations.English;
  const ct = contactTranslations[language] || contactTranslations.English;
  const mt = mapTranslations[language] || mapTranslations.English;

  return (
    <div className="min-h-screen">
      <Navbar />
      <Chatbot />
      <VIPTicket />
      
      {/* Hero Section */}
      <section id="home" className="min-h-screen relative">
        {/* Animated Slideshow Background */}
        <div className="absolute inset-0 overflow-hidden">
          {mesobImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                backgroundImage: `url(${image})`,
              }}
            />
          ))}
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-[#3d5a99]/70"></div>
        </div>

        <div className="relative pt-20 pb-16 px-6 min-h-screen flex items-center">
          <div className="max-w-5xl mx-auto text-center w-full">
            {/* Logo Image */}
            <div className="flex flex-col items-center mb-4">
              <div className="mb-3">
                <img 
                  src={footerLogo} 
                  alt="Hawassa Mesob Logo" 
                  className="w-[500px] h-auto mx-auto"
                />
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-6xl font-bold text-white mb-4 leading-tight">
              {t.mainHeading}
            </h1>

            {/* Subtitle */}
            <p className="text-2xl text-white mb-3">
              {t.subtitle}
            </p>

            {/* Description */}
            <p className="text-lg text-white/90 mb-6">
              {t.description}
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full px-8 py-5 pr-16 rounded-full text-white placeholder-white/80 border-none focus:outline-none focus:ring-2 focus:ring-white/30 text-lg"
                  style={{ backgroundColor: '#294491' }}
                />
                <button
                  type="submit"
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full hover:bg-white/10 transition-colors"
                >
                  <svg 
                    className="w-6 h-6 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2.5} 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                    />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Seamless Public Services Section */}
      <section className="relative py-20 px-6 overflow-hidden bg-white dark:bg-[#172231] transition-colors">
        {/* Background Glow Effects */}
        <div className="absolute top-20 right-40 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-20 left-40 w-96 h-96 bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[100px]"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left Column - Text Content */}
            <div>
              <h2 className="text-[clamp(2.5rem,4.5vw,3.75rem)] font-[800] leading-tight mb-5">
                <span className="text-gray-900 dark:text-[#F8FAFC]">{st.seamless}</span>
                <br />
                <span className="text-[#2563EB]">{st.publicServices}</span>
                <br />
                <span className="text-gray-900 dark:text-[#F8FAFC]">{st.inCity}</span>
              </h2>
              
              <p className="text-[clamp(1.125rem,1.75vw,1.5rem)] mb-7 text-gray-600 dark:text-[#CBD5E1]">
                {st.accessDesc}
              </p>

              {/* Buttons */}
              <div className="flex gap-4">
                <button 
                  onClick={() => scrollToSection('service-catalogue')}
                  className="px-7 py-3.5 rounded-xl font-semibold text-[19px] text-white transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg bg-[#2563EB]"
                >
                  {st.exploreBtn} →
                </button>
                <button 
                  onClick={() => scrollToSection('services')}
                  className="px-7 py-3.5 rounded-xl font-semibold text-[19px] transition-all duration-200 hover:translate-y-[-2px] bg-transparent text-gray-600 dark:text-[#CBD5E1] border border-gray-300 dark:border-[#334155]"
                >
                  {st.learnBtn}
                </button>
              </div>
            </div>

            {/* Right Column - Feature Panel */}
            <div className="rounded-2xl p-6 border bg-gray-100 dark:bg-[#1F2A39] border-gray-300 dark:border-[#334155]">
              <div className="space-y-4">
                {/* Digital Services Card */}
                <div className="p-5 rounded-xl transition-all duration-200 hover:translate-x-1 bg-blue-50 dark:bg-[#1E3A5F]">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-[#2563EB]">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-[19px] font-semibold mb-1 text-gray-900 dark:text-[#F8FAFC]">{st.digitalTitle}</h3>
                      <p className="text-[16px] text-gray-600 dark:text-[#CBD5E1]">{st.digitalDesc}</p>
                    </div>
                  </div>
                </div>

                {/* Citizen Support Card */}
                <div className="p-5 rounded-xl transition-all duration-200 hover:translate-x-1 bg-green-50 dark:bg-[#1E4D3B]">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-[#10B981]">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-[19px] font-semibold mb-1 text-gray-900 dark:text-[#F8FAFC]">{st.supportTitle}</h3>
                      <p className="text-[16px] text-gray-600 dark:text-[#CBD5E1]">{st.supportDesc}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Processing Card */}
                <div className="p-5 rounded-xl transition-all duration-200 hover:translate-x-1 bg-purple-50 dark:bg-[#3B2D5C]">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-[#8B5CF6]">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-[19px] font-semibold mb-1 text-gray-900 dark:text-[#F8FAFC]">{st.processingTitle}</h3>
                      <p className="text-[16px] text-gray-600 dark:text-[#CBD5E1]">{st.processingDesc}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Institutions Section */}
      <section id="institutions" className="min-h-screen bg-gray-50 dark:bg-[#1a1f2e] py-20 px-6 transition-colors">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-center text-gray-900 dark:text-white mb-6">Service Provider Institutions</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12 text-lg">
            Access services from these government institutions all in one place
          </p>

          {/* Loading State */}
          {institutionsLoading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 dark:border-blue-400"></div>
            </div>
          )}

          {/* Error State */}
          {institutionsError && (
            <div className="bg-red-500/10 dark:bg-red-900/20 border border-red-500 dark:border-red-800 rounded-lg p-6 text-center">
              <p className="text-red-600 dark:text-red-400 text-lg">{institutionsError}</p>
              <button
                onClick={fetchInstitutions}
                className="mt-4 px-6 py-2 bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!institutionsLoading && !institutionsError && institutions.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-500 dark:text-gray-400 text-xl">No institutions available at the moment.</p>
            </div>
          )}

          {/* Institutions Grid */}
          {!institutionsLoading && !institutionsError && institutions.length > 0 && (
            <div className="relative">
              {/* Navigation Arrows */}
              <div className="flex items-center justify-center mb-8">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className="p-3 rounded-full bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all mr-4"
                >
                  <svg className="w-6 h-6 text-gray-800 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <span className="text-gray-800 dark:text-white text-sm">
                  Page {currentPage + 1} of {totalPages}
                </span>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages - 1}
                  className="p-3 rounded-full bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all ml-4"
                >
                  <svg className="w-6 h-6 text-gray-800 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* 4 Cards per Row Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {currentInstitutions.map((institution) => (
                  <InstitutionCard
                    key={institution.id}
                    institution={institution}
                    onClick={handleInstitutionClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Institution Modal */}
      {selectedInstitution && (
        <InstitutionModal
          institution={selectedInstitution}
          onClose={handleCloseModal}
          language={language}
        />
      )}

      {/* Services Section */}
      <section id="services" className="min-h-screen bg-white dark:bg-gray-800 py-20 px-6 transition-colors">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-center text-gray-900 dark:text-white mb-6">Government Services</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12 text-lg">
            Access essential government services quickly and efficiently through our digital platform
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Service Cards */}
            {['Birth Certificate', 'ID Card', 'Business License', 'Building Permit', 'Health Services', 'Education', 'Utilities', 'Transportation'].map((service, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 hover:bg-[#3d5a99] hover:text-white transition-all group cursor-pointer">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-white">{service}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-white/90">Quick access to {service.toLowerCase()} services</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="min-h-screen py-20 px-6 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:bg-gradient-to-br dark:from-[#172231] dark:to-[#1C2839] transition-colors">
        {/* Background Glow Effects */}
        <div className="absolute top-20 right-40 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-20 left-40 w-96 h-96 bg-blue-600/10 dark:bg-blue-600/5 rounded-full blur-[100px]"></div>

        <div className="max-w-4xl mx-auto ml-20 relative z-10">
          {/* Contact Form */}
          <div className="rounded-3xl p-8 bg-white dark:bg-[#111827] border border-gray-200 dark:border-0 shadow-xl dark:shadow-none transition-colors">
            <h2 className="text-[38px] font-bold mb-6 text-gray-900 dark:text-[#F8FAFC]">{ct.heading}</h2>
            
            <form onSubmit={handleFormSubmit} className="space-y-5">
              {/* Name and Email Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[19px] mb-2 text-gray-700 dark:text-[#E2E8F0]">
                    {ct.nameLabel} <span className="text-red-600 dark:text-[#EF4444]">{ct.required}</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder={ct.namePlaceholder}
                    className="w-full px-4 py-3 rounded-xl border text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#9CA3AF] focus:outline-none focus:ring-2 transition-all bg-gray-50 dark:bg-[#1F2937] border-gray-300 dark:border-[#374151]"
                    style={{ fontSize: '16px' }}
                  />
                </div>
                <div>
                  <label className="block text-[19px] mb-2 text-gray-700 dark:text-[#E2E8F0]">
                    {ct.emailLabel} <span className="text-red-600 dark:text-[#EF4444]">{ct.required}</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder={ct.emailPlaceholder}
                    className="w-full px-4 py-3 rounded-xl border text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#9CA3AF] focus:outline-none focus:ring-2 transition-all bg-gray-50 dark:bg-[#1F2937] border-gray-300 dark:border-[#374151]"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[19px] mb-2 text-gray-700 dark:text-[#E2E8F0]">{ct.phoneLabel}</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder={ct.phonePlaceholder}
                  className="w-full px-4 py-3 rounded-xl border text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#9CA3AF] focus:outline-none focus:ring-2 transition-all bg-gray-50 dark:bg-[#1F2937] border-gray-300 dark:border-[#374151]"
                  style={{ fontSize: '16px' }}
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-[19px] mb-2 text-gray-700 dark:text-[#E2E8F0]">
                  {ct.messageLabel} <span className="text-red-600 dark:text-[#EF4444]">{ct.required}</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  placeholder={ct.messagePlaceholder}
                  className="w-full px-4 py-3 rounded-xl border text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#9CA3AF] focus:outline-none focus:ring-2 transition-all resize-none bg-gray-50 dark:bg-[#1F2937] border-gray-300 dark:border-[#374151]"
                  style={{ fontSize: '16px' }}
                />
              </div>

              {/* Human Verification */}
              <div className="rounded-xl p-5 bg-gray-100 dark:bg-[#1F2937] border border-gray-300 dark:border-[#374151] transition-colors">
                <p className="text-center mb-3 text-gray-700 dark:text-[#E2E8F0]" style={{ fontSize: '16px' }}>
                  {ct.verificationText}
                </p>
                
                {/* Verification Word Display */}
                <div className="flex justify-center mb-3">
                  <div className="bg-white px-6 py-3 rounded-lg">
                    <span className="text-2xl font-bold tracking-wider" style={{ 
                      color: '#000',
                      fontFamily: 'monospace',
                      letterSpacing: '6px'
                    }}>
                      {verificationWord}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const words = ['SECURE', 'VERIFY', 'HUMAN', 'ACCESS', 'TRUST', 'SAFETY'];
                      setVerificationWord(words[Math.floor(Math.random() * words.length)]);
                    }}
                    className="ml-3 p-2.5 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors bg-[#2563EB]"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>

                {/* Verification Input */}
                <input
                  type="text"
                  name="verification"
                  value={formData.verification}
                  onChange={handleInputChange}
                  required
                  placeholder={ct.verificationPlaceholder}
                  className="w-full px-4 py-2.5 rounded-xl border text-gray-900 dark:text-white text-center placeholder-gray-400 dark:placeholder-[#9CA3AF] focus:outline-none focus:ring-2 transition-all bg-white dark:bg-[#111827] border-gray-300 dark:border-[#374151]"
                  style={{ fontSize: '16px' }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-semibold text-[18px] text-white transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg bg-[#2563EB]"
              >
                {ct.submitBtn}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Map Section - Always show section, but conditionally show content */}
      <section id="map" className="py-20 px-6 bg-white dark:bg-[#0F1419] transition-colors">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-center text-gray-900 dark:text-white mb-6">
            {mt.title}
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12 text-lg">
            {mt.subtitle}
          </p>

          {/* Loading State */}
          {mapLoading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#2563EB]"></div>
              <p className="ml-4 text-gray-600 dark:text-gray-400 text-lg">{mt.loading}</p>
            </div>
          )}

          {/* Error State */}
          {!mapLoading && mapError && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg mb-4">
                <p className="font-semibold">{mt.errorTitle}</p>
                <p className="text-sm mt-1">{mapError}</p>
              </div>
            </div>
          )}

          {/* Empty/No Data State */}
          {!mapLoading && !mapError && !mapData && (
            <div className="flex flex-col items-center justify-center py-20">
              <svg className="w-24 h-24 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 text-lg">{mt.emptyMessage}</p>
            </div>
          )}

          {/* Map Content - Only show if data exists */}
          {!mapLoading && !mapError && mapData && (
            <div className="bg-gray-50 dark:bg-[#1F2A39] rounded-2xl p-8 border border-gray-200 dark:border-[#2D3748] shadow-lg">
              {/* Map Embed - Only show if embedUrl exists */}
              {mapData?.map?.embedUrl && (
                <div className="w-full h-[500px] rounded-xl overflow-hidden mb-6 bg-gray-200 dark:bg-gray-700">
                  <iframe
                    src={mapData.map.embedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Hawassa Mesob Location"
                  ></iframe>
                </div>
              )}

              {/* Location Details - Only show if contact data exists */}
              {mapData?.contact && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Address - Only show if exists */}
                  {mapData.contact.address && (
                    <div className="flex items-start gap-4 p-4 bg-white dark:bg-[#0F1419] rounded-xl">
                      <div className="flex-shrink-0 w-12 h-12 bg-[#2563EB] rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{mt.addressLabel}</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          {mapData.contact.address}
                        </p>
                        {mapData.contact.plusCode && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {mt.plusCode}: {mapData.contact.plusCode}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Phone - Only show if exists */}
                  {(mapData.contact.phoneDisplay || mapData.contact.phone) && (
                    <div className="flex items-start gap-4 p-4 bg-white dark:bg-[#0F1419] rounded-xl">
                      <div className="flex-shrink-0 w-12 h-12 bg-[#10B981] rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{mt.phoneLabel}</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          {mapData.contact.phoneDisplay || mapData.contact.phone}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Email - Only show if exists */}
                  {mapData.contact.email && (
                    <div className="flex items-start gap-4 p-4 bg-white dark:bg-[#0F1419] rounded-xl">
                      <div className="flex-shrink-0 w-12 h-12 bg-[#F59E0B] rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{mt.emailLabel}</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          {mapData.contact.email}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Website Link - Only show if exists */}
              {mapData?.contact?.website && (
                <div className="mb-6">
                  <a
                    href={mapData.contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563EB] hover:bg-[#1e3470] text-white rounded-xl transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    {mt.websiteBtn}
                  </a>
                </div>
              )}

              {/* Working Hours - Only show if exists */}
              {(mapData?.contact?.officeHoursDetailed || mapData?.contact?.operatingHours) && (
                <div className="p-6 bg-white dark:bg-[#0F1419] rounded-xl mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {mt.workingHoursLabel}
                  </h3>
                  
                  {mapData.contact.officeHoursDetailed ? (
                    <div className="space-y-2">
                      {mapData.contact.officeHoursDetailed.map((schedule, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{schedule.days}</span>
                          <span className="text-gray-600 dark:text-gray-400">{schedule.hours}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-300">
                      {mapData.contact.operatingHours}
                    </p>
                  )}
                </div>
              )}

              {/* Map Rating - Only show if exists */}
              {mapData?.map?.rating && (
                <div className="p-4 bg-white dark:bg-[#0F1419] rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{mapData.map.rating.score}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-5 h-5 ${i < mapData.map.rating.score ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">({mapData.map.rating.reviewsCount} {mapData.map.rating.reviewsCount === 1 ? mt.review : mt.reviews})</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
