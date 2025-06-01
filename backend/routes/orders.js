const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  validateOrderCreation
} = require('../middleware/validation');

const router = express.Router();

// Helper function to emit WebSocket events
const emitOrderUpdate = (req, order, eventType = 'order_updated') => {
  const io = req.app.get('io');
  if (io) {
    const orderData = {
      orderId: order._id,
      status: order.status,
      deliveryPartnerId: order.deliveryPartner,
      restaurantManagerId: order.restaurantManager,
      eventType,
      timestamp: new Date().toISOString(),
      order: order
    };

    // Emit to restaurant managers
    io.to('role_restaurant_manager').emit('order_updated', orderData);
    
    // Emit to specific delivery partner if assigned
    if (order.deliveryPartner) {
      io.to(`user_${order.deliveryPartner}`).emit('order_updated', orderData);
    }
    
    console.log(`📡 WebSocket: ${eventType} emitted for order ${order.orderId}`);
  }
};

// Helper function to emit partner availability updates
const emitPartnerUpdate = (req, partnerId, isAvailable) => {
  const io = req.app.get('io');
  if (io) {
    const updateData = {
      partnerId,
      isAvailable,
      timestamp: new Date().toISOString()
    };
    
    io.to('role_restaurant_manager').emit('partner_availability_updated', updateData);
    console.log(`📡 WebSocket: Partner availability updated for ${partnerId}`);
  }
};

// Validation middleware for MongoDB ObjectId
const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const id = req.params[paramName];
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: `Invalid ${paramName} format`
    });
  }
  next();
};

