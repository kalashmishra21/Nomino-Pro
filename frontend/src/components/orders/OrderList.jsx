import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availablePartners, setAvailablePartners] = useState([]);
  const [assigningOrder, setAssigningOrder] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    sortBy: 'orderPlacedAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    totalPages: 1,
    currentPage: 1,
    totalOrders: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  const { error: showError, success } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();
    if (user?.role === 'restaurant_manager') {
      fetchAvailablePartners();
    }
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);
      queryParams.append('sortBy', filters.sortBy);
      queryParams.append('sortOrder', filters.sortOrder);
      queryParams.append('page', filters.page);
      queryParams.append('limit', filters.limit);

      console.log('Fetching orders with params:', queryParams.toString());

      const response = await axios.get(`/api/orders?${queryParams}`);
      console.log('Orders response:', response.data);
      
      if (response.data.success) {
        setOrders(response.data.data.orders || []);
        setPagination(response.data.data.pagination || {
          totalPages: 1,
          currentPage: 1,
          totalOrders: 0,
          hasNextPage: false,
          hasPrevPage: false
        });
      } else {
        throw new Error(response.data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Orders fetch error:', error);
      showError(error.response?.data?.message || 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePartners = async () => {
    try {
      const response = await axios.get('/api/auth/available-partners');
      if (response.data.success) {
        setAvailablePartners(response.data.data.partners || []);
      }
    } catch (error) {
      console.error('Failed to fetch available partners:', error);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const endpoint = user?.role === 'delivery_partner' 
        ? `/api/orders/${orderId}/status`
        : `/api/orders/${orderId}`;
      
      await axios.put(endpoint, { status });
      success(`Order status updated to ${status.replace('_', ' ')}`);
      fetchOrders(); // Refresh the list
    } catch (error) {
      console.error('Status update error:', error);
      showError(error.response?.data?.message || 'Failed to update order status');
    }
  };

  const assignPartner = async (orderId, partnerId) => {
    try {
      setAssigningOrder(orderId);
      await axios.put(`/api/orders/${orderId}/assign`, { partnerId });
      success('Delivery partner assigned successfully');
      fetchOrders(); // Refresh the list
      fetchAvailablePartners(); // Refresh available partners
    } catch (error) {
      console.error('Partner assignment error:', error);
      showError(error.response?.data?.message || 'Failed to assign delivery partner');
    } finally {
      setAssigningOrder(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { 
        class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        label: 'Pending'
      },
      PREP: { 
        class: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        label: 'In Preparation'
      },
      READY: { 
        class: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
        label: 'Ready'
      },
      PICKED: { 
        class: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
        label: 'Picked Up'
      },
      ON_ROUTE: { 
        class: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
        label: 'On Route'
      },
      DELIVERED: { 
        class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        label: 'Delivered'
      },
      CANCELLED: { 
        class: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        label: 'Cancelled'
      }
    };
    
    const config = statusConfig[status] || statusConfig.PENDING;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const getNextStatus = (currentStatus) => {
    if (user?.role === 'delivery_partner') {
      const partnerStatusFlow = {
        READY: 'PICKED',
        PICKED: 'ON_ROUTE',
        ON_ROUTE: 'DELIVERED'
      };
      return partnerStatusFlow[currentStatus];
    } else {
      const managerStatusFlow = {
        PENDING: 'PREP',
        PREP: 'READY'
      };
      return managerStatusFlow[currentStatus];
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate dispatch time based on real order data
  const calculateDispatchTime = (order) => {
    // If order is delivered, show actual delivery time
    if (order.status === 'DELIVERED' && order.deliveredAt) {
      const orderTime = new Date(order.orderPlacedAt || order.createdAt);
      const deliveredTime = new Date(order.deliveredAt);
      const actualMinutes = Math.floor((deliveredTime - orderTime) / (1000 * 60));
      
      const hours = Math.floor(actualMinutes / 60);
      const minutes = actualMinutes % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes} min`;
    }
    
    // If order is on route, show time since order placed
    if (order.status === 'ON_ROUTE' && order.onRouteAt) {
      const orderTime = new Date(order.orderPlacedAt || order.createdAt);
      const onRouteTime = new Date(order.onRouteAt);
      const elapsedMinutes = Math.floor((onRouteTime - orderTime) / (1000 * 60));
      
      const hours = Math.floor(elapsedMinutes / 60);
      const minutes = elapsedMinutes % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes} min`;
    }
    
    // If order is picked up, show time since order placed
    if (order.status === 'PICKED' && order.pickedAt) {
      const orderTime = new Date(order.orderPlacedAt || order.createdAt);
      const pickedTime = new Date(order.pickedAt);
      const elapsedMinutes = Math.floor((pickedTime - orderTime) / (1000 * 60));
      
      const hours = Math.floor(elapsedMinutes / 60);
      const minutes = elapsedMinutes % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes} min`;
    }
    
    // If order is ready, show time since order placed
    if (order.status === 'READY' && order.readyAt) {
      const orderTime = new Date(order.orderPlacedAt || order.createdAt);
      const readyTime = new Date(order.readyAt);
      const elapsedMinutes = Math.floor((readyTime - orderTime) / (1000 * 60));
      
      const hours = Math.floor(elapsedMinutes / 60);
      const minutes = elapsedMinutes % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes} min`;
    }
    
    // If order is in prep, show elapsed time + estimated remaining
    if (order.status === 'PREP') {
      const orderTime = new Date(order.orderPlacedAt || order.createdAt);
      const currentTime = new Date();
      const elapsedMinutes = Math.floor((currentTime - orderTime) / (1000 * 60));
      
      // Calculate estimated remaining time
      const totalEstimated = (order.prepTime || 30) + (order.estimatedDeliveryTime || 30);
      const remainingMinutes = Math.max(0, totalEstimated - elapsedMinutes);
      
      const hours = Math.floor(remainingMinutes / 60);
      const minutes = remainingMinutes % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes} min`;
    }
    
    // If order is pending, show estimated total time
    if (order.status === 'PENDING') {
      const totalMinutes = (order.prepTime || 30) + (order.estimatedDeliveryTime || 30);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes} min`;
    }
    
    // If order is cancelled, show time until cancellation
    if (order.status === 'CANCELLED') {
      const orderTime = new Date(order.orderPlacedAt || order.createdAt);
      const cancelTime = new Date(order.cancelledAt || order.updatedAt);
      const elapsedMinutes = Math.floor((cancelTime - orderTime) / (1000 * 60));
      
      const hours = Math.floor(elapsedMinutes / 60);
      const minutes = elapsedMinutes % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes} min`;
    }
    
    // Fallback to estimated time
    if (order.prepTime && order.estimatedDeliveryTime) {
      const totalMinutes = order.prepTime + order.estimatedDeliveryTime;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes} min`;
    }
    
    return 'N/A';
  };

  // Calculate estimated completion time from order placement
  const getEstimatedCompletionTime = (order) => {
    if (!order.orderPlacedAt || !order.prepTime || !order.estimatedDeliveryTime) {
      return 'N/A';
    }
    
    const totalMinutes = order.prepTime + order.estimatedDeliveryTime;
    const completionTime = new Date(new Date(order.orderPlacedAt).getTime() + (totalMinutes * 60 * 1000));
    
    return completionTime.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PREP', label: 'In Preparation' },
    { value: 'READY', label: 'Ready for Pickup' },
    { value: 'PICKED', label: 'Picked Up' },
    { value: 'ON_ROUTE', label: 'On Route' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  const sortOptions = [
    { value: 'orderPlacedAt', label: 'Newest First', order: 'desc' },
    { value: 'orderPlacedAt', label: 'Oldest First', order: 'asc' },
    { value: 'totalAmount', label: 'Highest Amount', order: 'desc' },
    { value: 'totalAmount', label: 'Lowest Amount', order: 'asc' },
    { value: 'status', label: 'Status', order: 'asc' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {user?.role === 'delivery_partner' ? 'My Orders' : 'Order Management'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {user?.role === 'delivery_partner' 
                  ? 'View and manage your assigned deliveries'
                  : 'Track and manage restaurant orders'
                }
              </p>
            </div>
            {user?.role === 'restaurant_manager' && (
              <Link 
                to="/orders/new" 
                className="bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create Order</span>
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Orders
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                    placeholder="Search by order ID, customer..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    handleFilterChange('sortBy', sortBy);
                    handleFilterChange('sortOrder', sortOrder);
                  }}
                >
                  {sortOptions.map(option => (
                    <option key={`${option.value}-${option.order}`} value={`${option.value}-${option.order}`}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Results per page */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Results per page
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                  value={filters.limit}
                  onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Dispatch Time
                  </th>
                  {user?.role === 'restaurant_manager' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Delivery Partner
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900 dark:to-accent-900 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-primary-600 dark:text-primary-400 font-medium text-xs">
                            #{order._id.slice(-4).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          #{order._id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{order.customerName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{order.customerPhone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(order.orderPlacedAt || order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {calculateDispatchTime(order)}
                    </td>
                    {user?.role === 'restaurant_manager' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.deliveryPartner ? (
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {order.deliveryPartner.firstName} {order.deliveryPartner.lastName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{order.deliveryPartner.phone}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">Not assigned</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-2">
                        {/* Status Update Actions */}
                        {getNextStatus(order.status) && (
                          <button
                            onClick={() => updateOrderStatus(order._id, getNextStatus(order.status))}
                            className="inline-flex items-center px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-md transition-colors"
                          >
                            <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Mark {getNextStatus(order.status).replace('_', ' ')}
                          </button>
                        )}

                        {/* Delivery Partner Assignment (Restaurant Manager Only) */}
                        {user?.role === 'restaurant_manager' && 
                         order.status === 'READY' && 
                         !order.deliveryPartner && 
                         availablePartners.length > 0 && (
                          <div className="relative">
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  assignPartner(order._id, e.target.value);
                                }
                              }}
                              disabled={assigningOrder === order._id}
                              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                            >
                              <option value="">
                                {assigningOrder === order._id ? 'Assigning...' : 'Assign Partner'}
                              </option>
                              {availablePartners.map(partner => (
                                <option key={partner._id} value={partner._id}>
                                  {partner.firstName} {partner.lastName} ({partner.vehicleType})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* View Details */}
                        <Link
                          to={`/orders/${order._id}`}
                          className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-md transition-colors"
                        >
                          <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Details
                        </Link>

                        {/* Cancel Order (Restaurant Manager Only) */}
                        {user?.role === 'restaurant_manager' && 
                         ['PENDING', 'PREP'].includes(order.status) && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'CANCELLED')}
                            className="inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors"
                          >
                            <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {orders.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="h-16 w-16 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No orders found</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {filters.search || filters.status 
                    ? 'Try adjusting your filters to see more results'
                    : 'No orders have been created yet'
                  }
                </p>
                {user?.role === 'restaurant_manager' && !filters.search && !filters.status && (
                  <Link
                    to="/orders/new"
                    className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Your First Order
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {((pagination.currentPage - 1) * filters.limit) + 1} to{' '}
                  {Math.min(pagination.currentPage * filters.limit, pagination.totalOrders)} of{' '}
                  {pagination.totalOrders} orders
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = pagination.currentPage <= 3 
                      ? i + 1 
                      : pagination.currentPage + i - 2;
                    if (pageNum > pagination.totalPages || pageNum < 1) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          pageNum === pagination.currentPage
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderList; 