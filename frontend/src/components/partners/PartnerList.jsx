import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

const PartnerList = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    isAvailable: '',
    vehicleType: '',
    sortBy: 'rating',
    sortOrder: 'desc'
  });

  const { error: showError, success } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchPartners();
  }, [filters]);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      if (filters.isAvailable !== '') {
        params.append('isAvailable', filters.isAvailable);
      }
      if (filters.vehicleType) {
        params.append('vehicleType', filters.vehicleType);
      }

      const response = await axios.get(`/api/partners?${params}`);
      
      if (response.data.success) {
        setPartners(response.data.data.partners);
      }
    } catch (error) {
      showError('Failed to fetch delivery partners');
    } finally {
      setLoading(false);
    }
  };

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = !searchTerm || 
      partner.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.phone.includes(searchTerm) ||
      partner.vehicleType?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (partner) => {
    if (!partner.isActive) {
      return <span className="status-badge bg-red-100 text-red-800">Inactive</span>;
    }
    if (partner.isAvailable) {
      return <span className="status-badge bg-green-100 text-green-800">Available</span>;
    }
    return <span className="status-badge bg-yellow-100 text-yellow-800">Busy</span>;
  };

  const getVehicleIcon = (vehicleType) => {
    const icons = {
      bike: '🏍️',
      scooter: '🛵',
      bicycle: '🚲',
      car: '🚗'
    };
    return icons[vehicleType] || '🚗';
  };

  const updatePartnerRating = async (partnerId, newRating) => {
    try {
      await axios.put(`/api/partners/${partnerId}/rating`, { rating: newRating });
      success('Partner rating updated successfully');
      fetchPartners();
    } catch (error) {
      showError('Failed to update partner rating');
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
          <span className="ml-3 text-gray-600">Loading delivery partners...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Delivery Partners
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and monitor your delivery team
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{filteredPartners.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Partners</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Partners
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                placeholder="Search by name, phone, or vehicle type..."
              />
            </div>
          </div>

          {/* Availability Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Availability
            </label>
            <select
              value={filters.isAvailable}
              onChange={(e) => handleFilterChange('isAvailable', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            >
              <option value="">All Partners</option>
              <option value="true">Available</option>
              <option value="false">Busy</option>
            </select>
          </div>

          {/* Vehicle Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vehicle Type
            </label>
            <select
              value={filters.vehicleType}
              onChange={(e) => handleFilterChange('vehicleType', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            >
              <option value="">All Vehicles</option>
              <option value="bike">Bike</option>
              <option value="scooter">Scooter</option>
              <option value="bicycle">Bicycle</option>
              <option value="car">Car</option>
            </select>
          </div>
        </div>

        {/* Sort Options */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
          >
            <option value="rating">Rating</option>
            <option value="totalDeliveries">Total Deliveries</option>
            <option value="firstName">Name</option>
            <option value="createdAt">Join Date</option>
          </select>
          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
          >
            <option value="desc">High to Low</option>
            <option value="asc">Low to High</option>
          </select>
        </div>
      </div>

      {/* Partners Grid */}
      {filteredPartners.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="h-16 w-16 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No partners found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || filters.isAvailable || filters.vehicleType 
              ? 'Try adjusting your search or filters' 
              : 'No delivery partners have been registered yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPartners.map((partner) => (
            <div key={partner._id} className="card hover:shadow-lg transition-shadow duration-200">
              <div className="p-6">
                {/* Partner Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {partner.firstName?.charAt(0)}{partner.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {partner.firstName} {partner.lastName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {partner._id.slice(-6).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(partner)}
                </div>

                {/* Partner Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Phone:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {partner.phone}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Vehicle:</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-lg">{getVehicleIcon(partner.vehicleType)}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {partner.vehicleType}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Rating:</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {partner.rating?.toFixed(1) || 'New'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Deliveries:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {partner.totalDeliveries || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Joined:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(partner.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex space-x-2">
                  <Link
                    to={`/partners/${partner._id}`}
                    className="flex-1 btn-primary text-center text-sm py-2"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => {
                      const rating = prompt('Enter new rating (1-5):');
                      if (rating && rating >= 1 && rating <= 5) {
                        updatePartnerRating(partner._id, parseFloat(rating));
                      }
                    }}
                    className="flex-1 btn-secondary text-sm py-2"
                    title="Update Rating"
                  >
                    Rate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">
            {filteredPartners.filter(p => p.isAvailable).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Available Now</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
            {filteredPartners.filter(p => p.isActive).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active Partners</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
            {(() => {
              const partnersWithRatings = filteredPartners.filter(p => p.rating && p.rating > 0);
              if (partnersWithRatings.length === 0) return 'N/A';
              const avgRating = partnersWithRatings.reduce((sum, p) => sum + p.rating, 0) / partnersWithRatings.length;
              return Math.round(avgRating * 10) / 10;
            })()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Average Rating</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
            {filteredPartners.reduce((sum, p) => sum + (p.totalDeliveries || 0), 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Deliveries</div>
        </div>
      </div>
    </div>
  );
};

export default PartnerList; 