import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    // Get application reference from localStorage
    const reference = localStorage.getItem('vip_application_reference');
    
    if (!reference) {
      setStatus('failed');
      setErrorMessage('No payment session found. Please start a new VIP application.');
      return;
    }

    // Start polling for payment status
    let pollCount = 0;
    const pollInterval = setInterval(async () => {
      pollCount++;
      setPollingAttempts(pollCount);

      if (pollCount > maxPollingAttempts) {
        clearInterval(pollInterval);
        setStatus('timeout');
        setErrorMessage('Payment verification is taking longer than expected. You can check your status later.');
        return;
      }

      try {
        const response = await fetch(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VIP_PAYMENTS_STATUS}/${reference}`
        );

        const result = await response.json();
        console.log('Payment status check:', result);

        if (!response.ok) {
          if (response.status === 404) {
            clearInterval(pollInterval);
            setStatus('failed');
            setErrorMessage('Payment session not found.');
          }
          return;
        }

        if (result.success && result.data) {
          const data = result.data;
          setPaymentData(data);

          if (data.isConfirmed) {
            // Payment confirmed!
            clearInterval(pollInterval);
            setStatus('success');
            // Clear the saved reference
            localStorage.removeItem('vip_application_reference');
          } else if (data.isPending) {
            // Continue polling
            console.log('Payment still pending, continuing to poll...');
          } else if (data.canRetry) {
            // Payment failed/cancelled
            clearInterval(pollInterval);
            setStatus('failed');
            setErrorMessage(data.errorMessage || 'Payment was not completed. Please try again.');
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 3000); // Poll every 3 seconds

    // Cleanup on unmount
    return () => clearInterval(pollInterval);
  }, []);

  const handleRetry = () => {
    navigate('/');
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
      ticketStatus: 'Ticket Status',
      amount: 'Amount',
      paymentMethod: 'Payment Method',
      checkInInstructions: 'Please check in at Hawassa MESOB Center to join the priority queue',
      checkStatusLater: 'Check Status Later',
      verificationAttempt: 'Verification attempt'
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
      ticketStatus: 'የትኬት ሁኔታ',
      amount: 'መጠን',
      paymentMethod: 'የክፍያ ዘዴ',
      checkInInstructions: 'እባክዎ በሀዋሳ መሶብ ማዕከል ተመዝግበው ወደ ቅድሚያ ወረፋ ይቀላቀሉ',
      checkStatusLater: 'ሁኔታውን በኋላ ያረጋግጡ',
      verificationAttempt: 'የማረጋገጫ ሙከራ'
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
      ticketStatus: 'Tiketi Haala',
      amount: 'Hanga',
      paymentMethod: 'Kaffaltii Mala',
      checkInInstructions: 'Hawassa MESOB Seentera ware priority queue gede haa',
      checkStatusLater: 'Haala Boodatti Ilaali',
      verificationAttempt: 'Mirkanee yaala'
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
            <div className="bg-[#2D3748] rounded-2xl p-12 text-center">
              <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: '#CB9D2A' }}>
                <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">{t.success}</h2>
              <p className="text-gray-400 mb-8">{t.successDesc}</p>

              {/* Payment Details Card */}
              <div className="bg-gradient-to-r from-[#CB9D2A] to-[#B8965F] text-white rounded-xl p-8 mb-6">
                <p className="text-sm opacity-90 mb-3 uppercase tracking-wide">VIP Ticket</p>
                <div className="space-y-3 text-left">
                  <div className="flex justify-between items-center border-b border-white/20 pb-2">
                    <span className="text-sm opacity-80">{t.applicationRef}:</span>
                    <span className="font-mono font-bold text-lg">{paymentData.applicationReference}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/20 pb-2">
                    <span className="text-sm opacity-80">{t.ticketStatus}:</span>
                    <span className="font-semibold">{paymentData.ticketStatus}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/20 pb-2">
                    <span className="text-sm opacity-80">{t.amount}:</span>
                    <span className="font-bold text-xl">{paymentData.amount} {paymentData.currency}</span>
                  </div>
                  {paymentData.paymentMethod && (
                    <div className="flex justify-between items-center pb-2">
                      <span className="text-sm opacity-80">{t.paymentMethod}:</span>
                      <span className="font-semibold capitalize">{paymentData.paymentMethod}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Check-in Instructions */}
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-5 mb-6 text-left">
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
                className="w-full py-4 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90 text-lg"
                style={{ backgroundColor: '#CB9D2A' }}
              >
                {t.goHome}
              </button>
            </div>
          )}

          {/* Failed State */}
          {status === 'failed' && (
            <div className="bg-[#2D3748] rounded-2xl p-12 text-center">
              <div className="w-24 h-24 rounded-full bg-red-500/20 mx-auto mb-6 flex items-center justify-center">
                <svg className="w-14 h-14 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">{t.failed}</h2>
              <p className="text-red-400 mb-8">{errorMessage}</p>

              <div className="flex gap-4">
                <button
                  onClick={handleGoHome}
                  className="flex-1 py-4 rounded-lg font-semibold border-2 border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  {t.goHome}
                </button>
                <button
                  onClick={handleRetry}
                  className="flex-1 py-4 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90"
                  style={{ backgroundColor: '#CB9D2A' }}
                >
                  {t.retry}
                </button>
              </div>
            </div>
          )}

          {/* Timeout State */}
          {status === 'timeout' && (
            <div className="bg-[#2D3748] rounded-2xl p-12 text-center">
              <div className="w-24 h-24 rounded-full bg-yellow-500/20 mx-auto mb-6 flex items-center justify-center">
                <svg className="w-14 h-14 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">{t.timeout}</h2>
              <p className="text-yellow-400 mb-8">{errorMessage}</p>

              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-5 mb-6 text-left">
                <p className="text-blue-200 text-sm">
                  Your payment may still be processing. You can check the status later using your application reference.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleGoHome}
                  className="flex-1 py-4 rounded-lg font-semibold border-2 border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  {t.goHome}
                </button>
                <button
                  onClick={handleRetry}
                  className="flex-1 py-4 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90"
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
