import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Institutions from './pages/Institutions';
import Services from './pages/Services';
import Contact from './pages/Contact';
import ServiceCatalogue from './pages/ServiceCatalogue';
import AboutUs from './pages/AboutUs';
import WhatsNew from './pages/WhatsNew';

// Admin Pages
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminInstitutions from './pages/admin/Institutions';
import AdminServices from './pages/admin/Services';
import AdminAnalytics from './pages/admin/Analytics';
import AdminReports from './pages/admin/Reports';
import AdminSettings from './pages/admin/Settings';
import AdminUsers from './pages/admin/Users';

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
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/institutions" element={<AdminInstitutions />} />
        <Route path="/admin/services" element={<AdminServices />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/users" element={<AdminUsers />} />
      </Routes>
    </Router>
  );
}

export default App;
