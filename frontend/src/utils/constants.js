// Application Constants

export const APP_NAME = 'HAWASSA MESOB';
export const APP_TAGLINE = 'One-Stop Government Service Center';
export const APP_DESCRIPTION = 'Access public services in Hawassa through one simple, transparent and convenient digital platform.';

// Contact Information (Placeholder - Replace with actual data)
export const CONTACT = {
  phone: '+251-XX-XXX-XXXX',
  email: 'info@hawassamesob.gov.et',
  address: 'Hawassa, Sidama Region, Ethiopia',
  workingHours: 'Monday - Friday: 8:30 AM - 5:30 PM',
};

// Social Media
export const SOCIAL_MEDIA = {
  facebook: 'https://facebook.com/hawassamesob',
  twitter: 'https://twitter.com/hawassamesob',
  telegram: 'https://t.me/hawassamesob',
  youtube: 'https://youtube.com/@hawassamesob',
};

// Service Categories
export const SERVICE_CATEGORIES = [
  {
    id: 'documents',
    name: 'Documents & Identification',
    icon: '📄',
    description: 'ID cards, passports, certificates and document services',
  },
  {
    id: 'business',
    name: 'Business & Trade',
    icon: '💼',
    description: 'Business registration, licenses and commercial services',
  },
  {
    id: 'tax',
    name: 'Tax & Revenue',
    icon: '💰',
    description: 'Tax registration, payments and revenue services',
  },
  {
    id: 'land',
    name: 'Land & Housing',
    icon: '🏠',
    description: 'Land registration, property and housing services',
  },
  {
    id: 'transport',
    name: 'Transportation',
    icon: '🚗',
    description: 'Driver licenses, vehicle registration and transport services',
  },
  {
    id: 'education',
    name: 'Education',
    icon: '🎓',
    description: 'Educational certificates and academic services',
  },
  {
    id: 'health',
    name: 'Health',
    icon: '⚕️',
    description: 'Health certificates and medical documentation',
  },
  {
    id: 'legal',
    name: 'Legal Services',
    icon: '⚖️',
    description: 'Legal documentation and court services',
  },
  {
    id: 'permits',
    name: 'Permits & Licenses',
    icon: '📋',
    description: 'Various permits, licenses and authorizations',
  },
  {
    id: 'social',
    name: 'Social Services',
    icon: '🤝',
    description: 'Social support and community services',
  },
];

// Application Status
export const APPLICATION_STATUS = {
  SUBMITTED: { label: 'Submitted', color: 'blue', icon: '📝' },
  UNDER_REVIEW: { label: 'Under Review', color: 'yellow', icon: '🔍' },
  APPROVED: { label: 'Approved', color: 'green', icon: '✅' },
  REJECTED: { label: 'Rejected', color: 'red', icon: '❌' },
  COMPLETED: { label: 'Completed', color: 'green', icon: '✨' },
  PENDING_DOCUMENTS: { label: 'Pending Documents', color: 'orange', icon: '📄' },
};

// Languages
export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
  { code: 'sid', name: 'Sidama', nativeName: 'Sidaamu Afoo' },
];

// Routes
export const ROUTES = {
  HOME: '/',
  SERVICES: '/services',
  SERVICE_DETAIL: '/services/:id',
  ORGANIZATIONS: '/organizations',
  ORGANIZATION_DETAIL: '/organizations/:id',
  NEWS: '/news',
  NEWS_DETAIL: '/news/:id',
  ABOUT: '/about',
  CONTACT: '/contact',
  FAQ: '/faq',
  TRACK: '/track',
  HOW_IT_WORKS: '/how-it-works',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  SEARCH: '/search',
};

// Processing Time Options
export const PROCESSING_TIMES = {
  INSTANT: 'Instant',
  SAME_DAY: 'Same Day',
  ONE_TO_THREE: '1-3 Working Days',
  THREE_TO_FIVE: '3-5 Working Days',
  ONE_WEEK: '1 Week',
  TWO_WEEKS: '2 Weeks',
  ONE_MONTH: '1 Month',
  VARIES: 'Varies',
};

export default {
  APP_NAME,
  APP_TAGLINE,
  APP_DESCRIPTION,
  CONTACT,
  SOCIAL_MEDIA,
  SERVICE_CATEGORIES,
  APPLICATION_STATUS,
  LANGUAGES,
  ROUTES,
  PROCESSING_TIMES,
};
