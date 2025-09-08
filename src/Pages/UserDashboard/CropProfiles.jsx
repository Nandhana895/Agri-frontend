import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';

const CropProfiles = () => {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        setLoading(true);
        const res = await api.get('/farmer/crop-profiles');
        setCrops(res.data?.data || []);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load crop profiles');
      } finally {
        setLoading(false);
      }
    };
    fetchCrops();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {crops.length === 0 && (
        <div className="text-gray-600">No crops available yet.</div>
      )}
      {crops.map((c) => {
        const base = (api.defaults.baseURL || '').replace(/\/?api\/?$/, '');
        const imageSrc = c.imageUrl && !c.imageUrl.startsWith('http')
          ? `${base}${c.imageUrl}`
          : (c.imageUrl || '');
        return (
          <motion.div key={c._id} className="ag-card overflow-hidden" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {imageSrc ? (
              <img src={imageSrc} alt={c.name} className="h-40 w-full object-cover" />
            ) : (
              <div className="h-40 w-full bg-gray-100" />
            )}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900">{c.name}</h3>
              {c.description && <p className="text-gray-600 text-sm mt-1">{c.description}</p>}
              {Array.isArray(c.cultivationTips) && c.cultivationTips.length > 0 && (
                <ul className="text-sm text-gray-700 mt-3 list-disc pl-5 space-y-1">
                  {c.cultivationTips.slice(0, 4).map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default CropProfiles;


