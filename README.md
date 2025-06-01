# 🍕 Nomino Pro - Smart Kitchen + Delivery Hub

A comprehensive **MERN Stack** food delivery management platform with real-time tracking, intelligent dispatch system, and role-based dashboards. Built with **React.js**, **Node.js**, **Express.js**, and **MongoDB**.

![Nomino Pro Banner](https://img.shields.io/badge/Nomino%20Pro-Food%20Delivery%20Platform-orange?style=for-the-badge&logo=food&logoColor=white)

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

## 📋 **Prerequisites**

Before you begin, ensure you have the following installed:

- **Node.js** (v16.0.0 or higher) - [Download](https://nodejs.org/)
- **MongoDB Compass** (for database visualization) - [Download](https://www.mongodb.com/products/compass)
- **Git** - [Download](https://git-scm.com/)
- **npm** or **yarn** package manager

## 🚀 **Quick Start**

### **1. Clone & Install**
```bash
git clone https://github.com/yourusername/nomino-pro.git
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
MONGODB_URI=mongodb+srv://kalashmishra21:Royal%402004@dailybytecluster.2gsmw8a.mongodb.net/DailyByteProject?retryWrites=true&w=majority&appName=DailyByteCluster

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_complex
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### **3. Database Setup**
```bash
# Setup test data (from backend directory)
cd backend
node scripts/addTestData.js

# Verify database connection
node scripts/checkDatabase.js
```

### **4. Start Application**
```bash
# Terminal 1 - Backend (Port 5000)
cd backend && npm start

# Terminal 2 - Frontend (Port 3000)
cd frontend && npm start
```

**🎉 Access at: http://localhost:3000**

## 🔑 **Test Credentials**

### **Restaurant Manager**
- **Email**: `admin@nominopro.com`
- **Username**: `restaurant_admin`
- **Password**: `admin123`

### **Delivery Partners**
| Name | Email | Password | Vehicle | Rating |
|------|-------|----------|---------|--------|
| Rahul Sharma | `rahul.delivery@nominopro.com` | `password123` | Scooter | 4.5⭐ |
| Priya Singh | `priya.delivery@nominopro.com` | `password123` | Bike | 4.8⭐ |
| Amit Kumar | `amit.delivery@nominopro.com` | `password123` | Bicycle | 4.2⭐ |
| Sneha Patel | `sneha.delivery@nominopro.com` | `password123` | Scooter | 4.6⭐ |
| Vikash Yadav | `vikash.delivery@nominopro.com` | `password123` | Car | 4.3⭐ |

## 🗄️ **Database Configuration**

### **MongoDB Atlas Setup**
- **Cluster**: DailyByteCluster
- **Database**: DailyByteProject
- **Connection**: MongoDB Atlas Cloud
- **Compass URL**: `mongodb+srv://kalashmishra21:Royal%402004@dailybytecluster.2gsmw8a.mongodb.net/DailyByteProject`

### **Collections**
- `users` - Restaurant managers and delivery partners
- `orders` - Order management with status tracking
- `sessions` - JWT session management

## 📁 **Project Structure**

```
Nomino Pro/
├── backend/
│   ├── models/
│   │   ├── User.js              # User model (Restaurant Managers & Delivery Partners)
│   │   └── Order.js             # Order model with smart dispatch tracking
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── orders.js            # Order management routes
│   │   └── partners.js          # Delivery partner routes
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   └── validation.js        # Request validation middleware
│   ├── scripts/
│   │   ├── addTestData.js       # Complete test data setup
│   │   ├── checkDatabase.js     # Database verification
│   │   └── fullDatabaseCleanup.js # Database maintenance
│   ├── server.js                # Express server with Socket.io
│   ├── package.json
│   └── .env                     # Environment configuration
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

### **1. Smart Dispatch Time Testing**
- Create orders with different prep times
- Watch dispatch times update based on real progress
- Verify completed orders show actual delivery time

### **2. Track Order Logic Testing**
- **Restaurant Manager**: Can track active orders, no track button for completed
- **Delivery Partner**: No track buttons (they're delivering)
- **Completed Orders**: Show completion messages instead of track buttons

### **3. Real-time Updates Testing**
- Open multiple browser windows with different roles
- Update order status and watch real-time updates
- Test WebSocket connectivity indicators

### **4. Profile Management Testing**
- Update profile information
- Verify only allowed fields are updated
- Test validation and error handling

## 🎨 **UI/UX Features**

### **Modern Design Elements**
- ✅ **Compact Layout**: Optimized spacing for better content density
- ✅ **Consistent Colors**: Unified color scheme across all components
- ✅ **Smart Hover Effects**: Enhanced sidebar interactions with branded colors
- ✅ **Conditional UI**: Context-aware button visibility
- ✅ **Status Messages**: Beautiful completion and cancellation messages
- ✅ **Real-time Indicators**: Live connection status and updates

### **Responsive Design**
- ✅ **Mobile-First**: Optimized for mobile devices
- ✅ **Tablet Support**: Perfect layout for tablets
- ✅ **Desktop Experience**: Full-featured desktop interface
- ✅ **Dark Mode**: Complete dark theme support

## 🚀 **Deployment**

### **Frontend Deployment (Vercel/Netlify)**
```bash
cd frontend
npm run build
# Deploy build folder
```

### **Backend Deployment (Heroku/Railway)**
```bash
cd backend
# Set environment variables
# Deploy to your preferred platform
```

### **Environment Variables for Production**
```env
MONGODB_URI=mongodb+srv://kalashmishra21:Royal%402004@dailybytecluster.2gsmw8a.mongodb.net/DailyByteProject?retryWrites=true&w=majority&appName=DailyByteCluster
JWT_SECRET=your_production_jwt_secret
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend-domain.com
```

## 🤝 **Contributing**

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 **Developer**

**Kalash Mishra**
- GitHub: [@kalashmishra](https://github.com/kalashmishra)
- Email: kalashmishra21@gmail.com

## 🙏 **Acknowledgments**

- React.js team for the amazing framework
- MongoDB Atlas for cloud database hosting
- Tailwind CSS for the utility-first CSS framework
- Socket.io for real-time communication
- All contributors and testers

---

**⭐ If you found this project helpful, please give it a star!**

## 🔧 **Troubleshooting**

### **Authentication Issues (401 Unauthorized)**

If you encounter "Invalid credentials" or 401 errors:

1. **Environment Configuration**: Ensure `backend/config.env` is properly loaded
   ```javascript
   // In server.js, make sure you have:
   require('dotenv').config({ path: './config.env' });
   ```

2. **Database Connection**: Verify MongoDB Atlas connection
   ```bash
   # Test connection from backend directory
   node -e "require('dotenv').config({path:'./config.env'}); console.log(process.env.MONGODB_URI)"
   ```

3. **Test Users**: Ensure test users exist in database
   ```bash
   # Create test users if they don't exist
   cd backend
   node checkUsers.js  # This will create test users if missing
   ```

4. **Phone Number Format**: User phone numbers must be exactly 10 digits (no country code)
   - ✅ Correct: `9876543210`
   - ❌ Wrong: `+91-9876543210`

5. **JWT Secret**: Ensure JWT_SECRET is set in config.env
   ```env
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-zomato-ops-pro-2024
   ```

### **Common Solutions**
- **Backend not starting**: Check if port 5000 is available
- **Frontend proxy errors**: Ensure backend is running on port 5000
- **Database connection**: Verify MongoDB Atlas credentials and network access
- **CORS issues**: Check CORS_ORIGIN in config.env matches frontend URL