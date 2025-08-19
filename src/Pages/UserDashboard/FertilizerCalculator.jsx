import React, { useState } from 'react';
import { motion } from 'framer-motion';

const FertilizerCalculator = () => {
  const [form, setForm] = useState({ area: '', crop: '' });
  const [dosage, setDosage] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = (e) => {
    e.preventDefault();
    const area = parseFloat(form.area || '0');
    const base = 40; // kg per acre mock
    setDosage(Math.round(base * area));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <motion.form onSubmit={handleSubmit} className="ag-card p-6 space-y-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h3 className="text-lg font-semibold text-gray-900">Fertilizer Calculator</h3>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Land Area (acres)</label>
          <input name="area" value={form.area} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" required />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Crop</label>
          <input name="crop" value={form.crop} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" required />
        </div>
        <button className="w-full bg-[var(--ag-primary-500)] text-white py-2 rounded-lg hover:bg-[var(--ag-primary-600)]">Calculate</button>
      </motion.form>
      <motion.div className="ag-card p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h3 className="text-lg font-semibold text-gray-900">Dosage</h3>
        {dosage !== null ? (
          <p className="mt-2 text-gray-700">Apply approximately <span className="font-semibold">{dosage} kg</span> of NPK 10-10-10 for {form.crop || 'your crop'}.</p>
        ) : (
          <p className="text-gray-600">Enter details to calculate fertilizer dosage.</p>
        )}
      </motion.div>
    </div>
  );
};

export default FertilizerCalculator;


