import { servicesData, organizationsData, faqData } from '../data';
import { searchFilter } from '../utils/helpers';

/**
 * Chatbot Service - Frontend mock AI assistant
 * This service simulates an AI chatbot by searching through our data
 * and providing contextual responses.
 */

class ChatbotService {
  constructor() {
    this.conversationHistory = [];
  }

  /**
   * Process user message and generate response
   */
  async processMessage(userMessage) {
    // Simulate processing delay
    await this.delay(800);

    const message = userMessage.toLowerCase().trim();
    
    // Check for greetings
    if (this.isGreeting(message)) {
      return this.getGreetingResponse();
    }

    // Check for help/what can you do
    if (this.isHelpRequest(message)) {
      return this.getHelpResponse();
    }

    // Search for services
    const serviceResults = this.searchServices(message);
    if (serviceResults.length > 0) {
      return this.getServiceResponse(serviceResults, message);
    }

    // Search for FAQs
    const faqResults = this.searchFAQs(message);
    if (faqResults.length > 0) {
      return this.getFAQResponse(faqResults);
    }

    // Search for organizations
    const orgResults = this.searchOrganizations(message);
    if (orgResults.length > 0) {
      return this.getOrganizationResponse(orgResults);
    }

    // Check for specific queries
    if (message.includes('requirement') || message.includes('document') || message.includes('need')) {
      return this.getRequirementsResponse(message);
    }

    if (message.includes('fee') || message.includes('cost') || message.includes('price') || message.includes('how much')) {
      return this.getFeeResponse(message);
    }

    if (message.includes('time') || message.includes('long') || message.includes('duration')) {
      return this.getProcessingTimeResponse(message);
    }

    if (message.includes('where') || message.includes('location')) {
      return this.getLocationResponse();
    }

    if (message.includes('track') || message.includes('status') || message.includes('application')) {
      return this.getTrackingResponse();
    }

    // Default response
    return this.getDefaultResponse();
  }

  /**
   * Helper methods
   */
  isGreeting(message) {
    const greetings = ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'];
    return greetings.some(greeting => message.includes(greeting));
  }

  isHelpRequest(message) {
    return message.includes('help') || 
           message.includes('what can you do') || 
           message.includes('how can you help') ||
           message === 'start';
  }

  searchServices(query) {
    return searchFilter(servicesData, query, ['name', 'description', 'category']).slice(0, 3);
  }

  searchFAQs(query) {
    const results = faqData.filter(faq => 
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query) ||
      faq.keywords.some(keyword => query.includes(keyword))
    );
    return results.slice(0, 2);
  }

  searchOrganizations(query) {
    return searchFilter(organizationsData, query, ['name', 'description', 'shortName']).slice(0, 2);
  }

  /**
   * Response generators
   */
  getGreetingResponse() {
    return {
      type: 'text',
      content: `Hello! 👋 I'm the MESOB AI Assistant.

I can help you with:
• Finding services
• Understanding requirements
• Learning about fees and processing times
• Discovering service locations
• Getting application guidance

What can I help you with today?`,
      quickReplies: [
        'Find a service',
        'What documents do I need?',
        'How much does it cost?',
        'Track my application',
      ],
    };
  }

  getHelpResponse() {
    return {
      type: 'text',
      content: `I'm here to help you navigate Hawassa MESOB services! 🎯

**I can assist you with:**

📋 **Finding Services**
Search for any government service you need

📄 **Requirements**
Learn what documents and information you need

💰 **Fees & Costs**
Find out how much services cost

⏱️ **Processing Times**
Know how long your service will take

📍 **Locations**
Find where to get services

📱 **Application Guidance**
Step-by-step help with applications

Just ask me anything! For example:
"I need a passport" or "How do I register a business?"`,
      quickReplies: [
        'Show all services',
        'Popular services',
        'Business services',
        'Document services',
      ],
    };
  }

  getServiceResponse(services, query) {
    const hasMultiple = services.length > 1;
    
    return {
      type: 'services',
      content: hasMultiple 
        ? `I found ${services.length} services related to "${query}":`
        : `I found this service for you:`,
      services: services,
      quickReplies: services.length > 0 ? [
        'Tell me more',
        'What documents needed?',
        'How much does it cost?',
        'How long does it take?',
      ] : [],
    };
  }

  getFAQResponse(faqs) {
    return {
      type: 'faq',
      content: 'Here\'s what I found:',
      faqs: faqs,
      quickReplies: [
        'More questions',
        'Find a service',
        'Contact support',
      ],
    };
  }

  getOrganizationResponse(organizations) {
    return {
      type: 'organizations',
      content: `Here are the organizations that can help:`,
      organizations: organizations,
      quickReplies: [
        'View services',
        'Contact information',
      ],
    };
  }

  getRequirementsResponse(message) {
    return {
      type: 'text',
      content: `To help you with requirements, I need to know which service you're interested in.

Could you please specify the service? For example:
• "Business registration requirements"
• "Passport requirements"
• "Driver license requirements"

Or browse our service directory to find what you need.`,
      quickReplies: [
        'Browse services',
        'Business services',
        'ID and documents',
      ],
    };
  }

  getFeeResponse(message) {
    return {
      type: 'text',
      content: `Service fees vary depending on the service type.

To get specific fee information:
1. Tell me which service you need
2. Or browse our service directory

Example: "Business registration fee" or "Passport cost"`,
      quickReplies: [
        'Popular services',
        'Free services',
        'Browse all services',
      ],
    };
  }

  getProcessingTimeResponse(message) {
    return {
      type: 'text',
      content: `Processing times vary by service:

⚡ **Same Day**: TIN registration, some certificates
📅 **1-3 Days**: National ID, business license renewal
📆 **1 Week**: Driver's license, some permits
📋 **2+ Weeks**: Passports, land registration

Which service are you interested in? I can give you the exact timeline.`,
      quickReplies: [
        'Fast services',
        'Business registration time',
        'Passport processing time',
      ],
    };
  }

  getLocationResponse() {
    return {
      type: 'text',
      content: `**Hawassa MESOB Main Service Center**

📍 Hawassa, Sidama Region, Ethiopia

🕒 **Working Hours:**
Monday - Friday: 8:30 AM - 5:30 PM

All services are available at our main location. Some services are also available through our mobile service van that visits rural areas.

Need directions or want to know about a specific service location?`,
      quickReplies: [
        'Get directions',
        'Service center services',
        'Mobile service schedule',
      ],
    };
  }

  getTrackingResponse() {
    return {
      type: 'text',
      content: `**Track Your Application** 🔍

You can track your application status using your Application ID.

Your Application ID looks like: **HM-2026-123456**

You received this ID when you submitted your application.

Would you like to:`,
      quickReplies: [
        'Track application',
        'Lost my application ID',
        'Contact support',
      ],
    };
  }

  getDefaultResponse() {
    return {
      type: 'text',
      content: `I'm not sure I understood that completely. Let me help you find what you need.

You can ask me about:
• Specific services (e.g., "passport application")
• Requirements and documents
• Fees and processing times
• Locations and contact information

Or try one of these:`,
      quickReplies: [
        'Show all services',
        'Popular services',
        'How MESOB works',
        'Contact support',
      ],
    };
  }

  /**
   * Utility method for simulating delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }
}

// Export singleton instance
export default new ChatbotService();
