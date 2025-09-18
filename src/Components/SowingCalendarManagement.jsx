import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit, Trash2, Search, Filter, Download, Upload, 
  Calendar, MapPin, Leaf, Clock, Globe, Info, Save, X,
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle
} from 'lucide-react';
import api from '../services/api';

const SowingCalendarManagement = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    crop: '',
    season: '',
    startMonth: '',
    endMonth: '',
    region: '',
    agroZone: '',
    notes: '',
    varieties: [],
    source: ''
  });
  const [varietyInput, setVarietyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const seasons = [
    { value: 'Kharif', label: 'Kharif (Monsoon)' },
    { value: 'Rabi', label: 'Rabi (Winter)' },
    { value: 'Zaid', label: 'Zaid (Summer)' }
  ];

  const agroZones = [
    'humid', 'arid', 'temperate', 'semi-arid', 'tropical', 'subtropical'
  ];

  useEffect(() => {
    fetchRecords();
  }, [currentPage, searchTerm]);

  useEffect(() => {
    console.log('Modal state changed:', showModal);
  }, [showModal]);

  const fetchRecords = async () => {
    setLoading(true);
    console.log('Fetching records...');
    try {
      const response = await api.get(`/admin/sowing-calendar?page=${currentPage}&search=${searchTerm}`);
      console.log('Records response:', response.data);
      setRecords(response.data.records || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (err) {
      console.error('Error fetching records:', err);
      console.error('Error response:', err.response?.data);
      setError(`Failed to fetch records: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRecords();
  };

  const handleCreate = () => {
    console.log('Creating new record...');
    setEditingRecord(null);
    setFormData({
      crop: '',
      season: '',
      startMonth: '',
      endMonth: '',
      region: '',
      agroZone: '',
      notes: '',
      varieties: [],
      source: ''
    });
    setShowModal(true);
    console.log('Modal should be open:', showModal);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      crop: record.crop,
      season: record.season,
      startMonth: record.startMonth,
      endMonth: record.endMonth,
      region: record.region,
      agroZone: record.agroZone,
      notes: record.notes,
      varieties: record.varieties || [],
      source: record.source
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    
    try {
      await api.delete(`/admin/sowing-calendar/${id}`);
      fetchRecords();
    } catch (err) {
      setError('Failed to delete record');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRecords.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedRecords.length} records?`)) return;
    
    try {
      await api.post('/admin/sowing-calendar/bulk', {
        action: 'delete',
        recordIds: selectedRecords
      });
      setSelectedRecords([]);
      fetchRecords();
    } catch (err) {
      setError('Failed to delete records');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    
    try {
      if (editingRecord) {
        await api.put(`/admin/sowing-calendar/${editingRecord._id}`, formData);
        setSuccess('Record updated successfully');
      } else {
        await api.post('/admin/sowing-calendar', formData);
        setSuccess('Record created successfully');
      }
      setShowModal(false);
      fetchRecords();
    } catch (err) {
      setError(`Failed to save record: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddVariety = () => {
    if (varietyInput.trim()) {
      setFormData({
        ...formData,
        varieties: [...formData.varieties, varietyInput.trim()]
      });
      setVarietyInput('');
    }
  };

  const handleRemoveVariety = (index) => {
    setFormData({
      ...formData,
      varieties: formData.varieties.filter((_, i) => i !== index)
    });
  };

  const handleSelectRecord = (id) => {
    setSelectedRecords(prev => 
      prev.includes(id) 
        ? prev.filter(recordId => recordId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRecords.length === records.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(records.map(record => record._id));
    }
  };

  const getStatusColor = (record) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const startIndex = months.indexOf(record.startMonth) + 1;
    const endIndex = months.indexOf(record.endMonth) + 1;
    
    if (startIndex <= endIndex) {
      return currentMonth >= startIndex && currentMonth <= endIndex ? 'green' : 'gray';
    } else {
      return (currentMonth >= startIndex || currentMonth <= endIndex) ? 'green' : 'gray';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[var(--ag-primary-600)]" />
            Sowing Calendar Management
          </h2>
          <p className="text-gray-600 mt-1">Manage crop sowing schedules and regional data</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--ag-primary-600)] text-white rounded-lg hover:bg-[var(--ag-primary-700)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Record
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="ag-card p-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by crop, region, or season..."
                className="w-full pl-10 pr-4 py-2 border border-[var(--ag-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-[var(--ag-primary-600)] text-white rounded-lg hover:bg-[var(--ag-primary-700)] transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Bulk Actions */}
      {selectedRecords.length > 0 && (
        <div className="ag-card p-4 bg-red-50 border border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">
                {selectedRecords.length} record(s) selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedRecords([])}
                className="px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors text-sm"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="ag-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-[var(--ag-border)]">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRecords.length === records.length && records.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-[var(--ag-border)]"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Crop</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Season</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Period</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Region</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Version</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ag-border)]">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    Loading records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    No records found
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRecords.includes(record._id)}
                        onChange={() => handleSelectRecord(record._id)}
                        className="rounded border-[var(--ag-border)]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Leaf className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-gray-900">{record.crop}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {record.season}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{record.startMonth} - {record.endMonth}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{record.region}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          getStatusColor(record) === 'green' ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        <span className="text-sm text-gray-600">
                          {getStatusColor(record) === 'green' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">v{record.version}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(record)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(record._id)}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[var(--ag-border)] flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{zIndex: 9999}}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingRecord ? 'Edit Record' : 'Add New Record'}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Crop Name *
                      </label>
                      <input
                        type="text"
                        value={formData.crop}
                        onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--ag-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Season *
                      </label>
                      <select
                        value={formData.season}
                        onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--ag-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
                        required
                      >
                        <option value="">Select Season</option>
                        {seasons.map(season => (
                          <option key={season.value} value={season.value}>
                            {season.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Month *
                      </label>
                      <select
                        value={formData.startMonth}
                        onChange={(e) => setFormData({ ...formData, startMonth: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--ag-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
                        required
                      >
                        <option value="">Select Start Month</option>
                        {months.map(month => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Month *
                      </label>
                      <select
                        value={formData.endMonth}
                        onChange={(e) => setFormData({ ...formData, endMonth: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--ag-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
                        required
                      >
                        <option value="">Select End Month</option>
                        {months.map(month => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Region
                      </label>
                      <input
                        type="text"
                        value={formData.region}
                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                        placeholder="e.g., Punjab, Kerala, all"
                        className="w-full px-3 py-2 border border-[var(--ag-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Agro Zone
                      </label>
                      <select
                        value={formData.agroZone}
                        onChange={(e) => setFormData({ ...formData, agroZone: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--ag-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
                      >
                        <option value="">Select Agro Zone</option>
                        {agroZones.map(zone => (
                          <option key={zone} value={zone}>{zone}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Varieties
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={varietyInput}
                        onChange={(e) => setVarietyInput(e.target.value)}
                        placeholder="Add variety"
                        className="flex-1 px-3 py-2 border border-[var(--ag-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddVariety())}
                      />
                      <button
                        type="button"
                        onClick={handleAddVariety}
                        className="px-4 py-2 bg-[var(--ag-primary-600)] text-white rounded-lg hover:bg-[var(--ag-primary-700)] transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    {formData.varieties.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.varieties.map((variety, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                          >
                            {variety}
                            <button
                              type="button"
                              onClick={() => handleRemoveVariety(index)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-[var(--ag-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source
                    </label>
                    <input
                      type="text"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      placeholder="e.g., ICAR 2024, KVK-XYZ"
                      className="w-full px-3 py-2 border border-[var(--ag-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-white ${saving ? 'bg-[var(--ag-primary-300)] cursor-not-allowed' : 'bg-[var(--ag-primary-600)] hover:bg-[var(--ag-primary-700)]'}`}
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : (editingRecord ? 'Update' : 'Create')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      {/* Error Message */}
      {error && (
        <div className="ag-card p-4 bg-red-50 border border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="ag-card p-4 bg-green-50 border border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SowingCalendarManagement;
