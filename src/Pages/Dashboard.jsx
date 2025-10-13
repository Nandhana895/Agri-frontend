import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home as HomeIcon, Leaf, Sprout, Calculator, FileText, MessageSquare, BarChart3, Bell, Menu, LogOut, User, Calendar, Globe2, BookOpen, Cloud, X, ChevronRight, MapPin } from 'lucide-react';
import ManageProfileModal from '../Components/ManageProfileModal';
import authService from '../services/authService';
import config from '../config/config';

const navItems = [
  { to: '/dashboard', label: 'Home', icon: HomeIcon, description: 'Overview & Dashboard' },
  { to: '/dashboard/crop-recommendation', label: 'Crop Recommendation', icon: Leaf, description: 'AI-powered crop suggestions' },
  { to: '/dashboard/soil-health', label: 'Soil Health Analyzer', icon: Sprout, description: 'Analyze soil composition' },
  { to: '/dashboard/fertilizer', label: 'Fertilizer Calculator', icon: Calculator, description: 'Calculate optimal fertilizer' },
  { to: '/dashboard/crop-profiles', label: 'Crop Profiles', icon: BarChart3, description: 'Detailed crop information' },
  { to: '/dashboard/farm-logbook', label: 'Farm Logbook', icon: BookOpen, description: 'Track farming activities' },
  { to: '/dashboard/sowing-calendar', label: 'Sowing Calendar', icon: Calendar, description: 'Plan your sowing seasons' },
  { to: '/dashboard/government-schemes', label: 'Government Schemes', icon: Globe2, description: 'Explore schemes & benefits' },
  { to: '/dashboard/weather-forecast', label: 'Weather Forecast', icon: Cloud, description: 'Local weather insights' },
  { to: '/dashboard/chat', label: 'Chatbox', icon: MessageSquare, description: 'Get instant help' },
  { to: '/dashboard/reports', label: 'Reports', icon: FileText, description: 'View analytics & reports' },
];

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [now, setNow] = useState(() => new Date());
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('ag_lang') || 'en';
    } catch(_) {
      return 'en';
    }
  });
  const location = useLocation();
  const navigate = useNavigate();


  useEffect(() => {
    setUser(authService.getCurrentUser());
    
    // Listen for user updates from profile modal
    const handleUserUpdate = (event) => {
      setUser(event.detail);
    };
    
    window.addEventListener('userUpdated', handleUserUpdate);
    
    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, []);

  // Keep a fresh date/time for the topbar display
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Resolve and display user location in the topbar
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
    function loadLocation() {
      if (!('geolocation' in navigator)) {
        setLocationLabel('');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords || {};
          if (typeof latitude === 'number' && typeof longitude === 'number') {
            reverseGeocode(latitude, longitude);
          } else {
            setLocationLabel('');
          }
        },
        () => setLocationLabel(''),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
      );
    }
    loadLocation();
    return () => { cancelled = true; };
  }, []);

  // When language changes here, persist and broadcast so inner pages can react
  const handleLanguageChange = (next) => {
    setLang(next);
    try { localStorage.setItem('ag_lang', next); } catch(_) {}
    try { window.dispatchEvent(new CustomEvent('langChanged', { detail: next })); } catch(_) {}
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const getProfileImageUrl = (avatarUrl) => {
    if (!avatarUrl) return null;
    // If it's already a full URL, return as is
    if (avatarUrl.startsWith('http')) return avatarUrl;
    // Otherwise, construct the full URL
    return `${new URL(config.API_URL).origin}${avatarUrl}`;
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex relative overflow-hidden">
      {/* Subtle Agricultural Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <pattern id="agricultural-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M20 5 L20 15 M15 10 L25 10 M20 25 L20 35 M15 30 L25 30" stroke="#10b981" strokeWidth="0.5" fill="none"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#agricultural-pattern)" />
        </svg>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -240, opacity: 0 }}
        animate={{ x: isSidebarOpen ? 0 : -240, opacity: isSidebarOpen ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        className={`${isSidebarOpen ? 'w-72' : 'w-0'} bg-white/95 backdrop-blur-xl border-r border-emerald-200/50 shadow-2xl shadow-emerald-500/5 fixed md:sticky top-0 h-screen z-50 overflow-hidden`}
      >
        <div className="h-full flex flex-col">
          {/* Logo Header with Agricultural Theme */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-emerald-100 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/20"></div>
                <Leaf className="w-7 h-7 relative z-10" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">AgriSense</h1>
                <p className="text-xs text-emerald-600 font-medium">Smart Farming Platform</p>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-2 hover:bg-emerald-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Navigation with Enhanced Design */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
            {navItems.map(({ to, label, icon: Icon, description }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                  className={`group relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-[1.02]'
                      : 'text-gray-700 hover:bg-emerald-50 hover:scale-[1.01]'
                  }`}
                >
                  <div className={`p-2 rounded-lg transition-all ${
                    active 
                      ? 'bg-white/20' 
                      : 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200'
                  }`}>
                    <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{label}</div>
                    <div className={`text-xs truncate ${active ? 'text-emerald-100' : 'text-gray-500'}`}>
                      {description}
                    </div>
                  </div>
                  {active && (
                    <ChevronRight className="w-4 h-4 text-white/80" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer with Agricultural Quote */}
          <div className="p-4 border-t border-emerald-100 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/50">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                  <Sprout className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-emerald-900 mb-1">Growing Together</p>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    "Cultivating success, one harvest at a time"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Content */}
      <div className="flex-1 min-w-0 relative">
        {/* Topbar with Enhanced Agricultural Design */}
        <header className="bg-white/95 backdrop-blur-xl border-b border-emerald-200/50 sticky top-0 z-40 shadow-lg shadow-emerald-500/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20">
            <div className="flex items-center justify-between h-full">
              {/* Left Section */}
              <div className="flex items-center gap-4">
                <button 
                  className="md:hidden p-2.5 hover:bg-emerald-50 rounded-xl transition-all duration-200 border border-emerald-200/50" 
                  onClick={() => setIsSidebarOpen((v) => !v)}
                >
                  <Menu className="w-5 h-5 text-emerald-700" />
                </button>
                <div className="hidden sm:block">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-green-700 via-emerald-700 to-teal-700 bg-clip-text text-transparent">
                    Farm Dashboard
                  </h1>
                  <p className="text-xs text-emerald-600 font-medium">Welcome back, {user?.name?.split(' ')[0] || 'Farmer'}!</p>
                </div>
              </div>

              {/* Center - Search Bar */}
              <div className="hidden lg:flex items-center flex-1 justify-center px-8 max-w-2xl">
                <div className="w-full relative group">
                  <svg className="w-5 h-5 text-emerald-500 absolute left-4 top-1/2 -translate-y-1/2 transition-all group-focus-within:text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7"/>
                    <path d="M21 21l-4.3-4.3"/>
                  </svg>
                  <input
                    type="search"
                    placeholder="Search features, crops, tools, or get help..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-emerald-200/50 bg-emerald-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 placeholder:text-emerald-600/60 text-sm font-medium text-gray-700 transition-all"
                  />
                  <kbd className="hidden md:inline-flex items-center px-2 py-1 rounded bg-white border border-emerald-200 text-emerald-700 text-xs absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="text-xs">⌘K</span>
                  </kbd>
                </div>
              </div>

              {/* Right Section - Actions */}
              <div className="flex items-center gap-2">
                {/* Language Selector */}
                <select
                  value={lang}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-emerald-200/50 bg-white text-emerald-700 hover:bg-emerald-50 font-medium text-sm transition-all cursor-pointer focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none"
                >
                  <option value="en">🌐 English</option>
                  <option value="ml">🌐 Malayalam</option>
                </select>

                {/* Date & Location */}
                <div className="hidden lg:flex items-center gap-4 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-800">
                      {now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  {locationLabel && (
                    <>
                      <div className="w-px h-4 bg-emerald-300"></div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-medium text-emerald-800 truncate max-w-[10rem]" title={locationLabel}>
                          {locationLabel.split(',')[0]}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Notifications */}
                <button className="relative p-2.5 rounded-xl border-2 border-emerald-200/50 bg-white hover:bg-emerald-50 transition-all duration-200 group">
                  <Bell className="w-5 h-5 text-emerald-700 group-hover:scale-110 transition-transform" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-pink-600 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse">
                    3
                  </span>
                </button>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setIsProfileOpen((v) => !v)} 
                    className="flex items-center gap-3 pl-2 pr-4 py-2 rounded-xl border-2 border-emerald-200/50 bg-white text-emerald-800 hover:bg-emerald-50 transition-all duration-200 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 text-white flex items-center justify-center overflow-hidden shadow-lg shadow-emerald-500/30 ring-2 ring-white">
                      {user?.avatarUrl ? (
                        <img 
                          src={getProfileImageUrl(user.avatarUrl)} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center ${user?.avatarUrl ? 'hidden' : 'flex'} bg-gradient-to-br from-green-600 to-emerald-600 font-bold text-sm`}>
                        {getInitials(user?.name || 'F')}
                      </div>
                    </div>
                    <span className="hidden sm:block font-semibold text-sm truncate max-w-[8rem]">{user?.name || 'Farmer'}</span>
                    <svg className={`hidden sm:block w-4 h-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>

                  {/* Profile Dropdown Menu */}
                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-3 w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-emerald-500/20 py-2 z-50 border-2 border-emerald-200/50 overflow-hidden"
                      >
                        {/* Profile Header */}
                        <div className="px-4 py-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 text-white flex items-center justify-center overflow-hidden shadow-lg shadow-emerald-500/30">
                              {user?.avatarUrl ? (
                                <img 
                                  src={getProfileImageUrl(user.avatarUrl)} 
                                  alt="Profile" 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className={`w-full h-full flex items-center justify-center ${user?.avatarUrl ? 'hidden' : 'flex'} bg-gradient-to-br from-green-600 to-emerald-600 font-bold text-lg`}>
                                {getInitials(user?.name || 'U')}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-emerald-900 truncate">{user?.name || 'User'}</div>
                              <div className="text-xs text-emerald-600 truncate">{user?.email}</div>
                              <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                                Active
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          <button 
                            onClick={() => { setIsManageOpen(true); setIsProfileOpen(false); }} 
                            className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-emerald-50 flex items-center gap-3 transition-colors group"
                          >
                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 group-hover:bg-emerald-200 transition-colors">
                              <User className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-emerald-900">Manage Profile</div>
                              <div className="text-xs text-emerald-600">Update your information</div>
                            </div>
                          </button>
                          <button 
                            onClick={handleLogout} 
                            className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-red-50 flex items-center gap-3 transition-colors group"
                          >
                            <div className="p-2 bg-red-100 rounded-lg text-red-700 group-hover:bg-red-200 transition-colors">
                              <LogOut className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-red-900">Logout</div>
                              <div className="text-xs text-red-600">Sign out from your account</div>
                            </div>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Routed content */}
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative z-10">
          <Outlet />
        </main>
      </div>

      {/* Manage Profile Modal */}
      {isManageOpen && (
        <ManageProfileModal isOpen={isManageOpen} onClose={() => setIsManageOpen(false)} user={user} />
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgb(240 253 244);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgb(34 197 94), rgb(16 185 129));
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, rgb(22 163 74), rgb(5 150 105));
        }

        /* Agricultural animations */
        @keyframes gentle-wave {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        .ag-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.2);
        }
      `}</style>
    </div>
  );
};

export default Dashboard;