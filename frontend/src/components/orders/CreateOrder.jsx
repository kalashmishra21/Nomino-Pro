import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';

const CreateOrder = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: {
      street: '',
      city: '',
      pincode: ''
    },
    items: [{ name: '', quantity: 1, price: '' }],
    prepTime: 30,
    priority: 'MEDIUM'
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('customerAddress.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        customerAddress: {
          ...prev.customerAddress,
          [field]: value
        }
      }));
    } else {
      let processedValue = value;
      // Handle numeric fields to prevent NaN
      if (name === 'prepTime') {
        processedValue = parseInt(value) || 30;
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: processedValue
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          let processedValue = value;
          // Handle numeric fields to prevent NaN
          if (field === 'quantity') {
            processedValue = parseInt(value) || 1;
          } else if (field === 'price') {
            // Keep as string to allow empty values, but ensure it's a valid number when not empty
            processedValue = value === '' ? '' : value;
          }
          return { ...item, [field]: processedValue };
        }
        return item;
      })
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, price: '' }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const validateForm = () => {
    const errors = [];
    
    // Validate customer name (only letters and spaces)
    if (!formData.customerName.trim() || !/^[a-zA-Z\s]+$/.test(formData.customerName)) {
      errors.push('Customer name can only contain letters and spaces');
    }
    
    // Validate phone number (Indian format)
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = formData.customerPhone.replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      errors.push('Please provide a valid 10-digit Indian phone number starting with 6, 7, 8, or 9');
    }
    
    // Validate pincode
    if (!/^\d{6}$/.test(formData.customerAddress.pincode)) {
      errors.push('Pincode must be exactly 6 digits');
    }
    
    // Validate city (only letters and spaces)
    if (!formData.customerAddress.city.trim() || !/^[a-zA-Z\s]+$/.test(formData.customerAddress.city)) {
      errors.push('City can only contain letters and spaces');
    }
    
    // Validate items
    formData.items.forEach((item, index) => {
      if (!item.name.trim()) {
        errors.push(`Item ${index + 1} name is required`);
      }
      if (item.quantity < 1 || item.quantity > 20) {
        errors.push(`Item ${index + 1} quantity must be between 1 and 20`);
      }
      const price = parseFloat(item.price);
      if (!item.price || isNaN(price) || price <= 0) {
        errors.push(`Item ${index + 1} price must be a valid positive number`);
      }
    });
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      showError(validationErrors.join('. '));
      return;
    }
    
    setLoading(true);

    try {
      // Clean phone number (remove any formatting)
      const cleanPhone = formData.customerPhone.replace(/\D/g, '');
      
      const orderData = {
        ...formData,
        customerPhone: cleanPhone,
        totalAmount: calculateTotal()
      };

      console.log('Submitting order data:', orderData); // Debug log

      const response = await axios.post('/api/orders', orderData);
      success('Order created successfully!');
      navigate('/orders');
    } catch (error) {
      console.error('Order creation error:', error.response?.data); // Debug log
      showError(error.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
      case 'HIGH': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900';
      case 'URGENT': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate('/orders')}
              className="p-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900 rounded-lg transition-colors duration-200"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                Create New Order
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Add a new order with customer details and items</p>
            </div>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-6 mb-6">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-primary-600 text-white rounded-full font-bold text-sm">
                1
              </div>
              <span className="ml-2 text-sm font-medium text-primary-600 dark:text-primary-400">Customer Info</span>
            </div>
            <div className="h-1 w-12 bg-primary-600 rounded-full"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-primary-600 text-white rounded-full font-bold text-sm">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-primary-600 dark:text-primary-400">Order Items</span>
            </div>
            <div className="h-1 w-12 bg-primary-600 rounded-full"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-primary-600 text-white rounded-full font-bold text-sm">
                3
              </div>
              <span className="ml-2 text-sm font-medium text-primary-600 dark:text-primary-400">Settings</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-primary-600 p-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Customer Information
              </h2>
              <p className="text-primary-100 text-sm mt-1">Enter customer's contact details and delivery address</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Name */}
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                      placeholder="Enter customer name"
                      required
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      type="tel"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                      placeholder="Enter 10-digit phone number"
                      required
                    />
                  </div>
                </div>

                {/* Street Address */}
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Street Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <textarea
                      name="customerAddress.street"
                      value={formData.customerAddress.street}
                      onChange={handleChange}
                      rows={2}
                      className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200 resize-none"
                      placeholder="Enter complete street address"
                      required
                    />
                  </div>
                </div>

                {/* City */}
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customerAddress.city"
                    value={formData.customerAddress.city}
                    onChange={handleChange}
                    className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                    placeholder="Enter city name"
                    required
                  />
                </div>

                {/* Pincode */}
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customerAddress.pincode"
                    value={formData.customerAddress.pincode}
                    onChange={handleChange}
                    className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                    placeholder="Enter 6-digit pincode"
                    maxLength={6}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Items Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-primary-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Order Items
                  </h2>
                  <p className="text-primary-100 text-sm mt-1">Add items with quantities and prices</p>
                </div>
                <div className="text-right">
                  <p className="text-primary-100 text-xs">Total Amount</p>
                  <p className="text-xl font-bold text-white">₹{calculateTotal().toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Item {index + 1}</h3>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Item Name */}
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Item Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                          placeholder="Enter item name"
                          required
                        />
                      </div>

                      {/* Quantity */}
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          min="1"
                          max="20"
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                          required
                        />
                      </div>

                      {/* Price */}
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Price (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                          min="0"
                          step="0.01"
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Item Total */}
                    <div className="mt-3 p-2 bg-primary-50 dark:bg-primary-900 rounded-lg border border-primary-200 dark:border-primary-700">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-primary-700 dark:text-primary-300">Item Total:</span>
                        <span className="font-bold text-primary-800 dark:text-primary-200">
                          ₹{((parseFloat(item.price) || 0) * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Item Button */}
                <button
                  type="button"
                  onClick={addItem}
                  className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="font-medium">Add Another Item</span>
                </button>
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-primary-600 p-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Order Settings
              </h2>
              <p className="text-primary-100 text-sm mt-1">Configure preparation time and priority level</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Prep Time */}
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Preparation Time (minutes) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <input
                      type="number"
                      name="prepTime"
                      value={formData.prepTime}
                      onChange={handleChange}
                      min="5"
                      max="120"
                      className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                      required
                    />
                  </div>
                </div>

                {/* Priority */}
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Priority Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                    required
                  >
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Priority</option>
                  </select>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getPriorityColor(formData.priority)}`}>
                      {formData.priority} Priority
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-bold py-3 px-8 rounded-xl transition-colors duration-200 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating Order...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Create Order</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrder; 