import React, { useState } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.put('/auth/update-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Password updated successfully! Redirecting to landing page...' });
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
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
  };

  const updateNameOnly = async () => {
    try {
      setLoading(true);
      const res = await profileApi.updateName(formData.name.trim());
      if (res?.success) {
        setMessage({ type: 'success', text: 'Name updated successfully' });
        const me = await profileApi.me();
        if (me?.success) {
          try { localStorage.setItem('agrisense_user', JSON.stringify(me.user)); } catch (_) {}
        }
      }
    } catch (e) {
      setMessage({ type: 'error', text: e?.message || 'Failed to update name' });
    } finally {
      setLoading(false);
    }
  };

  const updateAvatarOnly = async () => {
    if (!avatarFile) return;
    try {
      setLoading(true);
      const res = await profileApi.uploadAvatar(avatarFile);
      if (res?.success) {
        setMessage({ type: 'success', text: 'Profile photo updated' });
        const me = await profileApi.me();
        if (me?.success) {
          try { localStorage.setItem('agrisense_user', JSON.stringify(me.user)); } catch (_) {}
        }
      }
    } catch (e) {
      setMessage({ type: 'error', text: e?.message || 'Failed to upload photo' });
    } finally {
      setLoading(false);
      setAvatarFile(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Manage Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <label className="w-14 h-14 rounded-full bg-[var(--ag-primary-100)] text-[var(--ag-primary-700)] flex items-center justify-center cursor-pointer overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-semibold">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
            </label>
            <div>
              <div className="font-medium text-gray-900">{user?.name || 'User'}</div>
              <div className="text-sm text-gray-600">{user?.email}</div>
              <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)] focus:border-transparent"
                placeholder="Enter your name"
              />
              <button onClick={updateNameOnly} className="px-3 py-2 bg-[var(--ag-primary-500)] text-white rounded-lg hover:bg-[var(--ag-primary-600)]" disabled={loading}>Save</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo</label>
            <div className="flex gap-2 items-center">
              <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} className="flex-1 text-sm" />
              <button onClick={updateAvatarOnly} disabled={!avatarFile || loading} className="px-3 py-2 bg-[var(--ag-primary-500)] text-white rounded-lg hover:bg-[var(--ag-primary-600)] disabled:opacity-50">Upload</button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)] focus:border-transparent"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)] focus:border-transparent"
                placeholder="Enter new password"
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 8 characters with uppercase, lowercase, number, and symbol
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)] focus:border-transparent"
                placeholder="Confirm new password"
              />
            </div>

            {message.text && (
              <div className={`p-3 rounded-lg text-sm ${
                message.type === 'success' 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-[var(--ag-primary-500)] text-white rounded-lg hover:bg-[var(--ag-primary-600)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManageProfileModal;
