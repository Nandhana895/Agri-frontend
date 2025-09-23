import React, { useEffect, useState } from 'react';
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
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('ag_lang') || 'en'; } catch(_) { return 'en'; }
  });

  const t = {
    en: {
      title: 'Fertilizer Calculator',
      subtitle: 'Calculate precise fertilizer requirements based on your soil conditions and crop needs.',
      formTitle: 'Farm Details',
      area: 'Land Area (acres) *',
      areaPh: 'e.g., 2.5',
      cropType: 'Crop Type *',
      selectCrop: 'Select crop',
      soilType: 'Soil Type',
      selectSoil: 'Select soil type',
      pH: 'Soil pH',
      pHPh: 'e.g., 6.5',
      nitrogen: 'Nitrogen (mg/kg)',
      nitrogenPh: 'e.g., 40',
      phosphorus: 'Phosphorus (mg/kg)',
      phosphorusPh: 'e.g., 35',
      potassium: 'Potassium (mg/kg)',
      potassiumPh: 'e.g., 50',
      optAnalysis: 'Soil Analysis (Optional)',
      calcBtnLoading: 'Calculating...',
      calcBtn: 'Calculate Fertilizer Requirements',
      recTitle: 'Fertilizer Recommendations',
      recDosage: 'Recommended Dosage',
      applyNote: (crop, area, amt) => `Apply approximately ${amt} kg of fertilizer for ${crop} on ${area} acres.`,
      breakdown: 'Fertilizer Breakdown:',
      addlNotes: 'Additional Notes:',
      emptyHint: 'Enter your farm details to get personalized fertilizer recommendations'
    },
    ml: {
      title: 'വള കാൽക്കുലേറ്റർ',
      subtitle: 'മണ്ണിന്റെയും വിളയുടെയും ആവശ്യകതകളെ അടിസ്ഥാനമാക്കി കൃത്യമായ വളപരിമാണം കണക്കാക്കുക.',
      formTitle: 'ഫാം വിശദാംശങ്ങൾ',
      area: 'ഭൂവിസ്തീർണ്ണം (ഏക്കർ) *',
      areaPh: 'ഉദാ., 2.5',
      cropType: 'വിള തരം *',
      selectCrop: 'വിള തിരഞ്ഞെടുക്കുക',
      soilType: 'മണ്ണിന്റെ തരം',
      selectSoil: 'മണ്ണിന്റെ തരം തിരഞ്ഞെടുക്കുക',
      pH: 'മണ്ണിന്റെ pH',
      pHPh: 'ഉദാ., 6.5',
      nitrogen: 'നൈട്രജൻ (mg/kg)',
      nitrogenPh: 'ഉദാ., 40',
      phosphorus: 'ഫോസ്ഫറസ് (mg/kg)',
      phosphorusPh: 'ഉദാ., 35',
      potassium: 'പൊട്ടാസ്യം (mg/kg)',
      potassiumPh: 'ഉദാ., 50',
      optAnalysis: 'മണ്ണ് വിശകലനം (ഐച്ഛികം)',
      calcBtnLoading: 'കണക്കാക്കുന്നു...',
      calcBtn: 'വള ആവശ്യം കണക്കാക്കുക',
      recTitle: 'വള ശുപാർശകൾ',
      recDosage: 'ശുപാർശ ചെയ്‌ത ഡോസ്',
      applyNote: (crop, area, amt) => `ഏകദേശം ${amt} കിലോ വളം ${area} ഏക്കറിൽ ${crop} കൃഷിക്ക് ഉപയോഗിക്കുക.`,
      breakdown: 'വള വിഭജനം:',
      addlNotes: 'കൂടുതൽ കുറിപ്പുകൾ:',
      emptyHint: 'വ്യക്തിഗത ശുപാർശകൾക്കായി നിങ്ങളുടെ ഫാം വിശദാംശങ്ങൾ നൽകുക'
    }
  }[lang];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  useEffect(() => {
    const h = (e) => setLang(e?.detail || 'en');
    window.addEventListener('langChanged', h);
    return () => window.removeEventListener('langChanged', h);
  }, []);
  
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

  const handleSavePlanToLogbook = async () => {
    if (!dosage) return;
    try {
      const logData = {
        date: new Date().toISOString().split('T')[0],
        activityType: 'Fertilizer',
        crop: form.crop ? String(form.crop).trim() : undefined,
        notes: `Fertilizer plan saved. Total: ${dosage.totalAmount} kg. Breakdown - ${Object.entries(dosage.breakdown || {})
          .map(([k, v]) => `${k}: ${v} kg`).join(', ')}. ${dosage.notes ? `Notes: ${dosage.notes}` : ''}`.trim()
      };
      await api.post('/farmer/logs', logData);
      alert('Fertilizer plan saved to Farm Logbook!');
    } catch (error) {
      alert('Failed to save to Logbook. Please try again.');
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
              <h2 className="ag-display text-2xl md:text-3xl font-bold text-gray-900">{t.title}</h2>
              <p className="text-gray-600 mt-1 text-sm md:text-base">{t.subtitle}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.form onSubmit={handleSubmit} className="ag-card p-6 space-y-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-lg font-semibold text-gray-900">{t.formTitle}</h3>
          
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t.area}</label>
              <input 
                name="area" 
                type="number" 
                step="0.1"
                value={form.area} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" 
                required 
                placeholder={t.areaPh}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t.cropType}</label>
              <select 
                name="crop" 
                value={form.crop} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" 
                required
              >
                <option value="">{t.selectCrop}</option>
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
            <label className="block text-sm text-gray-700 mb-1">{t.soilType}</label>
            <select 
              name="soilType" 
              value={form.soilType} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
            >
              <option value="">{t.selectSoil}</option>
              <option value="clay">Clay</option>
              <option value="sandy">Sandy</option>
              <option value="loamy">Loamy</option>
              <option value="silty">Silty</option>
            </select>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">{t.optAnalysis}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">{t.pH}</label>
                <input 
                  name="ph" 
                  type="number" 
                  step="0.1"
                  min="0" 
                  max="14"
                  value={form.ph} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" 
                  placeholder={t.pHPh}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">{t.nitrogen}</label>
                <input 
                  name="nitrogen" 
                  type="number" 
                  step="0.1"
                  value={form.nitrogen} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" 
                  placeholder={t.nitrogenPh}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">{t.phosphorus}</label>
                <input 
                  name="phosphorus" 
                  type="number" 
                  step="0.1"
                  value={form.phosphorus} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" 
                  placeholder={t.phosphorusPh}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">{t.potassium}</label>
                <input 
                  name="potassium" 
                  type="number" 
                  step="0.1"
                  value={form.potassium} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" 
                  placeholder={t.potassiumPh}
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--ag-primary-500)] text-white py-2 rounded-lg hover:bg-[var(--ag-primary-600)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t.calcBtnLoading : t.calcBtn}
          </button>
        </motion.form>

        <motion.div className="ag-card p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.recTitle}</h3>
          {dosage ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">{t.recDosage}</h4>
                <p className="text-green-800">{t.applyNote(form.crop, form.area, dosage.totalAmount)}</p>
              </div>
              
              {dosage.breakdown && (
                <div className="space-y-2">
                  <h5 className="font-medium text-gray-900">{t.breakdown}</h5>
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
                  <h5 className="font-medium text-blue-900 mb-1">{t.addlNotes}</h5>
                  <p className="text-blue-800 text-sm">{dosage.notes}</p>
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={handleSavePlanToLogbook}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {/* Bookmark icon */}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3-7 3V5z"/></svg>
                  Save Fertilizer Plan to Logbook
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 text-sm">{t.emptyHint}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default FertilizerCalculator;


