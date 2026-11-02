import { useState, useEffect } from 'react';
import { API_CONFIG, apiCall, getLocaleCode } from '../config/api';

const VideosSection = ({ language = 'English' }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVideos();
  }, [language]); // Re-fetch when language changes

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);

    try {
      const locale = getLocaleCode(language);
      const data = await apiCall(`${API_CONFIG.ENDPOINTS.VIDEOS}?locale=${locale}`);
      setVideos(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setError('Failed to load videos.');
      setLoading(false);
    }
  };

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    
    // Handle different YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
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
      title: 'Videos',
      subtitle: 'Watch videos about our services and activities',
      error: 'Failed to load videos.',
      tryAgain: 'Try Again',
      noVideos: 'No videos available at the moment.'
    },
    Amharic: {
      title: 'ቪዲዮዎች',
      subtitle: 'ስለ አገልግሎቶቻችን እና ተግባራቶቻችን ቪዲዮዎችን ይመልከቱ',
      error: 'ቪዲዮዎችን መጫን አልተቻለም።',
      tryAgain: 'እንደገና ሞክር',
      noVideos: 'በአሁኑ ጊዜ ምንም ቪዲዮዎች የሉም።'
    },
    Sidama: {
      title: 'Viidiyoowwan',
      subtitle: 'Waa\'ee tajaajila keenyaafi hojiiwwan keenya ilaali',
      error: 'Viidiyoowwan fe\'uun hin milkoofne.',
      tryAgain: 'Irra Deebi\'ii Yaali',
      noVideos: 'Yeroo ammaa kana viidiyoowwan hin jiran.'
    }
  };

  const t = translations[language] || translations.English;

  return (
    <section id="videos" className="min-h-screen bg-gray-100 dark:bg-gray-900 py-20 px-6 transition-colors">
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
              onClick={fetchVideos}
              className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              {t.tryAgain}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && videos.length === 0 && (
          <div className="text-center py-20">
            <svg className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-xl">{t.noVideos}</p>
          </div>
        )}

        {/* Videos Grid */}
        {!loading && !error && videos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((video) => {
              const videoId = getYouTubeVideoId(video.youtubeUrl);
              
              return (
                <div
                  key={video.id}
                  className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  {/* YouTube Video Embed */}
                  {videoId ? (
                    <div className="relative pb-[56.25%] h-0 overflow-hidden">
                      <iframe
                        className="absolute top-0 left-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={video.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                    </div>
                  )}

                  {/* Video Info */}
                  <div className="p-6">
                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {video.title}
                    </h3>

                    {/* Description */}
                    {video.description && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                        {video.description}
                      </p>
                    )}

                    {/* Date */}
                    {video.date && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        {formatDate(video.date)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default VideosSection;
