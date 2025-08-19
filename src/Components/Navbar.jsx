import React, { useState } from 'react';
import authService from '../services/authService';

const Navbar = ({ onShowLogin, onShowSignup, isAuthenticated, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  
  const currentUser = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    onLogout();
    setIsProfileDropdownOpen(false);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-[var(--ag-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center ag-cta-gradient text-white">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            <span className="text-xl ag-display font-bold text-gray-900">AgriSense</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-gray-700 hover:text-[var(--ag-primary-600)] font-medium">Home</a>
            <a href="#features" className="text-gray-700 hover:text-[var(--ag-primary-600)] font-medium">Features</a>
            <a href="#about" className="text-gray-700 hover:text-[var(--ag-primary-600)] font-medium">About</a>
            
            {!isAuthenticated ? (
              // Show Login/Signup when not authenticated
              <>
                {/* <button 
                  onClick={onShowLogin}
                  className="text-gray-700 hover:text-[var(--ag-primary-600)] font-medium px-4 py-2 rounded-lg border border-[var(--ag-border)] hover:border-[var(--ag-primary-600)] transition-colors"
                >
                  Login
                </button> */}
                <button 
                  onClick={onShowSignup}
                  className="ag-cta-gradient text-white px-6 py-2 rounded-lg hover:opacity-95 transition-opacity font-medium shadow-md"
                >
                  Sign Up
                </button>
              </>
            ) : (
              // Show User Profile when authenticated
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-3 text-gray-700 hover:text-green-600 transition-colors focus:outline-none"
                >
                  {/* Profile Picture */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ag-cta-gradient">
                    {getInitials(currentUser?.name || 'U')}
                  </div>
                  {/* Username */}
                  <span className="font-medium">{currentUser?.name || 'User'}</span>
                  {/* Dropdown Arrow */}
                  <svg 
                    className={`w-4 h-4 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Profile Dropdown */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        // Navigate to manage account (you can implement this later)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[var(--ag-muted)] transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Manage Account</span>
                      </div>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[var(--ag-muted)] transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Logout</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="space-y-2">
              <a href="#home" className="block px-4 py-2 text-gray-700 hover:text-green-600">Home</a>
              <a href="#features" className="block px-4 py-2 text-gray-700 hover:text-green-600">Features</a>
              <a href="#about" className="block px-4 py-2 text-gray-700 hover:text-green-600">About</a>
              
              {!isAuthenticated ? (
                // Show Login/Signup when not authenticated
                <div className="px-4 py-2 space-y-2">
                  <button 
                    onClick={onShowLogin}
                    className="w-full text-gray-700 hover:text-green-600 font-medium px-4 py-2 rounded-lg border border-gray-300 hover:border-green-600 transition-colors"
                  >
                    Login
                  </button>
                  <button 
                    onClick={onShowSignup}
                    className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Sign Up
                  </button>
                </div>
              ) : (
                // Show User Profile when authenticated
                <div className="px-4 py-2 space-y-2">
                  <div className="flex items-center space-x-3 px-4 py-2">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {getInitials(currentUser?.name || 'U')}
                    </div>
                    <span className="font-medium text-gray-700">{currentUser?.name || 'User'}</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      // Navigate to manage account (you can implement this later)
                    }}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors rounded-lg"
                  >
                    Manage Account
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors rounded-lg"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
