import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';

const UserModal = ({ isOpen, onClose, onSuccess, user, mode }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          password: '',
          confirmPassword: '',
          role: user.role || 'user',
          isActive: user.isActive !== undefined ? user.isActive : true
        });
      } else if (mode === 'view' && user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          password: '',
          confirmPassword: '',
          role: user.role || 'user',
          isActive: user.isActive !== undefined ? user.isActive : true
        });
      } else {
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'user',
          isActive: true
        });
      }
      setError('');
      setFieldErrors({});
    }
  }, [isOpen, mode, user]);

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email';
        return '';
      case 'password':
        // For expert creation, password is optional (will be generated and emailed)
        if (mode === 'create' && formData.role !== 'expert' && !value) return 'Password is required';
        if (value && value.length < 8) return 'Password must be at least 8 characters';
        if (value && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(value)) {
          return 'Password must contain uppercase, lowercase, number, and special character';
        }
        return '';
      case 'confirmPassword':
        if (mode === 'create' && formData.role !== 'expert' && !value) return 'Please confirm password';
        if (value !== formData.password) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (mode === 'view') {
      onClose();
      return;
    }

    // Validate all fields
    const errors = {};
    Object.keys(formData).forEach(key => {
      if (key !== 'confirmPassword' || mode === 'create') {
        const error = validateField(key, formData[key]);
        if (error) errors[key] = error;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setError('');

    try {
      let response;
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        isActive: formData.isActive
      };

      if (mode === 'create') {
        // Only include password for non-expert or when admin explicitly provided one
        if (formData.role !== 'expert' || (formData.password && formData.confirmPassword)) {
          payload.password = formData.password;
        }
        response = await api.post('/admin/users', payload);
      } else {
        // For edit mode, only include password if it's provided
        if (formData.password) {
          payload.password = formData.password;
        }
        response = await api.put(`/admin/users/${user._id}`, payload);
      }

      if (response.data.success) {
        onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${mode} user`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {isViewMode && 'View User'}
              {isEditMode && 'Edit User'}
              {isCreateMode && 'Create User'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isViewMode}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  fieldErrors.name
                    ? 'border-red-400 focus:ring-red-500'
                    : 'border-[var(--ag-border)] focus:ring-[var(--ag-primary-500)]'
                } ${isViewMode ? 'bg-gray-100' : ''}`}
                placeholder="Enter full name"
                required
              />
              {fieldErrors.name && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isViewMode}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  fieldErrors.email
                    ? 'border-red-400 focus:ring-red-500'
                    : 'border-[var(--ag-border)] focus:ring-[var(--ag-primary-500)]'
                } ${isViewMode ? 'bg-gray-100' : ''}`}
                placeholder="Enter email address"
                required
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {isCreateMode ? (formData.role === 'expert' ? '(optional for Experts)' : '*') : '(leave blank to keep current)'}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isViewMode}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  fieldErrors.password
                    ? 'border-red-400 focus:ring-red-500'
                    : 'border-[var(--ag-border)] focus:ring-[var(--ag-primary-500)]'
                } ${isViewMode ? 'bg-gray-100' : ''}`}
                placeholder={isCreateMode ? (formData.role === 'expert' ? 'Optional for Experts; will be emailed if left blank' : 'Enter password') : 'Enter new password (optional)'}
                required={isCreateMode && formData.role !== 'expert'}
              />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password (only for create mode) */}
            {isCreateMode && formData.role !== 'expert' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    fieldErrors.confirmPassword
                      ? 'border-red-400 focus:ring-red-500'
                      : 'border-[var(--ag-border)] focus:ring-[var(--ag-primary-500)]'
                  }`}
                  placeholder="Confirm password"
                  required
                />
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                disabled={isViewMode}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  'border-[var(--ag-border)] focus:ring-[var(--ag-primary-500)]'
                } ${isViewMode ? 'bg-gray-100' : ''}`}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="expert">Expert</option>
              </select>
              {isCreateMode && formData.role === 'expert' && (
                <p className="mt-1 text-xs text-gray-500">If left blank, a temporary password will be generated and emailed to the expert.</p>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                disabled={isViewMode}
                className="h-4 w-4 text-[var(--ag-primary-500)] focus:ring-[var(--ag-primary-500)] border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Active Account
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                {isViewMode ? 'Close' : 'Cancel'}
              </button>
              {!isViewMode && (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[var(--ag-primary-500)] text-white rounded-lg hover:bg-[var(--ag-primary-600)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading 
                    ? (isCreateMode ? 'Creating...' : 'Updating...') 
                    : (isCreateMode ? 'Create User' : 'Update User')
                  }
                </button>
              )}
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default UserModal;
