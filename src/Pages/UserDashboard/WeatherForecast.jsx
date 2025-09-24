import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Droplets, Thermometer, Wind, AlertTriangle, Sun, CloudRain, CloudSnow, Zap, Eye, RefreshCw } from 'lucide-react';
import api from '../../services/api';

const WeatherIcon = ({ icon, size = 'w-8 h-8' }) => {
  const getIcon = () => {
    switch (icon) {
      case '01d': case '01n': return <Sun className={size} />;
      case '02d': case '02n': case '03d': case '03n': return <Cloud className={size} />;
      case '04d': case '04n': return <Cloud className={size} />;
      case '09d': case '09n': case '10d': case '10n': return <CloudRain className={size} />;
      case '11d': case '11n': return <Zap className={size} />;
      case '13d': case '13n': return <CloudSnow className={size} />;
      case '50d': case '50n': return <Eye className={size} />;
      default: return <Sun className={size} />;
    }
  };

  return (
    <div className="text-yellow-500">
      {getIcon()}
    </div>
  );
};

const WeatherCard = ({ title, children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 ${className}`}
  >
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    {children}
  </motion.div>
);

const CurrentWeatherCard = ({ current, location }) => (
  <WeatherCard title="Current Weather" className="bg-gradient-to-br from-blue-50 to-blue-100">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <WeatherIcon icon={current.icon} size="w-16 h-16" />
        <div>
          <div className="text-4xl font-bold text-gray-900">{current.temperature}°C</div>
          <div className="text-lg text-gray-600 capitalize">{current.description}</div>
        </div>
      </div>
      <div className="text-right text-sm text-gray-600">
        <div>Lat: {location.lat.toFixed(2)}</div>
        <div>Lon: {location.lon.toFixed(2)}</div>
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-4">
      <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
        <Droplets className="w-5 h-5 text-blue-600" />
        <div>
          <div className="text-sm text-gray-600">Humidity</div>
          <div className="font-semibold">{current.humidity}%</div>
        </div>
      </div>
      <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
        <CloudRain className="w-5 h-5 text-blue-600" />
        <div>
          <div className="text-sm text-gray-600">Rainfall</div>
          <div className="font-semibold">{current.rainfall}</div>
        </div>
      </div>
      <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
        <Wind className="w-5 h-5 text-blue-600" />
        <div>
          <div className="text-sm text-gray-600">Wind</div>
          <div className="font-semibold">{current.wind} km/h</div>
        </div>
      </div>
      <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
        <Thermometer className="w-5 h-5 text-blue-600" />
        <div>
          <div className="text-sm text-gray-600">Feels Like</div>
          <div className="font-semibold">{current.temperature}°C</div>
        </div>
      </div>
    </div>
  </WeatherCard>
);

const ForecastCard = ({ day, temp, tempMin, rain, description, icon }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all duration-300"
  >
    <div className="text-center">
      <div className="text-sm font-medium text-gray-600 mb-2">{day}</div>
      <WeatherIcon icon={icon} size="w-8 h-8" className="mx-auto mb-2" />
      <div className="text-lg font-bold text-gray-900">{temp}°</div>
      <div className="text-sm text-gray-600">{tempMin}°</div>
      <div className="text-xs text-blue-600 mt-1">{rain}</div>
      <div className="text-xs text-gray-500 mt-1 capitalize">{description}</div>
    </div>
  </motion.div>
);

const AlertBanner = ({ alerts }) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-6"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <div className="font-semibold text-red-800">Weather Alerts</div>
      </div>
      <div className="mt-2 space-y-1">
        {alerts.map((alert, index) => (
          <div key={index} className="text-sm text-red-700">{alert}</div>
        ))}
      </div>
    </motion.div>
  );
};

const RecommendationsCard = ({ recommendations }) => {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <WeatherCard title="Agricultural Recommendations" className="bg-gradient-to-br from-green-50 to-green-100">
      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-white/50 rounded-lg">
            <div className="text-green-600 mt-0.5">🌱</div>
            <div className="text-sm text-gray-700">{rec}</div>
          </div>
        ))}
      </div>
    </WeatherCard>
  );
};

const WeatherForecast = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          // Fallback to default location (Kerala, India)
          console.warn('Geolocation failed, using default location:', error);
          resolve({ lat: 10.8505, lon: 76.2711 });
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
    });
  };

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      setError('');

      const coords = await getLocation();
      setLocation(coords);

      const response = await api.get(`/farmer/weather?lat=${coords.lat}&lon=${coords.lon}`);
      
      if (response.data.success) {
        setWeatherData(response.data);
        setLastUpdated(new Date());
      } else {
        setError(response.data.message || 'Failed to fetch weather data');
      }
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError(err?.response?.data?.message || 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading weather data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-600" />
        <h3 className="text-lg font-semibold mb-2">Weather Service Unavailable</h3>
        <p className="text-sm mb-4">{error}</p>
        <button 
          onClick={fetchWeatherData}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No weather data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
            <div>
          <h2 className="text-2xl font-bold text-gray-900">🌦️ Weather Forecast</h2>
          <p className="text-gray-600">Real-time weather data and agricultural recommendations</p>
        </div>
        <button 
          onClick={fetchWeatherData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
          </div>

      {lastUpdated && (
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
      )}

      {/* Alerts */}
      <AlertBanner alerts={weatherData.alerts} />

      {/* Current Weather */}
      <CurrentWeatherCard current={weatherData.current} location={weatherData.location} />

      {/* 5-Day Forecast */}
      <WeatherCard title="5-Day Forecast">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {weatherData.forecast.map((day, index) => (
            <ForecastCard
              key={index}
              day={day.day}
              temp={day.temp}
              tempMin={day.tempMin}
              rain={day.rain}
              description={day.description}
              icon={day.icon}
            />
          ))}
        </div>
      </WeatherCard>

      {/* Agricultural Recommendations */}
      <RecommendationsCard recommendations={weatherData.recommendations} />
    </div>
  );
};

export default WeatherForecast;