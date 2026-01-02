import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, TrendingUp, Loader2, Filter, RefreshCw } from 'lucide-react';

import Sidebar from '../partials/StockSidebar';
import Header from '../partials/Header';
import { fetchFinancialNews, filterNewsByStocks } from '../services/newsService';
import { getStockByCode } from '../data/malaysianStocks';
import { getUSStockByCode } from '../data/globalStocks';

function News() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [category, setCategory] = useState('all');
  const [newsArticles, setNewsArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
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

  // Fetch news
  const fetchNews = async () => {
    try {
      setLoading(true);
      const articles = await fetchFinancialNews();
      setNewsArticles(articles);
      setLastUpdated(Date.now());
    } catch (err) {
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNews();
    setWatchlistCodes(getWatchlistCodes());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    fetchNews();
    // Refresh news every 2 minutes (faster updates)
    const timer = setInterval(fetchNews, 120000);
    return () => clearInterval(timer);
  }, []);

  // Listen for market changes
  useEffect(() => {
    const handleStorageChange = () => {
      setWatchlistCodes(getWatchlistCodes());
      fetchNews();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const quickLinks = [
    { name: 'Bursa Malaysia', url: 'https://www.bursamalaysia.com' },
    { name: 'The Edge Markets', url: 'https://www.theedgemarkets.com' },
    { name: 'Investing.com', url: 'https://www.investing.com' },
    { name: 'TradingView', url: 'https://www.tradingview.com' }
  ];

  // Helper to get stock from either Malaysian or US database
  const getStock = (code) => {
    const malaysianStock = getStockByCode(code);
    if (malaysianStock) return malaysianStock;
    const usStock = getUSStockByCode(code);
    return usStock;
  };

  let filteredNews = category === 'all'
    ? newsArticles
    : newsArticles.filter(news => news.category === category);

  // Filter by watchlist if enabled
  if (showWatchlistOnly && watchlistCodes.length > 0) {
    filteredNews = filterNewsByStocks(filteredNews, watchlistCodes);
  }

  // Format last updated time
  const getLastUpdatedText = () => {
    if (!lastUpdated) return '';
    const seconds = Math.floor((Date.now() - lastUpdated) / 1000);
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
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
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Market News</h1>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Latest updates from financial markets</p>
                  {lastUpdated && (
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      • Updated {getLastUpdatedText()}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh News
              </button>
            </div>

            <div className="grid grid-cols-12 gap-6">

              {/* Main News Feed */}
              <div className="col-span-12 lg:col-span-8">

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {['all', 'market', 'banking', 'energy', 'tech', 'streaming', 'retail', 'fintech', 'travel', 'global'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${category === cat ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Watchlist Filter */}
                {watchlistCodes.length > 0 && (
                  <div className="flex items-center gap-2 mb-6 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                    <button
                      onClick={() => setShowWatchlistOnly(!showWatchlistOnly)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${showWatchlistOnly ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                      <Filter className="w-4 h-4" />
                      My Watchlist Only
                    </button>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {showWatchlistOnly ? `Showing news for ${watchlistCodes.length} stocks` : 'Show all news'}
                    </span>
                  </div>
                )}

                {/* Loading State */}
                {loading && newsArticles.length === 0 && (
                  <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-12 text-center">
                    <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600 dark:text-gray-400">Loading latest market news...</p>
                  </div>
                )}

                {/* News Articles */}
                {!loading && (
                  <div className="space-y-4">
                    {filteredNews.map((article) => (
                    <div
                      key={article.id}
                      className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex gap-2">
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full capitalize">
                            {article.category}
                          </span>
                          {article.sentiment === 'bullish' && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full">
                              📈 Bullish
                            </span>
                          )}
                          {article.sentiment === 'bearish' && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full">
                              📉 Bearish
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-500">{article.time}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                        {article.title}
                      </h3>

                      {/* Stock Mentions */}
                      {article.stocks && article.stocks.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {article.stocks.map(stockCode => {
                            const stock = getStock(stockCode);
                            return stock ? (
                              <span
                                key={stockCode}
                                className="inline-flex px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">
                                {stock.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{article.summary}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-500">{article.source}</span>
                        <a
                          href={article.url}
                          className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                          Read More
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    </div>
                    ))}
                  </div>
                )}

                {!loading && filteredNews.length === 0 && (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                    <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">No news articles available</p>
                  </div>
                )}

              </div>

              {/* Sidebar */}
              <div className="col-span-12 lg:col-span-4">

                {/* Quick Access Links */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Quick Access</h3>
                  <div className="space-y-2">
                    {quickLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{link.name}</span>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Stocks in the News - Trading Opportunities */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Stocks in the News
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Stocks dengan news impact hari ni:</p>

                  <div className="space-y-2">
                    {(() => {
                      // Count how many news mention each stock
                      const stockMentions = {};
                      newsArticles.forEach(article => {
                        if (article.stocks) {
                          article.stocks.forEach(code => {
                            stockMentions[code] = (stockMentions[code] || 0) + 1;
                          });
                        }
                      });

                      // Sort by most mentioned
                      const topStocks = Object.entries(stockMentions)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 8);

                      return topStocks.map(([code, count]) => {
                        const stock = getStock(code);
                        if (!stock) return null;

                        return (
                          <div key={code} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/20 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer">
                            <div>
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{stock.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">{code}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                                {count} news
                              </span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                    <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                      💡 Tip: Stocks dengan multiple news = higher trading activity
                    </p>
                  </div>
                </div>

                {/* Market Insights */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Market Sentiment</h3>
                  <div className="space-y-3">
                    <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-500 uppercase mb-1">Overall Tone</p>
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">Bullish</p>
                    </div>
                    <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-500 uppercase mb-1">Hot Sectors</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Banking, Energy</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-500 uppercase mb-1">News Count</p>
                      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{newsArticles.length} articles</p>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </main>

      </div>
    </div>
  );
}

export default News;
