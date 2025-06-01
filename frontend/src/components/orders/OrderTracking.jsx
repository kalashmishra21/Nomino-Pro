import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';
import { useSocket } from '../../contexts/SocketContext';
import OrderTracker from './OrderTracker';

const OrderTracking = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deliveryPartner, setDeliveryPartner] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const { error: showError } = useToast();
  const { subscribeToOrderUpdates, isConnected } = useSocket();

  useEffect(() => {
    fetchOrderDetails();
    
    // Subscribe to real-time order updates
    const unsubscribe = subscribeToOrderUpdates((data) => {
      if (data.order._id === orderId || data.order.orderId === orderId) {
        setOrder(prevOrder => ({
          ...prevOrder,
          ...data.order,
          status: data.status || data.order.status
        }));
        
        // Update estimated delivery time based on status
        updateEstimatedTime(data.status || data.order.status);
      }
    });

    return unsubscribe;
  }, [orderId, subscribeToOrderUpdates]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/orders/${orderId}`);
      const orderData = response.data.data.order;
      setOrder(orderData);
      
      if (orderData.deliveryPartner) {
        setDeliveryPartner(orderData.deliveryPartner);
      }
      
      updateEstimatedTime(orderData.status);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      showError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const updateEstimatedTime = (status) => {
    const now = new Date();
    let estimatedMinutes = 0;
    
    switch (status) {
      case 'PENDING':
        estimatedMinutes = 45; // 45 minutes total
        break;
      case 'PREP':
        estimatedMinutes = 35; // 35 minutes remaining
        break;
      case 'READY':
        estimatedMinutes = 25; // 25 minutes remaining
        break;
      case 'PICKED':
        estimatedMinutes = 20; // 20 minutes remaining
        break;
      case 'ON_ROUTE':
        estimatedMinutes = 10; // 10 minutes remaining
        break;
      case 'DELIVERED':
        estimatedMinutes = 0; // Delivered
        break;
      default:
        estimatedMinutes = 30;
    }
    
    if (estimatedMinutes > 0) {
      const estimatedDelivery = new Date(now.getTime() + estimatedMinutes * 60000);
      setEstimatedTime(estimatedDelivery);
    } else {
      setEstimatedTime(null);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'text-yellow-600 bg-yellow-100',
      PREP: 'text-blue-600 bg-blue-100',
      READY: 'text-purple-600 bg-purple-100',
      PICKED: 'text-indigo-600 bg-indigo-100',
      ON_ROUTE: 'text-orange-600 bg-orange-100',
      DELIVERED: 'text-green-600 bg-green-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const getStatusMessage = (status) => {
    const messages = {
      PENDING: 'Order received and being processed',
      PREP: 'Your order is being prepared',
      READY: 'Order is ready for pickup',
      PICKED: 'Order picked up by delivery partner',
      ON_ROUTE: 'Order is on the way to you',
      DELIVERED: 'Order has been delivered'
    };
    return messages[status] || 'Processing your order';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Order Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The order you're looking for doesn't exist or has been removed.</p>
          <Link to="/orders" className="btn-primary">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Track Order #{order._id.slice(-6).toUpperCase()}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Real-time tracking for your order
              </p>
            </div>
            
            {/* Real-time Status Indicator */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-sm font-medium ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isConnected ? 'Live Tracking' : 'Offline'}
                </span>
              </div>
              
              <Link to="/orders" className="btn-secondary">
                Back to Orders
              </Link>
            </div>
          </div>
        </div>

        {/* Order Status Card */}
        <div className="card mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Order Status</h2>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status.replace('_', ' ')}
                </div>
              </div>
              
              {estimatedTime && (
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Delivery</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatTime(estimatedTime)}
                  </p>
                </div>
              )}
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {getStatusMessage(order.status)}
            </p>
            
            {/* Order Tracker Component */}
            <OrderTracker order={order} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <div className="card">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Details</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Order ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">#{order._id.slice(-6).toUpperCase()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Customer</span>
                  <span className="font-medium text-gray-900 dark:text-white">{order.customerName}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Phone</span>
                  <span className="font-medium text-gray-900 dark:text-white">{order.customerPhone}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Amount</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(order.totalAmount)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Order Placed</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(order.orderPlacedAt || order.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              {order.items && order.items.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Order Items</h4>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Partner Info */}
          <div className="card">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Delivery Information</h3>
              
              {deliveryPartner ? (
                <div className="space-y-6">
                  {/* Partner Profile Section */}
                  <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-primary-100 dark:border-primary-800">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="h-16 w-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">
                            {deliveryPartner.firstName[0]}{deliveryPartner.lastName[0]}
                          </span>
                        </div>
                        {/* Online Status Indicator */}
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center">
                          <div className="h-2 w-2 bg-white rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {deliveryPartner.firstName} {deliveryPartner.lastName}
                        </h4>
                        <p className="text-primary-600 dark:text-primary-400 font-medium text-sm">
                          Delivery Partner
                        </p>
                        <div className="flex items-center space-x-1 mt-1">
                          <svg className="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {deliveryPartner.rating?.toFixed(1) || 'New'} Rating
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contact Information Grid */}
                  <div className="grid grid-cols-1 gap-4">
                    {/* Phone Number */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                            <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Phone Number</p>
                            <p className="font-semibold text-gray-900 dark:text-white text-lg">
                              {deliveryPartner.phone}
                            </p>
                          </div>
                        </div>
                        <div className="text-green-600 dark:text-green-400">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Vehicle Information */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                          <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Vehicle Type</p>
                          <p className="font-semibold text-gray-900 dark:text-white capitalize">
                            {deliveryPartner.vehicleType}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Call Button */}
                  <div className="pt-2">
                    <a
                      href={`tel:${deliveryPartner.phone}`}
                      className="group relative w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-3"
                    >
                      {/* Phone Icon with Animation */}
                      <div className="relative">
                        <svg className="h-6 w-6 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {/* Ripple Effect */}
                        <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 group-hover:animate-ping"></div>
                      </div>
                      
                      <div className="text-center">
                        <span className="text-lg font-bold">Call Delivery Partner</span>
                        <p className="text-green-100 text-sm font-normal">
                          Tap to call {deliveryPartner.firstName}
                        </p>
                      </div>
                      
                      {/* Arrow Icon */}
                      <svg className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      
                      {/* Shine Effect */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 group-hover:animate-pulse"></div>
                    </a>
                    
                    {/* Additional Contact Options */}
                    <div className="mt-3 flex space-x-2">
                      <button className="flex-1 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="text-sm">Message</span>
                      </button>
                      
                      <button className="flex-1 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm">Track</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="relative mx-auto mb-6">
                    <div className="h-20 w-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full mx-auto flex items-center justify-center">
                      <svg className="h-10 w-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    {/* Loading Animation */}
                    <div className="absolute inset-0 rounded-full border-2 border-primary-200 border-t-primary-500 animate-spin"></div>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Assigning Delivery Partner
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
                    We're finding the best delivery partner for your order. You'll be notified once assigned.
                  </p>
                  <div className="mt-4 flex justify-center">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 bg-primary-500 rounded-full animate-bounce"></div>
                      <div className="h-2 w-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="h-2 w-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="card mt-8">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Delivery Address</h3>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-gray-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-900 dark:text-white font-medium">
                  {order.deliveryAddress || 'Address not provided'}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Delivery location for this order
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking; 