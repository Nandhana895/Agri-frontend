import React, { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';

const FertilizerCalculator = () => {
  const [form, setForm] = useState({ 
    area: '', 
    crop: '', 
    soilType: '',
    ph: '',
    nitrogen: '',
    phosphorus: '',
    potassium: ''
  });
  const [dosage, setDosage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const payload = {
        area: parseFloat(form.area),
        crop: form.crop,
        soilType: form.soilType,
        ph: form.ph ? parseFloat(form.ph) : null,
        nitrogen: form.nitrogen ? parseFloat(form.nitrogen) : null,
        phosphorus: form.phosphorus ? parseFloat(form.phosphorus) : null,
        potassium: form.potassium ? parseFloat(form.potassium) : null
      };
      
      const response = await api.post('/farmer/fertilizer-calculator', payload);
      
      if (response.data?.success) {
        setDosage(response.data.data);
      } else {
        setError(response.data?.message || 'Failed to calculate fertilizer dosage');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to calculate fertilizer dosage');
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
              <h2 className="ag-display text-2xl md:text-3xl font-bold text-gray-900">Fertilizer Calculator</h2>
              <p className="text-gray-600 mt-1 text-sm md:text-base">Calculate precise fertilizer requirements based on your soil conditions and crop needs.</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.form onSubmit={handleSubmit} className="ag-card p-6 space-y-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-lg font-semibold text-gray-900">Farm Details</h3>
          
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Land Area (acres) *</label>
              <input 
                name="area" 
                type="number" 
                step="0.1"
                value={form.area} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" 
                required 
                placeholder="e.g., 2.5"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Crop Type *</label>
              <select 
                name="crop" 
                value={form.crop} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" 
                required
              >
                <option value="">Select crop</option>
                <option value="wheat">Wheat</option>
                <option value="rice">Rice</option>
                <option value="maize">Maize</option>
                <option value="sugarcane">Sugarcane</option>
                <option value="cotton">Cotton</option>
                <option value="potato">Potato</option>
                <option value="tomato">Tomato</option>
                <option value="onion">Onion</option>
                <option value="other">Other</option>
              </select>
            </div>
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
            </select>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">Soil Analysis (Optional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Soil pH</label>
                <input 
                  name="ph" 
                  type="number" 
                  step="0.1"
                  min="0" 
                  max="14"
                  value={form.ph} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" 
                  placeholder="e.g., 6.5"
                />
              </div>
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

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--ag-primary-500)] text-white py-2 rounded-lg hover:bg-[var(--ag-primary-600)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Calculating...' : 'Calculate Fertilizer Requirements'}
          </button>
        </motion.form>

        <motion.div className="ag-card p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fertilizer Recommendations</h3>
          {dosage ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Recommended Dosage</h4>
                <p className="text-green-800">
                  Apply approximately <span className="font-semibold">{dosage.totalAmount} kg</span> of fertilizer for {form.crop} on {form.area} acres.
                </p>
              </div>
              
              {dosage.breakdown && (
                <div className="space-y-2">
                  <h5 className="font-medium text-gray-900">Fertilizer Breakdown:</h5>
                  <ul className="space-y-1 text-sm">
                    {Object.entries(dosage.breakdown).map(([type, amount]) => (
                      <li key={type} className="flex justify-between">
                        <span className="capitalize">{type}:</span>
                        <span className="font-medium">{amount} kg</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {dosage.notes && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-1">Additional Notes:</h5>
                  <p className="text-blue-800 text-sm">{dosage.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 text-sm">Enter your farm details to get personalized fertilizer recommendations</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default FertilizerCalculator;


