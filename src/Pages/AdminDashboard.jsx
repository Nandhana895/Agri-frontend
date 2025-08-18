import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import api from '../services/api';
import AdminSidebar from '../Components/AdminSidebar';

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

const MiniLineChart = ({ points }) => {
  const width = 280;
  const height = 90;
  const maxVal = Math.max(...points, 1);
  const coords = points.map((v, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - (v / maxVal) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="text-[var(--ag-primary-500)]">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={coords} />
    </svg>
  );
};

const MiniBarChart = ({ values }) => {
  const height = 90;
  const maxVal = Math.max(...values, 1);
  const barWidth = 20;
  const gap = 12;
  const width = values.length * (barWidth + gap);
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="text-[var(--ag-primary-500)]">
      {values.map((v, i) => {
        const h = (v / maxVal) * (height - 8);
        const x = i * (barWidth + gap);
        const y = height - h;
        return <rect key={i} x={x} y={y} width={barWidth} height={h} rx="3" className="fill-[var(--ag-primary-400)]" />;
      })}
    </svg>
  );
};

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ totalUsers: 0, adminCount: 0, newUsers7d: 0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/admin/overview');
        setStats(res.data?.stats || {});
        setRecentUsers(res.data?.recentUsers || []);
        const usersRes = await api.get('/admin/users?limit=50');
        setAllUsers(usersRes.data?.users || []);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const user = authService.getCurrentUser();

  const trendData = useMemo(() => [12, 18, 10, 22, 28, 24, 32, 29, 35, 31, 38, 42], []);
  const irrigationUsage = useMemo(() => [30, 42, 25, 48, 36, 52, 45], []);

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
              <input placeholder="Search..." className="hidden md:block px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none" />
              <button className="p-2 rounded-lg border border-[var(--ag-border)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
              </button>
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
          </div>

          <div className="grid gap-6 lg:grid-cols-2 px-4 sm:px-0">
            <div className="ag-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Crop Trends</h2>
              </div>
              <MiniLineChart points={trendData} />
            </div>
            <div className="ag-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Irrigation Usage</h2>
              </div>
              <MiniBarChart values={irrigationUsage} />
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
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((u) => (
                    <tr key={u._id} className="border-b border-[var(--ag-border)]">
                      <td className="px-4 py-2 font-medium text-gray-900">{u.name}</td>
                      <td className="px-4 py-2 text-gray-700">{u.email}</td>
                      <td className="px-4 py-2 capitalize text-gray-700">{u.role}</td>
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
              <div className="ag-card overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-[var(--ag-border)] bg-[var(--ag-muted)]">
                  <h2 className="font-semibold text-gray-900">Users</h2>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--ag-muted)] border-b border-[var(--ag-border)]">
                    <tr>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((u) => (
                      <tr key={u._id} className="border-b border-[var(--ag-border)]">
                        <td className="px-4 py-2 font-medium text-gray-900">{u.name}</td>
                        <td className="px-4 py-2 text-gray-700">{u.email}</td>
                        <td className="px-4 py-2 capitalize text-gray-700">{u.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'crops' && (
            <div className="px-4 sm:px-0">
              <div className="ag-card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Crop Database</h2>
                <p className="text-gray-600">Coming soon: manage crops, ideal soil, NPK ranges, and sowing times.</p>
              </div>
            </div>
          )}

          {activeTab === 'pests' && (
            <div className="px-4 sm:px-0">
              <div className="ag-card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Pest & Disease Monitoring</h2>
                <p className="text-gray-600">Coming soon: review reports and ML predictions.</p>
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

          {activeTab === 'reports' && (
            <div className="px-4 sm:px-0">
              <div className="ag-card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Reports & Logs</h2>
                <p className="text-gray-600">Coming soon: PDF export and farm logbook history.</p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="px-4 sm:px-0">
              <div className="ag-card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">System Settings</h2>
                <p className="text-gray-600">Coming soon: API monitoring, error logs, and caching status.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;


