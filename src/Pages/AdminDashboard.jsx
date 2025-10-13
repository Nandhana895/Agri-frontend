import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserCheck, UserX, UserPlus, Activity, TrendingUp, Shield, Calendar, MapPin, Bell, ChevronDown, LogOut, User as UserIcon, Leaf } from 'lucide-react';
import authService from '../services/authService';
import api from '../services/api';
import AdminSidebar from '../Components/AdminSidebar';
import ManageProfileModal from '../Components/ManageProfileModal';
import UserManagement from '../Components/UserManagement';
import CropManagement from '../Components/CropManagement';
import SowingCalendarManagement from '../Components/SowingCalendarManagement';
import SchemeManagement from '../Components/SchemeManagement';

const StatCard = ({ label, value, icon: Icon, trend, color = 'emerald' }) => {
  const colorClasses = {
    emerald: 'from-green-500 to-emerald-600',
    blue: 'from-blue-500 to-cyan-600',
    purple: 'from-purple-500 to-pink-600',
    orange: 'from-orange-500 to-amber-600',
    red: 'from-red-500 to-rose-600',
    teal: 'from-teal-500 to-emerald-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/50 p-6 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 group"
    >
      {/* Decorative gradient background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
      
      <div className="relative flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-emerald-700 mb-2">{label}</div>
          <div className="text-3xl font-bold text-gray-900">{value}</div>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
              <span>{Math.abs(trend)}% from last month</span>
            </div>
          )}
        </div>
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white flex items-center justify-center shadow-lg shadow-${color}-500/30 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-7 h-7" strokeWidth={2.5} />
        </div>
      </div>
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex relative overflow-hidden">
      {/* Subtle Agricultural Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <pattern id="admin-agricultural-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M20 5 L20 15 M15 10 L25 10 M20 25 L20 35 M15 30 L25 30" stroke="#10b981" strokeWidth="0.5" fill="none"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#admin-agricultural-pattern)" />
        </svg>
      </div>

      <AdminSidebar active={activeTab} onSelect={setActiveTab} />

      <div className="flex-1 relative">
        {/* Enhanced Admin Header */}
        <header className="bg-white/95 backdrop-blur-xl border-b border-emerald-200/50 sticky top-0 z-40 shadow-lg shadow-emerald-500/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20">
            <div className="flex items-center justify-between h-full">
              {/* Left Section */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/20"></div>
                    <Shield className="w-7 h-7 relative z-10" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-green-700 via-emerald-700 to-teal-700 bg-clip-text text-transparent">
                      Admin Control Panel
                    </h1>
                    <p className="text-xs text-emerald-600 font-medium">AgriSense Management System</p>
                  </div>
                </div>
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-3">
                {/* Current date */}
                <div className="hidden md:flex items-center gap-4 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-800">
                      {now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Notifications */}
                <button className="relative p-2.5 rounded-xl border-2 border-emerald-200/50 bg-white hover:bg-emerald-50 transition-all duration-200 group">
                  <Bell className="w-5 h-5 text-emerald-700 group-hover:scale-110 transition-transform" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-pink-600 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse">
                    2
                  </span>
                </button>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen((v) => !v)}
                    className="flex items-center gap-3 pl-2 pr-4 py-2 rounded-xl border-2 border-emerald-200/50 bg-white text-emerald-800 hover:bg-emerald-50 transition-all duration-200 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-2 ring-white">
                      <Shield className="w-5 h-5" strokeWidth={2.5} />
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-bold text-emerald-900">{user?.name || 'Administrator'}</div>
                      <div className="text-xs text-emerald-600">Admin Access</div>
                    </div>
                    <ChevronDown className={`hidden sm:block w-4 h-4 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
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

        <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8 space-y-8 relative z-10">
          {activeTab === 'overview' && (
          <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-4 sm:px-0">
            <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="emerald" trend={12} />
            <StatCard label="Admins" value={stats.adminCount} icon={Shield} color="purple" />
            <StatCard label="New Users (7d)" value={stats.newUsers7d} icon={UserPlus} color="blue" trend={8} />
            <StatCard label="Active Users" value={liveStats.activeUsers} icon={UserCheck} color="teal" />
            <StatCard label="Blocked Users" value={stats.blockedUsers} icon={UserX} color="red" />
            <StatCard label="Inactive Users" value={stats.inactiveUsers} icon={Activity} color="orange" />
          </div>


          <div className="grid gap-6 lg:grid-cols-2 px-4 sm:px-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative overflow-hidden bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/50 p-6 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-emerald-900">System Activity</h2>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                  Live
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/50">
                  <div className="text-xs font-medium text-blue-700 mb-1">Active Queries</div>
                  <div className="text-2xl font-bold text-blue-900">{liveStats.activeQueries}</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/50">
                  <div className="text-xs font-medium text-purple-700 mb-1">Pending Recommendations</div>
                  <div className="text-2xl font-bold text-purple-900">{liveStats.pendingRecommendations}</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="relative overflow-hidden bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/50 p-6 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                    <Leaf className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-emerald-900">Data Health</h2>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50">
                  <span className="text-sm font-medium text-red-700">Users with issues</span>
                  <span className="text-lg font-bold text-red-900">{dataHealth.usersWithIssues}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/50">
                  <span className="text-sm font-medium text-amber-700">Missing soil profiles</span>
                  <span className="text-lg font-bold text-amber-900">{dataHealth.usersMissingSoilProfile}</span>
                </div>
                {dataHealth.notes && (
                  <p className="text-xs text-emerald-600 mt-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200/50">{dataHealth.notes}</p>
                )}
              </div>
            </motion.div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 px-4 sm:px-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative overflow-hidden bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/50 p-6 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-emerald-900">Admin Controls</h2>
              </div>
              <div className="space-y-3">
                <button
                  onClick={async () => { try { await api.post('/admin/ml/retrain'); alert('Retrain triggered'); } catch (e) { alert(e?.response?.data?.message || 'Failed'); } }}
                  className="w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/30 group"
                >
                  <span className="font-semibold">Trigger Model Retrain</span>
                  <Activity className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                </button>
                <button
                  onClick={async () => { try { await api.post('/admin/ml/refresh-recommendations'); alert('Refresh triggered'); } catch (e) { alert(e?.response?.data?.message || 'Failed'); } }}
                  className="w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/30 group"
                >
                  <span className="font-semibold">Refresh Recommendations</span>
                  <TrendingUp className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => { window.open(`${api.defaults.baseURL}/admin/reports/analytics.csv`, '_blank'); }}
                  className="w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-xl hover:from-gray-800 hover:to-black transition-all shadow-lg shadow-gray-500/30 group"
                >
                  <span className="font-semibold">Download Analytics (CSV)</span>
                  <svg className="w-5 h-5 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
                  </svg>
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="relative overflow-hidden bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/50 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-emerald-900">Recent Admin Logs</h2>
                </div>
              </div>
              <div className="divide-y divide-emerald-100 max-h-72 overflow-auto custom-scrollbar">
                {logs.length === 0 && (
                  <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl mx-auto flex items-center justify-center mb-3">
                      <Activity className="w-6 h-6 text-emerald-600" />
                    </div>
                    <p className="text-emerald-700 font-medium">No logs yet</p>
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
                        <div className="font-semibold text-emerald-900 mb-1">{log.action}</div>
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
              <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-emerald-900">Recent Users</h2>
                </div>
              </div>
              <div className="divide-y divide-emerald-100 max-h-72 overflow-auto custom-scrollbar">
                {recentUsers.length === 0 && (
                  <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl mx-auto flex items-center justify-center mb-3">
                      <Users className="w-6 h-6 text-emerald-600" />
                    </div>
                    <p className="text-emerald-700 font-medium">No users yet</p>
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

          {activeTab === 'irrigation' && (
            <div className="px-4 sm:px-0">
              <div className="ag-card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Irrigation Advisory</h2>
                <p className="text-gray-600">Coming soon: schedules and regional insights.</p>
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


