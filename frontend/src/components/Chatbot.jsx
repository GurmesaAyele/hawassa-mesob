import { useState, useRef, useEffect } from 'react';
import { API_CONFIG, getLocaleCode } from '../config/api';

const CHAT_UI_TEXT = {
  English: {
    title: 'Hawassa-MESOB Assistant',
    online: 'Online',
    welcome: 'Hello! How can I help you today? You can ask me about city services, institutions, or any information.',
    placeholder: 'Type your message...',
    error: 'Sorry, I encountered an error connecting to the server. Please try again.',
  },
  Amharic: {
    title: 'የሀዋሳ-መሶብ ረዳት',
    online: 'መስመር ላይ',
    welcome: 'ሰላም! ዛሬ እንዴት ልረዳዎ እችላለሁ? ስለ ከተማው አገልግሎቶች፣ ተቋማት ወይም ማንኛውንም መረጃ መጠየቅ ይችላሉ።',
    placeholder: 'ጥያቄዎን እዚህ ይፃፉ...',
    error: 'ይቅርታ፣ ከአገልጋዩ ጋር መገናኘት አልተቻለም። እባክዎ እንደገና ይሞክሩ።',
  },
  Sidama: {
    title: "Hawassa-MESOOBE Kaa'laancho",
    online: 'Loosaho no',
    welcome: "Keero! Techo ma garinni kaa'lo'ne? Katamu agurubba, biirubba woy mayi mashalaqqeno xa'ma dandiitinanni.",
    placeholder: "Xa'mokki koye borreessi...",
    error: "Konnira so'ro kalaqantu. Mageeshshi yanna gedensaanni marroote wo'naalle.",
  },
};


const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'English');

  const ui = CHAT_UI_TEXT[language] || CHAT_UI_TEXT.English;

  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: (CHAT_UI_TEXT[localStorage.getItem('language') || 'English'] || CHAT_UI_TEXT.English).welcome,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Sync with global language switcher
  useEffect(() => {
    const handleLanguageChange = (event) => {
      const nextLang = event.detail;
      if (nextLang && CHAT_UI_TEXT[nextLang]) {
        setLanguage(nextLang);
        // If the user hasn't chatted yet (only initial welcome bot message), update greeting
        setMessages((prev) => {
          if (prev.length === 1 && prev[0].type === 'bot') {
            return [{
              type: 'bot',
              text: CHAT_UI_TEXT[nextLang].welcome,
              timestamp: new Date()
            }];
          }
          return prev;
        });
      }
    };

    window.addEventListener('languageChange', handleLanguageChange);
    return () => window.removeEventListener('languageChange', handleLanguageChange);
  }, []);

  // Function to format markdown-style text to readable format
  const formatMessageText = (text) => {
    if (!text) return text;

    // Remove markdown bold markers but keep the text
    let formatted = text.replace(/\*\*(.+?)\*\*/g, '$1');

    // Keep line breaks
    formatted = formatted.replace(/\n/g, '\n');

    return formatted;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage = {
      type: 'user',
      text: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    try {
      const currentLocale = getLocaleCode(language);
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          locale: currentLocale,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      const data = await response.json();
      console.log('API Response:', data); // Debug log

      const rawText = data.response || data.reply || data.answer || data.message || data.text || JSON.stringify(data);
      const formattedText = formatMessageText(rawText);

      const botMessage = {
        type: 'bot',
        text: formattedText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        type: 'bot',
        text: ui.error,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl hover:scale-110 transition-transform duration-200"
        style={{ backgroundColor: '#294491' }}
      >
        {isOpen ? (
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300">
          {/* Header */}
          <div className="p-4 text-white rounded-t-2xl" style={{ backgroundColor: '#294491' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg">{ui.title}</h3>
                <p className="text-xs text-white/80">{ui.online}</p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${message.type === 'user'
                    ? 'text-white rounded-br-none'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-none shadow-sm'
                    }`}
                  style={message.type === 'user' ? { backgroundColor: '#294491' } : {}}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                  <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={ui.placeholder}
                className="flex-1 px-4 py-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#294491] text-sm"
              />
              <button
                type="submit"
                className="p-3 rounded-full text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#294491' }}
                disabled={!inputMessage.trim()}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;
