import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Progress = ({ value }) => (
  <div className="w-full h-2 bg-[var(--ag-muted)] rounded-full overflow-hidden">
    <div className="h-full ag-cta-gradient" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);

const ResultCard = ({ name, score, notes }) => (
  <motion.div className="ag-card p-6 flex flex-col gap-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
    <div className="flex items-start justify-between">
      <div>
        <h4 className="text-lg font-semibold text-gray-900">{name}</h4>
        <p className="text-xs text-gray-500">Suitability score</p>
      </div>
      <span className="text-xs px-2 py-1 rounded-full bg-[var(--ag-field-200)] text-[var(--ag-primary-600)] font-medium">Recommended</span>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-2xl font-semibold text-gray-900">{score}</span>
      <Progress value={score} />
    </div>
    <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
      {notes.map((n, i) => (
        <li key={i}>{n}</li>
      ))}
    </ul>
    <div className="pt-2">
      <Link to="/dashboard/fertilizer" className="ag-cta-gradient text-white px-4 py-2 rounded-lg text-sm shadow hover:opacity-95">Plan Fertilizer</Link>
    </div>
  </motion.div>
);

const CropRecommendation = () => {
  const [form, setForm] = useState({ nitrogen: '', phosphorus: '', potassium: '', ph: '', rainfall: '' });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const computeMockScore = () => {
    const n = Number(form.nitrogen) || 0;
    const p = Number(form.phosphorus) || 0;
    const k = Number(form.potassium) || 0;
    const ph = Number(form.ph) || 7;
    const rain = Number(form.rainfall) || 0;
    const balance = 100 - Math.abs(6.5 - ph) * 12 - Math.abs(n - p) - Math.abs(k - p) - Math.max(0, 400 - rain) / 40;
    return Math.round(Math.max(35, Math.min(95, balance)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Mock logic with slight delay to feel responsive
    setTimeout(() => {
      const crops = ['Wheat', 'Rice', 'Maize', 'Soybean', 'Tomato', 'Cotton', 'Barley'];
      const baseScore = computeMockScore();
      const suggested = crops
        .sort(() => 0.5 - Math.random())
        .slice(0, 4)
        .map((name, idx) => ({
          name,
          score: Math.max(40, Math.min(98, baseScore - idx * 7 + Math.floor(Math.random() * 8 - 4))),
          notes: [
            'Performs well in loamy soil with good drainage.',
            'Moderate irrigation and balanced NPK recommended.',
          ],
        }))
        .sort((a, b) => b.score - a.score);
      setResults(suggested);
      setLoading(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="ag-card overflow-hidden relative">
        <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-20 ag-cta-gradient blur-3xl" />
        <div className="ag-hero-gradient p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="ag-display text-2xl md:text-3xl font-bold text-gray-900">Crop Recommendation</h2>
              <p className="text-gray-600 mt-1 text-sm md:text-base">Enter your soil parameters to get tailored crop suggestions.</p>
            </div>
            <Link to="/dashboard/soil-health" className="text-[var(--ag-primary-600)] px-4 py-2 rounded-lg text-sm border border-[var(--ag-border)] hover:border-[var(--ag-primary-600)] bg-white/60 backdrop-blur">Analyze Soil</Link>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <motion.form onSubmit={handleSubmit} className="ag-card p-6 space-y-4 lg:col-span-1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-lg font-semibold text-gray-900">Soil & Climate Inputs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'nitrogen', label: 'Nitrogen (N)', suffix: 'mg/kg', placeholder: 'e.g., 40' },
              { key: 'phosphorus', label: 'Phosphorus (P)', suffix: 'mg/kg', placeholder: 'e.g., 35' },
              { key: 'potassium', label: 'Potassium (K)', suffix: 'mg/kg', placeholder: 'e.g., 50' },
              { key: 'ph', label: 'Soil pH', suffix: '0-14', placeholder: 'e.g., 6.5' },
              { key: 'rainfall', label: 'Rainfall', suffix: 'mm/month', placeholder: 'e.g., 120' },
            ].map((f) => (
              <div key={f.key} className="space-y-1">
                <label className="block text-sm text-gray-700">{f.label}</label>
                <div className="flex items-center rounded-lg border border-[var(--ag-border)] focus-within:ring-2 focus-within:ring-[var(--ag-primary-500)] bg-white">
                  <input name={f.key} value={form[f.key]} onChange={handleChange} placeholder={f.placeholder} className="w-full px-3 py-2 rounded-lg focus:outline-none" required />
                  <span className="px-3 py-2 text-xs text-gray-500 border-l border-[var(--ag-border)]">{f.suffix}</span>
                </div>
              </div>
            ))}
          </div>
          <button disabled={loading} className="w-full ag-cta-gradient text-white py-2 rounded-lg hover:opacity-95 disabled:opacity-60">
            {loading ? 'Generating…' : 'Get Recommendations'}
          </button>
          <p className="text-xs text-gray-500">Tip: Accurate pH and NPK values improve recommendation quality.</p>
        </motion.form>

        {/* Results */}
        <div className="lg:col-span-2 grid gap-4 md:grid-cols-2">
          {results.map((r, i) => (
            <ResultCard key={i} name={r.name} score={r.score} notes={r.notes} />
          ))}
          {results.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="ag-card p-6 text-gray-600">
              Fill the form to get crop suggestions.
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CropRecommendation;


