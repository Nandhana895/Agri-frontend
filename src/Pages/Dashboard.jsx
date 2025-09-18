import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home as HomeIcon, Leaf, Sprout, Calculator, FileText, MessageSquare, BarChart3, Bell, Menu, LogOut, User, Cloud, Calendar } from 'lucide-react';
import ManageProfileModal from '../Components/ManageProfileModal';
import authService from '../services/authService';

const navItems = [
  { to: '/dashboard', label: 'Home', icon: HomeIcon },
  { to: '/dashboard/crop-recommendation', label: 'Crop Recommendation', icon: Leaf },
  { to: '/dashboard/soil-health', label: 'Soil Health Analyzer', icon: Sprout },
  { to: '/dashboard/fertilizer', label: 'Fertilizer Calculator', icon: Calculator },
  { to: '/dashboard/crop-profiles', label: 'Crop Profiles', icon: BarChart3 },
  { to: '/dashboard/weather-forecast', label: 'Weather Forecast', icon: Cloud },
  { to: '/dashboard/sowing-calendar', label: 'Sowing Calendar', icon: Calendar },
  { to: '/dashboard/chat', label: 'Chatbox', icon: MessageSquare },
  { to: '/dashboard/reports', label: 'Reports', icon: FileText },
];

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [user, setUser] = useState(null);
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

  return (
    <div className="min-h-screen bg-[var(--ag-muted)] flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -240, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        className={`${isSidebarOpen ? 'w-64' : 'w-0'} bg-white border-r border-[var(--ag-border)] hidden md:block`}
      >
        <div className="h-16 flex items-center gap-2 px-4 border-b border-[var(--ag-border)]">
          <div className="w-9 h-9 rounded-lg ag-cta-gradient text-white flex items-center justify-center">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a4 4 0 00-4 4v1H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2V6a4 4 0 00-4-4z"/></svg>
          </div>
          <span className="ag-display text-lg font-semibold text-gray-900">AgriSense</span>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${active ? 'bg-[var(--ag-primary-50)] text-[var(--ag-primary-700)]' : 'text-gray-700 hover:bg-[var(--ag-muted)]'}`}>
                <Icon className="w-5 h-5" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>
      </motion.aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Topbar */}
        <header className="bg-white/80 backdrop-blur border-b border-[var(--ag-border)] sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="md:hidden p-2" onClick={() => setIsSidebarOpen((v) => !v)}>
                <Menu className="w-5 h-5 text-gray-700" />
              </button>
              <h1 className="ag-display text-xl font-semibold text-gray-900">Farmer Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Language selector (English / Malayalam) visible on all farmer pages */}
              <select
                value={lang}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="hidden sm:block px-3 py-2 rounded-lg border border-[var(--ag-border)] text-gray-700 hover:bg-[var(--ag-muted)]"
              >
                <option value="en">English</option>
                <option value="ml">Malayalam</option>
              </select>
              <button className="p-2 rounded-lg border border-[var(--ag-border)] hover:bg-[var(--ag-muted)]">
                <Bell className="w-5 h-5 text-gray-700" />
              </button>
              <div className="relative">
                <button onClick={() => setIsProfileOpen((v) => !v)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--ag-border)] text-gray-700 hover:bg-[var(--ag-muted)]">
                  <div className="w-6 h-6 rounded-full bg-[var(--ag-primary-100)] text-[var(--ag-primary-700)] flex items-center justify-center overflow-hidden">
                    {user?.avatarUrl ? (
                      <img 
                        src={(user.avatarUrl && (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${window.location.origin}${user.avatarUrl}`)) || ''} 
                        alt="avatar" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <span>{user?.name || 'Farmer'}</span>
                  <svg className={`w-4 h-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-[var(--ag-border)]">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--ag-primary-100)] text-[var(--ag-primary-700)] flex items-center justify-center overflow-hidden">
                          {user?.avatarUrl ? (
                            <img 
                              src={user.avatarUrl} 
                              alt="avatar" 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <span className="text-sm font-semibold">
                              {(user?.name || 'U').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user?.name || 'User'}</div>
                          <div className="text-xs text-gray-500">{user?.email}</div>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => { setIsManageOpen(true); setIsProfileOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[var(--ag-muted)] flex items-center gap-2">
                      <User className="w-4 h-4" /> Manage Profile
                    </button>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[var(--ag-muted)] flex items-center gap-2">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Routed content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      {isManageOpen && (
        <ManageProfileModal isOpen={isManageOpen} onClose={() => setIsManageOpen(false)} user={user} />)
      }
    </div>
  );
};

export default Dashboard;