import { useState, useEffect } from 'react';
import { API_CONFIG, apiCall } from '../config/api';

/**
 * MapInfoForm
 * Allows admins/operators to edit and write the map location, embed iframe,
 * operating hours, phone, email, and address matching the MESOB Headquarters cards.
 */
const MapInfoForm = ({ onUpdated }) => {
  const [formData, setFormData] = useState({
    title: 'MESOB Headquarters',
    subtitle: 'Government Services Center',
    address: 'MESOB Center, Hawassa, Ethiopia',
    operatingHours: 'Monday - Friday: 8:00 AM - 6:00 PM',
    phone: '+251974270600',
    email: 'admin@hawassamesobcenter.et',
    embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3258.4845707074883!2d38.4825464!3d7.0471372!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x17b145005515512d%3A0xe78217b9f10cede0!2sHAWASSA%20CITY%20MESOB%20CENTER!5e1!3m2!1sen!2set!4v1792405792373!5m2!1sen!2set',
    latitude: '7.0471372',
    longitude: '38.4825464',
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    // Pre-populate with existing server data
    apiCall(API_CONFIG.ENDPOINTS.MAP)
      .then((data) => {
        if (data) {
          setFormData({
            title: data.headquarters?.title || '',
            subtitle: data.headquarters?.subtitle || '',
            address: data.contact?.address || '',
            operatingHours: data.contact?.operatingHours || '',
            phone: data.contact?.phone || '',
            email: data.contact?.email || '',
            embedUrl: data.map?.embedUrl || '',
            latitude: data.map?.coordinates?.latitude?.toString() || '7.0471372',
            longitude: data.map?.coordinates?.longitude?.toString() || '38.4825464',
          });
        }
      })
      .catch((err) => console.warn('Could not prefill map form:', err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      const payload = {
        headquarters: {
          title: formData.title,
          subtitle: formData.subtitle,
        },
        address: formData.address,
        operatingHours: formData.operatingHours,
        phone: formData.phone,
        email: formData.email,
        embedUrl: formData.embedUrl,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      };

      const result = await apiCall(API_CONFIG.ENDPOINTS.MAP, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setStatusMessage({ type: 'success', text: 'Map & Headquarters details updated successfully!' });
      if (onUpdated) onUpdated(result);
    } catch (err) {
      console.error('Update failed:', err);
      setStatusMessage({ type: 'error', text: 'Failed to update map info. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1e293b] text-white p-8 rounded-2xl shadow-xl max-w-2xl mx-auto border border-slate-700">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700">
        <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold">Edit MESOB Location & Contact Information</h2>
          <p className="text-slate-400 text-xs">Update public details shown on the website map cards</p>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 mb-6 rounded-lg text-sm ${statusMessage.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Center Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-[#273549] border border-slate-600 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Subtitle</label>
            <input
              type="text"
              name="subtitle"
              value={formData.subtitle}
              onChange={handleChange}
              className="w-full bg-[#273549] border border-slate-600 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full bg-[#273549] border border-slate-600 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Operating Hours</label>
          <input
            type="text"
            name="operatingHours"
            value={formData.operatingHours}
            onChange={handleChange}
            className="w-full bg-[#273549] border border-slate-600 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-[#273549] border border-slate-600 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-[#273549] border border-slate-600 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Google Maps Embed URL</label>
          <textarea
            name="embedUrl"
            value={formData.embedUrl}
            onChange={handleChange}
            rows="2"
            className="w-full bg-[#273549] border border-slate-600 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Latitude</label>
            <input
              type="text"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              className="w-full bg-[#273549] border border-slate-600 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Longitude</label>
            <input
              type="text"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              className="w-full bg-[#273549] border border-slate-600 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition duration-200 shadow-md"
        >
          {loading ? 'Saving Changes...' : 'Save Location & Contact Information'}
        </button>
      </form>
    </div>
  );
};

export default MapInfoForm;
