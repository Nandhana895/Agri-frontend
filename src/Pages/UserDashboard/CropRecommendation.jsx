import React from 'react';
import { motion } from 'framer-motion';
import PredictionForm from '../../Components/PredictionForm.jsx';

export default function CropRecommendation() {
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
              <h2 className="ag-display text-2xl md:text-3xl font-bold text-gray-900">Crop Recommendation</h2>
              <p className="text-gray-600 mt-1 text-sm md:text-base">Get AI-powered crop suggestions based on your soil conditions and environmental factors</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Prediction Form */}
      <PredictionForm />
    </div>
  );
}




















