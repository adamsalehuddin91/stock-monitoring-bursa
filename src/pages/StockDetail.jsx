import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Loader2, BarChart2, Activity, TrendingUpIcon, AlertTriangle } from 'lucide-react';

import Sidebar from '../partials/StockSidebar';
import Header from '../partials/Header';
import StockChart from '../components/StockChart';
import { fetchStockData, fetchHistoricalData } from '../services/stockApi';
import { getStockByCode } from '../data/malaysianStocks';
import { getUSStockByCode } from '../data/globalStocks';
import { calculateAllIndicators } from '../utils/technicalIndicators';
import { detectTrend, calculateSupportResistance, detectPatterns, generateRecommendation, calculateMetrics } from '../utils/stockAnalysis';

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
  const [indicators, setIndicators] = useState({
    sma: false,
    ema: false,
    rsi: false,
    macd: false,
    bollinger: false
  });
  const [technicalData, setTechnicalData] = useState(null);
  const [stockAnalysis, setStockAnalysis] = useState(null);

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
      // Try Malaysian stocks first, then US stocks
      let stock = getStockByCode(stockCode);
      if (!stock) {
        stock = getUSStockByCode(stockCode);
      }
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
      try {
        const timeframe = timeframes.find(t => t.value === selectedRange);
        const data = await fetchHistoricalData(stockCode, selectedRange, timeframe.interval);
        setChartData(data);

        // Calculate technical indicators
        if (data && data.candles && data.candles.length > 0) {
          const prices = data.candles.map(c => c.close);
          const volumes = data.candles.map(c => c.volume);
          const calculated = calculateAllIndicators(prices, volumes);
          setTechnicalData(calculated);

          // Perform stock analysis
          const trend = detectTrend(data.candles);
          const supportResistance = calculateSupportResistance(data.candles);
          const patterns = detectPatterns(data.candles, calculated);
          const metrics = calculateMetrics(data.candles, currentPrice);
          const recommendation = generateRecommendation(currentPrice, calculated, patterns, supportResistance);

          setStockAnalysis({
            trend,
            supportResistance,
            patterns,
            metrics,
            recommendation
          });
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (stockCode) {
      fetchChart();
    }
  }, [stockCode, selectedRange]);

  const toggleIndicator = (name) => {
    setIndicators(prev => ({ ...prev, [name]: !prev[name] }));
  };

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

  // Detect if this is a US stock (no .KL suffix)
  const isUSStock = stockInfo && (stockInfo.market === 'NASDAQ' || stockInfo.market === 'NYSE' || !stockCode.includes('.KL'));
  const currencySymbol = isUSStock ? '$' : 'RM';

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
                      {currencySymbol} {currentPrice.price.toFixed(2)}
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

            {/* Stock Overview & Analysis */}
            {stockAnalysis && currentPrice && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

                {/* Trading Recommendation */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-sm p-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase">AI Recommendation</h3>
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
                      {stockAnalysis.recommendation.confidence}% Confidence
                    </span>
                  </div>

                  <div className="text-center mb-4">
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${
                      stockAnalysis.recommendation.action === 'BUY' ? 'bg-green-500' :
                      stockAnalysis.recommendation.action === 'SELL' ? 'bg-red-500' :
                      'bg-yellow-500'
                    } mb-3`}>
                      <span className="text-3xl font-bold text-white">{stockAnalysis.recommendation.action}</span>
                    </div>
                    <div className="flex items-center justify-center space-x-4 text-sm">
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Bullish</span>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">{stockAnalysis.recommendation.bullishScore}</p>
                      </div>
                      <div className="text-gray-400">vs</div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Bearish</span>
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">{stockAnalysis.recommendation.bearishScore}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">Key Reasons:</p>
                    {stockAnalysis.recommendation.reasons.map((reason, idx) => (
                      <div key={idx} className="flex items-start text-xs text-gray-700 dark:text-gray-300">
                        <span className="text-blue-500 mr-2">•</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technical Analysis */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase mb-4">Technical Analysis</h3>

                  {/* Trend */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Trend</span>
                      <span className={`text-sm font-bold ${
                        stockAnalysis.trend.trend.includes('Up') ? 'text-green-600 dark:text-green-400' :
                        stockAnalysis.trend.trend.includes('Down') ? 'text-red-600 dark:text-red-400' :
                        'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {stockAnalysis.trend.trend}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          stockAnalysis.trend.trend.includes('Up') ? 'bg-green-500' :
                          stockAnalysis.trend.trend.includes('Down') ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`}
                        style={{ width: `${stockAnalysis.trend.strength}%` }}
                      />
                    </div>
                  </div>

                  {/* Support & Resistance */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Resistance</span>
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">
                        {currencySymbol} {stockAnalysis.supportResistance.resistance?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Current Price</span>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                        {currencySymbol} {currentPrice.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Support</span>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {currencySymbol} {stockAnalysis.supportResistance.support?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Price Position */}
                  {stockAnalysis.supportResistance.support && stockAnalysis.supportResistance.resistance && (
                    <div className="mt-4">
                      <div className="relative w-full h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full">
                        <div
                          className="absolute w-3 h-3 bg-white border-2 border-gray-800 dark:border-gray-200 rounded-full -top-0.5"
                          style={{
                            left: `${Math.min(100, Math.max(0, ((currentPrice.price - stockAnalysis.supportResistance.support) / (stockAnalysis.supportResistance.resistance - stockAnalysis.supportResistance.support)) * 100))}%`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>Support</span>
                        <span>Resistance</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Key Metrics */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase mb-4">Key Metrics</h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">52W High</span>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                        {currencySymbol} {stockAnalysis.metrics.high52w?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">52W Low</span>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                        {currencySymbol} {stockAnalysis.metrics.low52w?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">From 52W High</span>
                      <span className={`text-sm font-bold ${stockAnalysis.metrics.from52wHigh > -10 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {stockAnalysis.metrics.from52wHigh?.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Avg Volume</span>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                        {(stockAnalysis.metrics.avgVolume / 1000000).toFixed(2)}M
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Volatility</span>
                      <span className={`text-sm font-bold ${
                        stockAnalysis.metrics.volatility > 5 ? 'text-red-600 dark:text-red-400' :
                        stockAnalysis.metrics.volatility > 3 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-green-600 dark:text-green-400'
                      }`}>
                        {stockAnalysis.metrics.volatility?.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Comprehensive Metadata - Company Fundamentals */}
            {stockInfo && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

                {/* Company Fundamentals */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase mb-4">Company Fundamentals</h3>

                  <div className="space-y-3">
                    {stockInfo.marketCap && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Market Cap</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                          {stockInfo.marketCap}
                        </span>
                      </div>
                    )}

                    {stockInfo.peRatio && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">P/E Ratio</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                          {stockInfo.peRatio.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {stockInfo.dividendYield && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Dividend Yield</span>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          {stockInfo.dividendYield.toFixed(2)}%
                        </span>
                      </div>
                    )}

                    {stockInfo.beta && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Beta</span>
                        <span className={`text-sm font-bold ${
                          stockInfo.beta > 1 ? 'text-red-600 dark:text-red-400' :
                          stockInfo.beta > 0.8 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-green-600 dark:text-green-400'
                        }`}>
                          {stockInfo.beta.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {currentPrice && (
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Prev Close</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                          {currencySymbol} {currentPrice.prevClose.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trading Information */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase mb-4">Trading Information</h3>

                  <div className="space-y-3">
                    {stockInfo.analystRating && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Analyst Rating</span>
                        <span className={`text-sm font-bold px-2 py-1 rounded ${
                          stockInfo.analystRating === 'Buy' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          stockInfo.analystRating === 'Sell' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                          'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        }`}>
                          {stockInfo.analystRating}
                        </span>
                      </div>
                    )}

                    {stockInfo.esgRating && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">ESG Rating</span>
                        <span className={`text-sm font-bold px-2 py-1 rounded ${
                          stockInfo.esgRating === 'A' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          stockInfo.esgRating === 'B' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {stockInfo.esgRating}
                        </span>
                      </div>
                    )}

                    {stockInfo.syariahCompliant !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Syariah Status</span>
                        <span className={`text-sm font-bold px-2 py-1 rounded ${
                          stockInfo.syariahCompliant ?
                          'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {stockInfo.syariahCompliant ? '✓ Compliant' : 'Non-Compliant'}
                        </span>
                      </div>
                    )}

                    {stockInfo.tradingStyle && stockInfo.tradingStyle.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 block mb-2">Trading Style</span>
                        <div className="flex flex-wrap gap-1">
                          {stockInfo.tradingStyle.map((style, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                              {style}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Market Data */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase mb-4">Market Data</h3>

                  <div className="space-y-3">
                    {currentPrice && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Day Range</span>
                          <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                            {currencySymbol}{currentPrice.low.toFixed(2)} - {currencySymbol}{currentPrice.high.toFixed(2)}
                          </span>
                        </div>

                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="h-2 bg-blue-500 rounded-full relative"
                            style={{
                              width: `${((currentPrice.price - currentPrice.low) / (currentPrice.high - currentPrice.low)) * 100}%`
                            }}
                          >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full" />
                          </div>
                        </div>
                      </>
                    )}

                    {stockInfo.liquidity && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Liquidity</span>
                        <span className={`text-sm font-bold px-2 py-1 rounded ${
                          stockInfo.liquidity === 'High' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          stockInfo.liquidity === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {stockInfo.liquidity}
                        </span>
                      </div>
                    )}

                    {stockInfo.volatility && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Risk Level</span>
                        <span className={`text-sm font-bold px-2 py-1 rounded ${
                          stockInfo.volatility === 'Low' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          stockInfo.volatility === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {stockInfo.volatility}
                        </span>
                      </div>
                    )}

                    {stockInfo.cmpSuitability && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">CMP Suitability</span>
                        <span className={`text-sm font-bold px-2 py-1 rounded ${
                          stockInfo.cmpSuitability === 'Excellent' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          stockInfo.cmpSuitability === 'Good' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {stockInfo.cmpSuitability}
                        </span>
                      </div>
                    )}

                    {stockInfo.bestTradingSession && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Best Session</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                          {stockInfo.bestTradingSession}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Detected Patterns */}
            {stockAnalysis && stockAnalysis.patterns && stockAnalysis.patterns.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase mb-4 flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-blue-500" />
                  Detected Patterns
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {stockAnalysis.patterns.map((pattern, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border-2 ${
                      pattern.type === 'bullish' ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800' :
                      pattern.type === 'bearish' ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800' :
                      'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-bold ${
                          pattern.type === 'bullish' ? 'text-green-700 dark:text-green-300' :
                          pattern.type === 'bearish' ? 'text-red-700 dark:text-red-300' :
                          'text-yellow-700 dark:text-yellow-300'
                        }`}>
                          {pattern.name}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-white dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
                          {pattern.confidence}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{pattern.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Signals - Temporarily disabled */}
            {false && technicalData && technicalData.signals && technicalData.signals.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6 p-4">
                <div className="flex items-center mb-3">
                  <Activity className="w-5 h-5 text-blue-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Trading Signals</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {technicalData.signals.map((signal, index) => (
                    <div key={index} className={`flex items-start p-3 rounded-lg ${
                      signal.type === 'BUY' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' :
                      'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    }`}>
                      {signal.type === 'BUY' ? (
                        <TrendingUpIcon className="w-5 h-5 text-green-600 dark:text-green-400 mr-2 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold text-sm ${
                            signal.type === 'BUY' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                          }`}>{signal.type}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            {signal.indicator}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{signal.reason}</p>
                        <p className="text-xs font-semibold mt-1 text-gray-700 dark:text-gray-300">
                          Strength: {signal.strength}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

                {/* Technical Indicators */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Technical Indicators</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleIndicator('sma')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        indicators.sma
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}>
                      SMA(20)
                    </button>
                    <button
                      onClick={() => toggleIndicator('ema')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        indicators.ema
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}>
                      EMA(12)
                    </button>
                    <button
                      onClick={() => toggleIndicator('bollinger')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        indicators.bollinger
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}>
                      Bollinger Bands
                    </button>
                    <button
                      onClick={() => toggleIndicator('rsi')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        indicators.rsi
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}>
                      RSI(14)
                    </button>
                    <button
                      onClick={() => toggleIndicator('macd')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        indicators.macd
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}>
                      MACD
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
                    indicators={indicators}
                  />
                ) : (
                  <div className="flex items-center justify-center" style={{ height: '500px' }}>
                    <p className="text-gray-500 dark:text-gray-400">No chart data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* RSI & MACD Indicators - Temporarily disabled */}
            {false && technicalData && (indicators.rsi || indicators.macd) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* RSI Panel */}
                {indicators.rsi && technicalData.rsi && technicalData.rsi.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">RSI (14)</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Current RSI</span>
                        <span className={`text-2xl font-bold ${
                          technicalData.rsi[technicalData.rsi.length - 1] > 70 ? 'text-red-600 dark:text-red-400' :
                          technicalData.rsi[technicalData.rsi.length - 1] < 30 ? 'text-green-600 dark:text-green-400' :
                          'text-gray-800 dark:text-gray-100'
                        }`}>
                          {technicalData.rsi[technicalData.rsi.length - 1].toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            technicalData.rsi[technicalData.rsi.length - 1] > 70 ? 'bg-red-500' :
                            technicalData.rsi[technicalData.rsi.length - 1] < 30 ? 'bg-green-500' :
                            'bg-blue-500'
                          }`}
                          style={{ width: `${technicalData.rsi[technicalData.rsi.length - 1]}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Oversold (30)</span>
                        <span>Neutral (50)</span>
                        <span>Overbought (70)</span>
                      </div>
                      <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {technicalData.rsi[technicalData.rsi.length - 1] > 70 ? '⚠️ Overbought - Consider selling' :
                           technicalData.rsi[technicalData.rsi.length - 1] < 30 ? '💡 Oversold - Consider buying' :
                           '📊 Neutral - No strong signal'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* MACD Panel */}
                {indicators.macd && technicalData.macd && technicalData.macd.histogram && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">MACD (12,26,9)</h3>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">MACD Line</span>
                          <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                            {technicalData.macd.macd[technicalData.macd.macd.length - 1]?.toFixed(4) || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Signal Line</span>
                          <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                            {technicalData.macd.signal[technicalData.macd.signal.length - 1]?.toFixed(4) || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Histogram</span>
                        <p className={`text-2xl font-bold ${
                          technicalData.macd.histogram[technicalData.macd.histogram.length - 1] > 0 ?
                          'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {technicalData.macd.histogram[technicalData.macd.histogram.length - 1]?.toFixed(4) || 'N/A'}
                        </p>
                      </div>
                      <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {(() => {
                            const current = technicalData.macd.histogram[technicalData.macd.histogram.length - 1];
                            const previous = technicalData.macd.histogram[technicalData.macd.histogram.length - 2];
                            if (previous < 0 && current > 0) return '🚀 Bullish crossover detected!';
                            if (previous > 0 && current < 0) return '⚠️ Bearish crossover detected!';
                            if (current > 0) return '📈 Bullish momentum';
                            return '📉 Bearish momentum';
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

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
