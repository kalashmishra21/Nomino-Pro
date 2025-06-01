import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import OrderTracker from './OrderTracker';

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { error: showError } = useToast();
  const { user } = useAuth();
  const { subscribeToOrderUpdates } = useSocket();

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  // Subscribe to real-time order updates
  useEffect(() => {
    if (order) {
      const unsubscribe = subscribeToOrderUpdates((data) => {
        // Update order if it matches current order
        if (data.orderId === order._id) {
          setOrder(prevOrder => ({
            ...prevOrder,
            ...data.order,
            status: data.status
          }));
        }
      });

      return unsubscribe;
    }
  }, [order, subscribeToOrderUpdates]);

  const fetchOrderDetails = async () => {
    try {
      const response = await axios.get(`/api/orders/${id}`);
      setOrder(response.data.data.order);
    } catch (error) {
      showError('Failed to fetch order details');
    } finally {
      setLoading(false);
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
    return new Date(dateString).toLocaleString('en-IN', {
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
        return `${hours}h ${minutes}m (Actual)`;
      }
      return `${minutes} min (Actual)`;
    }
    
    // If order is on route, show time since order placed
    if (order.status === 'ON_ROUTE' && order.onRouteAt) {
      const orderTime = new Date(order.orderPlacedAt || order.createdAt);
      const onRouteTime = new Date(order.onRouteAt);
      const elapsedMinutes = Math.floor((onRouteTime - orderTime) / (1000 * 60));
      
      const hours = Math.floor(elapsedMinutes / 60);
      const minutes = elapsedMinutes % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m (In Transit)`;
      }
      return `${minutes} min (In Transit)`;
    }
    
    // If order is picked up, show time since order placed
    if (order.status === 'PICKED' && order.pickedAt) {
      const orderTime = new Date(order.orderPlacedAt || order.createdAt);
      const pickedTime = new Date(order.pickedAt);
      const elapsedMinutes = Math.floor((pickedTime - orderTime) / (1000 * 60));
      
      const hours = Math.floor(elapsedMinutes / 60);
      const minutes = elapsedMinutes % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m (Picked)`;
      }
      return `${minutes} min (Picked)`;
    }
    
    // If order is ready, show time since order placed
    if (order.status === 'READY' && order.readyAt) {
      const orderTime = new Date(order.orderPlacedAt || order.createdAt);
      const readyTime = new Date(order.readyAt);
      const elapsedMinutes = Math.floor((readyTime - orderTime) / (1000 * 60));
      
      const hours = Math.floor(elapsedMinutes / 60);
      const minutes = elapsedMinutes % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m (Ready)`;
      }
      return `${minutes} min (Ready)`;
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
        return `${hours}h ${minutes}m (Est. Remaining)`;
      }
      return `${minutes} min (Est. Remaining)`;
    }
    
    // If order is pending, show estimated total time
    if (order.status === 'PENDING') {
      const totalMinutes = (order.prepTime || 30) + (order.estimatedDeliveryTime || 30);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m (Estimated)`;
      }
      return `${minutes} min (Estimated)`;
    }
    
    // If order is cancelled, show time until cancellation
    if (order.status === 'CANCELLED') {
      const orderTime = new Date(order.orderPlacedAt || order.createdAt);
      const cancelTime = new Date(order.cancelledAt || order.updatedAt);
      const elapsedMinutes = Math.floor((cancelTime - orderTime) / (1000 * 60));
      
      const hours = Math.floor(elapsedMinutes / 60);
      const minutes = elapsedMinutes % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m (Cancelled)`;
      }
      return `${minutes} min (Cancelled)`;
    }
    
    // Fallback to estimated time
    if (order.prepTime && order.estimatedDeliveryTime) {
      const totalMinutes = order.prepTime + order.estimatedDeliveryTime;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m (Est.)`;
      }
      return `${minutes} min (Est.)`;
    }
    
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Order Not Found</h2>
          <Link to="/orders" className="btn-primary">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link 
            to="/orders" 
            className="inline-flex items-center text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 mb-4 group transition-all duration-200"
          >
            <div className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors mr-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            <span className="font-medium">Back to Orders</span>
          </Link>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-1">
              Order Details
            </h1>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-gray-600 dark:text-gray-400">Order</span>
              <span className="px-2 py-1 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-full text-sm font-medium">
                #{order.orderId || order._id.slice(-6).toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Order Tracker - Enhanced */}
          <div className="xl:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-primary-600 p-4">
                <h2 className="text-xl font-bold text-white mb-1">Order Tracking</h2>
                <p className="text-primary-100 text-sm">Real-time status updates</p>
              </div>
              <div className="p-4">
                <OrderTracker order={order} />
              </div>
            </div>
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-4">
            {/* Order Summary - Enhanced */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-primary-600 p-3">
                <h2 className="text-lg font-bold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Order Summary
                </h2>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                    order.status === 'ON_ROUTE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                    order.status === 'PICKED' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                    order.status === 'READY' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300' :
                    order.status === 'PREP' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                  }`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</span>
                  <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(order.totalAmount)}</span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Prep Time</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{order.prepTime} mins</span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Priority</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                    order.priority === 'URGENT' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                    order.priority === 'HIGH' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                    order.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  }`}>
                    {order.priority}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Order Date</span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">{formatDate(order.orderPlacedAt || order.createdAt)}</span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-primary-50 dark:bg-primary-900 rounded-lg border border-primary-200 dark:border-primary-700">
                  <span className="text-sm font-medium text-primary-700 dark:text-primary-300">Dispatch Time</span>
                  <span className="font-bold text-primary-800 dark:text-primary-200">{calculateDispatchTime(order)}</span>
                </div>
              </div>
            </div>

            {/* Customer Information - Enhanced */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-primary-600 p-3">
                <h2 className="text-lg font-bold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Customer Information
                </h2>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">{order.customerName.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Name</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{order.customerName}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Phone</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{order.customerPhone}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Address</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm leading-relaxed">
                      {order.customerAddress?.street}<br/>
                      {order.customerAddress?.city} - {order.customerAddress?.pincode}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Partner Information - Enhanced */}
            {order.deliveryPartner && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-primary-600 p-3">
                  <h2 className="text-lg font-bold text-white flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Delivery Partner
                  </h2>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">
                        {order.deliveryPartner.firstName.charAt(0)}{order.deliveryPartner.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Name</p>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {order.deliveryPartner.firstName} {order.deliveryPartner.lastName}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Phone</p>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{order.deliveryPartner.phone}</p>
                    </div>
                  </div>
                  
                  {order.deliveryPartner.vehicleType && (
                    <div className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Vehicle</p>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm capitalize">{order.deliveryPartner.vehicleType}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Button - Only show Track Order for non-completed orders and non-delivery partners */}
            {order.status !== 'DELIVERED' && 
             order.status !== 'CANCELLED' && 
             user?.role !== 'delivery_partner' && (
              <div className="flex justify-center">
                <Link
                  to={`/orders/${order._id}/track`}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-center text-sm"
                >
                  Track Order
                </Link>
              </div>
            )}

            {/* Completion Message for Delivered Orders */}
            {order.status === 'DELIVERED' && (
              <div className="flex justify-center">
                <div className="w-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-green-800 dark:text-green-300 font-semibold text-sm">
                    Order Completed Successfully!
                  </p>
                  <p className="text-green-600 dark:text-green-400 text-xs mt-1">
                    Delivered on {formatDate(order.deliveredAt)}
                  </p>
                </div>
              </div>
            )}

            {/* Cancellation Message for Cancelled Orders */}
            {order.status === 'CANCELLED' && (
              <div className="flex justify-center">
                <div className="w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-red-800 dark:text-red-300 font-semibold text-sm">
                    Order Cancelled
                  </p>
                  <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                    This order has been cancelled
                  </p>
                </div>
              </div>
            )}

            {/* Info Message for Delivery Partners */}
            {user?.role === 'delivery_partner' && 
             order.status !== 'DELIVERED' && 
             order.status !== 'CANCELLED' && (
              <div className="flex justify-center">
                <div className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-blue-800 dark:text-blue-300 font-semibold text-sm">
                    Your Assigned Order
                  </p>
                  <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                    Update status as you progress with the delivery
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails; 