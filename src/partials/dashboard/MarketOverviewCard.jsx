import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Loader2 } from 'lucide-react';
import { fetchMultipleStocks } from '../../services/stockApi';
import { getAllStocks } from '../../data/malaysianStocks';

function MarketOverviewCard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const allStocksList = getAllStocks();
      const sampleCodes = allStocksList.slice(0, 40).map(s => s.code);
      const stocksData = await fetchMultipleStocks(sampleCodes);

      // Top gainers
      const gainers = stocksData
        .filter(s => s.changePercent > 0)
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 5);

      // Top losers
      const losers = stocksData
        .filter(s => s.changePercent < 0)
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, 5);

      // Most active
      const mostActive = [...stocksData]
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 5);

      // Statistics
      const advancing = stocksData.filter(s => s.change > 0).length;
      const declining = stocksData.filter(s => s.change < 0).length;
      const unchanged = stocksData.filter(s => s.change === 0).length;

      setOverview({
        gainers,
        losers,
        mostActive,
        advancing,
        declining,
        unchanged,
        total: stocksData.length
      });
    } catch (err) {
      console.error('Error fetching market overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const timer = setInterval(fetchOverview, 60000); // Refresh every minute
    return () => clearInterval(timer);
  }, []);

  if (loading && !overview) {
    return (
      <div className="col-span-full bg-white dark:bg-gray-800 shadow-xs rounded-xl p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!overview) return null;

  return (
    <>
      {/* Market Statistics */}
      <div className="col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
        <div className="px-5 py-5">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Market Statistics</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Advancing</span>
              </div>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">{overview.advancing}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Declining</span>
              </div>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">{overview.declining}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Unchanged</span>
              </div>
              <span className="text-lg font-bold text-gray-600 dark:text-gray-400">{overview.unchanged}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase">Market Sentiment</span>
              <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                overview.advancing > overview.declining
                  ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                  : overview.declining > overview.advancing
                  ? 'bg-red-500/20 text-red-700 dark:text-red-400'
                  : 'bg-gray-500/20 text-gray-700 dark:text-gray-400'
              }`}>
                {overview.advancing > overview.declining ? 'BULLISH' : overview.declining > overview.advancing ? 'BEARISH' : 'NEUTRAL'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Gainers */}
      <div className="col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
        <div className="px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Top Gainers</h2>
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>

          <div className="space-y-2">
            {overview.gainers.map((stock, index) => (
              <div key={stock.code} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-gray-400 w-4">{index + 1}</span>
                  <div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{stock.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">{stock.code}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-800 dark:text-gray-100">RM {stock.price.toFixed(2)}</div>
                  <div className="text-xs font-medium text-green-600 dark:text-green-400">+{stock.changePercent.toFixed(2)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Losers */}
      <div className="col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
        <div className="px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Top Losers</h2>
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>

          <div className="space-y-2">
            {overview.losers.map((stock, index) => (
              <div key={stock.code} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-gray-400 w-4">{index + 1}</span>
                  <div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{stock.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">{stock.code}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-800 dark:text-gray-100">RM {stock.price.toFixed(2)}</div>
                  <div className="text-xs font-medium text-red-600 dark:text-red-400">{stock.changePercent.toFixed(2)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Most Active */}
      <div className="col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
        <div className="px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Most Active</h2>
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>

          <div className="space-y-2">
            {overview.mostActive.map((stock, index) => (
              <div key={stock.code} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-gray-400 w-4">{index + 1}</span>
                  <div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{stock.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">{stock.code}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{stock.volume.toFixed(1)}M</div>
                  <div className={`text-xs font-medium ${stock.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default MarketOverviewCard;
