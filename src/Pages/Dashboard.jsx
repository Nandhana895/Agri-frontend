import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[var(--ag-muted)]">
      <nav className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-[var(--ag-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg ag-cta-gradient text-white flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <h1 className="ag-display text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.name}!{user.role === 'admin' ? ' (Admin)' : ''}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg border border-[var(--ag-border)] text-gray-700 hover:bg-[var(--ag-muted)] transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-4 sm:px-0">
          <div className="ag-card p-6">
            <h3 className="text-lg font-semibold text-gray-900">Account</h3>
            <p className="mt-2 text-gray-600">Signed in as {user.email}</p>
          </div>

          <div className="ag-card p-6">
            <h3 className="text-lg font-semibold text-gray-900">Crop Health</h3>
            <p className="mt-2 text-gray-600">Add sensors and monitor field conditions.</p>
          </div>

          <div className="ag-card p-6">
            <h3 className="text-lg font-semibold text-gray-900">Weather</h3>
            <p className="mt-2 text-gray-600">Connect your location to see forecasts.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 