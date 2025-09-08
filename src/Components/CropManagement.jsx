import React, { useEffect, useState } from 'react';
import api from '../services/api';

const CropManagement = () => {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', cultivationTips: '' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchCrops = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/crops?limit=100');
      setCrops(res.data?.crops || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load crops');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCrops(); }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        cultivationTips: form.cultivationTips
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean),
      };
      // Create crop first
      const createRes = await api.post('/admin/crops', payload);
      const created = createRes.data?.crop;
      // If file chosen, upload
      if (file && created?._id) {
        const formData = new FormData();
        formData.append('image', file);
        await api.post(`/admin/crops/${created._id}/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setForm({ name: '', description: '', cultivationTips: '' });
      setFile(null);
      fetchCrops();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to add crop');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this crop?')) return;
    try {
      await api.delete(`/admin/crops/${id}`);
      fetchCrops();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to delete crop');
    }
  };

  return (
    <div className="space-y-6">
      <div className="ag-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Crop</h2>
        {error && <div className="mb-3 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Crop Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="w-full px-3 py-2 border border-[var(--ag-border)] rounded-lg" required />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Crop Image</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full px-3 py-2 border border-[var(--ag-border)] rounded-lg" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="w-full px-3 py-2 border border-[var(--ag-border)] rounded-lg" rows={3} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cultivation Details (one per line)</label>
            <textarea name="cultivationTips" value={form.cultivationTips} onChange={handleChange} className="w-full px-3 py-2 border border-[var(--ag-border)] rounded-lg" rows={4} placeholder={'Prepare soil\nSow seeds\nIrrigation schedule'} />
          </div>
          <div className="md:col-span-2">
            <button disabled={saving} className="px-4 py-2 bg-[var(--ag-primary-500)] text-white rounded-lg hover:bg-[var(--ag-primary-600)]">{saving ? 'Saving...' : 'Add Crop'}</button>
          </div>
        </form>
      </div>

      <div className="ag-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[var(--ag-border)] bg-[var(--ag-muted)]">
          <h2 className="font-semibold text-gray-900">Crops</h2>
        </div>
        {loading ? (
          <div className="p-4">Loading...</div>
        ) : (
          <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
            {crops.map(c => (
              <div key={c._id} className="border border-[var(--ag-border)] rounded-lg overflow-hidden">
                {c.imageUrl ? <img src={c.imageUrl} alt={c.name} className="w-full h-32 object-cover" /> : <div className="w-full h-32 bg-gray-100" />}
                <div className="p-4 space-y-2">
                  <div className="font-semibold text-gray-900">{c.name}</div>
                  <div className="text-sm text-gray-700 line-clamp-3">{c.description}</div>
                  {Array.isArray(c.cultivationTips) && c.cultivationTips.length > 0 && (
                    <ul className="text-xs text-gray-600 list-disc pl-4">
                      {c.cultivationTips.slice(0,4).map((t,i) => <li key={i}>{t}</li>)}
                    </ul>
                  )}
                  <div className="flex justify-end">
                    <button onClick={() => handleDelete(c._id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CropManagement;


