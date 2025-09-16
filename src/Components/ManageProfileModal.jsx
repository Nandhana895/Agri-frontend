import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { profileApi } from '../services/api';
import authService from '../services/authService';

const ManageProfileModal = ({ isOpen, onClose, user }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'password', 'avatar'
  const [validationErrors, setValidationErrors] = useState({});

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user?.name || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setAvatarFile(null);
      setAvatarPreview(null);
      setMessage({ type: '', text: '' });
      setValidationErrors({});
      setActiveTab('profile');
    }
  }, [isOpen, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation errors when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (type) => {
    const errors = {};
    
    if (type === 'profile' || type === 'all') {
      if (!formData.name.trim()) {
        errors.name = 'Name is required';
      } else if (formData.name.trim().length < 2) {
        errors.name = 'Name must be at least 2 characters';
      } else if (formData.name.trim().length > 50) {
        errors.name = 'Name cannot exceed 50 characters';
      }
    }
    
    if (type === 'password' || type === 'all') {
      if (!formData.currentPassword) {
        errors.currentPassword = 'Current password is required';
      }
      
      if (!formData.newPassword) {
        errors.newPassword = 'New password is required';
      } else if (formData.newPassword.length < 8) {
        errors.newPassword = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.newPassword)) {
        errors.newPassword = 'Password must include uppercase, lowercase, number, and symbol';
      } else if (/\s/.test(formData.newPassword)) {
        errors.newPassword = 'Password cannot contain spaces';
      }
      
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your new password';
      } else if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (activeTab === 'password') {
      if (!validateForm('password')) return;
      
      setLoading(true);
      setMessage({ type: '', text: '' });

      try {
        const response = await api.put('/auth/update-password', {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword
        });
        
        if (response.data.success) {
          setMessage({ type: 'success', text: 'Password updated successfully! You will be logged out for security.' });
          setFormData(prev => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }));
          
          // Logout and redirect to landing page after 2 seconds
          setTimeout(() => {
            onClose();
            authService.logout();
            navigate('/');
          }, 2000);
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to update password';
        setMessage({ type: 'error', text: errorMessage });
      } finally {
        setLoading(false);
      }
    }
  };

  const updateNameOnly = async () => {
    if (!validateForm('profile')) return;
    
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      const res = await profileApi.updateName(formData.name.trim());
      if (res?.success) {
        setMessage({ type: 'success', text: 'Name updated successfully' });
        const me = await profileApi.me();
        if (me?.success) {
          try { 
            localStorage.setItem('agrisense_user', JSON.stringify(me.user)); 
            // Update the user in the parent component
            window.dispatchEvent(new CustomEvent('userUpdated', { detail: me.user }));
          } catch (_) {}
        }
      }
    } catch (e) {
      setMessage({ type: 'error', text: e?.message || 'Failed to update name' });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select a valid image file' });
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
        return;
      }
      
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateAvatarOnly = async () => {
    if (!avatarFile) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }
    
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      const res = await profileApi.uploadAvatar(avatarFile);
      if (res?.success) {
        setMessage({ type: 'success', text: 'Profile photo updated successfully' });
        const me = await profileApi.me();
        if (me?.success) {
          try { 
            localStorage.setItem('agrisense_user', JSON.stringify(me.user)); 
            // Update the user in the parent component
            window.dispatchEvent(new CustomEvent('userUpdated', { detail: me.user }));
          } catch (_) {}
        }
        setAvatarFile(null);
        setAvatarPreview(null);
      }
    } catch (e) {
      setMessage({ type: 'error', text: e?.message || 'Failed to upload photo' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Manage Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Info Display */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[var(--ag-primary-100)] text-[var(--ag-primary-700)] flex items-center justify-center overflow-hidden">
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt="avatar" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span className="text-2xl font-semibold">
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="text-xl font-semibold text-gray-900">{user?.name || 'User'}</div>
              <div className="text-sm text-gray-600">{user?.email}</div>
              <div className="text-xs text-gray-500 capitalize bg-gray-200 px-2 py-1 rounded-full inline-block mt-1">
                {user?.role}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-6 py-3 text-sm font-medium ${
              activeTab === 'profile'
                ? 'text-[var(--ag-primary-600)] border-b-2 border-[var(--ag-primary-600)] bg-[var(--ag-primary-50)]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Profile Info
          </button>
          <button
            onClick={() => setActiveTab('avatar')}
            className={`flex-1 px-6 py-3 text-sm font-medium ${
              activeTab === 'avatar'
                ? 'text-[var(--ag-primary-600)] border-b-2 border-[var(--ag-primary-600)] bg-[var(--ag-primary-50)]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Profile Photo
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 px-6 py-3 text-sm font-medium ${
              activeTab === 'password'
                ? 'text-[var(--ag-primary-600)] border-b-2 border-[var(--ag-primary-600)] bg-[var(--ag-primary-50)]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Change Password
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {/* Profile Info Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)] focus:border-transparent ${
                      validationErrors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your name"
                    disabled={loading}
                  />
                  <button 
                    onClick={updateNameOnly} 
                    className="px-4 py-2 bg-[var(--ag-primary-500)] text-white rounded-lg hover:bg-[var(--ag-primary-600)] disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading || !formData.name.trim()}
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Account Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="text-gray-900">{user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Role:</span>
                    <span className="text-gray-900 capitalize">{user?.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member since:</span>
                    <span className="text-gray-900">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Avatar Tab */}
          {activeTab === 'avatar' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-[var(--ag-primary-100)] text-[var(--ag-primary-700)] flex items-center justify-center overflow-hidden mx-auto mb-4">
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="preview" 
                      className="w-full h-full object-cover" 
                    />
                  ) : user?.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt="current avatar" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="text-3xl font-semibold">
                      {(user?.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {avatarPreview ? 'Preview of your new profile photo' : 'Current profile photo'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload New Photo</label>
                <div className="flex gap-3">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarChange} 
                    className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--ag-primary-50)] file:text-[var(--ag-primary-700)] hover:file:bg-[var(--ag-primary-100)]"
                    disabled={loading}
                  />
                  <button 
                    onClick={updateAvatarOnly} 
                    disabled={!avatarFile || loading} 
                    className="px-4 py-2 bg-[var(--ag-primary-500)] text-white rounded-lg hover:bg-[var(--ag-primary-600)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Supported formats: JPG, PNG, GIF. Max size: 5MB
                </p>
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)] focus:border-transparent ${
                    validationErrors.currentPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter current password"
                  disabled={loading}
                />
                {validationErrors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.currentPassword}</p>
                )}
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)] focus:border-transparent ${
                    validationErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter new password"
                  disabled={loading}
                />
                {validationErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.newPassword}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Must be at least 8 characters with uppercase, lowercase, number, and symbol
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)] focus:border-transparent ${
                    validationErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Confirm new password"
                  disabled={loading}
                />
                {validationErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Security Notice</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>After changing your password, you will be automatically logged out for security reasons. You'll need to log in again with your new password.</p>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Message Display */}
          {message.text && (
            <div className={`mt-4 p-4 rounded-lg text-sm ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={loading}
          >
            Close
          </button>
          {activeTab === 'password' && (
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
              className="px-4 py-2 bg-[var(--ag-primary-500)] text-white rounded-lg hover:bg-[var(--ag-primary-600)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageProfileModal;
