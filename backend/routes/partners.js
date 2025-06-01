const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const { validatePartnerAvailability } = require('../middleware/validation');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', 
  authenticateToken, 
  requireRole('restaurant_manager'), 
  async (req, res) => {
    try {
      const { isAvailable, vehicleType, sortBy = 'rating', sortOrder = 'desc' } = req.query;
      
      let query = { role: 'delivery_partner', isActive: true };
      
      // Add filters
      if (isAvailable !== undefined) {
        query.isAvailable = isAvailable === 'true';
      }
      if (vehicleType) {
        query.vehicleType = vehicleType;
      }

      // Build sort object
      const sortObj = {};
      sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const partners = await User.find(query)
        .select('-password')
        .sort(sortObj);

      res.json({
        success: true,
        message: 'Delivery partners retrieved successfully',
        data: {
          partners,
          count: partners.length
        }
      });
    } catch (error) {
      console.error('Partners fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch delivery partners',
        error: error.message
      });
    }
  }
);

// @route   GET /api/partners/available
router.get('/available', 
  authenticateToken, 
  requireRole('restaurant_manager'), 
  async (req, res) => {
    try {
      const partners = await User.findAvailablePartners();

      res.json({
        success: true,
        message: 'Available partners retrieved successfully',
        data: {
          partners,
          count: partners.length
        }
      });
    } catch (error) {
      console.error('Available partners fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available partners',
        error: error.message
      });
    }
  }
);

// @route   GET /api/partners/my/orders
// @desc    Get current partner's orders
// @access  Private (Delivery Partner)
router.get('/my/orders', 
  authenticateToken, 
  requireRole('delivery_partner'), 
  async (req, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      let query = { deliveryPartner: req.user._id };
      
      if (status) {
        query.status = status;
      }

      const orders = await Order.find(query)
        .populate('restaurantManager', 'firstName lastName phone')
        .sort({ orderPlacedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Order.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        message: 'Partner orders retrieved successfully',
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
      console.error('Partner orders fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch partner orders',
        error: error.message
      });
    }
  }
);

// @route   GET /api/partners/my/active-orders
// @desc    Get current partner's active orders
// @access  Private (Delivery Partner)
router.get('/my/active-orders', 
  authenticateToken, 
  requireRole('delivery_partner'), 
  async (req, res) => {
    try {
      const activeOrders = await Order.find({
        deliveryPartner: req.user._id,
        status: { $in: ['PICKED', 'ON_ROUTE'] }
      })
      .populate('restaurantManager', 'firstName lastName phone')
      .sort({ orderPlacedAt: -1 });

      res.json({
        success: true,
        message: 'Active orders retrieved successfully',
        data: {
          orders: activeOrders,
          count: activeOrders.length
        }
      });
    } catch (error) {
      console.error('Active orders fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch active orders',
        error: error.message
      });
    }
  }
);

// @route   GET /api/partners/my/stats
router.get('/my/stats', 
  authenticateToken, 
  requireRole('delivery_partner'), 
  async (req, res) => {
    try {
      const { period = 'all' } = req.query;
      
      let dateFilter = {};
      const now = new Date();
      
      switch (period) {
        case 'today':
          dateFilter = {
            $gte: new Date(now.setHours(0, 0, 0, 0)),
            $lte: new Date(now.setHours(23, 59, 59, 999))
          };
          break;
        case 'week':
          const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
          dateFilter = { $gte: weekStart };
          break;
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilter = { $gte: monthStart };
          break;
        default:
          dateFilter = {}; // All time
      }

      const matchQuery = {
        deliveryPartner: req.user._id,
        status: 'DELIVERED'
      };

      if (Object.keys(dateFilter).length > 0) {
        matchQuery.deliveredAt = dateFilter;
      }

      // Get basic stats
      const stats = await Order.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalDeliveries: { $sum: 1 },
            totalEarnings: { $sum: '$totalAmount' },
            averageDeliveryTime: {
              $avg: {
                $divide: [
                  { $subtract: ['$deliveredAt', '$pickedAt'] },
                  1000 * 60 
                ]
              }
            }
          }
        }
      ]);
      // Get rating stats separately (only from orders that have ratings)
      const ratingStats = await Order.aggregate([
        { 
          $match: { 
            deliveryPartner: req.user._id,
            status: 'DELIVERED',
            'rating.deliveryService': { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating.deliveryService' },
            totalRatedOrders: { $sum: 1 }
          }
        }
      ]);

      // Get current user data for fallback rating
      const currentUser = await User.findById(req.user._id);

      const partnerStats = stats[0] || {
        totalDeliveries: 0,
        totalEarnings: 0,
        averageDeliveryTime: 0
      };

      // Use rating from orders if available, otherwise use user's rating, otherwise 0
      const averageRating = ratingStats[0]?.averageRating || currentUser.rating || 0;

      // Add rating to stats
      partnerStats.averageRating = Math.round(averageRating * 10) / 10;
      partnerStats.totalRatedOrders = ratingStats[0]?.totalRatedOrders || 0;

      // Calculate success rate
      const totalAssigned = await Order.countDocuments({
        deliveryPartner: req.user._id,
        status: { $in: ['READY', 'PICKED', 'ON_ROUTE', 'DELIVERED', 'CANCELLED'] }
      });

      partnerStats.successRate = totalAssigned > 0 ? 
        Math.round((partnerStats.totalDeliveries / totalAssigned) * 100 * 10) / 10 : 0;
      partnerStats.totalAssigned = totalAssigned;

      // Get delivery trend (last 7 days)
      const trendData = await Order.aggregate([
        {
          $match: {
            deliveryPartner: req.user._id,
            status: 'DELIVERED',
            deliveredAt: {
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$deliveredAt' }
            },
            count: { $sum: 1 },
            earnings: { $sum: '$totalAmount' }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      res.json({
        success: true,
        message: 'Partner statistics retrieved successfully',
        data: {
          stats: partnerStats,
          trend: trendData,
          period
        }
      });
    } catch (error) {
      console.error('Partner stats fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch partner statistics',
        error: error.message
      });
    }
  }
);

// @route   GET /api/partners/:id
// @desc    Get specific delivery partner details
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const partner = await User.findById(req.params.id).select('-password');
    
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

    // Get partner's delivery statistics
    const stats = await Order.aggregate([
      { $match: { deliveryPartner: partner._id, status: 'DELIVERED' } },
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          averageRating: { $avg: '$rating.deliveryService' },
          totalEarnings: { $sum: '$totalAmount' }
        }
      }
    ]);

    const partnerStats = stats[0] || {
      totalDeliveries: 0,
      averageRating: 5.0,
      totalEarnings: 0
    };

    // Get recent orders
    const recentOrders = await Order.find({ 
      deliveryPartner: partner._id 
    })
    .populate('restaurantManager', 'firstName lastName')
    .sort({ orderPlacedAt: -1 })
    .limit(10)
    .select('orderId status orderPlacedAt deliveredAt totalAmount customerName');

    res.json({
      success: true,
      message: 'Partner details retrieved successfully',
      data: {
        partner,
        stats: partnerStats,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Partner details fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch partner details',
      error: error.message
    });
  }
});

