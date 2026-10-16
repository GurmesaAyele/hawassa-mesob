import { useState } from 'react';

const VIPTicket = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: Payment, 3: Success
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    nationalIdFront: null,
    nationalIdBack: null,
    sectorIdFront: null,
    sectorIdBack: null
  });
  const [selectedPayment, setSelectedPayment] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        [fieldName]: file
      });
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Validate all fields
    if (!formData.firstName || !formData.middleName || !formData.lastName) {
      alert('Please fill all name fields');
      return;
    }
    if (!formData.nationalIdFront || !formData.nationalIdBack || !formData.sectorIdFront || !formData.sectorIdBack) {
      alert('Please upload all required ID documents');
      return;
    }
    // Move to payment step
    setStep(2);
  };

  const handlePayment = () => {
    if (!selectedPayment) {
      alert('Please select a payment method');
      return;
    }
    // TODO: Integrate with actual payment gateway
    console.log('Processing payment via:', selectedPayment);
    console.log('Form data:', formData);
    
    // Simulate payment success
    setTimeout(() => {
      setStep(3);
    }, 1500);
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset after closing
    setTimeout(() => {
      setStep(1);
      setFormData({
        firstName: '',
        middleName: '',
        lastName: '',
        nationalIdFront: null,
        nationalIdBack: null,
        sectorIdFront: null,
        sectorIdBack: null
      });
      setSelectedPayment('');
    }, 300);
  };

  return (
    <>
      {/* VIP Ticket Button - Left Side */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-50 p-4 rounded-full shadow-2xl hover:scale-110 transition-transform duration-200"
        style={{ backgroundColor: '#CB9D2A' }}
      >
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      </button>

      {/* VIP Ticket Modal */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-50 w-[480px] max-h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300">
          {/* Header */}
          <div className="p-4 text-white rounded-t-2xl flex items-center justify-between" style={{ backgroundColor: '#CB9D2A' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg">VIP Ticket</h3>
                <p className="text-xs text-white/80">Fast Track Service</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Step 1: Information Form */}
            {step === 1 && (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Personal Information</h4>
                
                {/* Names */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter first name"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#CB9D2A] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Middle Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter middle name"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#CB9D2A] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter last name"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#CB9D2A] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* National ID Upload */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">National ID</h5>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Front Side <span className="text-red-500">*</span>
                      </label>
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formData.nationalIdFront ? formData.nationalIdFront.name : 'Upload'}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'nationalIdFront')}
                          required
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Back Side <span className="text-red-500">*</span>
                      </label>
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formData.nationalIdBack ? formData.nationalIdBack.name : 'Upload'}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'nationalIdBack')}
                          required
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Government Sector ID Upload */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Government Sector ID</h5>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Front Side <span className="text-red-500">*</span>
                      </label>
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formData.sectorIdFront ? formData.sectorIdFront.name : 'Upload'}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'sectorIdFront')}
                          required
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Back Side <span className="text-red-500">*</span>
                      </label>
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formData.sectorIdBack ? formData.sectorIdBack.name : 'Upload'}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'sectorIdBack')}
                          required
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90 mt-6"
                  style={{ backgroundColor: '#CB9D2A' }}
                >
                  Continue to Payment
                </button>
              </form>
            )}

            {/* Step 2: Payment Selection */}
            {step === 2 && (
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Select Payment Method</h4>
                
                <div className="space-y-3">
                  {/* TeleBirr */}
                  <button
                    onClick={() => setSelectedPayment('telebirr')}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      selectedPayment === 'telebirr'
                        ? 'border-[#CB9D2A] bg-[#CB9D2A]/10'
                        : 'border-gray-300 dark:border-gray-600 hover:border-[#CB9D2A]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
                        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-white">TeleBirr</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Pay with TeleBirr</p>
                      </div>
                    </div>
                  </button>

                  {/* CBE */}
                  <button
                    onClick={() => setSelectedPayment('cbe')}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      selectedPayment === 'cbe'
                        ? 'border-[#CB9D2A] bg-[#CB9D2A]/10'
                        : 'border-gray-300 dark:border-gray-600 hover:border-[#CB9D2A]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-white">Commercial Bank of Ethiopia</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Pay with CBE</p>
                      </div>
                    </div>
                  </button>

                  {/* CBEBirr */}
                  <button
                    onClick={() => setSelectedPayment('cbebirr')}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      selectedPayment === 'cbebirr'
                        ? 'border-[#CB9D2A] bg-[#CB9D2A]/10'
                        : 'border-gray-300 dark:border-gray-600 hover:border-[#CB9D2A]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-white">CBEBirr</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Pay with CBEBirr</p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Payment Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Amount:</strong> 500 ETB
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    VIP ticket provides fast-track service access
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 rounded-lg font-semibold border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={!selectedPayment}
                    className="flex-1 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#CB9D2A' }}
                  >
                    Pay Now
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#CB9D2A' }}>
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your VIP ticket has been issued successfully.
                </p>
                
                {/* Ticket Details */}
                <div className="bg-gradient-to-r from-[#CB9D2A] to-[#B8965F] text-white rounded-lg p-6 mb-6">
                  <p className="text-sm opacity-90 mb-2">VIP TICKET</p>
                  <p className="text-2xl font-bold mb-1">{formData.firstName} {formData.lastName}</p>
                  <p className="text-sm opacity-90">Ticket ID: VIP-{Date.now().toString().slice(-8)}</p>
                  <div className="mt-4 pt-4 border-t border-white/30">
                    <p className="text-xs opacity-75">Valid for fast-track service access</p>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  className="w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90"
                  style={{ backgroundColor: '#CB9D2A' }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default VIPTicket;
