// Asset universe for the four TradeRadar sentiment modules.
// Each symbol carries its data source so the adapter routes it correctly.
// Bursa watchlist symbols are defaults — override live via the Supabase
// `traderadar_watchlist` table when you want a different set.

export const MODULES = {
  // FCPO delegates to the existing commodity engine (CPO=F proxy + ZL=F + USDMYR).
  fcpo: {
    label: 'FCPO', emoji: '🌴',
    driver: 'commodity', commodityKey: 'fcpo',
  },

  global: {
    label: 'Global Market', emoji: '🌍', driver: 'basket',
    symbols: [
      { ticker: '^GSPC', name: 'S&P 500', source: 'yahoo', role: 'index' },
      { ticker: '^IXIC', name: 'Nasdaq', source: 'yahoo', role: 'index' },
      { ticker: '^VIX', name: 'VIX', source: 'yahoo', role: 'risk', invert: true }, // high VIX = risk-off
      { ticker: 'DX-Y.NYB', name: 'US Dollar Index', source: 'yahoo', role: 'macro' },
      { ticker: 'CL=F', name: 'Crude Oil', source: 'yahoo', role: 'commodity' },
      { ticker: 'GC=F', name: 'Gold', source: 'yahoo', role: 'commodity' },
    ],
  },

  // Bursa = manual watchlist, EOD/delayed via Yahoo `.KL` (real-time needs a paid feed).
  bursa: {
    label: 'Bursa Malaysia', emoji: '🇲🇾', driver: 'basket',
    symbols: [
      { ticker: '1155.KL', name: 'Maybank', source: 'yahoo', role: 'stock', sector: 'Finance' },
      { ticker: '1023.KL', name: 'CIMB', source: 'yahoo', role: 'stock', sector: 'Finance' },
      { ticker: '5347.KL', name: 'Tenaga Nasional', source: 'yahoo', role: 'stock', sector: 'Utilities' },
      { ticker: '5183.KL', name: 'Petronas Chemicals', source: 'yahoo', role: 'stock', sector: 'Energy' },
      { ticker: '6947.KL', name: 'CelcomDigi', source: 'yahoo', role: 'stock', sector: 'Telco' },
    ],
  },

  crypto: {
    label: 'Crypto', emoji: '₿', driver: 'basket',
    symbols: [
      { ticker: 'BTCUSDT', name: 'Bitcoin', source: 'binance', role: 'major' },
      { ticker: 'ETHUSDT', name: 'Ethereum', source: 'binance', role: 'major' },
      { ticker: 'SOLUSDT', name: 'Solana', source: 'binance', role: 'alt' },
      { ticker: 'BNBUSDT', name: 'BNB', source: 'binance', role: 'alt' },
    ],
  },
}

export const MODULE_KEYS = Object.keys(MODULES)
