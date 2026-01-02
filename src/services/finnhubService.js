// Finnhub API Service - Real-time financial news and sentiment
// Free API: https://finnhub.io/register
// Docs: https://finnhub.io/docs/api

// API Key - Get free key from https://finnhub.io/register
// Add to .env.local as: VITE_FINNHUB_API_KEY=your_key_here
const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY || 'demo';
const BASE_URL = 'https://finnhub.io/api/v1';

// Fetch market news from Finnhub
export const fetchFinnhubMarketNews = async (category = 'general') => {
  try {
    const response = await fetch(
      `${BASE_URL}/news?category=${category}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const newsData = await response.json();

    // Transform to our news format
    return newsData.slice(0, 10).map((article, index) => ({
      id: `finnhub-market-${article.id || index}`,
      category: mapFinnhubCategory(article.category),
      title: article.headline,
      summary: article.summary || article.headline,
      source: article.source,
      time: getTimeAgo(article.datetime * 1000),
      url: article.url,
      timestamp: article.datetime * 1000,
      sentiment: article.sentiment || 'neutral',
      image: article.image,
      stocks: []
    }));
  } catch (error) {
    console.error('Error fetching Finnhub market news:', error);
    return [];
  }
};

// Fetch company-specific news
export const fetchFinnhubCompanyNews = async (symbol, fromDate, toDate) => {
  try {
    const from = fromDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const to = toDate || new Date().toISOString().split('T')[0];

    const response = await fetch(
      `${BASE_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const newsData = await response.json();

    return newsData.slice(0, 5).map((article, index) => ({
      id: `finnhub-${symbol}-${article.id || index}`,
      category: 'company',
      title: article.headline,
      summary: article.summary || article.headline,
      source: article.source,
      time: getTimeAgo(article.datetime * 1000),
      url: article.url,
      timestamp: article.datetime * 1000,
      sentiment: article.sentiment || 'neutral',
      image: article.image,
      stocks: [symbol]
    }));
  } catch (error) {
    console.error(`Error fetching Finnhub news for ${symbol}:`, error);
    return [];
  }
};

// Fetch news sentiment for a stock
export const fetchFinnhubSentiment = async (symbol) => {
  try {
    const response = await fetch(
      `${BASE_URL}/news-sentiment?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();

    // Finnhub sentiment scores: -1 (bearish) to 1 (bullish)
    return {
      symbol,
      sentiment: data.sentiment,
      score: data.companyNewsScore || 0,
      buzz: data.buzz || {},
      classification: classifySentiment(data.companyNewsScore || 0)
    };
  } catch (error) {
    console.error(`Error fetching sentiment for ${symbol}:`, error);
    return { symbol, sentiment: 0, classification: 'neutral' };
  }
};

// Fetch real-time news for multiple stocks
export const fetchFinnhubNewsForWatchlist = async (stockCodes) => {
  try {
    // Limit to prevent rate limiting (free tier: 60 calls/min)
    const limitedCodes = stockCodes.slice(0, 5);

    const newsPromises = limitedCodes.map(code =>
      fetchFinnhubCompanyNews(code)
    );

    const newsArrays = await Promise.all(newsPromises);
    const allNews = newsArrays.flat();

    // Sort by timestamp (newest first)
    return allNews.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error fetching watchlist news:', error);
    return [];
  }
};

// Helper: Map Finnhub categories to our categories
const mapFinnhubCategory = (category) => {
  const categoryMap = {
    'general': 'market',
    'forex': 'market',
    'crypto': 'crypto',
    'merger': 'market',
    'technology': 'tech',
    'energy': 'energy',
    'finance': 'banking'
  };
  return categoryMap[category] || 'market';
};

// Helper: Classify sentiment score
const classifySentiment = (score) => {
  if (score > 0.15) return 'bullish';
  if (score < -0.15) return 'bearish';
  return 'neutral';
};

// Helper: Format time ago
const getTimeAgo = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

  return new Date(timestamp).toLocaleDateString();
};

// Check if API key is configured
export const isFinnhubConfigured = () => {
  return FINNHUB_API_KEY && FINNHUB_API_KEY !== 'demo';
};

export default {
  fetchFinnhubMarketNews,
  fetchFinnhubCompanyNews,
  fetchFinnhubSentiment,
  fetchFinnhubNewsForWatchlist,
  isFinnhubConfigured
};
