import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import authService from '../../services/authService';

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

  const recommendations = [
    'Irrigate early morning to reduce evaporation.',
    'Rotate crops to improve soil health and reduce pests.',
    'Mulch to conserve moisture and suppress weeds.'
  ];

  const activities = [
    { title: 'Soil test uploaded', time: '2h ago' },
    { title: 'New crop recommendation generated', time: 'Yesterday' },
    { title: 'Fertilizer plan updated', time: '3 days ago' }
  ];

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
              <h2 className="ag-display text-2xl md:text-3xl font-bold text-gray-900">Good day, {firstName} 🌿</h2>
              <p className="text-gray-600 mt-1 text-sm md:text-base">Here’s a quick glance at your farm’s health and priorities today.</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/dashboard/reports" className="ag-cta-gradient text-white px-4 py-2 rounded-lg text-sm shadow hover:opacity-95 self-start md:self-auto">View Reports</Link>
              <Link to="/dashboard/chat" className="text-[var(--ag-primary-600)] px-4 py-2 rounded-lg text-sm border border-[var(--ag-border)] hover:border-[var(--ag-primary-600)] bg-white/60 backdrop-blur">Ask Assistant</Link>
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
            <p className="text-2xl font-semibold text-gray-900">6</p>
            <span className="text-green-600 text-xs font-medium">+1 this week</span>
          </div>
          <div className="mt-2"><svg viewBox="0 0 100 28" className="w-full h-8"><path d="M0 20 L10 22 L20 18 L30 16 L40 12 L50 14 L60 10 L70 12 L80 8 L90 10 L100 6" fill="none" stroke="url(#g1)" strokeWidth="2"/><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#34a853"/><stop offset="100%" stopColor="#5ac178"/></linearGradient></defs></svg></div>
        </div>
        <div className="ag-card p-5">
          <p className="text-xs tracking-wide text-gray-500">Soil Tests</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-2xl font-semibold text-gray-900">12</p>
            <span className="text-green-600 text-xs font-medium">+2 this month</span>
          </div>
          <div className="mt-2"><svg viewBox="0 0 100 28" className="w-full h-8"><path d="M0 24 L10 20 L20 22 L30 18 L40 16 L50 12 L60 14 L70 12 L80 10 L90 8 L100 6" fill="none" stroke="#60a5fa" strokeWidth="2"/></svg></div>
        </div>
        <div className="ag-card p-5">
          <p className="text-xs tracking-wide text-gray-500">Recommendations</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-2xl font-semibold text-gray-900">8</p>
            <span className="text-red-600 text-xs font-medium">-1 pending</span>
          </div>
          <div className="mt-2"><svg viewBox="0 0 100 28" className="w-full h-8"><path d="M0 6 L10 10 L20 8 L30 12 L40 10 L50 14 L60 12 L70 16 L80 14 L90 18 L100 16" fill="none" stroke="#8d6e63" strokeWidth="2"/></svg></div>
        </div>
        <div className="ag-card p-5">
          <p className="text-xs tracking-wide text-gray-500">Irrigation Events</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-2xl font-semibold text-gray-900">14</p>
            <span className="text-green-600 text-xs font-medium">+3 this week</span>
          </div>
          <div className="mt-2"><svg viewBox="0 0 100 28" className="w-full h-8"><path d="M0 18 L10 16 L20 14 L30 12 L40 10 L50 8 L60 10 L70 8 L80 6 L90 8 L100 10" fill="none" stroke="#34a853" strokeWidth="2"/></svg></div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recommendations */}
        <Card title="Recent Recommendations">
          <ul className="list-disc pl-5 space-y-2">
            {recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </Card>

        {/* Soil status */}
        <Card title="Soil Health Snapshot">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm"><span>Soil pH</span><span className="font-medium text-gray-900">6.5 • Optimal</span></div>
            <div className="flex items-center justify-between text-sm"><span>Nitrogen</span><span className="font-medium text-gray-900">Medium</span></div>
            <div className="flex items-center justify-between text-sm"><span>Phosphorus</span><span className="font-medium text-gray-900">Adequate</span></div>
            <div className="flex items-center justify-between text-sm"><span>Potassium</span><span className="font-medium text-gray-900">Low</span></div>
          </div>
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
          <ul className="divide-y divide-[var(--ag-border)]">
            {activities.map((a, i) => (
              <li key={i} className="py-3 flex items-center justify-between">
                <span className="text-sm text-gray-800">{a.title}</span>
                <span className="text-xs text-gray-500">{a.time}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Weather + tasks */}
        <Card title="Today’s Weather">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full ag-cta-gradient text-white flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M7.05 7.05L5.636 5.636m12.728 0l-1.414 1.414M7.05 16.95l-1.414 1.414"/></svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">28°C</p>
              <p className="text-sm text-gray-600">Partly cloudy • Light breeze</p>
            </div>
          </div>
        </Card>
        <Card title="Upcoming Tasks">
          <ul className="space-y-2">
            <li className="flex items-center justify-between text-sm"><span>Inspect irrigation pipes</span><span className="text-xs text-gray-500">Today</span></li>
            <li className="flex items-center justify-between text-sm"><span>Apply potassium to Field 3</span><span className="text-xs text-gray-500">Tomorrow</span></li>
            <li className="flex items-center justify-between text-sm"><span>Upload soil test results</span><span className="text-xs text-gray-500">In 3 days</span></li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Home;


