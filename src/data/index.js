// Centralized data exports
export { servicesData } from './servicesData';
export { organizationsData } from './organizationsData';
export { newsData } from './newsData';
export { faqData } from './faqData';
export { mockApplicationsData, getApplicationById, getUserApplications } from './mockApplications';

// Export default for convenience
import { servicesData } from './servicesData';
import { organizationsData } from './organizationsData';
import { newsData } from './newsData';
import { faqData } from './faqData';
import { mockApplicationsData } from './mockApplications';

export default {
  services: servicesData,
  organizations: organizationsData,
  news: newsData,
  faqs: faqData,
  applications: mockApplicationsData,
};
