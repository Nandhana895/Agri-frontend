import React, { useEffect, useState } from 'react';
import MapWithWeather from '../../Components/MapWithWeather';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cloud, Droplets, Thermometer, Wind, AlertTriangle, Sun, CloudRain } from 'lucide-react';
import authService from '../../services/authService';
import api from '../../services/api';

const AgriculturalCard = ({ title, children, className = "", icon }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={`bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 ${className}`}
  >
    <div className="flex items-center gap-3 mb-4">
      {icon && (
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 ag-section-title">{title}</h3>
    </div>
    <div className="text-gray-700">{children}</div>
  </motion.div>
);

const MetricCard = ({ label, value, unit, trend, icon, color = "green" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300"
  >
    <div className="flex items-center justify-between mb-3">
      <div className={`w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center`}>
        {icon}
      </div>
      {trend && (
        <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div className="space-y-1">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
      {unit && <p className="text-xs text-gray-500">{unit}</p>}
    </div>
  </motion.div>
);

const QuickActionCard = ({ to, icon, label, description, color = "green" }) => (
  <Link to={to} className="group">
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group-hover:border-green-200"
    >
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 bg-${color}-100 rounded-xl flex items-center justify-center group-hover:bg-${color}-200 transition-colors duration-300`}>
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors duration-300">{label}</h4>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </motion.div>
  </Link>
);

const WeatherWidget = ({ weatherData, loading, error }) => {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Weather Forecast</h3>
          <Cloud className="w-6 h-6" />
        </div>
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <div className="text-sm opacity-90">Loading weather data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Weather Forecast</h3>
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="text-center py-4">
          <div className="text-sm opacity-90">Weather service unavailable</div>
          <Link to="/dashboard/weather-forecast" className="text-xs underline mt-2 block">View Weather Page</Link>
        </div>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Weather Forecast</h3>
          <Cloud className="w-6 h-6" />
        </div>
        <div className="text-center py-4">
          <div className="text-sm opacity-90">No weather data available</div>
          <Link to="/dashboard/weather-forecast" className="text-xs underline mt-2 block">View Weather Page</Link>
        </div>
      </div>
    );
  }

  const getWeatherIcon = (icon) => {
    switch (icon) {
      case '01d': case '01n': return '☀️';
      case '02d': case '02n': case '03d': case '03n': return '⛅';
      case '04d': case '04n': return '☁️';
      case '09d': case '09n': case '10d': case '10n': return '🌧️';
      case '11d': case '11n': return '⛈️';
      case '13d': case '13n': return '❄️';
      case '50d': case '50n': return '🌫️';
      default: return '☀️';
    }
  };

  const hasAlerts = weatherData.alerts && weatherData.alerts.length > 0;
  const hasRecommendations = weatherData.recommendations && weatherData.recommendations.length > 0;

  return (
    <div className={`bg-gradient-to-br ${hasAlerts ? 'from-red-500 to-red-600' : 'from-blue-500 to-blue-600'} rounded-xl p-6 text-white`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Weather Forecast</h3>
        <div className="flex items-center gap-2">
          {hasAlerts && <AlertTriangle className="w-5 h-5" />}
          <Cloud className="w-6 h-6" />
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl mb-1">{getWeatherIcon(weatherData.current.icon)}</div>
          <div className="text-sm font-medium">Today</div>
          <div className="text-lg font-bold">{weatherData.current.temperature}°C</div>
          <div className="text-xs opacity-90 capitalize">{weatherData.current.description}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl mb-1">{getWeatherIcon(weatherData.forecast[1]?.icon)}</div>
          <div className="text-sm font-medium">Tomorrow</div>
          <div className="text-lg font-bold">{weatherData.forecast[1]?.temp}°C</div>
          <div className="text-xs opacity-90 capitalize">{weatherData.forecast[1]?.description}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl mb-1">{getWeatherIcon(weatherData.forecast[2]?.icon)}</div>
          <div className="text-sm font-medium">Day After</div>
          <div className="text-lg font-bold">{weatherData.forecast[2]?.temp}°C</div>
          <div className="text-xs opacity-90 capitalize">{weatherData.forecast[2]?.description}</div>
        </div>
      </div>
      
      {(hasAlerts || hasRecommendations) && (
        <div className="mt-4 p-3 bg-white/20 rounded-lg">
          <div className="text-sm font-medium mb-1">
            {hasAlerts ? '⚠️ Weather Alert' : '🌱 Agricultural Impact'}
          </div>
          <div className="text-xs opacity-90">
            {hasAlerts 
              ? weatherData.alerts[0] 
              : (hasRecommendations ? weatherData.recommendations[0] : 'Good conditions for crop growth')
            }
          </div>
        </div>
      )}
      
      <div className="mt-3 text-center">
        <Link to="/dashboard/weather-forecast" className="text-xs underline">View Full Forecast</Link>
      </div>
    </div>
  );
};

const FarmOverviewCard = ({ fields, crops, health }) => (
  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900">Farm Overview</h3>
    </div>
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-green-700">{fields}</div>
        <div className="text-sm text-gray-600">Active Fields</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-700">{crops}</div>
        <div className="text-sm text-gray-600">Crop Types</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-700">{health}%</div>
        <div className="text-sm text-gray-600">Health Score</div>
      </div>
    </div>
  </div>
);

const RecommendationCard = ({ title, priority, description, action }) => (
  <div className={`p-4 rounded-lg border-l-4 ${
    priority === 'high' ? 'border-red-500 bg-red-50' : 
    priority === 'medium' ? 'border-yellow-500 bg-yellow-50' : 
    'border-green-500 bg-green-50'
  }`}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            priority === 'high' ? 'bg-red-100 text-red-700' : 
            priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 
            'bg-green-100 text-green-700'
          }`}>
            {priority.toUpperCase()}
          </span>
          <h4 className="font-semibold text-gray-900">{title}</h4>
        </div>
        <p className="text-sm text-gray-700 mb-3">{description}</p>
        <button className="text-sm font-medium text-green-700 hover:text-green-800">
          {action} →
        </button>
      </div>
    </div>
  </div>
);

const Home = () => {
  const user = authService.getCurrentUser();
  const firstName = (user?.name || 'Farmer').split(' ')[0];
  const [dashboardData, setDashboardData] = useState({
    stats: {
      activeFields: 12,
      soilTests: 8,
      recommendations: 15,
      irrigationEvents: 24,
      yield: 85,
      costSavings: 12
    },
    recentRecommendations: [
      { title: "Irrigation Schedule Update", priority: "high", description: "Adjust irrigation frequency based on recent rainfall patterns", action: "Update Schedule" },
      { title: "Fertilizer Application", priority: "medium", description: "Apply nitrogen fertilizer to Field A-3 for optimal growth", action: "Schedule Application" },
      { title: "Pest Monitoring", priority: "low", description: "Regular pest monitoring shows healthy crop conditions", action: "View Report" }
    ],
    recentActivities: [
      { title: "Soil test completed for Field B-2", time: "2 hours ago", type: "soil" },
      { title: "Irrigation system activated", time: "4 hours ago", type: "irrigation" },
      { title: "Crop recommendation generated", time: "1 day ago", type: "recommendation" },
      { title: "Weather alert received", time: "2 days ago", type: "weather" }
    ],
    upcomingTasks: [
      { title: "Fertilizer application - Field A-1", dueDate: "Tomorrow", priority: "high" },
      { title: "Soil sampling - Field C-3", dueDate: "In 3 days", priority: "medium" },
      { title: "Equipment maintenance", dueDate: "Next week", priority: "low" }
    ],
    soilHealth: {
      ph: 6.8,
      nitrogen: "Optimal",
      phosphorus: "Good",
      potassium: "Excellent"
    },
    marketData: {
      corn: { price: 245, trend: 2.3 },
      wheat: { price: 312, trend: -1.2 },
      soybeans: { price: 189, trend: 0.8 }
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');

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
    
    // Fetch weather data
    const fetchWeatherData = async () => {
      try {
        setWeatherLoading(true);
        setWeatherError('');
        
        // Get user's location
        const getLocation = () => {
          return new Promise((resolve) => {
            if (!navigator.geolocation) {
              resolve({ lat: 10.8505, lon: 76.2711 }); // Default to Kerala
              return;
            }
            
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  lat: position.coords.latitude,
                  lon: position.coords.longitude
                });
              },
              () => {
                resolve({ lat: 10.8505, lon: 76.2711 }); // Default to Kerala
              },
              { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
            );
          });
        };
        
        const coords = await getLocation();
        const response = await api.get(`/farmer/weather?lat=${coords.lat}&lon=${coords.lon}`);
        
        if (response.data.success) {
          setWeatherData(response.data);
        } else {
          setWeatherError(response.data.message || 'Failed to fetch weather data');
        }
      } catch (err) {
        console.error('Weather fetch error:', err);
        setWeatherError(err?.response?.data?.message || 'Failed to fetch weather data');
      } finally {
        setWeatherLoading(false);
      }
    };
    
    fetchWeatherData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your agricultural dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-lg font-medium">Unable to load dashboard</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Professional Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-green-600 via-green-700 to-green-800 rounded-2xl shadow-2xl overflow-hidden relative ag-fade-up"
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative z-10 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-white">Welcome back, {firstName}</h1>
                  <p className="text-green-100 text-lg">Your Agricultural Command Center</p>
                </div>
              </div>
              <p className="text-green-100 text-lg max-w-2xl leading-relaxed">
                Monitor your farm's performance, optimize crop yields, and make data-driven decisions with our comprehensive agricultural management platform.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/dashboard/reports" 
                className="bg-white text-green-700 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-green-50 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                View Reports
              </Link>
              <Link 
                to="/dashboard/chat" 
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-green-700 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                Ask Expert
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Farm Overview */}
      <FarmOverviewCard 
        fields={dashboardData.stats.activeFields}
        crops={5}
        health={92}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 ag-fade-up">
        <MetricCard
          label="Active Fields"
          value={dashboardData.stats.activeFields}
          unit="fields"
          trend={5}
          icon={<svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" /></svg>}
          color="green"
        />
        <MetricCard
          label="Soil Tests"
          value={dashboardData.stats.soilTests}
          unit="completed"
          trend={12}
          icon={<svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
          color="blue"
        />
        <MetricCard
          label="Yield Potential"
          value={dashboardData.stats.yield}
          unit="%"
          trend={8}
          icon={<svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
          color="yellow"
        />
        <MetricCard
          label="Cost Savings"
          value={dashboardData.stats.costSavings}
          unit="%"
          trend={15}
          icon={<svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>}
          color="purple"
        />
        {/* KPI Rings */}
        <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="ag-card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs tracking-wide text-gray-500">Field Utilization</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">Current season</p>
            </div>
            <div className="ag-kpi-ring" style={{ ['--value']: 78 }}><span>78%</span></div>
          </div>
          <div className="ag-card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs tracking-wide text-gray-500">Water Efficiency</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">Irrigation</p>
            </div>
            <div className="ag-kpi-ring" style={{ ['--value']: 64 }}><span>64%</span></div>
          </div>
          <div className="ag-card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs tracking-wide text-gray-500">Soil Readiness</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">Next sowing</p>
            </div>
            <div className="ag-kpi-ring" style={{ ['--value']: 88 }}><span>88%</span></div>
          </div>
          <div className="ag-card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs tracking-wide text-gray-500">Pest Risk</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">Regional</p>
            </div>
            <div className="ag-kpi-ring" style={{ ['--value']: 22 }}><span>Low</span></div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8 ag-fade-up">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Weather Widget */}
          <WeatherWidget weatherData={weatherData} loading={weatherLoading} error={weatherError} />

          {/* Recommendations */}
          <AgriculturalCard
            title="Smart Recommendations"
            icon={<svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>}
          >
            <div className="space-y-4">
              {(dashboardData.recentRecommendations || []).map((rec, index) => (
                <RecommendationCard
                  key={index}
                  title={rec.title}
                  priority={rec.priority}
                  description={rec.description}
                  action={rec.action}
                />
              ))}
            </div>
          </AgriculturalCard>

          {/* Recent Activity */}
          <AgriculturalCard
            title="Recent Activity"
            icon={<svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>}
          >
            <div className="space-y-4">
              {(dashboardData.recentActivities || []).map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'soil' ? 'bg-green-100' :
                    activity.type === 'irrigation' ? 'bg-blue-100' :
                    activity.type === 'recommendation' ? 'bg-yellow-100' :
                    'bg-gray-100'
                  }`}>
                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </AgriculturalCard>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <AgriculturalCard
            title="Quick Actions"
            icon={<svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>}
          >
            <div className="space-y-4">
              <QuickActionCard
                to="/dashboard/crop-recommendation"
                label="Crop Recommendation"
                description="Get AI-powered crop suggestions"
                icon={<svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h3l2-3 2 6 2-3h3a1 1 0 010 2h-2.382l-2.724 4.086a1 1 0 01-1.793-.217L6.382 9H5a1 1 0 01-1-1H3a1 1 0 01-1 1z" /></svg>}
                color="green"
              />
              <QuickActionCard
                to="/dashboard/soil-health"
                label="Soil Analysis"
                description="Analyze soil health and nutrients"
                icon={<svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                color="blue"
              />
              <QuickActionCard
                to="/dashboard/fertilizer"
                label="Fertilizer Calculator"
                description="Calculate optimal fertilizer needs"
                icon={<svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                color="yellow"
              />
              <QuickActionCard
                to="/dashboard/farm-logbook"
                label="Farm Logbook"
                description="Track your farming activities"
                icon={<svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>}
                color="indigo"
              />
              <QuickActionCard
                to="/dashboard/chat"
                label="Expert Chat"
                description="Connect with agricultural experts"
                icon={<svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>}
                color="purple"
              />
            </div>
          </AgriculturalCard>

          {/* Soil Health */}
          <AgriculturalCard
            title="Soil Health Status"
            icon={<svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
          >
            <div className="space-y-4">
              {dashboardData.soilHealth && dashboardData.soilHealth.ph ? (
                <>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">pH Level</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-green-700">{dashboardData.soilHealth.ph}</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Optimal</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Nitrogen</span>
                    <span className="text-sm font-semibold text-blue-700">{dashboardData.soilHealth.nitrogen || 'Not tested'}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Phosphorus</span>
                    <span className="text-sm font-semibold text-yellow-700">{dashboardData.soilHealth.phosphorus || 'Not tested'}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Potassium</span>
                    <span className="text-sm font-semibold text-purple-700">{dashboardData.soilHealth.potassium || 'Not tested'}</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <p className="text-gray-500 text-sm">No soil data available</p>
                  <p className="text-gray-400 text-xs mt-1">Analyze your soil to see health metrics</p>
                </div>
              )}
            </div>
          </AgriculturalCard>

          {/* Market Insights */}
          <AgriculturalCard
            title="Market Insights"
            icon={<svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>}
          >
            <div className="space-y-3">
              {Object.keys(dashboardData.marketData || {}).length > 0 ? (
                Object.entries(dashboardData.marketData || {}).map(([crop, data]) => (
                  <div key={crop} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-900 capitalize">{crop}</span>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-lg font-bold text-gray-900">${data.price}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          data.trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {data.trend > 0 ? '+' : ''}{data.trend}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-gray-500 text-sm">No market data available</p>
                  <p className="text-gray-400 text-xs mt-1">Market insights will appear here</p>
                </div>
              )}
            </div>
          </AgriculturalCard>
        </div>
      </div>

      {/* Map Section */}
      <AgriculturalCard
        title="Farm Map & Weather"
        icon={<svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>}
        className="lg:col-span-3"
      >
        <MapWithWeather />
      </AgriculturalCard>
    </div>
  );
};

export default Home;