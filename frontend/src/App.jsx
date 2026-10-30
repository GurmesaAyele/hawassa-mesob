import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Institutions from './pages/Institutions';
import Services from './pages/Services';
import Contact from './pages/Contact';
import ServiceCatalogue from './pages/ServiceCatalogue';
import AboutUs from './pages/AboutUs';
import WhatsNew from './pages/WhatsNew';
import AdminDashboard from './pages/AdminDashboard';



import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/institutions" element={<Institutions />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/service-catalogue" element={<ServiceCatalogue />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/whats-new" element={<WhatsNew />} />
        <Route path="/admin" element={<AdminDashboard />} />
        
        
      </Routes>
    </Router>
  );
}

export default App;
