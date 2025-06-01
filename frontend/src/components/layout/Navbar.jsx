import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSocket } from '../../contexts/SocketContext';
import axios from 'axios';

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const { success } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { isConnected } = useSocket();
  const navigate = useNavigate();

  // Refs for dropdown elements
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch notifications on component mount and set up polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  const fetchNotifications = async () => {
    try {
      if (!user) return;
      
      // Simulate real-time notifications based on recent activities
      const [ordersResponse, partnersResponse] = await Promise.all([
        axios.get('/api/orders?limit=5&sortBy=orderPlacedAt&sortOrder=desc'),
        user?.role === 'restaurant_manager' ? axios.get('/api/auth/available-partners') : Promise.resolve({ data: { data: { partners: [] } } })
      ]);

      const recentOrders = ordersResponse.data.data.orders || [];
      const availablePartners = partnersResponse.data.data?.partners || [];
      
      const newNotifications = [];
      const now = new Date();
      
      // Generate role-specific notifications for recent orders
      recentOrders.forEach(order => {
        const orderTime = new Date(order.orderPlacedAt || order.createdAt);
        const timeDiff = (now - orderTime) / (1000 * 60); // minutes
        
        if (timeDiff < 60) { // Orders from last hour
          // Restaurant Manager Notifications
          if (user.role === 'restaurant_manager') {
            if (order.status === 'DELIVERED') {
              newNotifications.push({
                id: `delivered-${order._id}`,
                type: 'success',
                title: 'Order Delivered',
                message: `Order #${order._id.slice(-6).toUpperCase()} has been delivered to ${order.customerName}`,
                time: orderTime,
                icon: 'delivered'
              });
            } else if (order.status === 'PENDING') {
              newNotifications.push({
                id: `new-order-${order._id}`,
                type: 'info',
                title: 'New Order Received',
                message: `Order #${order._id.slice(-6).toUpperCase()} from ${order.customerName} - ₹${order.totalAmount}`,
                time: orderTime,
                icon: 'order'
              });
            } else if (order.status === 'PREP') {
              newNotifications.push({
                id: `prep-${order._id}`,
                type: 'info',
                title: 'Order in Preparation',
                message: `Order #${order._id.slice(-6).toUpperCase()} is being prepared`,
                time: orderTime,
                icon: 'order'
              });
            }
          }
          
          // Delivery Partner Notifications (only for assigned orders)
          if (user.role === 'delivery_partner') {
            // Only show notifications for orders assigned to this partner
            if (order.deliveryPartner && order.deliveryPartner._id === user._id) {
              if (order.status === 'READY') {
                newNotifications.push({
                  id: `ready-${order._id}`,
                  type: 'warning',
                  title: 'Order Ready for Pickup',
                  message: `Order #${order._id.slice(-6).toUpperCase()} is ready for delivery`,
                  time: orderTime,
                  icon: 'ready'
                });
              } else if (order.status === 'PICKED') {
                newNotifications.push({
                  id: `picked-${order._id}`,
                  type: 'info',
                  title: 'Order Picked Up',
                  message: `You picked up order #${order._id.slice(-6).toUpperCase()}`,
                  time: orderTime,
                  icon: 'delivery'
                });
              } else if (order.status === 'DELIVERED') {
                newNotifications.push({
                  id: `delivered-partner-${order._id}`,
                  type: 'success',
                  title: 'Order Delivered Successfully',
                  message: `You delivered order #${order._id.slice(-6).toUpperCase()} - Earned ₹${Math.round(order.totalAmount * 0.1)}`,
                  time: orderTime,
                  icon: 'success'
                });
              }
              
              // New order assignment notification
              if (order.status === 'PREP' && timeDiff < 30) { // Recently assigned
                newNotifications.push({
                  id: `assigned-${order._id}`,
                  type: 'info',
                  title: 'New Order Assigned',
                  message: `Order #${order._id.slice(-6).toUpperCase()} assigned to you - ₹${order.totalAmount}`,
                  time: orderTime,
                  icon: 'order'
                });
              }
            }
          }
        }
      });

      // Generate notifications for partner status (only for restaurant managers)
      if (user?.role === 'restaurant_manager') {
        availablePartners.forEach(partner => {
          newNotifications.push({
            id: `partner-active-${partner._id}`,
            type: 'success',
            title: 'Delivery Partner Active',
            message: `${partner.firstName} ${partner.lastName} is now available for deliveries`,
            time: new Date(Date.now() - Math.random() * 30 * 60 * 1000), // Random time in last 30 mins
            icon: 'partner'
          });
        });
      }

      // Sort by time (newest first) and limit to 10
      const sortedNotifications = newNotifications
        .sort((a, b) => b.time - a.time)
        .slice(0, 10);

      setNotifications(sortedNotifications);
      setUnreadCount(sortedNotifications.length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    success('Logged out successfully');
    navigate('/login');
  };

  const markAsRead = () => {
    setUnreadCount(0);
  };

  const getNotificationIcon = (type) => {
    const iconClass = "h-4 w-4";
    
    switch (type) {
      case 'order':
        return (
          <svg className={`${iconClass} text-primary-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'delivery':
        return (
          <svg className={`${iconClass} text-accent-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'success':
        return (
          <svg className={`${iconClass} text-success-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={`${iconClass} text-warning-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'error':
        return (
          <svg className={`${iconClass} text-red-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className={`${iconClass} text-gray-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.97 4.97a.235.235 0 0 0-.02 0 .327.327 0 0 0-.02.022L6.477 9.417a.25.25 0 0 1-.17.073H2a.25.25 0 0 1-.25-.25V6.25C1.75 5.56 2.31 5 3 5h.25V4a1 1 0 0 1 2 0v1h.25c.69 0 1.25.56 1.25 1.25v2.99l3.72-3.72a.75.75 0 0 1 1.06 1.06l-1.06 1.06.72.72a.75.75 0 0 1-1.06 1.06l-.72-.72-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06-.72-.72a.75.75 0 0 1 1.06-1.06l.72.72 1.06-1.06a.75.75 0 0 1 1.06 1.06z" />
          </svg>
        );
    }
  };

  const formatNotificationTime = (time) => {
    const now = new Date();
    const diff = (now - time) / (1000 * 60); // minutes
    
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${Math.floor(diff)}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getRoleDisplayName = (role) => {
    return role === 'restaurant_manager' ? 'Restaurant Manager' : 'Delivery Partner';
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end h-16">
          {/* Right side - WebSocket Status, Notifications, Theme toggle, and User profile */}
          <div className="flex items-center space-x-4">
            {/* WebSocket Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-xs font-medium ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) markAsRead();
                }}
                className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                title="Notifications"
              >
                {/* Bell Icon */}
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 4.74 13.6 5.39 13 5.73V7C16.86 7.5 20 10.9 20 15V16L22 18V19H2V18L4 16V15C4 10.9 7.14 7.5 11 7V5.73C10.4 5.39 10 4.74 10 4C10 2.9 10.9 2 12 2ZM12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22Z"/>
                </svg>
                
                {/* Notification Count Badge */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-800 transform animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                
                {/* Active indicator dot when notifications are open */}
                {showNotifications && (
                  <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full"></span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-80 overflow-y-auto">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {notifications.length > 0 ? (
                      notifications.slice(0, 5).map((notification) => (
                        <div key={notification.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <div className="flex items-start space-x-2">
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="w-4 h-4">
                                {getNotificationIcon(notification.icon)}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 dark:text-white leading-tight">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-tight">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {formatNotificationTime(notification.time)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center">
                        <svg className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C13.1 2 14 2.9 14 4C14 4.74 13.6 5.39 13 5.73V7C16.86 7.5 20 10.9 20 15V16L22 18V19H2V18L4 16V15C4 10.9 7.14 7.5 11 7V5.73C10.4 5.39 10 4.74 10 4C10 2.9 10.9 2 12 2ZM12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22Z"/>
                        </svg>
                        <p className="text-xs text-gray-500 dark:text-gray-400">No notifications yet</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">You'll receive updates about orders here</p>
                      </div>
                    )}
                    {notifications.length > 5 && (
                      <div className="p-2 text-center border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          +{notifications.length - 5} more notifications
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                // Moon icon for dark mode
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                // Sun icon for light mode
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>

            {/* User Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {/* User Avatar */}
                <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-xs">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
                
                {/* User Info */}
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user ? `${user.firstName} ${user.lastName}` : 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user ? getRoleDisplayName(user.role) : 'User'}
                  </p>
                </div>

                {/* Dropdown Arrow */}
                <svg className={`h-4 w-4 text-gray-400 dark:text-gray-300 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user ? `${user.firstName} ${user.lastName}` : 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.email}
                    </p>
                  </div>

                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <svg className="h-4 w-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile Settings
                  </Link>

                  {user?.role === 'delivery_partner' && (
                    <Link
                      to="/my-stats"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <svg className="h-4 w-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      My Statistics
                    </Link>
                  )}

                  <div className="border-t border-gray-100 dark:border-gray-700 mt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <svg className="h-4 w-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 