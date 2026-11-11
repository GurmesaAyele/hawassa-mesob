import { useState, useEffect } from 'react';
import { API_CONFIG, buildUrl, getLocaleCode } from '../config/api';
import Navbar from './Navbar';
import InstitutionCard from './InstitutionCard';
import InstitutionModal from './InstitutionModal';

const VIPTicket = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState('English');
  const [step, setStep] = useState(1); // 1: Institutions, 2: Form, 3: Payment Callback, 4: Success
  
  // Institutions & Services
  const [institutions, setInstitutions] = useState([]);
  const [institutionsLoading, setInstitutionsLoading] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [expandedInstitution, setExpandedInstitution] = useState(null);
  const [showInstitutionModal, setShowInstitutionModal] = useState(false);
  
  // Form Data
  const [formData, setFormData] = useState({
    citizenName: '',
    citizenPhone: '',
    citizenEmail: '',
    serviceId: '',
    purpose: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Application Data
  const [applicationReference, setApplicationReference] = useState(null);
  const [applicationData, setApplicationData] = useState(null);
  
  // Payment Status
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const maxPollingAttempts = 20; // 60 seconds (3 seconds × 20)

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

  // Fetch institutions when modal opens
  useEffect(() => {
    if (isOpen && institutions.length === 0) {
      fetchInstitutions();
    }
  }, [isOpen]);

  // Restore application reference from localStorage on mount
  useEffect(() => {
    const savedReference = localStorage.getItem('vip_application_reference');
    if (savedReference) {
      setApplicationReference(savedReference);
    }
  }, []);

  const fetchInstitutions = async () => {
    setInstitutionsLoading(true);
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
      alert('Failed to load institutions. Please try again.');
    } finally {
      setInstitutionsLoading(false);
    }
  };

  const toggleInstitutionExpansion = (institutionId) => {
    setExpandedInstitution(expandedInstitution === institutionId ? null : institutionId);
  };

  const toggleServiceSelection = (service) => {
    console.log('=== SERVICE SELECTION ===');
    console.log('Service clicked:', service);
    console.log('Service ID:', service.id);
    console.log('Service structure:', JSON.stringify(service, null, 2));
    
    setSelectedServices((prev) => {
      const exists = prev.find(s => s.id === service.id);
      if (exists) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleInstitutionClick = (institution) => {
    setSelectedInstitution(institution);
    setShowInstitutionModal(true);
  };

  const handleCloseInstitutionModal = () => {
    setShowInstitutionModal(false);
    setSelectedInstitution(null);
  };

  const handleProceedToForm = () => {
    if (selectedServices.length === 0) {
      alert('Please select at least one service');
      return;
    }
    setShowInstitutionModal(false);
    setStep(2);
  };

  const validateForm = () => {
    const errors = {};
    
    // Validate citizen name
    if (!formData.citizenName.trim()) {
      errors.citizenName = 'Full name is required';
    }
    
    // Validate Ethiopian phone number
    const phonePattern = /^(\+251|0)[79]\d{8}$/;
    if (!formData.citizenPhone.trim()) {
      errors.citizenPhone = 'Phone number is required';
    } else if (!phonePattern.test(formData.citizenPhone)) {
      errors.citizenPhone = 'Invalid Ethiopian phone number (e.g., 0911223344)';
    }
    
    // Validate email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.citizenEmail.trim()) {
      errors.citizenEmail = 'Email is required';
    } else if (!emailPattern.test(formData.citizenEmail)) {
      errors.citizenEmail = 'Invalid email address';
    }
    
    // Validate service selection
    if (selectedServices.length === 0) {
      errors.serviceId = 'Please select at least one service';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create VIP application for the first service
      // NOTE: Backend expects single serviceId, but we allow multiple selections
      // Solution: Create application for first service, include all in purpose
      const primaryService = selectedServices[0];
      const allServiceNames = selectedServices.map(s => s.title || s.name).join(', ');
      
      const requestBody = {
        citizenName: formData.citizenName.trim(),
        citizenPhone: formData.citizenPhone.trim(),
        email: formData.citizenEmail.trim(), // ✅ Add email field required by backend
        serviceId: primaryService.id,
        purpose: formData.purpose.trim() || `VIP Service Request: ${allServiceNames}`
      };

      console.log('=== VIP APPLICATION REQUEST ===');
      console.log('URL:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VIP_TICKETS}`);
      console.log('Body:', requestBody);
      console.log('Service details:', primaryService);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VIP_TICKETS}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      let result;
      try {
        result = await response.json();
        console.log('Response body:', result);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Server returned invalid response. Please contact support.');
      }

      if (!response.ok) {
        // Detailed error message
        const errorMsg = result.error || result.message || `Server error (${response.status})`;
        console.error('Server error details:', {
          status: response.status,
          error: errorMsg,
          fullResponse: result
        });
        
        // User-friendly error messages
        if (response.status === 400) {
          throw new Error(`Invalid request: ${errorMsg}`);
        } else if (response.status === 404) {
          throw new Error('VIP service endpoint not found. Please contact support.');
        } else if (response.status === 500) {
          throw new Error(`Server error: ${errorMsg}. Please try again or contact support.`);
        } else {
          throw new Error(errorMsg);
        }
      }

      if (result.success && result.data) {
        // Save application reference and data
        const reference = result.data.reference;
        console.log('✅ VIP application created successfully:', reference);
        
        setApplicationReference(reference);
        setApplicationData(result.data);
        localStorage.setItem('vip_application_reference', reference);
        
        // Initialize payment
        await initializePayment(reference);
      } else {
        console.error('Invalid response structure:', result);
        throw new Error('Invalid response from server. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error creating VIP application:', error);
      
      // User-friendly alert with more details
      let alertMessage = 'Failed to submit VIP application.\n\n';
      
      if (error.message.includes('Failed to fetch')) {
        alertMessage += 'Cannot connect to server. Please check:\n';
        alertMessage += '- Internet connection\n';
        alertMessage += '- Backend server is running\n';
        alertMessage += '- Server URL: ' + API_CONFIG.BASE_URL;
      } else {
        alertMessage += 'Error: ' + error.message;
      }
      
      alert(alertMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const initializePayment = async (reference) => {
    try {
      const requestBody = {
        reference: reference,
        email: formData.citizenEmail.trim(), // Now using the email from form
        returnUrl: `${window.location.origin}/vip/payment/callback?reference=${encodeURIComponent(reference)}`
      };

      console.log('Initializing payment:', requestBody);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VIP_PAYMENTS_INITIALIZE}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      const result = await response.json();
      console.log('Payment initialization response:', result);

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 409) {
          // Already paid or in queue
          alert(result.error || 'This application is already processed');
          await checkPaymentStatus(reference);
          return;
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        } else {
          throw new Error(result.error || 'Failed to initialize payment');
        }
      }

      if (result.success && result.data && result.data.checkoutUrl) {
        // Redirect to Chapa checkout
        console.log('Redirecting to checkout:', result.data.checkoutUrl);
        window.location.href = result.data.checkoutUrl;
      } else {
        throw new Error('Invalid payment response from server');
      }
    } catch (error) {
      console.error('Error initializing payment:', error);
      alert(error.message || 'Failed to initialize payment. Please try again.');
    }
  };

  const checkPaymentStatus = async (reference) => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VIP_PAYMENTS_STATUS}/${reference}`
      );

      const result = await response.json();
      console.log('Payment status:', result);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Payment session not found');
        }
        throw new Error(result.error || 'Failed to check payment status');
      }

      if (result.success && result.data) {
        setPaymentStatus(result.data);
        
        if (result.data.isConfirmed) {
          // Payment confirmed, show success
          setStep(4);
          setIsPolling(false);
          localStorage.removeItem('vip_application_reference');
        } else if (result.data.isPending) {
          // Continue polling
          return true;
        } else if (result.data.canRetry) {
          // Payment failed, allow retry
          setIsPolling(false);
          if (confirm(`Payment failed: ${result.data.errorMessage || 'Unknown error'}.\n\nWould you like to retry?`)) {
            await initializePayment(reference);
          }
        }
      }
      
      return false; // Stop polling
    } catch (error) {
      console.error('Error checking payment status:', error);
      setIsPolling(false);
      return false;
    }
  };

  const startPaymentPolling = (reference) => {
    setIsPolling(true);
    setPollingAttempts(0);
    setStep(3); // Show loading/callback screen

    const pollInterval = setInterval(async () => {
      setPollingAttempts(prev => {
        const newAttempts = prev + 1;
        
        if (newAttempts >= maxPollingAttempts) {
          clearInterval(pollInterval);
          setIsPolling(false);
          alert('Payment verification is taking longer than expected. Please check your payment status later.');
          return newAttempts;
        }
        
        return newAttempts;
      });

      const shouldContinue = await checkPaymentStatus(reference);
      
      if (!shouldContinue) {
        clearInterval(pollInterval);
      }
    }, 3000); // Poll every 3 seconds

    // Initial check
    checkPaymentStatus(reference);
  };

  const handleRetryPayment = async () => {
    if (applicationReference) {
      await initializePayment(applicationReference);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset after animation
    setTimeout(() => {
      setStep(1);
      setSelectedServices([]);
      setExpandedInstitution(null);
      setFormData({
        citizenName: '',
        citizenPhone: '',
        citizenEmail: '',
        serviceId: '',
        purpose: ''
      });
      setFormErrors({});
      setPaymentStatus(null);
      setIsPolling(false);
      setPollingAttempts(0);
    }, 300);
  };

  const getLogoUrl = (logoPath) => {
    if (!logoPath) return null;
    if (logoPath.startsWith('http')) return logoPath;
    return `${API_CONFIG.BASE_URL}${logoPath}`;
  };

  // Translations
  const translations = {
    English: {
      title: 'VIP Ticket Service',
      subtitle: 'Fast Track Service - 1,000 ETB',
      selectInstitution: 'Select Institution & Services',
      selectServices: 'Choose services from any institution below',
      noServices: 'No services available',
      noInstitutions: 'No institutions available at the moment',
      servicesSelected: 'service(s) selected',
      selectedServices: 'Selected Services',
      proceed: 'Proceed to Application',
      proceedToForm: 'Proceed to Application',
      applicationForm: 'VIP Application Form',
      citizenName: 'Full Name',
      citizenNamePlaceholder: 'Enter your full name',
      citizenPhone: 'Phone Number',
      citizenPhonePlaceholder: '0911223344 or +251911223344',
      citizenEmail: 'Email Address',
      citizenEmailPlaceholder: 'example@email.com',
      purpose: 'Purpose (Optional)',
      purposePlaceholder: 'Reason for VIP service request',
      submitApplication: 'Submit & Pay',
      processingPayment: 'Processing Payment...',
      paymentSuccess: 'Payment Successful!',
      ticketIssued: 'Your VIP ticket has been issued',
      applicationReference: 'Application Reference',
      checkInInstructions: 'Please check in at Hawassa MESOB Center to join the priority queue',
      done: 'Done',
      back: 'Back',
      loading: 'Loading institutions...',
      vipFee: 'VIP Fee',
      currency: 'ETB'
    },
    Amharic: {
      title: 'ቪአይፒ ትኬት አገልግሎት',
      subtitle: 'ፈጣን አገልግሎት - 1,000 ብር',
      selectInstitution: 'ተቋም እና አገልግሎት ይምረጡ',
      selectServices: 'ከታች ካሉት ተቋማት አገልግሎቶችን ይምረጡ',
      noServices: 'ምንም አገልግሎቶች የሉም',
      noInstitutions: 'በአሁኑ ጊዜ ምንም ተቋማት የሉም',
      servicesSelected: 'አገልግሎት(ቶች) ተመርጠዋል',
      selectedServices: 'የተመረጡ አገልግሎቶች',
      proceed: 'ወደ ማመልከቻ ቀጥል',
      proceedToForm: 'ወደ ማመልከቻ ቀጥል',
      applicationForm: 'የቪአይፒ ማመልከቻ ቅጽ',
      citizenName: 'ሙሉ ስም',
      citizenNamePlaceholder: 'ሙሉ ስምዎን ያስገቡ',
      citizenPhone: 'ስልክ ቁጥር',
      citizenPhonePlaceholder: '0911223344 ወይም +251911223344',
      citizenEmail: 'ኢሜይል አድራሻ',
      citizenEmailPlaceholder: 'ምሳሌ@ኢሜይል.com',
      purpose: 'ዓላማ (አማራጭ)',
      purposePlaceholder: 'የቪአይፒ አገልግሎት ጥያቄ ምክንያት',
      submitApplication: 'አስገባ እና ይክፈሉ',
      processingPayment: 'ክፍያ በማስኬድ ላይ...',
      paymentSuccess: 'ክፍያ ተሳክቷል!',
      ticketIssued: 'የቪአይፒ ትኬትዎ ተሰጥቷል',
      applicationReference: 'የማመልከቻ ማጣቀሻ',
      checkInInstructions: 'እባክዎ በሀዋሳ መሶብ ማዕከል ተመዝግበው ወደ ቅድሚያ ወረፋ ይቀላቀሉ',
      done: 'ተከናውኗል',
      back: 'ተመለስ',
      loading: 'ተቋማት በመጫን ላይ...',
      vipFee: 'የቪአይፒ ክፍያ',
      currency: 'ብር'
    },
    Sidama: {
      title: 'VIP Tiketi Oosate',
      subtitle: 'Furgissi Oosate - 1,000 Birra',
      selectInstitution: 'Biiro nna Oosate Doorri',
      selectServices: 'Qaala Biirota horoonsi oosate doorri',
      noServices: 'Oosate yookki',
      noInstitutions: 'Ammayyo biirota hin qabnu',
      servicesSelected: 'oosate doorrame',
      selectedServices: 'Doorrame Oosate',
      proceed: 'Maalifinsa gede haa',
      proceedToForm: 'Maalifinsa gede haa',
      applicationForm: 'VIP Maalifinsa Foromi',
      citizenName: 'Mala Sunti',
      citizenNamePlaceholder: 'Mala suntira galfadhu',
      citizenPhone: 'Bilbila Lakki',
      citizenPhonePlaceholder: '0911223344 woy +251911223344',
      citizenEmail: 'Imeela Borroha',
      citizenEmailPlaceholder: 'leellancha@imeela.com',
      purpose: 'Hiikko (Amaaraa)',
      purposePlaceholder: 'VIP oosate maalifinsa hiikko',
      submitApplication: 'Ergadhu nna Kaffali',
      processingPayment: 'Kaffaltii hojjechado...',
      paymentSuccess: 'Kaffaltii milkaae!',
      ticketIssued: 'VIP tiketira kenna',
      applicationReference: 'Maalifinsa Refereensa',
      checkInInstructions: 'Hawassa MESOB Seentera ware priority queue gede haa',
      done: 'Xumure',
      back: 'Deema',
      loading: 'Biirota laaqqa gede...',
      vipFee: 'VIP Kaffaltii',
      currency: 'Birra'
    }
  };

  const t = translations[language] || translations.English;
  
  // If modal is open in step 1 (institution selection), show as full page
  if (isOpen && step === 1) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-[#0F1419] overflow-y-auto">
        <Navbar />
        
        {/* Header Section */}
        <div className="pt-20 sm:pt-24 pb-8 sm:pb-10 md:pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#294491] to-[#CB9D2A]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">{t.title}</h1>
                <p className="text-base sm:text-lg md:text-xl text-white/90">{t.selectInstitution}</p>
              </div>
              <button 
                onClick={handleClose} 
                className="p-2 sm:p-3 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Institutions Grid */}
        <div className="py-10 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {institutionsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20">
                <div className="animate-spin rounded-full h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 border-t-4 border-b-4 border-[#CB9D2A] mb-3 sm:mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">{t.loading || 'Loading institutions...'}</p>
              </div>
            ) : institutions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20 px-4">
                <svg className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-gray-400 dark:text-gray-600 mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">{t.noInstitutions || 'No institutions available'}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
                  {institutions.map((institution, index) => (
                    <InstitutionCard
                      key={institution.id}
                      institution={institution}
                      index={index}
                      onClick={() => handleInstitutionClick(institution)}
                    />
                  ))}
                </div>

                {/* Selected Services Summary (floating) - Only show when services are selected */}
                {selectedServices.length > 0 && (
                  <div className="fixed bottom-6 right-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm z-50">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-3">
                      {t.selectedServices || 'Selected Services'} ({selectedServices.length})
                    </h4>
                    <ul className="space-y-2 mb-4">
                      {selectedServices.map((service) => (
                        <li key={service.id} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <svg className="w-4 h-4 text-[#CB9D2A]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {service.title || service.name}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={handleProceedToForm}
                      className="w-full px-4 py-2 bg-[#CB9D2A] hover:bg-[#b8892a] text-white font-semibold rounded-lg transition-colors"
                    >
                      {t.proceed || 'Proceed to Application'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Institution Modal for Service Selection */}
        {showInstitutionModal && selectedInstitution && (
          <InstitutionModal
            institution={selectedInstitution}
            onClose={handleCloseInstitutionModal}
            language={language}
            isVIPMode={true}
            selectedServices={selectedServices}
            onServiceToggle={toggleServiceSelection}
            onProceed={handleProceedToForm}
          />
        )}
      </div>
    );
  }

  return (
    <>
      {/* VIP Ticket Button - Left Side */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col items-center gap-2">
        <span className="text-xs font-medium px-2 py-1 rounded text-white shadow-lg" style={{ backgroundColor: '#CB9D2A' }}>
          VIP Ticket
        </span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-4 rounded-full shadow-2xl hover:scale-110 transition-transform duration-200"
          style={{ backgroundColor: '#CB9D2A' }}
          aria-label="Open VIP Ticket Service"
        >
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
        </button>
      </div>

      {/* VIP Ticket Modal - For Steps 2, 3, 4 */}
      {isOpen && step !== 1 && (
        <div 
          className={`fixed z-50 bg-[#1E293B] transition-all duration-300 overflow-hidden ${
            step === 1 
              ? 'inset-0' 
              : 'bottom-24 left-6 w-[520px] max-h-[700px] rounded-2xl shadow-2xl'
          }`}
        >
          {/* Header */}
          <div className="p-5 text-white flex items-center justify-between border-b border-gray-700" style={{ backgroundColor: '#CB9D2A' }}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg">{t.title}</h3>
                <p className="text-xs text-white/90">{t.subtitle}</p>
              </div>
            </div>
            <button 
              onClick={handleClose} 
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto" style={{ maxHeight: step === 1 ? 'calc(100vh - 80px)' : '600px' }}>
            {/* Step 1: Institution & Service Selection - Full Screen */}
            {step === 1 && (
              <div className="p-6">
                <h4 className="text-2xl font-bold text-white mb-2">{t.selectInstitution}</h4>
                <p className="text-gray-400 mb-6">{t.selectServices}</p>

                {institutionsLoading ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#CB9D2A]"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {institutions.map((institution) => (
                      <div key={institution.id} className="bg-[#2D3748] rounded-xl overflow-hidden">
                        {/* Institution Header */}
                        <button
                          onClick={() => toggleInstitutionExpansion(institution.id)}
                          className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#3B4A5F] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {getLogoUrl(institution.logo || institution.icon) ? (
                              <img
                                src={getLogoUrl(institution.logo || institution.icon)}
                                alt={institution.name}
                                className="w-10 h-10 object-contain rounded"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-gray-600 flex items-center justify-center text-white font-bold">
                                {institution.name?.charAt(0)}
                              </div>
                            )}
                            <div className="text-left">
                              <h5 className="font-semibold text-white">{institution.name}</h5>
                              {institution.services && (
                                <p className="text-sm text-gray-400">{institution.services.length} services</p>
                              )}
                            </div>
                          </div>
                          <svg 
                            className={`w-5 h-5 text-gray-400 transition-transform ${
                              expandedInstitution === institution.id ? 'rotate-180' : ''
                            }`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Services Dropdown */}
                        {expandedInstitution === institution.id && (
                          <div className="px-5 pb-4 space-y-2">
                            {institution.services && institution.services.length > 0 ? (
                              institution.services.map((service) => {
                                const isSelected = selectedServices.find(s => s.id === service.id);
                                return (
                                  <button
                                    key={service.id}
                                    onClick={() => toggleServiceSelection(service)}
                                    className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
                                      isSelected
                                        ? 'bg-[#CB9D2A] text-white'
                                        : 'bg-[#1E293B] text-gray-300 hover:bg-[#3B4A5F]'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium">{service.title || service.name}</span>
                                      {isSelected && (
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </div>
                                    {service.description && (
                                      <p className={`text-sm mt-1 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                                        {service.description}
                                      </p>
                                    )}
                                  </button>
                                );
                              })
                            ) : (
                              <p className="text-gray-500 text-sm py-2">{t.noServices}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Services Summary & Proceed Button */}
                {selectedServices.length > 0 && (
                  <div className="mt-6 p-4 bg-[#2D3748] rounded-xl">
                    <p className="text-white font-semibold mb-2">
                      {selectedServices.length} {t.servicesSelected}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedServices.map((service) => (
                        <span
                          key={service.id}
                          className="px-3 py-1 bg-[#CB9D2A] text-white text-sm rounded-full"
                        >
                          {service.title || service.name}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={handleProceedToForm}
                      className="w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90"
                      style={{ backgroundColor: '#CB9D2A' }}
                    >
                      {t.proceedToForm}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Application Form */}
            {step === 2 && (
              <div className="p-6">
                <h4 className="text-xl font-bold text-white mb-4">{t.applicationForm}</h4>
                
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {/* Citizen Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t.citizenName} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="citizenName"
                      value={formData.citizenName}
                      onChange={handleInputChange}
                      placeholder={t.citizenNamePlaceholder}
                      className={`w-full px-4 py-2.5 rounded-lg outline-none bg-[#2D3748] text-white border-2 transition-colors ${
                        formErrors.citizenName 
                          ? 'border-red-500' 
                          : 'border-transparent focus:border-[#CB9D2A]'
                      }`}
                    />
                    {formErrors.citizenName && (
                      <p className="text-red-400 text-sm mt-1">{formErrors.citizenName}</p>
                    )}
                  </div>

                  {/* Citizen Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t.citizenPhone} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="citizenPhone"
                      value={formData.citizenPhone}
                      onChange={handleInputChange}
                      placeholder={t.citizenPhonePlaceholder}
                      className={`w-full px-4 py-2.5 rounded-lg outline-none bg-[#2D3748] text-white border-2 transition-colors ${
                        formErrors.citizenPhone 
                          ? 'border-red-500' 
                          : 'border-transparent focus:border-[#CB9D2A]'
                      }`}
                    />
                    {formErrors.citizenPhone && (
                      <p className="text-red-400 text-sm mt-1">{formErrors.citizenPhone}</p>
                    )}
                  </div>

                  {/* Citizen Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t.citizenEmail} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="citizenEmail"
                      value={formData.citizenEmail}
                      onChange={handleInputChange}
                      placeholder={t.citizenEmailPlaceholder}
                      className={`w-full px-4 py-2.5 rounded-lg outline-none bg-[#2D3748] text-white border-2 transition-colors ${
                        formErrors.citizenEmail 
                          ? 'border-red-500' 
                          : 'border-transparent focus:border-[#CB9D2A]'
                      }`}
                    />
                    {formErrors.citizenEmail && (
                      <p className="text-red-400 text-sm mt-1">{formErrors.citizenEmail}</p>
                    )}
                  </div>

                  {/* Purpose */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t.purpose}
                    </label>
                    <textarea
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleInputChange}
                      placeholder={t.purposePlaceholder}
                      rows="3"
                      className="w-full px-4 py-2.5 rounded-lg outline-none bg-[#2D3748] text-white border-2 border-transparent focus:border-[#CB9D2A] transition-colors resize-none"
                    />
                  </div>

                  {/* Selected Services Display */}
                  <div className="bg-[#2D3748] rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-2">Selected Services:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedServices.map((service) => (
                        <span
                          key={service.id}
                          className="px-3 py-1 bg-[#CB9D2A]/20 text-[#CB9D2A] text-sm rounded-full"
                        >
                          {service.title || service.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* VIP Fee Info */}
                  <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                    <p className="text-blue-200 text-sm">
                      <strong>{t.vipFee}:</strong> 1,000 {t.currency}
                    </p>
                    <p className="text-blue-300 text-xs mt-1">
                      Fast-track service with priority queue access
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-3 rounded-lg font-semibold border-2 border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
                      disabled={isSubmitting}
                    >
                      {t.back}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#CB9D2A' }}
                    >
                      {isSubmitting ? t.processingPayment : t.submitApplication}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: Payment Callback / Polling */}
            {step === 3 && (
              <div className="p-6 text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#CB9D2A] mx-auto mb-6"></div>
                <h4 className="text-2xl font-bold text-white mb-2">{t.processingPayment}</h4>
                <p className="text-gray-400 mb-4">
                  Confirming your payment with Hawassa MESOB...
                </p>
                {isPolling && (
                  <p className="text-sm text-gray-500">
                    Attempt {pollingAttempts} of {maxPollingAttempts}
                  </p>
                )}
                
                {paymentStatus && paymentStatus.canRetry && (
                  <div className="mt-6">
                    <p className="text-red-400 mb-4">
                      {paymentStatus.errorMessage || 'Payment was not completed'}
                    </p>
                    <button
                      onClick={handleRetryPayment}
                      className="px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90"
                      style={{ backgroundColor: '#CB9D2A' }}
                    >
                      Retry Payment
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Success */}
            {step === 4 && paymentStatus && paymentStatus.isConfirmed && (
              <div className="p-6 text-center py-8">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#CB9D2A' }}>
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-2xl font-bold text-white mb-2">{t.paymentSuccess}</h4>
                <p className="text-gray-400 mb-6">{t.ticketIssued}</p>
                
                {/* Ticket Details */}
                <div className="bg-gradient-to-r from-[#CB9D2A] to-[#B8965F] text-white rounded-lg p-6 mb-6">
                  <p className="text-sm opacity-90 mb-2">VIP TICKET</p>
                  <p className="text-2xl font-bold mb-1">{formData.citizenName}</p>
                  <p className="text-sm opacity-90 mb-1">{formData.citizenPhone}</p>
                  <div className="mt-4 pt-4 border-t border-white/30">
                    <p className="text-xs font-semibold mb-1">{t.applicationReference}:</p>
                    <p className="text-lg font-mono">{paymentStatus.applicationReference}</p>
                  </div>
                </div>

                {/* Check-in Instructions */}
                <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 mb-6">
                  <p className="text-blue-200 text-sm">
                    {t.checkInInstructions}
                  </p>
                </div>

                <button
                  onClick={handleClose}
                  className="w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90"
                  style={{ backgroundColor: '#CB9D2A' }}
                >
                  {t.done}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default VIPTicket;
