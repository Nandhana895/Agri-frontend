import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import config from '../config/config';

const Navbar = ({ onShowLogin, onShowSignup, isAuthenticated, onLogout, onShowProfileModal }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [locationLabel, setLocationLabel] = useState('');
  
  const currentUser = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    onLogout();
    setIsProfileDropdownOpen(false);
  };

  useEffect(() => {
    let cancelled = false;
    async function reverseGeocode(lat, lon) {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        const a = data.address || {};
        const city = a.city || a.town || a.village || a.hamlet || a.county;
        const state = a.state || a.region;
        const label = city && state ? `${city}, ${state}` : (data.display_name || `${lat.toFixed(2)}, ${lon.toFixed(2)}`);
        if (!cancelled) setLocationLabel(label);
      } catch (_) {
        if (!cancelled) setLocationLabel('Location unavailable');
      }
    }
    async function loadLocation() {
      if (!isAuthenticated) {
        setLocationLabel('');
        return;
      }
      if (!('geolocation' in navigator)) {
        setLocationLabel('Location unavailable');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords || {};
          if (typeof latitude === 'number' && typeof longitude === 'number') {
            reverseGeocode(latitude, longitude);
          } else {
            setLocationLabel('Location unavailable');
          }
        },
        () => setLocationLabel('Location blocked'),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
      );
    }
    loadLocation();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getProfileImageUrl = (avatarUrl) => {
    if (!avatarUrl) return null;
    // If it's already a full URL, return as is
    if (avatarUrl.startsWith('http')) return avatarUrl;
    // Otherwise, construct the full URL
    return `${new URL(config.API_URL).origin}${avatarUrl}`;
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 border-b border-[var(--ag-border)] shadow-sm">
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
            <a href="#home" className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-200">Home</a>
            <a href="#services" className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-200">Solutions</a>
            <a href="#about" className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-200">About</a>
            <a href="#contact" className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-200">Contact</a>
            {isAuthenticated && locationLabel && (
              <div className="flex items-center text-gray-600 gap-2">
                <svg className="w-4 h-4 text-[var(--ag-primary-600)]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C8.686 2 6 4.686 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.314-2.686-6-6-6zm0 8.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
                </svg>
                <span className="text-sm truncate max-w-[14rem]" title={locationLabel}>{locationLabel}</span>
              </div>
            )}
            
            {!isAuthenticated ? (
              // Show Login/Signup when not authenticated
              <>
                <button 
                  onClick={onShowLogin}
                  className="text-gray-700 hover:text-green-600 font-medium px-4 py-2 rounded-lg border border-gray-300 hover:border-green-600 transition-colors"
                >
                  Request Quote
                </button>
                <button 
                  onClick={onShowSignup}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                >
                  Get Started
                </button>
              </>
            ) : (
              // Show User Profile when authenticated
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-3 text-gray-700 hover:text-[var(--ag-primary-600)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-200)] focus:ring-opacity-50 rounded-lg px-2 py-1"
                >
                  {/* Profile Picture */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ag-cta-gradient overflow-hidden">
                    {currentUser?.avatarUrl ? (
                      <img 
                        src={getProfileImageUrl(currentUser.avatarUrl)} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center ${currentUser?.avatarUrl ? 'hidden' : 'flex'} ag-cta-gradient`}>
                      {getInitials(currentUser?.name || 'U')}
                    </div>
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
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 z-50 border border-gray-200 backdrop-blur-sm">
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        if (onShowProfileModal) {
                          onShowProfileModal();
                        }
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[var(--ag-muted)] transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Manage Profile</span>
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
              <a href="#services" className="block px-4 py-2 text-gray-700 hover:text-green-600">Solutions</a>
              <a href="#about" className="block px-4 py-2 text-gray-700 hover:text-green-600">About</a>
              <a href="#contact" className="block px-4 py-2 text-gray-700 hover:text-green-600">Contact</a>
              
              {!isAuthenticated ? (
                // Show Login/Signup when not authenticated
                <div className="px-4 py-2 space-y-2">
                  <button 
                    onClick={onShowLogin}
                    className="w-full text-gray-700 hover:text-green-600 font-medium px-4 py-2 rounded-lg border border-gray-300 hover:border-green-600 transition-colors"
                  >
                    Request Quote
                  </button>
                  <button 
                    onClick={onShowSignup}
                    className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Get Started
                  </button>
                </div>
              ) : (
                // Show User Profile when authenticated
                <div className="px-4 py-2 space-y-2">
                  {locationLabel && (
                    <div className="flex items-center gap-2 px-4 py-2 text-gray-600">
                      <svg className="w-4 h-4 text-[var(--ag-primary-600)]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 2C8.686 2 6 4.686 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.314-2.686-6-6-6zm0 8.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
                      </svg>
                      <span className="text-sm truncate" title={locationLabel}>{locationLabel}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3 px-4 py-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ag-cta-gradient overflow-hidden">
                      {currentUser?.avatarUrl ? (
                        <img 
                          src={getProfileImageUrl(currentUser.avatarUrl)} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center ${currentUser?.avatarUrl ? 'hidden' : 'flex'} ag-cta-gradient`}>
                        {getInitials(currentUser?.name || 'U')}
                      </div>
                    </div>
                    <span className="font-medium text-gray-700">{currentUser?.name || 'User'}</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (onShowProfileModal) {
                        onShowProfileModal();
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors rounded-lg"
                  >
                    Manage Profile
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
