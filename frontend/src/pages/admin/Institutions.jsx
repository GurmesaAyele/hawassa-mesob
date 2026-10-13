import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Institutions = () => {
  const [institutions, setInstitutions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: null,
    services: '',
    contact: '',
    website: ''
  });
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const response = await fetch('/api/institutions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      setInstitutions(data);
    } catch (error) {
      console.error('Error fetching institutions:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, logo: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      formDataToSend.append(key, formData[key]);
    });

    try {
      const url = selectedInstitution 
        ? `/api/institutions/${selectedInstitution.id}` 
        : '/api/institutions';
      const method = selectedInstitution ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        fetchInstitutions();
        handleCloseModal();
      }
    } catch (error) {
      console.error('Error saving institution:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this institution?')) {
      try {
        await fetch(`/api/institutions/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        fetchInstitutions();
      } catch (error) {
        console.error('Error deleting institution:', error);
      }
    }
  };

  const handleEdit = (institution) => {
    setSelectedInstitution(institution);
    setFormData({
      name: institution.name,
      description: institution.description,
      logo: null,
      services: institution.services,
      contact: institution.contact,
      website: institution.website
    });
    setLogoPreview(institution.logo);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedInstitution(null);
    setFormData({
      name: '',
      description: '',
      logo: null,
      services: '',
      contact: '',
      website: ''
    });
    setLogoPreview(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#3d5a99] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link to="/admin/dashboard" className="text-sm hover:underline mb-1 block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold">Manage Institutions</h1>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg transition font-semibold"
            >
              + Add Institution
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Institutions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {institutions.map((institution) => (
            <div key={institution.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden">
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                {institution.logo ? (
                  <img src={institution.logo} alt={institution.name} className="h-full w-full object-contain p-4" />
                ) : (
                  <div className="text-gray-400">No Logo</div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{institution.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{institution.description}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(institution)}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(institution.id)}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedInstitution ? 'Edit Institution' : 'Add New Institution'}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Institution Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] outline-none"
                    rows="4"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] outline-none"
                  />
                  {logoPreview && (
                    <div className="mt-4">
                      <img src={logoPreview} alt="Preview" className="h-32 object-contain" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Services Offered (comma separated)</label>
                  <textarea
                    value={formData.services}
                    onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] outline-none"
                    rows="3"
                    placeholder="e.g., Birth Certificate, ID Card, Business License"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact</label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] outline-none"
                    placeholder="Phone or Email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] outline-none"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-[#3d5a99] text-white rounded-lg hover:bg-[#2d4a7f] transition font-semibold"
                  >
                    {selectedInstitution ? 'Update Institution' : 'Add Institution'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Institutions;
