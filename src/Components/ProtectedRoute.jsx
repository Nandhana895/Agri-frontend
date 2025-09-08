import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

const ProtectedRoute = ({ children, requireAdmin = false, requireExpert = false }) => {
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    // Redirect to landing if not authenticated
    return <Navigate to="/" replace />;
  }

  const user = authService.getCurrentUser();

  // Blocked or deactivated users should not access any protected route
  if (!user || user.isBlocked || user.isActive === false) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (requireExpert && user.role !== 'expert') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute; 