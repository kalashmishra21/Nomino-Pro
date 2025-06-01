# 🍕 Nomino Pro - Food Delivery Management System

A comprehensive food delivery management platform built with **React.js**, **Node.js**, **Express.js**, and **MongoDB**. Nomino Pro streamlines restaurant operations and delivery management with real-time tracking, role-based dashboards, and advanced analytics.

## 🚀 **Features**

### **🏪 Restaurant Manager Dashboard**
- ✅ **Order Management**: PENDING → PREP → READY workflow
- ✅ **Partner Assignment**: Assign delivery partners to ready orders
- ✅ **Real-time Updates**: Live order status tracking via WebSocket
- ✅ **Partner Management**: View, rate, and manage delivery partners
- ✅ **Analytics Dashboard**: Order statistics and performance metrics
- ✅ **Role-based Access**: Restricted actions based on user role

### **🚚 Delivery Partner Dashboard**
- ✅ **Order Tracking**: READY → PICKED → ON_ROUTE → DELIVERED workflow
- ✅ **Earnings Tracking**: Real-time commission calculation (10%)
- ✅ **Performance Analytics**: Ratings, delivery time, success rate
- ✅ **Availability Toggle**: Online/offline status management
- ✅ **Order History**: Complete delivery history with ratings
- ✅ **Real-time Notifications**: Instant order assignments

### **📱 Customer Order Tracking**
- ✅ **Live Tracking**: Real-time order status updates
- ✅ **Delivery Partner Info**: Contact details and vehicle information
- ✅ **ETA Calculation**: Dynamic delivery time estimation
- ✅ **Rating System**: Rate delivery service and food quality
- ✅ **Order Details**: Complete order breakdown and pricing

### **🔧 Advanced Features**
- ✅ **WebSocket Integration**: Real-time updates across all dashboards
- ✅ **Rating System**: Customer feedback and partner performance tracking
- ✅ **Commission Tracking**: Automated 10% commission calculation
- ✅ **Dark Mode Support**: Toggle between light and dark themes
- ✅ **Responsive Design**: Mobile-first responsive UI
- ✅ **Role-based Authentication**: Secure JWT-based authentication

## 🛠️ **Tech Stack**

### **Frontend**
- **React.js 18** - Modern UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client for API calls
- **React Router** - Client-side routing

### **Backend**
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.io** - Real-time bidirectional communication
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing

### **1. Clone & Install**
```bash
git clone https://github.com/yourusername/nomino-pro.git
cd nomino-pro

# Backend setup
cd backend && npm install

# Frontend setup  
cd ../frontend && npm install
```

### **2. Database & Environment**
```bash
# Start MongoDB
# Windows: net start MongoDB
# macOS: brew services start mongodb-community

# Setup database (from backend directory)
cd backend
node scripts/addTestData.js
```

