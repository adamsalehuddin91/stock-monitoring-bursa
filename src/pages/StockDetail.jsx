import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Loader2, BarChart2 } from 'lucide-react';

import Sidebar from '../partials/StockSidebar';
import Header from '../partials/Header';
import StockChart from '../components/StockChart';
import { fetchStockData, fetchHistoricalData } from '../services/stockApi';
import { getStockByCode } from '../data/malaysianStocks';

function StockDetail() {
  const { stockCode } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stockInfo, setStockInfo] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState('1mo');
  const [chartType, setChartType] = useState('candlestick');

  const timeframes = [
    { value: '1d', label: '1D', interval: '5m' },
    { value: '5d', label: '5D', interval: '15m' },
    { value: '1mo', label: '1M', interval: '1d' },
    { value: '3mo', label: '3M', interval: '1d' },
    { value: '6mo', label: '6M', interval: '1d' },
    { value: '1y', label: '1Y', interval: '1d' },
  ];

  // Fetch stock info and current price
  useEffect(() => {
    const fetchInfo = async () => {
      const stock = getStockByCode(stockCode);
      setStockInfo(stock);

      const priceData = await fetchStockData(stockCode);
      setCurrentPrice(priceData);
    };

    fetchInfo();
  }, [stockCode]);

  // Fetch historical data for chart
  useEffect(() => {
    const fetchChart = async () => {
      setLoading(true);
      const timeframe = timeframes.find(t => t.value === selectedRange);
      const data = await fetchHistoricalData(stockCode, selectedRange, timeframe.interval);
      setChartData(data);
      setLoading(false);
    };

    fetchChart();
  }, [stockCode, selectedRange]);

  if (!stockInfo) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          </main>
        </div>
      </div>
    );
  }

  const isPositive = currentPrice && currentPrice.change >= 0;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-6">
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span>Back</span>
            </button>

            {/* Stock Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">
                    {stockInfo.name}
                  </h1>
                  <div className="flex items-center space-x-3">
                    <span className="text-lg text-gray-500 dark:text-gray-400">{stockCode}</span>
                    <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                      {stockInfo.sector}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                      {stockInfo.category}
                    </span>
                  </div>
                </div>

                {currentPrice && (
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                      RM {currentPrice.price.toFixed(2)}
                    </div>
                    <div className={`flex items-center justify-end space-x-1 mt-1 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      <span className="text-lg font-semibold">
                        {isPositive ? '+' : ''}{currentPrice.change.toFixed(2)} ({isPositive ? '+' : ''}{currentPrice.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Chart Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  {/* Timeframe Selector */}
                  <div className="flex items-center space-x-2">
                    {timeframes.map((tf) => (
                      <button
                        key={tf.value}
                        onClick={() => setSelectedRange(tf.value)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          selectedRange === tf.value
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}>
                        {tf.label}
                      </button>
                    ))}
                  </div>

                  {/* Chart Type Selector */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setChartType('candlestick')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        chartType === 'candlestick'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}>
                      <BarChart2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setChartType('line')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        chartType === 'line'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}>
                      Line
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="p-4">
                {loading ? (
                  <div className="flex items-center justify-center" style={{ height: '500px' }}>
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                  </div>
                ) : chartData && chartData.candles ? (
                  <StockChart
                    data={chartData.candles}
                    height={500}
                    showVolume={true}
                    type={chartType}
                  />
                ) : (
                  <div className="flex items-center justify-center" style={{ height: '500px' }}>
                    <p className="text-gray-500 dark:text-gray-400">No chart data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Stock Stats */}
            {currentPrice && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Open</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    RM {(currentPrice.price - currentPrice.change).toFixed(2)}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">High</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    RM {currentPrice.high.toFixed(2)}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Low</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    RM {currentPrice.low.toFixed(2)}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Volume</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    {currentPrice.volume.toFixed(2)}M
                  </p>
                </div>
              </div>
            )}

          </div>
        </main>

      </div>
    </div>
  );
}

export default StockDetail;
