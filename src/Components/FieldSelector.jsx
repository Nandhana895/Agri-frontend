import React, { useState, useEffect } from 'react';
import { Layers, ChevronDown, Plus, MapPin } from 'lucide-react';
import axios from 'axios';
import config from '../config/config';

const FieldSelector = ({ selectedFieldId, onFieldChange, showAllOption = true, className = '' }) => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const token = localStorage.getItem(config.TOKEN_KEY);
      const response = await axios.get(`${config.API_URL}/fields?active=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setFields(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch fields:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldSelect = (fieldId) => {
    onFieldChange(fieldId);
    setIsOpen(false);
  };

  const selectedField = fields.find(f => f._id === selectedFieldId);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg flex items-center justify-between hover:border-green-500 transition focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-green-600" />
          <span className="text-gray-700">
            {loading ? 'Loading...' : 
             selectedField ? selectedField.name : 
             selectedFieldId === 'all' ? 'All Fields' :
             'Select Field'}
          </span>
          {selectedField && (
            <span className="text-xs text-gray-500">
              ({selectedField.size} {selectedField.sizeUnit})
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
            {showAllOption && (
              <button
                type="button"
                onClick={() => handleFieldSelect('all')}
                className={`w-full px-4 py-3 text-left hover:bg-green-50 transition flex items-center gap-3 border-b border-gray-100 ${
                  selectedFieldId === 'all' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>All Fields</span>
              </button>
            )}
            
            {loading ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              </div>
            ) : fields.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-gray-500 text-sm mb-3">No fields created yet</p>
                <a 
                  href="/dashboard/fields"
                  className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Create your first field
                </a>
              </div>
            ) : (
              fields.map(field => (
                <button
                  key={field._id}
                  type="button"
                  onClick={() => handleFieldSelect(field._id)}
                  className={`w-full px-4 py-3 text-left hover:bg-green-50 transition ${
                    selectedFieldId === field._id ? 'bg-green-50 font-medium' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Layers className={`w-4 h-4 ${selectedFieldId === field._id ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className={selectedFieldId === field._id ? 'text-green-700' : 'text-gray-700'}>
                          {field.name}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 ml-6 space-y-0.5">
                        <div>{field.size} {field.sizeUnit} • {field.soilType}</div>
                        {field.currentCrop && (
                          <div className="text-green-600 font-medium">
                            🌾 {field.currentCrop}
                          </div>
                        )}
                        {field.location?.address && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {field.location.address}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FieldSelector;

