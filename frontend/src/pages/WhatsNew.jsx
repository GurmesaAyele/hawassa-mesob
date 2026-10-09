import Navbar from '../components/Navbar';

const WhatsNew = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="pt-24 px-4">
        <h1 className="text-4xl font-bold text-center">What's New</h1>
        <p className="text-center mt-4 text-gray-600">Coming soon...</p>
      </div>
    </div>
  );
};

export default WhatsNew;
