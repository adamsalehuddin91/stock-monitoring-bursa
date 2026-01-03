import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, TrendingUp, TrendingDown, Activity, Download, Plus, Loader2, Search, X } from 'lucide-react';

import Sidebar from '../partials/StockSidebar';
import Header from '../partials/Header';
import { fetchMultipleStocks } from '../services/stockApi';
import { getAllStocks } from '../data/malaysianStocks';
import { getAllUSStocks } from '../data/globalStocks';

function StockScreener() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allStocks, setAllStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState('US');

  // Filter states
  const [filters, setFilters] = useState({
    priceMin: '',
    priceMax: '',
    changeMin: '',
    changeMax: '',
    volumeMin: '',
    sector: 'all',
    sortBy: 'change',
    sortOrder: 'desc'
  });

  // Preset filters
  const presets = [
    { name: 'Top Gainers', icon: TrendingUp, filters: { changeMin: '2', sortBy: 'change', sortOrder: 'desc' } },
    { name: 'Top Losers', icon: TrendingDown, filters: { changeMax: '-2', sortBy: 'change', sortOrder: 'asc' } },
    { name: 'High Volume', icon: Activity, filters: { volumeMin: '5', sortBy: 'volume', sortOrder: 'desc' } },
    { name: 'Cheap Stocks', icon: Filter, filters: { priceMax: selectedMarket === 'US' ? '50' : '5', sortBy: 'price', sortOrder: 'asc' } },
    { name: 'Breakout Stocks', icon: TrendingUp, filters: { changeMin: '5', volumeMin: '10', sortBy: 'change', sortOrder: 'desc' } }
  ];

  // Fetch stocks based on market
  const fetchStocks = async () => {
    try {
      setLoading(true);

      let stocksList;
      if (selectedMarket === 'US') {
        stocksList = getAllUSStocks();
      } else if (selectedMarket === 'BURSA') {
        stocksList = getAllStocks();
      } else {
        // GLOBAL - combine both and remove duplicates
        const malaysianStocks = getAllStocks();
        const usStocks = getAllUSStocks();
        const combined = [...malaysianStocks, ...usStocks];

        // Remove duplicates by stock code
        const uniqueCodes = new Map();
        stocksList = combined.filter(stock => {
          if (uniqueCodes.has(stock.code)) {
            return false;
          }
          uniqueCodes.set(stock.code, true);
          return true;
        });
      }

      // Fetch real-time data for stocks
      const stockCodes = stocksList.map(s => s.code);
      const stockData = await fetchMultipleStocks(stockCodes);

      // Merge with stock info
      const enrichedStocks = stockData.map(stock => {
        const info = stocksList.find(s => s.code === stock.code);
        return {
          ...stock,
          sector: info?.sector || info?.category || 'Other',
          market: selectedMarket === 'US' ? 'US' : (selectedMarket === 'BURSA' ? 'MY' : (info?.sector ? 'US' : 'MY'))
        };
      });

      setAllStocks(enrichedStocks);
      setFilteredStocks(enrichedStocks);
    } catch (error) {
      console.error('Error fetching stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, [selectedMarket]);

  // Apply filters
  useEffect(() => {
    let filtered = [...allStocks];

    // Price filter
    if (filters.priceMin) {
      filtered = filtered.filter(s => s.price >= parseFloat(filters.priceMin));
    }
    if (filters.priceMax) {
      filtered = filtered.filter(s => s.price <= parseFloat(filters.priceMax));
    }

    // Change filter
    if (filters.changeMin) {
      filtered = filtered.filter(s => s.changePercent >= parseFloat(filters.changeMin));
    }
    if (filters.changeMax) {
      filtered = filtered.filter(s => s.changePercent <= parseFloat(filters.changeMax));
    }

    // Volume filter
    if (filters.volumeMin) {
      filtered = filtered.filter(s => s.volume >= parseFloat(filters.volumeMin));
    }

    // Sector filter
    if (filters.sector !== 'all') {
      filtered = filtered.filter(s => s.sector?.toLowerCase() === filters.sector.toLowerCase());
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[filters.sortBy] || 0;
      let bVal = b[filters.sortBy] || 0;

      if (filters.sortOrder === 'asc') {
        return aVal - bVal;
      } else {
        return bVal - aVal;
      }
    });

    setFilteredStocks(filtered);
  }, [filters, allStocks]);

  const applyPreset = (preset) => {
    setFilters(prev => ({
      ...prev,
      priceMin: '',
      priceMax: '',
      changeMin: '',
      changeMax: '',
      volumeMin: '',
      ...preset.filters
    }));
  };

  const clearFilters = () => {
    setFilters({
      priceMin: '',
      priceMax: '',
      changeMin: '',
      changeMax: '',
      volumeMin: '',
      sector: 'all',
      sortBy: 'change',
      sortOrder: 'desc'
    });
  };

  const addToWatchlist = (stock) => {
    const storageKey = `stockWatchlist_${selectedMarket}`;
    const saved = localStorage.getItem(storageKey);
    const watchlist = saved ? JSON.parse(saved) : [];

    if (!watchlist.includes(stock.code)) {
      watchlist.push(stock.code);
      localStorage.setItem(storageKey, JSON.stringify(watchlist));
      alert(`${stock.name} added to watchlist!`);
    } else {
      alert(`${stock.name} already in watchlist`);
    }
  };

  // Get unique sectors
  const sectors = ['all', ...new Set(allStocks.map(s => s.sector).filter(Boolean))];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

            {/* Header */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">📊 Stock Screener</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Filter and discover trading opportunities</p>
              </div>

              {/* Market Selector */}
              <div className="flex gap-2">
                {['BURSA', 'US', 'GLOBAL'].map(market => (
                  <button
                    key={market}
                    onClick={() => setSelectedMarket(market)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedMarket === market
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}>
                    {market === 'BURSA' ? '🇲🇾 Bursa' : market === 'US' ? '🇺🇸 US' : '🌍 Global'}
                  </button>
                ))}
              </div>
            </div>

            {/* Preset Filters */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Quick Filters</h3>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => applyPreset(preset)}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                    <preset.icon className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{preset.name}</span>
                  </button>
                ))}
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <X className="w-4 h-4" />
                  <span className="text-sm font-medium">Clear</span>
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-500" />
                Advanced Filters
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Price Range */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                    Price Range ({selectedMarket === 'US' ? '$' : 'RM'})
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.priceMin}
                      onChange={(e) => setFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.priceMax}
                      onChange={(e) => setFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* % Change Range */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                    % Change Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.changeMin}
                      onChange={(e) => setFilters(prev => ({ ...prev, changeMin: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.changeMax}
                      onChange={(e) => setFilters(prev => ({ ...prev, changeMax: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* Volume */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                    Min Volume (M)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 5"
                    value={filters.volumeMin}
                    onChange={(e) => setFilters(prev => ({ ...prev, volumeMin: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  />
                </div>

                {/* Sector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                    Sector
                  </label>
                  <select
                    value={filters.sector}
                    onChange={(e) => setFilters(prev => ({ ...prev, sector: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm capitalize">
                    {sectors.map(sector => (
                      <option key={sector} value={sector}>{sector}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Results: {filteredStocks.length} stocks
                </h3>
                <div className="flex gap-2">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                    className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                    <option value="change">% Change</option>
                    <option value="price">Price</option>
                    <option value="volume">Volume</option>
                  </select>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))}
                    className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                    {filters.sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600 dark:text-gray-400">Scanning stocks...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900/20">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Stock</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Price</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Change</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Volume</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Sector</th>
                        <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredStocks.map(stock => (
                        <tr
                          key={stock.code}
                          onClick={() => navigate(`/stock/${stock.code}`)}
                          className="hover:bg-gray-50 dark:hover:bg-gray-900/20 cursor-pointer transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{stock.market === 'US' ? '🇺🇸' : '🇲🇾'}</span>
                              <div>
                                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{stock.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-500">{stock.code}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                              {stock.market === 'US' ? '$' : 'RM'}{stock.price.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className={`text-sm font-semibold ${stock.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{stock.volume.toFixed(1)}M</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded capitalize">
                              {stock.sector}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToWatchlist(stock);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors">
                              <Plus className="w-3 h-3" />
                              Add
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredStocks.length === 0 && (
                    <div className="p-12 text-center">
                      <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">No stocks match your filters</p>
                      <button
                        onClick={clearFilters}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                        Clear Filters
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </main>

      </div>
    </div>
  );
}

export default StockScreener;
