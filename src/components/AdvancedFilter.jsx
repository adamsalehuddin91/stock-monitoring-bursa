import React, { useState, useEffect } from 'react';
import { Filter, X, Save, FolderOpen, Trash2, TrendingUp, TrendingDown } from 'lucide-react';

// Get all unique sectors from stock data
const getAllSectors = (stocks) => {
  const sectors = new Set();
  stocks.forEach(stock => {
    if (stock.sector) sectors.add(stock.sector);
  });
  return Array.from(sectors).sort();
};

function AdvancedFilter({ isOpen, onClose, onApplyFilters, stocks, currentFilters }) {
  const [filters, setFilters] = useState({
    sectors: [],
    priceRange: { min: '', max: '' },
    volumeRange: { min: '', max: '' },
    changeRange: { min: '', max: '' },
    quickFilter: 'all' // all, gainers, losers, bigMovers
  });

  const [savedPresets, setSavedPresets] = useState([]);
  const [presetName, setPresetName] = useState('');

  // Load saved presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('filterPresets');
    if (saved) {
      setSavedPresets(JSON.parse(saved));
    }
  }, []);

  // Initialize filters from current filters
  useEffect(() => {
    if (currentFilters) {
      setFilters(currentFilters);
    }
  }, [currentFilters]);

  const availableSectors = getAllSectors(stocks);

  const handleSectorToggle = (sector) => {
    setFilters(prev => ({
      ...prev,
      sectors: prev.sectors.includes(sector)
        ? prev.sectors.filter(s => s !== sector)
        : [...prev.sectors, sector]
    }));
  };

  const handleQuickFilter = (type) => {
    setFilters(prev => ({ ...prev, quickFilter: type }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      sectors: [],
      priceRange: { min: '', max: '' },
      volumeRange: { min: '', max: '' },
      changeRange: { min: '', max: '' },
      quickFilter: 'all'
    };
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      alert('Please enter a preset name');
      return;
    }

    const newPreset = {
      id: Date.now(),
      name: presetName,
      filters: filters
    };

    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    localStorage.setItem('filterPresets', JSON.stringify(updated));
    setPresetName('');
    alert(`Preset "${presetName}" saved!`);
  };

  const handleLoadPreset = (preset) => {
    setFilters(preset.filters);
    onApplyFilters(preset.filters);
  };

  const handleDeletePreset = (id) => {
    if (confirm('Delete this preset?')) {
      const updated = savedPresets.filter(p => p.id !== id);
      setSavedPresets(updated);
      localStorage.setItem('filterPresets', JSON.stringify(updated));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Filter className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Advanced Filters</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Quick Filters */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Quick Filters</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleQuickFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.quickFilter === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}>
                All Stocks
              </button>
              <button
                onClick={() => handleQuickFilter('gainers')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.quickFilter === 'gainers'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}>
                <TrendingUp className="w-4 h-4 inline mr-1" />
                Gainers
              </button>
              <button
                onClick={() => handleQuickFilter('losers')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.quickFilter === 'losers'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}>
                <TrendingDown className="w-4 h-4 inline mr-1" />
                Losers
              </button>
              <button
                onClick={() => handleQuickFilter('bigMovers')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.quickFilter === 'bigMovers'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}>
                Big Movers (±3%)
              </button>
            </div>
          </div>

          {/* Sector Filter */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Sectors</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {availableSectors.map(sector => (
                <button
                  key={sector}
                  onClick={() => handleSectorToggle(sector)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filters.sectors.includes(sector)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}>
                  {sector}
                </button>
              ))}
            </div>
            {filters.sectors.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {filters.sectors.length} sector{filters.sectors.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

            {/* Price Range */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Price Range (RM)</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.priceRange.min}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    priceRange: { ...prev.priceRange, min: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
                />
                <span className="text-gray-500 dark:text-gray-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.priceRange.max}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    priceRange: { ...prev.priceRange, max: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Volume Range */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Volume Range (M)</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.volumeRange.min}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    volumeRange: { ...prev.volumeRange, min: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
                />
                <span className="text-gray-500 dark:text-gray-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.volumeRange.max}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    volumeRange: { ...prev.volumeRange, max: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Change % Range */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Change % Range</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.changeRange.min}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    changeRange: { ...prev.changeRange, min: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
                />
                <span className="text-gray-500 dark:text-gray-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.changeRange.max}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    changeRange: { ...prev.changeRange, max: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
                />
              </div>
            </div>

          </div>

          {/* Saved Presets */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Saved Presets</h3>

            {/* Save Current Filters */}
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="text"
                placeholder="Preset name..."
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
              />
              <button
                onClick={handleSavePreset}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>

            {/* Preset List */}
            {savedPresets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {savedPresets.map(preset => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <button
                      onClick={() => handleLoadPreset(preset)}
                      className="flex-1 text-left flex items-center space-x-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <FolderOpen className="w-4 h-4" />
                      <span className="text-sm font-medium">{preset.name}</span>
                    </button>
                    <button
                      onClick={() => handleDeletePreset(preset.id)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No saved presets yet. Create one by saving your current filters!
              </p>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            Reset All
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
              Apply Filters
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdvancedFilter;
