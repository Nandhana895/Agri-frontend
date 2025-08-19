import React, { useState } from 'react';
import { motion } from 'framer-motion';

const CropRecommendation = () => {
  const [form, setForm] = useState({ nitrogen: '', phosphorus: '', potassium: '', ph: '', rainfall: '' });
  const [results, setResults] = useState([]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock logic: choose crops based on simple rules
    const crops = ['Wheat', 'Rice', 'Maize', 'Soybean', 'Tomato'];
    const suggested = crops.sort(() => 0.5 - Math.random()).slice(0, 3);
    setResults(suggested);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <motion.form onSubmit={handleSubmit} className="ag-card p-6 space-y-4 lg:col-span-1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h3 className="text-lg font-semibold text-gray-900">Crop Recommendation</h3>
        {['nitrogen','phosphorus','potassium','ph','rainfall'].map((key) => (
          <div key={key}>
            <label className="block text-sm text-gray-700 mb-1 capitalize">{key}</label>
            <input name={key} value={form[key]} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" required />
          </div>
        ))}
        <button className="w-full bg-[var(--ag-primary-500)] text-white py-2 rounded-lg hover:bg-[var(--ag-primary-600)]">Get Recommendations</button>
      </motion.form>

      <div className="lg:col-span-2 grid gap-4 md:grid-cols-2">
        {results.map((crop, i) => (
          <motion.div key={i} className="ag-card p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h4 className="text-lg font-semibold text-gray-900">{crop}</h4>
            <p className="text-gray-600 text-sm mt-2">Ideal in well-drained loamy soil. Requires moderate irrigation.</p>
          </motion.div>
        ))}
        {results.length === 0 && (
          <div className="text-gray-600">Fill the form to get crop suggestions.</div>
        )}
      </div>
    </div>
  );
};

export default CropRecommendation;


