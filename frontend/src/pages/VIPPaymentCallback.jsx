import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_CONFIG } from '../config/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const VIPPaymentCallback = () => {
  const [language, setLanguage] = useState('English');
  const [status, setStatus] = useState('loading'); // loading, success, failed, timeout
  const [paymentData, setPaymentData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const maxPollingAttempts = 20; // 60 seconds (3 seconds × 20)
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Refs for cleanup and preventing overlapping polls
  const pollingIntervalRef = useRef(null);
  const isPollingRef = useRef(false);
  const isMountedRef = useRef(true);

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

  useEffect(() => {
    // Mark component as mounted
    isMountedRef.current = true;
    
    // Get application reference from multiple sources
    // Priority: URL params > localStorage
    let reference = searchParams.get('reference') || 
                    searchParams.get('trx_ref') || 
                    searchParams.get('tx_ref') ||
                    localStorage.getItem('vip_application_reference');
    
    if (!reference) {
      setStatus('failed');
      setErrorMessage('No payment session found. Please start a new VIP application.');
      return;
    }

    console.log('Payment callback initiated for reference:', reference);

    // Start polling for payment status
    let pollCount = 0;
    
    const pollPaymentStatus = async () => {
      // Prevent overlapping requests
      if (isPollingRef.current) {
        console.log('Previous poll still in progress, skipping...');
        return;
      }
      
      isPollingRef.current = true;
      pollCount++;
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setPollingAttempts(pollCount);
      }

      if (pollCount > maxPollingAttempts) {
        clearInterval(pollingIntervalRef.current);
        isPollingRef.current = false;
        
        if (isMountedRef.current) {
          setStatus('timeout');
          setErrorMessage('Payment verification is taking longer than expected. You can check your status later.');
        }
        return;
      }

      try {
        const response = await fetch(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VIP_PAYMENTS_STATUS}/${reference}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            cache: 'no-store' // Prevent caching that causes 304 responses
          }
        );

        // Check response status BEFORE attempting to parse JSON
        if (!response.ok) {
          if (response.status === 404) {
            clearInterval(pollingIntervalRef.current);
            isPollingRef.current = false;
            
            if (isMountedRef.current) {
              setStatus('failed');
              setErrorMessage('Payment session not found. The reference may be invalid.');
            }
            return;
          } else if (response.status === 304) {
            // Not Modified - status unchanged, continue polling
            console.log('Status unchanged (304), continuing to poll...');
            isPollingRef.current = false;
            return;
          } else {
            // Other HTTP errors - log and continue polling for resilience
            console.warn(`HTTP ${response.status} error, will retry...`);
            isPollingRef.current = false;
            return;
          }
        }

        // Only parse JSON if response is OK
        const result = await response.json();
        console.log('Payment status check:', result);

        if (result.success && result.data) {
          const data = result.data;
          
          if (isMountedRef.current) {
            setPaymentData(data);
          }

          // Stop polling immediately on confirmation
          if (data.isConfirmed) {
            clearInterval(pollingIntervalRef.current);
            isPollingRef.current = false;
            
            if (isMountedRef.current) {
              setStatus('success');
              // Clear the saved reference
              localStorage.removeItem('vip_application_reference');
            }
            return;
          } 
          
          // Continue polling if still pending
          if (data.isPending) {
            console.log('Payment still pending, continuing to poll...');
            isPollingRef.current = false;
            return;
          } 
          
          // Stop polling on terminal failure
          if (!data.canRetry) {
            clearInterval(pollingIntervalRef.current);
            isPollingRef.current = false;
            
            if (isMountedRef.current) {
              setStatus('failed');
              setErrorMessage(data.errorMessage || 'Payment was not completed.');
            }
            return;
          }
          
          // Retryable failure
          if (data.canRetry) {
            clearInterval(pollingIntervalRef.current);
            isPollingRef.current = false;
            
            if (isMountedRef.current) {
              setStatus('failed');
              setErrorMessage(data.errorMessage || 'Payment was not completed. Please try again.');
            }
            return;
          }
        } else if (!result.success) {
          // Handle API error response
          console.warn('Payment verification returned error:', result);
          clearInterval(pollingIntervalRef.current);
          isPollingRef.current = false;
          
          if (isMountedRef.current) {
            setStatus('failed');
            setErrorMessage(result.error || result.message || 'Unable to verify payment status.');
          }
          return;
        }
        
        isPollingRef.current = false;
      } catch (error) {
        console.error('Error checking payment status:', error);
        // Don't stop polling on network errors - just log and continue
        isPollingRef.current = false;
      }
    };

    // Start polling immediately, then every 3 seconds
    pollPaymentStatus();
    pollingIntervalRef.current = setInterval(pollPaymentStatus, 3000);

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      isPollingRef.current = false;
    };
  }, [searchParams]);

  const handleRetry = () => {
    navigate('/vip');
  };

  const handleGoHome = () => {
    localStorage.removeItem('vip_application_reference');
    navigate('/');
  };

  // Translations
  const translations = {
    English: {
      loading: 'Confirming Your Payment',
      loadingDesc: 'Please wait while we verify your payment with the bank...',
      success: 'Payment Successful!',
      successDesc: 'Your VIP ticket has been issued successfully',
      failed: 'Payment Failed',
      timeout: 'Payment Verification Timeout',
      retry: 'Try Again',
      goHome: 'Go to Home',
      applicationRef: 'Application Reference',
      ticketCode: 'Ticket Code',
      ticketStatus: 'Ticket Status',
      amount: 'Amount',
      paymentMethod: 'Payment Method',
      checkInInstructions: 'Please check in at Hawassa MESOB Center to join the priority queue',
      checkStatusLater: 'Check Status Later',
      verificationAttempt: 'Verification attempt',
      digitalTicket: 'Your Digital VIP Ticket'
    },
    Amharic: {
      loading: 'ክፍያዎን በማረጋገጥ ላይ',
      loadingDesc: 'እባክዎ ክፍያዎን ከባንክ ጋር ስናረጋግጥ ይጠብቁ...',
      success: 'ክፍያ ተሳክቷል!',
      successDesc: 'የቪአይፒ ትኬትዎ በተሳካ ሁኔታ ተሰጥቷል',
      failed: 'ክፍያ አልተሳካም',
      timeout: 'የክፍያ ማረጋገጫ ጊዜ አልቋል',
      retry: 'እንደገና ይሞክሩ',
      goHome: 'ወደ መነሻ ይሂዱ',
      applicationRef: 'የማመልከቻ ማጣቀሻ',
      ticketCode: 'የትኬት ኮድ',
      ticketStatus: 'የትኬት ሁኔታ',
      amount: 'መጠን',
      paymentMethod: 'የክፍያ ዘዴ',
      checkInInstructions: 'እባክዎ በሀዋሳ መሶብ ማዕከል ተመዝግበው ወደ ቅድሚያ ወረፋ ይቀላቀሉ',
      checkStatusLater: 'ሁኔታውን በኋላ ያረጋግጡ',
      verificationAttempt: 'የማረጋገጫ ሙከራ',
      digitalTicket: 'የእርስዎ ዲጂታል ቪአይፒ ትኬት'
    },
    Sidama: {
      loading: 'Kaffaltira Mirkaneessa',
      loadingDesc: 'Kaffaltira baanki waliin mirkaneessano giddo wole...',
      success: 'Kaffaltii Milkaae!',
      successDesc: 'VIP tiketira milkaaninsa kennama',
      failed: 'Kaffaltii Dandaabokki',
      timeout: 'Kaffaltii Mirkanee Yeroo Xumurame',
      retry: 'Ammas Yaala',
      goHome: 'Manatti Deema',
      applicationRef: 'Maalifinsa Refereensa',
      ticketCode: 'Tiketi Kooda',
      ticketStatus: 'Tiketi Haala',
      amount: 'Hanga',
      paymentMethod: 'Kaffaltii Mala',
      checkInInstructions: 'Hawassa MESOB Seentera ware priority queue gede haa',
      checkStatusLater: 'Haala Boodatti Ilaali',
      verificationAttempt: 'Mirkanee yaala',
      digitalTicket: 'Kee Digital VIP Tiketi'
    }
  };

  const t = translations[language] || translations.English;

  return (
    <div className="min-h-screen bg-[#1E293B]">
      <Navbar />
      
      <div className="pt-24 px-6 pb-12 min-h-screen flex items-center justify-center">
        <div className="max-w-2xl w-full">
          {/* Loading State */}
          {status === 'loading' && (
            <div className="bg-[#2D3748] rounded-2xl p-12 text-center">
              <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-[#CB9D2A] mx-auto mb-6"></div>
              <h2 className="text-3xl font-bold text-white mb-3">{t.loading}</h2>
              <p className="text-gray-400 mb-6">{t.loadingDesc}</p>
              <p className="text-sm text-gray-500">
                {t.verificationAttempt} {pollingAttempts} / {maxPollingAttempts}
              </p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && paymentData && (
            <div className="bg-[#2D3748] rounded-2xl p-8 sm:p-12 text-center">
              <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: '#CB9D2A' }}>
                <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">{t.success}</h2>
              <p className="text-gray-400 mb-8">{t.successDesc}</p>

              {/* Payment Details Card */}
              <div className="bg-gradient-to-r from-[#CB9D2A] to-[#B8965F] text-white rounded-xl p-6 sm:p-8 mb-6">
                <p className="text-sm opacity-90 mb-4 uppercase tracking-wide">VIP Ticket</p>
                <div className="space-y-3 text-left">
                  <div className="flex justify-between items-center border-b border-white/20 pb-2">
                    <span className="text-xs sm:text-sm opacity-80">{t.applicationRef}:</span>
                    <span className="font-mono font-bold text-sm sm:text-lg">{paymentData.applicationReference}</span>
                  </div>
                  {paymentData.ticketCode && (
                    <div className="flex justify-between items-center border-b border-white/20 pb-2">
                      <span className="text-xs sm:text-sm opacity-80">{t.ticketCode}:</span>
                      <span className="font-mono font-bold text-sm sm:text-lg">{paymentData.ticketCode}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-b border-white/20 pb-2">
                    <span className="text-xs sm:text-sm opacity-80">{t.ticketStatus}:</span>
                    <span className="font-semibold text-sm sm:text-base">{paymentData.ticketStatus}</span>
                  </div>
                  {paymentData.amount && (
                    <div className="flex justify-between items-center border-b border-white/20 pb-2">
                      <span className="text-xs sm:text-sm opacity-80">{t.amount}:</span>
                      <span className="font-bold text-lg sm:text-xl">{paymentData.amount} {paymentData.currency || 'ETB'}</span>
                    </div>
                  )}
                  {paymentData.paymentMethod && (
                    <div className="flex justify-between items-center pb-2">
                      <span className="text-xs sm:text-sm opacity-80">{t.paymentMethod}:</span>
                      <span className="font-semibold text-sm sm:text-base capitalize">{paymentData.paymentMethod}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code Display */}
              {paymentData.qrCodeUrl && (
                <div className="bg-white rounded-xl p-6 mb-6">
                  <p className="text-gray-700 font-semibold mb-4">{t.digitalTicket}</p>
                  <div className="flex justify-center">
                    <img 
                      src={paymentData.qrCodeUrl} 
                      alt="VIP Ticket QR Code" 
                      className="w-48 h-48 sm:w-64 sm:h-64 object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Check-in Instructions */}
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 sm:p-5 mb-6 text-left">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-blue-200 text-sm leading-relaxed">
                    {t.checkInInstructions}
                  </p>
                </div>
              </div>

              <button
                onClick={handleGoHome}
                className="w-full py-3 sm:py-4 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90 text-base sm:text-lg"
                style={{ backgroundColor: '#CB9D2A' }}
              >
                {t.goHome}
              </button>
            </div>
          )}

          {/* Failed State */}
          {status === 'failed' && (
            <div className="bg-[#2D3748] rounded-2xl p-8 sm:p-12 text-center">
              <div className="w-24 h-24 rounded-full bg-red-500/20 mx-auto mb-6 flex items-center justify-center">
                <svg className="w-14 h-14 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">{t.failed}</h2>
              <p className="text-red-400 mb-8 text-sm sm:text-base">{errorMessage}</p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleGoHome}
                  className="flex-1 py-3 sm:py-4 rounded-lg font-semibold border-2 border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  {t.goHome}
                </button>
                <button
                  onClick={handleRetry}
                  className="flex-1 py-3 sm:py-4 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90"
                  style={{ backgroundColor: '#CB9D2A' }}
                >
                  {t.retry}
                </button>
              </div>
            </div>
          )}

          {/* Timeout State */}
          {status === 'timeout' && (
            <div className="bg-[#2D3748] rounded-2xl p-8 sm:p-12 text-center">
              <div className="w-24 h-24 rounded-full bg-yellow-500/20 mx-auto mb-6 flex items-center justify-center">
                <svg className="w-14 h-14 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">{t.timeout}</h2>
              <p className="text-yellow-400 mb-8 text-sm sm:text-base">{errorMessage}</p>

              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 sm:p-5 mb-6 text-left">
                <p className="text-blue-200 text-sm">
                  Your payment may still be processing. You can check the status later using your application reference.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleGoHome}
                  className="flex-1 py-3 sm:py-4 rounded-lg font-semibold border-2 border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  {t.goHome}
                </button>
                <button
                  onClick={handleRetry}
                  className="flex-1 py-3 sm:py-4 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90"
                  style={{ backgroundColor: '#CB9D2A' }}
                >
                  {t.checkStatusLater}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default VIPPaymentCallback;
