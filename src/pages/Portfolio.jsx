import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, RefreshCw, Plus, Edit2, Trash2, Loader2, AlertCircle, Wallet, DollarSign } from 'lucide-react';

import Sidebar from '../partials/StockSidebar';
import Header from '../partials/Header';
import AddHoldingModal from '../components/AddHoldingModal';
import { fetchMultipleStocks } from '../services/stockApi';
import { getPortfolio, removeHolding, calculatePortfolioStats, getPortfolioStockCodes } from '../services/portfolioService';

function Portfolio() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [portfolio, setPortfolio] = useState([]);
  const [portfolioStats, setPortfolioStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch portfolio data and current prices
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const holdings = getPortfolio();
      setPortfolio(holdings);

      if (holdings.length === 0) {
        setPortfolioStats({
          holdings: [],
          totalInvestment: 0,
          totalCurrentValue: 0,
          totalGainLoss: 0,
          totalGainLossPercent: 0,
          totalHoldings: 0
        });
        setLoading(false);
        return;
      }

      // Fetch current prices for all stocks in portfolio
      const stockCodes = getPortfolioStockCodes();
      const pricesData = await fetchMultipleStocks(stockCodes);

      // Create price lookup
      const pricesMap = {};
      pricesData.forEach(stock => {
        pricesMap[stock.code] = stock;
      });

      // Calculate stats
      const stats = calculatePortfolioStats(holdings, pricesMap);
      setPortfolioStats(stats);

    } catch (err) {
      setError(err.message || 'Failed to fetch portfolio data');
      console.error('Error fetching portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, []);

  const refreshData = () => {
    fetchData();
  };

  const handleRemoveHolding = (id) => {
    if (confirm('Are you sure you want to remove this holding?')) {
      removeHolding(id);
      fetchData();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

            {/* Page header */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Portfolio Tracker</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Track your investments with real-time P&L
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn bg-green-500 hover:bg-green-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  <span>Add Holding</span>
                </button>

                <button
                  onClick={refreshData}
                  className="btn bg-blue-500 hover:bg-blue-600 text-white">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Portfolio Summary Cards */}
            {portfolioStats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Total Investment */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">
                        Total Investment
                      </p>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        RM {portfolioStats.totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Wallet className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>

                {/* Current Value */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase mb-1">
                        Current Value
                      </p>
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                        RM {portfolioStats.totalCurrentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>

                {/* Total Gain/Loss */}
                <div className={`rounded-lg p-4 border ${
                  portfolioStats.totalGainLoss >= 0
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs font-semibold uppercase mb-1 ${
                        portfolioStats.totalGainLoss >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        Total Gain/Loss
                      </p>
                      <p className={`text-2xl font-bold ${
                        portfolioStats.totalGainLoss >= 0
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}>
                        {portfolioStats.totalGainLoss >= 0 ? '+' : ''}RM {portfolioStats.totalGainLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    {portfolioStats.totalGainLoss >= 0 ? (
                      <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                </div>

                {/* Gain/Loss % */}
                <div className={`rounded-lg p-4 border ${
                  portfolioStats.totalGainLossPercent >= 0
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs font-semibold uppercase mb-1 ${
                        portfolioStats.totalGainLossPercent >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        Total Return %
                      </p>
                      <p className={`text-2xl font-bold ${
                        portfolioStats.totalGainLossPercent >= 0
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}>
                        {portfolioStats.totalGainLossPercent >= 0 ? '+' : ''}{portfolioStats.totalGainLossPercent.toFixed(2)}%
                      </p>
                    </div>
                    <div className={`text-2xl font-bold ${
                      portfolioStats.totalGainLossPercent >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {portfolioStats.totalGainLossPercent >= 0 ? '📈' : '📉'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && portfolio.length === 0 && (
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-12 text-center">
                <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600 dark:text-gray-400">Loading portfolio...</p>
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

            {/* Empty State */}
            {!loading && portfolioStats && portfolioStats.totalHoldings === 0 && (
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-12 text-center">
                <Wallet className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  No Holdings Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Start tracking your investments by adding your first holding
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn bg-blue-500 hover:bg-blue-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Holding
                </button>
              </div>
            )}

            {/* Holdings Table */}
            {!loading && portfolioStats && portfolioStats.holdings.length > 0 && (
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
                <div className="overflow-x-auto">
                  <table className="table-auto w-full">
                    <thead className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left">Stock</th>
                        <th className="px-4 py-3 text-right">Quantity</th>
                        <th className="px-4 py-3 text-right">Buy Price</th>
                        <th className="px-4 py-3 text-right">Current Price</th>
                        <th className="px-4 py-3 text-right">Invested</th>
                        <th className="px-4 py-3 text-right">Current Value</th>
                        <th className="px-4 py-3 text-right">Gain/Loss</th>
                        <th className="px-4 py-3 text-right">Return %</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-gray-200 dark:divide-gray-700">
                      {portfolioStats.holdings.map((holding) => {
                        const isProfit = holding.gainLoss >= 0;
                        return (
                          <tr key={holding.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                            <td className="px-4 py-3">
                              <div
                                onClick={() => navigate(`/stock/${holding.stockCode}`)}
                                className="cursor-pointer">
                                <div className="font-medium text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                  {holding.stockName}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{holding.stockCode}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-medium text-gray-800 dark:text-gray-100">
                                {holding.quantity.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-gray-600 dark:text-gray-400">
                                RM {holding.buyPrice.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-semibold text-gray-800 dark:text-gray-100">
                                RM {holding.currentPrice.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-gray-600 dark:text-gray-400">
                                RM {holding.investedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-semibold text-gray-800 dark:text-gray-100">
                                RM {holding.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className={`flex items-center justify-end space-x-1 ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                <span className="font-medium">
                                  {isProfit ? '+' : ''}RM {holding.gainLoss.toFixed(2)}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${isProfit ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-red-500/20 text-red-700 dark:text-red-400'}`}>
                                {isProfit ? '+' : ''}{holding.gainLossPercent.toFixed(2)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => handleRemoveHolding(holding.id)}
                                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 transition-colors"
                                  title="Remove holding">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
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

      {/* Add Holding Modal */}
      <AddHoldingModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}

export default Portfolio;
