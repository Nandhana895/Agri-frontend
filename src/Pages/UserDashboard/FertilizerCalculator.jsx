import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';

const FertilizerCalculator = () => {
  const [form, setForm] = useState({ 
    crop: '', 
    region: '', 
    landSize: '', 
    landUnit: 'acre',
    soilType: '',
    organicCarbon: '',
    soilN: '',
    soilP: '',
    soilK: '',
    fromSoilAnalysisId: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [options, setOptions] = useState({ crops: [], regions: [] });
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [showSoilIntegration, setShowSoilIntegration] = useState(false);
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('ag_lang') || 'en'; } catch(_) { return 'en'; }
  });

  const t = {
    en: {
      title: 'Fertilizer Calculator',
      subtitle: 'Get precise fertilizer recommendations based on your crop, soil, and region. Accurate for any land size from micro-plots to large farms.',
      formTitle: 'Farm Details',
      crop: 'Crop Type *',
      selectCrop: 'Select crop',
      region: 'Region *',
      selectRegion: 'Select region',
      landSize: 'Land Size *',
      landUnit: 'Unit',
      soilType: 'Soil Type',
      selectSoil: 'Select soil type',
      organicCarbon: 'Organic Carbon (%)',
      organicCarbonPh: 'e.g., 2.5',
      soilAnalysis: 'Soil Analysis Integration',
      useLastReport: 'Use Last Soil Report',
      soilN: 'Nitrogen Level',
      soilP: 'Phosphorus Level',
      soilK: 'Potassium Level',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      calcBtn: 'Calculate Fertilizer Requirements',
      calcBtnLoading: 'Calculating...',
      resultTitle: 'Fertilizer Recommendations',
      nutrientReq: 'Nutrient Requirements',
      fertilizerRec: 'Fertilizer Recommendations',
      splitDoses: 'Split Dose Schedule',
      tips: 'Crop-Specific Tips',
      organicAdvice: 'Organic Alternatives',
      savePlan: '💾 Save Plan to Logbook',
      downloadPdf: '📄 Download PDF Report',
      emptyHint: 'Enter your farm details to get personalized fertilizer recommendations',
      smallAreaNote: 'For micro-plots, dissolve fertilizers in water before applying evenly.',
      noDataMessage: 'Fertilizer data unavailable for this region. Please contact Agri Officer.'
    },
    ml: {
      title: 'വള കാൽക്കുലേറ്റർ',
      subtitle: 'നിങ്ങളുടെ വിള, മണ്ണ്, പ്രദേശം എന്നിവയെ അടിസ്ഥാനമാക്കി കൃത്യമായ വള ശുപാർശകൾ നേടുക.',
      formTitle: 'ഫാം വിശദാംശങ്ങൾ',
      crop: 'വിള തരം *',
      selectCrop: 'വിള തിരഞ്ഞെടുക്കുക',
      region: 'പ്രദേശം *',
      selectRegion: 'പ്രദേശം തിരഞ്ഞെടുക്കുക',
      landSize: 'ഭൂവിസ്തീർണ്ണം *',
      landUnit: 'യൂണിറ്റ്',
      soilType: 'മണ്ണിന്റെ തരം',
      selectSoil: 'മണ്ണിന്റെ തരം തിരഞ്ഞെടുക്കുക',
      organicCarbon: 'ഓർഗാനിക് കാർബൺ (%)',
      organicCarbonPh: 'ഉദാ., 2.5',
      soilAnalysis: 'മണ്ണ് വിശകലന സംയോജനം',
      useLastReport: 'അവസാന മണ്ണ് റിപ്പോർട്ട് ഉപയോഗിക്കുക',
      soilN: 'നൈട്രജൻ ലെവൽ',
      soilP: 'ഫോസ്ഫറസ് ലെവൽ',
      soilK: 'പൊട്ടാസ്യം ലെവൽ',
      low: 'കുറഞ്ഞ',
      medium: 'ഇടത്തരം',
      high: 'കൂടിയ',
      calcBtn: 'വള ആവശ്യം കണക്കാക്കുക',
      calcBtnLoading: 'കണക്കാക്കുന്നു...',
      resultTitle: 'വള ശുപാർശകൾ',
      nutrientReq: 'പോഷക ആവശ്യകതകൾ',
      fertilizerRec: 'വള ശുപാർശകൾ',
      splitDoses: 'സ്പ്ലിറ്റ് ഡോസ് ഷെഡ്യൂൾ',
      tips: 'വിള-നിർദ്ദിഷ്ട നുറുങ്ങുകൾ',
      organicAdvice: 'ഓർഗാനിക് ബദലുകൾ',
      savePlan: '💾 ലോഗ്ബുക്കിൽ പ്ലാൻ സേവ് ചെയ്യുക',
      downloadPdf: '📄 PDF റിപ്പോർട്ട് ഡൗൺലോഡ് ചെയ്യുക',
      emptyHint: 'വ്യക്തിഗത ശുപാർശകൾക്കായി നിങ്ങളുടെ ഫാം വിശദാംശങ്ങൾ നൽകുക',
      smallAreaNote: 'മൈക്രോ-പ്ലോട്ടുകൾക്ക്, വളങ്ങൾ വെള്ളത്തിൽ ലയിപ്പിച്ച് തുല്യമായി പ്രയോഗിക്കുക.',
      noDataMessage: 'ഈ പ്രദേശത്തിന് വള ഡാറ്റ ലഭ്യമല്ല. ദയവായി അഗ്രി ഓഫീസറെ സമീപിക്കുക.'
    }
  }[lang];

  useEffect(() => {
    const handler = (e) => setLang(e?.detail || 'en');
    window.addEventListener('langChanged', handler);
    return () => window.removeEventListener('langChanged', handler);
  }, []);

  useEffect(() => {
    fetchOptions();
    fetchRecentAnalyses();
  }, []);

  const fetchOptions = async () => {
    try {
      const response = await api.get('/farmer/fertilizer-options');
      if (response.data?.success) {
        setOptions(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch options:', err);
    }
  };

  const fetchRecentAnalyses = async () => {
    try {
      const response = await api.get('/farmer/recent-soil-analyses');
      if (response.data?.success) {
        setRecentAnalyses(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch recent analyses:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setError('');
  };

  const handleUseLastSoilReport = (analysis) => {
    setForm({
      ...form,
      fromSoilAnalysisId: analysis._id,
      soilType: analysis.soilType || '',
      organicCarbon: analysis.organicMatter || '',
      soilN: analysis.nitrogen ? (analysis.nitrogen < 20 ? 'low' : analysis.nitrogen > 60 ? 'high' : 'medium') : '',
      soilP: analysis.phosphorus ? (analysis.phosphorus < 15 ? 'low' : analysis.phosphorus > 40 ? 'high' : 'medium') : '',
      soilK: analysis.potassium ? (analysis.potassium < 40 ? 'low' : analysis.potassium > 100 ? 'high' : 'medium') : ''
    });
    setShowSoilIntegration(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const payload = {
        crop: form.crop,
        region: form.region,
        landSize: parseFloat(form.landSize),
        landUnit: form.landUnit,
        soilType: form.soilType || undefined,
        organicCarbon: form.organicCarbon ? parseFloat(form.organicCarbon) : undefined,
        soilN: form.soilN || undefined,
        soilP: form.soilP || undefined,
        soilK: form.soilK || undefined,
        fromSoilAnalysisId: form.fromSoilAnalysisId || undefined
      };
      
      const response = await api.post('/farmer/fertilizer-calculator', payload);
      
      if (response.data?.success) {
        setResult(response.data.data);
      } else {
        setError(response.data?.message || 'Failed to calculate fertilizer requirements');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to calculate fertilizer requirements');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!result) return;
    try {
      const logData = {
        date: new Date().toISOString().split('T')[0],
        activityType: 'Fertilizer',
        crop: result.crop,
        notes: `Fertilizer plan for ${result.crop} (${result.region}) - ${result.landSize}: Urea ${result.fertilizer.urea}${result.unit}, DAP ${result.fertilizer.dap}${result.unit}, MOP ${result.fertilizer.mop}${result.unit}. ${result.message}`
      };
      await api.post('/farmer/logs', logData);
      alert('✅ Fertilizer plan saved successfully to Farm Logbook!');
    } catch (error) {
      alert('❌ Failed to save plan. Please try again.');
    }
  };

  const handleDownloadPdf = async () => {
    if (!result) return;
    try {
      const response = await api.post('/farmer/fertilizer-pdf', {
        crop: result.crop,
        region: result.region,
        landSize: result.landSize,
        fertilizer: result.fertilizer,
        recommended: result.recommended,
        unit: result.unit,
        splitDoses: result.splitDoses,
        tips: result.tips,
        organicAdvice: result.organicAdvice
      }, {
        responseType: 'blob'
      });
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fertilizer-plan-${result.crop.toLowerCase()}-${Date.now()}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert('📄 Fertilizer plan downloaded successfully!');
    } catch (error) {
      console.error('PDF download error:', error);
      alert('❌ Failed to download PDF. Please try again.');
    }
  };

  const isFormValid = form.crop && form.region && form.landSize;

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
        {/* Form Section */}
        <motion.form onSubmit={handleSubmit} className="ag-card p-6 space-y-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-lg font-semibold text-gray-900">{t.formTitle}</h3>
          
          {error && (
            <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Basic Farm Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.crop}</label>
              <select 
                name="crop" 
                value={form.crop} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" 
                required
              >
                <option value="">{t.selectCrop}</option>
                {options.crops.map(crop => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.region}</label>
              <select 
                name="region" 
                value={form.region} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" 
                required
              >
                <option value="">{t.selectRegion}</option>
                {options.regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Land Size */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.landSize}</label>
              <input 
                name="landSize" 
                type="number" 
                step="0.01"
                min="0.01"
                value={form.landSize} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" 
                required 
                placeholder="e.g., 2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.landUnit}</label>
              <select 
                name="landUnit" 
                value={form.landUnit} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
              >
                <option value="acre">Acre</option>
                <option value="hectare">Hectare</option>
                <option value="sqm">Square Meter</option>
              </select>
            </div>
          </div>

          {/* Soil Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.soilType}</label>
            <select 
              name="soilType" 
              value={form.soilType} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
            >
              <option value="">{t.selectSoil}</option>
              <option value="sandy">Sandy</option>
              <option value="loamy">Loamy</option>
              <option value="clay">Clay</option>
              <option value="silty">Silty</option>
              <option value="peaty">Peaty</option>
              <option value="chalky">Chalky</option>
            </select>
          </div>

          {/* Soil Analysis Integration */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">{t.soilAnalysis}</h4>
              <button
                type="button"
                onClick={() => setShowSoilIntegration(!showSoilIntegration)}
                className="text-sm text-[var(--ag-primary-600)] hover:text-[var(--ag-primary-700)]"
              >
                {showSoilIntegration ? 'Hide' : 'Show'} Options
              </button>
            </div>

            {showSoilIntegration && (
              <div className="space-y-4">
                {recentAnalyses.length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="text-sm font-medium text-blue-900 mb-2">{t.useLastReport}</h5>
                    <div className="space-y-2">
                      {recentAnalyses.map(analysis => (
                        <button
                          key={analysis._id}
                          type="button"
                          onClick={() => handleUseLastSoilReport(analysis)}
                          className="w-full text-left p-2 bg-white border border-blue-200 rounded hover:bg-blue-50 text-sm"
                        >
                          <div className="font-medium">pH: {analysis.ph}</div>
                          <div className="text-gray-600">
                            {analysis.location && `${analysis.location} • `}
                            {new Date(analysis.createdAt).toLocaleDateString()}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.organicCarbon}</label>
                    <input 
                      name="organicCarbon" 
                      type="number" 
                      step="0.1"
                      min="0" 
                      max="10"
                      value={form.organicCarbon} 
                      onChange={handleChange} 
                      className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" 
                      placeholder={t.organicCarbonPh}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.soilN}</label>
                    <select 
                      name="soilN" 
                      value={form.soilN} 
                      onChange={handleChange} 
                      className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
                    >
                      <option value="">Select level</option>
                      <option value="low">{t.low}</option>
                      <option value="medium">{t.medium}</option>
                      <option value="high">{t.high}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.soilP}</label>
                    <select 
                      name="soilP" 
                      value={form.soilP} 
                      onChange={handleChange} 
                      className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
                    >
                      <option value="">Select level</option>
                      <option value="low">{t.low}</option>
                      <option value="medium">{t.medium}</option>
                      <option value="high">{t.high}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.soilK}</label>
                    <select 
                      name="soilK" 
                      value={form.soilK} 
                      onChange={handleChange} 
                      className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
                    >
                      <option value="">Select level</option>
                      <option value="low">{t.low}</option>
                      <option value="medium">{t.medium}</option>
                      <option value="high">{t.high}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full bg-[var(--ag-primary-600)] text-white py-3 rounded-lg hover:bg-[var(--ag-primary-700)] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-medium"
          >
            {loading ? t.calcBtnLoading : t.calcBtn}
          </button>
        </motion.form>

        {/* Results Section */}
        <motion.div className="ag-card p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.resultTitle}</h3>
          {result ? (
            <div className="space-y-6">
              {/* Nutrient Requirements */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">N</span>
                  {t.nutrientReq}
                </h4>
                {(() => {
                  const unitLabel = result.unit === 'g' ? 'grams' : 'kg';
                  const n = Number(result.recommended.nitrogen) || 0;
                  const p = Number(result.recommended.phosphorus) || 0;
                  const k = Number(result.recommended.potassium) || 0;
                  const max = Math.max(1, n, p, k);
                  const bar = (val, color) => (
                    <div className="h-2 w-full bg-white rounded-full overflow-hidden border border-green-200">
                      <div className={`h-full ${color}`} style={{ width: `${Math.min(100, Math.round((val / max) * 100))}%`, transition: 'width 600ms ease' }} />
                    </div>
                  );
                  return (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-green-800">Nitrogen</div>
                        <div className="text-lg font-bold text-green-900">{result.recommended.nitrogen} {unitLabel}</div>
                        <div className="mt-2">{bar(n, 'bg-green-500')}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-green-800">Phosphorus</div>
                        <div className="text-lg font-bold text-green-900">{result.recommended.phosphorus} {unitLabel}</div>
                        <div className="mt-2">{bar(p, 'bg-emerald-400')}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-green-800">Potassium</div>
                        <div className="text-lg font-bold text-green-900">{result.recommended.potassium} {unitLabel}</div>
                        <div className="mt-2">{bar(k, 'bg-lime-400')}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Fertilizer Recommendations */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">F</span>
                  {t.fertilizerRec}
                </h4>
                {(() => {
                  const unitLabel = result.unit === 'g' ? 'grams' : 'kg';
                  return (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-blue-800">Urea</div>
                        <div className="text-lg font-bold text-blue-900">{result.fertilizer.urea} {unitLabel}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-blue-800">DAP</div>
                        <div className="text-lg font-bold text-blue-900">{result.fertilizer.dap} {unitLabel}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-blue-800">MOP</div>
                        <div className="text-lg font-bold text-blue-900">{result.fertilizer.mop} {unitLabel}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Split Dose Schedule */}
              {result.splitDoses && result.splitDoses.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs">📅</span>
                    {t.splitDoses}
                  </h4>
                  <div className="space-y-3">
                    {result.splitDoses.map((dose, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border">
                        <div className="font-medium text-gray-900">{dose.stage}</div>
                        <div className="text-sm text-gray-600 mb-2">{dose.timing}</div>
                        {(() => {
                          const unitLabel = result.unit === 'g' ? 'g' : 'kg';
                          return (
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              {dose.urea > 0 && <div className="text-center"><span className="font-medium">Urea:</span> {dose.urea}{unitLabel}</div>}
                              {dose.dap > 0 && <div className="text-center"><span className="font-medium">DAP:</span> {dose.dap}{unitLabel}</div>}
                              {dose.mop > 0 && <div className="text-center"><span className="font-medium">MOP:</span> {dose.mop}{unitLabel}</div>}
                            </div>
                          );
                        })()}
                        {dose.notes && <div className="text-xs text-gray-500 mt-1">{dose.notes}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              {result.tips && result.tips.length > 0 && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">💡</span>
                    {t.tips}
                  </h4>
                  <ul className="space-y-1 text-sm text-purple-800">
                    {result.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-purple-600 mt-1">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Organic Advice */}
              {result.organicAdvice && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">🌱</span>
                    {t.organicAdvice}
                  </h4>
                  <p className="text-sm text-green-800">{result.organicAdvice}</p>
                </div>
              )}

              {/* Small Area Note */}
              {result.unit === 'g' && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">{t.smallAreaNote}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSavePlan}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {t.savePlan}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t.downloadPdf}
                </button>
              </div>

              {/* Source Message */}
              <div className="text-xs text-gray-500 text-center">
                {result.message}
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


