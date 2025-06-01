const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config({ path: './config.env' });

// Import routes
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const partnerRoutes = require('./routes/partners');

// Import Swagger configuration
const { swaggerUi, specs } = require('./config/swagger');

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://nomino-pro.onrender.com',
      process.env.FRONTEND_URL
    ].filter(Boolean),
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
  max: 1000, 
  standardHeaders: true,
  legacyHeaders: false, 
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
  origin: [
    'http://localhost:3000',
    'https://nomino-pro.onrender.com',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://kalashmishra21:Royal%402004@dailybytecluster.2gsmw8a.mongodb.net/DailyByteProject?retryWrites=true&w=majority&appName=DailyByteCluster')
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

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Nomino Pro API Documentation',
  customfavIcon: '/favicon.ico'
}));

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
    documentation: {
      swagger: '/api-docs',
      description: 'Interactive API documentation with Swagger UI'
    },
    features: {
      dispatchTime: 'Auto-calculated dispatch time (prepTime + ETA)',
      realTime: 'WebSocket-based real-time updates',
      authentication: 'JWT-based role-based authentication'
    },
    endpoints: {
      auth: '/api/auth',
      orders: '/api/orders',
      partners: '/api/partners',
      status: '/api/status',
      docs: '/api-docs'
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