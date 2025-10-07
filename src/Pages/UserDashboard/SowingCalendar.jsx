import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Search, Download, Plus, Globe, Clock, CheckCircle, AlertCircle, XCircle, MapPin, Leaf, Info } from 'lucide-react';
import api from '../../services/api';

const SowingCalendar = () => {
  const [searchForm, setSearchForm] = useState({
    crop: '',
    region: '',
    season: ''
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cropOptions, setCropOptions] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('ag_lang') || 'en';
    } catch(_) { return 'en'; }
  });
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  // Localization data
  const translations = {
    en: {
      title: 'Sowing Calendar',
      subtitle: 'Find the perfect time to sow your crops',
      cropLabel: 'Select Crop',
      regionLabel: 'Region',
      seasonLabel: 'Season (Optional)',
      searchButton: 'Search Calendar',
      noResults: 'No sowing calendar found for this crop in your region',
      contactMessage: 'Please contact local agri-office for assistance',
      ideal: 'Ideal',
      possible: 'Possible',
      notRecommended: 'Not recommended',
      early: 'early',
      late: 'late',
      onTime: 'On Time',
      earlyStatus: 'Early',
      lateStatus: 'Late',
      addToLogbook: 'Add to Farm Logbook',
      exportPDF: 'Export to PDF',
      language: 'Language',
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      seasons: {
        Kharif: 'Kharif (Monsoon)',
        Rabi: 'Rabi (Winter)',
        Zaid: 'Zaid (Summer)'
      }
    },
    ml: {
      title: ' വിതൈകാലണ്ടർ',
      subtitle: 'നിങ്ങളുടെ വിളകൾ വിതയ്ക്കാനുള്ള മികച്ച സമയം കണ്ടെത്തുക',
      cropLabel: 'വിള തിരഞ്ഞെടുക്കുക',
      regionLabel: 'പ്രദേശം',
      seasonLabel: 'സീസൺ (ഐച്ഛികം)',
      searchButton: 'കാലണ്ടർ തിരയുക',
      noResults: 'നിങ്ങളുടെ പ്രദേശത്ത് ഈ വിളയ്ക്കുള്ള കാലണ്ടർ കണ്ടെത്താനായില്ല',
      contactMessage: 'സഹായത്തിന് ദയവായി പ്രാദേശിക കാർഷിക ഓഫീസുമായി ബന്ധപ്പെടുക',
      ideal: 'ഉത്തമം',
      possible: 'സാധ്യം',
      notRecommended: 'ശുപാർശ ചെയ്യാനാകില്ല',
      early: 'മുൻപ്',
      late: 'ശേഷം',
      onTime: 'സമയത്ത്',
      earlyStatus: 'മുൻപ്',
      lateStatus: 'ശേഷം',
      addToLogbook: 'ഫാം ലോഗ്ബുക്കിൽ ചേർക്കുക',
      exportPDF: 'PDF ആയി കയറ്റുമതി ചെയ്യുക',
      language: 'ഭാഷ',
      months: ['ജനു', 'ഫെബ്', 'മാര്‍', 'ഏപ്രി', 'മെയ്', 'ജൂണ്‍', 'ജൂലൈ', 'ആഗ', 'സെപ്', 'ഒക്', 'നവം', 'ഡിസം'],
      seasons: {
        Kharif: 'ഖരീഫ് (മൺസൂൺ)',
        Rabi: 'റബി (ശൈത്യകാലം)',
        Zaid: 'സൈദ് (വേനൽ)'
      }
    }
  };

  const t = translations[language];

  // Load crop options on component mount
  useEffect(() => {
    loadCropOptions();
  }, []);

  // Listen for language changes from Navbar
  useEffect(() => {
    const onLangChanged = (e) => {
      const next = e?.detail || (() => { try { return localStorage.getItem('ag_lang') || 'en'; } catch(_) { return 'en'; }})();
      setLanguage(next);
    };
    try { window.addEventListener('langChanged', onLangChanged); } catch(_) {}
    return () => { try { window.removeEventListener('langChanged', onLangChanged); } catch(_) {} };
  }, []);

  const loadCropOptions = async () => {
    try {
      // Try to get crops from sowing calendar endpoint
      const response = await api.get('/farmer/sowing-calendar?list=true');
      if (response.data?.crops) {
        setCropOptions(response.data.crops);
      } else {
        // Fallback to hardcoded common crops
        setCropOptions([
          'Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Mustard', 
          'Chickpea', 'Soybean', 'Groundnut', 'Sunflower', 'Potato', 'Tomato'
        ]);
      }
    } catch (error) {
      console.error('Failed to load crop options:', error);
      // Fallback to hardcoded crops
      setCropOptions([
        'Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Mustard', 
        'Chickpea', 'Soybean', 'Groundnut', 'Sunflower', 'Potato', 'Tomato'
      ]);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchForm.crop) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const params = new URLSearchParams({ crop: searchForm.crop });
      if (searchForm.region) params.append('region', searchForm.region);
      if (searchForm.season) params.append('season', searchForm.season);

      const response = await api.get(`/farmer/sowing-calendar?${params}`);
      
      if (response.data?.results?.length > 0) {
        setResults(response.data.results);
        setSelectedResult(response.data.results[0]);
      } else {
        setError(t.noResults);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch sowing calendar');
    } finally {
      setLoading(false);
    }
  };

  const getMonthIndex = (monthName) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months.indexOf(monthName) + 1;
  };

  const getTimelineData = (result) => {
    if (!result) return [];

    const startIndex = getMonthIndex(result.startMonth);
    const endIndex = getMonthIndex(result.endMonth);
    
    const timeline = [];
    
    for (let month = 1; month <= 12; month++) {
      let status = 'not-recommended';
      let tooltip = t.notRecommended;
      
      if (startIndex <= endIndex) {
        // Normal case: start to end
        if (month >= startIndex && month <= endIndex) {
          status = 'ideal';
          tooltip = t.ideal;
        } else if (month === startIndex - 1 || month === endIndex + 1) {
          status = 'possible';
          tooltip = month === startIndex - 1 ? `${t.possible} (${t.early})` : `${t.possible} (${t.late})`;
        }
      } else {
        // Wrap-around case: start to 12, then 1 to end
        if (month >= startIndex || month <= endIndex) {
          status = 'ideal';
          tooltip = t.ideal;
        } else if (month === startIndex - 1 || month === endIndex + 1) {
          status = 'possible';
          tooltip = month === startIndex - 1 ? `${t.possible} (${t.early})` : `${t.possible} (${t.late})`;
        }
      }
      
      timeline.push({
        month,
        monthName: t.months[month - 1],
        status,
        tooltip
      });
    }
    
    return timeline;
  };

  const getCurrentStatus = (result) => {
    if (!result) return { status: 'unknown', message: '' };
    
    const timeline = getTimelineData(result);
    const currentMonthData = timeline.find(m => m.month === currentMonth);
    
    if (currentMonthData?.status === 'ideal') {
      return { status: 'on-time', message: t.onTime };
    } else if (currentMonthData?.status === 'possible') {
      const startIndex = getMonthIndex(result.startMonth);
      const isEarly = currentMonth === startIndex - 1;
      return { 
        status: isEarly ? 'early' : 'late', 
        message: isEarly ? t.earlyStatus : t.lateStatus 
      };
    } else {
      return { status: 'late', message: t.lateStatus };
    }
  };

  const handleAddToLogbook = async (result) => {
    try {
      const logData = {
        date: new Date().toISOString().split('T')[0],
        activityType: 'Sowing',
        crop: result.crop,
        notes: `Saved from Sowing Calendar. Ideal window: ${result.startMonth}–${result.endMonth}${result.region ? `, Region: ${result.region}` : ''}${result.season ? `, Season: ${result.season}` : ''}.`
      };

      await api.post('/farmer/logs', logData);
      alert('Sowing date saved to Farm Logbook!');
    } catch (error) {
      console.error('Failed to add to logbook:', error);
      alert('Failed to add to logbook. Please try again.');
    }
  };

  const handleExportPDF = async (result) => {
    try {
      const reportData = {
        type: 'sowing_calendar',
        data: {
          crop: result.crop,
          region: result.region,
          season: result.season,
          startMonth: result.startMonth,
          endMonth: result.endMonth,
          varieties: result.varieties,
          notes: result.notes,
          source: result.source,
          lastUpdated: result.lastUpdated
        }
      };
      
      const response = await api.post('/farmer/reports/generate', reportData);
      if (response.data?.success) {
        // In a real implementation, this would download the PDF
        alert('PDF report generated successfully!');
      }
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22,0.61,0.36,1] }}
        className="ag-card overflow-hidden relative ag-texture-soil"
      >
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1597474417024-3ca3baa9fb13?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Indian paddy fields"
            className="w-full h-48 md:h-64 object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://source.unsplash.com/1600x400/?india,farmer,fields';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute inset-0 flex items-end">
            <div className="px-6 md:px-8 pb-5">
              <h2 className="ag-display text-2xl md:text-3xl font-bold text-white flex items-center gap-3 drop-shadow">
                <Calendar className="w-8 h-8 text-white" />
                {t.title}
              </h2>
              <p className="text-white/90 mt-1 ag-label md:text-base max-w-2xl drop-shadow">{t.subtitle}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search Form */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.22,0.61,0.36,1] }}
        className="ag-card p-6 sticky top-4 z-30"
      >
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block ag-label font-medium text-gray-700 mb-2">
                <Leaf className="w-4 h-4 inline mr-2" />
                {t.cropLabel} *
              </label>
              <select
                value={searchForm.crop}
                onChange={(e) => setSearchForm({ ...searchForm, crop: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--ag-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
                required
              >
                <option value="">{t.cropLabel}</option>
                {cropOptions.map((crop) => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block ag-label font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                {t.regionLabel}
              </label>
              <input
                type="text"
                value={searchForm.region}
                onChange={(e) => setSearchForm({ ...searchForm, region: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--ag-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
                placeholder="e.g., Punjab, Kerala"
              />
            </div>

            <div>
              <label className="block ag-label font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                {t.seasonLabel}
              </label>
              <select
                value={searchForm.season}
                onChange={(e) => setSearchForm({ ...searchForm, season: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--ag-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
              >
                <option value="">All Seasons</option>
                <option value="Kharif">{t.seasons.Kharif}</option>
                <option value="Rabi">{t.seasons.Rabi}</option>
                <option value="Zaid">{t.seasons.Zaid}</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !searchForm.crop}
            className="w-full md:w-auto bg-[var(--ag-primary-600)] text-white px-6 py-2 rounded-xl hover:bg-[var(--ag-primary-700)] disabled:opacity-50 disabled:cursor-not-allowed shadow flex items-center justify-center gap-2 ag-touch ag-focus-ring"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Searching...' : t.searchButton}
          </button>
        </form>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="ag-card p-4 bg-red-50 border border-red-200"
          >
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-red-800 font-medium">{error}</p>
                <p className="text-red-600 text-sm mt-1">{t.contactMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Result Cards */}
            <div className="grid gap-4">
              {results.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`ag-card p-6 cursor-pointer transition-all duration-300 ${
                    selectedResult === result 
                      ? 'ring-2 ring-[var(--ag-primary-500)] bg-[var(--ag-primary-50)]' 
                      : 'hover:shadow-xl'
                  }`}
                  onClick={() => setSelectedResult(result)}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{result.crop}</h3>
                        <span className="px-3 py-1 bg-[var(--ag-primary-100)] text-[var(--ag-primary-700)] rounded-full ag-label font-medium">
                          {result.season}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{result.region}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{result.startMonth} - {result.endMonth}</span>
                        </div>
                        {result.agroZone && (
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            <span>{result.agroZone}</span>
                          </div>
                        )}
                        {result.source && (
                          <div className="flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            <span>{result.source}</span>
                          </div>
                        )}
                      </div>
                      {result.notes && (
                        <p className="ag-label text-gray-600 mt-2">{result.notes}</p>
                      )}
                      {result.varieties && result.varieties.length > 0 && (
                        <div className="mt-2">
                          <p className="ag-label font-medium text-gray-700 mb-1">Varieties:</p>
                          <div className="flex flex-wrap gap-1">
                            {result.varieties.map((variety, idx) => (
                              <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded ag-fine">
                                {variety}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToLogbook(result);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        {t.addToLogbook}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportPDF(result);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Download className="w-4 h-4" />
                        {t.exportPDF}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Timeline Visualization */}
            {selectedResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="ag-card p-6"
              >
                <div className="mb-6">
                  <h3 className="ag-subhead font-semibold text-gray-900 mb-2">
                    Sowing Timeline for {selectedResult.crop}
                  </h3>
                  <div className="flex items-center gap-4 ag-label text-gray-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Ideal sowing period</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span>Possible (early/late)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>Not recommended</span>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="grid grid-cols-12 gap-2 mb-4">
                  {getTimelineData(selectedResult).map((month, index) => (
                    <div
                      key={index}
                      className={`relative group`}
                    >
                      <div
                        className={`h-12 rounded-lg flex items-center justify-center ag-fine font-medium transition-all duration-300 ${
                          month.status === 'ideal'
                            ? 'ag-season--ideal'
                            : month.status === 'possible'
                            ? 'ag-season--possible'
                            : 'ag-season--not'
                        } ${
                          month.month === currentMonth ? 'ring-2 ring-[var(--ag-sky-500)] shadow-lg' : ''
                        }`}
                        title={month.tooltip}
                      >
                        {month.monthName}
                      </div>
                      {month.month === currentMonth && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-green-700 ag-label">🌱</div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Status Message */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const status = getCurrentStatus(selectedResult);
                      const Icon = status.status === 'on-time' ? CheckCircle : 
                                   status.status === 'early' ? AlertCircle : XCircle;
                      const color = status.status === 'on-time' ? 'text-green-600' : 
                                   status.status === 'early' ? 'text-yellow-600' : 'text-red-600';
                      return <Icon className={`w-5 h-5 ${color}`} />;
                    })()}
                    <div>
                      <p className="ag-label font-medium text-gray-900">
                        Current Status: {getCurrentStatus(selectedResult).message}
                      </p>
                      {getCurrentStatus(selectedResult).status === 'late' && (
                        <p className="ag-fine text-gray-600 mt-1">
                          Your sowing window has closed. Consult local KVK for late-sowing advisories.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Simple themed footer */}
      <div className="ag-card mt-6 p-6 text-center">
        <p className="text-sm text-gray-600">
          Crafted for Indian agriculture • Stay informed on seasonal sowing and regional advisories.
        </p>
      </div>
    </div>
  );
};

export default SowingCalendar;
