import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const RoleBasedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, let ProtectedRoute handle it
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user's role is in the allowed roles
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect based on user role, but avoid redirect loops
    const currentPath = location.pathname;
    const redirectPath = user.role === 'delivery_partner' ? '/delivery-dashboard' : '/dashboard';
    
    // Only redirect if we're not already on the correct path
    if (currentPath !== redirectPath) {
      return <Navigate to={redirectPath} replace />;
    }
  }

  // Render content if role is allowed
  return children;
};

export default RoleBasedRoute; 