import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserCheck, UserX, UserPlus, Activity, TrendingUp, Shield, Calendar, MapPin, ChevronDown, LogOut, User as UserIcon, Leaf } from 'lucide-react';
import authService from '../services/authService';
import api from '../services/api';
import AdminSidebar from '../Components/AdminSidebar';
import ManageProfileModal from '../Components/ManageProfileModal';
import UserManagement from '../Components/UserManagement';
import CropManagement from '../Components/CropManagement';
import SowingCalendarManagement from '../Components/SowingCalendarManagement';
import SchemeManagement from '../Components/SchemeManagement';
import '../styles/dashboard.css';

const StatCard = ({ label, value, icon: Icon, trend, color = 'emerald', subtitle, description }) => {
  const colorConfig = {
    emerald: {
      bg: 'from-emerald-50 to-green-50',
      border: 'border-emerald-200/60',
      iconBg: 'from-emerald-500 to-green-600',
      iconShadow: 'shadow-emerald-500/30',
      text: 'text-emerald-700',
      value: 'text-emerald-900',
      trend: 'text-emerald-600'
    },
    blue: {
      bg: 'from-blue-50 to-cyan-50',
      border: 'border-blue-200/60',
      iconBg: 'from-blue-500 to-cyan-600',
      iconShadow: 'shadow-blue-500/30',
      text: 'text-blue-700',
      value: 'text-blue-900',
      trend: 'text-blue-600'
    },
    purple: {
      bg: 'from-purple-50 to-pink-50',
      border: 'border-purple-200/60',
      iconBg: 'from-purple-500 to-pink-600',
      iconShadow: 'shadow-purple-500/30',
      text: 'text-purple-700',
      value: 'text-purple-900',
      trend: 'text-purple-600'
    },
    amber: {
      bg: 'from-amber-50 to-yellow-50',
      border: 'border-amber-200/60',
      iconBg: 'from-amber-500 to-yellow-600',
      iconShadow: 'shadow-amber-500/30',
      text: 'text-amber-700',
      value: 'text-amber-900',
      trend: 'text-amber-600'
    }
  };

  const config = colorConfig[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden bg-white rounded-lg border ${config.border} p-4 hover:shadow-md hover:shadow-slate-500/10 transition-all duration-300 group`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className={`text-xs font-medium ${config.text} mb-0.5`}>{label}</div>
          <div className={`text-2xl font-bold ${config.value} mb-1`}>{value}</div>
          {subtitle && (
            <div className={`text-[11px] ${config.text} opacity-75`}>{subtitle}</div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-md bg-gradient-to-br ${config.iconBg} text-white flex items-center justify-center shadow-lg ${config.iconShadow} group-hover:scale-105 transition-transform duration-300`}>
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
      </div>
      
      {trend && (
        <div className={`flex items-center gap-1 text-[11px] font-medium ${config.trend}`}>
          <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
          <span>{trend > 0 ? '+' : ''}{trend}% from last month</span>
        </div>
      )}
      
      {description && (
        <div className="mt-2 text-[11px] text-slate-500">{description}</div>
      )}
    </motion.div>
  );
};


