import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, Map, Calendar, Filter, Download,
  Globe, Leaf, Clock, MapPin, Info, RefreshCw
} from 'lucide-react';
import api from '../services/api';

const SowingTrendsDashboard = () => {
  const [trendsData, setTrendsData] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [distributionData, setDistributionData] = useState(null);
  const [popularityData, setPopularityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    region: '',
    crop: '',
    season: '',
    agroZone: ''
  });

  useEffect(() => {
    fetchAllData();
  }, [filters]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [trends, heatmap, distribution, popularity] = await Promise.all([
        api.get('/expert/sowing-trends', { params: filters }),
        api.get('/expert/sowing-heatmap', { params: filters }),
        api.get('/expert/sowing-distribution', { params: filters }),
        api.get('/expert/crop-popularity', { params: filters })
      ]);

      setTrendsData(trends.data.data);
      setHeatmapData(heatmap.data.data);
      setDistributionData(distribution.data.data);
      setPopularityData(popularity.data.data);
    } catch (err) {
      setError('Failed to fetch trends data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getIntensityColor = (intensity, maxIntensity) => {
    const percentage = (intensity / maxIntensity) * 100;
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 60) return 'bg-orange-500';
    if (percentage >= 40) return 'bg-yellow-500';
    if (percentage >= 20) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getIntensityLabel = (intensity, maxIntensity) => {
    const percentage = (intensity / maxIntensity) * 100;
    if (percentage >= 80) return 'Very High';
    if (percentage >= 60) return 'High';
    if (percentage >= 40) return 'Medium';
    if (percentage >= 20) return 'Low';
    return 'Very Low';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[var(--ag-primary-600)]" />
            Sowing Trends Dashboard
          </h2>
          <p className="text-gray-600 mt-1">Analyze regional sowing patterns and crop trends</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--ag-primary-600)] text-white rounded-lg hover:bg-[var(--ag-primary-700)] disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="ag-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <input
              type="text"
              value={filters.region}
              onChange={(e) => handleFilterChange('region', e.target.value)}
              placeholder="e.g., Punjab, Kerala"
              className="w-full px-3 py-2 border border-[var(--ag-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Crop</label>
            <input
              type="text"
              value={filters.crop}
              onChange={(e) => handleFilterChange('crop', e.target.value)}
              placeholder="e.g., Rice, Wheat"
              className="w-full px-3 py-2 border border-[var(--ag-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
            <select
              value={filters.season}
              onChange={(e) => handleFilterChange('season', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--ag-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
            >
              <option value="">All Seasons</option>
              <option value="Kharif">Kharif</option>
              <option value="Rabi">Rabi</option>
              <option value="Zaid">Zaid</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agro Zone</label>
            <select
              value={filters.agroZone}
              onChange={(e) => handleFilterChange('agroZone', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--ag-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
            >
              <option value="">All Zones</option>
              <option value="humid">Humid</option>
              <option value="arid">Arid</option>
              <option value="temperate">Temperate</option>
              <option value="semi-arid">Semi-arid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {trendsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="ag-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Total Records</div>
                <div className="text-2xl font-bold text-gray-900">{trendsData.summary.totalRecords}</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="ag-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Unique Crops</div>
                <div className="text-2xl font-bold text-gray-900">{trendsData.summary.uniqueCrops}</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                <Leaf className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="ag-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Regions</div>
                <div className="text-2xl font-bold text-gray-900">{trendsData.summary.uniqueRegions}</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="ag-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Filtered Results</div>
                <div className="text-2xl font-bold text-gray-900">{trendsData.summary.filteredCount}</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                <Filter className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Regional Intensity Heatmap */}
      {heatmapData && (
        <div className="ag-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Map className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Regional Sowing Intensity</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {heatmapData.map((region, index) => {
              const maxIntensity = Math.max(...heatmapData.map(r => r.totalIntensity));
              return (
                <div key={index} className="border border-[var(--ag-border)] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{region._id}</h4>
                    <span className="text-sm text-gray-600">{region.totalIntensity} records</span>
                  </div>
                  <div className="space-y-2">
                    {region.agroZones.map((zone, zoneIndex) => (
                      <div key={zoneIndex} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{zone.zone}</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getIntensityColor(zone.intensity, maxIntensity)}`} />
                          <span className="text-xs text-gray-500">{zone.intensity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly Distribution */}
      {distributionData && (
        <div className="ag-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Monthly Sowing Distribution</h3>
          </div>
          <div className="space-y-4">
            {distributionData.map((item, index) => (
              <div key={index} className="border border-[var(--ag-border)] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">
                      {item._id.startMonth} - {item._id.endMonth}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{item.totalCount} records</span>
                    <span className="text-sm font-medium text-[var(--ag-primary-600)]">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[var(--ag-primary-500)] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {item.crops.slice(0, 5).map((crop, cropIndex) => (
                    <span key={cropIndex} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {crop}
                    </span>
                  ))}
                  {item.crops.length > 5 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      +{item.crops.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Crop Popularity */}
      {popularityData && (
        <div className="ag-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Crop Popularity Trends</h3>
          </div>
          <div className="space-y-4">
            {popularityData.slice(0, 10).map((crop, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-[var(--ag-border)] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--ag-primary-100)] text-[var(--ag-primary-700)] flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{crop._id}</div>
                    <div className="text-sm text-gray-600">
                      {crop.regions.length} regions • {crop.seasons.length} seasons
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{crop.count}</div>
                    <div className="text-sm text-gray-600">records</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[var(--ag-primary-600)]">{crop.percentage}%</div>
                    <div className="text-sm text-gray-600">of total</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Season Distribution */}
      {trendsData?.analytics?.seasonDistribution && (
        <div className="ag-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Season-wise Distribution</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trendsData.analytics.seasonDistribution.map((season, index) => (
              <div key={index} className="border border-[var(--ag-border)] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{season._id}</h4>
                  <span className="text-sm text-gray-600">{season.count} records</span>
                </div>
                <div className="space-y-1">
                  {season.crops.slice(0, 3).map((crop, cropIndex) => (
                    <div key={cropIndex} className="text-sm text-gray-600 flex items-center gap-2">
                      <Leaf className="w-3 h-3" />
                      {crop}
                    </div>
                  ))}
                  {season.crops.length > 3 && (
                    <div className="text-sm text-gray-500">
                      +{season.crops.length - 3} more crops
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="ag-card p-8 text-center">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Loading trends data...
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="ag-card p-4 bg-red-50 border border-red-200">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SowingTrendsDashboard;
