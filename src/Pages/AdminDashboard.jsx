import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import api from '../services/api';
import AdminSidebar from '../Components/AdminSidebar';
import ManageProfileModal from '../Components/ManageProfileModal';
import UserManagement from '../Components/UserManagement';
import CropManagement from '../Components/CropManagement';
import SowingCalendarManagement from '../Components/SowingCalendarManagement';
import SchemeManagement from '../Components/SchemeManagement';

const SidebarLink = ({ icon, label, active }) => (
  <div className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer ${active ? 'bg-[var(--ag-primary-50)] text-[var(--ag-primary-700)]' : 'text-gray-700 hover:bg-[var(--ag-muted)]'}`}>
    {icon}
    <span>{label}</span>
  </div>
);

const StatCard = ({ label, value, icon }) => (
  <div className="ag-card p-6">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-600">{label}</div>
        <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
      </div>
      <div className="w-10 h-10 rounded-lg ag-cta-gradient text-white flex items-center justify-center">
        {icon}
      </div>
    </div>
  </div>
);


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


  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-[var(--ag-muted)] flex">
      <AdminSidebar active={activeTab} onSelect={setActiveTab} />

      <div className="flex-1">
        <header className="bg-white/80 backdrop-blur border-b border-[var(--ag-border)] sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg ag-cta-gradient text-white flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a4 4 0 00-4 4v1H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2V6a4 4 0 00-4-4z"/></svg>
              </div>
              <h1 className="ag-display text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Current date */}
              <div className="hidden sm:flex items-center gap-2 px-2 text-gray-600">
                <svg className="w-4 h-4 text-[var(--ag-primary-600)]" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2a1 1 0 011 1v1h10V3a1 1 0 112 0v1h1a2 2 0 012 2v12a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 112 0v1zm-3 6v10a1 1 0 001 1h16a1 1 0 001-1V8H3z"/></svg>
                <span className="text-sm">
                  {now.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--ag-border)] text-gray-700 hover:bg-[var(--ag-muted)]"
                >
                  <span>{user?.name || 'Administrator'} (Admin)</span>
                  <svg className={`w-4 h-4 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-[var(--ag-border)]">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        setProfileModalOpen(true);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[var(--ag-muted)]"
                    >
                      Manage Profile
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        authService.logout();
                        navigate('/');
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[var(--ag-muted)]"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8 space-y-8">
          {activeTab === 'overview' && (
          <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-4 sm:px-0">
            <StatCard label="Total Users" value={stats.totalUsers} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5V9H2v11h5m10 0V9m0 11V9M7 20V9"/></svg>} />
            <StatCard label="Admins" value={stats.adminCount} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7a4 4 0 118 0 4 4 0 01-8 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>} />
            <StatCard label="New in 7d" value={stats.newUsers7d} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7H7v6m0 0h6m-6 0l8 8"/></svg>} />
            <StatCard label="Active Users" value={liveStats.activeUsers} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c-3.866 0-7 3.134-7 7"/></svg>} />
            <StatCard label="Blocked Users" value={stats.blockedUsers} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 6L6 18"/></svg>} />
            <StatCard label="Inactive Users" value={stats.inactiveUsers} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>} />
          </div>


          <div className="grid gap-6 lg:grid-cols-2 px-4 sm:px-0">
            <div className="ag-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">System Activity</h2>
                <span className="text-sm text-gray-500">updates every 10s</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="ag-stat-tile"><div className="text-sm text-gray-600">Active Queries</div><div className="text-2xl font-semibold">{liveStats.activeQueries}</div></div>
                <div className="ag-stat-tile"><div className="text-sm text-gray-600">Pending Recs</div><div className="text-2xl font-semibold">{liveStats.pendingRecommendations}</div></div>
              </div>
            </div>
            <div className="ag-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Data Health</h2>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div>Users with issues: <span className="font-semibold">{dataHealth.usersWithIssues}</span></div>
                <div>Missing soil profiles: <span className="font-semibold">{dataHealth.usersMissingSoilProfile}</span></div>
                <div className="text-gray-500">{dataHealth.notes}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 px-4 sm:px-0">
            <div className="ag-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Admin Controls</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={async () => { try { await api.post('/admin/ml/retrain'); alert('Retrain triggered'); } catch (e) { alert(e?.response?.data?.message || 'Failed'); } }}
                  className="px-4 py-2 bg-[var(--ag-primary-500)] text-white rounded-lg hover:bg-[var(--ag-primary-600)]"
                >Trigger Model Retrain</button>
                <button
                  onClick={async () => { try { await api.post('/admin/ml/refresh-recommendations'); alert('Refresh triggered'); } catch (e) { alert(e?.response?.data?.message || 'Failed'); } }}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                >Refresh Recommendations</button>
                <button
                  onClick={() => { window.open(`${api.defaults.baseURL}/admin/reports/analytics.csv`, '_blank'); }}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
                >Download Analytics (CSV)</button>
              </div>
            </div>
            <div className="ag-card overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-[var(--ag-border)] bg-[var(--ag-muted)]">
                <h2 className="font-semibold text-gray-900">Recent Admin Logs</h2>
              </div>
              <div className="divide-y divide-[var(--ag-border)] max-h-64 overflow-auto">
                {logs.length === 0 && <div className="p-4 text-gray-600">No logs yet.</div>}
                {logs.map((log) => (
                  <div key={log._id} className="p-4 text-sm text-gray-700 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{log.action}</div>
                      <div className="text-gray-500">{new Date(log.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-gray-500">{log.targetType}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 px-4 sm:px-0">
            <div className="ag-card overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-[var(--ag-border)] bg-[var(--ag-muted)]">
                <h2 className="font-semibold text-gray-900">Recent Users</h2>
              </div>
              <div className="divide-y divide-[var(--ag-border)]">
                {recentUsers.length === 0 && <div className="p-4 text-gray-600">No users yet.</div>}
                {recentUsers.map((u) => (
                  <div key={u._id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{u.name}</div>
                      <div className="text-sm text-gray-600">{u.email}</div>
                    </div>
                    <div className="text-sm text-gray-700">{u.role}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="ag-card overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-[var(--ag-border)] bg-[var(--ag-muted)]">
                <h2 className="font-semibold text-gray-900">All Users (latest)</h2>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--ag-muted)] border-b border-[var(--ag-border)]">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Role</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((u) => (
                    <tr key={u._id} className="border-b border-[var(--ag-border)]">
                      <td className="px-4 py-2 font-medium text-gray-900">{u.name}</td>
                      <td className="px-4 py-2 text-gray-700">{u.email}</td>
                      <td className="px-4 py-2 capitalize text-gray-700">{u.role}</td>
                      <td className="px-4 py-2">
                        {u.isBlocked ? (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Blocked</span>
                        ) : u.isActive === false ? (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Inactive</span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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


