import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    // Redirect to landing if not authenticated
    return <Navigate to="/" replace />;
  }

  if (requireAdmin) {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute; 