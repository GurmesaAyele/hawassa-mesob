import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Analytics = () => {
  const [analytics, setAnalytics] = useState({
    pageViews: 0,
    uniqueVisitors: 0,
    searchQueries: 0,
    popularServices: [],
    popularInstitutions: [],
    trafficSources: []
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
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
          <h1 className="text-2xl font-bold">Analytics</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-gray-600 text-sm mb-2">Total Page Views</h3>
            <p className="text-3xl font-bold text-[#3d5a99]">{analytics.pageViews}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-gray-600 text-sm mb-2">Unique Visitors</h3>
            <p className="text-3xl font-bold text-green-600">{analytics.uniqueVisitors}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-gray-600 text-sm mb-2">Search Queries</h3>
            <p className="text-3xl font-bold text-yellow-600">{analytics.searchQueries}</p>
          </div>
        </div>

        {/* Popular Services */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Popular Services</h2>
          <div className="space-y-3">
            {analytics.popularServices.map((service, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{service.name}</span>
                <span className="text-gray-600">{service.views} views</span>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Institutions */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Popular Institutions</h2>
          <div className="space-y-3">
            {analytics.popularInstitutions.map((institution, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{institution.name}</span>
                <span className="text-gray-600">{institution.views} views</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
