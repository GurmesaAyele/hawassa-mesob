import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Chatbot from '../components/Chatbot';
import VIPTicket from '../components/VIPTicket';
import Footer from '../components/Footer';
import { API_CONFIG, getLocaleCode } from '../config/api';

const ServiceCatalogue = () => {
  const [language, setLanguage] = useState('English');
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = (event) => {
      setLanguage(event.detail);
    };
    
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    window.addEventListener('languageChange', handleLanguageChange);
    return () => window.removeEventListener('languageChange', handleLanguageChange);
  }, []);

  // Fetch institutions with services
  useEffect(() => {
    const fetchInstitutions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const locale = getLocaleCode(language);
        const response = await fetch(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INSTITUTIONS}?locale=${locale}&includeServices=true`
        );
        
        if (!response.ok) throw new Error('Failed to fetch institutions');
        
        const data = await response.json();
        
        // Handle different response structures
        let institutionsArray = [];
        if (Array.isArray(data)) {
          institutionsArray = data;
        } else if (data.data && Array.isArray(data.data)) {
          institutionsArray = data.data;
        } else if (data.institutions && Array.isArray(data.institutions)) {
          institutionsArray = data.institutions;
        }
        
        // Fetch services for each institution if not included
        const institutionsWithServices = await Promise.all(
          institutionsArray.map(async (inst) => {
            if (!inst.services || inst.services.length === 0) {
              try {
                const servicesRes = await fetch(
                  `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INSTITUTIONS}/${inst.id}?locale=${locale}`
                );
                if (servicesRes.ok) {
                  const instData = await servicesRes.json();
                  return { ...inst, services: instData.services || [] };
                }
              } catch (err) {
                console.error('Error fetching services for', inst.name, err);
              }
            }
            return inst;
          })
        );
        
        setInstitutions(institutionsWithServices);
      } catch (err) {
        console.error('Error fetching institutions:', err);
        setError('Failed to load institutions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInstitutions();
  }, [language]);

  const getLogoUrl = (logoPath) => {
    if (!logoPath) return null;
    if (logoPath.startsWith('http')) return logoPath;
    return `${API_CONFIG.BASE_URL}${logoPath}`;
  };

  // Translations
  const translations = {
    English: {
      title: 'Service Catalogue',
      subtitle: 'Browse all available government services',
      backToServices: '← Back to Services',
      backToInstitutions: '← Back to Institutions',
      documentsRequired: 'DOCUMENTS REQUIRED:',
      processingTime: 'PROCESSING TIME:',
      serviceFee: 'SERVICE FEE:',
      noServices: 'No services available',
      loading: 'Loading...',
      error: 'Failed to load'
    },
    Amharic: {
      title: 'የአገልግሎት ካታሎግ',
      subtitle: 'ሁሉንም የመንግስት አገልግሎቶች ያስሱ',
      backToServices: '← ወደ አገልግሎቶች ተመለስ',
      backToInstitutions: '← ወደ ተቋማት ተመለስ',
      documentsRequired: 'የሚያስፈልጉ ሰነዶች:',
      processingTime: 'የማስኬጃ ጊዜ:',
      serviceFee: 'የአገልግሎት ክፍያ:',
      noServices: 'ምንም አገልግሎቶች የሉም',
      loading: 'በመጫን ላይ...',
      error: 'መጫን አልተቻለም'
    },
    Sidama: {
      title: 'Oosuwaa Katalogi',
      subtitle: 'Mootummaa oosuwaa mara hul',
      backToServices: '← Oosuwaa gede deema',
      backToInstitutions: '← Biroo gede deema',
      documentsRequired: 'Barruulee Barbaachisu:',
      processingTime: 'Hojii Yeroo:',
      serviceFee: 'Oosuwaa Kaffaltii:',
      noServices: 'Oosuwaa hin jiru',
      loading: 'Laaqqa gede...',
      error: 'Laaqqa dandaabokki'
    }
  };

  const t = translations[language] || translations.English;

  return (
    <div className="min-h-screen bg-[#1E293B] transition-colors">
      <Navbar />
      <Chatbot />
      <VIPTicket />
      
      <div className="pt-24 px-6 pb-12 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* View 1: Institution Grid */}
          {!selectedInstitution && !selectedService && (
            <>
              <h1 className="text-5xl font-bold text-center text-white mb-6">
                {t.title}
              </h1>
              <p className="text-center text-gray-300 text-lg mb-12">
                {t.subtitle}
              </p>

              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="text-center py-20">
                  <p className="text-red-400 text-xl">{error}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {institutions.map((institution) => (
                    <button
                      key={institution.id}
                      onClick={() => setSelectedInstitution(institution)}
                      className="bg-[#2D3748] rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 hover:shadow-2xl"
                    >
                      {/* Logo */}
                      <div className="bg-white p-8 flex items-center justify-center h-48">
                        {getLogoUrl(institution.logo || institution.icon) ? (
                          <img
                            src={getLogoUrl(institution.logo || institution.icon)}
                            alt={institution.name}
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <div className="text-6xl text-gray-400">
                            {institution.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      
                      {/* Name */}
                      <div className="bg-[#3B4A5F] px-6 py-4">
                        <h3 className="text-white font-semibold text-center text-lg">
                          {institution.name}
                          {institution.code && (
                            <span className="text-sm text-gray-400 ml-2">({institution.code})</span>
                          )}
                        </h3>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* View 2: Services List */}
          {selectedInstitution && !selectedService && (
            <div className="max-w-2xl mx-auto">
              {/* Institution Logo */}
              <div className="bg-white rounded-2xl p-8 mb-6 flex items-center justify-center">
                {getLogoUrl(selectedInstitution.logo || selectedInstitution.icon) ? (
                  <img
                    src={getLogoUrl(selectedInstitution.logo || selectedInstitution.icon)}
                    alt={selectedInstitution.name}
                    className="max-w-full max-h-48 object-contain"
                  />
                ) : (
                  <div className="text-8xl text-gray-400">
                    {selectedInstitution.name?.charAt(0)}
                  </div>
                )}
              </div>

              {/* Institution Name Button */}
              <div className="bg-blue-600 hover:bg-blue-700 rounded-xl px-8 py-4 mb-6 text-center cursor-default">
                <h2 className="text-white text-2xl font-bold">
                  {selectedInstitution.name}
                  {selectedInstitution.code && (
                    <span className="text-lg ml-2">({selectedInstitution.code})</span>
                  )}
                </h2>
              </div>

              {/* Services List */}
              <div className="space-y-3">
                {selectedInstitution.services && selectedInstitution.services.length > 0 ? (
                  selectedInstitution.services.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className="w-full bg-[#2D3748] hover:bg-[#3B4A5F] rounded-xl px-6 py-4 text-white text-lg font-medium text-left transition-all duration-200"
                    >
                      {service.title || service.name}
                    </button>
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-12">{t.noServices}</p>
                )}
              </div>

              {/* Back Button */}
              <button
                onClick={() => setSelectedInstitution(null)}
                className="mt-8 bg-[#2D3748] hover:bg-[#3B4A5F] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t.backToInstitutions}
              </button>
            </div>
          )}

          {/* View 3: Service Detail */}
          {selectedService && (
            <div className="max-w-2xl mx-auto">
              {/* Institution Name Button */}
              <div className="bg-blue-600 rounded-xl px-8 py-4 mb-6 text-center">
                <h2 className="text-white text-2xl font-bold">
                  {selectedInstitution.name}
                  {selectedInstitution.code && (
                    <span className="text-lg ml-2">({selectedInstitution.code})</span>
                  )}
                </h2>
              </div>

              {/* Back Button */}
              <button
                onClick={() => setSelectedService(null)}
                className="mb-6 bg-[#2D3748] hover:bg-[#3B4A5F] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t.backToServices}
              </button>

              {/* Service Title */}
              <h3 className="text-white text-3xl font-bold mb-8">
                {selectedService.title || selectedService.name}
              </h3>

              {/* Service Details */}
              <div className="space-y-6">
                {/* Documents Required */}
                {(selectedService.requirements || selectedService.requiredDocuments) && (
                  <div className="bg-[#2D3748] rounded-xl p-6">
                    <h4 className="text-gray-300 text-sm font-semibold mb-3 uppercase">
                      {t.documentsRequired}
                    </h4>
                    <ul className="space-y-2">
                      {(selectedService.requirements || selectedService.requiredDocuments).map((req, index) => (
                        <li key={index} className="text-white flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Processing Time and Service Fee */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Processing Time */}
                  {(selectedService.duration || selectedService.processingDays) && (
                    <div className="bg-[#2D3748] rounded-xl p-6">
                      <h4 className="text-gray-300 text-sm font-semibold mb-2 uppercase">
                        {t.processingTime}
                      </h4>
                      <p className="text-white text-2xl font-bold">
                        {selectedService.duration || selectedService.processingDays}
                      </p>
                    </div>
                  )}

                  {/* Service Fee */}
                  {(selectedService.cost || selectedService.estimatedFee !== undefined) && (
                    <div className="bg-[#2D3748] rounded-xl p-6">
                      <h4 className="text-gray-300 text-sm font-semibold mb-2 uppercase">
                        {t.serviceFee}
                      </h4>
                      <p className="text-white text-2xl font-bold">
                        {selectedService.cost || 
                         (selectedService.estimatedFee === null || selectedService.estimatedFee === 0 
                           ? 'None' 
                           : `${selectedService.estimatedFee}`)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ServiceCatalogue;
