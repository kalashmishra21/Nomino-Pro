import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'restaurant_manager',
    firstName: '',
    lastName: '',
    phone: '',
    vehicleType: '',
    currentLocation: {
      // Remove latitude and longitude fields
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, isLoading, error, isAuthenticated, clearError } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  const roles = [
    {
      value: 'restaurant_manager',
      label: 'Restaurant Manager',
      icon: '🏪'
    },
    {
      value: 'delivery_partner',
      label: 'Delivery Partner',
      icon: '🛵'
    }
  ];

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  // Show error toast when error changes
  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Remove latitude/longitude handling
    if (name === 'vehicleType') {
      setFormData(prev => ({
        ...prev,
        vehicleType: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (error) clearError();
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      showError('Username is required');
      return false;
    }
    if (!formData.email.trim()) {
      showError('Email is required');
      return false;
    }
    if (!formData.password) {
      showError('Password is required');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      showError('Passwords do not match');
      return false;
    }
    if (!formData.firstName.trim()) {
      showError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      showError('Last name is required');
      return false;
    }
    if (!formData.phone.trim()) {
      showError('Phone number is required');
      return false;
    }

    // Validate delivery partner specific fields
    if (formData.role === 'delivery_partner') {
      if (!formData.vehicleType) {
        showError('Vehicle type is required for delivery partners');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      showError('Password must be at least 6 characters long');
      return;
    }

    // Remove location validation for delivery partners
    if (formData.role === 'delivery_partner' && !formData.vehicleType) {
      showError('Please select a vehicle type');
      return;
    }

    const userData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      role: formData.role
    };

    // Add vehicle type for delivery partners without location
    if (formData.role === 'delivery_partner') {
      userData.vehicleType = formData.vehicleType;
    }

    const result = await register(userData);
    
    if (result.success) {
      success(`Welcome to Nomino Pro, ${result.data.user.firstName}!`);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
            <span className="text-white font-bold text-2xl">N</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Join Nomino Pro
          </h2>
          <p className="text-gray-600">
            Create your account to get started
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Role Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((role) => (
                  <div
                    key={role.value}
                    className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      formData.role === role.value
                        ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-accent-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, role: role.value }))}
                  >
                    <div className="text-center w-full">
                      <div className="text-2xl mb-2">{role.icon}</div>
                      <div className="font-semibold text-sm text-gray-900">{role.label}</div>
                    </div>
                    {formData.role === role.value && (
                      <div className="absolute top-2 right-2">
                        <div className="h-4 w-4 bg-primary-600 rounded-full flex items-center justify-center">
                          <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="block w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white hover:bg-white hover:border-gray-300 text-sm text-gray-900"
                  placeholder="Rahul"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="block w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white hover:bg-white hover:border-gray-300 text-sm text-gray-900"
                  placeholder="Sharma"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="block w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white hover:bg-white hover:border-gray-300 text-sm text-gray-900"
                  placeholder="rahulsharma"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white hover:bg-white hover:border-gray-300 text-sm text-gray-900"
                  placeholder="rahul@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="block w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white hover:bg-white hover:border-gray-300 text-sm text-gray-900"
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="block w-full px-3 py-2.5 pr-10 border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white hover:bg-white hover:border-gray-300 text-sm text-gray-900"
                    placeholder="Create password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.275 4.057-5.065 7-9.543 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    className="block w-full px-3 py-2.5 pr-10 border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white hover:bg-white hover:border-gray-300 text-sm text-gray-900"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.275 4.057-5.065 7-9.543 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Delivery Partner Specific Fields */}
            {formData.role === 'delivery_partner' && (
              <div className="space-y-1">
                <label htmlFor="vehicleType" className="block text-sm font-semibold text-gray-700">
                  Vehicle Type
                </label>
                <select
                  id="vehicleType"
                  name="vehicleType"
                  required
                  className="block w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white hover:bg-white hover:border-gray-300 text-sm text-gray-900"
                  value={formData.vehicleType}
                  onChange={handleChange}
                >
                  <option value="">Select Vehicle Type</option>
                  <option value="bike">🏍️ Motorcycle</option>
                  <option value="scooter">🛵 Scooter</option>
                  <option value="bicycle">🚲 Bicycle</option>
                  <option value="car">🚗 Car</option>
                </select>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Create Account
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-4 pt-4 text-center border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="font-semibold text-primary-600 hover:text-primary-500 transition-colors duration-200 hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>&copy; 2024 Nomino Pro. Smart Kitchen + Delivery Hub.</p>
        </div>
      </div>
    </div>
  );
};

export default Register; 