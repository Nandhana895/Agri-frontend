import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ title, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="ag-card p-6"
  >
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <div className="text-gray-700 text-sm">{children}</div>
  </motion.div>
);

const Home = () => {
  const recommendations = [
    'Water your fields in the early morning to reduce evaporation.',
    'Rotate crops to improve soil health and reduce pests.',
    'Mulch to conserve moisture and suppress weeds.'
  ];

  const tips = [
    'Use rainwater harvesting to store water.',
    'Test soil pH every season for optimal yield.',
    'Compost kitchen waste to enrich soil.'
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card title="Recent Recommendations">
        <ul className="list-disc pl-5 space-y-2">
          {recommendations.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </Card>
      <Card title="Soil Health Status">
        <div className="space-y-1">
          <p>Soil pH: 6.5 (Optimal)</p>
          <p>Nitrogen: Medium</p>
          <p>Phosphorus: Adequate</p>
          <p>Potassium: Low</p>
        </div>
      </Card>
      <Card title="Quick Tips">
        <ul className="list-disc pl-5 space-y-2">
          {tips.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default Home;


