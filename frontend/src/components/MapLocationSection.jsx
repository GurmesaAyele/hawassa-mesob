import { useState, useEffect } from 'react';
import { API_CONFIG, apiCall } from '../config/api';

const MapLocationSection = () => {
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLocation();
  }, []);

  const fetchLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall(API_CONFIG.ENDPOINTS.MAP);
      setLocationData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching map location:', err);
      setError('Failed to load map location.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 bg-[#1e293b]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (error || !locationData) {
    return (
      <div className="bg-[#1e293b] py-12 px-6 text-center text-red-400">
        <p>{error || 'Location information unavailable'}</p>
        <button
          onClick={fetchLocation}
          className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const { headquarters, contact, map } = locationData;

  return (
    <section id="location-map" className="bg-[#1e293b] text-white py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* Left Column: Interactive Google Map */}
          <div className="bg-[#273549] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            {/* Map Frame Container */}
            <div className="relative w-full h-[360px] md:h-[420px] rounded-xl overflow-hidden shadow-inner border border-slate-700/60">
              <iframe
                src={map.embedUrl}
                title={map.placeName}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                className="w-full h-full"
              />
            </div>

            {/* View on Google Maps Button */}
            <div className="mt-6">
              <a
                href={map.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-3 bg-[#2d58a7] hover:bg-[#244788] text-white font-semibold py-3.5 px-6 rounded-xl transition duration-200 shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                View on Google Maps
              </a>
            </div>
          </div>

          {/* Right Column: MESOB Headquarters Info Card */}
          <div className="bg-[#273549] rounded-2xl p-8 shadow-xl flex flex-col justify-between">
            <div>
              {/* Header Icon & Title */}
              <div className="flex items-start gap-4 mb-8">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-wide">
                    {headquarters.title}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">
                    {headquarters.subtitle}
                  </p>
                </div>
              </div>

              {/* Information Rows */}
              <div className="space-y-6">
                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-base">Address</h4>
                    <p className="text-slate-300 text-sm mt-0.5">{contact.address}</p>
                    {contact.plusCode && (
                      <p className="text-slate-400 text-xs mt-0.5">{contact.plusCode}</p>
                    )}
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-base">Operating Hours</h4>
                    <p className="text-slate-300 text-sm mt-0.5">{contact.operatingHours}</p>
                  </div>
                </div>

                {/* Contact Phone */}
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-base">Contact</h4>
                    <p className="text-slate-300 text-sm mt-0.5">
                      Phone: <a href={`tel:${contact.phone}`} className="hover:underline">{contact.phone}</a>
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-base">Email</h4>
                    <p className="text-slate-300 text-sm mt-0.5">
                      <a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Get Directions Button */}
            <div className="mt-8">
              <a
                href={map.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-3 bg-[#2d58a7] hover:bg-[#244788] text-white font-semibold py-3.5 px-6 rounded-xl transition duration-200 shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Get Directions
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default MapLocationSection;
