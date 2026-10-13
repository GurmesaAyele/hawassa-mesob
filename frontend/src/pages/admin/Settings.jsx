import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('about');
  const [aboutUs, setAboutUs] = useState({
    mission: '',
    vision: '',
    coreValues: [
      { title: 'Efficiency', description: '' },
      { title: 'Security', description: '' },
      { title: 'Accessibility', description: '' }
    ]
  });
  const [contacts, setContacts] = useState({
    email: '',
    phone: '',
    address: '',
    socialMedia: {
      facebook: '',
      twitter: '',
      instagram: ''
    }
  });
  const [heroMedia, setHeroMedia] = useState(null);
  const [heroPreview, setHeroPreview] = useState(null);
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [admins, setAdmins] = useState([]);

  useEffect(() => {
    fetchSettings();
    fetchAdmins();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      if (data.aboutUs) setAboutUs(data.aboutUs);
      if (data.contacts) setContacts(data.contacts);
      if (data.heroMedia) setHeroPreview(data.heroMedia);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      setAdmins(data);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const handleAboutUsSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/settings/about', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(aboutUs)
      });
      if (response.ok) {
        alert('About Us updated successfully!');
      }
    } catch (error) {
      console.error('Error updating About Us:', error);
    }
  };

  const handleContactsSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/settings/contacts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(contacts)
      });
      if (response.ok) {
        alert('Contacts updated successfully!');
      }
    } catch (error) {
      console.error('Error updating contacts:', error);
    }
  };

  const handleHeroMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setHeroMedia(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeroPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHeroMediaSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('heroMedia', heroMedia);

    try {
      const response = await fetch('/api/settings/hero', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: formData
      });
      if (response.ok) {
        alert('Hero media updated successfully!');
      }
    } catch (error) {
      console.error('Error updating hero media:', error);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    if (newAdmin.password !== newAdmin.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          username: newAdmin.username,
          password: newAdmin.password
        })
      });
      if (response.ok) {
        alert('Admin created successfully!');
        setNewAdmin({ username: '', password: '', confirmPassword: '' });
        fetchAdmins();
      }
    } catch (error) {
      console.error('Error creating admin:', error);
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      try {
        await fetch(`/api/admin/users/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        fetchAdmins();
      } catch (error) {
        console.error('Error deleting admin:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#3d5a99] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/admin/dashboard" className="text-sm hover:underline mb-1 block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab('about')}
              className={`px-6 py-4 font-semibold ${activeTab === 'about' ? 'border-b-2 border-[#3d5a99] text-[#3d5a99]' : 'text-gray-600'}`}
            >
              About Us
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`px-6 py-4 font-semibold ${activeTab === 'contacts' ? 'border-b-2 border-[#3d5a99] text-[#3d5a99]' : 'text-gray-600'}`}
            >
              Contacts
            </button>
            <button
              onClick={() => setActiveTab('hero')}
              className={`px-6 py-4 font-semibold ${activeTab === 'hero' ? 'border-b-2 border-[#3d5a99] text-[#3d5a99]' : 'text-gray-600'}`}
            >
              Hero Media
            </button>
            <button
              onClick={() => setActiveTab('admins')}
              className={`px-6 py-4 font-semibold ${activeTab === 'admins' ? 'border-b-2 border-[#3d5a99] text-[#3d5a99]' : 'text-gray-600'}`}
            >
              Admin Users
            </button>
          </div>
        </div>

        {/* About Us Tab */}
        {activeTab === 'about' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">About Us Content</h2>
            <form onSubmit={handleAboutUsSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Our Mission</label>
                <textarea
                  value={aboutUs.mission}
                  onChange={(e) => setAboutUs({ ...aboutUs, mission: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] outline-none"
                  rows="4"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Our Vision</label>
                <textarea
                  value={aboutUs.vision}
                  onChange={(e) => setAboutUs({ ...aboutUs, vision: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] outline-none"
                  rows="4"
                  required
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Core Values</h3>
                {aboutUs.coreValues.map((value, index) => (
                  <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{value.title}</label>
                    <textarea
                      value={value.description}
                      onChange={(e) => {
                        const newValues = [...aboutUs.coreValues];
                        newValues[index].description = e.target.value;
                        setAboutUs({ ...aboutUs, coreValues: newValues });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] outline-none"
                      rows="3"
                      required
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-[#3d5a99] text-white rounded-lg hover:bg-[#2d4a7f] transition font-semibold"
              >
                Save About Us
              </button>
            </form>
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
            <form onSubmit={handleContactsSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={contacts.email}
                  onChange={(e) => setContacts({ ...contacts, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={contacts.phone}
                  onChange={(e) => setContacts({ ...contacts, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  value={contacts.address}
                  onChange={(e) => setContacts({ ...contacts, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] outline-none"
                  rows="3"
                  required
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Social Media</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                    <input
                      type="url"
                      value={contacts.socialMedia.facebook}
                      onChange={(e) => setContacts({ ...contacts, socialMedia: { ...contacts.socialMedia, facebook: e.target.value } })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
                    <input
                      type="url"
                      value={contacts.socialMedia.twitter}
                      onChange={(e) => setContacts({ ...contacts, socialMedia: { ...contacts.socialMedia, twitter: e.target.value } })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                    <input
                      type="url"
                      value={contacts.socialMedia.instagram}
                      onChange={(e) => setContacts({ ...contacts, socialMedia: { ...contacts.socialMedia, instagram: e.target.value } })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-[#3d5a99] text-white rounded-lg hover:bg-[#2d4a7f] transition font-semibold"
              >
                Save Contacts
              </button>
            </form>
          </div>
        )}

        {/* Hero Media Tab */}
        {activeTab === 'hero' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Hero Section Media</h2>
            <form onSubmit={handleHeroMediaSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image/GIF</label>
                <input
                  type="file"
                  accept="image/*,.gif"
                  onChange={handleHeroMediaChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] outline-none"
                />
              </div>

              {heroPreview && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                  <img src={heroPreview} alt="Hero Preview" className="w-full max-h-96 object-cover rounded-lg" />
                </div>
              )}

              <button
                type="submit"
                className="px-6 py-3 bg-[#3d5a99] text-white rounded-lg hover:bg-[#2d4a7f] transition font-semibold"
              >
                Save Hero Media
              </button>
            </form>
          </div>
        )}

        {/* Admin Users Tab */}
        {activeTab === 'admins' && (
          <div className="space-y-6">
            {/* Create New Admin */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6">Create New Admin</h2>
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input
                    type="text"
                    value={newAdmin.username}
                    onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={newAdmin.confirmPassword}
                    onChange={(e) => setNewAdmin({ ...newAdmin, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5a99] outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-[#3d5a99] text-white rounded-lg hover:bg-[#2d4a7f] transition font-semibold"
                >
                  Create Admin
                </button>
              </form>
            </div>

            {/* Admin List */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6">Existing Admins</h2>
              <div className="space-y-4">
                {admins.map((admin) => (
                  <div key={admin.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-semibold">{admin.username}</p>
                      <p className="text-sm text-gray-600">Created: {new Date(admin.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteAdmin(admin.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
