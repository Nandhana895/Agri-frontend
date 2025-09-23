import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, FileDown, Filter, Globe2, Leaf, Link as LinkIcon, Loader2, Save, Search, Tag, Wallet } from 'lucide-react';
import authService from '../../services/authService';
import api from '../../services/api';

const categories = [
  { value: '', label: 'All' },
  { value: 'Insurance', label: 'Insurance' },
  { value: 'Subsidy', label: 'Subsidy' },
  { value: 'Loan', label: 'Loan' },
  { value: 'Support Price', label: 'Support Price' },
  { value: 'Other', label: 'Other' },
];

const categoryColor = (c) => {
  switch (c) {
    case 'Insurance': return 'bg-blue-100 text-blue-700';
    case 'Subsidy': return 'bg-green-100 text-green-700';
    case 'Loan': return 'bg-yellow-100 text-yellow-700';
    case 'Support Price': return 'bg-emerald-100 text-emerald-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const Badge = ({ children, className = '' }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>{children}</span>
);

const SchemeCard = ({ s, onSave }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🏷</span>
            <h3 className="text-lg font-semibold text-gray-900">{s.title}</h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge className={`flex items-center gap-1 ${categoryColor(s.category)}`}>
              <Tag className="w-3.5 h-3.5" /> {s.category || 'Other'}
            </Badge>
            {(s.crop || []).slice(0, 6).map((c, i) => (
              <Badge key={i} className="bg-green-50 text-green-700 border border-green-200">
                <Leaf className="w-3.5 h-3.5 inline mr-1" />{c}
              </Badge>
            ))}
            {(s.region || []).slice(0, 6).map((r, i) => (
              <Badge key={`r-${i}`} className="bg-slate-50 text-slate-700 border border-slate-200">
                <Globe2 className="w-3.5 h-3.5 inline mr-1" />{r}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
        {s.eligibility && (
          <div>
            <div className="font-medium mb-1">✅ Eligibility</div>
            <div className="text-gray-700 leading-relaxed">{s.eligibility}</div>
          </div>
        )}
        {s.benefits && (
          <div>
            <div className="font-medium mb-1">💰 Benefits</div>
            <div className="text-gray-700 leading-relaxed">{s.benefits}</div>
          </div>
        )}
        {s.howToApply && (
          <div className="md:col-span-2">
            <div className="font-medium mb-1">📌 How to Apply</div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-gray-700 leading-relaxed flex-1">{s.howToApply}</p>
              {/^https?:\/\//i.test(s.howToApply) && (
                <a href={s.howToApply} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <LinkIcon className="w-4 h-4" /> Open
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-600">
        {s.startDate || s.endDate ? (
          <Badge className="bg-gray-100 text-gray-700">🕒 {s.startDate ? new Date(s.startDate).toLocaleDateString() : '—'} → {s.endDate ? new Date(s.endDate).toLocaleDateString() : '—'}</Badge>
        ) : null}
        {s.source && (
          <a href={s.source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--ag-primary-700)] hover:underline">
            <Wallet className="w-3.5 h-3.5" /> Source
          </a>
        )}
        {s.lastUpdated && (
          <span className="text-gray-400">Updated {new Date(s.lastUpdated).toLocaleDateString()}</span>
        )}
        <button onClick={() => onSave?.(s)} className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border hover:bg-[var(--ag-muted)]">
          <Save className="w-3.5 h-3.5" /> Save to Logbook
        </button>
      </div>
    </motion.div>
  );
};

const GovernmentSchemes = () => {
  const user = authService.getCurrentUser();
  const [region, setRegion] = useState(() => user?.region || '');
  const [crop, setCrop] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [schemes, setSchemes] = useState([]);
  const [allCrops, setAllCrops] = useState(['All', 'Rice', 'Wheat', 'Maize', 'Banana', 'Coconut']);
  const [notif, setNotif] = useState('');

  // Load from cache first
  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('ag_schemes_cache') || '[]');
      if (Array.isArray(cached) && cached.length) setSchemes(cached);
    } catch (_) {}
  }, []);

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (crop) params.append('crop', crop);
      if (region) params.append('region', region);
      const { data } = await api.get(`/farmer/schemes?${params.toString()}`);
      // API may return list or message
      if (Array.isArray(data)) {
        // detect newly added
        if (schemes.length && data.length > schemes.length) {
          setNotif(`${data.length - schemes.length} new scheme(s) available in your area`);
          setTimeout(() => setNotif(''), 5000);
        }
        setSchemes(data);
        try { localStorage.setItem('ag_schemes_cache', JSON.stringify(data)); } catch (_) {}
      } else if (data?.message) {
        setSchemes([]);
      } else if (data?.results) {
        if (schemes.length && data.results.length > schemes.length) {
          setNotif(`${data.results.length - schemes.length} new scheme(s) available in your area`);
          setTimeout(() => setNotif(''), 5000);
        }
        setSchemes(data.results);
      } else {
        setSchemes([]);
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to fetch schemes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // set crop from last selection if present
    try { const last = localStorage.getItem('ag_last_crop'); if (last) setCrop(last); } catch (_) {}
    fetchSchemes();
    const id = setInterval(fetchSchemes, 60000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = schemes || [];
    if (category) list = list.filter(s => String(s.category) === category);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        String(s.title || '').toLowerCase().includes(q) ||
        String(s.eligibility || '').toLowerCase().includes(q) ||
        String(s.benefits || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [schemes, category, search]);

  const exportPdf = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const marginX = 40;
    let y = 50;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Government Schemes', marginX, y); y += 18;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    filtered.slice(0, 40).forEach((s, idx) => {
      y += 14;
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${s.title}`, marginX, y);
      doc.setFont('helvetica', 'normal');
      y += 14; doc.text(`Category: ${s.category || 'Other'}`, marginX, y);
      y += 14; doc.text(`Crops: ${(s.crop || []).join(', ')}`, marginX, y);
      y += 14; doc.text(`Region: ${(s.region || []).join(', ')}`, marginX, y);
      if (s.eligibility) { y += 14; doc.text(`Eligibility: ${s.eligibility}`.slice(0, 120), marginX, y); }
      if (s.benefits) { y += 14; doc.text(`Benefits: ${s.benefits}`.slice(0, 120), marginX, y); }
      if (s.source) { y += 14; doc.text(`Source: ${s.source}`.slice(0, 120), marginX, y); }
      y += 8;
      if (y > 760) { doc.addPage(); y = 50; }
    });
    doc.save('government_schemes.pdf');
  };

  const saveToLogbook = async (s) => {
    try {
      const cropName = Array.isArray(s.crop) ? s.crop[0] : s.crop;
      const regions = Array.isArray(s.region) ? s.region.join(', ') : s.region;
      const noteParts = [
        `Scheme: ${s.title}`,
        s.category ? `Category: ${s.category}` : '',
        cropName ? `Crops: ${Array.isArray(s.crop) ? s.crop.join(', ') : s.crop}` : '',
        regions ? `Region: ${regions}` : '',
        s.source ? `Source: ${s.source}` : ''
      ].filter(Boolean);

      const logData = {
        date: new Date().toISOString().split('T')[0],
        activityType: 'Government Scheme',
        crop: cropName || undefined,
        notes: noteParts.join(' | ')
      };

      await api.post('/farmer/logs', logData);
      setNotif('Saved to your logbook');
      setTimeout(() => setNotif(''), 3000);
    } catch (e) {
      setNotif('Failed to save');
      setTimeout(() => setNotif(''), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🌐 Government Schemes</h2>
          <p className="text-gray-600">Discover subsidies, insurance, and support programs for farmers.</p>
        </div>
        <button onClick={exportPdf} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          <FileDown className="w-4 h-4" /> Export PDF
        </button>
      </div>

      {notif && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 rounded-xl px-3 py-2">
          <Bell className="w-4 h-4" />
          <span className="text-sm">{notif}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Region</label>
            <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g., Kerala" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Crop</label>
            <select value={crop} onChange={(e) => { setCrop(e.target.value); try { localStorage.setItem('ag_last_crop', e.target.value); } catch (_) {} }} className="w-full px-3 py-2 border rounded-lg">
              {allCrops.map((c) => (
                <option key={c} value={c === 'All' ? '' : c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              {categories.map((c) => (
                <option key={c.value || 'all'} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, benefits, eligibility" className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200" />
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button onClick={fetchSchemes} className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-[var(--ag-muted)]">
            <Filter className="w-4 h-4" /> Apply Filters
          </button>
          <button onClick={() => { setCrop(''); setCategory(''); setSearch(''); }} className="text-sm text-gray-600 hover:underline">Reset</button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-600">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading schemes...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>
      ) : schemes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center text-gray-600">
          No schemes available for your crop/region.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {filtered.map((s, i) => (
            <SchemeCard key={i} s={s} onSave={saveToLogbook} />
          ))}
        </div>
      )}
    </div>
  );
};

export default GovernmentSchemes;


