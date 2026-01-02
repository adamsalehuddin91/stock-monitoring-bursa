// Stock Utility Functions

// Generate Google Finance URL for a stock
export const getGoogleFinanceUrl = (stockCode, market = 'MY') => {
  if (market === 'US') {
    // US stocks: https://www.google.com/finance/quote/AAPL:NASDAQ
    return `https://www.google.com/finance/quote/${stockCode}:NASDAQ`;
  } else {
    // Malaysian stocks: https://www.google.com/finance/quote/1155:KLSE
    return `https://www.google.com/finance/quote/${stockCode}:KLSE`;
  }
};

// Generate Yahoo Finance URL for a stock
export const getYahooFinanceUrl = (stockCode, market = 'MY') => {
  if (market === 'US') {
    return `https://finance.yahoo.com/quote/${stockCode}`;
  } else {
    return `https://finance.yahoo.com/quote/${stockCode}.KL`;
  }
};

// Generate TradingView URL for a stock
export const getTradingViewUrl = (stockCode, market = 'MY') => {
  if (market === 'US') {
    return `https://www.tradingview.com/symbols/${stockCode}`;
  } else {
    return `https://www.tradingview.com/symbols/MYX-${stockCode}`;
  }
};

// Detect market from stock code
export const detectMarket = (stockCode) => {
  // Malaysian stocks are numeric (e.g., 1155, 5347)
  // US stocks are alphabetic (e.g., AAPL, MSFT)
  return /^\d+$/.test(stockCode) ? 'MY' : 'US';
};

// Format currency based on market
export const formatCurrency = (value, market = 'MY') => {
  const symbol = market === 'US' ? '$' : 'RM';
  return `${symbol}${value.toFixed(2)}`;
};

// Get market flag emoji
export const getMarketFlag = (market) => {
  return market === 'US' ? '🇺🇸' : '🇲🇾';
};

// Get market name
export const getMarketName = (market) => {
  const marketNames = {
    'US': 'US Markets',
    'MY': 'Bursa Malaysia',
    'BURSA': 'Bursa Malaysia',
    'GLOBAL': 'Global Markets'
  };
  return marketNames[market] || market;
};

export default {
  getGoogleFinanceUrl,
  getYahooFinanceUrl,
  getTradingViewUrl,
  detectMarket,
  formatCurrency,
  getMarketFlag,
  getMarketName
};
