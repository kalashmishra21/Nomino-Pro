import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const DeliveryDashboard = () => {
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    pendingPickups: 0,
    activeDeliveries: 0,
    completedToday: 0,
    earnings: 0,
    totalEarnings: 0,
    rating: 0,
    averageRating: 0,
    averageDeliveryTime: 0,
    successRate: 0,
    totalAssigned: 0
  });
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const { error: showError, success } = useToast();
  const { user, updateUser } = useAuth();
  const { subscribeToOrderUpdates, emitPartnerAvailability, isConnected } = useSocket();

  useEffect(() => {
    fetchDashboardData();
    // Reduced polling interval since we have WebSocket updates
    const interval = setInterval(fetchDashboardData, 60000); // 1 minute instead of 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      setIsAvailable(user.isAvailable || false);
    }
  }, [user]);

  // Subscribe to real-time order updates
  useEffect(() => {
    const unsubscribe = subscribeToOrderUpdates((data) => {
      console.log('🚚 Delivery Dashboard: Order update received', data);
      // Refresh dashboard data when orders are updated
      fetchDashboardData();
    });

    return unsubscribe;
  }, [subscribeToOrderUpdates]);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, ordersResponse] = await Promise.all([
        axios.get('/api/orders/stats'),
        axios.get('/api/orders?limit=10&sortBy=orderPlacedAt&sortOrder=desc')
      ]);

      setStats(statsResponse.data.data);
      // Filter orders assigned to current user
      const userOrders = ordersResponse.data.data.orders.filter(order => 
        order.deliveryPartner && order.deliveryPartner._id === user._id
      );
      setAssignedOrders(userOrders);
    } catch (error) {
      showError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    try {
      const newAvailability = !isAvailable;
      await axios.put('/api/partners/availability', { isAvailable: newAvailability });
      setIsAvailable(newAvailability);
      await updateUser({ isAvailable: newAvailability });
      
      // Emit real-time availability update
      emitPartnerAvailability({
        partnerId: user._id,
        isAvailable: newAvailability
      });
      
      success(`You are now ${newAvailability ? 'available' : 'unavailable'} for deliveries`);
    } catch (error) {
      showError('Failed to update availability');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`/api/orders/${orderId}/status`, { status });
      success(`Order status updated to ${status.replace('_', ' ')}`);
      // WebSocket will handle real-time updates, but also refresh for immediate feedback
      fetchDashboardData();
    } catch (error) {
      showError('Failed to update order status');
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      PENDING: 'status-badge status-pending',
      PREP: 'status-badge status-prep',
      READY: 'status-badge status-ready',
      PICKED: 'status-badge status-picked',
      ON_ROUTE: 'status-badge status-on-route',
      DELIVERED: 'status-badge status-delivered',
      CANCELLED: 'status-badge status-cancelled'
    };
    
    return (
      <span className={statusClasses[status] || 'status-badge status-pending'}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      READY: 'PICKED',
      PICKED: 'ON_ROUTE',
      ON_ROUTE: 'DELIVERED'
    };
    return statusFlow[currentStatus];
  };

  const formatCurrency = (amount) => {
    // Handle NaN, null, undefined, or invalid numbers
    const validAmount = isNaN(amount) || amount == null ? 0 : Number(amount);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(validAmount);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Delivery Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your deliveries and track your performance</p>
          </div>
          
          {/* Real-time Status and Availability Toggle */}
          <div className="flex items-center space-x-6">
            {/* Real-time Status Indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm font-medium ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {isConnected ? 'Live Updates' : 'Offline'}
              </span>
            </div>
            
            {/* Availability Toggle */}
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Available for delivery</span>
              <button
                onClick={toggleAvailability}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  isAvailable 
                    ? 'bg-success-600 text-white hover:bg-success-700' 
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                }`}
              >
                {isAvailable ? 'Available' : 'Unavailable'}
              </button>
              <div className={`h-3 w-3 rounded-full ${isAvailable ? 'bg-success-500' : 'bg-gray-400'}`}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0v10l-8 4-8-4V7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Deliveries</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDeliveries}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-warning-100 dark:bg-warning-900 rounded-lg">
              <svg className="h-6 w-6 text-warning-600 dark:text-warning-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Pickups</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingPickups}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Deliveries</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeDeliveries}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-success-100 dark:bg-success-900 rounded-lg">
              <svg className="h-6 w-6 text-success-600 dark:text-success-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed Today</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedToday}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <svg className="h-6 w-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Today's Earnings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.earnings || 0)}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Rating</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rating?.toFixed(1) || 'New'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Performance Overview</h3>
              <p className="text-gray-600 dark:text-gray-400">View detailed analytics and earnings breakdown</p>
            </div>
            <Link 
              to="/my-stats" 
              className="btn-primary inline-flex items-center"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Detailed Statistics
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Assigned Orders */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Your Assigned Orders</h2>
                <Link to="/orders" className="btn-primary text-sm">
                  View All Orders
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {assignedOrders.length > 0 ? (
                assignedOrders.map((order) => (
                  <div key={order._id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <span className="text-primary-600 font-medium text-sm">
                            #{order._id.slice(-4).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Order #{order._id.slice(-6).toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.customerName} • {formatTime(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Pickup Address</p>
                        <p className="text-sm text-gray-600">Restaurant Address</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Delivery Address</p>
                        <p className="text-sm text-gray-600">{order.customerAddress?.street}, {order.customerAddress?.city} - {order.customerAddress?.pincode}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">
                          Total: <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
                        </span>
                        <span className="text-sm text-gray-600">
                          Phone: <span className="font-medium">{order.customerPhone}</span>
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        {getNextStatus(order.status) && (
                          <button
                            onClick={() => updateOrderStatus(order._id, getNextStatus(order.status))}
                            className="btn-primary text-sm"
                          >
                            Mark {getNextStatus(order.status)}
                          </button>
                        )}
                        <Link
                          to={`/orders/${order._id}/track`}
                          className="btn-secondary text-sm"
                        >
                          Track
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="h-12 w-12 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0v10l-8 4-8-4V7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders assigned</h3>
                  <p className="text-gray-500">
                    {isAvailable 
                      ? 'You\'ll receive orders when they become available' 
                      : 'Turn on availability to receive orders'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Performance Summary</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Success Rate</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {stats.successRate ? `${stats.successRate.toFixed(1)}%` : '0%'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Average Rating</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ⭐ {stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(stats.totalEarnings || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg Delivery Time</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {stats.averageDeliveryTime ? `${stats.averageDeliveryTime}m` : 'N/A'}
                </span>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Orders Assigned</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.totalAssigned || 0}</span>
                </div>
              </div>

              <div className="pt-2">
                <Link 
                  to="/my-stats" 
                  className="w-full btn-secondary text-center"
                >
                  View Detailed Analytics
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard; 