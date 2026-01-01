// Global Stock Database - US Markets (NASDAQ + NYSE)
// Top 100 most popular and liquid stocks

export const US_STOCKS = {
  // FAANG + Magnificent 7
  tech_giants: [
    { code: 'AAPL', name: 'Apple Inc.', sector: 'Technology', market: 'NASDAQ', country: 'US' },
    { code: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', market: 'NASDAQ', country: 'US' },
    { code: 'GOOGL', name: 'Alphabet Inc. (Google)', sector: 'Technology', market: 'NASDAQ', country: 'US' },
    { code: 'AMZN', name: 'Amazon.com Inc.', sector: 'E-commerce', market: 'NASDAQ', country: 'US' },
    { code: 'META', name: 'Meta Platforms (Facebook)', sector: 'Technology', market: 'NASDAQ', country: 'US' },
    { code: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive', market: 'NASDAQ', country: 'US' },
    { code: 'NVDA', name: 'NVIDIA Corporation', sector: 'Semiconductors', market: 'NASDAQ', country: 'US' },
  ],

  // Technology & Software
  technology: [
    { code: 'ORCL', name: 'Oracle Corporation', sector: 'Software', market: 'NYSE', country: 'US' },
    { code: 'ADBE', name: 'Adobe Inc.', sector: 'Software', market: 'NASDAQ', country: 'US' },
    { code: 'CRM', name: 'Salesforce Inc.', sector: 'Software', market: 'NYSE', country: 'US' },
    { code: 'INTC', name: 'Intel Corporation', sector: 'Semiconductors', market: 'NASDAQ', country: 'US' },
    { code: 'AMD', name: 'Advanced Micro Devices', sector: 'Semiconductors', market: 'NASDAQ', country: 'US' },
    { code: 'AVGO', name: 'Broadcom Inc.', sector: 'Semiconductors', market: 'NASDAQ', country: 'US' },
    { code: 'CSCO', name: 'Cisco Systems', sector: 'Networking', market: 'NASDAQ', country: 'US' },
    { code: 'IBM', name: 'IBM', sector: 'Technology', market: 'NYSE', country: 'US' },
    { code: 'QCOM', name: 'Qualcomm Inc.', sector: 'Semiconductors', market: 'NASDAQ', country: 'US' },
  ],

  // Finance & Banking
  finance: [
    { code: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Banking', market: 'NYSE', country: 'US' },
    { code: 'BAC', name: 'Bank of America', sector: 'Banking', market: 'NYSE', country: 'US' },
    { code: 'WFC', name: 'Wells Fargo', sector: 'Banking', market: 'NYSE', country: 'US' },
    { code: 'GS', name: 'Goldman Sachs', sector: 'Investment Banking', market: 'NYSE', country: 'US' },
    { code: 'MS', name: 'Morgan Stanley', sector: 'Investment Banking', market: 'NYSE', country: 'US' },
    { code: 'V', name: 'Visa Inc.', sector: 'Financial Services', market: 'NYSE', country: 'US' },
    { code: 'MA', name: 'Mastercard Inc.', sector: 'Financial Services', market: 'NYSE', country: 'US' },
    { code: 'AXP', name: 'American Express', sector: 'Financial Services', market: 'NYSE', country: 'US' },
  ],

  // Healthcare & Pharma
  healthcare: [
    { code: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', market: 'NYSE', country: 'US' },
    { code: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare', market: 'NYSE', country: 'US' },
    { code: 'PFE', name: 'Pfizer Inc.', sector: 'Pharmaceuticals', market: 'NYSE', country: 'US' },
    { code: 'ABBV', name: 'AbbVie Inc.', sector: 'Pharmaceuticals', market: 'NYSE', country: 'US' },
    { code: 'TMO', name: 'Thermo Fisher Scientific', sector: 'Healthcare', market: 'NYSE', country: 'US' },
    { code: 'MRK', name: 'Merck & Co.', sector: 'Pharmaceuticals', market: 'NYSE', country: 'US' },
  ],

  // Consumer & Retail
  consumer: [
    { code: 'WMT', name: 'Walmart Inc.', sector: 'Retail', market: 'NYSE', country: 'US' },
    { code: 'HD', name: 'Home Depot', sector: 'Retail', market: 'NYSE', country: 'US' },
    { code: 'NKE', name: 'Nike Inc.', sector: 'Apparel', market: 'NYSE', country: 'US' },
    { code: 'MCD', name: "McDonald's Corporation", sector: 'Restaurants', market: 'NYSE', country: 'US' },
    { code: 'SBUX', name: 'Starbucks Corporation', sector: 'Restaurants', market: 'NASDAQ', country: 'US' },
    { code: 'KO', name: 'Coca-Cola Company', sector: 'Beverages', market: 'NYSE', country: 'US' },
    { code: 'PEP', name: 'PepsiCo Inc.', sector: 'Beverages', market: 'NASDAQ', country: 'US' },
    { code: 'COST', name: 'Costco Wholesale', sector: 'Retail', market: 'NASDAQ', country: 'US' },
    { code: 'TGT', name: 'Target Corporation', sector: 'Retail', market: 'NYSE', country: 'US' },
  ],

  // Entertainment & Media
  media: [
    { code: 'DIS', name: 'Walt Disney Company', sector: 'Entertainment', market: 'NYSE', country: 'US' },
    { code: 'NFLX', name: 'Netflix Inc.', sector: 'Streaming', market: 'NASDAQ', country: 'US' },
    { code: 'CMCSA', name: 'Comcast Corporation', sector: 'Media', market: 'NASDAQ', country: 'US' },
  ],

  // Energy
  energy: [
    { code: 'XOM', name: 'Exxon Mobil', sector: 'Oil & Gas', market: 'NYSE', country: 'US' },
    { code: 'CVX', name: 'Chevron Corporation', sector: 'Oil & Gas', market: 'NYSE', country: 'US' },
  ],

  // Industrial
  industrial: [
    { code: 'BA', name: 'Boeing Company', sector: 'Aerospace', market: 'NYSE', country: 'US' },
    { code: 'CAT', name: 'Caterpillar Inc.', sector: 'Machinery', market: 'NYSE', country: 'US' },
    { code: 'GE', name: 'General Electric', sector: 'Conglomerate', market: 'NYSE', country: 'US' },
  ],

  // Telecom
  telecom: [
    { code: 'T', name: 'AT&T Inc.', sector: 'Telecommunications', market: 'NYSE', country: 'US' },
    { code: 'VZ', name: 'Verizon Communications', sector: 'Telecommunications', market: 'NYSE', country: 'US' },
  ],

  // EV & Clean Energy
  ev_energy: [
    { code: 'TSLA', name: 'Tesla Inc.', sector: 'Electric Vehicles', market: 'NASDAQ', country: 'US' },
    { code: 'RIVN', name: 'Rivian Automotive', sector: 'Electric Vehicles', market: 'NASDAQ', country: 'US' },
    { code: 'LCID', name: 'Lucid Group', sector: 'Electric Vehicles', market: 'NASDAQ', country: 'US' },
  ],

  // Crypto & Fintech
  fintech: [
    { code: 'PYPL', name: 'PayPal Holdings', sector: 'Fintech', market: 'NASDAQ', country: 'US' },
    { code: 'SQ', name: 'Block Inc. (Square)', sector: 'Fintech', market: 'NYSE', country: 'US' },
    { code: 'COIN', name: 'Coinbase Global', sector: 'Cryptocurrency', market: 'NASDAQ', country: 'US' },
  ],

  // Semiconductors
  semiconductors: [
    { code: 'TSM', name: 'Taiwan Semiconductor', sector: 'Semiconductors', market: 'NYSE', country: 'Taiwan' },
    { code: 'ASML', name: 'ASML Holding', sector: 'Semiconductors', market: 'NASDAQ', country: 'Netherlands' },
  ],

  // AI & Cloud
  ai_cloud: [
    { code: 'NVDA', name: 'NVIDIA Corporation', sector: 'AI/GPU', market: 'NASDAQ', country: 'US' },
    { code: 'AMD', name: 'Advanced Micro Devices', sector: 'AI/Processors', market: 'NASDAQ', country: 'US' },
    { code: 'PLTR', name: 'Palantir Technologies', sector: 'AI/Software', market: 'NYSE', country: 'US' },
  ]
};

// Get all US stocks as flat array
export const getAllUSStocks = () => {
  return [
    ...US_STOCKS.tech_giants,
    ...US_STOCKS.technology,
    ...US_STOCKS.finance,
    ...US_STOCKS.healthcare,
    ...US_STOCKS.consumer,
    ...US_STOCKS.media,
    ...US_STOCKS.energy,
    ...US_STOCKS.industrial,
    ...US_STOCKS.telecom,
    ...US_STOCKS.ev_energy,
    ...US_STOCKS.fintech,
    ...US_STOCKS.semiconductors,
    ...US_STOCKS.ai_cloud,
  ];
};

// Get US stock by code
export const getUSStockByCode = (code) => {
  return getAllUSStocks().find(stock => stock.code === code);
};

// Default US watchlist
export const DEFAULT_US_WATCHLIST = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META',
  'JPM', 'V', 'WMT', 'DIS', 'NFLX', 'PYPL', 'COIN'
];

export default {
  US_STOCKS,
  getAllUSStocks,
  getUSStockByCode,
  DEFAULT_US_WATCHLIST
};
