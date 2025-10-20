import React, { useState } from 'react';
import axios from 'axios';

const PredictionForm = () => {
  const [formData, setFormData] = useState({
    Temparature: '', // Note: keeping the typo as in your Python code
    Humidity: '',
    Moisture: '',
    Soil_Type: '',
    Crop_Type: '', // Added crop type field
    Nitrogen: '',
    Potassium: '',
    Phosphorous: '', // Note: keeping the spelling as in your Python code
    Fertilizer_Name: '', // Added fertilizer name field
  });

  const [predictionType, setPredictionType] = useState('crop_prediction');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePredictionTypeChange = (e) => {
    setPredictionType(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    // Convert string inputs to floats and include all fields
    const apiData = {
      Temparature: parseFloat(formData.Temparature),
      Humidity: parseFloat(formData.Humidity),
      Moisture: parseFloat(formData.Moisture),
      Soil_Type: formData.Soil_Type,
      Crop_Type: formData.Crop_Type,
      Nitrogen: parseFloat(formData.Nitrogen),
      Potassium: parseFloat(formData.Potassium),
      Phosphorous: parseFloat(formData.Phosphorous),
      Fertilizer_Name: formData.Fertilizer_Name,
    };

    // Validate that numeric fields are numbers
    const numericFields = ['Temparature', 'Humidity', 'Moisture', 'Nitrogen', 'Potassium', 'Phosphorous'];
    for (const field of numericFields) {
      if (isNaN(apiData[field])) {
        setError(`Please enter a valid number for ${field}`);
        setLoading(false);
        return;
      }
    }
    
    // Validate required fields based on prediction type
    if (predictionType === 'crop_prediction') {
      // For crop prediction, we need soil type but not crop type (that's what we're predicting)
      if (!apiData.Soil_Type || apiData.Soil_Type === '') {
        setError('Please select a soil type');
        setLoading(false);
        return;
      }
    } else if (predictionType === 'soil_prediction') {
      // For soil prediction, we need crop type but not soil type (that's what we're predicting)
      if (!apiData.Crop_Type || apiData.Crop_Type === '') {
        setError('Please select a crop type');
        setLoading(false);
        return;
      }
    } else if (predictionType === 'fertilizer_prediction') {
      // For fertilizer prediction, we need both soil type and crop type
      if (!apiData.Soil_Type || apiData.Soil_Type === '') {
        setError('Please select a soil type');
        setLoading(false);
        return;
      }
      if (!apiData.Crop_Type || apiData.Crop_Type === '') {
        setError('Please select a crop type');
        setLoading(false);
        return;
      }
    }

    try {
      const apiUrl = `http://localhost:8000/${predictionType}/`;
      const response = await axios.post(apiUrl, apiData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setResult(response.data.result);
    } catch (err) {
      console.error('Error making prediction:', err);
      if (err.response) {
        setError(`Server Error: ${err.response.status} - ${err.response.data?.detail || err.response.statusText}`);
      } else if (err.request) {
        setError('Network Error: Unable to connect to the server. Make sure the Python backend is running on http://localhost:8000');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      Temparature: '',
      Humidity: '',
      Moisture: '',
      Soil_Type: '',
      Crop_Type: '',
      Nitrogen: '',
      Potassium: '',
      Phosphorous: '',
      Fertilizer_Name: '',
    });
    setResult(null);
    setError(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          AI-Powered Agricultural Predictions
        </h2>
        <p className="text-lg text-gray-600">
          Get intelligent recommendations for crops, soil, and fertilizers based on your field conditions
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Prediction Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Prediction Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <input
                type="radio"
                id="crop_prediction"
                name="predictionType"
                value="crop_prediction"
                checked={predictionType === 'crop_prediction'}
                onChange={handlePredictionTypeChange}
                className="sr-only"
              />
              <label
                htmlFor="crop_prediction"
                className={`block w-full p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  predictionType === 'crop_prediction'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                  <span className="font-medium">Crop Recommendation</span>
                </div>
              </label>
            </div>

            <div>
              <input
                type="radio"
                id="soil_prediction"
                name="predictionType"
                value="soil_prediction"
                checked={predictionType === 'soil_prediction'}
                onChange={handlePredictionTypeChange}
                className="sr-only"
              />
              <label
                htmlFor="soil_prediction"
                className={`block w-full p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  predictionType === 'soil_prediction'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">Soil Analysis</span>
                </div>
              </label>
            </div>

            <div>
              <input
                type="radio"
                id="fertilizer_prediction"
                name="predictionType"
                value="fertilizer_prediction"
                checked={predictionType === 'fertilizer_prediction'}
                onChange={handlePredictionTypeChange}
                className="sr-only"
              />
              <label
                htmlFor="fertilizer_prediction"
                className={`block w-full p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  predictionType === 'fertilizer_prediction'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">Fertilizer Recommendation</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Input Fields */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature (°C)
            </label>
            <input
              type="number"
              name="Temparature"
              value={formData.Temparature}
              onChange={handleInputChange}
              step="0.1"
              min="0"
              max="50"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., 29.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Humidity (%)
            </label>
            <input
              type="number"
              name="Humidity"
              value={formData.Humidity}
              onChange={handleInputChange}
              step="0.1"
              min="0"
              max="100"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., 52.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moisture (%)
            </label>
            <input
              type="number"
              name="Moisture"
              value={formData.Moisture}
              onChange={handleInputChange}
              step="0.1"
              min="0"
              max="100"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., 45.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Soil Type
            </label>
            <select
              name="Soil_Type"
              value={formData.Soil_Type}
              onChange={handleInputChange}
              required={predictionType !== 'soil_prediction'}
              disabled={predictionType === 'soil_prediction'}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                predictionType === 'soil_prediction' ? 'bg-gray-100 text-gray-500' : ''
              }`}
            >
              <option value="">
                {predictionType === 'soil_prediction' ? 'Will be predicted...' : 'Select soil type...'}
              </option>
              <option value="Sandy">Sandy</option>
              <option value="Loamy">Loamy</option>
              <option value="Black">Black</option>
              <option value="Red">Red</option>
              <option value="Clayey">Clayey</option>
            </select>
            {predictionType === 'soil_prediction' && (
              <p className="text-xs text-gray-500 mt-1">This field will be predicted by the AI</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Crop Type
            </label>
            <select
              name="Crop_Type"
              value={formData.Crop_Type}
              onChange={handleInputChange}
              required={predictionType !== 'crop_prediction'}
              disabled={predictionType === 'crop_prediction'}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                predictionType === 'crop_prediction' ? 'bg-gray-100 text-gray-500' : ''
              }`}
            >
              <option value="">
                {predictionType === 'crop_prediction' ? 'Will be predicted...' : 'Select crop type...'}
              </option>
              <option value="Barley">Barley</option>
              <option value="Cotton">Cotton</option>
              <option value="Ground Nuts">Ground Nuts</option>
              <option value="Maize">Maize</option>
              <option value="Millets">Millets</option>
              <option value="Oil seeds">Oil seeds</option>
              <option value="Paddy">Paddy</option>
              <option value="Pulses">Pulses</option>
              <option value="Sugarcane">Sugarcane</option>
              <option value="Tobacco">Tobacco</option>
              <option value="Wheat">Wheat</option>
            </select>
            {predictionType === 'crop_prediction' && (
              <p className="text-xs text-gray-500 mt-1">This field will be predicted by the AI</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nitrogen (N)
            </label>
            <input
              type="number"
              name="Nitrogen"
              value={formData.Nitrogen}
              onChange={handleInputChange}
              step="0.1"
              min="0"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., 12.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Potassium (K)
            </label>
            <input
              type="number"
              name="Potassium"
              value={formData.Potassium}
              onChange={handleInputChange}
              step="0.1"
              min="0"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., 0.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phosphorus (P)
            </label>
            <input
              type="number"
              name="Phosphorous"
              value={formData.Phosphorous}
              onChange={handleInputChange}
              step="0.1"
              min="0"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., 36.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fertilizer Name
            </label>
            <select
              name="Fertilizer_Name"
              value={formData.Fertilizer_Name}
              onChange={handleInputChange}
              required={false}
              disabled={predictionType === 'fertilizer_prediction'}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                predictionType === 'fertilizer_prediction' ? 'bg-gray-100 text-gray-500' : ''
              }`}
            >
              <option value="">
                {predictionType === 'fertilizer_prediction' ? 'Will be predicted...' : 'Select fertilizer (optional)...'}
              </option>
              <option value="10-26-26">10-26-26</option>
              <option value="14-35-14">14-35-14</option>
              <option value="17-17-17">17-17-17</option>
              <option value="20-20">20-20</option>
              <option value="28-28">28-28</option>
              <option value="DAP">DAP</option>
              <option value="Urea">Urea</option>
            </select>
            {predictionType === 'fertilizer_prediction' && (
              <p className="text-xs text-gray-500 mt-1">This field will be predicted by the AI</p>
            )}
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
      {result && (
        <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-green-900 mb-2">
              AI Prediction Result
            </h3>
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <p className="text-2xl font-bold text-green-800">
                {result}
              </p>
            </div>
            <p className="text-green-700 mt-3 text-sm">
              {predictionType === 'crop_prediction' && 'Recommended crop based on your soil and environmental conditions'}
              {predictionType === 'soil_prediction' && 'Predicted soil type for your field conditions'}
              {predictionType === 'fertilizer_prediction' && 'Recommended fertilizer for optimal growth'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionForm;