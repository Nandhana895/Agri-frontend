import React, { useEffect, useState } from 'react';
import MapWithWeather from '../../Components/MapWithWeather';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import authService from '../../services/authService';
import api from '../../services/api';

const Card = ({ title, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="ag-card p-6"
  >
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <div className="text-gray-700 text-sm">{children}</div>
  </motion.div>
);

const Kpi = ({ label, value, delta, positive }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    className="ag-card p-5"
  >
    <p className="text-xs tracking-wide text-gray-500">{label}</p>
    <div className="flex items-end justify-between mt-2">
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <span className={`${positive ? 'text-green-600' : 'text-red-600'} text-xs font-medium`}> {delta} </span>
    </div>
  </motion.div>
);

const QuickAction = ({ to, icon, label }) => (
  <Link to={to} className="group ag-card p-4 hover:shadow-lg transition-shadow">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg ag-cta-gradient text-white flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900 group-hover:text-[var(--ag-primary-600)]">{label}</p>
        <p className="text-xs text-gray-500">Open</p>
      </div>
    </div>
  </Link>
);

const Home = () => {
  const user = authService.getCurrentUser();
  const firstName = (user?.name || 'Farmer').split(' ')[0];
  const [dashboardData, setDashboardData] = useState({
    stats: {
      activeFields: 0,
      soilTests: 0,
      recommendations: 0,
      irrigationEvents: 0
    },
    recentRecommendations: [],
    recentActivities: [],
    upcomingTasks: [],
    soilHealth: {
      ph: null,
      nitrogen: null,
      phosphorus: null,
      potassium: null
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/farmer/dashboard');
        if (response.data?.success) {
          setDashboardData(response.data.data || dashboardData);
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--ag-primary-500)] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ag-card p-6 text-center">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-lg font-medium">Unable to load dashboard</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-[var(--ag-primary-500)] text-white rounded-lg hover:bg-[var(--ag-primary-600)]"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="ag-card overflow-hidden relative"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-20 ag-cta-gradient blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-20 w-72 h-72 rounded-full opacity-10 ag-cta-gradient blur-3xl" />
        <div className="ag-hero-gradient p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="ag-display text-2xl md:text-3xl font-bold text-gray-900">Welcome back, {firstName} 🌿</h2>
              <p className="text-gray-600 mt-1 text-sm md:text-base">Monitor your farm's performance and get intelligent insights to optimize your agricultural practices.</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/dashboard/reports" className="ag-cta-gradient text-white px-4 py-2 rounded-lg text-sm shadow hover:opacity-95 self-start md:self-auto">View Reports</Link>
              <Link to="/dashboard/chat" className="text-[var(--ag-primary-600)] px-4 py-2 rounded-lg text-sm border border-[var(--ag-border)] hover:border-[var(--ag-primary-600)] bg-white/60 backdrop-blur">Ask Expert</Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <div className="ag-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs tracking-wide text-gray-500">Active Fields</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--ag-field-200)] text-[var(--ag-primary-600)]">Live</span>
          </div>
          <div className="flex items-end justify-between mt-2">
            <p className="text-2xl font-semibold text-gray-900">{dashboardData.stats.activeFields}</p>
            <span className="text-gray-500 text-xs font-medium">Total</span>
          </div>
        </div>
        <div className="ag-card p-5">
          <p className="text-xs tracking-wide text-gray-500">Soil Tests</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-2xl font-semibold text-gray-900">{dashboardData.stats.soilTests}</p>
            <span className="text-gray-500 text-xs font-medium">Completed</span>
          </div>
        </div>
        <div className="ag-card p-5">
          <p className="text-xs tracking-wide text-gray-500">Recommendations</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-2xl font-semibold text-gray-900">{dashboardData.stats.recommendations}</p>
            <span className="text-gray-500 text-xs font-medium">Available</span>
          </div>
        </div>
        <div className="ag-card p-5">
          <p className="text-xs tracking-wide text-gray-500">Irrigation Events</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-2xl font-semibold text-gray-900">{dashboardData.stats.irrigationEvents}</p>
            <span className="text-gray-500 text-xs font-medium">This Month</span>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recommendations */}
        <Card title="Recent Recommendations">
          {dashboardData.recentRecommendations.length > 0 ? (
            <ul className="list-disc pl-5 space-y-2">
              {dashboardData.recentRecommendations.map((r, i) => (
                <li key={i} className="text-sm">{r}</li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-4">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="text-gray-500 text-sm">No recommendations yet</p>
              <p className="text-gray-400 text-xs mt-1">Get crop recommendations to see suggestions here</p>
            </div>
          )}
        </Card>

        {/* Soil status */}
        <Card title="Soil Health Snapshot">
          {dashboardData.soilHealth.ph ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Soil pH</span>
                <span className="font-medium text-gray-900">
                  {dashboardData.soilHealth.ph} • {dashboardData.soilHealth.ph >= 6 && dashboardData.soilHealth.ph <= 7 ? 'Optimal' : 'Needs Adjustment'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Nitrogen</span>
                <span className="font-medium text-gray-900">{dashboardData.soilHealth.nitrogen || 'Not tested'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Phosphorus</span>
                <span className="font-medium text-gray-900">{dashboardData.soilHealth.phosphorus || 'Not tested'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Potassium</span>
                <span className="font-medium text-gray-900">{dashboardData.soilHealth.potassium || 'Not tested'}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <p className="text-gray-500 text-sm">No soil data available</p>
              <p className="text-gray-400 text-xs mt-1">Analyze your soil to see health metrics</p>
            </div>
          )}
        </Card>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickAction
              to="/dashboard/crop-recommendation"
              label="Get Crop Recommendation"
              icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h3l2-3 2 6 2-3h3a1 1 0 010 2h-2.382l-2.724 4.086a1 1 0 01-1.793-.217L6.382 9H5a1 1 0 01-1-1H3a1 1 0 01-1 1z" /></svg>}
            />
            <QuickAction
              to="/dashboard/soil-health"
              label="Analyze Soil"
              icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 7H7v6h6V7z" /><path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm10 12H5V5h10v10z" clipRule="evenodd"/></svg>}
            />
            <QuickAction
              to="/dashboard/fertilizer"
              label="Fertilizer Planner"
              icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a1 1 0 000 2h12a1 1 0 100-2H4z"/><path fillRule="evenodd" d="M3 7a2 2 0 012-2h10a2 2 0 012 2v7a3 3 0 01-3 3H6a3 3 0 01-3-3V7zm5 2a1 1 0 100 2h4a1 1 0 100-2H8z" clipRule="evenodd"/></svg>}
            />
            <QuickAction
              to="/dashboard/chat"
              label="Ask Assistant"
              icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M18 13a1 1 0 01-1 1H7l-4 3V4a1 1 0 011-1h13a1 1 0 011 1v9z"/></svg>}
            />
          </div>
        </motion.div>

        {/* Insights banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="lg:col-span-3 ag-card p-6 ag-hero-gradient"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-sm text-gray-600">Smart Insight</p>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">Expected rainfall in your region this weekend. Plan irrigation accordingly.</h3>
            </div>
            <Link to="/dashboard/reports" className="ag-cta-gradient text-white px-4 py-2 rounded-lg text-sm shadow hover:opacity-95 w-max">View Weather Report</Link>
          </div>
        </motion.div>

        {/* Activity */}
        <Card title="Recent Activity">
          {dashboardData.recentActivities.length > 0 ? (
            <ul className="divide-y divide-[var(--ag-border)]">
              {dashboardData.recentActivities.map((a, i) => (
                <li key={i} className="py-3 flex items-center justify-between">
                  <span className="text-sm text-gray-800">{a.title}</span>
                  <span className="text-xs text-gray-500">{a.time}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-4">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-sm">No recent activity</p>
              <p className="text-gray-400 text-xs mt-1">Your farming activities will appear here</p>
            </div>
          )}
        </Card>

        {/* Interactive Map + Weather */}
        <Card title="Map & Climate">
          <MapWithWeather />
        </Card>
        
        <Card title="Upcoming Tasks">
          {dashboardData.upcomingTasks.length > 0 ? (
            <ul className="space-y-2">
              {dashboardData.upcomingTasks.map((task, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span>{task.title}</span>
                  <span className="text-xs text-gray-500">{task.dueDate}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-4">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p className="text-gray-500 text-sm">No upcoming tasks</p>
              <p className="text-gray-400 text-xs mt-1">Tasks and reminders will appear here</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Home;


