import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, RefreshCw, BarChart2, Search, ArrowUpDown, Trash2, Loader2, AlertCircle, Plus, Filter } from 'lucide-react';

import Sidebar from '../partials/StockSidebar';
import Header from '../partials/Header';
import MiniChart from '../components/MiniChart';
import MarketSelector from '../components/MarketSelector';
import { fetchMultipleStocks, fetchHistoricalData } from '../services/stockApi';
import { DEFAULT_WATCHLIST, getStockByCode, getAllStocks } from '../data/malaysianStocks';
import { DEFAULT_US_WATCHLIST, getAllUSStocks, getUSStockByCode } from '../data/globalStocks';
import AddStockModal from '../components/AddStockModal';
import AdvancedFilter from '../components/AdvancedFilter';
import { isMarketOpen } from '../utils/marketHours';

const getDefaultWatchlist = (market) => {
  if (market === 'US') return DEFAULT_US_WATCHLIST;
  if (market === 'GLOBAL') return [...DEFAULT_WATCHLIST, ...DEFAULT_US_WATCHLIST];
  return DEFAULT_WATCHLIST;
};

function Watchlist() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState(() => localStorage.getItem('selectedMarket') || 'BURSA');
  const [stocks, setStocks] = useState([]);
  const [chartData, setChartData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({ sectors: [], priceRange: { min: '', max: '' }, volumeRange: { min: '', max: '' }, changeRange: { min: '', max: '' }, quickFilter: 'all' });

  const [watchlistCodes, setWatchlistCodes] = useState(() => {
    const market = localStorage.getItem('selectedMarket') || 'BURSA';
    const storageKey = `stockWatchlist_${market}`;
    let codes = JSON.parse(localStorage.getItem(storageKey) || 'null') || getDefaultWatchlist(market);
    const codeMap = { '5235': '7113', '5222': '6742', '2216': '2445' };
    let migrated = false;
    codes = codes.map(c => { if (codeMap[c]) { migrated = true; return codeMap[c]; } return c; });
    codes = [...new Set(codes)];
    if (migrated) localStorage.setItem(storageKey, JSON.stringify(codes));
    return codes;
  });

  useEffect(() => { localStorage.setItem('selectedMarket', selectedMarket); }, [selectedMarket]);
  useEffect(() => { localStorage.setItem(`stockWatchlist_${selectedMarket}`, JSON.stringify(watchlistCodes)); }, [watchlistCodes, selectedMarket]);

  useEffect(() => {
    const storageKey = `stockWatchlist_${selectedMarket}`;
    let codes = JSON.parse(localStorage.getItem(storageKey) || 'null') || getDefaultWatchlist(selectedMarket);
    if (selectedMarket === 'US' && codes.some(c => /^\d+$/.test(c))) { localStorage.removeItem(storageKey); codes = getDefaultWatchlist(selectedMarket); }
    else if (selectedMarket === 'BURSA' && codes.some(c => /^[A-Z]+$/.test(c))) { localStorage.removeItem(storageKey); codes = getDefaultWatchlist(selectedMarket); }
    setWatchlistCodes(codes);
  }, [selectedMarket]);

  const enrichStockData = (data) => data.map(stock => {
    const meta = selectedMarket === 'US' ? getUSStockByCode(stock.code) : selectedMarket === 'GLOBAL' ? (getStockByCode(stock.code) || getUSStockByCode(stock.code)) : getStockByCode(stock.code);
    return { ...stock, sector: meta?.sector || 'Unknown', category: meta?.category || 'Unknown', market: meta?.market || (selectedMarket === 'US' ? 'NASDAQ' : 'BURSA'), country: meta?.country || (selectedMarket === 'US' ? 'US' : 'MY') };
  });

  const fetchData = async () => {
    try {
      setLoading(true); setError(null);
      const data = await fetchMultipleStocks(watchlistCodes);
      setStocks(enrichStockData(data));
      setLoading(false);
      if (watchlistCodes?.length) fetchMiniChartData(watchlistCodes).catch(() => {});
    } catch (err) { setError(err.message || 'Gagal muat data saham'); setLoading(false); }
  };

  const fetchMiniChartData = async (codes) => {
    if (!codes?.length) return;
    const results = await Promise.allSettled(codes.map(async code => {
      const h = await fetchHistoricalData(code, '5d', '15m');
      return { code, data: h?.candles?.length ? h.candles.map(c => ({ time: c.time, value: c.close })) : [] };
    }));
    const map = {};
    results.forEach(r => { if (r.status === 'fulfilled' && r.value) map[r.value.code] = r.value.data; });
    setChartData(map);
  };

  useEffect(() => { fetchData(); }, [watchlistCodes]);
  useEffect(() => { const t = setInterval(fetchData, 30000); return () => clearInterval(t); }, [watchlistCodes]);

  const handleSort = (key) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  const removeStock = (code) => { setWatchlistCodes(prev => prev.filter(c => c !== code)); setStocks(stocks.filter(s => s.code !== code)); };
  const addStock = (code) => { if (!watchlistCodes.includes(code)) { setWatchlistCodes(prev => [...prev, code]); setShowAddModal(false); } };

  const applyAdvancedFilters = (s) => {
    const f = advancedFilters;
    if (f.quickFilter === 'gainers' && s.changePercent <= 0) return false;
    if (f.quickFilter === 'losers' && s.changePercent >= 0) return false;
    if (f.quickFilter === 'bigMovers' && Math.abs(s.changePercent) < 3) return false;
    if (f.sectors.length > 0 && !f.sectors.includes(s.sector)) return false;
    if (f.priceRange.min && s.price < parseFloat(f.priceRange.min)) return false;
    if (f.priceRange.max && s.price > parseFloat(f.priceRange.max)) return false;
    if (f.volumeRange.min && s.volume < parseFloat(f.volumeRange.min)) return false;
    if (f.volumeRange.max && s.volume > parseFloat(f.volumeRange.max)) return false;
    if (f.changeRange.min && s.changePercent < parseFloat(f.changeRange.min)) return false;
    if (f.changeRange.max && s.changePercent > parseFloat(f.changeRange.max)) return false;
    return true;
  };

  const filteredStocks = stocks
    .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.code.includes(searchTerm))
    .filter(applyAdvancedFilters);

  const sortedStocks = [...filteredStocks].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const av = a[sortConfig.key], bv = b[sortConfig.key];
    if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
    if (av > bv) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const gainers = stocks.filter(s => s.change > 0).length;
  const losers = stocks.filter(s => s.change < 0).length;
  const unchanged = stocks.filter(s => s.change === 0).length;
  const marketOpen = isMarketOpen(selectedMarket);
  const currency = selectedMarket === 'US' ? 'USD' : selectedMarket === 'GLOBAL' ? 'MYR/USD' : 'MYR';
  const filtersActive = advancedFilters.sectors.length > 0 || advancedFilters.quickFilter !== 'all';

  const SortTh = ({ k, label, align = 'right' }) => (
    <th className={`px-4 py-3 text-${align}`}>
      <button onClick={() => handleSort(k)} className={`flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 ${align === 'right' ? 'ml-auto' : ''}`}>
        {label} <ArrowUpDown className={`w-3 h-3 ${sortConfig.key === k ? 'text-blue-500' : ''}`} />
      </button>
    </th>
  );

  const StatCard = ({ label, value, Icon, tone }) => (
    <div className={`rounded-2xl p-4 border ${tone}`}>
      <div className="flex items-center justify-between">
        <div><p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</p><p className="text-2xl font-extrabold mt-0.5">{value}</p></div>
        <Icon className="w-7 h-7 opacity-60" />
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-900">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-7 w-full max-w-6xl mx-auto">

            <div className="mb-5">
              <h1 className="text-2xl md:text-[28px] text-gray-800 dark:text-gray-100 font-extrabold tracking-tight">Watchlist</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Memantau {stocks.length} saham</p>
            </div>

            <div className="mb-5"><MarketSelector selectedMarket={selectedMarket} onMarketChange={setSelectedMarket} /></div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Cari saham…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100" />
              </div>
              <button onClick={() => setShowFilterModal(true)} className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold px-3.5 py-2 rounded-xl">
                <Filter className="w-4 h-4" /> Filters {filtersActive && <span className="text-[10px] bg-blue-500 text-white rounded-full px-1.5">•</span>}
              </button>
              <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 bg-emerald-500 text-white text-sm font-semibold px-3.5 py-2 rounded-xl hover:bg-emerald-600"><Plus className="w-4 h-4" /> Tambah</button>
              <button onClick={fetchData} className="flex items-center gap-1.5 bg-blue-500 text-white text-sm font-semibold px-3.5 py-2 rounded-xl hover:bg-blue-600"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <StatCard label="Gainers" value={gainers} Icon={TrendingUp} tone="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" />
              <StatCard label="Losers" value={losers} Icon={TrendingDown} tone="bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400" />
              <StatCard label="Unchanged" value={unchanged} Icon={BarChart2} tone="bg-gray-500/10 border-gray-500/20 text-gray-600 dark:text-gray-300" />
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-5 flex items-center gap-3 text-red-600 dark:text-red-400"><AlertCircle className="w-5 h-5" /><span className="text-sm">{error}</span></div>}

            {loading && stocks.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-14 text-center shadow-sm"><Loader2 className="w-10 h-10 text-blue-500 mx-auto mb-3 animate-spin" /><p className="text-gray-500 dark:text-gray-400 text-sm">Memuat data real-time…</p></div>
            ) : stocks.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/30 text-[11px] uppercase tracking-wide text-gray-400">
                      <tr>
                        <SortTh k="name" label="Saham" align="left" />
                        <th className="px-4 py-3 text-center">Trend 5H</th>
                        <SortTh k="price" label={`Harga (${currency})`} />
                        <SortTh k="change" label="Ubah" />
                        <SortTh k="changePercent" label="% Ubah" />
                        <SortTh k="volume" label="Volume" />
                        <th className="px-4 py-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                      {sortedStocks.map(stock => {
                        const up = stock.change >= 0;
                        return (
                          <tr key={stock.code} className="hover:bg-gray-50 dark:hover:bg-gray-900/20">
                            <td className="px-4 py-3">
                              <div onClick={() => navigate(`/stock/${stock.code}`)} className="cursor-pointer">
                                <div className="font-semibold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{stock.name}</div>
                                <div className="text-[11px] text-gray-400">{stock.code}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3"><div className="flex justify-center"><MiniChart data={chartData[stock.code] || []} width={110} height={36} /></div></td>
                            <td className="px-4 py-3 text-right">
                              <div className="font-semibold text-gray-800 dark:text-gray-100">{stock.price.toFixed(2)}</div>
                              {!marketOpen && <div className="text-[10px] text-gray-400">Last Close</div>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`inline-flex items-center gap-0.5 font-medium ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}{up ? '+' : ''}{stock.change.toFixed(2)}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${up ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>{up ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{stock.volume.toFixed(2)}M</td>
                            <td className="px-4 py-3 text-center">
                              <button onClick={() => removeStock(stock.code)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-500" title="Buang"><Trash2 className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 text-center text-[11px] text-gray-400">
                  {loading ? <span className="inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Mengemas kini…</span> : 'Data real-time · auto-refresh 30s · Yahoo Finance 🆓'}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      <AddStockModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAddStock={addStock} currentWatchlist={watchlistCodes} selectedMarket={selectedMarket} />
      <AdvancedFilter isOpen={showFilterModal} onClose={() => setShowFilterModal(false)} onApplyFilters={setAdvancedFilters}
        stocks={selectedMarket === 'US' ? getAllUSStocks() : selectedMarket === 'GLOBAL' ? [...getAllStocks(), ...getAllUSStocks()] : getAllStocks()} currentFilters={advancedFilters} />
    </div>
  );
}

export default Watchlist;
