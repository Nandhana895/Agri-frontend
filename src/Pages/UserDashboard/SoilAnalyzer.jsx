import React, { useState } from 'react';
import { motion } from 'framer-motion';

const SoilAnalyzer = () => {
  const [form, setForm] = useState({ ph: '', organicMatter: '', moisture: '' });
  const [analysis, setAnalysis] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = (e) => {
    e.preventDefault();
    const ph = parseFloat(form.ph);
    const status = ph >= 6 && ph <= 7 ? 'Healthy' : 'Needs Adjustment';
    const fertilizer = status === 'Healthy' ? 'Balanced NPK 10-10-10 at 50kg/acre' : 'Apply agricultural lime and recheck pH';
    setAnalysis({ status, fertilizer });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <motion.form onSubmit={handleSubmit} className="ag-card p-6 space-y-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h3 className="text-lg font-semibold text-gray-900">Soil Health Analyzer</h3>
        {['ph','organicMatter','moisture'].map((key) => (
          <div key={key}>
            <label className="block text-sm text-gray-700 mb-1 capitalize">{key}</label>
            <input name={key} value={form[key]} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" required />
          </div>
        ))}
        <button className="w-full bg-[var(--ag-primary-500)] text-white py-2 rounded-lg hover:bg-[var(--ag-primary-600)]">Analyze Soil</button>
      </motion.form>

      <motion.div className="ag-card p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h3 className="text-lg font-semibold text-gray-900">Results</h3>
        {analysis ? (
          <div className="mt-3 text-gray-700">
            <p>Status: <span className="font-medium">{analysis.status}</span></p>
            <p className="mt-2">Suggested Fertilizer: {analysis.fertilizer}</p>
          </div>
        ) : (
          <p className="text-gray-600">Run the analyzer to see soil health and suggestions.</p>
        )}
      </motion.div>
    </div>
  );
};

export default SoilAnalyzer;


