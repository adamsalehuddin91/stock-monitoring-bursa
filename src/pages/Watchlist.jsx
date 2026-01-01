import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, RefreshCw, BarChart2, Search, ArrowUpDown, Trash2, Loader2, AlertCircle, Plus, Filter } from 'lucide-react';

import Sidebar from '../partials/StockSidebar';
import Header from '../partials/Header';
import MiniChart from '../components/MiniChart';
import MarketSelector from '../components/MarketSelector';
import { fetchMultipleStocks, fetchHistoricalData, STOCK_SYMBOLS } from '../services/stockApi';
import { DEFAULT_WATCHLIST, getStockByCode, getAllStocks } from '../data/malaysianStocks';
import { DEFAULT_US_WATCHLIST, getAllUSStocks, getUSStockByCode } from '../data/globalStocks';
import AddStockModal from '../components/AddStockModal';
import AdvancedFilter from '../components/AdvancedFilter';
import { isMarketOpen } from '../utils/marketHours';

function Watchlist() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState(() => {
    return localStorage.getItem('selectedMarket') || 'BURSA';
  });
  const [stocks, setStocks] = useState([]);
  const [chartData, setChartData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    sectors: [],
    priceRange: { min: '', max: '' },
    volumeRange: { min: '', max: '' },
    changeRange: { min: '', max: '' },
    quickFilter: 'all'
  });

  // Save selected market to localStorage
  useEffect(() => {
    localStorage.setItem('selectedMarket', selectedMarket);
  }, [selectedMarket]);

  // Get default watchlist based on market
  const getDefaultWatchlist = (market) => {
    if (market === 'US') return DEFAULT_US_WATCHLIST;
    if (market === 'GLOBAL') return [...DEFAULT_WATCHLIST, ...DEFAULT_US_WATCHLIST];
    return DEFAULT_WATCHLIST;
  };

  // Watchlist codes with localStorage persistence per market
  const [watchlistCodes, setWatchlistCodes] = useState(() => {
    const storageKey = `stockWatchlist_${selectedMarket}`;
    const saved = localStorage.getItem(storageKey);
    let codes = saved ? JSON.parse(saved) : getDefaultWatchlist(selectedMarket);

    // 🔄 AUTO-MIGRATION: Update old stock codes to new ones
    const codeMap = {
      '5235': '7113', // TOPGLOVE old → new
      '5222': '6742', // YTL POWER old → new
      '2216': '2445'  // IOI CORP old → KL KEPONG (since 1961 already in list)
    };

    let migrated = false;
    codes = codes.map(code => {
      if (codeMap[code]) {
        console.log(`✅ Migrating old code ${code} → ${codeMap[code]}`);
        migrated = true;
        return codeMap[code];
      }
      return code;
    });

    // Remove duplicates after migration
    codes = [...new Set(codes)];

    if (migrated) {
      console.log('🔄 Stock codes migrated successfully!');
      localStorage.setItem('stockWatchlist', JSON.stringify(codes));
    }

    return codes;
  });

  // Save to localStorage whenever watchlist changes
  useEffect(() => {
    const storageKey = `stockWatchlist_${selectedMarket}`;
    localStorage.setItem(storageKey, JSON.stringify(watchlistCodes));
  }, [watchlistCodes, selectedMarket]);

  // Reload watchlist when market changes
  useEffect(() => {
    const storageKey = `stockWatchlist_${selectedMarket}`;
    const saved = localStorage.getItem(storageKey);
    const codes = saved ? JSON.parse(saved) : getDefaultWatchlist(selectedMarket);
    setWatchlistCodes(codes);
  }, [selectedMarket]);

  // Enrich stock data with sector info from appropriate database
  const enrichStockData = (stocksData) => {
    return stocksData.map(stock => {
      let metadata;
      if (selectedMarket === 'US') {
        metadata = getUSStockByCode(stock.code);
      } else if (selectedMarket === 'GLOBAL') {
        // Try both databases
        metadata = getStockByCode(stock.code) || getUSStockByCode(stock.code);
      } else {
        metadata = getStockByCode(stock.code);
      }
      return {
        ...stock,
        sector: metadata?.sector || 'Unknown',
        category: metadata?.category || 'Unknown',
        market: metadata?.market || (selectedMarket === 'US' ? 'NASDAQ' : 'BURSA'),
        country: metadata?.country || (selectedMarket === 'US' ? 'US' : 'MY')
      };
    });
  };

  // Fetch real-time data and mini chart data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMultipleStocks(watchlistCodes);
      const enrichedData = enrichStockData(data);
      setStocks(enrichedData);
      setLoading(false);

      // Fetch 5-day historical data for mini charts (async, non-blocking)
      if (watchlistCodes && watchlistCodes.length > 0) {
        fetchMiniChartData(watchlistCodes).catch(err => {
          console.error('Mini chart fetch failed:', err);
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch stock data');
      console.error('Error fetching stocks:', err);
      setLoading(false);
    }
  };

  // Fetch mini chart data separately (non-blocking)
  const fetchMiniChartData = async (codes) => {
    if (!codes || codes.length === 0) return;

    console.log('🔍 Fetching mini charts for:', codes.length, 'stocks');

    try {
      const chartPromises = codes.map(async (code) => {
        try {
          const histData = await fetchHistoricalData(code, '5d', '15m');
          console.log(`📊 Chart data for ${code}:`, histData ? `${histData.candles?.length} candles` : 'null');

          if (histData && histData.candles && histData.candles.length > 0) {
            // Convert to simple {time, value} format for mini chart
            return {
              code,
              data: histData.candles.map(c => ({
                time: c.time,
                value: c.close
              }))
            };
          }
          return { code, data: [] };
        } catch (err) {
          console.error(`❌ Error fetching chart for ${code}:`, err);
          return { code, data: [] };
        }
      });

      const results = await Promise.allSettled(chartPromises);
      const chartDataMap = {};
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          chartDataMap[result.value.code] = result.value.data;
        }
      });

      console.log('✅ Mini chart data loaded:', Object.keys(chartDataMap).length, 'charts');
      setChartData(chartDataMap);
    } catch (err) {
      console.error('❌ Error fetching mini chart data:', err);
      // Don't throw - mini charts are optional
    }
  };

  // Initial fetch and re-fetch when watchlist changes
  useEffect(() => {
    fetchData();
  }, [watchlistCodes]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, []);

  const refreshData = () => {
    fetchData();
  };

  // Sort function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Remove stock
  const removeStock = (code) => {
    setWatchlistCodes(prev => prev.filter(c => c !== code));
    setStocks(stocks.filter(s => s.code !== code));
  };

  // Add stock
  const addStock = (code) => {
    if (!watchlistCodes.includes(code)) {
      setWatchlistCodes(prev => [...prev, code]);
      setShowAddModal(false);
      // Data will auto-fetch via useEffect when watchlistCodes changes
    }
  };

  // Apply advanced filters
  const applyAdvancedFilters = (stock) => {
    // Quick Filter
    if (advancedFilters.quickFilter === 'gainers' && stock.change <= 0) return false;
    if (advancedFilters.quickFilter === 'losers' && stock.change >= 0) return false;
    if (advancedFilters.quickFilter === 'bigMovers' && Math.abs(stock.changePercent) < 3) return false;

    // Sector Filter
    if (advancedFilters.sectors.length > 0 && !advancedFilters.sectors.includes(stock.sector)) return false;

    // Price Range
    if (advancedFilters.priceRange.min && stock.price < parseFloat(advancedFilters.priceRange.min)) return false;
    if (advancedFilters.priceRange.max && stock.price > parseFloat(advancedFilters.priceRange.max)) return false;

    // Volume Range
    if (advancedFilters.volumeRange.min && stock.volume < parseFloat(advancedFilters.volumeRange.min)) return false;
    if (advancedFilters.volumeRange.max && stock.volume > parseFloat(advancedFilters.volumeRange.max)) return false;

    // Change % Range
    if (advancedFilters.changeRange.min && stock.changePercent < parseFloat(advancedFilters.changeRange.min)) return false;
    if (advancedFilters.changeRange.max && stock.changePercent > parseFloat(advancedFilters.changeRange.max)) return false;

    return true;
  };

  // Filter and sort stocks
  const filteredStocks = stocks
    .filter(stock =>
      stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.code.includes(searchTerm)
    )
    .filter(applyAdvancedFilters);

  const sortedStocks = [...filteredStocks].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const gainers = stocks.filter(s => s.change > 0).length;
  const losers = stocks.filter(s => s.change < 0).length;
  const unchanged = stocks.filter(s => s.change === 0).length;
  const marketOpen = isMarketOpen(selectedMarket);
  const currency = selectedMarket === 'US' ? 'USD' : selectedMarket === 'GLOBAL' ? 'MYR/USD' : 'MYR';

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

            {/* Page header */}
            <div className="sm:flex sm:justify-between sm:items-center mb-6">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Stock Watchlist</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Monitoring {stocks.length} stocks</p>
              </div>
            </div>

            {/* Market Selector */}
            <div className="mb-6">
              <MarketSelector
                selectedMarket={selectedMarket}
                onMarketChange={setSelectedMarket}
              />
            </div>

            {/* Search and Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center space-x-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search stocks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
                  />
                </div>

                <button
                  onClick={() => setShowFilterModal(true)}
                  className="btn bg-purple-500 hover:bg-purple-600 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <span>Filters</span>
                  {(advancedFilters.sectors.length > 0 || advancedFilters.quickFilter !== 'all') && (
                    <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                      Active
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn bg-green-500 hover:bg-green-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  <span>Add Stock</span>
                </button>

                <button
                  onClick={refreshData}
                  className="btn bg-blue-500 hover:bg-blue-600 text-white">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">Gainers</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{gainers}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase">Losers</p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">{losers}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Unchanged</p>
                    <p className="text-2xl font-bold text-gray-700 dark:text-gray-300 mt-1">{unchanged}</p>
                  </div>
                  <BarChart2 className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && stocks.length === 0 && (
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-12 text-center">
                <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600 dark:text-gray-400">Loading real-time stock data...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  <div>
                    <h3 className="font-semibold text-red-800 dark:text-red-300">Error Loading Data</h3>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Watchlist Table */}
            {!loading && stocks.length > 0 && (
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
                <div className="overflow-x-auto">
                <table className="table-auto w-full">
                  <thead className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <button onClick={() => handleSort('name')} className="flex items-center hover:text-gray-700 dark:hover:text-gray-200">
                          Stock <ArrowUpDown className="w-3 h-3 ml-1" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-center">Trend (5D)</th>
                      <th className="px-4 py-3 text-right">
                        <button onClick={() => handleSort('price')} className="flex items-center ml-auto hover:text-gray-700 dark:hover:text-gray-200">
                          Price ({currency}) <ArrowUpDown className="w-3 h-3 ml-1" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right">
                        <button onClick={() => handleSort('change')} className="flex items-center ml-auto hover:text-gray-700 dark:hover:text-gray-200">
                          Change <ArrowUpDown className="w-3 h-3 ml-1" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right">
                        <button onClick={() => handleSort('changePercent')} className="flex items-center ml-auto hover:text-gray-700 dark:hover:text-gray-200">
                          Change % <ArrowUpDown className="w-3 h-3 ml-1" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right">
                        <button onClick={() => handleSort('volume')} className="flex items-center ml-auto hover:text-gray-700 dark:hover:text-gray-200">
                          Volume (M) <ArrowUpDown className="w-3 h-3 ml-1" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right">High</th>
                      <th className="px-4 py-3 text-right">Low</th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedStocks.map((stock) => {
                      const isPositive = stock.change >= 0;
                      return (
                        <tr key={stock.code} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                          <td className="px-4 py-3">
                            <div
                              onClick={() => navigate(`/stock/${stock.code}`)}
                              className="cursor-pointer">
                              <div className="font-medium text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                {stock.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{stock.code}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center">
                              <MiniChart
                                data={chartData[stock.code] || []}
                                width={120}
                                height={40}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div>
                              <div className="font-semibold text-gray-800 dark:text-gray-100">
                                {stock.price.toFixed(2)}
                              </div>
                              {!marketOpen && (
                                <div className="text-[10px] text-gray-400 dark:text-gray-500">
                                  Last Close
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className={`flex items-center justify-end space-x-1 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                              <span className="font-medium">{isPositive ? '+' : ''}{stock.change.toFixed(2)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${isPositive ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-red-500/20 text-red-700 dark:text-red-400'}`}>
                              {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                            {stock.volume.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                            {stock.high.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                            {stock.low.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => removeStock(stock.code)}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 transition-colors"
                              title="Remove from watchlist">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Last Updated */}
              <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    <>Real-time data • Auto-refresh every 30s • Powered by Yahoo Finance 🆓</>
                  )}
                </p>
              </div>
            </div>
            )}

          </div>
        </main>

      </div>

      {/* Add Stock Modal */}
      <AddStockModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddStock={addStock}
        currentWatchlist={watchlistCodes}
      />

      {/* Advanced Filter Modal */}
      <AdvancedFilter
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={setAdvancedFilters}
        stocks={selectedMarket === 'US' ? getAllUSStocks() : selectedMarket === 'GLOBAL' ? [...getAllStocks(), ...getAllUSStocks()] : getAllStocks()}
        currentFilters={advancedFilters}
      />
    </div>
  );
}

export default Watchlist;
