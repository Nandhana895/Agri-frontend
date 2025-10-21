import React, { useState } from 'react';
import api from '../services/api';

const PredictionForm = () => {
  const [formData, setFormData] = useState({
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    ph: '',
    rainfall: ''
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    // Validate that numeric fields are numbers and not empty
    const numericFields = ['nitrogen', 'phosphorus', 'potassium', 'ph', 'rainfall'];
    for (const field of numericFields) {
      if (!formData[field] || formData[field].trim() === '') {
        setError(`Please enter a value for ${field}`);
        setLoading(false);
        return;
      }
      if (isNaN(parseFloat(formData[field]))) {
        setError(`Please enter a valid number for ${field}`);
        setLoading(false);
        return;
      }
    }

    try {
      const response = await api.post('/farmer/ai/crop-recommendation', {
        nitrogen: parseFloat(formData.nitrogen),
        phosphorus: parseFloat(formData.phosphorus),
        potassium: parseFloat(formData.potassium),
        ph: parseFloat(formData.ph),
        rainfall: parseFloat(formData.rainfall)
      });

      if (response.data?.success) {
        setResult(response.data.data);
      } else {
        setError(response.data?.message || 'Failed to get crop recommendations');
      }
    } catch (err) {
      console.error('Error making prediction:', err);
      setError(err?.response?.data?.message || 'Failed to get crop recommendations');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nitrogen: '',
      phosphorus: '',
      potassium: '',
      ph: '',
      rainfall: ''
    });
    setResult(null);
    setError(null);
    setSaveSuccess(false);
  };

  const handleSaveToLogbook = async () => {
    if (!result || !Array.isArray(result) || result.length === 0) return;
    
    setSaving(true);
    setSaveSuccess(false);
    
    try {
      // Create a comprehensive note with all recommendations
      const topRecommendations = result.slice(0, 3); // Save top 3 recommendations
      const notes = `AI Crop Recommendations:\n\n` +
        topRecommendations.map((crop, index) => 
          `${index + 1}. ${crop.name} (${crop.score}%)\n   ${crop.notes.slice(0, 2).join(' ')}`
        ).join('\n\n') +
        `\n\nInput: N=${formData.nitrogen}, P=${formData.phosphorus}, K=${formData.potassium}, pH=${formData.ph}, Rain=${formData.rainfall}mm`;

      const logData = {
        date: new Date().toISOString().split('T')[0],
        activityType: 'AI Recommendation',
        crop: topRecommendations[0]?.name || 'AI Recommendations',
        notes: notes
      };

      const response = await api.post('/farmer/logs', logData);
      
      if (response.data?.success) {
        setSaveSuccess(true);
        // Auto-hide success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(response.data?.message || 'Failed to save to logbook');
      }
    } catch (err) {
      console.error('Error saving to logbook:', err);
      const errorMessage = err?.response?.data?.message || err?.response?.data?.errors?.[0]?.msg || 'Failed to save to logbook';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          AI-Powered Crop Recommendations
        </h2>
        <p className="text-lg text-gray-600">
          Get intelligent crop recommendations based on your soil conditions and environmental factors
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input Fields */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nitrogen (mg/kg)
            </label>
            <input
              type="number"
              name="nitrogen"
              value={formData.nitrogen}
              onChange={handleInputChange}
              step="0.1"
              min="0"
              max="200"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., 40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phosphorus (mg/kg)
            </label>
            <input
              type="number"
              name="phosphorus"
              value={formData.phosphorus}
              onChange={handleInputChange}
              step="0.1"
              min="0"
              max="100"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., 25"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Potassium (mg/kg)
            </label>
            <input
              type="number"
              name="potassium"
              value={formData.potassium}
              onChange={handleInputChange}
              step="0.1"
              min="0"
              max="200"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., 80"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Soil pH
            </label>
            <input
              type="number"
              name="ph"
              value={formData.ph}
              onChange={handleInputChange}
              step="0.1"
              min="0"
              max="14"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., 6.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rainfall (mm/month)
            </label>
            <input
              type="number"
              name="rainfall"
              value={formData.rainfall}
              onChange={handleInputChange}
              step="0.1"
              min="0"
              max="500"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., 150"
            />
          </div>
        </div>

        {/* Submit and Reset Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-4 rounded-lg font-semibold text-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Get AI Prediction
              </>
            )}
          </button>

          <button
            type="button"
            onClick={resetForm}
            className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
          >
            Reset Form
          </button>
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-700 font-medium">Error:</p>
          </div>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      )}

      {/* Result Display */}
      {result && Array.isArray(result) && result.length > 0 && (
        <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-green-900 mb-2">
              AI Crop Recommendations
            </h3>
            <p className="text-green-700 text-sm">
              Recommended crops based on your soil and environmental conditions
            </p>
          </div>
          
          {/* Save to Logbook Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={handleSaveToLogbook}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save to Farm Logbook
                </>
              )}
            </button>
          </div>

          {/* Success Message */}
          {saveSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <p className="text-green-700 font-medium">Successfully saved to Farm Logbook!</p>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            {result.map((crop, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{crop.name}</h4>
                      <p className="text-sm text-gray-600">Compatibility Score: {crop.score}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${crop.score}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                {crop.notes && crop.notes.length > 0 && (
                  <div className="mt-3 pl-11">
                    <ul className="space-y-1">
                      {crop.notes.map((note, noteIndex) => (
                        <li key={noteIndex} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionForm;