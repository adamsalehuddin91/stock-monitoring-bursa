// Yahoo Finance API Service for Real-time Stock Data
// Use Vite proxy in development to bypass CORS
const YAHOO_BASE_URL = import.meta.env.DEV
  ? '/api/yahoo/v8/finance/chart'
  : 'https://query1.finance.yahoo.com/v8/finance/chart';

import { getAllStocks } from '../data/malaysianStocks';

// ===== CACHE SYSTEM to avoid rate limiting =====
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`✅ Cache HIT for ${key}`);
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// ===== REQUEST HEADERS to avoid 429 errors =====
const fetchOptions = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'application/json',
  }
};

// ===== REQUEST DELAY to avoid hammering API =====
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // 100ms between requests

const throttledFetch = async (url) => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await delay(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
  }

  lastRequestTime = Date.now();
  return fetch(url, fetchOptions);
};

// Generate stock symbols mapping from database (Yahoo Finance format: CODE.KL)
const generateStockSymbols = () => {
  const allStocks = getAllStocks();
  const symbols = {};
  allStocks.forEach(stock => {
    symbols[stock.code] = `${stock.code}.KL`;
  });
  return symbols;
};

export const STOCK_SYMBOLS = generateStockSymbols();

// Fallback dummy data
const getDummyStockData = (stockCode) => {
  const basePrice = Math.random() * 20 + 2;
  const change = (Math.random() - 0.5) * 0.5;
  return {
    code: stockCode,
    name: getStockName(stockCode),
    price: basePrice,
    change: change,
    changePercent: (change / basePrice) * 100,
    volume: Math.random() * 10,
    high: basePrice + Math.random() * 0.5,
    low: basePrice - Math.random() * 0.5,
    prevClose: basePrice - change,
    timestamp: Date.now(),
    isDummy: true
  };
};

// Fetch real-time data for a single stock from Yahoo Finance
export const fetchStockData = async (stockCode) => {
  const symbol = STOCK_SYMBOLS[stockCode];
  if (!symbol) {
    console.warn(`Stock code ${stockCode} not found, using dummy data`);
    return getDummyStockData(stockCode);
  }

  // Check cache first
  const cacheKey = `stock-${stockCode}`;
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const url = `${YAHOO_BASE_URL}/${symbol}?interval=1d&range=1d`;
    console.log(`🔍 Fetching Yahoo Finance: ${url}`);

    const response = await throttledFetch(url);

    if (!response.ok) {
      console.error(`Yahoo API error: ${response.status} for ${symbol}`);
      if (response.status === 429) {
        console.warn('⚠️ Rate limited! Using dummy data.');
      } else if (response.status === 404) {
        console.warn(`⚠️ Stock ${symbol} not found on Yahoo Finance. Using dummy data.`);
      }
      // Cache the dummy data to prevent retries
      const dummyData = getDummyStockData(stockCode);
      setCachedData(cacheKey, dummyData);
      return dummyData;
    }

    const data = await response.json();

    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      console.error(`No data returned for ${symbol}`);
      return getDummyStockData(stockCode);
    }

    const result = data.chart.result[0];
    const quote = result.indicators.quote[0];
    const meta = result.meta;

    const currentPrice = meta.regularMarketPrice || quote.close[quote.close.length - 1];
    const previousClose = meta.previousClose || meta.chartPreviousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

    console.log(`Yahoo data for ${symbol}:`, {
      price: currentPrice,
      change: change,
      changePercent: changePercent
    });

    const stockData = {
      code: stockCode,
      name: getStockName(stockCode),
      price: parseFloat(currentPrice) || 0,
      change: parseFloat(change) || 0,
      changePercent: parseFloat(changePercent) || 0,
      volume: parseFloat(meta.regularMarketVolume) / 1000000 || 0,
      high: parseFloat(meta.regularMarketDayHigh) || 0,
      low: parseFloat(meta.regularMarketDayLow) || 0,
      prevClose: parseFloat(previousClose) || 0,
      timestamp: meta.regularMarketTime || Date.now()
    };

    // Cache the result
    setCachedData(cacheKey, stockData);
    return stockData;
  } catch (error) {
    console.error(`Error fetching Yahoo data for ${stockCode}:`, error);
    return getDummyStockData(stockCode);
  }
};

// Fetch data for multiple stocks
export const fetchMultipleStocks = async (stockCodes) => {
  try {
    const promises = stockCodes.map(code => fetchStockData(code));
    const results = await Promise.allSettled(promises);

    return results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
  } catch (error) {
    console.error('Error fetching multiple stocks:', error);
    throw error;
  }
};

// Fetch KLCI Index data from Yahoo Finance
export const fetchKLCIIndex = async () => {
  // Check cache first
  const cacheKey = 'klci-index';
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const symbol = '^KLSE'; // KLCI index symbol on Yahoo Finance
    const url = `${YAHOO_BASE_URL}/${symbol}?interval=1d&range=1d`;
    console.log(`📈 Fetching KLCI from Yahoo: ${url}`);

    const response = await throttledFetch(url);

    if (!response.ok) {
      console.error(`KLCI Yahoo API error: ${response.status}`);
      if (response.status === 429) {
        console.warn('⚠️ Rate limited! Using dummy KLCI.');
      }
      return {
        value: 1545 + (Math.random() - 0.5) * 10,
        change: (Math.random() - 0.5) * 5,
        changePercent: (Math.random() - 0.5) * 0.5,
        timestamp: Date.now(),
        isDummy: true
      };
    }

    const data = await response.json();

    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      console.error('No KLCI data returned');
      return {
        value: 1545 + (Math.random() - 0.5) * 10,
        change: (Math.random() - 0.5) * 5,
        changePercent: (Math.random() - 0.5) * 0.5,
        timestamp: Date.now(),
        isDummy: true
      };
    }

    const result = data.chart.result[0];
    const meta = result.meta;

    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.previousClose || meta.chartPreviousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

    console.log('KLCI Yahoo data:', {
      value: currentPrice,
      change: change,
      changePercent: changePercent
    });

    const klciData = {
      value: parseFloat(currentPrice) || 0,
      change: parseFloat(change) || 0,
      changePercent: parseFloat(changePercent) || 0,
      timestamp: meta.regularMarketTime || Date.now()
    };

    // Cache the result
    setCachedData(cacheKey, klciData);
    return klciData;
  } catch (error) {
    console.error('Error fetching KLCI from Yahoo:', error);
    return {
      value: 1545 + (Math.random() - 0.5) * 10,
      change: (Math.random() - 0.5) * 5,
      changePercent: (Math.random() - 0.5) * 0.5,
      timestamp: Date.now(),
      isDummy: true
    };
  }
};

// Helper function to get stock name from code
const getStockName = (code) => {
  const allStocks = getAllStocks();
  const stock = allStocks.find(s => s.code === code);
  return stock ? stock.name : 'UNKNOWN';
};

// Fetch historical data for charts (OHLCV)
export const fetchHistoricalData = async (stockCode, range = '1mo', interval = '1d') => {
  const symbol = STOCK_SYMBOLS[stockCode];
  if (!symbol) {
    console.warn(`Stock code ${stockCode} not found`);
    return null;
  }

  // Check cache first
  const cacheKey = `hist-${stockCode}-${range}-${interval}`;
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    // Range options: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
    // Interval options: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo
    const url = `${YAHOO_BASE_URL}/${symbol}?interval=${interval}&range=${range}`;
    console.log(`📊 Fetching historical data: ${url}`);

    const response = await throttledFetch(url);

    if (!response.ok) {
      console.error(`Yahoo API error: ${response.status} for ${symbol}`);
      if (response.status === 429) {
        console.warn('⚠️ Rate limited! Skipping historical data.');
      } else if (response.status === 404) {
        console.warn(`⚠️ Stock ${symbol} not found on Yahoo Finance. No chart data.`);
        // Cache null result to prevent retries
        setCachedData(cacheKey, null);
      }
      return null;
    }

    const data = await response.json();

    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      console.error(`No historical data returned for ${symbol}`);
      return null;
    }

    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const quote = result.indicators.quote[0];

    // Convert to candlestick format for TradingView
    const candles = timestamps.map((timestamp, index) => ({
      time: timestamp,
      open: quote.open[index] || 0,
      high: quote.high[index] || 0,
      low: quote.low[index] || 0,
      close: quote.close[index] || 0,
      volume: quote.volume[index] || 0
    })).filter(candle => candle.close > 0); // Remove null entries

    console.log(`Fetched ${candles.length} candles for ${stockCode}`);

    const histData = {
      code: stockCode,
      name: getStockName(stockCode),
      candles: candles,
      meta: {
        currency: result.meta.currency || 'MYR',
        symbol: symbol,
        range: range,
        interval: interval
      }
    };

    // Cache the result
    setCachedData(cacheKey, histData);
    return histData;
  } catch (error) {
    console.error(`Error fetching historical data for ${stockCode}:`, error);
    return null;
  }
};

export default {
  fetchStockData,
  fetchMultipleStocks,
  fetchKLCIIndex,
  fetchHistoricalData,
  STOCK_SYMBOLS
};
