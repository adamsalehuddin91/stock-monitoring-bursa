import React, { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, Activity, Newspaper, Check, X, Loader2, Bell, Plus, ToggleLeft, ToggleRight, Trash2, RefreshCw } from 'lucide-react';

import Sidebar from '../partials/StockSidebar';
import Header from '../partials/Header';
import { generateAlerts, getCustomAlerts, deleteCustomAlert, toggleCustomAlert } from '../services/alertService';
import AddAlertModal from '../components/AddAlertModal';

const TYPE_TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'announcement', label: 'Announcement' },
  { key: 'breakout', label: 'Breakout' },
  { key: 'volume', label: 'Volume' },
  { key: 'news', label: 'News' },
];

const ICON = { announcement: AlertCircle, breakout: TrendingUp, volume: Activity, news: Newspaper };
const TONE = {
  high: 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400',
  medium: 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400',
  low: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
};

function Alerts() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customAlerts, setCustomAlerts] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getWatchlistCodes = () => {
    const market = localStorage.getItem('selectedMarket') || 'BURSA';
    return JSON.parse(localStorage.getItem(`stockWatchlist_${market}`) || '[]');
  };
  const [watchlistCodes, setWatchlistCodes] = useState(getWatchlistCodes());

  const loadCustomAlerts = () => setCustomAlerts(getCustomAlerts());

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setAlerts(await generateAlerts(watchlistCodes));
      setLastUpdated(Date.now());
    } catch (err) { console.error('Error fetching alerts:', err); }
    finally { setLoading(false); }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAlerts();
    loadCustomAlerts();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    fetchAlerts();
    loadCustomAlerts();
    const timer = setInterval(fetchAlerts, 60000);
    return () => clearInterval(timer);
  }, [watchlistCodes]);

  useEffect(() => {
    const h = () => setWatchlistCodes(getWatchlistCodes());
    window.addEventListener('storage', h);
    return () => window.removeEventListener('storage', h);
  }, []);

  const toggleRead = (id) => setAlerts(alerts.map(a => a.id === id ? { ...a, read: !a.read } : a));
  const deleteAlert = (id) => setAlerts(alerts.filter(a => a.id !== id));

  const filteredAlerts = filterType === 'all' ? alerts : alerts.filter(a => a.type === filterType);
  const unreadCount = alerts.filter(a => !a.read).length;

  const lastUpdatedText = () => {
    if (!lastUpdated) return '';
    const s = Math.floor((Date.now() - lastUpdated) / 1000);
    if (s < 10) return 'baru je'; if (s < 60) return `${s}s lalu`;
    return `${Math.floor(s / 60)}m lalu`;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-900">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-7 w-full max-w-4xl mx-auto">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h1 className="text-2xl md:text-[28px] text-gray-800 dark:text-gray-100 font-extrabold flex items-center gap-2 tracking-tight">
                  <Bell className="text-blue-500" /> Alert Center
                  {unreadCount > 0 && <span className="text-xs font-bold text-white bg-red-500 rounded-full px-2 py-0.5">{unreadCount}</span>}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Notifikasi pasaran real-time {lastUpdated && <span className="text-gray-400">· dikemas kini {lastUpdatedText()}</span>}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold px-3.5 py-2 rounded-xl disabled:opacity-50">
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
                </button>
                <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 bg-blue-500 text-white text-sm font-semibold px-3.5 py-2 rounded-xl hover:bg-blue-600">
                  <Plus className="w-4 h-4" /> Alert Baru
                </button>
              </div>
            </div>

            {/* Custom alerts */}
            {customAlerts.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700/50 mb-5">
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-3"><Bell className="w-4 h-4 text-blue-500" /> Alert Saya ({customAlerts.length})</h2>
                <div className="space-y-2">
                  {customAlerts.map(alert => {
                    const labels = { price_above: 'Harga Atas', price_below: 'Harga Bawah', percent_gain: '% Naik', percent_loss: '% Turun' };
                    const target = alert.type.includes('price') ? `RM${alert.targetPrice}` : `${alert.targetPercent}%`;
                    const good = alert.type.includes('gain') || alert.type === 'price_above';
                    return (
                      <div key={alert.id} className={`flex items-center justify-between p-3.5 rounded-2xl border ${alert.enabled ? 'border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 opacity-60'}`}>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{alert.stockName} ({alert.stockCode})</span>
                            <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${good ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>{labels[alert.type]}</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Sasaran: {target}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { toggleCustomAlert(alert.id); loadCustomAlerts(); }} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg" title={alert.enabled ? 'Matikan' : 'Hidupkan'}>
                            {alert.enabled ? <ToggleRight className="w-5 h-5 text-blue-500" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                          </button>
                          <button onClick={() => { deleteCustomAlert(alert.id); loadCustomAlerts(); }} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2 mb-5">
              {TYPE_TABS.map(t => (
                <button key={t.key} onClick={() => setFilterType(t.key)}
                  className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${filterType === t.key ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  {t.label}{t.key === 'all' ? ` (${alerts.length})` : ''}
                </button>
              ))}
            </div>

            {/* Alerts list */}
            {loading && alerts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-14 text-center shadow-sm"><Loader2 className="w-10 h-10 text-blue-500 mx-auto mb-3 animate-spin" /><p className="text-gray-500 dark:text-gray-400 text-sm">Menjana alert dari data real-time…</p></div>
            ) : filteredAlerts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-14 text-center shadow-sm"><AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 dark:text-gray-400 text-sm">Tiada alert untuk dipapar</p></div>
            ) : (
              <div className="space-y-3">
                {filteredAlerts.map(alert => {
                  const Icon = ICON[alert.type] || AlertCircle;
                  return (
                    <div key={alert.id} className={`rounded-2xl border p-4 ${TONE[alert.priority] || TONE.low} ${alert.read ? 'opacity-55' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="mt-0.5 shrink-0"><Icon className="w-5 h-5" /></div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                              {alert.url && alert.url !== '#' ? <a href={alert.url} target="_blank" rel="noreferrer" className="hover:underline">{alert.title}</a> : alert.title}
                              {!alert.read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0"></span>}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{alert.message}</p>
                            <p className="text-[11px] text-gray-400 mt-1">{alert.time}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => toggleRead(alert.id)} className="p-2 hover:bg-white/60 dark:hover:bg-gray-700 rounded-lg" title="Tanda dibaca"><Check className="w-4 h-4" /></button>
                          <button onClick={() => deleteAlert(alert.id)} className="p-2 hover:bg-white/60 dark:hover:bg-gray-700 rounded-lg" title="Buang"><X className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </main>
      </div>
      <AddAlertModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={() => { loadCustomAlerts(); setShowAddModal(false); }} />
    </div>
  );
}

export default Alerts;
