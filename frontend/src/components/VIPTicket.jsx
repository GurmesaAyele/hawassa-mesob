import { useState, useEffect } from 'react';
import { API_CONFIG, getLocaleCode, resolveLocalizedValue } from '../config/api';
import Navbar from './Navbar';
import InstitutionCard from './InstitutionCard';
import InstitutionModal from './InstitutionModal';

const VIPTicket = () => {
  // Restore flow state from sessionStorage / localStorage so page refresh doesn't lose step or services
  const [isOpen, setIsOpen] = useState(() => {
    try {
      return sessionStorage.getItem('vip_flow_is_open') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [language, setLanguage] = useState('English');
  const [step, setStep] = useState(() => {
    try {
      const saved = sessionStorage.getItem('vip_flow_step');
      const num = parseInt(saved, 10);
      return num >= 1 && num <= 4 ? num : 1;
    } catch (e) {
      return 1;
    }
  });
  const [isServicesMinimized, setIsServicesMinimized] = useState(() => {
    try {
      return sessionStorage.getItem('vip_flow_services_minimized') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [ticketZoom, setTicketZoom] = useState(1);

  // Institutions & Services
  const [institutions, setInstitutions] = useState([]);
  const [institutionsLoading, setInstitutionsLoading] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [vipSearchQuery, setVipSearchQuery] = useState('');
  const [selectedServices, setSelectedServices] = useState(() => {
    try {
      const saved = sessionStorage.getItem('vip_flow_selected_services') || localStorage.getItem('vip_selected_services');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [showInstitutionModal, setShowInstitutionModal] = useState(false);

  // Form Data
  const [formData, setFormData] = useState(() => {
    try {
      const saved = sessionStorage.getItem('vip_flow_form_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {}
    return {
      citizenName: localStorage.getItem('vip_citizen_name') || '',
      citizenPhone: localStorage.getItem('vip_citizen_phone') || '',
      citizenEmail: '',
      serviceId: '',
      purpose: ''
    };
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

  // Save flow state across browser refreshes so user never loses their page or selected services
  useEffect(() => {
    try {
      sessionStorage.setItem('vip_flow_is_open', isOpen ? 'true' : 'false');
      sessionStorage.setItem('vip_flow_step', step.toString());
      sessionStorage.setItem('vip_flow_services_minimized', isServicesMinimized ? 'true' : 'false');
      sessionStorage.setItem('vip_flow_selected_services', JSON.stringify(selectedServices));
      sessionStorage.setItem('vip_flow_form_data', JSON.stringify(formData));
      if (selectedServices.length > 0) {
        localStorage.setItem('vip_selected_services', JSON.stringify(selectedServices));
      }
      if (formData.citizenName) {
        localStorage.setItem('vip_citizen_name', formData.citizenName);
      }
      if (formData.citizenPhone) {
        localStorage.setItem('vip_citizen_phone', formData.citizenPhone);
      }
    } catch (e) {
      console.warn('Failed to sync VIP flow state to storage:', e);
    }
  }, [isOpen, step, isServicesMinimized, selectedServices, formData]);

  // Listen for openVipTicket events from public dashboard or buttons
  useEffect(() => {
    const handleOpenVip = (event) => {
      setIsOpen(true);
      if (event.detail?.service) {
        setSelectedServices((prev) => {
          const exists = prev.find((s) => s.id === event.detail.service.id);
          return exists ? prev : [...prev, event.detail.service];
        });
      }
    };
    window.addEventListener('openVipTicket', handleOpenVip);
    return () => window.removeEventListener('openVipTicket', handleOpenVip);
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

      let institutionsArray = [];
      if (Array.isArray(data)) {
        institutionsArray = data;
      } else if (data.data && Array.isArray(data.data)) {
        institutionsArray = data.data;
      } else if (data.institutions && Array.isArray(data.institutions)) {
        institutionsArray = data.institutions;
      }

      // Fetch services for each institution if not already included
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

  const toggleServiceSelection = (service) => {
    setSelectedServices((prev) => {
      const exists = prev.find(s => s.id === service.id);
      if (exists) {
        return prev.filter(s => s.id !== service.id);
      } else {
        const enriched = {
          ...service,
          institutionName: service.institutionName || selectedInstitution?.name || 'MESOB Institution',
          institutionId: service.institutionId || selectedInstitution?.id
        };
        return [...prev, enriched];
      }
    });
  };

  const handleRemoveService = (serviceId) => {
    setSelectedServices((prev) => prev.filter(s => s.id !== serviceId));
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
      alert(t.noServicesSelected || 'Please select at least one service');
      return;
    }
    setShowInstitutionModal(false);
    setStep(2);
  };

  const handleBackToServices = () => {
    setStep(1);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.citizenName.trim()) {
      errors.citizenName = 'Full name is required';
    }

    const phonePattern = /^(\+251|0)[79]\d{8}$/;
    if (!formData.citizenPhone.trim()) {
      errors.citizenPhone = 'Phone number is required';
    } else if (!phonePattern.test(formData.citizenPhone.trim())) {
      errors.citizenPhone = 'Invalid Ethiopian phone number (e.g., 0911223344 or +251911223344)';
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.citizenEmail.trim()) {
      errors.citizenEmail = 'Email is required';
    } else if (!emailPattern.test(formData.citizenEmail.trim())) {
      errors.citizenEmail = 'Invalid email address';
    }

    if (selectedServices.length === 0) {
      errors.serviceId = 'Please select at least one service';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      const primaryService = selectedServices[0];
      const serviceIds = selectedServices.map(s => s.id);
      const allServiceNames = selectedServices
        .map(s => resolveLocalizedValue(s.title, language) || resolveLocalizedValue(s.name, language) || (typeof s.title === 'string' ? s.title : s.title?.en) || 'Service')
        .join(', ');

      const requestBody = {
        citizenName: formData.citizenName.trim(),
        citizenPhone: formData.citizenPhone.trim(),
        email: formData.citizenEmail.trim(),
        serviceIds: serviceIds, // Send ALL selected service IDs
        serviceId: primaryService?.id || serviceIds[0], // Keep for backwards compatibility
        purpose: formData.purpose.trim() || `VIP Service Request: ${allServiceNames}`
      };

      console.log('=== VIP APPLICATION REQUEST ===', requestBody);
      console.log('Selected service count:', selectedServices.length, 'IDs:', serviceIds);

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

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Server returned invalid response. Please contact support.');
      }

      // Handle duplicate application gracefully
      if (response.status === 409 && result?.data?.reference) {
        const reference = result.data.reference;
        console.log('Existing active VIP application found:', reference);
        setApplicationReference(reference);
        localStorage.setItem('vip_application_reference', reference);
        if (selectedServices && selectedServices.length > 0) {
          localStorage.setItem('vip_selected_services', JSON.stringify(selectedServices));
        }
        await initializePayment(reference);
        return;
      }

      if (!response.ok) {
        const errorMsg = result.error || result.message || `Server error (${response.status})`;
        throw new Error(errorMsg);
      }

      if (result.success && result.data) {
        const reference = result.data.reference;
        console.log('✅ VIP application created successfully:', reference);

        setApplicationReference(reference);
        setApplicationData(result.data);
        localStorage.setItem('vip_application_reference', reference);
        if (selectedServices && selectedServices.length > 0) {
          localStorage.setItem('vip_selected_services', JSON.stringify(selectedServices));
        }
        if (formData.citizenName) {
          localStorage.setItem('vip_citizen_name', formData.citizenName);
        }
        if (formData.citizenPhone) {
          localStorage.setItem('vip_citizen_phone', formData.citizenPhone);
        }

        // Initialize payment
        await initializePayment(reference);
      } else {
        throw new Error('Invalid response from server. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error creating VIP application:', error);
      alert('Failed to submit VIP application: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const initializePayment = async (reference) => {
    try {
      const requestBody = {
        reference: reference,
        email: formData.citizenEmail.trim(),
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

      if (!response.ok) {
        if (response.status === 409) {
          alert(result.error || 'This application has already been processed');
          await checkPaymentStatus(reference);
          return;
        } else {
          throw new Error(result.error || 'Failed to initialize payment');
        }
      }

      if (result.success && result.data && result.data.checkoutUrl) {
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

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check payment status');
      }

      if (result.success && result.data) {
        setPaymentStatus(result.data);

        if (result.data.isConfirmed) {
          setStep(4);
          setIsPolling(false);
          localStorage.removeItem('vip_application_reference');
        } else if (result.data.isPending) {
          return true;
        } else if (result.data.canRetry) {
          setIsPolling(false);
          if (confirm(`Payment failed: ${result.data.errorMessage || 'Unknown error'}.\n\nWould you like to retry?`)) {
            await initializePayment(reference);
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking payment status:', error);
      setIsPolling(false);
      return false;
    }
  };

  const handleRetryPayment = async () => {
    if (applicationReference) {
      await initializePayment(applicationReference);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    try {
      sessionStorage.removeItem('vip_flow_is_open');
      sessionStorage.removeItem('vip_flow_step');
      sessionStorage.removeItem('vip_flow_services_minimized');
      sessionStorage.removeItem('vip_flow_selected_services');
      sessionStorage.removeItem('vip_flow_form_data');
    } catch (e) {}
    setTimeout(() => {
      setStep(1);
      setSelectedServices([]);
      setIsServicesMinimized(false);
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
      formSubtitle: 'Enter your contact details and review your selected services to secure your priority pass.',
      addMoreServices: 'Add More Services',
      backToServices: '← Add More Services',
      removeService: 'Remove',
      minimize: 'Minimize ▴',
      expand: 'Expand ▾',
      noServicesSelected: 'No services selected. Please select at least one service.',
      applicantDetails: 'Applicant Information',
      applicantDetailsDesc: 'Enter your details to generate your VIP priority ticket pass',
      citizenName: 'Full Name',
      citizenNamePlaceholder: 'Enter your full name',
      citizenPhone: 'Phone Number',
      citizenPhonePlaceholder: '0911223344 or +251911223344',
      citizenEmail: 'Email Address',
      citizenEmailPlaceholder: 'example@email.com',
      purpose: 'Purpose (Optional)',
      purposePlaceholder: 'Reason for VIP service request',
      submitApplication: 'Proceed to Payment',
      processingPayment: 'Processing Payment...',
      paymentSuccess: 'Payment Successful!',
      ticketIssued: 'Your VIP ticket has been issued',
      applicationReference: 'Application Reference',
      checkInInstructions: 'Please check in at Hawassa MESOB Center to join the priority queue',
      done: 'Done',
      back: 'Back',
      loading: 'Loading institutions...',
      vipFee: 'VIP Fee',
      currency: 'ETB',
      allServicesCovered: 'Single 1,000 ETB flat fee covers all selected services',
      priorityQueueAccess: 'Priority queue access at Hawassa MESOB Center',
      digitalQrPass: 'Instant digital ticket with QR pass',
      searchPlaceholder: 'Search for Services or Institutions...',
      matchingServices: 'Matching Services',
      matchingInstitutions: 'Matching Institutions',
      noSearchResults: 'No services or institutions found matching',
      clearSearch: 'Clear Search',
      selectForVIP: 'Select for VIP',
      selectedForVIP: 'Selected'
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
      formSubtitle: 'የእርስዎን መረጃ ያስገቡ እና የተመረጡትን አገልግሎቶች ይገምግሙ።',
      addMoreServices: 'ተጨማሪ አገልግሎቶችን አክል',
      backToServices: '← ተጨማሪ አገልግሎቶችን አክል',
      removeService: 'አስወግድ',
      minimize: 'አሳንስ ▴',
      expand: 'አስፋ ▾',
      noServicesSelected: 'ምንም አገልግሎት አልተመረጠም። እባክዎ ቢያንስ አንድ አገልግሎት ይምረጡ።',
      applicantDetails: 'የአመልካች መረጃ',
      applicantDetailsDesc: 'የቪአይፒ የቅድሚያ ትኬትዎን ለማመንጨት የእርስዎን አድራሻ ያስገቡ',
      citizenName: 'ሙሉ ስም',
      citizenNamePlaceholder: 'ሙሉ ስምዎን ያስገቡ',
      citizenPhone: 'ስልክ ቁጥር',
      citizenPhonePlaceholder: '0911223344 ወይም +251911223344',
      citizenEmail: 'ኢሜይል አድራሻ',
      citizenEmailPlaceholder: 'ምሳሌ@ኢሜይል.com',
      purpose: 'ዓላማ (አማራጭ)',
      purposePlaceholder: 'የቪአይፒ አገልግሎት ጥያቄ ምክንያት',
      submitApplication: 'ክፍያ ይፈጽሙ',
      processingPayment: 'ክፍያ በማስኬድ ላይ...',
      paymentSuccess: 'ክፍያ ተሳክቷል!',
      ticketIssued: 'የቪአይፒ ትኬትዎ ተሰጥቷል',
      applicationReference: 'የማመልከቻ ማጣቀሻ',
      checkInInstructions: 'እባክዎ በሀዋሳ መሶብ ማዕከል ተመዝግበው ወደ ቅድሚያ ወረፋ ይቀላቀሉ',
      done: 'ተከናውኗል',
      back: 'ተመለስ',
      loading: 'ተቋማት በመጫን ላይ...',
      vipFee: 'የቪአይፒ ክፍያ',
      currency: 'ብር',
      allServicesCovered: 'አንድ 1,000 ብር ክፍያ ሁሉንም የተመረጡ አገልግሎቶችን ያካትታል',
      priorityQueueAccess: 'በሀዋሳ መሶብ ማዕከል የቅድሚያ ወረፋ አገልግሎት',
      digitalQrPass: 'ፈጣን የዲጂታል ትኬት ከQR ኮድ ጋር',
      searchPlaceholder: 'አገልግሎቶችን ወይም ተቋማትን ይፈልጉ...',
      matchingServices: 'ተዛማጅ አገልግሎቶች',
      matchingInstitutions: 'ተዛማጅ ተቋማት',
      noSearchResults: 'ምንም ተዛማጅ አገልግሎቶች ወይም ተቋማት አልተገኙም',
      clearSearch: 'ፍለጋ አጽዳ',
      selectForVIP: 'ለቪአይፒ ይምረጡ',
      selectedForVIP: 'ተመርጧል'
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
      formSubtitle: 'Mashaleessha galfadhu nna doorrame oosate la’’i',
      addMoreServices: 'Wole Oosate Lede',
      backToServices: '← Wole Oosate Lede',
      removeService: 'Hunsi',
      minimize: 'Shiqqeessi ▴',
      expand: 'Wodho ▾',
      noServicesSelected: 'Oosate mitturano hinoortinooni. Barbaachisa mittu oosate doorri.',
      applicantDetails: 'Maalifisaanchu Mashaleessha',
      applicantDetailsDesc: 'VIP tiketi daafira mashaleessha galfadhu',
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
      currency: 'Birra',
      allServicesCovered: 'Mitte 1,000 Birra kaffaltii doorrame oosate baala kaffaltanno',
      priorityQueueAccess: 'Hawassa MESOB Center giddo priority queue horoonsi',
      digitalQrPass: 'Afanshaano digital pass QR koodi ledo',
      searchPlaceholder: 'Oosate woy Biiro Hasa...',
      matchingServices: 'Xawaaqqanno Oosate',
      matchingInstitutions: 'Xawaaqqanno Biiro',
      noSearchResults: 'Hasaamboonniri oosate woy biiro di-afantino',
      clearSearch: 'Hasa Qulqulleessi',
      selectForVIP: 'VIP doorri',
      selectedForVIP: 'Doorrame'
    }
  };

  const t = translations[language] || translations.English;

  // Resolve all ticket services for Step 4
  const finalTicketServices = (() => {
    const list = [];
    const seen = new Set();
    const add = (s) => {
      if (!s) return;
      const id = s.id || (typeof s === 'string' ? s : null);
      const title = resolveLocalizedValue(s.title, language) || resolveLocalizedValue(s.name, language) || (typeof s === 'string' ? s : '');
      const key = id || title;
      if (key && !seen.has(key)) {
        seen.add(key);
        list.push(s);
      }
    };
    if (Array.isArray(paymentStatus?.services)) {
      paymentStatus.services.forEach(add);
    }
    if (Array.isArray(selectedServices)) {
      selectedServices.forEach(add);
    }
    try {
      const stored = JSON.parse(localStorage.getItem('vip_selected_services') || '[]');
      if (Array.isArray(stored)) {
        stored.forEach(add);
      }
    } catch (e) {}
    return list;
  })();

  // Filtered institutions and services for Step 1 VIP search
  const trimmedSearch = vipSearchQuery.trim().toLowerCase();

  const matchedInstitutions = trimmedSearch
    ? institutions.filter((inst) => {
        const name = (resolveLocalizedValue(inst.name, language) || inst.name || '').toLowerCase();
        const desc = (resolveLocalizedValue(inst.description, language) || inst.description || '').toLowerCase();
        const code = (inst.code || '').toLowerCase();
        return name.includes(trimmedSearch) || desc.includes(trimmedSearch) || code.includes(trimmedSearch);
      })
    : institutions;

  const matchedServices = [];
  if (trimmedSearch) {
    institutions.forEach((inst) => {
      const instName = resolveLocalizedValue(inst.name, language) || inst.name || 'MESOB Institution';
      (inst.services || []).forEach((srv) => {
        const title = (
          resolveLocalizedValue(srv.title, language) ||
          resolveLocalizedValue(srv.name, language) ||
          srv.title ||
          srv.name ||
          ''
        ).toLowerCase();
        const desc = (resolveLocalizedValue(srv.description, language) || srv.description || '').toLowerCase();
        if (title.includes(trimmedSearch) || desc.includes(trimmedSearch) || instName.toLowerCase().includes(trimmedSearch)) {
          matchedServices.push({
            ...srv,
            institutionName: instName,
            institutionId: inst.id,
            institutionLogo: inst.logo
          });
        }
      });
    });
  }

  // Floating VIP launcher button when modal is closed
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 left-6 z-50 flex flex-col items-center gap-2">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white shadow-lg animate-pulse" style={{ backgroundColor: '#CB9D2A' }}>
          VIP Ticket
        </span>
        <button
          onClick={() => setIsOpen(true)}
          className="p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 group bg-gradient-to-tr from-[#B8860B] to-[#E6CA65] border-2 border-white/20"
          aria-label="Open VIP Ticket Service"
        >
          <svg className="w-7 h-7 text-slate-900 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
        </button>
      </div>
    );
  }

  // Full-Screen VIP Flow (Steps 1, 2, 3, 4)
  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-[#0F1419] overflow-y-auto flex flex-col">
      <Navbar />

      {/* Header Section */}
      <div className="pt-20 sm:pt-24 pb-8 sm:pb-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#294491] via-[#1E293B] to-[#CB9D2A] text-white shadow-xl relative">
        <div className="max-w-7xl mx-auto">
          {/* Top Title & Close */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-[#CB9D2A] text-slate-900 shadow-sm">
                  VIP FAST TRACK
                </span>
                <span className="text-xs text-white/80 font-medium">
                  Hawassa MESOB Center
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                {step === 1 && (t.title || 'VIP Ticket Service')}
                {step === 2 && (t.applicationForm || 'VIP Application Form')}
                {step === 3 && (t.processingPayment || 'Processing Payment...')}
                {step === 4 && (t.paymentSuccess || 'Payment Successful!')}
              </h1>
              <p className="text-sm sm:text-base text-white/85 mt-1 max-w-2xl">
                {step === 1 && (t.selectServices || 'Choose services from any institution below to add to your VIP priority ticket')}
                {step === 2 && (t.formSubtitle || 'Enter your details and review selected services to proceed to priority payment.')}
                {step === 3 && 'Verifying payment with Hawassa MESOB and issuing your priority pass...'}
                {step === 4 && (t.ticketIssued || 'Your VIP ticket has been issued successfully')}
              </p>
            </div>

            <button
              onClick={handleClose}
              className="p-2 sm:p-2.5 hover:bg-white/20 active:bg-white/30 rounded-full transition-all text-white/90 hover:text-white flex-shrink-0"
              aria-label="Close VIP Ticket Service"
              title="Close"
            >
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stepper Navigation */}
          <div className="mt-6 pt-5 border-t border-white/15 flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs sm:text-sm">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                step === 1
                  ? 'bg-white text-slate-900 font-bold shadow'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                step > 1 ? 'bg-emerald-500 text-white' : (step === 1 ? 'bg-[#CB9D2A] text-slate-900' : 'bg-white/30 text-white')
              }`}>
                {step > 1 ? '✓' : '1'}
              </span>
              <span>1. {t.selectServices || 'Select Services'}</span>
              {selectedServices.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-[#CB9D2A] text-slate-900">
                  {selectedServices.length}
                </span>
              )}
            </button>

            <span className="text-white/40">›</span>

            <button
              onClick={() => {
                if (selectedServices.length > 0) setStep(2);
              }}
              disabled={selectedServices.length === 0}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                step === 2
                  ? 'bg-white text-slate-900 font-bold shadow'
                  : (selectedServices.length > 0 ? 'bg-white/10 hover:bg-white/20 text-white' : 'opacity-40 cursor-not-allowed text-white/60')
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                step > 2 ? 'bg-emerald-500 text-white' : (step === 2 ? 'bg-[#CB9D2A] text-slate-900' : 'bg-white/30 text-white')
              }`}>
                {step > 2 ? '✓' : '2'}
              </span>
              <span>2. {t.applicationForm || 'Application Form'}</span>
            </button>

            <span className="text-white/40">›</span>

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium ${
              step >= 3 ? 'bg-white text-slate-900 font-bold shadow' : 'opacity-40 text-white/60'
            }`}>
              <span className="w-5 h-5 rounded-full bg-white/30 text-white flex items-center justify-center text-xs font-bold">
                {step === 4 ? '✓' : '3'}
              </span>
              <span>3. {t.vipFee || 'Payment & Pass'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {/* ================= STEP 1: SELECT INSTITUTIONS & SERVICES ================= */}
        {step === 1 && (
          <div className="py-8 sm:py-10 md:py-14 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              {institutionsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 sm:py-20">
                  <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-[#CB9D2A] mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg font-medium">{t.loading}</p>
                </div>
              ) : institutions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <svg className="w-20 h-20 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">{t.noInstitutions}</p>
                </div>
              ) : (
                <>
                  {/* Hero-styled Search Bar for VIP Institutions & Services */}
                  <div className="max-w-2xl mx-auto mb-8 sm:mb-10">
                    <div className="relative">
                      <input
                        type="text"
                        value={vipSearchQuery}
                        onChange={(e) => setVipSearchQuery(e.target.value)}
                        placeholder={t.searchPlaceholder || 'Search for Services or Institutions...'}
                        className="w-full px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 md:py-5 pr-14 sm:pr-16 rounded-full text-white placeholder-white/80 border-none focus:outline-none focus:ring-2 focus:ring-white/30 text-sm sm:text-base md:text-lg shadow-lg"
                        style={{ backgroundColor: '#294491' }}
                      />
                      {vipSearchQuery ? (
                        <button
                          type="button"
                          onClick={() => setVipSearchQuery('')}
                          className="absolute right-12 sm:right-14 top-1/2 -translate-y-1/2 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                          title="Clear Search"
                        >
                          ✕
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="absolute right-2 sm:right-3 md:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 md:p-3 rounded-full hover:bg-white/10 transition-colors"
                        aria-label="Search"
                      >
                        <svg
                          className="w-5 h-5 sm:w-5 h-5 md:w-6 h-6 text-white"
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
                  </div>

                  {/* If user is searching: display matched services and matched institutions */}
                  {trimmedSearch ? (
                    <div className="space-y-10 mb-8">
                      {/* Matched Services Section */}
                      {matchedServices.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                              <span>⚡ {t.matchingServices || 'Matching Services'}</span>
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#CB9D2A] text-slate-900">
                                {matchedServices.length}
                              </span>
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {matchedServices.map((service) => {
                              const selected = selectedServices.some((s) => s.id === service.id);
                              const titleText =
                                resolveLocalizedValue(service.title, language) ||
                                resolveLocalizedValue(service.name, language) ||
                                'Service';

                              return (
                                <div
                                  key={`${service.institutionId || ''}-${service.id}`}
                                  onClick={() => toggleServiceSelection(service)}
                                  className={`cursor-pointer rounded-2xl p-4 sm:p-5 transition-all duration-200 border-2 flex flex-col justify-between select-none ${
                                    selected
                                      ? 'bg-amber-500/10 border-[#CB9D2A] dark:bg-[#CB9D2A]/15 shadow-md'
                                      : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-gray-700/80 hover:border-[#CB9D2A]/50 hover:shadow-md'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#294491]/10 dark:bg-white/10 text-[#294491] dark:text-white truncate max-w-[200px]">
                                        {service.institutionName}
                                      </span>
                                      {service.processingDays ? (
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">
                                          {service.processingDays} {service.processingDays === 1 ? 'day' : 'days'}
                                        </span>
                                      ) : null}
                                    </div>

                                    <h4 className="font-extrabold text-base text-gray-900 dark:text-white leading-snug mb-1">
                                      {titleText}
                                    </h4>

                                    {service.description && (
                                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                                        {resolveLocalizedValue(service.description, language)}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 mt-2">
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                      {service.estimatedFee !== undefined && service.estimatedFee !== null
                                        ? service.estimatedFee === 0
                                          ? 'Free'
                                          : `${service.estimatedFee} ETB`
                                        : 'Standard Fee'}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleServiceSelection(service);
                                      }}
                                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                                        selected
                                          ? 'bg-[#CB9D2A] text-slate-900 shadow-sm'
                                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-[#CB9D2A] hover:text-slate-900'
                                      }`}
                                    >
                                      {selected ? (
                                        <>
                                          <span>✓</span>
                                          <span>{t.selectedForVIP || 'Selected'}</span>
                                        </>
                                      ) : (
                                        <>
                                          <span>+</span>
                                          <span>{t.selectForVIP || 'Select for VIP'}</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Matched Institutions Section */}
                      {matchedInstitutions.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                              <span>🏢 {t.matchingInstitutions || 'Matching Institutions'}</span>
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#294491] text-white">
                                {matchedInstitutions.length}
                              </span>
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-8">
                            {matchedInstitutions.map((institution, index) => (
                              <InstitutionCard
                                key={institution.id}
                                institution={institution}
                                index={index}
                                onClick={() => handleInstitutionClick(institution)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No Results Fallback */}
                      {matchedServices.length === 0 && matchedInstitutions.length === 0 && (
                        <div className="text-center py-16 px-4 bg-white dark:bg-[#1E293B] rounded-3xl border border-gray-200 dark:border-gray-800">
                          <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 font-bold mb-3">
                            {t.noSearchResults || 'No services or institutions found matching'} &ldquo;{vipSearchQuery}&rdquo;
                          </p>
                          <button
                            type="button"
                            onClick={() => setVipSearchQuery('')}
                            className="px-4 py-2 rounded-xl bg-[#294491] text-white font-bold text-xs sm:text-sm hover:opacity-90 transition-opacity"
                          >
                            {t.clearSearch || 'Clear Search'}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Default: Show all institutions */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-8">
                      {institutions.map((institution, index) => (
                        <InstitutionCard
                          key={institution.id}
                          institution={institution}
                          index={index}
                          onClick={() => handleInstitutionClick(institution)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Floating Selected Services Box in Step 1 */}
                  {selectedServices.length > 0 && (
                    <div className="fixed bottom-6 right-6 bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl p-5 max-w-sm w-full z-50 border-2 border-[#CB9D2A]/60 animate-fadeIn">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">
                            {t.selectedServices}
                          </h4>
                          <span className="px-2 py-0.5 text-xs font-black rounded-full bg-[#CB9D2A] text-slate-900">
                            {selectedServices.length}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[#CB9D2A]">1,000 ETB</span>
                      </div>

                      <ul className="space-y-1.5 mb-4 max-h-40 overflow-y-auto pr-1">
                        {selectedServices.map((service) => (
                          <li
                            key={service.id}
                            className="text-xs text-gray-700 dark:text-gray-300 flex items-center justify-between gap-2 p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/80"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <span className="text-[#CB9D2A] font-bold">✓</span>
                              <span className="truncate">
                                {resolveLocalizedValue(service.title, language) || resolveLocalizedValue(service.name, language)}
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveService(service.id);
                              }}
                              className="text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors"
                              title={t.removeService}
                            >
                              ✕
                            </button>
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={handleProceedToForm}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-[#B8860B] to-[#CB9D2A] hover:opacity-95 text-slate-900 font-extrabold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <span>{t.proceedToForm}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ================= STEP 2: FULL SCREEN APPLICATION FORM ================= */}
        {step === 2 && (
          <div className="max-w-6xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 animate-fadeIn">
            {/* Top Navigation Bar: Go Back / Add More Services */}
            <div className="flex items-center justify-between mb-6">
              <button
                type="button"
                onClick={handleBackToServices}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-sm transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>{t.backToServices || '← Add More Services'}</span>
              </button>

              <span className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
                {selectedServices.length} {t.servicesSelected}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Form Details (7 cols) */}
              <div className="lg:col-span-7 bg-white dark:bg-[#1E293B] rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-200/80 dark:border-gray-700/60">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-[#CB9D2A] flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                      {t.applicantDetails}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {t.applicantDetailsDesc}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-5">
                  {/* Citizen Name */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                      {t.citizenName} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="citizenName"
                      value={formData.citizenName}
                      onChange={handleInputChange}
                      placeholder={t.citizenNamePlaceholder}
                      className={`w-full px-4 py-3 rounded-xl outline-none bg-gray-50 dark:bg-gray-800/90 text-gray-900 dark:text-white border-2 transition-all ${
                        formErrors.citizenName
                          ? 'border-red-500 focus:ring-2 focus:ring-red-400/20'
                          : 'border-gray-200 dark:border-gray-700 focus:border-[#CB9D2A] focus:ring-2 focus:ring-[#CB9D2A]/20'
                      }`}
                    />
                    {formErrors.citizenName && (
                      <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-medium">
                        <span>⚠</span> {formErrors.citizenName}
                      </p>
                    )}
                  </div>

                  {/* Citizen Phone */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                      {t.citizenPhone} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="citizenPhone"
                      value={formData.citizenPhone}
                      onChange={handleInputChange}
                      placeholder={t.citizenPhonePlaceholder}
                      className={`w-full px-4 py-3 rounded-xl outline-none bg-gray-50 dark:bg-gray-800/90 text-gray-900 dark:text-white border-2 transition-all ${
                        formErrors.citizenPhone
                          ? 'border-red-500 focus:ring-2 focus:ring-red-400/20'
                          : 'border-gray-200 dark:border-gray-700 focus:border-[#CB9D2A] focus:ring-2 focus:ring-[#CB9D2A]/20'
                      }`}
                    />
                    {formErrors.citizenPhone ? (
                      <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-medium">
                        <span>⚠</span> {formErrors.citizenPhone}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Ethiopian phone: 0911223344 or +251911223344
                      </p>
                    )}
                  </div>

                  {/* Citizen Email */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                      {t.citizenEmail} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="citizenEmail"
                      value={formData.citizenEmail}
                      onChange={handleInputChange}
                      placeholder={t.citizenEmailPlaceholder}
                      className={`w-full px-4 py-3 rounded-xl outline-none bg-gray-50 dark:bg-gray-800/90 text-gray-900 dark:text-white border-2 transition-all ${
                        formErrors.citizenEmail
                          ? 'border-red-500 focus:ring-2 focus:ring-red-400/20'
                          : 'border-gray-200 dark:border-gray-700 focus:border-[#CB9D2A] focus:ring-2 focus:ring-[#CB9D2A]/20'
                      }`}
                    />
                    {formErrors.citizenEmail ? (
                      <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-medium">
                        <span>⚠</span> {formErrors.citizenEmail}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Payment confirmation & ticket will be sent here
                      </p>
                    )}
                  </div>

                  {/* Purpose */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                      {t.purpose}
                    </label>
                    <textarea
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleInputChange}
                      placeholder={t.purposePlaceholder}
                      rows="3"
                      className="w-full px-4 py-3 rounded-xl outline-none bg-gray-50 dark:bg-gray-800/90 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 focus:border-[#CB9D2A] focus:ring-2 focus:ring-[#CB9D2A]/20 transition-all resize-none text-sm"
                    />
                  </div>

                  {/* Form Action Buttons */}
                  <div className="pt-4 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={handleBackToServices}
                      className="flex-1 py-3.5 px-5 rounded-xl font-bold border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                      disabled={isSubmitting}
                    >
                      <span>{t.backToServices || '← Add More Services'}</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting || selectedServices.length === 0}
                      className="flex-[1.5] py-3.5 px-6 rounded-xl font-extrabold text-slate-900 bg-gradient-to-tr from-[#B8860B] via-[#CB9D2A] to-[#E6CA65] shadow-lg shadow-[#CB9D2A]/20 hover:shadow-xl hover:shadow-[#CB9D2A]/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                          <span>{t.processingPayment}</span>
                        </>
                      ) : (
                        <>
                          <span>{t.submitApplication} (1,000 ETB)</span>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Selected Services Management & Summary (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Services Card with Minimize & Remove capabilities */}
                <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-6 sm:p-7 shadow-xl border border-gray-200/80 dark:border-gray-700/60">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">
                        {t.selectedServices}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#CB9D2A] text-slate-900">
                        {selectedServices.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Minimize / Expand Toggle */}
                      {selectedServices.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsServicesMinimized(!isServicesMinimized)}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
                          title={isServicesMinimized ? 'Expand Services List' : 'Minimize Services List'}
                        >
                          <span>{isServicesMinimized ? t.expand : t.minimize}</span>
                        </button>
                      )}

                      {/* Add More Services Button */}
                      <button
                        type="button"
                        onClick={handleBackToServices}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/15 text-[#CB9D2A] hover:bg-amber-500/25 transition-colors flex items-center gap-1"
                        title="Add more services from institutions"
                      >
                        <span>+ {t.addMoreServices}</span>
                      </button>
                    </div>
                  </div>

                  {/* When Minimized */}
                  {isServicesMinimized && selectedServices.length > 0 && (
                    <div
                      onClick={() => setIsServicesMinimized(false)}
                      className="cursor-pointer p-4 rounded-xl bg-amber-500/10 border border-[#CB9D2A]/30 flex items-center justify-between hover:bg-amber-500/15 transition-all mb-4"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#CB9D2A] animate-pulse"></span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {selectedServices.length} {t.servicesSelected}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-[#CB9D2A]">
                        {t.expand}
                      </span>
                    </div>
                  )}

                  {/* When Expanded */}
                  {!isServicesMinimized && (
                    <>
                      {selectedServices.length === 0 ? (
                        <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl mb-4">
                          <svg className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium mb-3">
                            {t.noServicesSelected}
                          </p>
                          <button
                            type="button"
                            onClick={handleBackToServices}
                            className="px-4 py-2 bg-[#CB9D2A] text-slate-900 font-extrabold text-xs rounded-xl hover:bg-[#b8892a] transition-colors"
                          >
                            + {t.addMoreServices}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 mb-3">
                          {selectedServices.map((service) => (
                            <div
                              key={service.id}
                              className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 flex items-center justify-between gap-3 group hover:border-[#CB9D2A]/60 transition-all"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <span className="w-5 h-5 rounded-full bg-amber-500/15 text-[#CB9D2A] flex items-center justify-center text-xs font-bold flex-shrink-0">
                                  ✓
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                                    {resolveLocalizedValue(service.title, language) || resolveLocalizedValue(service.name, language)}
                                  </p>
                                  {service.institutionName && (
                                    <p className="text-[11px] text-amber-800/90 dark:text-amber-400/90 font-semibold truncate">
                                      {resolveLocalizedValue(service.institutionName, language)}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Remove / Minimize Service Button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveService(service.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex-shrink-0"
                                title={t.removeService}
                                aria-label="Remove service"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quick Add More button */}
                      {selectedServices.length > 0 && (
                        <button
                          type="button"
                          onClick={handleBackToServices}
                          className="w-full py-2 px-3 border border-dashed border-[#CB9D2A]/50 hover:border-[#CB9D2A] text-[#CB9D2A] font-bold text-xs rounded-xl hover:bg-amber-500/5 transition-all flex items-center justify-center gap-1.5 mb-2"
                        >
                          <span>+</span>
                          <span>{t.addMoreServices}</span>
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* VIP Pass Summary Card */}
                <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-3xl p-6 sm:p-7 shadow-xl border-2 border-[#CB9D2A]/40 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#CB9D2A]/10 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black tracking-widest text-[#E6CA65] uppercase">
                      VIP PRIORITY PASS
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase">
                      FAST TRACK
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-white/10">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">{t.vipFee}</p>
                      <p className="text-3xl font-black text-white">
                        1,000 <span className="text-sm font-bold text-[#E6CA65]">{t.currency}</span>
                      </p>
                    </div>
                    <p className="text-xs text-right text-white/70 max-w-[150px]">
                      {t.allServicesCovered}
                    </p>
                  </div>

                  <ul className="space-y-2 text-xs text-gray-300">
                    <li className="flex items-center gap-2">
                      <span className="text-[#CB9D2A] font-bold">✓</span>
                      <span>{t.priorityQueueAccess}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#CB9D2A] font-bold">✓</span>
                      <span>Dedicated VIP Reception & Assistance</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#CB9D2A] font-bold">✓</span>
                      <span>{t.digitalQrPass}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: PAYMENT POLLING ================= */}
        {step === 3 && (
          <div className="max-w-xl mx-auto py-16 px-4 text-center animate-fadeIn">
            <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-8 sm:p-10 shadow-2xl border border-gray-200 dark:border-gray-700">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#CB9D2A] mx-auto mb-6"></div>
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">{t.processingPayment}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
                Confirming your payment with Hawassa MESOB Center...
              </p>
              {isPolling && (
                <p className="text-xs text-gray-400 font-mono">
                  Verification check {pollingAttempts} of {maxPollingAttempts}
                </p>
              )}

              {paymentStatus && paymentStatus.canRetry && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-red-500 text-sm mb-4">
                    {paymentStatus.errorMessage || 'Payment was not completed'}
                  </p>
                  <button
                    onClick={handleRetryPayment}
                    className="px-6 py-3 rounded-xl font-bold text-slate-900 bg-[#CB9D2A] hover:bg-[#b8892a] transition-all shadow-md"
                  >
                    Retry Payment
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= STEP 4: SUCCESS TICKET VIEW (COMPACT, MODERN & ZOOMABLE) ================= */}
        {step === 4 && paymentStatus && paymentStatus.isConfirmed && (
          <div className="max-w-xl mx-auto py-10 px-4 text-center animate-fadeIn">
            {/* Print Stylesheet for clean modal ticket printing */}
            <style>{`
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #vip-modal-ticket-pass, #vip-modal-ticket-pass * {
                  visibility: visible !important;
                }
                #vip-modal-ticket-pass {
                  position: absolute !important;
                  left: 50% !important;
                  top: 20px !important;
                  transform: translateX(-50%) !important;
                  width: 100% !important;
                  max-width: 360px !important;
                  margin: 0 auto !important;
                  box-shadow: none !important;
                  border: 2px solid #CB9D2A !important;
                  background: #ffffff !important;
                  color: #000000 !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>

            <div className="w-12 h-12 rounded-full mx-auto mb-2.5 flex items-center justify-center bg-gradient-to-tr from-[#CB9D2A] to-[#E6CA65] shadow-lg shadow-[#CB9D2A]/25 no-print">
              <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1 no-print">{t.paymentSuccess}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 no-print">{t.ticketIssued}</p>

            {/* Zoom Controls */}
            <div className="flex items-center justify-center gap-2 mb-4 no-print select-none">
              <div className="inline-flex items-center bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-full px-3 py-1 shadow-lg text-white text-xs gap-2">
                <button
                  type="button"
                  onClick={() => setTicketZoom(prev => Math.max(0.65, Number((prev - 0.1).toFixed(1))))}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white"
                  title="Zoom Out"
                  aria-label="Zoom Out"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => setTicketZoom(1)}
                  className="px-2 py-0.5 font-mono font-bold text-[11px] text-[#CB9D2A] hover:bg-white/10 rounded transition-colors"
                  title="Reset to 100%"
                >
                  {Math.round(ticketZoom * 100)}%
                </button>

                <button
                  type="button"
                  onClick={() => setTicketZoom(prev => Math.min(1.4, Number((prev + 0.1).toFixed(1))))}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white"
                  title="Zoom In"
                  aria-label="Zoom In"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </button>

                <div className="h-3 w-px bg-slate-600/70 mx-0.5"></div>

                <button
                  type="button"
                  onClick={() => setTicketZoom(1)}
                  className="text-[10px] font-semibold text-slate-400 hover:text-white transition-colors"
                  title="Reset Zoom"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Compact White VIP Ticket Pass matching physical pass styling */}
            <div className="w-full flex justify-center items-start overflow-visible transition-all duration-200 mb-6">
              <div
                id="vip-modal-ticket-pass"
                style={{
                  transform: `scale(${ticketZoom})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                className="relative w-full max-w-[340px] sm:max-w-[360px] mx-auto bg-white rounded-3xl border-2 border-[#CB9D2A] shadow-2xl overflow-hidden text-slate-900 text-left transition-all"
              >
                {/* Top Section */}
                <div className="p-4 sm:p-5 pb-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xl sm:text-2xl font-black tracking-wider text-[#B8860B] font-sans uppercase">
                      VIP TICKET
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-400 font-bold text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      CONFIRMED
                    </span>
                  </div>

                  <div className="mt-3.5">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                      {t.applicationReference}
                    </p>
                    <p className="text-base sm:text-lg font-mono font-extrabold text-slate-900 tracking-tight break-all">
                      {paymentStatus.applicationReference}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3 pt-1">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                        Amount
                      </p>
                      <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                        {paymentStatus.amount || 1000} {paymentStatus.currency || 'ETB'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                        Payment Method
                      </p>
                      <p className="text-xs sm:text-sm font-extrabold text-slate-900 capitalize truncate">
                        {paymentStatus.paymentMethod || 'Chapa'}
                      </p>
                    </div>
                  </div>

                  {formData.citizenName && (
                    <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        {t.citizenName}
                      </span>
                      <span className="text-xs font-bold text-slate-800 truncate ml-2">
                        {formData.citizenName}
                      </span>
                    </div>
                  )}

                  {/* Selected Services from all institutions */}
                  <div className="mt-3 pt-2.5 border-t border-gray-100">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <span>{t.selectedServices}</span>
                      {finalTicketServices.length > 0 && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
                          {finalTicketServices.length}
                        </span>
                      )}
                    </p>
                    <div className="space-y-1.5">
                      {finalTicketServices.map((service, idx) => (
                        <div key={service.id || idx} className="bg-amber-50/70 border border-amber-200/70 rounded-lg p-1.5 text-xs flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full bg-[#CB9D2A] text-white flex items-center justify-center text-[8px] font-black flex-shrink-0">
                            ✓
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">
                              {resolveLocalizedValue(service.title, language) || resolveLocalizedValue(service.name, language)}
                            </p>
                            {service.institutionName && (
                              <p className="text-[9px] text-amber-800/90 font-semibold truncate">
                                {resolveLocalizedValue(service.institutionName, language)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Perforation Divider with Notches */}
                <div className="relative py-1 flex items-center justify-center select-none">
                  <div className="absolute -left-3 w-6 h-6 bg-gray-50 dark:bg-[#0F1419] rounded-full border-r-2 border-[#CB9D2A] -translate-y-1/2 top-1/2"></div>
                  <div className="w-full flex items-center justify-between px-5 overflow-hidden">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-200 inline-block flex-shrink-0 mx-0.5"></span>
                    ))}
                  </div>
                  <div className="absolute -right-3 w-6 h-6 bg-gray-50 dark:bg-[#0F1419] rounded-full border-l-2 border-[#CB9D2A] -translate-y-1/2 top-1/2"></div>
                </div>

                {/* Bottom Section with QR code */}
                <div className="p-4 sm:p-5 pt-2.5 bg-white text-center">
                  <p className="text-xs font-bold text-slate-800 mb-1.5">Your Digital VIP Ticket</p>
                  <div className="relative inline-block p-2.5 bg-white rounded-xl border border-gray-100">
                    <span className="absolute top-1.5 left-1.5 w-4 h-4 border-t-2 border-l-2 border-[#CB9D2A] rounded-tl-sm pointer-events-none"></span>
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 border-t-2 border-r-2 border-[#CB9D2A] rounded-tr-sm pointer-events-none"></span>
                    <span className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b-2 border-l-2 border-[#CB9D2A] rounded-bl-sm pointer-events-none"></span>
                    <span className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b-2 border-r-2 border-[#CB9D2A] rounded-br-sm pointer-events-none"></span>
                    <img
                      src={paymentStatus.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentStatus.applicationReference)}`}
                      alt="VIP Ticket QR Code"
                      className="w-28 h-28 sm:w-32 sm:h-32 object-contain mx-auto"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2 mb-1 max-w-[220px] mx-auto leading-tight">
                    {t.checkInInstructions}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 max-w-[340px] sm:max-w-[360px] mx-auto no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl font-bold border-2 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs sm:text-sm"
              >
                Print Pass
              </button>
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl font-extrabold text-slate-900 bg-gradient-to-tr from-[#B8860B] to-[#CB9D2A] hover:opacity-95 transition-all text-xs sm:text-sm"
              >
                {t.done}
              </button>
            </div>
          </div>
        )}
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
};

export default VIPTicket;