### **3. Start Application**
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend  
cd frontend && npm start
```


```
Nomino Pro/
├── backend/
│   ├────── models/
│   │   ├── User.js              # User model (Restaurant Managers & Delivery Partners)
│   │    ── Order.js             # Order model with status tracking
│   │   ├── routes/
│   │   │   ├── auth.js              # Authentication routes
│   │   │   ├── orders.js            # Order management routes
│   │   │   └── partners.js          # Delivery partner routes
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT authentication middleware
│   │   │   └── validation.js        # Request validation middleware
│   │   ├── scripts/
│   │   │   ├── addTestData.js       # Complete test data setup
│   │   │   ├── checkDatabase.js     # Database verification
│   │   │   └── fullDatabaseCleanup.js # Database maintenance
│   │   ├── server.js                # Express server setup
│   │   ├── package.json
│   │   └── config.env               # Environment configuration
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/       # Dashboard components
│   │   │   ├── orders/          # Order management components
│   │   │   ├── partners/        # Partner management components
│   │   │   └── auth/            # Authentication components
│   │   ├── contexts/
│   │   │   ├── AuthContext.js   # Authentication context
│   │   │   ├── SocketContext.js # WebSocket context
│   │   │   └── ToastContext.js  # Notification context
│   │   ├── App.jsx              # Main application component
│   │   └── index.js             # Application entry point
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js       # Tailwind CSS configuration
├── docs/
│   ├── Nomino-Pro-API-Collection.json # Postman collection
│   └── sample-data/             # Sample data files
├── README.md
└── .gitignore
```

## 📊 **API Documentation**

### **Authentication Endpoints**
```
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
GET  /api/auth/profile     # Get user profile
PUT  /api/auth/profile     # Update user profile
```

### **Order Management Endpoints**
```
GET    /api/orders              # Get all orders
POST   /api/orders              # Create new order
GET    /api/orders/:id          # Get specific order
PUT    /api/orders/:id/status   # Update order status
PUT    /api/orders/:id/assign   # Assign delivery partner
PUT    /api/orders/:id/rating   # Rate completed order
GET    /api/orders/stats        # Get order statistics
```

### **Partner Management Endpoints**
```
GET  /api/partners              # Get all delivery partners
GET  /api/partners/available    # Get available partners
GET  /api/partners/my/orders    # Get partner's orders
GET  /api/partners/my/stats     # Get partner's statistics
PUT  /api/partners/availability # Update availability status
```

## 🧪 **Testing**

### **Manual Testing Steps**

1. **Restaurant Manager Flow:**
   - Login as restaurant manager
   - Create new orders
   - Move orders through PENDING → PREP → READY
   - Assign delivery partners to ready orders
   - Monitor real-time updates

2. **Delivery Partner Flow:**
   - Login as delivery partner
   - View assigned orders
   - Update order status: PICKED → ON_ROUTE → DELIVERED
   - Check earnings and performance statistics

3. **Customer Tracking:**
   - Access order tracking page
   - View real-time status updates
   - Rate completed deliveries


## 🎯 **Bonus Features**

### **✅ Real-time Features**
- **Live Order Updates**: WebSocket-powered real-time synchronization
- **Instant Notifications**: Real-time alerts for order status changes
- **Live Dashboard**: Auto-updating statistics and metrics

### **✅ Advanced Analytics**
- **Performance Metrics**: Delivery time, success rate, earnings tracking
- **Rating System**: Customer feedback and partner performance ratings
- **Trend Analysis**: 7-day delivery and earnings trends
- **Commission Tracking**: Automated 10% commission calculation

### **✅ User Experience**
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Mobile-optimized interface
- **Toast Notifications**: User-friendly success/error messages
- **Loading States**: Smooth loading indicators

### **✅ Security Features**
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Restricted actions based on user roles
- **Password Hashing**: bcrypt password encryption
- **Input Validation**: Comprehensive request validation

### **✅ Developer Experience**
- **Clean Code Structure**: Modular and maintainable codebase
- **Comprehensive Documentation**: Detailed setup and API docs
- **Database Scripts**: Automated setup and maintenance tools
- **Error Handling**: Robust error handling and logging

## 🐛 **Troubleshooting**

### **Common Issues**

**MongoDB Connection Error:**
```bash
# Check if MongoDB is running
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

**Port Already in Use:**
```bash
# Kill process on port 5000
npx kill-port 5000

# Kill process on port 3000
npx kill-port 3000
```

**Database Issues:**
```bash
# Reset database
node scripts/fullDatabaseCleanup.js
node scripts/addTestData.js
```

**Package Installation Issues:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```
## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 **Author**

**Your Name**
- GitHub: https://github.com/kalashmishra21/Nomino-Pro.git
## 🙏 **Acknowledgments**

- **MongoDB** for the robust database solution
- **Socket.io** for real-time communication
- **Tailwind CSS** for the beautiful UI components
- **React.js** for the powerful frontend framework

---

**⭐ If you found this project helpful, please give it a star!**

**🚀 Ready to revolutionize food delivery management? Get started with Nomino Pro today!**
