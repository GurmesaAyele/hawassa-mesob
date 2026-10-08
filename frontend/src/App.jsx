import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Chatbot from './components/chatbot/Chatbot';
import HomePage from './pages/HomePage';
import { ROUTES } from './utils/constants';

// Placeholder pages - will be created later
const ServicesPage = () => <div className="container-custom py-20"><h1 className="text-4xl font-bold">Services Page</h1></div>;
const ServiceDetailPage = () => <div className="container-custom py-20"><h1 className="text-4xl font-bold">Service Detail Page</h1></div>;
const OrganizationsPage = () => <div className="container-custom py-20"><h1 className="text-4xl font-bold">Organizations Page</h1></div>;
const OrganizationDetailPage = () => <div className="container-custom py-20"><h1 className="text-4xl font-bold">Organization Detail Page</h1></div>;
const NewsPage = () => <div className="container-custom py-20"><h1 className="text-4xl font-bold">News Page</h1></div>;
const NewsDetailPage = () => <div className="container-custom py-20"><h1 className="text-4xl font-bold">News Detail Page</h1></div>;
const AboutPage = () => <div className="container-custom py-20"><h1 className="text-4xl font-bold">About Page</h1></div>;
const ContactPage = () => <div className="container-custom py-20"><h1 className="text-4xl font-bold">Contact Page</h1></div>;
const FAQPage = () => <div className="container-custom py-20"><h1 className="text-4xl font-bold">FAQ Page</h1></div>;
const TrackPage = () => <div className="container-custom py-20"><h1 className="text-4xl font-bold">Track Application Page</h1></div>;
const HowItWorksPage = () => <div className="container-custom py-20"><h1 className="text-4xl font-bold">How It Works Page</h1></div>;
const LoginPage = () => <div className="container-custom py-20"><h1 className="text-4xl font-bold">Login Page</h1></div>;
const RegisterPage = () => <div className="container-custom py-20"><h1 className="text-4xl font-bold">Register Page</h1></div>;
const DashboardPage = () => <div className="container-custom py-20"><h1 className="text-4xl font-bold">Dashboard Page</h1></div>;
const SearchPage = () => <div className="container-custom py-20"><h1 className="text-4xl font-bold">Search Page</h1></div>;
const NotFoundPage = () => <div className="container-custom py-20"><h1 className="text-4xl font-bold">404 - Page Not Found</h1></div>;

function App() {
  return (
    <>
      <Layout>
        <Routes>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.SERVICES} element={<ServicesPage />} />
          <Route path={ROUTES.SERVICE_DETAIL} element={<ServiceDetailPage />} />
          <Route path={ROUTES.ORGANIZATIONS} element={<OrganizationsPage />} />
          <Route path={ROUTES.ORGANIZATION_DETAIL} element={<OrganizationDetailPage />} />
          <Route path={ROUTES.NEWS} element={<NewsPage />} />
          <Route path={ROUTES.NEWS_DETAIL} element={<NewsDetailPage />} />
          <Route path={ROUTES.ABOUT} element={<AboutPage />} />
          <Route path={ROUTES.CONTACT} element={<ContactPage />} />
          <Route path={ROUTES.FAQ} element={<FAQPage />} />
          <Route path={ROUTES.TRACK} element={<TrackPage />} />
          <Route path={ROUTES.HOW_IT_WORKS} element={<HowItWorksPage />} />
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.SEARCH} element={<SearchPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
      <Chatbot />
    </>
  );
}

export default App;
