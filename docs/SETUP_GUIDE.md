# 🚀 Nomino Pro Setup Guide

Complete step-by-step guide to set up Nomino Pro Food Delivery Management System.


## 🛠️ **Installation Steps**

### **Step 1: Clone Repository**
```bash
git clone https://github.com/yourusername/nomino-pro.git
cd nomino-pro
```

### **Step 2: Backend Setup**
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
cp config.env
```

**Edit `config.env` file:**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/nominopro

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000
```

### **Step 3: Frontend Setup**
```bash
# Navigate to frontend (from project root)
cd frontend

# Install dependencies
npm install
```

### **Step 4: Database Setup**

**Start MongoDB:**
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**Initialize Database:**
```bash
# Navigate to backend
cd backend

```

### **Step 5: Start Application**

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
✅ Backend runs on: `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
✅ Frontend runs on: `http://localhost:3000`

## 🔑 **Test Login Credentials**

### **Restaurant Manager**
- **Email**: `admin@nominopro.com`
- **Password**: `admin123`


## 🧪 **Testing the Application**

### **1. Restaurant Manager Flow**
1. Login as restaurant manager
2. View dashboard with order statistics
3. Create new orders
4. Move orders: PENDING → PREP → READY
5. Assign delivery partners to ready orders
6. Monitor real-time updates

### **2. Delivery Partner Flow**
1. Login as delivery partner
2. View assigned orders
3. Update order status: PICKED → ON_ROUTE → DELIVERED
4. Check earnings and performance statistics
5. Toggle availability status

### **3. Customer Order Tracking**
1. Access: `http://localhost:3000/orders/{ORDER_ID}/track`
2. View real-time status updates
3. See delivery partner information
4. Rate completed deliveries

## 📊 **API Testing with Postman**

### **Import Collection**
1. Open Postman
2. Click **Import**
3. Select `docs/Nomino-Pro-API-Collection.json`
4. Set environment variables:
   - `baseUrl`: `http://localhost:5000`

### **Authentication Flow**
1. **Login** → Automatically sets `authToken`
2. **Get Profile** → Verify authentication
3. **Test other endpoints** → Use authenticated requests

## 🐛 **Troubleshooting**

### **Common Issues & Solutions**

**❌ MongoDB Connection Error**
```bash
# Check if MongoDB is running
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Check MongoDB status
mongosh --eval "db.adminCommand('ismaster')"
```

**❌ Port Already in Use**
```bash
# Kill process on port 5000
npx kill-port 5000

# Kill process on port 3000
npx kill-port 3000

# Or use different ports in config
```

**❌ Database Issues**
```bash
# Reset database
node scripts/fullDatabaseCleanup.js
node scripts/addTestData.js

# Check database health
node scripts/checkDatabase.js
```

**❌ Package Installation Issues**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**❌ CORS Issues**
- Ensure `FRONTEND_URL` in `config.env` matches frontend URL
- Check if both servers are running on correct ports

**❌ JWT Token Issues**
- Ensure `JWT_SECRET` is set in `config.env`
- Clear browser localStorage and login again

## 🔧 **Development Tools**

### **Database Management**
```bash
# Check database structure
node scripts/checkDatabase.js

# Clean up database
node scripts/fullDatabaseCleanup.js

# Add fresh test data
node scripts/addTestData.js
```

### **Useful Commands**
```bash
# Backend
npm run dev          # Start with nodemon
npm start           # Start production server
npm test            # Run tests (if available)

# Frontend
npm start           # Start development server
npm run build       # Build for production
npm test            # Run tests
```

## 📱 **Mobile Testing**

### **Access from Mobile Device**
1. Find your computer's IP address
2. Update frontend URL to: `http://YOUR_IP:3000`
3. Update backend CORS settings
4. Access from mobile browser

## 🚀 **Production Deployment**

### **Environment Variables for Production**
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nominopro
JWT_SECRET=your_production_jwt_secret
FRONTEND_URL=https://your-frontend-domain.com
```

### **Build Commands**
```bash
# Frontend build
cd frontend
npm run build

# Backend production
cd backend
npm start
```

## 📚 **Additional Resources**

- **API Documentation**: `docs/Nomino-Pro-API-Collection.json`
- **Sample Data**: `docs/sample-data/`
- **Database Scripts**: `backend/scripts/`
- **Component Documentation**: `frontend/src/components/`

## 🆘 **Getting Help**

If you encounter issues:

1. **Check this guide** for common solutions
2. **Review error logs** in terminal
3. **Verify prerequisites** are installed correctly
4. **Check database connection** and data
5. **Ensure all ports are available**

## ✅ **Success Checklist**

- [ ] MongoDB is running and accessible
- [ ] Backend server starts without errors
- [ ] Frontend loads successfully
- [ ] Can login with test credentials
- [ ] Real-time updates work (WebSocket connection)
- [ ] Database has test data
- [ ] API endpoints respond correctly

---

**🎉 Congratulations! Nomino Pro is now ready for use!**

**Next Steps:**
- Explore the restaurant manager dashboard
- Test delivery partner workflows
- Try the order tracking feature
- Experiment with the API using Postman 