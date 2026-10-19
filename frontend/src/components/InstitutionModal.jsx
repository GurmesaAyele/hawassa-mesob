import { useState } from 'react';

const InstitutionModal = ({ institution, onClose }) => {
  const [expandedService, setExpandedService] = useState(null);

  if (!institution) return null;

  const toggleService = (serviceId) => {
    setExpandedService(expandedService === serviceId ? null : serviceId);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1e293b] w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden mx-4">
        {/* Header */}
        <div className="bg-[#0f172a] px-6 py-5 flex items-center justify-between border-b border-gray-700">
          <h2 className="text-white text-2xl font-bold">
            {institution.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Institution Logo */}
          {institution.logo && (
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center p-4">
                <img
                  src={institution.logo}
                  alt={institution.name}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Institution Description */}
          {institution.description && (
            <p className="text-gray-300 text-center mb-8">
              {institution.description}
            </p>
          )}

          {/* Services List */}
          <div className="space-y-3">
            {!institution.services || institution.services.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 text-xl">No services listed.</p>
              </div>
            ) : (
              institution.services.map((service) => (
                <div
                  key={service.id}
                  className="bg-[#334155] rounded-lg overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => toggleService(service.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#3d4f66] transition-colors"
                  >
                    <h3 className="text-white font-semibold text-lg text-left">
                      {service.name}
                    </h3>
                    <svg
                      className={`w-5 h-5 text-white transition-transform duration-200 ${
                        expandedService === service.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded Service Details */}
                  {expandedService === service.id && (
                    <div className="px-6 py-4 bg-[#2d3748] border-t border-gray-600">
                      {service.description ? (
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {service.description}
                        </p>
                      ) : (
                        <p className="text-gray-400 text-sm italic">
                          No description available.
                        </p>
                      )}

                      {/* Additional service details */}
                      {service.duration && (
                        <p className="text-gray-400 text-sm mt-2">
                          <span className="font-semibold">Duration:</span> {service.duration}
                        </p>
                      )}
                      {service.cost && (
                        <p className="text-gray-400 text-sm mt-1">
                          <span className="font-semibold">Cost:</span> {service.cost}
                        </p>
                      )}
                      {service.requirements && (
                        <div className="mt-2">
                          <p className="text-gray-400 text-sm font-semibold">Requirements:</p>
                          <p className="text-gray-300 text-sm">{service.requirements}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstitutionModal;
