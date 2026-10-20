import Navbar from '../components/Navbar';
import Chatbot from '../components/Chatbot';
import VIPTicket from '../components/VIPTicket';
import Footer from '../components/Footer';

const Services = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <Navbar />
      <Chatbot />
      <VIPTicket />
      
      <div className="pt-24 px-4 pb-12">
        <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-white">Services</h1>
        <p className="text-center mt-4 text-gray-600 dark:text-gray-300">Coming soon...</p>
      </div>

      <Footer />
    </div>
  );
};

export default Services;