const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ totalUsers: 0, adminCount: 0, newUsers7d: 0, blockedUsers: 0, inactiveUsers: 0 });
  const [liveStats, setLiveStats] = useState({ totalUsers: 0, activeUsers: 0, blockedUsers: 0, inactiveUsers: 0, activeQueries: 0, pendingRecommendations: 0 });
  const [dataHealth, setDataHealth] = useState({ usersWithIssues: 0, usersMissingSoilProfile: 0, notes: '' });
  const [logs, setLogs] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/admin/overview');
        setStats(res.data?.stats || {});
        setRecentUsers(res.data?.recentUsers || []);
        const usersRes = await api.get('/admin/users?limit=50');
        setAllUsers(usersRes.data?.users || []);
        const [statsRes, healthRes, logsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/data-health'),
          api.get('/admin/logs?limit=10')
        ]);
        setLiveStats(statsRes.data?.stats || {});
        setDataHealth(healthRes.data?.health || {});
        setLogs(logsRes.data?.logs || []);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(async () => {
      try {
        const statsRes = await api.get('/admin/stats');
        setLiveStats(statsRes.data?.stats || {});
      } catch (_) {}
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Keep current date fresh (minute precision is enough)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const user = authService.getCurrentUser();

  // Open Manage Profile when Settings is selected to match reference UI
  useEffect(() => {
    if (activeTab === 'settings') {
      setProfileModalOpen(true);
    }
  }, [activeTab]);


  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl mx-auto flex items-center justify-center mb-4 animate-pulse">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <p className="text-emerald-700 font-medium">Loading admin panel...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex items-center justify-center p-8">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-red-200/50 p-8 max-w-md text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
          <UserX className="w-8 h-8 text-white" />
        </div>
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex">

      <AdminSidebar active={activeTab} onSelect={setActiveTab} />

      <div className="flex-1 relative">
        {/* Professional Agricultural Header */}
        <header className="bg-white/98 backdrop-blur-xl border-b border-emerald-200/60 sticky top-0 z-40 shadow-xl shadow-emerald-500/10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 h-18">
            <div className="flex items-center justify-between h-full">
              {/* Left Section - Professional Agricultural Branding */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/40 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <Leaf className="w-7 h-7" strokeWidth={2.5} />
                    </div>
                    <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-xl"></div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-300 to-green-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-lg"></div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 via-green-700 to-teal-700 bg-clip-text text-transparent">AgriSense Pro</h1>
                    <p className="text-sm text-emerald-600 font-semibold">Agricultural Management Platform</p>
                  </div>
                </div>
              </div>


              {/* Right Section - Professional Agricultural Controls */}
              <div className="flex items-center gap-4">
                {/* Enhanced Weather Widget */}
                <div className="hidden md:flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-sky-50 via-blue-50 to-cyan-50 border-2 border-sky-200/60 shadow-lg shadow-sky-500/10">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-sm">
                    <div className="font-bold text-slate-900">28°C</div>
                    <div className="text-sky-600 font-medium">Sunny</div>
                  </div>
                  <div className="text-xs text-sky-500">
                    <div>Humidity: 65%</div>
                    <div>Wind: 12 km/h</div>
                  </div>
                </div>


                {/* Enhanced Profile */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen((v) => !v)}
                    className="flex items-center gap-3 pl-3 pr-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 border-2 border-emerald-200/60 transition-all duration-300 group shadow-lg shadow-emerald-500/10"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                      {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-bold text-emerald-900">{user?.name || 'Administrator'}</div>
                      <div className="text-xs text-emerald-600 font-semibold">System Administrator</div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-emerald-500 transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Profile Dropdown Menu */}
                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-emerald-500/20 py-2 z-50 border-2 border-emerald-200/50 overflow-hidden"
                      >
                        <div className="px-4 py-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                              <Shield className="w-6 h-6" strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-emerald-900 truncate">{user?.name || 'Administrator'}</div>
                              <div className="text-xs text-emerald-600 truncate">{user?.email}</div>
                              <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-medium">
                                <Shield className="w-3 h-3 mr-1" />
                                Admin
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="py-2">
                          <button
                            onClick={() => {
                              setProfileOpen(false);
                              setProfileModalOpen(true);
                            }}
                            className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-emerald-50 flex items-center gap-3 transition-colors group"
                          >
                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 group-hover:bg-emerald-200 transition-colors">
                              <UserIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-emerald-900">Manage Profile</div>
                              <div className="text-xs text-emerald-600">Update your information</div>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              setProfileOpen(false);
                              authService.logout();
                              navigate('/');
                            }}
                            className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-red-50 flex items-center gap-3 transition-colors group"
                          >
                            <div className="p-2 bg-red-100 rounded-lg text-red-700 group-hover:bg-red-200 transition-colors">
                              <LogOut className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-red-900">Logout</div>
                              <div className="text-xs text-red-600">Sign out from admin panel</div>
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

        {/* Professional Agricultural Hero Section */}
        {/* Removed empty overview spacer to reduce unused space */}

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6 relative z-10">
          {activeTab === 'overview' && (
          <>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 px-6 lg:px-0">
            <StatCard 
              label="Total Farmers" 
              value={stats.totalUsers || 0} 
              icon={Users} 
              color="emerald" 
              trend={12}
              subtitle="Registered farmers"
              description="Active agricultural community"
            />
            <StatCard 
              label="Active Fields" 
              value={liveStats.activeUsers || 0} 
              icon={() => (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              )} 
              color="blue" 
              trend={8}
              subtitle="Fields under cultivation"
              description="Currently monitored fields"
            />
            <StatCard 
              label="Expert Queries" 
              value={liveStats.activeQueries || 0} 
              icon={() => (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              )} 
              color="purple" 
              trend={15}
              subtitle="Pending responses"
              description="Farmer questions awaiting expert advice"
            />
            <StatCard 
              label="System Health" 
              value="98%" 
              icon={() => (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )} 
              color="amber" 
              trend={2}
              subtitle="Platform uptime"
              description="All agricultural systems operational"
            />
          </div>

          {/* Analytics, weather and alerts removed */}

          {/* System Management Section */}
          <div className="grid gap-6 lg:grid-cols-2 px-6 lg:px-0">
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Recent Activity</h3>
                    <p className="text-xs text-slate-600">System events and updates</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                  Live
                </span>
              </div>
              
              <div className="space-y-4">
                {logs.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg mx-auto flex items-center justify-center mb-3">
                      <Activity className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">No recent activity</p>
                    <p className="text-xs text-slate-400 mt-1">System events will appear here</p>
                  </div>
                ) : (
                  logs.slice(0, 5).map((log, idx) => (
                    <div key={log._id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{log.action}</div>
                        <div className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</div>
                </div>
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                        {log.targetType}
                      </span>
                </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Recent Admin Logs - moved to the right column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative overflow-hidden bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/50 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300"
            >
              <div className="flex items-center justify-between px-6 py-3 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-base font-bold text-emerald-900">Recent Admin Logs</h2>
                </div>
              </div>
              <div className="divide-y divide-emerald-100 max-h-72 overflow-auto custom-scrollbar">
                {logs.length === 0 && (
                  <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl mx-auto flex items-center justify-center mb-3">
                      <Activity className="w-6 h-6 text-emerald-600" />
                    </div>
                    <p className="text-emerald-700 font-medium text-sm">No logs yet</p>
                    <p className="text-xs text-emerald-600 mt-1">Admin activity will appear here</p>
                  </div>
                )}
                {logs.map((log, idx) => (
                  <motion.div
                    key={log._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 hover:bg-emerald-50/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-semibold text-emerald-900 mb-1 text-sm">{log.action}</div>
                        <div className="text-xs text-emerald-600 flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                        {log.targetType}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 px-4 sm:px-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative overflow-hidden bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/50 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300"
            >
              <div className="flex items-center justify-between px-6 py-3 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-base font-bold text-emerald-900">Recent Users</h2>
                </div>
              </div>
              <div className="divide-y divide-emerald-100 max-h-64 overflow-auto custom-scrollbar">
                {recentUsers.length === 0 && (
                  <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl mx-auto flex items-center justify-center mb-3">
                      <Users className="w-6 h-6 text-emerald-600" />
                    </div>
                    <p className="text-emerald-700 font-medium text-sm">No users yet</p>
                  </div>
                )}
                {recentUsers.map((u, idx) => (
                  <motion.div
                    key={u._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 hover:bg-emerald-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {u.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-emerald-900 truncate">{u.name}</div>
                          <div className="text-xs text-emerald-600 truncate">{u.email}</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium capitalize">
                        {u.role}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="relative overflow-hidden bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/50 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-emerald-900">All Users</h2>
                </div>
                <span className="text-xs font-medium text-emerald-600">{allUsers.length} total</span>
              </div>
              <div className="overflow-x-auto max-h-72 custom-scrollbar">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-emerald-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-emerald-900">Name</th>
                      <th className="px-4 py-3 text-xs font-bold text-emerald-900">Email</th>
                      <th className="px-4 py-3 text-xs font-bold text-emerald-900">Role</th>
                      <th className="px-4 py-3 text-xs font-bold text-emerald-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100">
                    {allUsers.map((u, idx) => (
                      <motion.tr
                        key={u._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="hover:bg-emerald-50/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-emerald-900 truncate max-w-[120px]">{u.name}</td>
                        <td className="px-4 py-3 text-emerald-700 truncate max-w-[150px]">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium capitalize">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {u.isBlocked ? (
                            <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
                              Blocked
                            </span>
                          ) : u.isActive === false ? (
                            <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-1.5"></span>
                              Inactive
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                              Active
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
          </>
          )}

          {activeTab === 'users' && (
            <div className="px-4 sm:px-0">
              <UserManagement title="User Management" />
            </div>
          )}

          {activeTab === 'experts' && (
            <div className="px-4 sm:px-0">
              <UserManagement filterRole="expert" title="Expert Management" />
            </div>
          )}

          {activeTab === 'crops' && (
            <div className="px-4 sm:px-0">
              {/* Crop Management */}
              <div className="ag-card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Crop Management</h2>
                <p className="text-gray-600 mb-6">Create and manage crops with description, cultivation details, and image.</p>
                <CropManagement />
              </div>
            </div>
          )}

          {activeTab === 'sowing-calendar' && (
            <div className="px-4 sm:px-0">
              <SowingCalendarManagement />
            </div>
          )}

          {activeTab === 'schemes' && (
            <div className="px-4 sm:px-0">
              <div className="ag-card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Government Schemes</h2>
                <SchemeManagement />
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="px-4 sm:px-0">
              <div className="ag-card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Manage Profile & Security</h2>
                <p className="text-gray-600">Use the dialog to update profile info, profile photo, or change password.</p>
                <div className="mt-4">
                  <button onClick={() => setProfileModalOpen(true)} className="px-4 py-2 bg-[var(--ag-primary-500)] text-white rounded-lg hover:bg-[var(--ag-primary-600)]">Open Manage Profile</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      
      <ManageProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
      />
    </div>
  );
};

export default AdminDashboard;