// @route   GET /api/orders/test
// @desc    Test endpoint to verify API and auth
// @access  Private
router.get('/test', authenticateToken, async (req, res) => {
  try {
    // Try to fetch a simple count
    const orderCount = await Order.countDocuments();
    const userCount = await User.countDocuments();
    
    res.json({
      success: true,
      message: 'Orders API is working',
      data: {
        user: {
          id: req.user._id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          role: req.user.role,
          email: req.user.email
        },
        database: {
          totalOrders: orderCount,
          totalUsers: userCount
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Test endpoint failed',
      error: error.message
    });
  }
});

// @route   GET /api/orders/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    let stats = {};

    if (req.user.role === 'restaurant_manager') {
      // Restaurant manager stats
      const totalOrders = await Order.countDocuments({ restaurantManager: req.user._id });
      const pendingOrders = await Order.countDocuments({ 
        restaurantManager: req.user._id, 
        status: 'PENDING' 
      });
      const activeOrders = await Order.countDocuments({ 
        restaurantManager: req.user._id, 
        status: { $in: ['PREP', 'READY', 'PICKED', 'ON_ROUTE'] }
      });
      const completedOrders = await Order.countDocuments({
        restaurantManager: req.user._id,
        status: 'DELIVERED'
      });

      const totalRevenue = await Order.aggregate([
        { 
          $match: { 
            restaurantManager: req.user._id,
            status: 'DELIVERED'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]);

      // Count available partners
      const availablePartners = await User.countDocuments({
        role: 'delivery_partner',
        isAvailable: true
      });

      stats = {
        totalOrders,
        pendingOrders,
        activeOrders,
        completedOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        availablePartners
      };
    } else if (req.user.role === 'delivery_partner') {
      // Delivery partner stats
      const totalDeliveries = await Order.countDocuments({
        deliveryPartner: req.user._id,
        status: 'DELIVERED'
      });
      
      const pendingPickups = await Order.countDocuments({ 
        deliveryPartner: req.user._id, 
        status: 'READY'
      });
      
      const activeDeliveries = await Order.countDocuments({ 
        deliveryPartner: req.user._id, 
        status: { $in: ['PICKED', 'ON_ROUTE'] }
      });
      
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const completedToday = await Order.countDocuments({
        deliveryPartner: req.user._id,
        status: 'DELIVERED',
        deliveredAt: {
          $gte: startOfDay,
          $lt: endOfDay
        }
      });

      // Calculate today's earnings (10% commission)
      const todayEarnings = await Order.aggregate([
        { 
          $match: { 
            deliveryPartner: req.user._id,
            status: 'DELIVERED',
            deliveredAt: {
              $gte: startOfDay,
              $lt: endOfDay
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ['$totalAmount', 0.1] } }
          }
        }
      ]);

      // Calculate total earnings
      const totalEarnings = await Order.aggregate([
        { 
          $match: { 
            deliveryPartner: req.user._id,
            status: 'DELIVERED'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ['$totalAmount', 0.1] } }
          }
        }
      ]);

      // Calculate average delivery time
      const deliveryTimeStats = await Order.aggregate([
        {
          $match: {
            deliveryPartner: req.user._id,
            status: 'DELIVERED',
            pickedAt: { $exists: true },
            deliveredAt: { $exists: true }
          }
        },
        {
          $project: {
            deliveryTime: {
              $divide: [
                { $subtract: ['$deliveredAt', '$pickedAt'] },
                1000 * 60 // Convert to minutes
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgDeliveryTime: { $avg: '$deliveryTime' },
            totalDeliveries: { $sum: 1 }
          }
        }
      ]);

      // Calculate success rate (delivered vs total assigned)
      const totalAssigned = await Order.countDocuments({
        deliveryPartner: req.user._id,
        status: { $in: ['READY', 'PICKED', 'ON_ROUTE', 'DELIVERED', 'CANCELLED'] }
      });

      const successRate = totalAssigned > 0 ? (totalDeliveries / totalAssigned) * 100 : 0;

      // Get current user rating
      const currentUser = await User.findById(req.user._id);
      const averageRating = currentUser.rating || 0;

      stats = {
        totalDeliveries,
        pendingPickups,
        activeDeliveries,
        completedToday,
        earnings: todayEarnings[0]?.total || 0,
        totalEarnings: totalEarnings[0]?.total || 0,
        rating: averageRating,
        averageRating: averageRating,
        averageDeliveryTime: Math.round(deliveryTimeStats[0]?.avgDeliveryTime || 0),
        successRate: Math.round(successRate * 100) / 100,
        totalAssigned
      };
    }

    res.json({
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
});

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private (Restaurant Manager)
router.post('/', 
  authenticateToken, 
  requireRole('restaurant_manager'),
  validateOrderCreation, 
  async (req, res) => {
    try {
      const orderData = {
        ...req.body,
        restaurantManager: req.user._id
      };

      // Calculate total amount if not provided
      if (!orderData.totalAmount && orderData.items) {
        orderData.totalAmount = orderData.items.reduce(
          (total, item) => total + (item.price * item.quantity), 
          0
        );
      }

      const order = new Order(orderData);
      await order.save();

      // Populate the order with manager details
      await order.populate('restaurantManager', 'firstName lastName phone');

      emitOrderUpdate(req, order);

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: {
          order
        }
      });
    } catch (error) {
      console.error('Order creation error:', error.message);
      
      // Handle validation errors specifically
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors,
          details: error.errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create order',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

// @route   GET /api/orders
// @desc    Get orders with filtering and pagination
// @access  Private
router.get('/', 
  authenticateToken, 
  async (req, res) => {
    try {
      const {
        status,
        priority,
        page = 1,
        limit = 20,
        sortBy = 'orderPlacedAt',
        sortOrder = 'desc'
      } = req.query;

      // Build query based on user role
      let query = {};
      
      if (req.user.role === 'restaurant_manager') {
        query.restaurantManager = req.user._id;
      } else if (req.user.role === 'delivery_partner') {
        query.deliveryPartner = req.user._id;
      }

      // Add filters
      if (status) query.status = status;
      if (priority) query.priority = priority;

      // Build sort object
      const sortObj = {};
      sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute query with pagination
      const orders = await Order.find(query)
        .populate('restaurantManager', 'firstName lastName phone')
        .populate('deliveryPartner', 'firstName lastName phone vehicleType rating')
        .sort(sortObj)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      // Get total count for pagination
      const total = await Order.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        message: 'Orders retrieved successfully',
        data: {
          orders,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalOrders: total,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Orders fetch error:', error.message);
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch orders',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

// @route   GET /api/orders/:id
// @desc    Get a specific order by ID
// @access  Private
router.get('/:id', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurantManager', 'firstName lastName phone')
      .populate('deliveryPartner', 'firstName lastName phone vehicleType rating')
      .populate('trackingNotes.addedBy', 'firstName lastName role');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check access permissions
    const hasAccess = 
      req.user.role === 'restaurant_manager' && order.restaurantManager._id.equals(req.user._id) ||
      req.user.role === 'delivery_partner' && order.deliveryPartner && order.deliveryPartner._id.equals(req.user._id);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this order'
      });
    }

    res.json({
      success: true,
      message: 'Order retrieved successfully',
      data: {
        order,
        trackingInfo: order.getTrackingInfo()
      }
    });
  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
});

// @route   PUT /api/orders/:id
// @desc    Update an order
// @access  Private (Restaurant Manager)
router.put('/:id', 
  authenticateToken, 
  requireRole('restaurant_manager'),
  validateObjectId(),
  async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check if user owns this order
      if (!order.restaurantManager.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this order'
        });
      }

      // Prevent updates after certain statuses
      if (['DELIVERED', 'CANCELLED'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update completed or cancelled orders'
        });
      }

      // Update order
      const allowedUpdates = ['prepTime', 'estimatedDeliveryTime', 'priority', 'status'];
      const updates = {};
      
      Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updates[key] = req.body[key];
        }
      });

      const updatedOrder = await Order.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      ).populate('restaurantManager deliveryPartner', 'firstName lastName phone');

      emitOrderUpdate(req, updatedOrder);

      res.json({
        success: true,
        message: 'Order updated successfully',
        data: {
          order: updatedOrder
        }
      });
    } catch (error) {
      console.error('Order update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update order',
        error: error.message
      });
    }
  }
);

