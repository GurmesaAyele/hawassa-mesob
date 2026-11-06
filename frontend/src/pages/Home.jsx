import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Chatbot from '../components/Chatbot';
import VIPTicket from '../components/VIPTicket';
import InstitutionCard from '../components/InstitutionCard';
import InstitutionModal from '../components/InstitutionModal';
import { submitMessage } from '../services/messageApi';
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
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [allInstitutions, setAllInstitutions] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [language, setLanguage] = useState('English');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    verification: ''
  });
  const [verificationWord, setVerificationWord] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [messageStatus, setMessageStatus] = useState(null);
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
      
      const rows = Array.isArray(data) ? data : data?.data;
      if (!Array.isArray(rows)) throw new Error('The API returned an unexpected institutions response.');
      setInstitutions(rows);

      
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
    const words = ['SECURE', 'VERIFY', 'HUMAN', 'ACCESS', 'TRUST', 'SAFETY', 'VALID', 'CHECK', 'CONFIRM', 'MESOB'];
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
      title: 'Get in Touch with Us',
      subtitle: 'Visit our office, find us on the map, or reach out through the details below.',
      contactUsBtn: 'Contact Us',
      viewOnMapsBtn: 'View on Google Maps',
      getDirectionsBtn: 'Get Directions',
      headquarters: 'H-MESOB Headquarters',
      servicesCenter: 'Government Services Center',
      loading: 'Loading map data...',
      errorTitle: 'Failed to load map data',
      emptyMessage: 'Location information will be available soon',
      addressLabel: 'Address',
      phoneLabel: 'Contact',
      emailLabel: 'Email',
      operatingHoursLabel: 'Operating Hours',
      workingHoursLabel: 'Working Hours',
      websiteBtn: 'Visit Website',
      plusCode: 'Plus Code',
      review: 'review',
      reviews: 'reviews'
    },
    Amharic: {
      title: 'ከእኛ ጋር ይገናኙ',
      subtitle: 'ቢሮአችንን ይጎብኙ፣ በካርታ ላይ ይፈልጉን፣ ወይም በዝርዝሮች በኩል ያግኙን።',
      contactUsBtn: 'አግኙን',
      viewOnMapsBtn: 'በጉግል ካርታ ይመልከቱ',
      getDirectionsBtn: 'አቅጣጫ ያግኙ',
      headquarters: 'የሀ-መሰብ ዋና መስሪያ ቤት',
      servicesCenter: 'የመንግስት አገልግሎት ማእከል',
      loading: 'የካርታ መረጃ በመጫን ላይ...',
      errorTitle: 'የካርታ መረጃ መጫን አልተቻለም',
      emptyMessage: 'የአድራሻ መረጃ በቅርቡ ይገኛል',
      addressLabel: 'አድራሻ',
      phoneLabel: 'ስልክ',
      emailLabel: 'ኢሜይል',
      operatingHoursLabel: 'የስራ ሰዓታት',
      workingHoursLabel: 'የስራ ሰዓታት',
      websiteBtn: 'ድህረ ገጽ ይጎብኙ',
      plusCode: 'ፕላስ ኮድ',
      review: 'ግምገማ',
      reviews: 'ግምገማዎች'
    },
    Sidama: {
      title: 'Nooyera Gede Qixxisanno',
      subtitle: 'Offiisi keenna hula, kaarta woye qoola, woy maalla leellishshote nooqixxisa.',
      contactUsBtn: 'Nooqixxisa',
      viewOnMapsBtn: 'Google Kaarta Woye Hula',
      getDirectionsBtn: 'Qaggara Hegeranno',
      headquarters: 'የሀ-መሰብ Kalaqqa Offiisi',
      servicesCenter: 'Mootummaa Oso Maakko',
      loading: 'Kaarta maalla laaqqa gede...',
      errorTitle: 'Kaarta maalla laaqqa dandaabokki',
      emptyMessage: 'Borro maalla ammayyo hegerannooti',
      addressLabel: 'Borro',
      phoneLabel: 'Bilbila',
      emailLabel: 'Imeela',
      operatingHoursLabel: 'Oso Saatto',
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

  // Fetch all institutions and services for search
  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        const locale = getLocaleCode(language);
        
        console.log('=== FETCHING SEARCH DATA ===');
        console.log('Locale:', locale);
        console.log('Institutions URL:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INSTITUTIONS}?locale=${locale}`);
        console.log('Services URL:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SERVICES}?locale=${locale}`);
        
        const [institutionsRes, servicesRes] = await Promise.all([
          fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INSTITUTIONS}?locale=${locale}`),
          fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SERVICES}?locale=${locale}`)
        ]);

        console.log('Institutions response status:', institutionsRes.status);
        console.log('Services response status:', servicesRes.status);

        if (institutionsRes.ok) {
          const institutionsData = await institutionsRes.json();
          console.log('✅ Fetched institutions RAW:', institutionsData);
          
          // Handle different response structures
          let institutionsArray = [];
          if (Array.isArray(institutionsData)) {
            institutionsArray = institutionsData;
          } else if (institutionsData.data && Array.isArray(institutionsData.data)) {
            institutionsArray = institutionsData.data;
          } else if (institutionsData.institutions && Array.isArray(institutionsData.institutions)) {
            institutionsArray = institutionsData.institutions;
          }
          
          console.log('Institutions array extracted:', institutionsArray);
          console.log('Institutions count:', institutionsArray.length);
          if (institutionsArray.length > 0) {
            console.log('First institution sample:', institutionsArray[0]);
          }
          setAllInstitutions(institutionsArray);
        } else {
          console.error('❌ Institutions fetch failed:', institutionsRes.statusText);
          setAllInstitutions([]);
        }

        if (servicesRes.ok) {
          const servicesData = await servicesRes.json();
          console.log('✅ Fetched services RAW:', servicesData);
          
          // Handle different response structures
          let servicesArray = [];
          if (Array.isArray(servicesData)) {
            servicesArray = servicesData;
          } else if (servicesData.data && Array.isArray(servicesData.data)) {
            servicesArray = servicesData.data;
          } else if (servicesData.services && Array.isArray(servicesData.services)) {
            servicesArray = servicesData.services;
          }
          
          console.log('Services array extracted:', servicesArray);
          console.log('Services count:', servicesArray.length);
          if (servicesArray.length > 0) {
            console.log('First service sample:', servicesArray[0]);
          }
          setAllServices(servicesArray);
        } else {
          console.error('❌ Services fetch failed:', servicesRes.statusText);
          setAllServices([]);
        }
      } catch (error) {
        console.error('❌ Error fetching search data:', error);
        setAllInstitutions([]);
        setAllServices([]);
      }
    };

    fetchSearchData();
  }, [language]);

  // Real-time search as user types
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    console.log('=== SEARCHING ===');
    console.log('Query:', query);
    console.log('Total institutions available:', allInstitutions.length);
    console.log('Total services available:', allServices.length);
    
    // Filter institutions
    const filteredInstitutions = allInstitutions.filter(inst => {
      const nameMatch = inst.name?.toLowerCase().includes(query);
      const descMatch = inst.description?.toLowerCase().includes(query);
      const codeMatch = inst.code?.toLowerCase().includes(query);
      const match = nameMatch || descMatch || codeMatch;
      if (match) {
        console.log('✅ Institution match:', inst.name);
      }
      return match;
    });

    // Filter services - check multiple possible structures
    let filteredServices = [];
    
    // First, try filtering from allServices array
    if (allServices.length > 0) {
      filteredServices = allServices.filter(service => {
        const nameMatch = service.name?.toLowerCase().includes(query);
        const titleMatch = service.title?.toLowerCase().includes(query);
        const descMatch = service.description?.toLowerCase().includes(query);
        const match = nameMatch || titleMatch || descMatch;
        if (match) {
          console.log('✅ Service match:', service.name || service.title);
        }
        return match;
      });
    }
    
    // Also search services nested inside institutions
    allInstitutions.forEach(inst => {
      if (inst.services && Array.isArray(inst.services)) {
        inst.services.forEach(service => {
          const nameMatch = service.name?.toLowerCase().includes(query);
          const titleMatch = service.title?.toLowerCase().includes(query);
          const descMatch = service.description?.toLowerCase().includes(query);
          if (nameMatch || titleMatch || descMatch) {
            // Add institution info to service
            const serviceWithInst = {
              ...service,
              institutionName: inst.name
            };
            filteredServices.push(serviceWithInst);
            console.log('✅ Nested service match:', service.name || service.title, 'from', inst.name);
          }
        });
      }
    });

    console.log('Filtered institutions count:', filteredInstitutions.length);
    console.log('Filtered services count:', filteredServices.length);

    setSearchResults({
      institutions: filteredInstitutions,
      services: filteredServices,
      query: searchQuery
    });
  }, [searchQuery, allInstitutions, allServices]);

  const handleSearch = async (e) => {
    e.preventDefault();
    // Search is now handled by useEffect above
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Generate fresh verification words list
    const words = ['SECURE', 'VERIFY', 'HUMAN', 'ACCESS', 'TRUST', 'SAFETY', 'VALID', 'CHECK', 'CONFIRM', 'MESOB'];
    
    // Check verification
    if (formData.verification.trim().toUpperCase() !== verificationWord) {
      // Regenerate a new word on failed verification
      const newWord = words[Math.floor(Math.random() * words.length)];
      setVerificationWord(newWord);
      setFormData({ ...formData, verification: '' }); // Clear the verification input
      
      const errorMessages = {
        English: 'Verification failed. Please try again with the new word shown.',
        Amharic: 'ማረጋገጫ አልተሳካም። እባክዎ በአዲሱ ቃል እንደገና ይሞክሩ።',
        Sidama: 'Mirkaneessi dandaabokki. Haa ammayyo qaalawaan ammas yaala.'
      };
      setMessageStatus({ 
        type: 'error', 
        text: errorMessages[language] || errorMessages.English
      });
      return;
    }
    
    setMessageSending(true);
    setMessageStatus(null);
    
    try {
      const result = await submitMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        message: formData.message.trim(),
      });
      
      const successMessages = {
        English: 'Thank you! Your message has been sent successfully.',
        Amharic: 'እናመሰግናለን! መልእክትዎ በተሳካ ሁኔታ ተልኳል።',
        Sidama: 'Galata! Ergaaykine milkaawaan ergagama.'
      };
      
      setMessageStatus({ 
        type: 'success', 
        text: successMessages[language] || successMessages.English
      });
      
      // Clear form and generate new verification word
      setFormData({ name: '', email: '', phone: '', message: '', verification: '' });
      const newWord = words[Math.floor(Math.random() * words.length)];
      setVerificationWord(newWord);
      
    } catch (error) {
      console.error('Message submission error:', error);
      
      // Regenerate verification word on error
      const newWord = words[Math.floor(Math.random() * words.length)];
      setVerificationWord(newWord);
      setFormData({ ...formData, verification: '' });
      
      const errorMessages = {
        English: error.message || 'Failed to send message. Please try again.',
        Amharic: 'መልእክት መላክ አልተቻለም። እባክዎ እንደገና ይሞክሩ።',
        Sidama: 'Ergaa erguu dandaabokki. Haa ammas yaala.'
      };
      
      setMessageStatus({ 
        type: 'error', 
        text: errorMessages[language] || error.message || errorMessages.English
      });
    } finally {
      setMessageSending(false);
    }
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

              {/* Search Results Dropdown */}
              {searchResults && (
                <div className="mt-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-h-[500px] overflow-y-auto">
                  {/* Close Button */}
                  <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Search Results for "{searchResults.query}"
                    </h3>
                    <button
                      onClick={() => {
                        setSearchResults(null);
                        setSearchQuery('');
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="p-4">
                    {searchResults.error ? (
                      <p className="text-red-500 dark:text-red-400 text-center py-4">{searchResults.error}</p>
                    ) : (
                      <>
                        {/* Institutions Results */}
                        {searchResults.institutions.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              Organizations ({searchResults.institutions.length})
                            </h4>
                            <div className="space-y-2">
                              {searchResults.institutions.map((institution) => (
                                <button
                                  key={institution.id}
                                  onClick={() => {
                                    handleInstitutionClick(institution);
                                    setSearchResults(null);
                                    setSearchQuery('');
                                  }}
                                  className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                  <h5 className="font-semibold text-gray-900 dark:text-white mb-1">{institution.name}</h5>
                                  {institution.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{institution.description}</p>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Services Results */}
                        {searchResults.services.length > 0 && (
                          <div>
                            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Services ({searchResults.services.length})
                            </h4>
                            <div className="space-y-2">
                              {searchResults.services.map((service, idx) => (
                                <div
                                  key={service.id || idx}
                                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                >
                                  <h5 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    {service.title || service.name}
                                  </h5>
                                  {service.institutionName && (
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                                      📍 {service.institutionName}
                                    </p>
                                  )}
                                  {service.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{service.description}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* No Results */}
                        {searchResults.institutions.length === 0 && searchResults.services.length === 0 && (
                          <div className="text-center py-8">
                            <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-gray-500 dark:text-gray-400 text-lg">No results found for "{searchResults.query}"</p>
                            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Try different keywords or check your spelling</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
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
                {currentInstitutions.map((institution, idx) => (
                  <InstitutionCard
                    key={institution.id}
                    institution={institution}
                    onClick={handleInstitutionClick}
                    index={startIndex + idx}
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
      <section id="services" className="min-h-screen py-20 px-6 transition-colors bg-gray-50 dark:bg-[#0F172A]">
        <div className="max-w-[1800px] mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">Our Services</h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg transition-colors">Access essential government services quickly and efficiently</p>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Service Card 1: Local Services */}
            <div className="group bg-white dark:bg-[#1F2937] rounded-2xl p-8 border-[3px] border-gray-200 dark:border-[#4B5563] hover:border-blue-500 dark:hover:border-[#3154B5] hover:-translate-y-1.5 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(49,84,181,0.3)] flex flex-col min-h-[280px]">
              <div className="w-16 h-16 rounded-xl bg-teal-500/10 border-[3px] border-[#14B8A6] flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[#14B8A6] group-hover:rotate-360 transition-transform duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-[22px] font-semibold text-gray-900 dark:text-[#F8FAFC] mb-2 leading-tight transition-colors">Local Services</h3>
              <p className="text-[16px] text-gray-600 dark:text-[#CBD5E1] leading-relaxed mb-auto transition-colors">Access local government services and permits</p>
              <div className="w-full h-1 bg-blue-600 dark:bg-[#3154B5] rounded-[10px] mt-5 transition-colors"></div>
            </div>

            {/* Service Card 2: International Services */}
            <div className="group bg-white dark:bg-[#1F2937] rounded-2xl p-8 border-[3px] border-gray-200 dark:border-[#4B5563] hover:border-blue-500 dark:hover:border-[#3154B5] hover:-translate-y-1.5 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(49,84,181,0.3)] flex flex-col min-h-[280px]">
              <div className="w-16 h-16 rounded-xl bg-cyan-500/10 border-[3px] border-[#06B6D4] flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[#06B6D4] group-hover:rotate-360 transition-transform duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-[22px] font-semibold text-gray-900 dark:text-[#F8FAFC] mb-2 leading-tight transition-colors">International Services</h3>
              <p className="text-[16px] text-gray-600 dark:text-[#CBD5E1] leading-relaxed mb-auto transition-colors">International permits and documentation services</p>
              <div className="w-full h-1 bg-blue-600 dark:bg-[#3154B5] rounded-[10px] mt-5 transition-colors"></div>
            </div>

            {/* Service Card 3: Document Services */}
            <div className="group bg-white dark:bg-[#1F2937] rounded-2xl p-8 border-[3px] border-gray-200 dark:border-[#4B5563] hover:border-blue-500 dark:hover:border-[#3154B5] hover:-translate-y-1.5 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(49,84,181,0.3)] flex flex-col min-h-[280px]">
              <div className="w-16 h-16 rounded-xl bg-blue-500/10 border-[3px] border-[#3B82F6] flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[#3B82F6] group-hover:rotate-360 transition-transform duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-[22px] font-semibold text-gray-900 dark:text-[#F8FAFC] mb-2 leading-tight transition-colors">Document Services</h3>
              <p className="text-[16px] text-gray-600 dark:text-[#CBD5E1] leading-relaxed mb-auto transition-colors">Official document processing and certification</p>
              <div className="w-full h-1 bg-blue-600 dark:bg-[#3154B5] rounded-[10px] mt-5 transition-colors"></div>
            </div>

            {/* Service Card 4: Tax Services */}
            <div className="group bg-white dark:bg-[#1F2937] rounded-2xl p-8 border-[3px] border-gray-200 dark:border-[#4B5563] hover:border-blue-500 dark:hover:border-[#3154B5] hover:-translate-y-1.5 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(49,84,181,0.3)] flex flex-col min-h-[280px]">
              <div className="w-16 h-16 rounded-xl bg-amber-500/10 border-[3px] border-[#F59E0B] flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[#F59E0B] group-hover:rotate-360 transition-transform duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-[22px] font-semibold text-gray-900 dark:text-[#F8FAFC] mb-2 leading-tight transition-colors">Tax Services</h3>
              <p className="text-[16px] text-gray-600 dark:text-[#CBD5E1] leading-relaxed mb-auto transition-colors">Tax filing, payment, and consultation services</p>
              <div className="w-full h-1 bg-blue-600 dark:bg-[#3154B5] rounded-[10px] mt-5 transition-colors"></div>
            </div>

            {/* Service Card 5: Housing Permits */}
            <div className="group bg-white dark:bg-[#1F2937] rounded-2xl p-8 border-[3px] border-gray-200 dark:border-[#4B5563] hover:border-blue-500 dark:hover:border-[#3154B5] hover:-translate-y-1.5 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(49,84,181,0.3)] flex flex-col min-h-[280px]">
              <div className="w-16 h-16 rounded-xl bg-purple-500/10 border-[3px] border-[#A78BFA] flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[#A78BFA] group-hover:rotate-360 transition-transform duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-[22px] font-semibold text-gray-900 dark:text-[#F8FAFC] mb-2 leading-tight transition-colors">Housing Permits</h3>
              <p className="text-[16px] text-gray-600 dark:text-[#CBD5E1] leading-relaxed mb-auto transition-colors">Building permits and housing documentation</p>
              <div className="w-full h-1 bg-blue-600 dark:bg-[#3154B5] rounded-[10px] mt-5 transition-colors"></div>
            </div>

            {/* Service Card 6: Vehicle Services */}
            <div className="group bg-white dark:bg-[#1F2937] rounded-2xl p-8 border-[3px] border-gray-200 dark:border-[#4B5563] hover:border-blue-500 dark:hover:border-[#3154B5] hover:-translate-y-1.5 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(49,84,181,0.3)] flex flex-col min-h-[280px]">
              <div className="w-16 h-16 rounded-xl bg-sky-500/10 border-[3px] border-[#38BDF8] flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[#38BDF8] group-hover:rotate-360 transition-transform duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 4h8m-4 4h4m4-12V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-5-5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354v2.292m0 0a4 4 0 11-1.172 7.828M12 6.646V10m0 0v8m0-8h5" />
                </svg>
              </div>
              <h3 className="text-[22px] font-semibold text-gray-900 dark:text-[#F8FAFC] mb-2 leading-tight transition-colors">Vehicle Services</h3>
              <p className="text-[16px] text-gray-600 dark:text-[#CBD5E1] leading-relaxed mb-auto transition-colors">Vehicle registration, licensing, and permits</p>
              <div className="w-full h-1 bg-blue-600 dark:bg-[#3154B5] rounded-[10px] mt-5 transition-colors"></div>
            </div>

            {/* Service Card 7: Education Services - Row 3 Left (Centered) */}
            <div className="group bg-white dark:bg-[#1F2937] rounded-2xl p-8 border-[3px] border-gray-200 dark:border-[#4B5563] hover:border-blue-500 dark:hover:border-[#3154B5] hover:-translate-y-1.5 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(49,84,181,0.3)] flex flex-col min-h-[280px] lg:col-start-1 lg:col-end-2 lg:mx-auto lg:w-full lg:max-w-[400px]">
              <div className="w-16 h-16 rounded-xl bg-indigo-500/10 border-[3px] border-[#6366F1] flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[#6366F1] group-hover:rotate-360 transition-transform duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
              </div>
              <h3 className="text-[22px] font-semibold text-gray-900 dark:text-[#F8FAFC] mb-2 leading-tight transition-colors">Education Services</h3>
              <p className="text-[16px] text-gray-600 dark:text-[#CBD5E1] leading-relaxed mb-auto transition-colors">Educational certificates and academic services</p>
              <div className="w-full h-1 bg-blue-600 dark:bg-[#3154B5] rounded-[10px] mt-5 transition-colors"></div>
            </div>

            {/* Service Card 8: Health Services - Row 3 Right (Centered) */}
            <div className="group bg-white dark:bg-[#1F2937] rounded-2xl p-8 border-[3px] border-gray-200 dark:border-[#4B5563] hover:border-blue-500 dark:hover:border-[#3154B5] hover:-translate-y-1.5 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(49,84,181,0.3)] flex flex-col min-h-[280px] lg:col-start-2 lg:col-end-3 lg:mx-auto lg:w-full lg:max-w-[400px]">
              <div className="w-16 h-16 rounded-xl bg-red-500/10 border-[3px] border-[#EF4444] flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[#EF4444] group-hover:rotate-360 transition-transform duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-[22px] font-semibold text-gray-900 dark:text-[#F8FAFC] mb-2 leading-tight transition-colors">Health Services</h3>
              <p className="text-[16px] text-gray-600 dark:text-[#CBD5E1] leading-relaxed mb-auto transition-colors">Health permits, medical certificates, and services</p>
              <div className="w-full h-1 bg-blue-600 dark:bg-[#3154B5] rounded-[10px] mt-5 transition-colors"></div>
            </div>
          </div>

          {/* View All Services Button */}
          <div className="flex justify-center mt-12">
            <button
              onClick={() => {
                const servicesCatalogue = document.getElementById('service-catalogue');
                if (servicesCatalogue) {
                  servicesCatalogue.scrollIntoView({ behavior: 'smooth' });
                } else {
                  // Navigate to Services page if section doesn't exist
                  window.location.href = '/services';
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-[#24469A] dark:hover:bg-[#1e3a7f] text-white px-8 py-4 rounded-xl text-[18px] font-semibold transition-all duration-300 hover:shadow-xl flex items-center gap-2 min-w-[260px] min-h-[60px] justify-center"
            >
              View All Services
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Motion Section - Full Width Edge to Edge */}
        </div>
      </section>

      {/* Motion Section - Outside container for full width */}
      <section className="w-full h-[300px] bg-gray-100 dark:bg-[#0F172A] flex items-center justify-center overflow-hidden transition-colors">
        <iframe 
          src="/src/assets/mesob-motion-loop (1).html"
          className="w-full h-full border-0"
          title="Mesob Motion"
          style={{ pointerEvents: 'none' }}
        />
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
                      const words = ['SECURE', 'VERIFY', 'HUMAN', 'ACCESS', 'TRUST', 'SAFETY', 'VALID', 'CHECK', 'CONFIRM', 'MESOB'];
                      setVerificationWord(words[Math.floor(Math.random() * words.length)]);
                      setFormData({ ...formData, verification: '' }); // Clear input on refresh
                    }}
                    className="ml-3 p-2.5 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors bg-[#2563EB]"
                    title="Generate new verification word"
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
              {messageStatus && (
                <p
                  role={messageStatus.type === 'error' ? 'alert' : 'status'}
                  className={`rounded-lg px-4 py-3 text-sm ${messageStatus.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}
                >
                  {messageStatus.text}
                </p>
              )}
              <button
                type="submit"
                disabled={messageSending}
                className="w-full py-3.5 rounded-xl font-semibold text-[18px] text-white transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg bg-[#2563EB]"
              >
                {messageSending ? 'Sending...' : ct.submitBtn}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Map and Contact Info Section */}
      <section id="map" className="py-20 px-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-[#0F2847] dark:to-[#1a3a5c] transition-colors">
        <div className="max-w-7xl mx-auto">
          {/* Section Header with Contact Us Button */}
          <div className="text-center mb-12">
            <button className="inline-flex items-center gap-2 bg-[#314EA1] hover:bg-[#283d7f] dark:bg-[#314EA1] dark:hover:bg-[#283d7f] text-white px-6 py-2.5 rounded-lg mb-4 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {mt.contactUsBtn}
            </button>
            <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">
              {mt.title.split(' with ')[0]} <span className="text-blue-600 dark:text-blue-400">{mt.title.split(' with ')[1] || 'Us'}</span>
            </h2>
            <p className="text-gray-700 dark:text-gray-300 text-lg transition-colors">
              {mt.subtitle}
            </p>
          </div>

          {/* Loading State */}
          {mapLoading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 dark:border-blue-500"></div>
              <p className="ml-4 text-gray-700 dark:text-gray-300 text-lg transition-colors">Loading map data...</p>
            </div>
          )}

          {/* Error State */}
          {!mapLoading && mapError && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg mb-4 transition-colors">
                <p className="font-semibold">Failed to load map data</p>
                <p className="text-sm mt-1">{mapError}</p>
              </div>
            </div>
          )}

          {/* Map and Info Grid */}
          {!mapLoading && !mapError && mapData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Map Card */}
              <div className="bg-white dark:bg-[#1a3050] rounded-3xl p-6 border-2 border-gray-200 dark:border-gray-700 shadow-xl dark:shadow-2xl transition-colors">
                {/* Map Embed */}
                {mapData?.map?.embedUrl ? (
                  <div className="w-full h-[400px] rounded-2xl overflow-hidden mb-6 bg-gray-200 dark:bg-gray-800 transition-colors">
                    <iframe
                      src={mapData.map.embedUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="A-MESOB Location"
                    ></iframe>
                  </div>
                ) : (
                  <div className="w-full h-[400px] rounded-2xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center mb-6 transition-colors">
                    <p className="text-gray-500 dark:text-gray-400 transition-colors">Map not available</p>
                  </div>
                )}

                {/* View on Google Maps Button */}
                <button
                  onClick={() => {
                    if (mapData?.map?.directionsUrl) {
                      window.open(mapData.map.directionsUrl, '_blank');
                    }
                  }}
                  className="w-full bg-[#314EA1] hover:bg-[#283d7f] dark:bg-[#314EA1] dark:hover:bg-[#283d7f] text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {mt.viewOnMapsBtn}
                </button>
              </div>

              {/* Right: Headquarters Info Card */}
              <div className="bg-white dark:bg-[#1a3050] rounded-3xl p-8 border-2 border-gray-200 dark:border-gray-700 shadow-xl dark:shadow-2xl transition-colors">
                {/* Header with Icon */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-[#314EA1] dark:bg-[#314EA1] rounded-2xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">{mt.headquarters}</h3>
                    <p className="text-gray-600 dark:text-gray-400 transition-colors">{mt.servicesCenter}</p>
                  </div>
                </div>

                {/* Contact Details */}
                <div className="space-y-6">
                  {/* Address */}
                  {mapData?.contact?.address && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                        <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-gray-900 dark:text-white font-semibold mb-1 transition-colors">{mt.addressLabel}</h4>
                        <p className="text-gray-700 dark:text-gray-300 transition-colors">{mapData.contact.address}</p>
                      </div>
                    </div>
                  )}

                  {/* Operating Hours */}
                  {mapData?.contact?.operatingHours && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                        <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-gray-900 dark:text-white font-semibold mb-1 transition-colors">{mt.operatingHoursLabel}</h4>
                        <p className="text-gray-700 dark:text-gray-300 transition-colors">{mapData.contact.operatingHours}</p>
                      </div>
                    </div>
                  )}

                  {/* Phone */}
                  {(mapData?.contact?.phoneDisplay || mapData?.contact?.phone) && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                        <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-gray-900 dark:text-white font-semibold mb-1 transition-colors">{mt.phoneLabel}</h4>
                        <p className="text-gray-700 dark:text-gray-300 transition-colors">{mapData.contact.phoneDisplay || mapData.contact.phone}</p>
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  {mapData?.contact?.email && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                        <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-gray-900 dark:text-white font-semibold mb-1 transition-colors">{mt.emailLabel}</h4>
                        <p className="text-gray-700 dark:text-gray-300 transition-colors">{mapData.contact.email}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Get Directions Button */}
                <button
                  onClick={() => {
                    if (mapData?.map?.directionsUrl) {
                      window.open(mapData.map.directionsUrl, '_blank');
                    }
                  }}
                  className="w-full mt-8 bg-[#314EA1] hover:bg-[#283d7f] dark:bg-[#314EA1] dark:hover:bg-[#283d7f] text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  {mt.getDirectionsBtn}
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!mapLoading && !mapError && !mapData && (
            <div className="flex flex-col items-center justify-center py-20">
              <svg className="w-24 h-24 text-gray-400 dark:text-gray-600 mb-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 text-lg transition-colors">Location information will be available soon</p>
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
