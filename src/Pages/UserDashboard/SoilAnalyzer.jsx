import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
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
  const [errors, setErrors] = useState({ ph: '', organicMatter: '', moisture: '', nitrogen: '', phosphorus: '', potassium: '' });
  const [touched, setTouched] = useState({ ph: false, organicMatter: false, moisture: false, nitrogen: false, phosphorus: false, potassium: false });
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [ocrSummary, setOcrSummary] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('ag_lang') || 'en'; } catch(_) { return 'en'; }
  });

  const t = {
    en: {
      title: 'Soil Health Analyzer',
      subtitle: 'Analyze your soil composition and get detailed recommendations for optimal crop growth.',
      formTitle: 'Soil Test Data',
      ph: 'Soil pH *', phPh: 'e.g., 6.5', phReq: 'pH is required', phNum: 'Enter a valid number', phRange: 'pH must be between 0 and 14',
      organic: 'Organic Matter (%)', organicPh: 'e.g., 2.5',
      moisture: 'Moisture Content (%)', moisturePh: 'e.g., 25',
      soilType: 'Soil Type', selectSoil: 'Select soil type',
      nutrientTitle: 'Nutrient Analysis (Optional)',
      n: 'Nitrogen (mg/kg)', nPh: 'e.g., 40',
      p: 'Phosphorus (mg/kg)', pPh: 'e.g., 35',
      k: 'Potassium (mg/kg)', kPh: 'e.g., 50',
      location: 'Location (Optional)', locationPh: 'e.g., Field A, North Section',
      analyzeBtn: 'Analyze Soil Health', analyzing: 'Analyzing...',
      uploadTitle: 'Upload Soil Report (PDF)', uploadHint: "Upload a lab soil report PDF. We'll extract the text and show a concise summary.",
      dragHere: 'Drag & drop your PDF here, or', browse: 'Browse PDF', pdfOnly: 'PDF only, up to 10MB', uploading: 'Uploading...', pdfSummary: 'PDF Summary', showText: 'Show extracted text'
    },
    ml: {
      title: 'മണ്ണിന്റെ ആരോഗ്യ വിശകലനം',
      subtitle: 'മണ്ണിന്റെ ഘടന വിശകലനം ചെയ്ത് മികച്ച വിളവെടുപ്പിന് വിശദമായ ശുപാർശകൾ നേടുക.',
      formTitle: 'മണ്ണ് പരിശോധന ഡാറ്റ',
      ph: 'മണ്ണിന്റെ pH *', phPh: 'ഉദാ., 6.5', phReq: 'pH ആവശ്യമാണ്', phNum: 'സരിയായ സംഖ്യ നൽകുക', phRange: 'pH 0 - 14 നിടയിൽ ആയിരിക്കണം',
      organic: 'ഓർഗാനിക് മട്ടർ (%)', organicPh: 'ഉദാ., 2.5',
      moisture: 'അതിസാന്ദ്രത (%)', moisturePh: 'ഉദാ., 25',
      soilType: 'മണ്ണിന്റെ തരം', selectSoil: 'മണ്ണിന്റെ തരം തിരഞ്ഞെടുക്കുക',
      nutrientTitle: 'പോഷക വിശകലനം (ഐച്ഛികം)',
      n: 'നൈട്രജൻ (mg/kg)', nPh: 'ഉദാ., 40',
      p: 'ഫോസ്ഫറസ് (mg/kg)', pPh: 'ഉദാ., 35',
      k: 'പൊട്ടാസ്യം (mg/kg)', kPh: 'ഉദാ., 50',
      location: 'സ്ഥലം (ഐച്ഛികം)', locationPh: 'ഉദാ., ഫീൽഡ് A, നോർത്തു സെക്ഷൻ',
      analyzeBtn: 'മണ്ണ് ആരോഗ്യം വിശകലനം ചെയ്യുക', analyzing: 'വിശകലനം ചെയ്യുന്നു...',
      uploadTitle: 'മണ്ണ് റിപ്പോർട്ട് അപ്‌ലോഡ് ചെയ്യുക (PDF)', uploadHint: 'ലാബ് മണ്ണ് റിപ്പോർട്ട് PDF അപ്‌ലോഡ് ചെയ്യുക. ഞങ്ങൾ ചുരുക്കം കാണിക്കും.',
      dragHere: 'നിങ്ങളുടെ PDF ഇവിടെ ഡ്രാഗ് & ഡ്രോപ്പ് ചെയ്യുക, അല്ലെങ്കിൽ', browse: 'PDF തിരഞ്ഞെടുക്കുക', pdfOnly: 'PDF മാത്രം, 10MB വരെ', uploading: 'അപ്‌ലോഡ് ചെയ്യുന്നു...', pdfSummary: 'PDF ചുരുക്കം', showText: 'എക്സ്ട്രാക്റ്റഡ് ടെക്സ്റ്റ് കാണിക്കുക'
    }
  }[lang];

  useEffect(() => {
    const handler = (e) => setLang(e?.detail || 'en');
    window.addEventListener('langChanged', handler);
    return () => window.removeEventListener('langChanged', handler);
  }, []);

  const validateField = (name, value) => {
    if (name === 'ph') {
      if (value === '' || value === null) return t.phReq;
      const v = Number(value);
      if (Number.isNaN(v)) return t.phNum;
      if (v < 0 || v > 14) return t.phRange;
      return '';
    }
    if (name === 'organicMatter' || name === 'moisture') {
      if (value === '' || value === null) return '';
      const v = Number(value);
      if (Number.isNaN(v)) return 'Enter a valid number';
      if (v < 0 || v > 100) return 'Value must be between 0 and 100';
      return '';
    }
    if (name === 'nitrogen' || name === 'phosphorus' || name === 'potassium') {
      if (value === '' || value === null) return '';
      const v = Number(value);
      if (Number.isNaN(v)) return 'Enter a valid number';
      if (v < 0) return 'Value must be ≥ 0';
      if (v > 5000) return 'Value looks too large';
      return '';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };
  
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
      
      // validate all before submit
      const submitErrors = {
        ph: validateField('ph', form.ph),
        organicMatter: validateField('organicMatter', form.organicMatter),
        moisture: validateField('moisture', form.moisture),
        nitrogen: validateField('nitrogen', form.nitrogen),
        phosphorus: validateField('phosphorus', form.phosphorus),
        potassium: validateField('potassium', form.potassium)
      };
      setErrors((prev) => ({ ...prev, ...submitErrors }));
      setTouched((t) => ({ ...t, ph: true, organicMatter: true, moisture: true, nitrogen: true, phosphorus: true, potassium: true }));
      if (Object.values(submitErrors).some(Boolean)) {
        setLoading(false);
        return;
      }
      
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

  const handleOcrUpload = async (file) => {
    if (!file) return;
    setOcrError('');
    setOcrSummary('');
    setOcrText('');
    setUploadProgress(0);
    setOcrLoading(true);
    try {
      if (file.type !== 'application/pdf') {
        setOcrError('Please upload a PDF file.');
        setOcrLoading(false);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setOcrError('PDF size must be under 10MB.');
        setOcrLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/farmer/ocr/pdf-summary', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const pct = Math.round((evt.loaded * 100) / evt.total);
          setUploadProgress(pct);
        }
      });
      if (res.data?.success) {
        setOcrSummary(res.data.summary || '');
        setOcrText(res.data.text || '');
      } else {
        setOcrError(res.data?.message || 'OCR failed.');
      }
    } catch (e) {
      setOcrError(e?.response?.data?.message || 'OCR failed.');
    } finally {
      setOcrLoading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleOcrUpload(file);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const isFormValid = !validateField('ph', form.ph)
    && !validateField('organicMatter', form.organicMatter)
    && !validateField('moisture', form.moisture)
    && !validateField('nitrogen', form.nitrogen)
    && !validateField('phosphorus', form.phosphorus)
    && !validateField('potassium', form.potassium);

  // Styled Components for PDF Upload
  const StyledWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    margin: 20px 0;
    
    .file-upload-form {
      width: fit-content;
      height: fit-content;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .file-upload-label input {
      display: none;
    }
    .file-upload-label svg {
      height: 50px;
      fill: #22c55e;
      margin-bottom: 20px;
    }
    .file-upload-label {
      cursor: pointer;
      background-color: #dcfce7;
      padding: 30px 70px;
      border-radius: 40px;
      border: 2px dashed #22c55e;
      box-shadow: 0px 0px 200px -50px rgba(34, 197, 94, 0.3);
      transition: all 0.3s ease;
    }
    .file-upload-label:hover {
      background-color: #bbf7d0;
    }
    .file-upload-design {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 5px;
    }
    .file-upload-design p {
      color: #16a34a;
      font-weight: 500;
    }
    .browse-button {
      background-color: #22c55e;
      padding: 5px 15px;
      border-radius: 10px;
      color: white;
      transition: all 0.3s;
    }
    .browse-button:hover {
      background-color: #16a34a;
    }
  `;

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
              <label className="block text-sm text-gray-700 mb-1">{t.ph}</label>
              <input 
                name="ph" 
                type="number" 
                step="0.1"
                min="0" 
                max="14"
                value={form.ph} 
                onChange={handleChange} 
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${touched.ph && errors.ph ? 'border-red-300 focus:ring-red-400' : 'border-[var(--ag-border)] focus:ring-[var(--ag-primary-500)]'}`} 
                required 
                placeholder={t.phPh}
              />
              {touched.ph && errors.ph && (<p className="mt-1 text-xs text-red-600">{errors.ph}</p>)}
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t.organic}</label>
              <input 
                name="organicMatter" 
                type="number" 
                step="0.1"
                min="0" 
                max="100"
                value={form.organicMatter} 
                onChange={handleChange} 
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${touched.organicMatter && errors.organicMatter ? 'border-red-300 focus:ring-red-400' : 'border-[var(--ag-border)] focus:ring-[var(--ag-primary-500)]'}`} 
                placeholder={t.organicPh}
              />
              {touched.organicMatter && errors.organicMatter && (<p className="mt-1 text-xs text-red-600">{errors.organicMatter}</p>)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t.moisture}</label>
              <input 
                name="moisture" 
                type="number" 
                step="0.1"
                min="0" 
                max="100"
                value={form.moisture} 
                onChange={handleChange} 
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${touched.moisture && errors.moisture ? 'border-red-300 focus:ring-red-400' : 'border-[var(--ag-border)] focus:ring-[var(--ag-primary-500)]'}`} 
                placeholder={t.moisturePh}
              />
              {touched.moisture && errors.moisture && (<p className="mt-1 text-xs text-red-600">{errors.moisture}</p>)}
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
                <option value="peaty">Peaty</option>
                <option value="chalky">Chalky</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">{t.nutrientTitle}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">{t.n}</label>
                <input 
                  name="nitrogen" 
                  type="number" 
                  step="0.1"
                  value={form.nitrogen} 
                  onChange={handleChange} 
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${touched.nitrogen && errors.nitrogen ? 'border-red-300 focus:ring-red-400' : 'border-[var(--ag-border)] focus:ring-[var(--ag-primary-500)]'}`} 
                  placeholder={t.nPh}
                />
                {touched.nitrogen && errors.nitrogen && (<p className="mt-1 text-xs text-red-600">{errors.nitrogen}</p>)}
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">{t.p}</label>
                <input 
                  name="phosphorus" 
                  type="number" 
                  step="0.1"
                  value={form.phosphorus} 
                  onChange={handleChange} 
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${touched.phosphorus && errors.phosphorus ? 'border-red-300 focus:ring-red-400' : 'border-[var(--ag-border)] focus:ring-[var(--ag-primary-500)]'}`} 
                  placeholder={t.pPh}
                />
                {touched.phosphorus && errors.phosphorus && (<p className="mt-1 text-xs text-red-600">{errors.phosphorus}</p>)}
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">{t.k}</label>
                <input 
                  name="potassium" 
                  type="number" 
                  step="0.1"
                  value={form.potassium} 
                  onChange={handleChange} 
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${touched.potassium && errors.potassium ? 'border-red-300 focus:ring-red-400' : 'border-[var(--ag-border)] focus:ring-[var(--ag-primary-500)]'}`} 
                  placeholder={t.kPh}
                />
                {touched.potassium && errors.potassium && (<p className="mt-1 text-xs text-red-600">{errors.potassium}</p>)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">{t.location}</label>
            <input 
              name="location" 
              type="text"
              value={form.location} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" 
              placeholder={t.locationPh}
            />
          </div>

          <button 
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full bg-[var(--ag-primary-600)] text-white py-2 rounded-lg hover:bg-[var(--ag-primary-700)] disabled:opacity-50 disabled:cursor-not-allowed shadow"
          >
            {loading ? t.analyzing : t.analyzeBtn}
          </button>
        </motion.form>

        <motion.div className="ag-card p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.uploadTitle}</h3>
            <p className="text-sm text-gray-600 mb-3">{t.uploadHint}</p>
            {ocrError && (
              <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm mb-3">{ocrError}</div>
            )}
            <StyledWrapper>
              <form className="file-upload-form">
                <label 
                  htmlFor="pdf-file" 
                  className="file-upload-label"
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                >
                  <div className="file-upload-design">
                    <svg viewBox="0 0 640 512" height="1em">
                      <path d="M144 480C64.5 480 0 415.5 0 336c0-62.8 40.2-116.2 96.2-135.9c-.1-2.7-.2-5.4-.2-8.1c0-88.4 71.6-160 160-160c59.3 0 111 32.2 138.7 80.2C409.9 102 428.3 96 448 96c53 0 96 43 96 96c0 12.2-2.3 23.8-6.4 34.6C596 238.4 640 290.1 640 352c0 70.7-57.3 128-128 128H144zm79-217c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l39-39V392c0 13.3 10.7 24 24 24s24-10.7 24-24V257.9l39 39c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-80-80c-9.4-9.4-24.6-9.4-33.9 0l-80 80z" />
                    </svg>
                    <p>Drag and Drop</p>
                    <p>or</p>
                    <span className="browse-button">Browse file</span>
                  </div>
                  <input 
                    id="pdf-file" 
                    ref={fileInputRef}
                    type="file" 
                    accept="application/pdf"
                    onChange={(e) => handleOcrUpload(e.target.files?.[0] || null)}
                  />
                </label>
              </form>
            </StyledWrapper>
            {ocrLoading && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div className="h-2 bg-[var(--ag-primary-500)]" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p className="text-xs text-gray-600 mt-1">{t.uploading} {uploadProgress}%</p>
              </div>
            )}
          </div>
          {ocrSummary && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700">✔</span>
                <h4 className="text-md font-medium text-gray-900">{t.pdfSummary}</h4>
              </div>
              <ul className="p-4 bg-gray-50 border border-[var(--ag-border)] rounded-lg text-sm text-gray-800 space-y-2">
                {ocrSummary.split('\n').filter(Boolean).map((line, idx) => {
                  const clean = line.replace(/^\s*-\s*/, '');
                  return (<li key={idx} className="flex items-start gap-2"><span className="mt-1 text-[var(--ag-primary-600)]">•</span><span>{clean}</span></li>);
                })}
              </ul>
              <details className="mt-2">
                <summary className="text-xs text-gray-600 cursor-pointer">{t.showText}</summary>
                <div className="mt-2 p-3 bg-white border border-[var(--ag-border)] rounded text-xs text-gray-700 whitespace-pre-wrap max-h-64 overflow-auto">{ocrText}</div>
              </details>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SoilAnalyzer;


