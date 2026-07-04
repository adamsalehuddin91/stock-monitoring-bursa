import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, TrendingUp, TrendingDown, Activity, Plus, Loader2, Search, X, ArrowUpDown, Zap } from 'lucide-react';

import Sidebar from '../partials/StockSidebar';
import Header from '../partials/Header';
import { fetchMultipleStocks } from '../services/stockApi';
import { getAllStocks } from '../data/malaysianStocks';
import { getAllUSStocks } from '../data/globalStocks';

// Sort keys map to the real numeric field (fixes "change" sorting by absolute
// value while the % filter/column used changePercent).
const SORT_FIELD = { change: 'changePercent', price: 'price', volume: 'volume', intraday: 'intradayScore' };

// Intraday-potential proxy from the snapshot: daily range % (movement) × sqrt(volume)
// (liquidity). Rewards cheap stocks that actually MOVE and TRADE — not dead pennies.
const intradayPotential = (s) => {
  const range = s.high && s.low && s.price ? ((s.high - s.low) / s.price) * 100 : 0;
  return Math.round(range * Math.sqrt(Math.max(s.volume || 0, 0)) * 10) / 10;
};

function StockScreener() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allStocks, setAllStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState('US');

  const [filters, setFilters] = useState({
    priceMin: '', priceMax: '', changeMin: '', changeMax: '',
    volumeMin: '', sector: 'all', sortBy: 'change', sortOrder: 'desc',
  });

  const presets = [
    { name: 'Top Gainers', icon: TrendingUp, filters: { changeMin: '2', sortBy: 'change', sortOrder: 'desc' } },
    { name: 'Top Losers', icon: TrendingDown, filters: { changeMax: '-2', sortBy: 'change', sortOrder: 'asc' } },
    { name: 'High Volume', icon: Activity, filters: { volumeMin: '5', sortBy: 'volume', sortOrder: 'desc' } },
    { name: 'Cheap Stocks', icon: Filter, filters: { priceMax: selectedMarket === 'US' ? '50' : '5', sortBy: 'price', sortOrder: 'asc' } },
    { name: 'Breakout', icon: TrendingUp, filters: { changeMin: '5', volumeMin: '10', sortBy: 'change', sortOrder: 'desc' } },
    { name: 'Penny Intraday', icon: Zap, filters: { priceMax: '1', volumeMin: '1', sortBy: 'intraday', sortOrder: 'desc' } },
  ];

  const fetchStocks = async () => {
    try {
      setLoading(true);
      let stocksList;
      if (selectedMarket === 'US') stocksList = getAllUSStocks();
      else if (selectedMarket === 'BURSA') stocksList = getAllStocks();
      else {
        const combined = [...getAllStocks(), ...getAllUSStocks()];
        const seen = new Map();
        stocksList = combined.filter(s => (seen.has(s.code) ? false : (seen.set(s.code, 1), true)));
      }
      const stockData = await fetchMultipleStocks(stocksList.map(s => s.code));
      const seenCodes = new Set();
      const enriched = stockData
        .map(stock => {
          const info = stocksList.find(s => s.code === stock.code);
          return {
            ...stock,
            sector: info?.sector || info?.category || 'Other',
            market: selectedMarket === 'US' ? 'US' : (selectedMarket === 'BURSA' ? 'MY' : (info?.sector ? 'US' : 'MY')),
          };
        })
        // Dedupe by code — duplicate keys + re-sort makes React duplicate DOM rows.
        .filter(s => (seenCodes.has(s.code) ? false : (seenCodes.add(s.code), true)));
      setAllStocks(enriched);
      setFilteredStocks(enriched);
    } catch (error) {
      console.error('Error fetching stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStocks(); }, [selectedMarket]);

  useEffect(() => {
    let filtered = [...allStocks];
    if (filters.priceMin) filtered = filtered.filter(s => s.price >= parseFloat(filters.priceMin));
    if (filters.priceMax) filtered = filtered.filter(s => s.price <= parseFloat(filters.priceMax));
    if (filters.changeMin) filtered = filtered.filter(s => s.changePercent >= parseFloat(filters.changeMin));
    if (filters.changeMax) filtered = filtered.filter(s => s.changePercent <= parseFloat(filters.changeMax));
    if (filters.volumeMin) filtered = filtered.filter(s => s.volume >= parseFloat(filters.volumeMin));
    if (filters.sector !== 'all') filtered = filtered.filter(s => s.sector?.toLowerCase() === filters.sector.toLowerCase());

    filtered = filtered.map(s => ({ ...s, intradayScore: intradayPotential(s) }));
    const key = SORT_FIELD[filters.sortBy] || filters.sortBy;
    filtered.sort((a, b) => {
      const aVal = a[key] ?? 0, bVal = b[key] ?? 0;
      return filters.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
    setFilteredStocks(filtered);
  }, [filters, allStocks]);

  const applyPreset = (preset) => setFilters(prev => ({
    ...prev, priceMin: '', priceMax: '', changeMin: '', changeMax: '', volumeMin: '', ...preset.filters,
  }));
  const clearFilters = () => setFilters({ priceMin: '', priceMax: '', changeMin: '', changeMax: '', volumeMin: '', sector: 'all', sortBy: 'change', sortOrder: 'desc' });

  const addToWatchlist = (stock) => {
    const key = `stockWatchlist_${selectedMarket}`;
    const wl = JSON.parse(localStorage.getItem(key) || '[]');
    if (!wl.includes(stock.code)) { wl.push(stock.code); localStorage.setItem(key, JSON.stringify(wl)); alert(`${stock.name} ditambah ke watchlist!`); }
    else alert(`${stock.name} sudah dalam watchlist`);
  };

  const sectors = ['all', ...new Set(allStocks.map(s => s.sector).filter(Boolean))];
  const cur = selectedMarket === 'US' ? '$' : 'RM';
  const activeFilters = [filters.priceMin, filters.priceMax, filters.changeMin, filters.changeMax, filters.volumeMin].filter(Boolean).length + (filters.sector !== 'all' ? 1 : 0);

  const field = (v, onChange, ph) => (
    <input type="number" placeholder={ph} value={v} onChange={onChange}
      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100" />
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-900">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-7 w-full max-w-6xl mx-auto">

            {/* Title + market */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h1 className="text-2xl md:text-[28px] text-gray-800 dark:text-gray-100 font-extrabold flex items-center gap-2 tracking-tight">
                  <Filter className="text-blue-500" /> Stock Screener
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tapis &amp; jumpa peluang dagangan</p>
              </div>
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                {['BURSA', 'US', 'GLOBAL'].map(m => (
                  <button key={m} onClick={() => setSelectedMarket(m)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${selectedMarket === m ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    {m === 'BURSA' ? '🇲🇾 Bursa' : m === 'US' ? '🇺🇸 US' : '🌍 Global'}
                  </button>
                ))}
              </div>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mb-5">
              {presets.map((p, i) => (
                <button key={i} onClick={() => applyPreset(p)}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm">
                  <p.icon className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{p.name}</span>
                </button>
              ))}
              <button onClick={clearFilters} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700/60 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <X className="w-4 h-4" /> <span className="text-sm font-medium">Clear</span>
              </button>
            </div>

            {/* Advanced filters */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700/50 mb-5">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-500" /> Advanced Filters
                {activeFilters > 0 && <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-full px-2 py-0.5">{activeFilters} aktif</span>}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Harga ({cur})</label>
                  <div className="flex gap-2">{field(filters.priceMin, e => setFilters(p => ({ ...p, priceMin: e.target.value })), 'Min')}{field(filters.priceMax, e => setFilters(p => ({ ...p, priceMax: e.target.value })), 'Max')}</div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">% Perubahan</label>
                  <div className="flex gap-2">{field(filters.changeMin, e => setFilters(p => ({ ...p, changeMin: e.target.value })), 'Min')}{field(filters.changeMax, e => setFilters(p => ({ ...p, changeMax: e.target.value })), 'Max')}</div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Volume min (M)</label>
                  {field(filters.volumeMin, e => setFilters(p => ({ ...p, volumeMin: e.target.value })), 'cth 5')}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Sektor</label>
                  <select value={filters.sector} onChange={e => setFilters(p => ({ ...p, sector: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-xl text-sm capitalize dark:text-gray-100">
                    {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3 flex-wrap">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{filteredStocks.length} saham</h3>
                <div className="flex gap-2">
                  <select value={filters.sortBy} onChange={e => setFilters(p => ({ ...p, sortBy: e.target.value }))}
                    className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-gray-100">
                    <option value="intraday">🔥 Intraday Potential</option><option value="change">% Perubahan</option><option value="price">Harga</option><option value="volume">Volume</option>
                  </select>
                  <button onClick={() => setFilters(p => ({ ...p, sortOrder: p.sortOrder === 'asc' ? 'desc' : 'asc' }))}
                    className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg text-sm flex items-center gap-1 dark:text-gray-100">
                    <ArrowUpDown className="w-3.5 h-3.5" />{filters.sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="p-14 text-center"><Loader2 className="w-10 h-10 text-blue-500 mx-auto mb-3 animate-spin" /><p className="text-gray-500 dark:text-gray-400 text-sm">Mengimbas saham…</p></div>
              ) : filteredStocks.length === 0 ? (
                <div className="p-14 text-center"><Search className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 dark:text-gray-400 text-sm">Tiada saham padan tapisan</p>
                  <button onClick={clearFilters} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">Clear Filters</button></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/30 text-[11px] uppercase tracking-wide text-gray-400">
                      <tr>
                        <th className="px-5 py-3 text-left">Saham</th><th className="px-5 py-3 text-right">Harga</th>
                        <th className="px-5 py-3 text-right">% Ubah</th><th className="px-5 py-3 text-right">Volume</th>
                        <th className="px-5 py-3 text-right">⚡ Intraday</th>
                        <th className="px-5 py-3 text-left">Sektor</th><th className="px-5 py-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                      {filteredStocks.map(s => {
                        const up = s.changePercent >= 0;
                        return (
                          <tr key={s.code} onClick={() => navigate(`/stock/${s.code}`)} className="hover:bg-gray-50 dark:hover:bg-gray-900/20 cursor-pointer transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <span>{s.market === 'US' ? '🇺🇸' : '🇲🇾'}</span>
                                <div><div className="font-semibold text-gray-800 dark:text-gray-100">{s.name}</div><div className="text-[11px] text-gray-400">{s.code}</div></div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-right font-semibold text-gray-800 dark:text-gray-100">{s.market === 'US' ? '$' : 'RM'}{s.price.toFixed(2)}</td>
                            <td className="px-5 py-3.5 text-right">
                              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${up ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>{up ? '+' : ''}{s.changePercent.toFixed(2)}%</span>
                            </td>
                            <td className="px-5 py-3.5 text-right text-gray-500 dark:text-gray-400">{s.volume.toFixed(1)}M</td>
                            <td className="px-5 py-3.5 text-right"><span className="inline-flex px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-full">{s.intradayScore ?? '—'}</span></td>
                            <td className="px-5 py-3.5"><span className="inline-flex px-2 py-0.5 text-[11px] font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full capitalize">{s.sector}</span></td>
                            <td className="px-5 py-3.5 text-center">
                              <button onClick={e => { e.stopPropagation(); addToWatchlist(s); }} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors"><Plus className="w-3 h-3" /> Add</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
