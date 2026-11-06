import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { submitMessage } from '../services/messageApi';
import { getContactDetails } from '../services/siteSettingsApi';
import Chatbot from '../components/Chatbot';
import VIPTicket from '../components/VIPTicket';
import Footer from '../components/Footer';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [verificationWord, setVerificationWord] = useState('');
  const [generatedWord, setGeneratedWord] = useState('');
  const [sending, setSending] = useState(false);
  const [messageStatus, setMessageStatus] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);

  useEffect(() => {
    // Generate random verification word
    generateVerificationWord();
    // Fetch contact info from backend
    fetchContactInfo();
  }, []);

  const generateVerificationWord = () => {
    const words = ['SECURE', 'VERIFY', 'HUMAN', 'ACCESS', 'TRUST', 'SAFETY'];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setGeneratedWord(randomWord);
  };

  const fetchContactInfo = async () => {
    try {
      setContactInfo(await getContactDetails());
    } catch (error) {
      console.error('Error fetching contact info:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Verify the word
    if (verificationWord.toUpperCase() !== generatedWord) {
      alert('Verification failed. Please type the correct word.');
      return;
    }

    setSending(true);
    setMessageStatus(null);
    try {
      await submitMessage(formData);
      setMessageStatus({ type: 'success', text: 'Message sent successfully.' });
      setFormData({ name: '', email: '', phone: '', message: '' });
      setVerificationWord('');
      generateVerificationWord();
    } catch (error) {
      setMessageStatus({ type: 'error', text: error.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <Navbar />
      <Chatbot />
      <VIPTicket />
      
      <div className="pt-20 sm:pt-24 px-4 sm:px-6 lg:px-8 pb-8 sm:pb-10 md:pb-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-center text-[#3d5a99] dark:text-white mb-3 sm:mb-4 px-4">Contact Us</h1>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-8 sm:mb-10 md:mb-12 text-sm sm:text-base px-4">We'd love to hear from you. Send us a message!</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-7 md:gap-8">
            {/* Contact Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 sm:p-6 md:p-8 transition-colors">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-5 md:mb-6">Contact Information</h2>
              
              <div className="space-y-4 sm:space-y-5 md:space-y-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="bg-[#3d5a99] p-2 sm:p-2.5 md:p-3 rounded-lg flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base">Email</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm break-all">{contactInfo?.email || 'info@hawassamob.gov.et'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="bg-[#3d5a99] p-2 sm:p-2.5 md:p-3 rounded-lg flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base">Phone</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">{contactInfo?.phoneDisplay || contactInfo?.phone || '+251 46 XXX XXXX'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="bg-[#3d5a99] p-2 sm:p-2.5 md:p-3 rounded-lg flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base">Address</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">{contactInfo?.address || 'Hawassa, Ethiopia'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 sm:mt-7 md:mt-8">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4 text-sm sm:text-base">Office Hours</h3>
                <div className="space-y-1.5 sm:space-y-2 text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                  {(contactInfo?.officeHoursDetailed || [
                    { days: 'Monday - Friday', hours: '8:00 AM - 5:00 PM' },
                    { days: 'Saturday', hours: '9:00 AM - 1:00 PM' },
                    { days: 'Sunday', hours: 'Closed' },
                  ]).map((hours) => <p key={hours.days}>{hours.days}: {hours.hours}</p>)}
                </div>
              </div>
            </div>

            {/* Contact Form - Always light/white */}
            <div className="bg-white rounded-xl shadow-lg p-5 sm:p-6 md:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-5 md:mb-6">Send us a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] focus:border-transparent outline-none transition text-sm sm:text-base"
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] focus:border-transparent outline-none transition text-sm sm:text-base"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] focus:border-transparent outline-none transition text-sm sm:text-base"
                    placeholder="+251 XXX XXX XXX"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Message *</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] focus:border-transparent outline-none transition text-sm sm:text-base"
                    rows="4"
                    placeholder="Write your message here..."
                    required
                  />
                </div>

                {/* Human Verification */}
                <div className="border-2 border-[#3d5a99] rounded-lg p-3 sm:p-4 bg-blue-50">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Type the word you see below to verify you're human: *
                  </label>
                  <div className="bg-gray-200 p-3 sm:p-4 rounded-lg mb-2 sm:mb-3 text-center">
                    <span className="text-xl sm:text-2xl font-bold text-[#3d5a99] tracking-widest select-none">
                      {generatedWord}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={verificationWord}
                    onChange={(e) => setVerificationWord(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] focus:border-transparent outline-none transition text-sm sm:text-base"
                    placeholder="Type the word here"
                    required
                  />
                </div>

                {messageStatus && (
                  <p
                    role={messageStatus.type === 'error' ? 'alert' : 'status'}
                    className={`rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm ${messageStatus.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}
                  >
                    {messageStatus.text}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-[#3d5a99] text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold hover:bg-[#2d4a7f] transition-colors shadow-lg disabled:cursor-not-allowed disabled:opacity-60 text-sm sm:text-base"
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Contact;
