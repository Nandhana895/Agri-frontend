import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';

const Progress = ({ value }) => (
  <div className="w-full h-2 bg-[var(--ag-muted)] rounded-full overflow-hidden">
    <div className="h-full ag-cta-gradient" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);

const ResultCard = ({ name, score, notes, t }) => (
  <motion.div className="ag-card p-6 flex flex-col gap-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
    <div className="flex items-start justify-between">
      <div>
        <h4 className="text-lg font-semibold text-gray-900">{name}</h4>
        <p className="text-xs text-gray-500">{t.score}</p>
      </div>
      <span className="text-xs px-2 py-1 rounded-full bg-[var(--ag-field-200)] text-[var(--ag-primary-600)] font-medium">{t.recommended}</span>
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
      <Link to="/dashboard/fertilizer" className="ag-cta-gradient text-white px-4 py-2 rounded-lg text-sm shadow hover:opacity-95">{t.planFert}</Link>
    </div>
  </motion.div>
);

const CropRecommendation = () => {
  const [form, setForm] = useState({ nitrogen: '', phosphorus: '', potassium: '', ph: '', rainfall: '' });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('ag_lang') || 'en'; } catch(_) { return 'en'; }
  });

  const t = {
    en: {
      title: 'Crop Recommendation',
      subtitle: 'Enter your soil parameters to get tailored crop suggestions.',
      analyzeSoil: 'Analyze Soil',
      formTitle: 'Soil & Climate Inputs',
      field: {
        n: 'Nitrogen (N)', p: 'Phosphorus (P)', k: 'Potassium (K)', ph: 'Soil pH', rain: 'Rainfall'
      },
      units: { n: 'mg/kg', p: 'mg/kg', k: 'mg/kg', ph: '0-14', rain: 'mm/month' },
      placeholders: { n: 'e.g., 40', p: 'e.g., 35', k: 'e.g., 50', ph: 'e.g., 6.5', rain: 'e.g., 120' },
      getRecs: 'Get Recommendations',
      generating: 'Generating…',
      tip: 'Tip: Accurate pH and NPK values improve recommendation quality.',
      empty: 'Fill the form to get crop suggestions.',
      score: 'Suitability score',
      recommended: 'Recommended',
      planFert: 'Plan Fertilizer'
    },
    ml: {
      title: 'വിള ശുപാർശ',
      subtitle: 'നിങ്ങളുടെ മണ്ണ് വിവരങ്ങൾ നൽകി അനുയോജ്യമായ വിള ശുപാർശകൾ നേടുക.',
      analyzeSoil: 'മണ്ണ് വിശകലനം',
      formTitle: 'മണ്ണും കാലാവസ്ഥയും',
      field: {
        n: 'നൈട്രജൻ (N)', p: 'ഫോസ്ഫറസ് (P)', k: 'പൊട്ടാസ്യം (K)', ph: 'മണ്ണിന്റെ pH', rain: 'മഴ'
      },
      units: { n: 'mg/kg', p: 'mg/kg', k: 'mg/kg', ph: '0-14', rain: 'മില്ലിമീറ്റർ/മാസം' },
      placeholders: { n: 'ഉദാ., 40', p: 'ഉദാ., 35', k: 'ഉദാ., 50', ph: 'ഉദാ., 6.5', rain: 'ഉദാ., 120' },
      getRecs: 'ശുപാർശകൾ നേടുക',
      generating: 'സൃഷ്ടിക്കുന്നു…',
      tip: 'സൂക്ഷ്മമായ pHയും NPKയും നൽകുന്നത് ശുപാർശയുടെ ഗുണമേന്മ മെച്ചപ്പെടുത്തും.',
      empty: 'വിള ശുപാർശകൾക്കായി ഫോം പൂരിപ്പിക്കുക.',
      score: 'യോഗ്യത സ്കോർ',
      recommended: 'ശുപാർശ ചെയ്തിരിക്കുന്നത്',
      planFert: 'വള പദ്ധതിയിടുക'
    }
  }[lang];

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        nitrogen: Number(form.nitrogen),
        phosphorus: Number(form.phosphorus),
        potassium: Number(form.potassium),
        ph: Number(form.ph),
        rainfall: Number(form.rainfall)
      };
      const res = await api.post('/farmer/ai/crop-recommendation', payload);
      if (res?.data?.success) {
        const suggested = (res.data.data || []).map((c) => ({
          name: c.name,
          score: c.score,
          notes: c.notes && c.notes.length ? c.notes : ['AI suggested based on your inputs.']
        }));
        setResults(suggested);
      } else {
        setResults([]);
        setErrorMsg(res?.data?.message || 'Failed to fetch AI recommendations');
      }
    } catch (err) {
      setResults([]);
      const msg = err?.response?.data?.message || err?.message || 'Request failed';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // React to global language changes from the top bar selector
  useEffect(() => {
    const h = (e) => setLang(e?.detail || 'en');
    window.addEventListener('langChanged', h);
    return () => window.removeEventListener('langChanged', h);
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="ag-card overflow-hidden relative">
        <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-20 ag-cta-gradient blur-3xl" />
        <div className="ag-hero-gradient p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="ag-display text-2xl md:text-3xl font-bold text-gray-900">{t.title}</h2>
              <p className="text-gray-600 mt-1 text-sm md:text-base">{t.subtitle}</p>
            </div>
            <Link to="/dashboard/soil-health" className="text-[var(--ag-primary-600)] px-4 py-2 rounded-lg text-sm border border-[var(--ag-border)] hover:border-[var(--ag-primary-600)] bg-white/60 backdrop-blur">{t.analyzeSoil}</Link>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <motion.form onSubmit={handleSubmit} className="ag-card p-6 space-y-4 lg:col-span-1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-lg font-semibold text-gray-900">{t.formTitle}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'nitrogen', label: t.field.n, suffix: t.units.n, placeholder: t.placeholders.n },
              { key: 'phosphorus', label: t.field.p, suffix: t.units.p, placeholder: t.placeholders.p },
              { key: 'potassium', label: t.field.k, suffix: t.units.k, placeholder: t.placeholders.k },
              { key: 'ph', label: t.field.ph, suffix: t.units.ph, placeholder: t.placeholders.ph },
              { key: 'rainfall', label: t.field.rain, suffix: t.units.rain, placeholder: t.placeholders.rain },
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
            {loading ? t.generating : t.getRecs}
          </button>
          <p className="text-xs text-gray-500">{t.tip}</p>
        </motion.form>

        {/* Results */}
        <div className="lg:col-span-2 grid gap-4 md:grid-cols-2">
          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="ag-card p-4 text-red-600 md:col-span-2">
              {errorMsg}
            </motion.div>
          )}
          {results.map((r, i) => (
            <ResultCard key={i} name={r.name} score={r.score} notes={r.notes} t={t} />
          ))}
          {results.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="ag-card p-6 text-gray-600">
              {t.empty}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CropRecommendation;


