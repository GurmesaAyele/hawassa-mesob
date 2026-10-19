import Navbar from '../components/Navbar';
import Chatbot from '../components/Chatbot';
import VIPTicket from '../components/VIPTicket';

const ServiceCatalogue = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <Navbar />
      <Chatbot />
      <VIPTicket />
      
      <div className="pt-24 px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-bold text-center text-gray-900 dark:text-white mb-6">
            Service Catalogue
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-300 text-lg mb-12">
            Browse all available government services
          </p>
          
          {/* Service Catalogue Content - To be implemented */}
          <div className="text-center py-20">
            <svg className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-xl">
              Service catalogue will be available soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCatalogue;
