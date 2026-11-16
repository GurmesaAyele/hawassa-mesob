import { useState } from 'react';
import "./InstitutionLogo.css";
import { API_CONFIG, resolveLocalizedValue } from '../config/api';

const InstitutionModal = ({ institution, onClose, language, isVIPMode = false, selectedServices = [], onServiceToggle, onProceed }) => {
  const [expandedService, setExpandedService] = useState(null);

  if (!institution) return null;

  const toggleService = (serviceId) => {
    setExpandedService(expandedService === serviceId ? null : serviceId);
  };

  const isServiceSelected = (serviceId) => {
    return selectedServices.some(s => s.id === serviceId);
  };

  // Translations
  const translations = {
    English: {
      services: 'Services',
      noServices: 'No services listed.',
      description: 'Description',
      requiredDocuments: 'Required Documents',
      processingTime: 'Processing Time',
      serviceFee: 'Service Fee',
      free: 'Free',
      day: 'day',
      days: 'days',
      sameDay: 'Same day',
      variable: 'Variable',
      selectForVIP: 'Select for VIP',
      selectedForVIP: 'Selected',
      proceedWithSelected: 'Proceed with Selected Services',
      servicesSelected: 'service(s) selected'
    },
    Amharic: {
      services: 'አገልግሎቶች',
      noServices: 'ምንም አገልግሎቶች አልተዘረዘሩም።',
      description: 'መግለጫ',
      requiredDocuments: 'የሚያስፈልጉ ሰነዶች',
      processingTime: 'የማስኬጃ ጊዜ',
      serviceFee: 'የአገልግሎት ክፍያ',
      free: 'ነጻ',
      day: 'ቀን',
      days: 'ቀናት',
      sameDay: 'በዚሁ ቀን',
      variable: 'ተለዋዋጭ',
      selectForVIP: 'ለቪአይፒ ይምረጡ',
      selectedForVIP: 'ተመርጧል',
      proceedWithSelected: 'ከተመረጡት አገልግሎቶች ጋር ይቀጥሉ',
      servicesSelected: 'አገልግሎት(ቶች) ተመርጠዋል'
    },
    Sidama: {
      services: 'Oosuwaa',
      noServices: 'Oosuwaa hin qabnu.',
      description: 'Ibsa',
      requiredDocuments: 'Barruulee Barbaachisu',
      processingTime: 'Hojii Yeroo',
      serviceFee: 'Oosuwaa Kaffaltii',
      free: 'Bilisaa',
      day: 'guyyaa',
      days: 'guyyoota',
      sameDay: 'Guyyuma',
      variable: 'Jijjiiramaa',
      selectForVIP: 'VIP doorri',
      selectedForVIP: 'Doorrame',
      proceedWithSelected: 'Doorrame oosate waliin haa',
      servicesSelected: 'oosate doorrame'
    }
  };

  const t = translations[language] || translations.English;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#1e293b] w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden mx-4">
        {/* Header */}
        <div className="bg-gray-100 dark:bg-[#0f172a] px-6 py-5 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-gray-900 dark:text-white text-2xl font-bold">
              {institution.name} {t.services}
            </h2>
            {isVIPMode && selectedServices.length > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {selectedServices.length} {t.servicesSelected}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg"
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
              <div className="institution-logo-frame institution-logo-frame--modal w-32 h-32 bg-white rounded-xl flex items-center justify-center p-4">
                <img
                  src={institution.logo}
                  alt={institution.name}
                  className="institution-logo-image w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Institution Description */}
          {institution.description && (
            <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
              {institution.description}
            </p>
          )}

          {/* Services Accordion List */}
          <div className="space-y-3">
            {!institution.services || institution.services.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-20 h-20 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400 text-xl">{t.noServices}</p>
              </div>
            ) : (
              institution.services.map((service) => {
                const selected = isServiceSelected(service.id);
                const titleText = resolveLocalizedValue(service.title, language) || resolveLocalizedValue(service.name, language);

                // VIP Mode: Direct Selection without expanding dropdown details
                if (isVIPMode) {
                  return (
                    <div
                      key={service.id}
                      onClick={() => onServiceToggle({
                        ...service,
                        institutionName: service.institutionName || institution.name,
                        institutionId: service.institutionId || institution.id
                      })}
                      className={`cursor-pointer rounded-xl p-4 sm:p-5 transition-all duration-200 border-2 flex items-center justify-between gap-4 select-none ${
                        selected
                          ? 'bg-amber-500/10 border-[#CB9D2A] dark:bg-[#CB9D2A]/15 shadow-sm'
                          : 'bg-gray-100 dark:bg-[#334155] border-transparent hover:border-[#CB9D2A]/50 hover:bg-gray-200 dark:hover:bg-[#3d4f66]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Checkbox indicator */}
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                            selected
                              ? 'bg-[#CB9D2A] text-white shadow-sm'
                              : 'border-2 border-gray-400 dark:border-gray-500 bg-white/20'
                          }`}
                        >
                          {selected ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="text-gray-400 text-xs font-bold">+</span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="text-gray-900 dark:text-white font-bold text-base sm:text-lg leading-snug">
                            {titleText}
                          </h3>
                          {(service.estimatedFee !== undefined && service.estimatedFee !== null) || service.processingDays ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {service.estimatedFee !== undefined && service.estimatedFee !== null && (
                                <span>{service.estimatedFee === 0 ? t.free : `${service.estimatedFee} ETB`}</span>
                              )}
                              {service.processingDays ? (
                                <span> • {service.processingDays} {service.processingDays === 1 ? t.day : t.days}</span>
                              ) : null}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {/* Selection pill */}
                      <div className="flex-shrink-0">
                        <span
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                            selected
                              ? 'bg-[#CB9D2A] text-white shadow-sm'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {selected ? (
                            <>
                              <span>✓</span>
                              <span>{t.selectedForVIP}</span>
                            </>
                          ) : (
                            <>
                              <span>+</span>
                              <span>{t.selectForVIP}</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                }

                // Standard Mode (Browsing): Accordion with full dropdown details
                return (
                  <div
                    key={service.id}
                    className="bg-gray-100 dark:bg-[#334155] rounded-lg overflow-hidden transition-all duration-200 hover:bg-gray-200 dark:hover:bg-[#3d4f66]"
                  >
                    {/* Accordion Header */}
                    <button
                      onClick={() => toggleService(service.id)}
                      className="w-full px-6 py-4 flex items-center justify-between transition-colors"
                    >
                      <h3 className="text-gray-900 dark:text-white font-semibold text-lg text-left">
                        {titleText}
                      </h3>
                      <svg
                        className={`w-5 h-5 text-gray-900 dark:text-white transition-transform duration-200 flex-shrink-0 ml-4 ${
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
                      <div className="px-6 py-5 bg-gray-50 dark:bg-[#2d3748] border-t border-gray-200 dark:border-gray-600 space-y-4">
                        {/* Description */}
                        {service.description && (
                          <div>
                            <h4 className="text-gray-600 dark:text-gray-400 text-sm font-semibold mb-2">{t.description}:</h4>
                            <p className="text-gray-800 dark:text-gray-300 text-sm leading-relaxed">
                              {resolveLocalizedValue(service.description, language)}
                            </p>
                          </div>
                        )}

                        {/* Required Documents */}
                        {(service.requirements || service.requiredDocuments) && (
                          <div>
                            <h4 className="text-gray-600 dark:text-gray-400 text-sm font-semibold mb-2">{t.requiredDocuments}:</h4>
                            <ul className="list-disc list-inside space-y-1">
                              {(service.requirements || service.requiredDocuments).map((req, index) => (
                                <li key={index} className="text-gray-800 dark:text-gray-300 text-sm">
                                  {resolveLocalizedValue(req, language)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Processing Time & Service Fee Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          {(service.duration || service.processingDays !== null) && (
                            <div className="bg-white dark:bg-[#1e293b] rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h4 className="text-gray-600 dark:text-gray-400 text-sm font-semibold">{t.processingTime}</h4>
                              </div>
                              <p className="text-gray-900 dark:text-white text-lg font-bold">
                                {service.duration || `${service.processingDays} ${service.processingDays === 1 ? t.day : t.days}`}
                              </p>
                            </div>
                          )}

                          {(service.cost || service.estimatedFee !== undefined) && (
                            <div className="bg-white dark:bg-[#1e293b] rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h4 className="text-gray-600 dark:text-gray-400 text-sm font-semibold">{t.serviceFee}</h4>
                              </div>
                              <p className="text-gray-900 dark:text-white text-lg font-bold">
                                {service.cost || (service.estimatedFee === null || service.estimatedFee === 0 ? t.free : `${service.estimatedFee} ETB`)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer - VIP Proceed Button */}
        {isVIPMode && selectedServices.length > 0 && (
          <div className="bg-gray-100 dark:bg-[#0f172a] px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onProceed}
              className="w-full py-3 px-6 bg-[#CB9D2A] hover:bg-[#b8892a] text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 text-lg"
            >
              {t.proceedWithSelected}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstitutionModal;
