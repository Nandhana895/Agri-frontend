import React, { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';

const SoilAnalyzer = () => {
  const [form, setForm] = useState({ 
    ph: '', 
    organicMatter: '', 
    moisture: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    soilType: '',
    location: ''
  });
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const payload = {
        ph: form.ph ? parseFloat(form.ph) : null,
        organicMatter: form.organicMatter ? parseFloat(form.organicMatter) : null,
        moisture: form.moisture ? parseFloat(form.moisture) : null,
        nitrogen: form.nitrogen ? parseFloat(form.nitrogen) : null,
        phosphorus: form.phosphorus ? parseFloat(form.phosphorus) : null,
        potassium: form.potassium ? parseFloat(form.potassium) : null,
        soilType: form.soilType,
        location: form.location
      };
      
      const response = await api.post('/farmer/soil-analysis', payload);
      
      if (response.data?.success) {
        setAnalysis(response.data.data);
      } else {
        setError(response.data?.message || 'Failed to analyze soil');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to analyze soil');
    } finally {
      setLoading(false);
    }
  };

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
        <div className="ag-hero-gradient p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="ag-display text-2xl md:text-3xl font-bold text-gray-900">Soil Health Analyzer</h2>
              <p className="text-gray-600 mt-1 text-sm md:text-base">Analyze your soil composition and get detailed recommendations for optimal crop growth.</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.form onSubmit={handleSubmit} className="ag-card p-6 space-y-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-lg font-semibold text-gray-900">Soil Test Data</h3>
          
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Soil pH *</label>
              <input 
                name="ph" 
                type="number" 
                step="0.1"
                min="0" 
                max="14"
                value={form.ph} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" 
                required 
                placeholder="e.g., 6.5"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Organic Matter (%)</label>
              <input 
                name="organicMatter" 
                type="number" 
                step="0.1"
                min="0" 
                max="100"
                value={form.organicMatter} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" 
                placeholder="e.g., 2.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Moisture Content (%)</label>
              <input 
                name="moisture" 
                type="number" 
                step="0.1"
                min="0" 
                max="100"
                value={form.moisture} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" 
                placeholder="e.g., 25"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Soil Type</label>
              <select 
                name="soilType" 
                value={form.soilType} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
              >
                <option value="">Select soil type</option>
                <option value="clay">Clay</option>
                <option value="sandy">Sandy</option>
                <option value="loamy">Loamy</option>
                <option value="silty">Silty</option>
                <option value="peaty">Peaty</option>
                <option value="chalky">Chalky</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">Nutrient Analysis (Optional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Nitrogen (mg/kg)</label>
                <input 
                  name="nitrogen" 
                  type="number" 
                  step="0.1"
                  value={form.nitrogen} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" 
                  placeholder="e.g., 40"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Phosphorus (mg/kg)</label>
                <input 
                  name="phosphorus" 
                  type="number" 
                  step="0.1"
                  value={form.phosphorus} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" 
                  placeholder="e.g., 35"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Potassium (mg/kg)</label>
                <input 
                  name="potassium" 
                  type="number" 
                  step="0.1"
                  value={form.potassium} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" 
                  placeholder="e.g., 50"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Location (Optional)</label>
            <input 
              name="location" 
              type="text"
              value={form.location} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" 
              placeholder="e.g., Field A, North Section"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--ag-primary-500)] text-white py-2 rounded-lg hover:bg-[var(--ag-primary-600)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Analyze Soil Health'}
          </button>
        </motion.form>

        <motion.div className="ag-card p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h3>
          {analysis ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${
                analysis.overallHealth === 'Excellent' ? 'bg-green-50 border-green-200' :
                analysis.overallHealth === 'Good' ? 'bg-blue-50 border-blue-200' :
                analysis.overallHealth === 'Fair' ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}>
                <h4 className="font-medium text-gray-900 mb-2">Overall Soil Health</h4>
                <p className={`text-lg font-semibold ${
                  analysis.overallHealth === 'Excellent' ? 'text-green-800' :
                  analysis.overallHealth === 'Good' ? 'text-blue-800' :
                  analysis.overallHealth === 'Fair' ? 'text-yellow-800' :
                  'text-red-800'
                }`}>
                  {analysis.overallHealth}
                </p>
                <p className="text-sm text-gray-600 mt-1">{analysis.healthDescription}</p>
              </div>

              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-medium text-gray-900">Recommendations:</h5>
                  <ul className="space-y-1 text-sm">
                    {analysis.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[var(--ag-primary-500)] mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.fertilizerRecommendations && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-1">Fertilizer Recommendations:</h5>
                  <p className="text-blue-800 text-sm">{analysis.fertilizerRecommendations}</p>
                </div>
              )}

              {analysis.cropSuitability && (
                <div className="space-y-2">
                  <h5 className="font-medium text-gray-900">Suitable Crops:</h5>
                  <div className="flex flex-wrap gap-2">
                    {analysis.cropSuitability.map((crop, i) => (
                      <span key={i} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {crop}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <p className="text-gray-500 text-sm">Enter your soil test data to get detailed analysis</p>
              <p className="text-gray-400 text-xs mt-1">Provide accurate measurements for best results</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SoilAnalyzer;


