import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Chatbot from '../components/Chatbot';
import VIPTicket from '../components/VIPTicket';
import Footer from '../components/Footer';
import InstitutionCard from '../components/InstitutionCard';
import InstitutionModal from '../components/InstitutionModal';
import { API_CONFIG, getLocaleCode } from '../config/api';

const Institutions = () => {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [loadingServices, setLoadingServices] = useState(false);
  const [language, setLanguage] = useState('English');

  const itemsPerPage = 4;

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = (event) => {
      setLanguage(event.detail);
    };

    window.addEventListener('languageChange', handleLanguageChange);
    
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    return () => {
      window.removeEventListener('languageChange', handleLanguageChange);
    };
  }, []);

  // Fetch institutions from API
  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const locale = getLocaleCode(language);
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INSTITUTIONS}?locale=${locale}`;
        console.log('Fetching institutions from:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
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
      } catch (err) {
        console.error('Error fetching institutions:', err);
        setError(err.message);
        setInstitutions([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchInstitutions();
  }, [language]); // Re-fetch when language changes

  // Translations
  const translations = {
    English: {
      title: 'Partner Institutions',
      subtitle: 'Access services from multiple government and partner organizations',
      loading: 'Loading institutions...',
      error: 'Failed to load institutions',
      retry: 'Retry',
      noInstitutions: 'No institutions available at the moment',
      previous: 'Previous',
      next: 'Next'
    },
    Amharic: {
      title: 'አጋር ተቋማት',
      subtitle: 'ከብዙ የመንግስት እና አጋር ድርጅቶች አገልግሎቶችን ያግኙ',
      loading: 'ተቋማት በመጫን ላይ...',
      error: 'ተቋማትን መጫን አልተቻለም',
      retry: 'እንደገና ሞክር',
      noInstitutions: 'በአሁኑ ጊዜ ምንም ተቋማት የሉም',
      previous: 'ቀዳሚ',
      next: 'ቀጣይ'
    },
    Sidama: {
      title: 'Gargar Biirota',
      subtitle: 'Baala mootummaa gargare biirota oosuwaa heeggeri',
      loading: 'Biirota laaqqa gede...',
      error: 'Biirota laaqqa dandaabokki',
      retry: 'Irra deebi\'i yedi',
      noInstitutions: 'Ammayyo biirota hin qabnu',
      previous: 'Dursa',
      next: 'Itti aansu'
    }
  };

  const t = translations[language] || translations.English;

  // Pagination
  const totalPages = Math.ceil(institutions.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInstitutions = institutions.slice(startIndex, endIndex);

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleCardClick = async (institution) => {
    setLoadingServices(true);
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
    } finally {
      setLoadingServices(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedInstitution(null);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1419] transition-colors">
      <Navbar />
      <Chatbot />
      <VIPTicket />
      
      {/* Header */}
      <div className="pt-24 pb-12 px-6 bg-gradient-to-br from-[#294491] to-[#CB9D2A]">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-4">{t.title}</h1>
          <p className="text-xl text-white/90">
            {t.subtitle}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#294491] mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">{t.loading}</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg mb-4">
                <p className="font-semibold">{t.error}</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="bg-[#294491] hover:bg-[#1e3470] text-white px-6 py-2 rounded-lg transition-colors"
              >
                {t.retry}
              </button>
            </div>
          )}

          {/* No Institutions */}
          {!loading && !error && institutions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <svg className="w-24 h-24 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 text-lg">{t.noInstitutions}</p>
            </div>
          )}

          {/* Institutions Grid */}
          {!loading && !error && institutions.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {currentInstitutions.map((institution) => (
                  <InstitutionCard
                    key={institution.id}
                    institution={institution}
                    onClick={() => handleCardClick(institution)}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <button
                    onClick={handlePrevious}
                    disabled={currentPage === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-[#294491] hover:bg-[#1e3470] text-white rounded-lg transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {t.previous}
                  </button>

                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {currentPage + 1} / {totalPages}
                  </span>

                  <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages - 1}
                    className="flex items-center gap-2 px-6 py-3 bg-[#294491] hover:bg-[#1e3470] text-white rounded-lg transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                  >
                    {t.next}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Institution Modal */}
      {selectedInstitution && (
        <InstitutionModal
          institution={selectedInstitution}
          onClose={handleCloseModal}
          language={language}
        />
      )}

      <Footer />
    </div>
  );
};

export default Institutions;
