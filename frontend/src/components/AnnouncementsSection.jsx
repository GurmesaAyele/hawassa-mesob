import { useState, useEffect } from 'react';
import { API_CONFIG, apiCall, getLocaleCode } from '../config/api';

const AnnouncementsSection = ({ language = 'English' }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, [language]); // Re-fetch when language changes

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);

    try {
      const locale = getLocaleCode(language);
      const data = await apiCall(`${API_CONFIG.ENDPOINTS.ANNOUNCEMENTS}?locale=${locale}`);
      setAnnouncements(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setError('Failed to load announcements.');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Translations
  const translations = {
    English: {
      title: 'Announcements',
      subtitle: 'Important announcements and updates from Hawassa Mesob',
      error: 'Failed to load announcements.',
      tryAgain: 'Try Again',
      noAnnouncements: 'No announcements available at the moment.'
    },
    Amharic: {
      title: 'ማስታወቂያዎች',
      subtitle: 'ከሐዋሳ መሶብ አስፈላጊ ማስታወቂያዎች እና ዝመናዎች',
      error: 'ማስታወቂያዎችን መጫን አልተቻለም።',
      tryAgain: 'እንደገና ሞክር',
      noAnnouncements: 'በአሁኑ ጊዜ ምንም ማስታወቂያዎች የሉም።'
    },
    Sidama: {
      title: 'Beeksisa',
      subtitle: 'Hawassa Mesob irraa beeksisaafi fooyya\'inoota barbaachisoo',
      error: 'Beeksisa fe\'uun hin milkoofne.',
      tryAgain: 'Irra Deebi\'ii Yaali',
      noAnnouncements: 'Yeroo ammaa kana beeksisa hin jiru.'
    }
  };

  const t = translations[language] || translations.English;

  // Get priority badge styling
  const getPriorityBadge = (priority) => {
    if (!priority) return null;

    const styles = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[priority.toLowerCase()] || styles.medium}`}>
        {priority}
      </span>
    );
  };

  // Get type icon
  const getTypeIcon = (type) => {
    const icons = {
      event: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      ),
      update: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
        </svg>
      ),
      alert: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
      general: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      )
    };

    return icons[type?.toLowerCase()] || icons.general;
  };

  return (
    <section id="announcements" className="min-h-screen bg-white dark:bg-[#172231] py-20 px-6 transition-colors">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-5xl font-bold text-center text-gray-900 dark:text-white mb-6">
          {t.title}
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12 text-lg">
          {t.subtitle}
        </p>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center">
            <p className="text-red-600 dark:text-red-400 text-lg">{t.error}</p>
            <button
              onClick={fetchAnnouncements}
              className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              {t.tryAgain}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && announcements.length === 0 && (
          <div className="text-center py-20">
            <svg className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-xl">{t.noAnnouncements}</p>
          </div>
        )}

        {/* Announcements List */}
        {!loading && !error && announcements.length > 0 && (
          <div className="space-y-6">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-l-4 border-blue-500"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    {getTypeIcon(announcement.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {announcement.title}
                      </h3>
                      {announcement.priority && getPriorityBadge(announcement.priority)}
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {announcement.date && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          {formatDate(announcement.date)}
                        </span>
                      )}
                      {announcement.type && (
                        <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-medium uppercase">
                          {announcement.type}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {announcement.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AnnouncementsSection;
