import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import UserModal from './UserModal';
import UserActions from './UserActions';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'

  const fetchUsers = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search })
      });
      
      const response = await api.get(`/admin/users?${params}`);
      
      if (response.data.success) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.pages);
        setCurrentPage(response.data.pagination.page);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers(1, searchTerm);
  };

  const toggleSelect = (userId) => {
    setSelectedIds((prev) => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const handleBulkStatus = async (isActive) => {
    try {
      if (selectedIds.length === 0) return;
      setActionLoading(true);
      await api.post('/admin/users/bulk-status', { userIds: selectedIds, isActive });
      setSelectedIds([]);
      fetchUsers(currentPage, searchTerm);
    } catch (err) {
      setError(err.response?.data?.message || 'Bulk action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchUsers(page, searchTerm);
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleUserAction = async (action, userId) => {
    try {
      setError(''); // Clear any previous errors
      setActionLoading(true);
      let response;
      
      switch (action) {
        case 'block':
          response = await api.patch(`/admin/users/${userId}/block`, { isBlocked: true });
          break;
        case 'unblock':
          response = await api.patch(`/admin/users/${userId}/block`, { isBlocked: false });
          break;
        case 'activate':
          response = await api.patch(`/admin/users/${userId}/status`, { isActive: true });
          break;
        case 'deactivate':
          response = await api.patch(`/admin/users/${userId}/status`, { isActive: false });
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            response = await api.delete(`/admin/users/${userId}`);
          } else {
            return;
          }
          break;
        default:
          return;
      }

      if (response.data.success) {
        // Refresh the users list
        fetchUsers(currentPage, searchTerm);
      }
    } catch (err) {
      console.error('User action error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          `Failed to ${action} user`;
      setError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    fetchUsers(currentPage, searchTerm);
  };

  const getStatusBadge = (user) => {
    if (user.isBlocked) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Blocked</span>;
    }
    if (!user.isActive) {
      return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Inactive</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>;
  };

  const getRoleBadge = (role) => {
    const colors = role === 'admin' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-blue-100 text-blue-800';
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
        </div>
        <button
          onClick={handleCreateUser}
          className="px-4 py-2 bg-[var(--ag-primary-500)] text-white rounded-lg hover:bg-[var(--ag-primary-600)] transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add User
        </button>
      </div>

      {/* Search and Filters */}
      <div className="ag-card p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--ag-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Search
          </button>
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              disabled={selectedIds.length === 0 || actionLoading}
              onClick={() => handleBulkStatus(true)}
              className="px-3 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
            >Activate Selected</button>
            <button
              type="button"
              disabled={selectedIds.length === 0 || actionLoading}
              onClick={() => handleBulkStatus(false)}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50"
            >Deactivate Selected</button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="ag-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--ag-muted)] border-b border-[var(--ag-border)]">
              <tr>
                <th className="px-6 py-3">
                  
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ag-border)]">
              {users.map((user) => (
                <motion.tr
                  key={user._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(user._id)}
                      onChange={() => toggleSelect(user._id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-[var(--ag-primary-500)] text-white flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin 
                      ? new Date(user.lastLogin).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <UserActions
                      user={user}
                      onEdit={handleEditUser}
                      onView={handleViewUser}
                      onAction={handleUserAction}
                      loading={actionLoading}
                    />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-[var(--ag-border)] bg-[var(--ag-muted)]">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-[var(--ag-border)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-[var(--ag-border)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        user={selectedUser}
        mode={modalMode}
      />
    </div>
  );
};

export default UserManagement;
