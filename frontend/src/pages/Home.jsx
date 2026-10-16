import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Chatbot from '../components/Chatbot';
import footerLogo from '../assets/images/hawasssa_mesob.png';
import heroImg from '../assets/hero.png';

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

  return (
    <div className="min-h-screen">
      <Navbar />
      <Chatbot />
      
      {/* Hero Section */}
      <section id="home" className="min-h-screen relative">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${heroImg})`,
          }}
        >
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
      <section className="relative py-20 px-6 overflow-hidden" style={{ backgroundColor: '#172231' }}>
        {/* Background Glow Effects */}
        <div className="absolute top-20 right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-20 left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left Column - Text Content */}
            <div>
              <h2 className="text-[clamp(2.5rem,4.5vw,3.75rem)] font-[800] leading-tight mb-5">
                <span style={{ color: '#F8FAFC' }}>{st.seamless}</span>
                <br />
                <span style={{ color: '#2563EB' }}>{st.publicServices}</span>
                <br />
                <span style={{ color: '#F8FAFC' }}>{st.inCity}</span>
              </h2>
              
              <p className="text-[clamp(1.125rem,1.75vw,1.5rem)] mb-7" style={{ color: '#CBD5E1' }}>
                {st.accessDesc}
              </p>

              {/* Buttons */}
              <div className="flex gap-4">
                <button 
                  onClick={() => scrollToSection('service-catalogue')}
                  className="px-7 py-3.5 rounded-xl font-semibold text-[19px] text-white transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg"
                  style={{ backgroundColor: '#2563EB' }}
                >
                  {st.exploreBtn} →
                </button>
                <button 
                  onClick={() => scrollToSection('services')}
                  className="px-7 py-3.5 rounded-xl font-semibold text-[19px] transition-all duration-200 hover:translate-y-[-2px]"
                  style={{ 
                    color: '#CBD5E1', 
                    border: '1px solid #334155',
                    backgroundColor: 'transparent'
                  }}
                >
                  {st.learnBtn}
                </button>
              </div>
            </div>

            {/* Right Column - Feature Panel */}
            <div className="rounded-2xl p-6 border" style={{ 
              backgroundColor: '#1F2A39',
              borderColor: '#334155'
            }}>
              <div className="space-y-4">
                {/* Digital Services Card */}
                <div className="p-5 rounded-xl transition-all duration-200 hover:translate-x-1" style={{ backgroundColor: '#1E3A5F' }}>
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg" style={{ backgroundColor: '#2563EB' }}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-[19px] font-semibold mb-1" style={{ color: '#F8FAFC' }}>{st.digitalTitle}</h3>
                      <p className="text-[16px]" style={{ color: '#CBD5E1' }}>{st.digitalDesc}</p>
                    </div>
                  </div>
                </div>

                {/* Citizen Support Card */}
                <div className="p-5 rounded-xl transition-all duration-200 hover:translate-x-1" style={{ backgroundColor: '#1E4D3B' }}>
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg" style={{ backgroundColor: '#10B981' }}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-[19px] font-semibold mb-1" style={{ color: '#F8FAFC' }}>{st.supportTitle}</h3>
                      <p className="text-[16px]" style={{ color: '#CBD5E1' }}>{st.supportDesc}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Processing Card */}
                <div className="p-5 rounded-xl transition-all duration-200 hover:translate-x-1" style={{ backgroundColor: '#3B2D5C' }}>
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg" style={{ backgroundColor: '#8B5CF6' }}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-[19px] font-semibold mb-1" style={{ color: '#F8FAFC' }}>{st.processingTitle}</h3>
                      <p className="text-[16px]" style={{ color: '#CBD5E1' }}>{st.processingDesc}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Institutions Section */}
      <section id="institutions" className="min-h-screen bg-gray-100 dark:bg-gray-900 py-20 px-6 transition-colors">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-center text-gray-900 dark:text-white mb-6">Institutions</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12 text-lg">
            Government institutions serving Hawassa City residents
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Placeholder Cards */}
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-gray-400 dark:text-gray-500">Logo</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Institution {item}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Description of the institution and services offered to residents.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="min-h-screen bg-white dark:bg-gray-800 py-20 px-6 transition-colors">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-center text-gray-900 dark:text-white mb-6">Services</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12 text-lg">
            Essential services available for Hawassa City residents
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
      <section id="contact" className="min-h-screen py-20 px-6 relative overflow-hidden" style={{ 
        background: 'linear-gradient(135deg, #172231 0%, #1C2839 100%)'
      }}>
        {/* Background Glow Effects */}
        <div className="absolute top-20 right-40 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-20 left-40 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px]"></div>

        <div className="max-w-3xl mx-auto relative z-10">
          {/* Contact Form */}
          <div className="rounded-3xl p-10" style={{ backgroundColor: '#111827' }}>
            <h2 className="text-[46px] font-bold mb-8" style={{ color: '#F8FAFC' }}>Send Message</h2>
            
            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Name and Email Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[23px] mb-3" style={{ color: '#E2E8F0' }}>
                    Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your name"
                    className="w-full px-5 py-4 rounded-xl border text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 transition-all"
                    style={{ 
                      backgroundColor: '#1F2937',
                      borderColor: '#374151',
                      borderWidth: '1px'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[23px] mb-3" style={{ color: '#E2E8F0' }}>
                    Email <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your email"
                    className="w-full px-5 py-4 rounded-xl border text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 transition-all"
                    style={{ 
                      backgroundColor: '#1F2937',
                      borderColor: '#374151',
                      borderWidth: '1px'
                    }}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[23px] mb-3" style={{ color: '#E2E8F0' }}>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  className="w-full px-5 py-4 rounded-xl border text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 transition-all"
                  style={{ 
                    backgroundColor: '#1F2937',
                    borderColor: '#374151',
                    borderWidth: '1px'
                  }}
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-[23px] mb-3" style={{ color: '#E2E8F0' }}>
                  Message <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows="5"
                  placeholder="Enter your message"
                  className="w-full px-5 py-4 rounded-xl border text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 transition-all resize-none"
                  style={{ 
                    backgroundColor: '#1F2937',
                    borderColor: '#374151',
                    borderWidth: '1px'
                  }}
                />
              </div>

              {/* Human Verification */}
              <div className="rounded-xl p-6" style={{ backgroundColor: '#1F2937', borderColor: '#374151', borderWidth: '1px' }}>
                <p className="text-center mb-4" style={{ color: '#E2E8F0', fontSize: '18px' }}>
                  Type the word you see below to verify you're human:
                </p>
                
                {/* Verification Word Display */}
                <div className="flex justify-center mb-4">
                  <div className="bg-white px-8 py-4 rounded-lg">
                    <span className="text-3xl font-bold tracking-wider" style={{ 
                      color: '#000',
                      fontFamily: 'monospace',
                      letterSpacing: '8px'
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
                    className="ml-3 p-3 rounded-full hover:bg-white/10 transition-colors"
                    style={{ backgroundColor: '#2563EB' }}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  placeholder="Enter the word"
                  className="w-full px-5 py-3 rounded-xl border text-white text-center placeholder-[#9CA3AF] focus:outline-none focus:ring-2 transition-all"
                  style={{ 
                    backgroundColor: '#111827',
                    borderColor: '#374151',
                    borderWidth: '1px'
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-4 rounded-xl font-semibold text-[20px] text-white transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg"
                style={{ backgroundColor: '#2563EB' }}
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Service Catalogue Section */}
      <section id="service-catalogue" className="min-h-screen bg-white dark:bg-gray-800 py-20 px-6 transition-colors">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-center text-gray-900 dark:text-white mb-6">Service Catalogue</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12 text-lg">
            Browse our comprehensive service catalogue
          </p>
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300 text-lg">Service catalogue content coming soon...</p>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about-us" className="min-h-screen bg-gray-100 dark:bg-gray-900 py-20 px-6 transition-colors">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-center text-gray-900 dark:text-white mb-6">About Us</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12 text-lg">
            Learn more about Hawassa Mesob
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Our Mission</h3>
              <p className="text-gray-600 dark:text-gray-300">To provide efficient and accessible government services to all Hawassa City residents.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
              <div className="text-5xl mb-4">👁️</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Our Vision</h3>
              <p className="text-gray-600 dark:text-gray-300">A digitally connected city where every resident has easy access to essential services.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
              <div className="text-5xl mb-4">⭐</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Core Values</h3>
              <p className="text-gray-600 dark:text-gray-300">Efficiency, Security, and Accessibility in all our services.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a1d2e] text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          {/* Logo and Tagline */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4">
              <img 
                src={footerLogo} 
                alt="Hawassa Mesob Logo" 
                className="h-24 w-auto mx-auto"
              />
            </div>
            
            <h4 className="text-2xl font-semibold mb-2 text-white">All Services, One Place</h4>
            <p className="text-gray-300 mb-6">Serving Hawassa City Residents</p>
            
            {/* Social Media Icons */}
            <div className="flex gap-4 mb-8">
              <a href="#" className="bg-[#2d3142] hover:bg-[#3d4152] p-3 rounded transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="bg-[#2d3142] hover:bg-[#3d4152] p-3 rounded transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="#" className="bg-[#2d3142] hover:bg-[#3d4152] p-3 rounded transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                </svg>
              </a>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="border-t border-gray-700 pt-6">
            <p className="text-gray-400 text-sm">Copyright © 2026 H-MESOB Center. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
