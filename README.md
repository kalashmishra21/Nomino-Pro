# 🍕 Nomino Pro - Smart Kitchen + Delivery Hub

A comprehensive food delivery management platform built with **React.js**, **Node.js**, **Express.js**, and **MongoDB**. Nomino Pro streamlines restaurant operations and delivery management with real-time tracking, role-based dashboards, and advanced analytics.

## 🌐 **Live Demo**

** 👉[View Live Application](https://nominopro.onrender.com/)**


## 🚀 **Latest Features & Updates**

### **✨ Recently Implemented**
- ✅ **Smart Dispatch Time Calculation**: Real-time dispatch times based on actual order progress
- ✅ **Conditional Track Order Logic**: Track buttons only shown when relevant (not for completed orders or delivery partners)
- ✅ **Enhanced Order Status Flow**: Proper status transitions with real-time updates
- ✅ **Improved UI/UX**: Compact, modern design with consistent color schemes
- ✅ **Better Profile Management**: Fixed profile updates with proper field validation
- ✅ **Enhanced Sidebar Hover Effects**: Smooth animations and branded hover states

### **🏪 Restaurant Manager Dashboard**
- ✅ **Order Management**: Complete PENDING → PREP → READY workflow
- ✅ **Smart Partner Assignment**: Assign delivery partners to ready orders
- ✅ **Real-time Updates**: Live order status tracking via WebSocket
- ✅ **Partner Management**: View, rate, and manage delivery partners
- ✅ **Analytics Dashboard**: Order statistics and performance metrics
- ✅ **Role-based Access**: Restricted actions based on user role
- ✅ **Track Order Logic**: Only show track buttons for active orders

### **🚚 Delivery Partner Dashboard**
- ✅ **Order Tracking**: READY → PICKED → ON_ROUTE → DELIVERED workflow
- ✅ **Earnings Tracking**: Real-time commission calculation (10%)
- ✅ **Performance Analytics**: Ratings, delivery time, success rate
- ✅ **Availability Toggle**: Online/offline status management
- ✅ **Order History**: Complete delivery history with ratings
- ✅ **Real-time Notifications**: Instant order assignments
- ✅ **No Track Buttons**: Delivery partners don't track their own orders

### **📱 Customer Order Experience**
- ✅ **Live Tracking**: Real-time order status updates with smart dispatch times
- ✅ **Delivery Partner Info**: Contact details and vehicle information
- ✅ **Smart ETA Calculation**: Dynamic delivery time based on actual progress
- ✅ **Rating System**: Rate delivery service and food quality
- ✅ **Order Details**: Complete order breakdown with real dispatch times
- ✅ **Completion Messages**: Beautiful success/cancellation messages

### **🔧 Advanced Features**
- ✅ **WebSocket Integration**: Real-time updates across all dashboards
- ✅ **Smart Dispatch System**: Real-time calculation based on order status
- ✅ **Rating System**: Customer feedback and partner performance tracking
- ✅ **Commission Tracking**: Automated 10% commission calculation
- ✅ **Dark Mode Support**: Toggle between light and dark themes
- ✅ **Responsive Design**: Mobile-first responsive UI
- ✅ **Role-based Authentication**: Secure JWT-based authentication
- ✅ **Conditional UI Logic**: Smart button visibility based on context

## 🛠️ **Tech Stack**

### **Frontend**
- **React.js 18** - Modern UI library with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client for API calls
- **React Router** - Client-side routing
- **Context API** - State management

### **Backend**
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB Atlas** - Cloud NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.io** - Real-time bidirectional communication
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing


## 🚀 **Quick Start**

**For detailed setup instructions, see [Setup Guide](docs/SETUP_GUIDE.md)**

### **1. Clone & Install**
```bash
git clone https://github.com/kalashmishra21/Nomino-Pro.git
cd nomino-pro

# Backend setup
cd backend && npm install

# Frontend setup  
cd ../frontend && npm install
```

### **2. Environment Configuration**

Create `.env` file in the `backend` directory:

```env
# MongoDB Atlas Connection
MONGODB_URI=Add your database name

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_complex
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```


### **4. Start Application**
```bash
# Terminal 1 - Backend (Port 5000)
cd backend && npm start

# Terminal 2 - Frontend (Port 3000)
cd frontend && npm start
```

## 📁 **Project Structure**

```
Nomino Pro/
├── backend/
│   ├────── models/
│   │   ├── User.js              # User model (Restaurant Managers & Delivery Partners)
│   │   │   └── Order.js             # Order model with status tracking
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
│   │   │   ├── auth/            # Authentication components
│   │   │   ├── layout/          # Layout components (Sidebar, Navbar)
│   │   │   └── profile/         # Profile management components
│   │   ├── contexts/
│   │   │   ├── AuthContext.js   # Authentication context
│   │   │   ├── SocketContext.js # WebSocket context
│   │   │   ├── ToastContext.js  # Notification context
│   │   │   └── ThemeContext.js  # Dark/Light mode context
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
GET  /api/auth/available-partners # Get available delivery partners
```

### **Order Management Endpoints**
```
GET    /api/orders              # Get all orders (role-based filtering)
POST   /api/orders              # Create new order
GET    /api/orders/:id          # Get specific order
PUT    /api/orders/:id          # Update order (restaurant manager)
PUT    /api/orders/:id/status   # Update order status (delivery partner)
PUT    /api/orders/:id/assign   # Assign delivery partner
PUT    /api/orders/:id/rating   # Rate completed order
GET    /api/orders/stats        # Get order statistics
DELETE /api/orders/:id          # Cancel order (restaurant manager)
```

### **Partner Management Endpoints**
```
GET  /api/partners              # Get all delivery partners
GET  /api/partners/available    # Get available partners
PUT  /api/partners/availability # Update availability status
GET  /api/partners/my/orders    # Get partner's orders
GET  /api/partners/my/stats     # Get partner's statistics
```

## 🧪 **Testing Features**

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


## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


## 🙏 **Acknowledgments**

- React.js team for the amazing framework
- MongoDB Atlas for cloud database hosting
- Tailwind CSS for the utility-first CSS framework
- Socket.io for real-time communication
- All contributors and testers

---
