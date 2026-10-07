import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import chatbotService from '../../services/chatbotService';
import Button from '../common/Button';
import Card from '../common/Card';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Listen for open chatbot events
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('openChatbot', handleOpen);
    return () => window.removeEventListener('openChatbot', handleOpen);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send welcome message when opened for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      sendWelcomeMessage();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendWelcomeMessage = async () => {
    const welcomeResponse = await chatbotService.processMessage('hello');
    setMessages([
      {
        id: Date.now(),
        type: 'bot',
        ...welcomeResponse,
      },
    ]);
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await chatbotService.processMessage(inputValue);
      
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          type: 'bot',
          ...response,
        },
      ]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          type: 'bot',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickReply = (reply) => {
    setInputValue(reply);
    setTimeout(() => handleSend(), 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleServiceClick = (serviceId) => {
    navigate(`/services/${serviceId}`);
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleClear = () => {
    setMessages([]);
    chatbotService.clearHistory();
    sendWelcomeMessage();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-full shadow-large hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        aria-label="Open MESOB AI Assistant"
      >
        <svg className="w-8 h-8 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-md animate-scale-in">
      {/* Chat Window */}
      <div className="bg-white rounded-2xl shadow-large overflow-hidden flex flex-col" style={{ height: '600px', maxHeight: '80vh' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">MESOB AI Assistant</div>
              <div className="text-xs opacity-90 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Online
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              aria-label="Clear conversation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div key={message.id}>
              {message.type === 'user' ? (
                <div className="flex justify-end">
                  <div className="bg-primary-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                    {message.content}
                  </div>
                </div>
              ) : (
                <div className="flex justify-start">
                  <div className="max-w-[85%]">
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                      {message.content && (
                        <div className="text-gray-800 whitespace-pre-line text-sm">
                          {message.content}
                        </div>
                      )}

                      {/* Service Cards */}
                      {message.services && message.services.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.services.map((service) => (
                            <button
                              key={service.id}
                              onClick={() => handleServiceClick(service.id)}
                              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-2xl">{service.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 text-sm">
                                    {service.name}
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {service.description}
                                  </div>
                                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                    <span>⏱️ {service.processingTime}</span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* FAQ Items */}
                      {message.faqs && message.faqs.length > 0 && (
                        <div className="mt-3 space-y-3">
                          {message.faqs.map((faq) => (
                            <div key={faq.id} className="text-sm">
                              <div className="font-medium text-gray-900 mb-1">
                                {faq.question}
                              </div>
                              <div className="text-gray-600 text-xs">
                                {faq.answer}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Organizations */}
                      {message.organizations && message.organizations.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.organizations.map((org) => (
                            <div key={org.id} className="p-3 border border-gray-200 rounded-lg">
                              <div className="font-medium text-gray-900 text-sm">
                                {org.shortName}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {org.description}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quick Replies */}
                    {message.quickReplies && message.quickReplies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {message.quickReplies.map((reply, index) => (
                          <button
                            key={index}
                            onClick={() => handleQuickReply(reply)}
                            className="px-3 py-1.5 bg-white hover:bg-primary-50 text-primary-600 border border-primary-200 rounded-full text-xs font-medium transition-colors"
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask anything about MESOB..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
