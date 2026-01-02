import React, { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, Activity, Newspaper, Check, X, Filter, Loader2, Bell, Plus, ToggleLeft, ToggleRight, Trash2, RefreshCw } from 'lucide-react';

import Sidebar from '../partials/StockSidebar';
import Header from '../partials/Header';
import { generateAlerts, getCustomAlerts, deleteCustomAlert, toggleCustomAlert } from '../services/alertService';
import AddAlertModal from '../components/AddAlertModal';

function Alerts() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customAlerts, setCustomAlerts] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get watchlist codes from localStorage (multi-market support)
  const getWatchlistCodes = () => {
    const selectedMarket = localStorage.getItem('selectedMarket') || 'BURSA';
    const storageKey = `stockWatchlist_${selectedMarket}`;
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  };

  const [watchlistCodes, setWatchlistCodes] = useState(getWatchlistCodes());

  // Load custom alerts
  const loadCustomAlerts = () => {
    const alerts = getCustomAlerts();
    setCustomAlerts(alerts);
  };

  // Fetch real-time alerts
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const realAlerts = await generateAlerts(watchlistCodes);
      setAlerts(realAlerts);
      setLastUpdated(Date.now());
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAlerts();
    loadCustomAlerts();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    fetchAlerts();
    loadCustomAlerts();
    // Refresh alerts every 30 seconds (faster updates)
    const timer = setInterval(fetchAlerts, 30000);
    return () => clearInterval(timer);
  }, [watchlistCodes]);

  // Listen for market changes
  useEffect(() => {
    const handleStorageChange = () => {
      setWatchlistCodes(getWatchlistCodes());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleAlertCreated = () => {
    loadCustomAlerts();
    setShowAddModal(false);
  };

  const handleToggleAlert = (id) => {
    toggleCustomAlert(id);
    loadCustomAlerts();
  };

  const handleDeleteCustomAlert = (id) => {
    deleteCustomAlert(id);
    loadCustomAlerts();
  };

  const toggleRead = (id) => {
    setAlerts(alerts.map(alert =>
      alert.id === id ? { ...alert, read: !alert.read } : alert
    ));
  };

  const deleteAlert = (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const getIcon = (type) => {
    switch(type) {
      case 'announcement': return <AlertCircle className="w-5 h-5" />;
      case 'breakout': return <TrendingUp className="w-5 h-5" />;
      case 'volume': return <Activity className="w-5 h-5" />;
      case 'news': return <Newspaper className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getColor = (priority) => {
    switch(priority) {
      case 'high': return 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400';
      case 'medium': return 'bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400';
      case 'low': return 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400';
      default: return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400';
    }
  };

  const filteredAlerts = filterType === 'all'
    ? alerts
    : alerts.filter(alert => alert.type === filterType);

  const unreadCount = alerts.filter(a => !a.read).length;

  // Format last updated time
  const getLastUpdatedText = () => {
    if (!lastUpdated) return '';
    const seconds = Math.floor((Date.now() - lastUpdated) / 1000);
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

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
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
                  Alert Center
                  {unreadCount > 0 && (
                    <span className="ml-3 inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Stay updated with market notifications</p>
                  {lastUpdated && (
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      • Updated {getLastUpdatedText()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50">
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  <Plus className="w-4 h-4" />
                  Create Alert
                </button>
              </div>
            </div>

            {/* My Custom Alerts */}
            {customAlerts.length > 0 && (
              <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-500" />
                    My Custom Alerts ({customAlerts.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {customAlerts.map((alert) => {
                    const alertTypeLabels = {
                      price_above: 'Price Above',
                      price_below: 'Price Below',
                      percent_gain: '% Gain',
                      percent_loss: '% Loss'
                    };
                    const targetValue = alert.type.includes('price')
                      ? `RM${alert.targetPrice}`
                      : `${alert.targetPercent}%`;

                    return (
                      <div
                        key={alert.id}
                        className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                          alert.enabled
                            ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 opacity-60'
                        }`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-800 dark:text-gray-100">
                              {alert.stockName} ({alert.stockCode})
                            </p>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                              alert.type.includes('gain') || alert.type === 'price_above'
                                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                            }`}>
                              {alertTypeLabels[alert.type]}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Target: {targetValue}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleAlert(alert.id)}
                            className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title={alert.enabled ? 'Disable alert' : 'Enable alert'}>
                            {alert.enabled ? (
                              <ToggleRight className="w-5 h-5 text-blue-500" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteCustomAlert(alert.id)}
                            className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors text-red-500 hover:text-red-600"
                            title="Delete alert">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${filterType === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                All ({alerts.length})
              </button>
              <button
                onClick={() => setFilterType('announcement')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${filterType === 'announcement' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                Announcements
              </button>
              <button
                onClick={() => setFilterType('breakout')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${filterType === 'breakout' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                Breakouts
              </button>
              <button
                onClick={() => setFilterType('volume')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${filterType === 'volume' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                Volume
              </button>
              <button
                onClick={() => setFilterType('news')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${filterType === 'news' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                News
              </button>
            </div>

            {/* Loading State */}
            {loading && alerts.length === 0 && (
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-12 text-center">
                <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600 dark:text-gray-400">Generating alerts from real-time data...</p>
              </div>
            )}

            {/* Alerts List */}
            {!loading && (
              <div className="space-y-3">
                {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 ${getColor(alert.priority)} ${alert.read ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-1">
                        {getIcon(alert.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                          {alert.title}
                          {!alert.read && (
                            <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{alert.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">{alert.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => toggleRead(alert.id)}
                        className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title={alert.read ? 'Mark as unread' : 'Mark as read'}>
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Delete alert">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}

            {!loading && filteredAlerts.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">No alerts to display</p>
              </div>
            )}

          </div>
        </main>

      </div>

      {/* Add Alert Modal */}
      <AddAlertModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAlertCreated}
      />
    </div>
  );
}

export default Alerts;
