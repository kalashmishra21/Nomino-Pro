import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleBasedRoute from './components/auth/RoleBasedRoute';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Layout Components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';

// Dashboard Components
import RestaurantDashboard from './components/dashboard/RestaurantDashboard';
import DeliveryDashboard from './components/dashboard/DeliveryDashboard';

// Order Components
import OrderList from './components/orders/OrderList';
import OrderDetails from './components/orders/OrderDetails';
import CreateOrder from './components/orders/CreateOrder';
import OrderTracking from './components/orders/OrderTracking';

// Partner Components
import PartnerList from './components/partners/PartnerList';
import PartnerProfile from './components/partners/PartnerProfile';
import PartnerStats from './components/partners/PartnerStats';

// Profile Components
import Profile from './components/profile/Profile';

import './App.css';

function App() {
  return (
    <div className="App h-full">
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <SocketProvider>
              <Router>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  {/* Protected Routes */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Layout>
                        <Navigate to="/dashboard" replace />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  {/* Dashboard Routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Layout>
                        <RoleBasedRoute allowedRoles={['restaurant_manager']}>
                          <RestaurantDashboard />
                        </RoleBasedRoute>
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/delivery-dashboard" element={
                    <ProtectedRoute>
                      <Layout>
                        <RoleBasedRoute allowedRoles={['delivery_partner']}>
                          <DeliveryDashboard />
                        </RoleBasedRoute>
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  {/* Order Management Routes */}
                  <Route path="/orders" element={
                    <ProtectedRoute>
                      <Layout>
                        <OrderList />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/orders/new" element={
                    <ProtectedRoute>
                      <Layout>
                        <RoleBasedRoute allowedRoles={['restaurant_manager']}>
                          <CreateOrder />
                        </RoleBasedRoute>
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/orders/:id" element={
                    <ProtectedRoute>
                      <Layout>
                        <OrderDetails />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/orders/:orderId/track" element={
                    <ProtectedRoute>
                      <Layout>
                        <OrderTracking />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  {/* Partner Management Routes */}
                  <Route path="/partners" element={
                    <ProtectedRoute>
                      <Layout>
                        <RoleBasedRoute allowedRoles={['restaurant_manager']}>
                          <PartnerList />
                        </RoleBasedRoute>
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/partners/:id" element={
                    <ProtectedRoute>
                      <Layout>
                        <PartnerProfile />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/my-stats" element={
                    <ProtectedRoute>
                      <Layout>
                        <RoleBasedRoute allowedRoles={['delivery_partner']}>
                          <PartnerStats />
                        </RoleBasedRoute>
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  {/* Profile Routes */}
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Layout>
                        <Profile />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  {/* Fallback Route */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Router>
            </SocketProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

// Layout wrapper component
const Layout = ({ children }) => {
  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="ml-64 flex flex-col h-screen">
        <Navbar />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 scrollbar-hide">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App; 