import React from 'react';
import { motion } from 'framer-motion';

const data = [
  { name: 'Wheat', img: 'https://images.unsplash.com/photo-1500937382192-6c0f7b43a3ec?q=80&w=800&auto=format&fit=crop', desc: 'Cool-season cereal crop, prefers loamy soil.' },
  { name: 'Rice', img: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=800&auto=format&fit=crop', desc: 'Requires flooded fields and warm climate.' },
  { name: 'Maize', img: 'https://images.unsplash.com/photo-1561753799-0ffc6273b6fb?q=80&w=800&auto=format&fit=crop', desc: 'Thrives in well-drained fertile soil.' },
  { name: 'Soybean', img: 'https://images.unsplash.com/photo-1530176611600-c3b2ee5b7883?q=80&w=800&auto=format&fit=crop', desc: 'Fixes nitrogen and improves soil fertility.' },
];

const CropProfiles = () => {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((c) => (
        <motion.div key={c.name} className="ag-card overflow-hidden" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <img src={c.img} alt={c.name} className="h-40 w-full object-cover" />
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900">{c.name}</h3>
            <p className="text-gray-600 text-sm mt-1">{c.desc}</p>
            <ul className="text-sm text-gray-700 mt-3 list-disc pl-5 space-y-1">
              <li>Optimal spacing: 20-25 cm</li>
              <li>Irrigation: Moderate</li>
              <li>Harvest: 90-120 days</li>
            </ul>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default CropProfiles;


