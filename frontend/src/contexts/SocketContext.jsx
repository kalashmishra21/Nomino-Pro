import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { user, token } = useAuth();
  const { success, info } = useToast();

  useEffect(() => {
    if (user && token) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('🔌 Connected to WebSocket server');
        setIsConnected(true);
        
        // Authenticate user with server
        newSocket.emit('authenticate', {
          userId: user._id,
          role: user.role,
          token: token
        });
        
        info('Real-time updates connected');
      });

      newSocket.on('disconnect', () => {
        console.log('🔌 Disconnected from WebSocket server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('🔌 WebSocket connection error:', error);
        setIsConnected(false);
      });

      // Order update events
      newSocket.on('order_updated', (data) => {
        console.log('📦 Order updated:', data);
        
        // Role-based notification logic
        const showNotificationToUser = () => {
          // Restaurant Manager notifications
          if (user.role === 'restaurant_manager') {
            if (data.eventType === 'order_created') {
              success(`New order #${data.order.orderId || data.order._id?.slice(-6).toUpperCase()} created`);
            } else if (data.eventType === 'partner_assigned') {
              success(`Delivery partner assigned to order #${data.order.orderId || data.order._id?.slice(-6).toUpperCase()}`);
            } else if (data.status === 'DELIVERED') {
              success(`Order #${data.order.orderId || data.order._id?.slice(-6).toUpperCase()} delivered successfully`);
            } else if (data.status === 'PICKED') {
              info(`Order #${data.order.orderId || data.order._id?.slice(-6).toUpperCase()} picked up by delivery partner`);
            } else if (data.status === 'ON_ROUTE') {
              info(`Order #${data.order.orderId || data.order._id?.slice(-6).toUpperCase()} is on route for delivery`);
            }
          }
          
          // Delivery Partner notifications (only for assigned orders)
          if (user.role === 'delivery_partner') {
            // Check if this order is assigned to current user
            const isAssignedToMe = data.deliveryPartnerId === user._id || 
                                 data.order.deliveryPartner === user._id ||
                                 (data.order.deliveryPartner && data.order.deliveryPartner._id === user._id);
            
            if (isAssignedToMe) {
              if (data.eventType === 'partner_assigned' || data.status === 'PREP') {
                success(`New order #${data.order.orderId || data.order._id?.slice(-6).toUpperCase()} assigned to you`);
              } else if (data.status === 'READY') {
                success(`Order #${data.order.orderId || data.order._id?.slice(-6).toUpperCase()} is ready for pickup`);
              } else if (data.status === 'DELIVERED') {
                const commission = Math.round((data.order.totalAmount || 0) * 0.1);
                success(`Order delivered successfully! Earned ₹${commission}`);
              }
            }
          }
        };

        showNotificationToUser();

        // Trigger custom event for components to listen
        window.dispatchEvent(new CustomEvent('orderUpdated', { detail: data }));
      });

      // Partner availability events
      newSocket.on('partner_availability_updated', (data) => {
        console.log('🚴 Partner availability updated:', data);
        
        // Trigger custom event for components to listen
        window.dispatchEvent(new CustomEvent('partnerAvailabilityUpdated', { detail: data }));
      });

      // Real-time notifications
      newSocket.on('notification', (data) => {
        console.log('🔔 Real-time notification:', data);
        
        if (data.type === 'success') {
          success(data.message);
        } else if (data.type === 'info') {
          info(data.message);
        }
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [user, token, success, info]);

  // Socket event emitters
  const emitOrderUpdate = (orderData) => {
    if (socket && isConnected) {
      socket.emit('order_update', orderData);
    }
  };

  const emitPartnerAvailability = (availabilityData) => {
    if (socket && isConnected) {
      socket.emit('partner_availability', availabilityData);
    }
  };

  const joinRoom = (roomName) => {
    if (socket && isConnected) {
      socket.emit('join_room', roomName);
    }
  };

  const leaveRoom = (roomName) => {
    if (socket && isConnected) {
      socket.emit('leave_room', roomName);
    }
  };

  // Subscribe to real-time events
  const subscribeToOrderUpdates = (callback) => {
    const handleOrderUpdate = (event) => {
      callback(event.detail);
    };

    window.addEventListener('orderUpdated', handleOrderUpdate);
    
    return () => {
      window.removeEventListener('orderUpdated', handleOrderUpdate);
    };
  };

  const subscribeToPartnerUpdates = (callback) => {
    const handlePartnerUpdate = (event) => {
      callback(event.detail);
    };

    window.addEventListener('partnerAvailabilityUpdated', handlePartnerUpdate);
    
    return () => {
      window.removeEventListener('partnerAvailabilityUpdated', handlePartnerUpdate);
    };
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    emitOrderUpdate,
    emitPartnerAvailability,
    joinRoom,
    leaveRoom,
    subscribeToOrderUpdates,
    subscribeToPartnerUpdates
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 