// @route   POST /api/orders/:id/assign
// @desc    Assign delivery partner to order
// @access  Private (Restaurant Manager)
router.post('/:id/assign', 
  authenticateToken, 
  requireRole('restaurant_manager'),
  validateObjectId(),
  async (req, res) => {
    try {
      const { partnerId } = req.body;

      const order = await Order.findById(req.params.id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check ownership
      if (!order.restaurantManager.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this order'
        });
      }

      // Check if order can be assigned
      if (!['PENDING', 'PREP', 'READY'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'Order cannot be reassigned at this stage'
        });
      }

      // Verify partner exists and is available
      const partner = await User.findById(partnerId);
      
      if (!partner) {
        return res.status(404).json({
          success: false,
          message: 'Delivery partner not found'
        });
      }

      if (partner.role !== 'delivery_partner') {
        return res.status(400).json({
          success: false,
          message: 'User is not a delivery partner'
        });
      }

      if (!partner.isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'Partner is not available'
        });
      }

      // Check if partner has other active orders
      const activeOrders = await Order.find({
        deliveryPartner: partnerId,
        status: { $in: ['PICKED', 'ON_ROUTE'] }
      });

      if (activeOrders.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Partner already has active deliveries'
        });
      }

      // Assign partner
      order.deliveryPartner = partnerId;
      if (order.status === 'PENDING') {
        order.status = 'PREP';
      }
      
      await order.save();

      // Update partner availability
      partner.isAvailable = false;
      await partner.save();

      const updatedOrder = await Order.findById(order._id)
        .populate('restaurantManager deliveryPartner', 'firstName lastName phone vehicleType');

      emitOrderUpdate(req, updatedOrder);

      res.json({
        success: true,
        message: 'Partner assigned successfully',
        data: {
          order: updatedOrder
        }
      });
    } catch (error) {
      console.error('Partner assignment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign partner',
        error: error.message
      });
    }
  }
);

// @route   PUT /api/orders/:id/assign
// @desc    Assign delivery partner to order (PUT method for frontend compatibility)
// @access  Private (Restaurant Manager)
router.put('/:id/assign', 
  authenticateToken, 
  requireRole('restaurant_manager'),
  validateObjectId(),
  async (req, res) => {
    try {
      const { partnerId } = req.body;

      const order = await Order.findById(req.params.id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check ownership
      if (!order.restaurantManager.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this order'
        });
      }

      // Check if order can be assigned
      if (!['PENDING', 'PREP', 'READY'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'Order cannot be reassigned at this stage'
        });
      }

      // Verify partner exists and is available
      const partner = await User.findById(partnerId);
      
      if (!partner) {
        return res.status(404).json({
          success: false,
          message: 'Delivery partner not found'
        });
      }

      if (partner.role !== 'delivery_partner') {
        return res.status(400).json({
          success: false,
          message: 'User is not a delivery partner'
        });
      }

      if (!partner.isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'Partner is not available'
        });
      }

      // Check if partner has other active orders
      const activeOrders = await Order.find({
        deliveryPartner: partnerId,
        status: { $in: ['PICKED', 'ON_ROUTE'] }
      });

      if (activeOrders.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Partner already has active deliveries'
        });
      }

      // Assign partner
      order.deliveryPartner = partnerId;
      if (order.status === 'PENDING') {
        order.status = 'PREP';
      }
      
      await order.save();

      // Update partner availability
      partner.isAvailable = false;
      await partner.save();

      const updatedOrder = await Order.findById(order._id)
        .populate('restaurantManager deliveryPartner', 'firstName lastName phone vehicleType');

      emitOrderUpdate(req, updatedOrder);

      res.json({
        success: true,
        message: 'Partner assigned successfully',
        data: {
          order: updatedOrder
        }
      });
    } catch (error) {
      console.error('Partner assignment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign partner',
        error: error.message
      });
    }
  }
);

