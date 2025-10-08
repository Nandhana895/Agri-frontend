import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

export default function PredictionForm() {
  const [form, setForm] = useState({
    Temparature: '',
    Humidity: '',
    Moisture: '',
    Nitrogen: '',
    Potassium: '',
    Phosphorous: '',
  });
  const [predictionType, setPredictionType] = useState('crop');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const endpointMap = {
    crop: '/crop_prediction/',
    soil: '/soil_prediction/',
    fertilizer: '/fertilizer_prediction/',
  };

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult('');
    setFieldErrors({});

    try {
      const payload = {
        Temparature: parseFloat(form.Temparature),
        Humidity: parseFloat(form.Humidity),
        Moisture: parseFloat(form.Moisture),
        Nitrogen: parseFloat(form.Nitrogen),
        Potassium: parseFloat(form.Potassium),
        Phosphorous: parseFloat(form.Phosphorous),
      };

      const localErrors = {};
      for (const [k, v] of Object.entries(payload)) {
        if (Number.isNaN(v)) {
          localErrors[k] = `Enter a valid number for ${k}`;
        }
      }
      if (Object.keys(localErrors).length > 0) {
        setFieldErrors(localErrors);
        setLoading(false);
        return;
      }

      const url = `${API_BASE}${endpointMap[predictionType]}`;
      const { data } = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      setResult(data?.result ?? '');
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'An unexpected error occurred';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="ag-card rounded-2xl p-6 border border-green-200/60 bg-white">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Crop & Soil Intelligence</h2>
          <p className="ag-label text-gray-600 mt-1">Provide your field conditions to get AI-powered recommendations tailored for agriculture.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="ag-label text-gray-700">Prediction Type</label>
              <select
                className="mt-1 w-full rounded-lg border border-[var(--ag-border)] p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={predictionType}
                onChange={e => setPredictionType(e.target.value)}
                aria-label="Prediction type"
              >
                <option value="crop">Crop</option>
                <option value="soil">Soil</option>
                <option value="fertilizer">Fertilizer</option>
              </select>
              <p className="ag-fine text-gray-500 mt-1">Choose what you want to predict.</p>
            </div>

            <div>
              <label className="ag-label text-gray-700">Temparature (°C)</label>
              <input
                type="number"
                step="any"
                name="Temparature"
                value={form.Temparature}
                onChange={handleChange}
                required
                placeholder="e.g., 28"
                className={`mt-1 w-full rounded-lg border p-2 focus:outline-none focus:ring-2 ${fieldErrors.Temparature ? 'border-red-400 focus:ring-red-500' : 'border-[var(--ag-border)] focus:ring-green-500'}`}
                aria-invalid={Boolean(fieldErrors.Temparature)}
              />
              {fieldErrors.Temparature && <p className="text-xs text-red-600 mt-1">{fieldErrors.Temparature}</p>}
            </div>

            <div>
              <label className="ag-label text-gray-700">Humidity (%)</label>
              <input
                type="number"
                step="any"
                name="Humidity"
                value={form.Humidity}
                onChange={handleChange}
                required
                placeholder="e.g., 60"
                className={`mt-1 w-full rounded-lg border p-2 focus:outline-none focus:ring-2 ${fieldErrors.Humidity ? 'border-red-400 focus:ring-red-500' : 'border-[var(--ag-border)] focus:ring-green-500'}`}
                aria-invalid={Boolean(fieldErrors.Humidity)}
              />
              {fieldErrors.Humidity && <p className="text-xs text-red-600 mt-1">{fieldErrors.Humidity}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="ag-label text-gray-700">Moisture (%)</label>
              <input
                type="number"
                step="any"
                name="Moisture"
                value={form.Moisture}
                onChange={handleChange}
                required
                placeholder="e.g., 40"
                className={`mt-1 w-full rounded-lg border p-2 focus:outline-none focus:ring-2 ${fieldErrors.Moisture ? 'border-red-400 focus:ring-red-500' : 'border-[var(--ag-border)] focus:ring-green-500'}`}
                aria-invalid={Boolean(fieldErrors.Moisture)}
              />
              {fieldErrors.Moisture && <p className="text-xs text-red-600 mt-1">{fieldErrors.Moisture}</p>}
            </div>

            <div>
              <label className="ag-label text-gray-700">Nitrogen (N)</label>
              <input
                type="number"
                step="any"
                name="Nitrogen"
                value={form.Nitrogen}
                onChange={handleChange}
                required
                placeholder="e.g., 90"
                className={`mt-1 w-full rounded-lg border p-2 focus:outline-none focus:ring-2 ${fieldErrors.Nitrogen ? 'border-red-400 focus:ring-red-500' : 'border-[var(--ag-border)] focus:ring-green-500'}`}
                aria-invalid={Boolean(fieldErrors.Nitrogen)}
              />
              {fieldErrors.Nitrogen && <p className="text-xs text-red-600 mt-1">{fieldErrors.Nitrogen}</p>}
            </div>

            <div>
              <label className="ag-label text-gray-700">Potassium (K)</label>
              <input
                type="number"
                step="any"
                name="Potassium"
                value={form.Potassium}
                onChange={handleChange}
                required
                placeholder="e.g., 40"
                className={`mt-1 w-full rounded-lg border p-2 focus:outline-none focus:ring-2 ${fieldErrors.Potassium ? 'border-red-400 focus:ring-red-500' : 'border-[var(--ag-border)] focus:ring-green-500'}`}
                aria-invalid={Boolean(fieldErrors.Potassium)}
              />
              {fieldErrors.Potassium && <p className="text-xs text-red-600 mt-1">{fieldErrors.Potassium}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="ag-label text-gray-700">Phosphorous (P)</label>
              <input
                type="number"
                step="any"
                name="Phosphorous"
                value={form.Phosphorous}
                onChange={handleChange}
                required
                placeholder="e.g., 40"
                className={`mt-1 w-full rounded-lg border p-2 focus:outline-none focus:ring-2 ${fieldErrors.Phosphorous ? 'border-red-400 focus:ring-red-500' : 'border-[var(--ag-border)] focus:ring-green-500'}`}
                aria-invalid={Boolean(fieldErrors.Phosphorous)}
              />
              {fieldErrors.Phosphorous && <p className="text-xs text-red-600 mt-1">{fieldErrors.Phosphorous}</p>}
            </div>

            <div className="md:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center w-full md:w-auto px-5 py-3 rounded-lg text-white ag-cta-gradient hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Predicting…' : 'Get Recommendation'}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <div className="font-medium">Request failed</div>
            <div className="text-sm mt-1">{error}</div>
          </div>
        )}

        {result && !error && (
          <div className="mt-6 ag-card rounded-xl p-5 bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
            <div className="text-sm font-medium text-green-700">Recommended Outcome</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{result}</div>
            <div className="ag-fine text-gray-600 mt-1">Based on the provided field parameters.</div>
          </div>
        )}
      </div>
    </div>
  );
}