// @route   PUT /api/partners/availability
// @desc    Update delivery partner availability
// @access  Private (Delivery Partner)
router.put('/availability', 
  authenticateToken, 
  requireRole('delivery_partner'),
  validatePartnerAvailability, 
  async (req, res) => {
    try {
      const { isAvailable } = req.body;

      // Check if partner has active orders
      if (!isAvailable) {
        const activeOrders = await Order.find({
          deliveryPartner: req.user._id,
          status: { $in: ['PICKED', 'ON_ROUTE'] }
        });

        if (activeOrders.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Cannot go offline while having active deliveries',
            data: {
              activeOrders: activeOrders.length
            }
          });
        }
      }

      const partner = await User.findByIdAndUpdate(
        req.user._id,
        { isAvailable },
        { new: true }
      ).select('-password');

      res.json({
        success: true,
        message: `Status updated to ${isAvailable ? 'available' : 'unavailable'}`,
        data: {
          partner
        }
      });
    } catch (error) {
      console.error('Availability update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update availability',
        error: error.message
      });
    }
  }
);

// @route   PUT /api/partners/:id/rating
// @desc    Update delivery partner rating (internal use)
// @access  Private (Restaurant Manager)
router.put('/:id/rating', 
  authenticateToken, 
  requireRole('restaurant_manager'), 
  async (req, res) => {
    try {
      const { rating } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      const partner = await User.findById(req.params.id);
      
      if (!partner || partner.role !== 'delivery_partner') {
        return res.status(404).json({
          success: false,
          message: 'Delivery partner not found'
        });
      }

      // Calculate new average rating
      const deliveredOrders = await Order.countDocuments({
        deliveryPartner: partner._id,
        status: 'DELIVERED'
      });

      const newRating = ((partner.rating * deliveredOrders) + rating) / (deliveredOrders + 1);

      const updatedPartner = await User.findByIdAndUpdate(
        req.params.id,
        { rating: Math.round(newRating * 10) / 10 },
        { new: true }
      ).select('-password');

      res.json({
        success: true,
        message: 'Partner rating updated successfully',
        data: {
          partner: updatedPartner
        }
      });
    } catch (error) {
      console.error('Partner rating update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update partner rating',
        error: error.message
      });
    }
  }
);

// @route   PUT /api/partners/:id/status
// @desc    Update delivery partner active status (activate/deactivate)
// @access  Private (Restaurant Manager)
router.put('/:id/status', 
  authenticateToken, 
  requireRole('restaurant_manager'), 
  async (req, res) => {
    try {
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isActive must be a boolean value'
        });
      }

      const partner = await User.findById(req.params.id);
      
      if (!partner || partner.role !== 'delivery_partner') {
        return res.status(404).json({
          success: false,
          message: 'Delivery partner not found'
        });
      }

      // If deactivating, check for active orders
      if (!isActive) {
        const activeOrders = await Order.find({
          deliveryPartner: partner._id,
          status: { $in: ['PICKED', 'ON_ROUTE'] }
        });

        if (activeOrders.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Cannot deactivate partner with active deliveries',
            data: {
              activeOrders: activeOrders.length
            }
          });
        }

        // Also set as unavailable when deactivating
        await User.findByIdAndUpdate(req.params.id, { 
          isActive: false, 
          isAvailable: false 
        });
      } else {
        await User.findByIdAndUpdate(req.params.id, { isActive: true });
      }

      const updatedPartner = await User.findById(req.params.id).select('-password');

      res.json({
        success: true,
        message: `Partner ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: updatedPartner
      });
    } catch (error) {
      console.error('Partner status update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update partner status',
        error: error.message
      });
    }
  }
);

module.exports = router; 