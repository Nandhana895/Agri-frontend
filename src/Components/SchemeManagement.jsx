import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const emptyForm = {
  title: '', crop: '', region: '', category: 'Other', eligibility: '', benefits: '', howToApply: '', startDate: '', endDate: '', source: ''
};

const SchemeManagement = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [bulkText, setBulkText] = useState('');
  const [bulkFormat, setBulkFormat] = useState('json');
  const [hideExpired, setHideExpired] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get(`/admin/schemes?includeExpired=${hideExpired ? 'false' : 'true'}`);
      setList(data?.schemes || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load schemes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => list, [list]);

  const upsert = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        title: form.title,
        crop: (form.crop || '').split(',').map(s => s.trim()).filter(Boolean),
        region: (form.region || '').split(',').map(s => s.trim()).filter(Boolean),
        category: form.category || 'Other',
        eligibility: form.eligibility,
        benefits: form.benefits,
        howToApply: form.howToApply,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        source: form.source,
      };
      if (editingId) {
        await api.put(`/admin/schemes/${editingId}`, payload);
      } else {
        await api.post('/admin/schemes', payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      await fetchData();
    } catch (e) {
      alert(e?.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const onEdit = (s) => {
    setEditingId(s._id || s.id || null);
    setForm({
      title: s.title || '',
      crop: (s.crop || []).join(', '),
      region: (s.region || []).join(', '),
      category: s.category || 'Other',
      eligibility: s.eligibility || '',
      benefits: s.benefits || '',
      howToApply: s.howToApply || '',
      startDate: s.startDate ? String(s.startDate).slice(0,10) : '',
      endDate: s.endDate ? String(s.endDate).slice(0,10) : '',
      source: s.source || ''
    });
  };

  const onDelete = async (s) => {
    if (!window.confirm('Delete this scheme?')) return;
    try {
      await api.delete(`/admin/schemes/${s._id || s.id}`);
      await fetchData();
    } catch (e) {
      alert(e?.response?.data?.message || 'Delete failed');
    }
  };

  const doBulk = async () => {
    try {
      setLoading(true);
      await api.post('/admin/schemes/bulk', { format: bulkFormat, data: bulkText });
      setBulkText('');
      await fetchData();
    } catch (e) {
      alert(e?.response?.data?.message || 'Bulk upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Scheme Management</h2>
          <p className="text-gray-600">Add, edit, delete, or bulk upload government schemes.</p>
        </div>
        <label className="text-sm text-gray-700 flex items-center gap-2">
          <input type="checkbox" checked={hideExpired} onChange={(e) => setHideExpired(e.target.checked)} /> Hide expired
        </label>
      </div>

      {/* Form */}
      <form onSubmit={upsert} className="ag-card p-4 grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Title</label>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Category</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
            {['Subsidy','Insurance','Loan','Support Price','Other'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Crops (comma-separated)</label>
          <input value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Regions (comma-separated)</label>
          <input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Eligibility</label>
          <textarea rows={2} value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Benefits</label>
          <textarea rows={2} value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">How to Apply (URL or text)</label>
          <textarea rows={2} value={form.howToApply} onChange={(e) => setForm({ ...form, howToApply: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Start Date</label>
          <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">End Date</label>
          <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Source (URL)</label>
          <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div className="md:col-span-2 flex items-center gap-3">
          <button type="submit" className="px-4 py-2 bg-[var(--ag-primary-500)] text-white rounded-lg hover:bg-[var(--ag-primary-600)]">{editingId ? 'Update Scheme' : 'Add Scheme'}</button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="px-4 py-2 border rounded-lg">Cancel</button>}
        </div>
      </form>

      {/* Bulk Upload */}
      <div className="ag-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Bulk Upload</h3>
          <select value={bulkFormat} onChange={(e) => setBulkFormat(e.target.value)} className="px-2 py-1 border rounded">
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
        </div>
        <textarea rows={6} value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder={bulkFormat === 'csv' ? 'title,crop,region,category,eligibility,benefits,howToApply,startDate,endDate,source\nPMFBY,"Rice;Wheat","All India",Insurance,All farmers,Premium subsidy up to 50%,https://pmfby.gov.in,2025-01-01,2025-12-31,https://pmfby.gov.in' : '[\n  { "title": "Pradhan Mantri Fasal Bima Yojana", "crop": ["Rice","Wheat"], "region": ["All India"], "category": "Insurance", "eligibility": "All farmers with valid Kisan Credit Card", "benefits": "Premium subsidy up to 50%", "howToApply": "https://pmfby.gov.in", "source": "https://pmfby.gov.in" }\n]'} className="w-full px-3 py-2 border rounded-lg font-mono text-xs" />
        <div className="mt-3">
          <button onClick={doBulk} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Upload</button>
        </div>
      </div>

      {/* List */}
      <div className="ag-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[var(--ag-border)] bg-[var(--ag-muted)]">
          <h3 className="font-semibold text-gray-900">Schemes ({filtered.length})</h3>
        </div>
        <div className="divide-y divide-[var(--ag-border)]">
          {filtered.length === 0 && <div className="p-4 text-gray-600">No schemes.</div>}
          {filtered.map((s, idx) => (
            <div key={idx} className="p-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{s.title}</div>
                <div className="text-xs text-gray-600">{(s.crop || []).join(', ')} | {(s.region || []).join(', ')} | {s.category}</div>
                {s.endDate && <div className="text-xs text-gray-400">Ends: {new Date(s.endDate).toLocaleDateString()}</div>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onEdit(s)} className="px-3 py-1 border rounded-lg">Edit</button>
                <button onClick={() => onDelete(s)} className="px-3 py-1 bg-red-600 text-white rounded-lg">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SchemeManagement;


