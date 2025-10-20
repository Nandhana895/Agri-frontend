import React, { useState, useEffect } from 'react';
import { 
  MapPin, Plus, Edit2, Trash2, Archive, CheckCircle, 
  TrendingUp, Calendar, Droplet, Layers, AlertCircle 
} from 'lucide-react';
import axios from 'axios';
import config from '../../config/config';

const FieldManagement = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fieldStats, setFieldStats] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    size: '',
    sizeUnit: 'acre',
    soilType: 'Loam',
    irrigationType: 'Rainfed',
    currentCrop: '',
    sowingDate: '',
    expectedHarvestDate: '',
    location: {
      address: '',
      coordinates: {
        latitude: '',
        longitude: ''
      }
    },
    notes: ''
  });

  useEffect(() => {
    fetchFields();
    fetchFieldStats();
  }, []);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem(config.TOKEN_KEY);
      const response = await axios.get(`${config.API_URL}/fields`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setFields(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch fields');
    } finally {
      setLoading(false);
    }
  };

  const fetchFieldStats = async () => {
    try {
      const token = localStorage.getItem(config.TOKEN_KEY);
      const response = await axios.get(`${config.API_URL}/fields/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setFieldStats(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch field stats:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prev => {
        const updated = { ...prev };
        let current = updated;
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        return updated;
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              coordinates: {
                latitude: position.coords.latitude.toFixed(6),
                longitude: position.coords.longitude.toFixed(6)
              }
            }
          }));
          setSuccess('Location captured successfully!');
          setTimeout(() => setSuccess(null), 3000);
        },
        (error) => {
          setError('Failed to get location. Please enter manually.');
          setTimeout(() => setError(null), 3000);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      const token = localStorage.getItem(config.TOKEN_KEY);
      
      // Clean up empty values
      const cleanData = { ...formData };
      if (!cleanData.location.address) delete cleanData.location.address;
      if (!cleanData.location.coordinates.latitude) delete cleanData.location.coordinates;
      if (!cleanData.currentCrop) delete cleanData.currentCrop;
      if (!cleanData.sowingDate) delete cleanData.sowingDate;
      if (!cleanData.expectedHarvestDate) delete cleanData.expectedHarvestDate;
      if (!cleanData.notes) delete cleanData.notes;
      
      let response;
      if (editingField) {
        response = await axios.put(
          `${config.API_URL}/fields/${editingField._id}`,
          cleanData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          `${config.API_URL}/fields`,
          cleanData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      if (response.data.success) {
        setSuccess(editingField ? 'Field updated successfully!' : 'Field created successfully!');
        setTimeout(() => setSuccess(null), 3000);
        resetForm();
        fetchFields();
        fetchFieldStats();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save field');
    }
  };

  const handleEdit = (field) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      size: field.size,
      sizeUnit: field.sizeUnit,
      soilType: field.soilType,
      irrigationType: field.irrigationType,
      currentCrop: field.currentCrop || '',
      sowingDate: field.sowingDate ? field.sowingDate.split('T')[0] : '',
      expectedHarvestDate: field.expectedHarvestDate ? field.expectedHarvestDate.split('T')[0] : '',
      location: {
        address: field.location?.address || '',
        coordinates: {
          latitude: field.location?.coordinates?.latitude || '',
          longitude: field.location?.coordinates?.longitude || ''
        }
      },
      notes: field.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id, permanent = false) => {
    if (!confirm(permanent ? 'Permanently delete this field? This cannot be undone!' : 'Deactivate this field?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem(config.TOKEN_KEY);
      await axios.delete(
        `${config.API_URL}/fields/${id}${permanent ? '?permanent=true' : ''}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess('Field deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
      fetchFields();
      fetchFieldStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete field');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      size: '',
      sizeUnit: 'acre',
      soilType: 'Loam',
      irrigationType: 'Rainfed',
      currentCrop: '',
      sowingDate: '',
      expectedHarvestDate: '',
      location: {
        address: '',
        coordinates: {
          latitude: '',
          longitude: ''
        }
      },
      notes: ''
    });
    setEditingField(null);
    setShowForm(false);
  };

  const soilTypeOptions = ['Sandy', 'Clay', 'Loam', 'Silt', 'Peaty', 'Chalky', 'Other'];
  const irrigationOptions = ['Drip', 'Sprinkler', 'Flood', 'Rainfed', 'Canal', 'Borewell', 'Other'];
  const sizeUnitOptions = ['acre', 'hectare', 'sqm'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Layers className="w-10 h-10 text-green-600" />
            Field Management
          </h1>
          <p className="text-gray-600">Manage your agricultural fields and track crops</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Field Statistics */}
        {fieldStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Fields</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{fieldStats.totalFields}</p>
                </div>
                <Layers className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Active Fields</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{fieldStats.activeFields}</p>
                </div>
                <CheckCircle className="w-12 h-12 text-blue-500 opacity-20" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Area</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{fieldStats.totalArea} ha</p>
                </div>
                <TrendingUp className="w-12 h-12 text-purple-500 opacity-20" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">With Crops</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{fieldStats.fieldsWithCrops}</p>
                </div>
                <Calendar className="w-12 h-12 text-orange-500 opacity-20" />
              </div>
            </div>
          </div>
        )}

        {/* Add New Field Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Add New Field
          </button>
        </div>

        {/* Field Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-xl p-8 mb-8 border-t-4 border-green-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingField ? 'Edit Field' : 'Add New Field'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Field Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Field Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., North Field, Plot A"
                  />
                </div>

                {/* Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Field Size *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                      required
                      step="0.01"
                      min="0.01"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter size"
                    />
                    <select
                      name="sizeUnit"
                      value={formData.sizeUnit}
                      onChange={handleInputChange}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {sizeUnitOptions.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Soil Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Soil Type
                  </label>
                  <select
                    name="soilType"
                    value={formData.soilType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {soilTypeOptions.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Irrigation Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Irrigation Type
                  </label>
                  <select
                    name="irrigationType"
                    value={formData.irrigationType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {irrigationOptions.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Current Crop */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Crop
                  </label>
                  <input
                    type="text"
                    name="currentCrop"
                    value={formData.currentCrop}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Rice, Wheat"
                  />
                </div>

                {/* Sowing Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sowing Date
                  </label>
                  <input
                    type="date"
                    name="sowingDate"
                    value={formData.sowingDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Expected Harvest Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Harvest Date
                  </label>
                  <input
                    type="date"
                    name="expectedHarvestDate"
                    value={formData.expectedHarvestDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Location Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Address
                  </label>
                  <input
                    type="text"
                    name="location.address"
                    value={formData.location.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Village, District, State"
                  />
                </div>
              </div>

              {/* GPS Coordinates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    name="location.coordinates.latitude"
                    value={formData.location.coordinates.latitude}
                    onChange={handleInputChange}
                    step="0.000001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., 10.850516"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    name="location.coordinates.longitude"
                    value={formData.location.coordinates.longitude}
                    onChange={handleInputChange}
                    step="0.000001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., 76.271080"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition"
                  >
                    <MapPin className="w-4 h-4" />
                    Get Current Location
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Additional information about this field..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-lg hover:shadow-xl"
                >
                  {editingField ? 'Update Field' : 'Create Field'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Fields List */}
        <div className="bg-white rounded-xl shadow-xl p-8 border-t-4 border-blue-500">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Fields</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              <p className="mt-4 text-gray-600">Loading fields...</p>
            </div>
          ) : fields.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No fields added yet. Create your first field to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fields.map(field => (
                <div 
                  key={field._id} 
                  className={`border rounded-xl p-6 hover:shadow-lg transition ${
                    field.isActive ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300 opacity-60'
                  }`}
                >
                  {/* Field Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">{field.name}</h3>
                      <p className="text-sm text-gray-600">
                        {field.size} {field.sizeUnit} • {field.soilType}
                      </p>
                    </div>
                    {!field.isActive && (
                      <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>

                  {/* Field Details */}
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Droplet className="w-4 h-4 text-blue-500" />
                      <span>{field.irrigationType}</span>
                    </div>
                    
                    {field.currentCrop && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4 text-green-500" />
                        <span className="font-medium">{field.currentCrop}</span>
                      </div>
                    )}
                    
                    {field.location?.address && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="w-4 h-4 text-red-500" />
                        <span className="text-xs">{field.location.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleEdit(field)}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(field._id)}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FieldManagement;

