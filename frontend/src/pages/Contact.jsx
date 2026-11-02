import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
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
  const [contactInfo, setContactInfo] = useState({
    email: '',
    phone: '',
    address: ''
  });

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
      const response = await fetch('/api/settings/contacts');
      const data = await response.json();
      setContactInfo(data);
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

    try {
      const response = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Message sent successfully!');
        setFormData({ name: '', email: '', phone: '', message: '' });
        setVerificationWord('');
        generateVerificationWord();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <Navbar />
      <Chatbot />
      <VIPTicket />
      
      <div className="pt-24 px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-[#3d5a99] dark:text-white mb-4">Contact Us</h1>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12">We'd love to hear from you. Send us a message!</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition-colors">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Contact Information</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-[#3d5a99] p-3 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Email</h3>
                    <p className="text-gray-600 dark:text-gray-300">{contactInfo.email || 'info@hawassamob.gov.et'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-[#3d5a99] p-3 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Phone</h3>
                    <p className="text-gray-600 dark:text-gray-300">{contactInfo.phone || '+251 46 XXX XXXX'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-[#3d5a99] p-3 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Address</h3>
                    <p className="text-gray-600 dark:text-gray-300">{contactInfo.address || 'Hawassa, Ethiopia'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Office Hours</h3>
                <div className="space-y-2 text-gray-600 dark:text-gray-300">
                  <p>Monday - Friday: 8:00 AM - 5:00 PM</p>
                  <p>Saturday: 9:00 AM - 1:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>

            {/* Contact Form - Always light/white */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Send us a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] focus:border-transparent outline-none transition"
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] focus:border-transparent outline-none transition"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] focus:border-transparent outline-none transition"
                    placeholder="+251 XXX XXX XXX"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] focus:border-transparent outline-none transition"
                    rows="5"
                    placeholder="Write your message here..."
                    required
                  />
                </div>

                {/* Human Verification */}
                <div className="border-2 border-[#3d5a99] rounded-lg p-4 bg-blue-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type the word you see below to verify you're human: *
                  </label>
                  <div className="bg-gray-200 p-4 rounded-lg mb-3 text-center">
                    <span className="text-2xl font-bold text-[#3d5a99] tracking-widest select-none">
                      {generatedWord}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={verificationWord}
                    onChange={(e) => setVerificationWord(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] focus:border-transparent outline-none transition"
                    placeholder="Type the word here"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#3d5a99] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#2d4a7f] transition-colors shadow-lg"
                >
                  Send Message
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
