import React from 'react';
import { motion } from 'framer-motion';
import MapWithWeather from '../../Components/MapWithWeather';

const WeatherForecast = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
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
              <h2 className="ag-display text-2xl md:text-3xl font-bold text-gray-900">Weather Forecast 🌤️</h2>
              <p className="text-gray-600 mt-1 text-sm md:text-base">Interactive weather map to help you plan your farming activities based on current and forecasted weather conditions.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm text-gray-600">Click on the map to view weather data</p>
                <p className="text-xs text-gray-500">for any location in India</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Weather Map */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="ag-card p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Interactive Weather Map</h3>
        <MapWithWeather />
      </motion.div>

      {/* Weather Tips */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="ag-card p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weather-Based Farming Tips</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">Rainy Weather</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Avoid heavy machinery on wet soil</li>
              <li>• Check drainage systems</li>
              <li>• Monitor for disease outbreaks</li>
              <li>• Consider delayed planting</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">Hot & Dry Weather</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Increase irrigation frequency</li>
              <li>• Apply mulch to retain moisture</li>
              <li>• Water early morning or evening</li>
              <li>• Monitor soil moisture levels</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">Windy Conditions</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Secure greenhouse structures</li>
              <li>• Avoid spraying pesticides</li>
              <li>• Check for wind damage</li>
              <li>• Consider windbreaks</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">Temperature Changes</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Monitor frost warnings</li>
              <li>• Adjust planting schedules</li>
              <li>• Protect sensitive crops</li>
              <li>• Plan harvest timing</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WeatherForecast;
