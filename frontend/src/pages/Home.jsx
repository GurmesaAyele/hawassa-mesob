import { useState } from 'react';
import Navbar from '../components/Navbar';
import Chatbot from '../components/Chatbot';
import footerLogo from '../assets/images/hawasssa_mesob.png';
import heroImg from '../assets/hero.png';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
  };

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
              All Services, One Place
            </h1>

            {/* Subtitle */}
            <p className="text-2xl text-white mb-3">
              Serving Hawassa City Residents
            </p>

            {/* Description */}
            <p className="text-lg text-white/90 mb-6">
              Access multiple city services faster, efficiently, and under one roof
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for Services or Organizations"
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
      <section id="contact" className="min-h-screen bg-gray-100 dark:bg-gray-900 py-20 px-6 transition-colors">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-center text-gray-900 dark:text-white mb-6">Contact Us</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12 text-lg">
            Get in touch with us for any inquiries
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-[#3d5a99] p-3 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Email</p>
                    <p className="text-gray-600 dark:text-gray-300">info@hawassamob.gov.et</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-[#3d5a99] p-3 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Phone</p>
                    <p className="text-gray-600 dark:text-gray-300">+251 46 XXX XXXX</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Send Message</h3>
              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] outline-none"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] outline-none"
                />
                <textarea
                  placeholder="Your Message"
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] outline-none"
                />
                <button className="w-full bg-[#3d5a99] text-white py-3 rounded-lg font-semibold hover:bg-[#2d4a7f] transition">
                  Send Message
                </button>
              </form>
            </div>
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
