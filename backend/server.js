const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const partnerRoutes = require('./routes/partners');

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Trust proxy setting for rate limiting
app.set('trust proxy', 1);

// Rate limiting with proper configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit to 1000 requests per windowMs to prevent blocking during development
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Use a simple key generator to avoid X-Forwarded-For issues
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  // Skip rate limiting for health checks
  skip: (req) => {
    return req.path === '/api/status' || req.path === '/api/health';
  }
});
app.use(limiter);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware for debugging (commented out for cleaner logs)
// app.use((req, res, next) => {
//   console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
//   if (req.method === 'POST' && req.path === '/api/orders') {
//     console.log('POST /api/orders - Request body keys:', Object.keys(req.body));
//   }
//   next();
// });

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zomato-ops-pro')
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Socket.IO connection handling
const connectedUsers = new Map(); // Store user connections

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Handle user authentication and room joining
  socket.on('authenticate', (data) => {
    const { userId, role } = data;
    if (userId && role) {
      socket.userId = userId;
      socket.role = role;
      connectedUsers.set(userId, { socketId: socket.id, role });
      
      // Join role-based rooms
      socket.join(`role_${role}`);
      
      // Join user-specific room for targeted notifications
      socket.join(`user_${userId}`);
      
      console.log(`👤 User authenticated: ${userId} (${role}) - Joined rooms: role_${role}, user_${userId}`);
    }
  });

  // Handle order updates
  socket.on('order_update', (data) => {
    // Broadcast to all restaurant managers and relevant delivery partner
    socket.to('role_restaurant_manager').emit('order_updated', data);
    
    if (data.deliveryPartnerId) {
      const partnerConnection = connectedUsers.get(data.deliveryPartnerId);
      if (partnerConnection) {
        io.to(partnerConnection.socketId).emit('order_updated', data);
      }
    }
  });

  // Handle partner availability updates
  socket.on('partner_availability', (data) => {
    // Broadcast to all restaurant managers
    socket.to('role_restaurant_manager').emit('partner_availability_updated', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log(`🔌 User disconnected: ${socket.userId}`);
    }
  });
});

// Health check endpoint
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'Nomino Pro API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/partners', partnerRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Nomino Pro API - Smart Kitchen + Delivery Hub',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      orders: '/api/orders',
      partners: '/api/partners',
      status: '/api/status'
    }
  });
});

// 404 handler - handle all unmatched routes
// app.all('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Route not found'
//   });
// });

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/api/status`);
  console.log(`🔌 WebSocket server ready for real-time updates`);
});

// Export io for use in routes
module.exports = { app, io }; 