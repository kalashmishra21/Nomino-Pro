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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link to="/orders" className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 mb-4 inline-flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Orders
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Order Details</h1>
        <p className="text-gray-600 dark:text-gray-400">Order #{order.orderId || order._id.slice(-6).toUpperCase()}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Order Tracker - Takes full width on mobile, 2/3 on desktop */}
        <div className="xl:col-span-2">
          <OrderTracker order={order} />
        </div>

        {/* Order Information Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                <span className={`status-badge status-${order.status.toLowerCase()}`}>
                  {order.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Amount:</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Prep Time:</span>
                <span className="font-medium text-gray-900 dark:text-white">{order.prepTime} mins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Priority:</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  order.priority === 'HIGH' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                  order.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                }`}>
                  {order.priority}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Order Date:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(order.orderPlacedAt || order.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Customer Information</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Name:</span>
                <p className="font-medium text-gray-900 dark:text-white">{order.customerName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Phone:</span>
                <p className="font-medium text-gray-900 dark:text-white">{order.customerPhone}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Address:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {order.customerAddress?.street}, {order.customerAddress?.city} - {order.customerAddress?.pincode}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Partner Information */}
          {order.deliveryPartner && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Delivery Partner</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Name:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {order.deliveryPartner.firstName} {order.deliveryPartner.lastName}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Phone:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{order.deliveryPartner.phone}</p>
                </div>
                {order.deliveryPartner.vehicleType && (
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Vehicle:</span>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">{order.deliveryPartner.vehicleType}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Items */}
      {order.items && order.items.length > 0 && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Order Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {order.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{item.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{formatCurrency(item.price)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(item.price * item.quantity)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white text-right">
                    Total Amount:
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                    {formatCurrency(order.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Tracking Notes */}
      {order.trackingNotes && order.trackingNotes.length > 0 && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Tracking Notes</h2>
          <div className="space-y-4">
            {order.trackingNotes.map((note, index) => (
              <div key={index} className="border-l-4 border-primary-500 pl-4">
                <p className="text-sm text-gray-900 dark:text-white">{note.note}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatDate(note.timestamp)} - {note.addedBy?.firstName} {note.addedBy?.lastName}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails; 