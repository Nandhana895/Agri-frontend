import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './Pages/landing';
import Login from './Pages/Login';
import Signup from './Pages/Signup';
import Dashboard from './Pages/Dashboard';
import Home from './Pages/UserDashboard/Home';
import CropRecommendation from './Pages/UserDashboard/CropRecommendation';
import SoilAnalyzer from './Pages/UserDashboard/SoilAnalyzer';
import FertilizerCalculator from './Pages/UserDashboard/FertilizerCalculator';
import CropProfiles from './Pages/UserDashboard/CropProfiles';
import Chatbox from './Pages/UserDashboard/Chatbox';
import Reports from './Pages/UserDashboard/Reports';
import AdminDashboard from './Pages/AdminDashboard';
import ExpertDashboard from './Pages/ExpertDashboard';
import ForgotPassword from './Pages/ForgotPassword';
import ResetPassword from './Pages/ResetPassword';
import ProtectedRoute from './Components/ProtectedRoute';
import authService from './services/authService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [loginKey, setLoginKey] = useState(0);
  const [signupKey, setSignupKey] = useState(0);

  useEffect(() => {
    // Check authentication status on app load
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
    };
    
    checkAuth();
    
    // Listen for storage changes (when user logs in/out in another tab)
    window.addEventListener('storage', checkAuth);
    
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleShowLogin = () => {
    console.log('Show login clicked');
    setShowLogin(true);
    setShowSignup(false);
    setLoginKey((k) => k + 1);
  };

  const handleShowSignup = () => {
    console.log('Show signup clicked');
    setShowSignup(true);
    setShowLogin(false);
    setSignupKey((k) => k + 1);
  };

  const closeModals = () => {
    console.log('Closing modals');
    setShowLogin(false);
    setShowSignup(false);
  };

  const switchToSignup = () => {
    console.log('Switching to signup');
    setShowLogin(false);
    setShowSignup(true);
    setSignupKey((k) => k + 1);
  };

  const switchToLogin = () => {
    console.log('Switching to login');
    setShowSignup(false);
    setShowLogin(true);
    setLoginKey((k) => k + 1);
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    closeModals();
    // Redirect based on role after successful auth
    try {
      const user = authService.getCurrentUser();
      if (user?.role === 'admin') {
        window.location.href = '/admin';
      } else if (user?.role === 'expert') {
        window.location.href = '/expert';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (_) {}
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Landing page route */}
          <Route 
            path="/" 
            element={
              <Landing 
                onShowLogin={handleShowLogin}
                onShowSignup={handleShowSignup}
                isAuthenticated={isAuthenticated}
                onLogout={handleLogout}
              />
            } 
          />
          
          {/* Login route */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? (
                (() => {
                  const user = authService.getCurrentUser();
                  return <Navigate to={user?.role === 'admin' ? '/admin' : user?.role === 'expert' ? '/expert' : '/dashboard'} replace />;
                })()
              ) : (
                <Login 
                  key={`route-login-${loginKey}`}
                  onClose={closeModals}
                  onSwitchToSignup={switchToSignup}
                  onAuthSuccess={handleAuthSuccess}
                />
              )
            } 
          />
          
          {/* Signup route */}
          <Route 
            path="/signup" 
            element={
              isAuthenticated ? (
                (() => {
                  const user = authService.getCurrentUser();
                  return <Navigate to={user?.role === 'admin' ? '/admin' : user?.role === 'expert' ? '/expert' : '/dashboard'} replace />;
                })()
              ) : (
                <Signup 
                  key={`route-signup-${signupKey}`}
                  onClose={closeModals}
                  onSwitchToLogin={switchToLogin}
                  onAuthSuccess={handleAuthSuccess}
                />
              )
            } 
          />
          
          {/* Forgot / Reset */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected farmer dashboard with nested routes */}
          <Route 
            path="/dashboard/*" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="crop-recommendation" element={<CropRecommendation />} />
            <Route path="soil-health" element={<SoilAnalyzer />} />
            <Route path="fertilizer" element={<FertilizerCalculator />} />
            <Route path="crop-profiles" element={<CropProfiles />} />
            <Route path="chat" element={<Chatbox />} />
            <Route path="reports" element={<Reports />} />
          </Route>

          {/* Admin dashboard route */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Expert dashboard route */}
          <Route 
            path="/expert" 
            element={
              <ProtectedRoute requireExpert>
                <ExpertDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
        
        {/* Modal overlays for landing page */}
        {showLogin && (
          <Login 
            key={`modal-login-${loginKey}`}
            onClose={closeModals}
            onSwitchToSignup={switchToSignup}
            onAuthSuccess={handleAuthSuccess}
          />
        )}

        {showSignup && (
          <Signup 
            key={`modal-signup-${signupKey}`}
            onClose={closeModals}
            onSwitchToLogin={switchToLogin}
            onAuthSuccess={handleAuthSuccess}
          />
        )}
      </div>
    </Router>
  );
}

export default App;


