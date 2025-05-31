# Zomato Ops Pro

A comprehensive food delivery management system built with React.js frontend and Node.js backend.

## 🚀 Features

### Restaurant Manager Dashboard
- Order management and tracking
- Real-time order status updates
- Delivery partner assignment
- Performance analytics
- Customer information management

### Delivery Partner Dashboard
- Order assignment and tracking
- Availability toggle
- Earnings tracking
- Performance metrics
- Real-time notifications

### Core Features
- **Authentication System**: Secure login/registration for both roles
- **Real-time Notifications**: Live updates for orders and deliveries
- **Dark Mode Support**: Complete dark/light theme switching
- **Responsive Design**: Mobile-first responsive UI
- **Order Management**: Complete order lifecycle management
- **Partner Management**: Delivery partner availability and assignment

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI Framework
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP Client
- **Context API** - State Management

### Backend
- **Node.js** - Runtime Environment
- **Express.js** - Web Framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Express Rate Limit** - API Rate Limiting
- **Helmet** - Security Headers

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Git

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure your environment variables in .env
# MONGODB_URI=mongodb://localhost:27017/zomato-ops-pro
# JWT_SECRET=your-secret-key
# NODE_ENV=development

# Start the server
npm run dev
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Orders
- `GET /api/orders` - Get orders (filtered by role)
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id/assign` - Assign delivery partner

### Partners
- `GET /api/partners/available` - Get available partners
- `PUT /api/partners/availability` - Toggle availability
- `GET /api/partners/my/stats` - Get partner statistics

## 🎨 UI Features

- **Modern Design**: Clean and professional interface
- **Dark Mode**: Complete dark theme support
- **Responsive**: Works on all device sizes
- **Notifications**: Real-time notification system
- **Status Badges**: Color-coded order status indicators
- **Interactive Forms**: Enhanced form validation and UX

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- Helmet security headers
- Input validation and sanitization

## 📱 User Roles

### Restaurant Manager
- Create and manage orders
- Assign delivery partners
- Track order progress
- View performance analytics
- Manage customer information

### Delivery Partner
- View assigned orders
- Update order status
- Toggle availability
- Track earnings
- View performance metrics

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or your preferred database
2. Configure environment variables
3. Deploy to your preferred platform (Heroku, AWS, etc.)

### Frontend Deployment
1. Build the production version: `npm run build`
2. Deploy to your preferred platform (Netlify, Vercel, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Kalash Mishra**
- GitHub: [@kalashmishra21](https://github.com/kalashmishra21)

## 🙏 Acknowledgments

- Built as part of GNA Zomato Project Internship
- Inspired by modern food delivery platforms
- Thanks to the open-source community for the amazing tools and libraries 