import { APPLICATION_STATUS } from '../utils/constants';

// Mock application data for demo tracking feature
export const mockApplicationsData = {
  'HM-2026-123456': {
    id: 'HM-2026-123456',
    serviceId: 'business-registration',
    serviceName: 'Business Registration',
    applicantName: 'Demo User',
    submittedDate: '2026-09-25',
    currentStatus: 'UNDER_REVIEW',
    estimatedCompletion: '2026-09-30',
    timeline: [
      {
        status: 'SUBMITTED',
        date: '2026-09-25',
        time: '10:30 AM',
        description: 'Application submitted successfully',
        completed: true,
      },
      {
        status: 'UNDER_REVIEW',
        date: '2026-09-26',
        time: '2:15 PM',
        description: 'Documents received and under review',
        completed: true,
      },
      {
        status: 'APPROVED',
        date: null,
        time: null,
        description: 'Application approved',
        completed: false,
      },
      {
        status: 'COMPLETED',
        date: null,
        time: null,
        description: 'Ready for collection',
        completed: false,
      },
    ],
    documents: [
      { name: 'Business Name Reservation', status: 'Verified' },
      { name: 'Owner Identification', status: 'Verified' },
      { name: 'Lease Agreement', status: 'Verified' },
      { name: 'Capital Proof', status: 'Under Review' },
    ],
    notes: 'Your application is progressing well. All documents have been verified except capital proof which is currently under review.',
    contact: {
      phone: '+251-XX-XXX-XXXX',
      email: 'trade@hawassamesob.gov.et',
      desk: 'Trade & Industry Desk - Second Floor',
    },
  },
  'HM-2026-789012': {
    id: 'HM-2026-789012',
    serviceId: 'passport-application',
    serviceName: 'Passport Application',
    applicantName: 'Demo User',
    submittedDate: '2026-09-20',
    currentStatus: 'APPROVED',
    estimatedCompletion: '2026-10-05',
    timeline: [
      {
        status: 'SUBMITTED',
        date: '2026-09-20',
        time: '11:00 AM',
        description: 'Application submitted successfully',
        completed: true,
      },
      {
        status: 'UNDER_REVIEW',
        date: '2026-09-21',
        time: '9:30 AM',
        description: 'Documents verified and biometric data captured',
        completed: true,
      },
      {
        status: 'APPROVED',
        date: '2026-09-28',
        time: '3:45 PM',
        description: 'Application approved, passport is being printed',
        completed: true,
      },
      {
        status: 'COMPLETED',
        date: null,
        time: null,
        description: 'Ready for collection',
        completed: false,
      },
    ],
    documents: [
      { name: 'Birth Certificate', status: 'Verified' },
      { name: 'Citizenship Certificate', status: 'Verified' },
      { name: 'National ID', status: 'Verified' },
      { name: 'Biometric Data', status: 'Captured' },
    ],
    notes: 'Your passport has been approved and is currently being printed. You will be notified when it\'s ready for collection.',
    contact: {
      phone: '+251-XX-XXX-XXXX',
      email: 'immigration@hawassamesob.gov.et',
      desk: 'Immigration Desk - First Floor',
    },
  },
  'HM-2026-345678': {
    id: 'HM-2026-345678',
    serviceId: 'drivers-license',
    serviceName: 'Driver\'s License',
    applicantName: 'Demo User',
    submittedDate: '2026-09-15',
    currentStatus: 'COMPLETED',
    estimatedCompletion: '2026-09-23',
    timeline: [
      {
        status: 'SUBMITTED',
        date: '2026-09-15',
        time: '2:00 PM',
        description: 'Application submitted',
        completed: true,
      },
      {
        status: 'UNDER_REVIEW',
        date: '2026-09-16',
        time: '10:00 AM',
        description: 'Written test passed',
        completed: true,
      },
      {
        status: 'APPROVED',
        date: '2026-09-20',
        time: '3:30 PM',
        description: 'Practical test passed',
        completed: true,
      },
      {
        status: 'COMPLETED',
        date: '2026-09-23',
        time: '11:00 AM',
        description: 'License issued and ready for collection',
        completed: true,
      },
    ],
    documents: [
      { name: 'Medical Certificate', status: 'Verified' },
      { name: 'National ID', status: 'Verified' },
      { name: 'Written Test', status: 'Passed' },
      { name: 'Practical Test', status: 'Passed' },
    ],
    notes: 'Congratulations! Your driver\'s license is ready for collection at the Transport Authority desk.',
    contact: {
      phone: '+251-XX-XXX-XXXX',
      email: 'transport@hawassamesob.gov.et',
      desk: 'Transport Authority Desk - Ground Floor',
    },
  },
  'HM-2026-901234': {
    id: 'HM-2026-901234',
    serviceId: 'tin-registration',
    serviceName: 'TIN Registration',
    applicantName: 'Demo User',
    submittedDate: '2026-10-05',
    currentStatus: 'COMPLETED',
    estimatedCompletion: '2026-10-05',
    timeline: [
      {
        status: 'SUBMITTED',
        date: '2026-10-05',
        time: '10:00 AM',
        description: 'Application submitted',
        completed: true,
      },
      {
        status: 'COMPLETED',
        date: '2026-10-05',
        time: '10:30 AM',
        description: 'TIN certificate issued',
        completed: true,
      },
    ],
    documents: [
      { name: 'National ID', status: 'Verified' },
      { name: 'Proof of Address', status: 'Verified' },
    ],
    notes: 'Your TIN certificate has been issued successfully. TIN: 1234567890',
    contact: {
      phone: '+251-XX-XXX-XXXX',
      email: 'revenue@hawassamesob.gov.et',
      desk: 'Revenue Authority Desk - Second Floor',
    },
  },
  'HM-2026-567890': {
    id: 'HM-2026-567890',
    serviceId: 'land-registration',
    serviceName: 'Land Registration',
    applicantName: 'Demo User',
    submittedDate: '2026-09-18',
    currentStatus: 'PENDING_DOCUMENTS',
    estimatedCompletion: '2026-10-10',
    timeline: [
      {
        status: 'SUBMITTED',
        date: '2026-09-18',
        time: '1:30 PM',
        description: 'Application submitted',
        completed: true,
      },
      {
        status: 'PENDING_DOCUMENTS',
        date: '2026-09-22',
        time: '11:00 AM',
        description: 'Additional documents required',
        completed: true,
      },
      {
        status: 'UNDER_REVIEW',
        date: null,
        time: null,
        description: 'Documents under review',
        completed: false,
      },
      {
        status: 'COMPLETED',
        date: null,
        time: null,
        description: 'Land certificate ready',
        completed: false,
      },
    ],
    documents: [
      { name: 'Survey Certificate', status: 'Verified' },
      { name: 'Ownership Proof', status: 'Verified' },
      { name: 'Witness Statements', status: 'Pending' },
      { name: 'Kebele Confirmation', status: 'Pending' },
    ],
    notes: 'Please submit witness statements and kebele confirmation letter to proceed with your application.',
    contact: {
      phone: '+251-XX-XXX-XXXX',
      email: 'land@hawassamesob.gov.et',
      desk: 'Land Administration Desk - First Floor',
    },
  },
};

// Helper function to get application by ID
export const getApplicationById = (id) => {
  return mockApplicationsData[id] || null;
};

// Get all applications for a user (demo)
export const getUserApplications = () => {
  return Object.values(mockApplicationsData);
};

export default mockApplicationsData;
