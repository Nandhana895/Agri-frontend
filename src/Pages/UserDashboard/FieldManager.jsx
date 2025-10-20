import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useField } from '../contexts/FieldContext';
import { 
  Plus, 
  MapPin, 
  Calendar, 
  Droplets, 
  TrendingUp, 
  Edit3, 
  Trash2, 
  Eye,
  Crop,
  Layers,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

const FieldManager = () => {
  const { 
    fields, 
    activeField, 
    loading, 
    error, 
    createField, 
    updateField, 
    deleteField, 
    setActiveField,
    clearError 
  } = useField();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    fieldName: '',
    crop: '',
    area: '',
    areaUnit: 'acres',
    soilType: 'Loamy',
    location: {
      latitude: '',
      longitude: '',
      address: ''
    },
    description: '',
    plantingDate: '',
    expectedHarvestDate: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCreateField = async (e) => {
    e.preventDefault();
    clearError();

    const result = await createField(formData);
    if (result.success) {
      setShowCreateModal(false);
      resetForm();
    }
  };

  const handleEditField = async (e) => {
    e.preventDefault();
    clearError();

    const result = await updateField(editingField._id, formData);
    if (result.success) {
      setShowEditModal(false);
      setEditingField(null);
      resetForm();
    }
  };

  const handleDeleteField = async (fieldId) => {
    clearError();
    const result = await deleteField(fieldId, false); // Archive by default
    if (result.success) {
      setShowDeleteConfirm(null);
    }
  };

  const resetForm = () => {
    setFormData({
      fieldName: '',
      crop: '',
      area: '',
      areaUnit: 'acres',
      soilType: 'Loamy',
      location: {
        latitude: '',
        longitude: '',
        address: ''
      },
      description: '',
      plantingDate: '',
      expectedHarvestDate: ''
    });
  };

  const openEditModal = (field) => {
    setEditingField(field);
    setFormData({
      fieldName: field.fieldName,
      crop: field.crop || '',
      area: field.area.toString(),
      areaUnit: field.areaUnit,
      soilType: field.soilType,
      location: {
        latitude: field.location.latitude.toString(),
        longitude: field.location.longitude.toString(),
        address: field.location.address || ''
      },
      description: field.description || '',
      plantingDate: field.plantingDate ? field.plantingDate.split('T')[0] : '',
      expectedHarvestDate: field.expectedHarvestDate ? field.expectedHarvestDate.split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Inactive':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'Archived':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSoilTypeColor = (soilType) => {
    const colors = {
      'Sandy': 'bg-yellow-100 text-yellow-800',
      'Loamy': 'bg-green-100 text-green-800',
      'Clayey': 'bg-red-100 text-red-800',
      'Silty': 'bg-blue-100 text-blue-800',
      'Peaty': 'bg-purple-100 text-purple-800',
      'Chalky': 'bg-gray-100 text-gray-800',
      'Other': 'bg-slate-100 text-slate-800'
    };
    return colors[soilType] || colors['Other'];
  };

  const FieldCard = ({ field }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
        activeField?._id === field._id 
          ? 'border-emerald-500 shadow-emerald-500/20' 
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-slate-900">{field.fieldName}</h3>
              {getStatusIcon(field.status)}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{field.area} {field.areaUnit}</span>
              </div>
              {field.crop && (
                <div className="flex items-center gap-1">
                  <Crop className="w-4 h-4" />
                  <span>{field.crop}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveField(field)}
              className={`p-2 rounded-lg transition-colors ${
                activeField?._id === field._id
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title="Set as Active Field"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => openEditModal(field)}
              className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
              title="Edit Field"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(field._id)}
              className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
              title="Delete Field"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSoilTypeColor(field.soilType)}`}>
              {field.soilType} Soil
            </span>
          </div>

          {field.description && (
            <p className="text-sm text-slate-600 line-clamp-2">{field.description}</p>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span>Logs: {field.logs?.length || 0}</span>
              <span>Expenses: {field.expenses?.length || 0}</span>
              <span>Tasks: {field.tasks?.length || 0}</span>
            </div>
            <span>Created: {new Date(field.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const FieldModal = ({ isOpen, onClose, onSubmit, title, isEdit = false }) => (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={isEdit ? handleEditField : handleCreateField} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Field Name *
                  </label>
                  <input
                    type="text"
                    name="fieldName"
                    value={formData.fieldName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter field name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Crop
                  </label>
                  <input
                    type="text"
                    name="crop"
                    value={formData.crop}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter crop name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Area *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="area"
                      value={formData.area}
                      onChange={handleInputChange}
                      required
                      min="0.01"
                      step="0.01"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="0.00"
                    />
                    <select
                      name="areaUnit"
                      value={formData.areaUnit}
                      onChange={handleInputChange}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="acres">Acres</option>
                      <option value="hectares">Hectares</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Soil Type
                  </label>
                  <select
                    name="soilType"
                    value={formData.soilType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="Sandy">Sandy</option>
                    <option value="Loamy">Loamy</option>
                    <option value="Clayey">Clayey</option>
                    <option value="Silty">Silty</option>
                    <option value="Peaty">Peaty</option>
                    <option value="Chalky">Chalky</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    name="location.latitude"
                    value={formData.location.latitude}
                    onChange={handleInputChange}
                    required
                    step="any"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g., 12.9716"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    name="location.longitude"
                    value={formData.location.longitude}
                    onChange={handleInputChange}
                    required
                    step="any"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g., 77.5946"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="location.address"
                    value={formData.location.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter field address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Planting Date
                  </label>
                  <input
                    type="date"
                    name="plantingDate"
                    value={formData.plantingDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Expected Harvest Date
                  </label>
                  <input
                    type="date"
                    name="expectedHarvestDate"
                    value={formData.expectedHarvestDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter field description"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : (isEdit ? 'Update Field' : 'Create Field')}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-slate-200/60 shadow-lg shadow-slate-500/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Field Management</h1>
                <p className="text-sm text-slate-600">Manage your agricultural fields</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/25"
            >
              <Plus className="w-5 h-5" />
              Add New Field
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Active Field Indicator */}
        {activeField && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-semibold text-emerald-900">Active Field</h3>
                <p className="text-sm text-emerald-700">{activeField.fieldName} - {activeField.area} {activeField.areaUnit}</p>
              </div>
            </div>
          </div>
        )}

        {/* Fields Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : fields.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <Layers className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Fields Found</h3>
            <p className="text-slate-600 mb-6">Create your first field to start managing your farm</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/25 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Create Your First Field
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {fields.map((field) => (
                <FieldCard key={field._id} field={field} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <FieldModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
          clearError();
        }}
        onSubmit={handleCreateField}
        title="Create New Field"
      />

      <FieldModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingField(null);
          resetForm();
          clearError();
        }}
        onSubmit={handleEditField}
        title="Edit Field"
        isEdit={true}
      />

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Delete Field</h3>
                  <p className="text-sm text-slate-600">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-slate-700 mb-6">
                Are you sure you want to delete this field? It will be archived and can be restored later.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteField(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Field
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FieldManager;