// @route   PUT /api/orders/:id/status
// @desc    Update order status (for delivery partners)
// @access  Private (Delivery Partner)
router.put('/:id/status', 
  authenticateToken, 
  requireRole('delivery_partner'),
  validateObjectId(),
  async (req, res) => {
    try {
      const { status, notes } = req.body;

      const order = await Order.findById(req.params.id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check if partner is assigned to this order
      if (!order.deliveryPartner || !order.deliveryPartner.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to this order'
        });
      }

      // Validate status transition
      const statusFlow = {
        'PREP': ['READY'],
        'READY': ['PICKED'],
        'PICKED': ['ON_ROUTE'],
        'ON_ROUTE': ['DELIVERED']
      };

      const allowedNextStatuses = statusFlow[order.status] || [];
      
      if (!allowedNextStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot transition from ${order.status} to ${status}`
        });
      }

      // Update order status
      order.status = status;
      
      // Add tracking note if provided
      if (notes) {
        order.trackingNotes.push({
          note: notes,
          addedBy: req.user._id
        });
      }

      await order.save();

      // Update partner availability when order is delivered
      if (status === 'DELIVERED') {
        await User.findByIdAndUpdate(req.user._id, { 
          isAvailable: true,
          $inc: { totalDeliveries: 1 }
        });
      }

      const updatedOrder = await Order.findById(order._id)
        .populate('restaurantManager deliveryPartner', 'firstName lastName phone')
        .populate('trackingNotes.addedBy', 'firstName lastName role');

      emitOrderUpdate(req, updatedOrder);

      res.json({
        success: true,
        message: `Order status updated to ${status}`,
        data: {
          order: updatedOrder,
          trackingInfo: updatedOrder.getTrackingInfo()
        }
      });
    } catch (error) {
      console.error('Status update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update order status',
        error: error.message
      });
    }
  }
);

// @route   PUT /api/orders/:id/rating
// @desc    Rate a delivery partner after order completion
// @access  Private
router.put('/:id/rating', 
  authenticateToken,
  validateObjectId('id'),
  async (req, res) => {
    try {
      const { deliveryService, foodQuality, overallExperience, feedback } = req.body;
      
      // Validate rating values
      const ratings = { deliveryService, foodQuality, overallExperience };
      for (const [key, value] of Object.entries(ratings)) {
        if (value && (value < 1 || value > 5)) {
          return res.status(400).json({
            success: false,
            message: `${key} rating must be between 1 and 5`
          });
        }
      }

      const order = await Order.findById(req.params.id)
        .populate('deliveryPartner', 'firstName lastName rating totalDeliveries');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      if (order.status !== 'DELIVERED') {
        return res.status(400).json({
          success: false,
          message: 'Can only rate completed orders'
        });
      }

      if (order.rating && order.rating.overallExperience) {
        return res.status(400).json({
          success: false,
          message: 'Order has already been rated'
        });
      }

      // Update order rating
      order.rating = {
        deliveryService,
        foodQuality,
        overallExperience,
        feedback
      };
      await order.save();

      // Update delivery partner's average rating
      if (order.deliveryPartner && deliveryService) {
        const partner = order.deliveryPartner;
        
        // Get all ratings for this partner
        const partnerOrders = await Order.find({
          deliveryPartner: partner._id,
          status: 'DELIVERED',
          'rating.deliveryService': { $exists: true }
        });

        // Calculate new average rating
        const totalRatings = partnerOrders.length;
        const sumRatings = partnerOrders.reduce((sum, order) => sum + order.rating.deliveryService, 0);
        const newAverageRating = totalRatings > 0 ? sumRatings / totalRatings : 5.0;

        // Update partner's rating
        await User.findByIdAndUpdate(partner._id, {
          rating: Math.round(newAverageRating * 10) / 10, // Round to 1 decimal place
          totalDeliveries: totalRatings
        });
      }

      res.json({
        success: true,
        message: 'Rating submitted successfully',
        data: { order }
      });
    } catch (error) {
      console.error('Rating submission error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit rating',
        error: error.message
      });
    }
  }
);

// @route   DELETE /api/orders/:id
// @desc    Cancel an order
// @access  Private (Restaurant Manager)
router.delete('/:id', 
  authenticateToken, 
  requireRole('restaurant_manager'),
  validateObjectId(), 
  async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check ownership
      if (!order.restaurantManager.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this order'
        });
      }

      // Can only cancel pending or prep orders
      if (!['PENDING', 'PREP'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel order at this stage'
        });
      }

      // Cancel order
      order.status = 'CANCELLED';
      await order.save();

      // Make delivery partner available again if assigned
      if (order.deliveryPartner) {
        await User.findByIdAndUpdate(order.deliveryPartner, { isAvailable: true });
      }

      res.json({
        success: true,
        message: 'Order cancelled successfully',
        data: {
          order
        }
      });
    } catch (error) {
      console.error('Order cancellation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel order',
        error: error.message
      });
    }
  }
);

module.exports = router; 