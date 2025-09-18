import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import authService from '../../services/authService';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const user = authService.getCurrentUser();
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('ag_lang') || 'en'; } catch(_) { return 'en'; }
  });

  const t = {
    en: {
      loading: 'Loading reports...',
      title: 'Farm Reports',
      subtitle: "Generate comprehensive reports about your farm's performance, soil health, and recommendations.",
      genTitle: 'Report Generation',
      summaryTitle: 'Farm Summary',
      summaryDesc: "Complete overview of your farm's current status, including soil health, crop recommendations, and performance metrics.",
      soilTitle: 'Soil Analysis',
      soilDesc: 'Detailed soil health report with pH levels, nutrient analysis, and improvement recommendations.',
      cropTitle: 'Crop Recommendations',
      cropDesc: 'AI-powered crop suggestions based on your soil conditions and climate data.',
      generating: 'Generating...',
      genSummary: 'Generate Summary Report',
      genSoil: 'Generate Soil Report',
      genCrop: 'Generate Crop Report',
      generatedList: 'Generated Reports',
      generatedWord: 'Generated',
      download: 'Download',
      emptyTitle: 'No reports generated yet',
      emptySubtitle: 'Generate your first report using the options above'
    },
    ml: {
      loading: 'റിപ്പോർട്ടുകൾ ലോഡ് ചെയ്യുന്നു...',
      title: 'ഫാം റിപ്പോർട്ടുകൾ',
      subtitle: 'നിങ്ങളുടെ ഫാമിന്റെ പ്രകടനം, മണ്ണ് ആരോഗ്യം, ശുപാർശകൾ എന്നിവയുടെ സമഗ്ര റിപ്പോർട്ടുകൾ സൃഷ്ടിക്കുക.',
      genTitle: 'റിപ്പോർട്ട് ജനറേഷൻ',
      summaryTitle: 'ഫാം സമരി',
      summaryDesc: 'നിങ്ങളുടെ ഫാമിന്റെ നിലവിലെ നിലയുടെ സമ്പൂർണ്ണ അവലോകനം: മണ്ണ് ആരോഗ്യം, വിള ശുപാർശകൾ, പ്രകടന മീറ്റ്രിക്കുകൾ.',
      soilTitle: 'മണ്ണ് വിശകലനം',
      soilDesc: 'pH നിരക്കുകൾ, പോഷക വിശകലനം, മെച്ചപ്പെടുത്തൽ നിർദ്ദേശങ്ങൾ എന്നിവയുള്ള വിശദമായ മണ്ണ് റിപ്പോർട്ട്.',
      cropTitle: 'വിള ശുപാർശകൾ',
      cropDesc: 'മണ്ണിന്റെ അവസ്ഥയും കാലാവസ്ഥ ഡാറ്റയും അടിസ്ഥാനമാക്കി AI നൽകുന്ന വിള നിർദ്ദേശങ്ങൾ.',
      generating: 'ജനറേറ്റ് ചെയ്യുന്നു...',
      genSummary: 'സമരി റിപ്പോർട്ട് ജനറേറ്റ് ചെയ്യുക',
      genSoil: 'മണ്ണ് റിപ്പോർട്ട് ജനറേറ്റ് ചെയ്യുക',
      genCrop: 'വിള റിപ്പോർട്ട് ജനറേറ്റ് ചെയ്യുക',
      generatedList: 'സൃഷ്ടിച്ച റിപ്പോർട്ടുകൾ',
      generatedWord: 'സൃഷ്ടിച്ചത്',
      download: 'ഡൗൺലോഡ്',
      emptyTitle: 'ഇനിയും റിപ്പോർട്ടുകൾ സൃഷ്ടിച്ചിട്ടില്ല',
      emptySubtitle: 'മുകളിൽ കാണുന്ന ഓപ്ഷനുകൾ ഉപയോഗിച്ച് നിങ്ങളുടെ ആദ്യ റിപ്പോർട്ട് സൃഷ്ടിക്കുക'
    }
  }[lang];

  useEffect(() => {
    const handler = (e) => setLang(e?.detail || 'en');
    window.addEventListener('langChanged', handler);
    return () => window.removeEventListener('langChanged', handler);
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await api.get('/farmer/reports');
        if (response.data?.success) {
          setReports(response.data.data || []);
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const generateReport = async (type) => {
    try {
      setGenerating(true);
      const response = await api.post('/farmer/reports/generate', { type });
      
      if (response.data?.success) {
        // If the response contains a URL, open it
        if (response.data.url) {
          window.open(response.data.url, '_blank');
        } else {
          // If it's a data URL or blob, create a download link
          const blob = new Blob([response.data.data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `farm-report-${type}-${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
        
        // Refresh reports list
        const reportsResponse = await api.get('/farmer/reports');
        if (reportsResponse.data?.success) {
          setReports(reportsResponse.data.data || []);
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = (reportId) => {
    window.open(`/api/farmer/reports/${reportId}/download`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--ag-primary-500)] mx-auto mb-4"></div>
          <p className="text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

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

      {error && (
        <div className="ag-card p-4 bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      {/* Report Generation */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="ag-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{t.summaryTitle}</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">{t.summaryDesc}</p>
          <button
            onClick={() => generateReport('summary')}
            disabled={generating}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? t.generating : t.genSummary}
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="ag-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{t.soilTitle}</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">{t.soilDesc}</p>
          <button
            onClick={() => generateReport('soil')}
            disabled={generating}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {generating ? t.generating : t.genSoil}
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="ag-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{t.cropTitle}</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">{t.cropDesc}</p>
          <button
            onClick={() => generateReport('crops')}
            disabled={generating}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {generating ? t.generating : t.genCrop}
          </button>
        </motion.div>
      </div>

      {/* Existing Reports */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="ag-card p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.generatedList}</h3>
        {reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border border-[var(--ag-border)] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{report.name}</p>
                    <p className="text-sm text-gray-500">
                      {report.type} • {t.generatedWord} {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => downloadReport(report.id)}
                  className="px-3 py-1 text-sm bg-[var(--ag-primary-500)] text-white rounded-lg hover:bg-[var(--ag-primary-600)]"
                >
                  {t.download}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-sm">{t.emptyTitle}</p>
            <p className="text-gray-400 text-xs mt-1">{t.emptySubtitle}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Reports;


