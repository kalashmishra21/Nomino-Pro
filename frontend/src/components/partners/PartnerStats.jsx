import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';
import { useSocket } from '../../contexts/SocketContext';

const PartnerStats = () => {
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    totalEarnings: 0,
    averageRating: 0,
    averageDeliveryTime: 0,
    successRate: 0,
    totalAssigned: 0
  });
  const [trendData, setTrendData] = useState([]);
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const { error: showError } = useToast();
  const { subscribeToOrderUpdates, isConnected } = useSocket();

  useEffect(() => {
    fetchPartnerStats();
    fetchRecentOrders();
    
    // Reduced polling interval since we have WebSocket updates
    const interval = setInterval(() => {
      fetchPartnerStats();
      fetchRecentOrders();
    }, 60000); // 1 minute
    
    return () => clearInterval(interval);
  }, [period]);

  // Subscribe to real-time order updates
  useEffect(() => {
    const unsubscribe = subscribeToOrderUpdates((data) => {
      console.log('📊 Partner Stats: Order update received', data);
      // Refresh stats when orders are updated
      fetchPartnerStats();
      fetchRecentOrders();
    });

    return unsubscribe;
  }, [subscribeToOrderUpdates]);

  const fetchPartnerStats = async () => {
    try {
      const response = await axios.get(`/api/partners/my/stats?period=${period}`);
      setStats(response.data.data.stats);
      setTrendData(response.data.data.trend || []);
    } catch (error) {
      console.error('Failed to fetch partner stats:', error);
      showError('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const response = await axios.get('/api/orders?limit=10&sortBy=orderPlacedAt&sortOrder=desc');
      setRecentOrders(response.data.data.orders);
    } catch (error) {
      console.error('Failed to fetch recent orders:', error);
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
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const calculateCommission = (totalAmount) => {
    return totalAmount * 0.1; // 10% commission
  };

  const getTotalCommission = () => {
    return calculateCommission(stats.totalEarnings);
  };

  const getPerformanceRating = () => {
    const rating = stats.averageRating || 0;
    if (!rating || rating === 0) return { text: 'New', color: 'text-gray-600', bg: 'bg-gray-100' };
    if (rating >= 4.5) return { text: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (rating >= 4.0) return { text: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (rating >= 3.5) return { text: 'Average', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const getDeliveryTimeRating = () => {
    const avgTime = stats.averageDeliveryTime || 0;
    if (avgTime <= 20) return { text: 'Fast', color: 'text-green-600', bg: 'bg-green-100' };
    if (avgTime <= 30) return { text: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (avgTime <= 45) return { text: 'Average', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: 'Slow', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const renderTrendChart = () => {
    if (!trendData.length) return null;

    const maxDeliveries = Math.max(...trendData.map(d => d.count));
    const maxEarnings = Math.max(...trendData.map(d => d.earnings));

    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Last 7 Days Trend</h4>
        <div className="space-y-3">
          {trendData.map((day, index) => (
            <div key={day._id} className="flex items-center space-x-4">
              <div className="w-16 text-xs text-gray-600 dark:text-gray-400">
                {new Date(day._id).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-20 text-xs text-gray-600 dark:text-gray-400">Deliveries:</div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(day.count / maxDeliveries) * 100}%` }}
                    ></div>
                  </div>
                  <div className="w-8 text-xs font-medium text-gray-900 dark:text-white">{day.count}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 text-xs text-gray-600 dark:text-gray-400">Earnings:</div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(day.earnings / maxEarnings) * 100}%` }}
                    ></div>
                  </div>
                  <div className="w-16 text-xs font-medium text-gray-900 dark:text-white">
                    {formatCurrency(calculateCommission(day.earnings))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  const performanceRating = getPerformanceRating();
  const deliveryTimeRating = getDeliveryTimeRating();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Statistics</h1>
            <p className="text-gray-600 dark:text-gray-400">Track your delivery performance and earnings</p>
          </div>
          
          {/* Real-time Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`text-sm font-medium ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isConnected ? 'Live Updates' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Period Filter */}
        <div className="mt-6">
          <div className="flex space-x-2">
            {[
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' },
              { value: 'all', label: 'All Time' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  period === option.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Deliveries */}
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-lg">
              <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Deliveries</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDeliveries}</p>
            </div>
          </div>
        </div>

        {/* Total Earnings (Commission) */}
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(getTotalCommission())}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">10% commission</p>
            </div>
          </div>
        </div>

        {/* Average Rating */}
        <div className="card p-6">
          <div className="flex items-center">
            <div className={`p-3 ${performanceRating.bg} rounded-lg`}>
              <svg className={`h-6 w-6 ${performanceRating.color}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.averageRating && stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'New'}
              </p>
              <p className={`text-xs font-medium ${performanceRating.color}`}>
                {stats.averageRating && stats.averageRating > 0 ? performanceRating.text : 'No ratings yet'}
              </p>
              {stats.totalRatedOrders && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Based on {stats.totalRatedOrders} rating{stats.totalRatedOrders !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Average Delivery Time */}
        <div className="card p-6">
          <div className="flex items-center">
            <div className={`p-3 ${deliveryTimeRating.bg} rounded-lg`}>
              <svg className={`h-6 w-6 ${deliveryTimeRating.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Delivery Time</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.averageDeliveryTime ? `${Math.round(stats.averageDeliveryTime)}m` : 'N/A'}
              </p>
              <p className={`text-xs font-medium ${deliveryTimeRating.color}`}>{deliveryTimeRating.text}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Trend */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Trend</h3>
            {trendData.length > 0 ? (
              renderTrendChart()
            ) : (
              <div className="text-center py-8">
                <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">No trend data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        #{order._id.slice(-6).toUpperCase()}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(calculateCommission(order.totalAmount))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div>
                          <p>{formatDate(order.orderPlacedAt || order.createdAt)}</p>
                          <p>{formatTime(order.orderPlacedAt || order.createdAt)}</p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentOrders.length === 0 && (
                <div className="text-center py-8">
                  <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">No orders found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="mt-8">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${performanceRating.bg} ${performanceRating.color}`}>
                Customer Rating: {stats.averageRating && stats.averageRating > 0 ? performanceRating.text : 'New Partner'}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {stats.averageRating && stats.averageRating > 0 ? (
                  stats.averageRating >= 4.5 ? 'Keep up the excellent work!' : 
                  stats.averageRating >= 4.0 ? 'Good performance, aim for 4.5+' :
                  'Focus on improving customer satisfaction'
                ) : 'Complete deliveries to get customer ratings'}
              </p>
            </div>
            
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${deliveryTimeRating.bg} ${deliveryTimeRating.color}`}>
                Delivery Speed: {deliveryTimeRating.text}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {stats.averageDeliveryTime <= 20 ? 'Excellent delivery speed!' :
                 stats.averageDeliveryTime <= 30 ? 'Good timing, try to be faster' :
                 'Focus on reducing delivery time'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                Total Earnings: {formatCurrency(getTotalCommission())}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Complete more deliveries to increase earnings
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerStats; 