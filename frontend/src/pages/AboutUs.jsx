import Navbar from '../components/Navbar';
import NewsSection from '../components/NewsSection';
import VideosSection from '../components/VideosSection';
import AnnouncementsSection from '../components/AnnouncementsSection';
import Chatbot from '../components/Chatbot';
import VIPTicket from '../components/VIPTicket';

const AboutUs = () => {
  return (
    <div className="min-h-screen transition-colors">
      <Navbar />
      <Chatbot />
      <VIPTicket />
      
      {/* Page Header */}
      <div className="pt-24 pb-12 px-6 bg-gradient-to-br from-[#294491] to-[#CB9D2A]">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-4">About Hawassa Mesob</h1>
          <p className="text-xl text-white/90">
            Your one-stop center for all government services in Hawassa City
          </p>
        </div>
      </div>

      {/* News Section */}
      <NewsSection />

      {/* Videos Section */}
      <VideosSection />

      {/* Announcements Section */}
      <AnnouncementsSection />

      {/* Footer Section (Optional) */}
      <section className="bg-[#1a1f2e] py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400 text-sm">
            © 2024 Hawassa Mesob. All rights reserved.
          </p>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
