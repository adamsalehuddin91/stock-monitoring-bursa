// Global Stock Database - US Markets (NASDAQ + NYSE)
// Top 100 most popular and liquid stocks

export const US_STOCKS = {
  // FAANG + Magnificent 7 (ENHANCED with Trading Metadata)
  tech_giants: [
    {
      code: 'AAPL', name: 'Apple Inc.', sector: 'Technology', market: 'NASDAQ', country: 'US',
      marketCap: 'Mega', avgVolume: 55000000, volatility: 'Medium', beta: 1.20, liquidity: 'Extreme',
      dividendYield: 0.5, peRatio: 29.5, analystRating: 'Buy',
      esgRating: 'A', tradingStyle: ['Growth', 'Quality', 'Tech Leader'],
      cmpSuitability: 'Excellent', bestTradingSession: 'NY', watchlistPriority: 'Critical'
    },
    {
      code: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', market: 'NASDAQ', country: 'US',
      marketCap: 'Mega', avgVolume: 28000000, volatility: 'Medium', beta: 0.90, liquidity: 'Extreme',
      dividendYield: 0.8, peRatio: 35.2, analystRating: 'Buy',
      esgRating: 'A', tradingStyle: ['Growth', 'Quality', 'AI Leader'],
      cmpSuitability: 'Excellent', bestTradingSession: 'NY', watchlistPriority: 'Critical'
    },
    {
      code: 'GOOGL', name: 'Alphabet Inc. (Google)', sector: 'Technology', market: 'NASDAQ', country: 'US',
      marketCap: 'Mega', avgVolume: 22000000, volatility: 'Medium', beta: 1.05, liquidity: 'Extreme',
      dividendYield: 0.0, peRatio: 24.5, analystRating: 'Buy',
      esgRating: 'A', tradingStyle: ['Growth', 'Tech', 'AI'],
      cmpSuitability: 'Excellent', bestTradingSession: 'NY', watchlistPriority: 'Critical'
    },
    {
      code: 'AMZN', name: 'Amazon.com Inc.', sector: 'E-commerce', market: 'NASDAQ', country: 'US',
      marketCap: 'Mega', avgVolume: 45000000, volatility: 'High', beta: 1.15, liquidity: 'Extreme',
      dividendYield: 0.0, peRatio: 48.5, analystRating: 'Buy',
      esgRating: 'B', tradingStyle: ['Growth', 'E-commerce', 'Cloud'],
      cmpSuitability: 'Good', bestTradingSession: 'NY', watchlistPriority: 'Critical'
    },
    {
      code: 'META', name: 'Meta Platforms (Facebook)', sector: 'Technology', market: 'NASDAQ', country: 'US',
      marketCap: 'Mega', avgVolume: 18000000, volatility: 'High', beta: 1.28, liquidity: 'Extreme',
      dividendYield: 0.4, peRatio: 26.8, analystRating: 'Buy',
      esgRating: 'C', tradingStyle: ['Growth', 'Social Media', 'AI'],
      cmpSuitability: 'Good', bestTradingSession: 'NY', watchlistPriority: 'High'
    },
    {
      code: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive', market: 'NASDAQ', country: 'US',
      marketCap: 'Mega', avgVolume: 95000000, volatility: 'Extreme', beta: 2.05, liquidity: 'Extreme',
      dividendYield: 0.0, peRatio: 65.5, analystRating: 'Hold',
      esgRating: 'B', tradingStyle: ['Growth', 'EV', 'Speculative', 'Momentum'],
      cmpSuitability: 'Poor', bestTradingSession: 'NY', watchlistPriority: 'Medium'
    },
    {
      code: 'NVDA', name: 'NVIDIA Corporation', sector: 'Semiconductors', market: 'NASDAQ', country: 'US',
      marketCap: 'Mega', avgVolume: 42000000, volatility: 'High', beta: 1.65, liquidity: 'Extreme',
      dividendYield: 0.03, peRatio: 55.2, analystRating: 'Buy',
      esgRating: 'A', tradingStyle: ['Growth', 'AI', 'Semiconductors', 'Momentum'],
      cmpSuitability: 'Fair', bestTradingSession: 'NY', watchlistPriority: 'Critical'
    },
  ],

  // Technology & Software (ENHANCED - Top performers only)
  technology: [
    {
      code: 'ORCL', name: 'Oracle Corporation', sector: 'Software', market: 'NYSE', country: 'US',
      marketCap: 'Mega', avgVolume: 8500000, volatility: 'Medium', beta: 0.85, liquidity: 'High',
      dividendYield: 1.2, peRatio: 32.5, analystRating: 'Buy',
      esgRating: 'B', tradingStyle: ['Value', 'Enterprise', 'Cloud'],
      cmpSuitability: 'Good', bestTradingSession: 'NY', watchlistPriority: 'High'
    },
    {
      code: 'AMD', name: 'Advanced Micro Devices', sector: 'Semiconductors', market: 'NASDAQ', country: 'US',
      marketCap: 'Large', avgVolume: 75000000, volatility: 'High', beta: 1.85, liquidity: 'Extreme',
      dividendYield: 0.0, peRatio: 42.5, analystRating: 'Buy',
      esgRating: 'A', tradingStyle: ['Growth', 'AI', 'Momentum', 'Semiconductors'],
      cmpSuitability: 'Fair', bestTradingSession: 'NY', watchlistPriority: 'Critical'
    },
    {
      code: 'INTC', name: 'Intel Corporation', sector: 'Semiconductors', market: 'NASDAQ', country: 'US',
      marketCap: 'Large', avgVolume: 52000000, volatility: 'High', beta: 1.15, liquidity: 'Extreme',
      dividendYield: 1.8, peRatio: 18.5, analystRating: 'Hold',
      esgRating: 'B', tradingStyle: ['Value', 'Turnaround', 'Dividend'],
      cmpSuitability: 'Good', bestTradingSession: 'NY', watchlistPriority: 'Medium'
    },
    {
      code: 'AVGO', name: 'Broadcom Inc.', sector: 'Semiconductors', market: 'NASDAQ', country: 'US',
      marketCap: 'Mega', avgVolume: 2800000, volatility: 'Medium', beta: 1.05, liquidity: 'High',
      dividendYield: 1.9, peRatio: 35.8, analystRating: 'Buy',
      esgRating: 'A', tradingStyle: ['Growth', 'Quality', 'Dividend'],
      cmpSuitability: 'Excellent', bestTradingSession: 'NY', watchlistPriority: 'High'
    },
    {
      code: 'QCOM', name: 'Qualcomm Inc.', sector: 'Semiconductors', market: 'NASDAQ', country: 'US',
      marketCap: 'Large', avgVolume: 8500000, volatility: 'Medium', beta: 1.25, liquidity: 'High',
      dividendYield: 2.1, peRatio: 22.5, analystRating: 'Buy',
      esgRating: 'A', tradingStyle: ['Growth', '5G', 'Dividend'],
      cmpSuitability: 'Excellent', bestTradingSession: 'NY', watchlistPriority: 'High'
    },
    {
      code: 'PLTR', name: 'Palantir Technologies', sector: 'AI/Software', market: 'NYSE', country: 'US',
      marketCap: 'Large', avgVolume: 45000000, volatility: 'Extreme', beta: 2.15, liquidity: 'Extreme',
      dividendYield: 0.0, peRatio: 95.5, analystRating: 'Hold',
      esgRating: 'C', tradingStyle: ['Growth', 'AI', 'Speculative', 'Momentum'],
      cmpSuitability: 'Poor', bestTradingSession: 'NY', watchlistPriority: 'Medium'
    },
    {
      code: 'AI', name: 'C3.ai Inc.', sector: 'AI/Software', market: 'NYSE', country: 'US',
      marketCap: 'Small', avgVolume: 5800000, volatility: 'Extreme', beta: 2.45, liquidity: 'High',
      dividendYield: 0.0, peRatio: -15.0, analystRating: 'Hold',
      esgRating: 'B', tradingStyle: ['Growth', 'AI', 'Speculative', 'High Risk'],
      cmpSuitability: 'Poor', bestTradingSession: 'NY', watchlistPriority: 'Low'
    },
    {
      code: 'UBER', name: 'Uber Technologies', sector: 'Technology', market: 'NYSE', country: 'US',
      marketCap: 'Large', avgVolume: 28000000, volatility: 'High', beta: 1.55, liquidity: 'Extreme',
      dividendYield: 0.0, peRatio: 38.5, analystRating: 'Buy',
      esgRating: 'C', tradingStyle: ['Growth', 'Gig Economy', 'Transportation'],
      cmpSuitability: 'Fair', bestTradingSession: 'NY', watchlistPriority: 'Medium'
    },
    {
      code: 'SHOP', name: 'Shopify Inc.', sector: 'E-commerce', market: 'NYSE', country: 'US',
      marketCap: 'Large', avgVolume: 8500000, volatility: 'High', beta: 1.65, liquidity: 'High',
      dividendYield: 0.0, peRatio: 68.5, analystRating: 'Buy',
      esgRating: 'B', tradingStyle: ['Growth', 'E-commerce', 'SMB'],
      cmpSuitability: 'Fair', bestTradingSession: 'NY', watchlistPriority: 'High'
    },
    {
      code: 'SPOT', name: 'Spotify Technology', sector: 'Streaming', market: 'NYSE', country: 'US',
      marketCap: 'Large', avgVolume: 2200000, volatility: 'High', beta: 1.45, liquidity: 'Medium',
      dividendYield: 0.0, peRatio: 125.0, analystRating: 'Hold',
      esgRating: 'B', tradingStyle: ['Growth', 'Streaming', 'Media'],
      cmpSuitability: 'Fair', bestTradingSession: 'NY', watchlistPriority: 'Medium'
    },
    { code: 'ADBE', name: 'Adobe Inc.', sector: 'Software', market: 'NASDAQ', country: 'US' },
    { code: 'CRM', name: 'Salesforce Inc.', sector: 'Software', market: 'NYSE', country: 'US' },
    { code: 'CSCO', name: 'Cisco Systems', sector: 'Networking', market: 'NASDAQ', country: 'US' },
    { code: 'IBM', name: 'IBM', sector: 'Technology', market: 'NYSE', country: 'US' },
    { code: 'NOW', name: 'ServiceNow Inc.', sector: 'Software', market: 'NYSE', country: 'US' },
    { code: 'SNOW', name: 'Snowflake Inc.', sector: 'Software', market: 'NYSE', country: 'US' },
    { code: 'LYFT', name: 'Lyft Inc.', sector: 'Technology', market: 'NASDAQ', country: 'US' },
    { code: 'ZM', name: 'Zoom Video Communications', sector: 'Software', market: 'NASDAQ', country: 'US' },
    { code: 'TWLO', name: 'Twilio Inc.', sector: 'Software', market: 'NYSE', country: 'US' },
    { code: 'DOCU', name: 'DocuSign Inc.', sector: 'Software', market: 'NASDAQ', country: 'US' },
  ],

  // Finance & Banking (ENHANCED)
  finance: [
    {
      code: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Banking', market: 'NYSE', country: 'US',
      marketCap: 'Mega', avgVolume: 12000000, volatility: 'Medium', beta: 1.15, liquidity: 'Extreme',
      dividendYield: 2.4, peRatio: 12.5, analystRating: 'Buy',
      esgRating: 'A', tradingStyle: ['Value', 'Banking', 'Dividend', 'Quality'],
      cmpSuitability: 'Excellent', bestTradingSession: 'NY', watchlistPriority: 'High'
    },
    {
      code: 'V', name: 'Visa Inc.', sector: 'Financial Services', market: 'NYSE', country: 'US',
      marketCap: 'Mega', avgVolume: 7500000, volatility: 'Low', beta: 0.95, liquidity: 'Extreme',
      dividendYield: 0.7, peRatio: 32.5, analystRating: 'Buy',
      esgRating: 'A', tradingStyle: ['Growth', 'Quality', 'Payments', 'Defensive'],
      cmpSuitability: 'Excellent', bestTradingSession: 'NY', watchlistPriority: 'Critical'
    },
    {
      code: 'MA', name: 'Mastercard Inc.', sector: 'Financial Services', market: 'NYSE', country: 'US',
      marketCap: 'Mega', avgVolume: 3200000, volatility: 'Low', beta: 0.98, liquidity: 'High',
      dividendYield: 0.5, peRatio: 35.8, analystRating: 'Buy',
      esgRating: 'A', tradingStyle: ['Growth', 'Quality', 'Payments', 'Defensive'],
      cmpSuitability: 'Excellent', bestTradingSession: 'NY', watchlistPriority: 'High'
    },
    { code: 'BAC', name: 'Bank of America', sector: 'Banking', market: 'NYSE', country: 'US' },
    { code: 'WFC', name: 'Wells Fargo', sector: 'Banking', market: 'NYSE', country: 'US' },
    { code: 'GS', name: 'Goldman Sachs', sector: 'Investment Banking', market: 'NYSE', country: 'US' },
    { code: 'MS', name: 'Morgan Stanley', sector: 'Investment Banking', market: 'NYSE', country: 'US' },
    { code: 'AXP', name: 'American Express', sector: 'Financial Services', market: 'NYSE', country: 'US' },
  ],

  // Healthcare & Pharma (ENHANCED - Top performers)
  healthcare: [
    {
      code: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare', market: 'NYSE', country: 'US',
      marketCap: 'Mega', avgVolume: 3200000, volatility: 'Low', beta: 0.72, liquidity: 'High',
      dividendYield: 1.3, peRatio: 28.5, analystRating: 'Buy',
      esgRating: 'A', tradingStyle: ['Growth', 'Healthcare', 'Defensive', 'Quality'],
      cmpSuitability: 'Excellent', bestTradingSession: 'NY', watchlistPriority: 'High'
    },
    { code: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', market: 'NYSE', country: 'US' },
    { code: 'PFE', name: 'Pfizer Inc.', sector: 'Pharmaceuticals', market: 'NYSE', country: 'US' },
    { code: 'ABBV', name: 'AbbVie Inc.', sector: 'Pharmaceuticals', market: 'NYSE', country: 'US' },
    { code: 'TMO', name: 'Thermo Fisher Scientific', sector: 'Healthcare', market: 'NYSE', country: 'US' },
    { code: 'MRK', name: 'Merck & Co.', sector: 'Pharmaceuticals', market: 'NYSE', country: 'US' },
  ],

  // Consumer & Retail (ENHANCED - Top performers)
  consumer: [
    {
      code: 'WMT', name: 'Walmart Inc.', sector: 'Retail', market: 'NYSE', country: 'US',
      marketCap: 'Mega', avgVolume: 8500000, volatility: 'Low', beta: 0.52, liquidity: 'Extreme',
      dividendYield: 1.4, peRatio: 28.5, analystRating: 'Buy',
      esgRating: 'B', tradingStyle: ['Defensive', 'Dividend', 'Retail', 'Value'],
      cmpSuitability: 'Excellent', bestTradingSession: 'NY', watchlistPriority: 'High'
    },
    {
      code: 'HD', name: 'Home Depot', sector: 'Retail', market: 'NYSE', country: 'US',
      marketCap: 'Mega', avgVolume: 3500000, volatility: 'Medium', beta: 0.95, liquidity: 'High',
      dividendYield: 2.3, peRatio: 24.5, analystRating: 'Buy',
      esgRating: 'A', tradingStyle: ['Growth', 'Dividend', 'Retail', 'Cyclical'],
      cmpSuitability: 'Excellent', bestTradingSession: 'NY', watchlistPriority: 'High'
    },
    {
      code: 'COST', name: 'Costco Wholesale', sector: 'Retail', market: 'NASDAQ', country: 'US',
      marketCap: 'Mega', avgVolume: 2200000, volatility: 'Medium', beta: 0.78, liquidity: 'High',
      dividendYield: 0.6, peRatio: 48.5, analystRating: 'Buy',
      esgRating: 'A', tradingStyle: ['Growth', 'Quality', 'Retail', 'Membership'],
      cmpSuitability: 'Good', bestTradingSession: 'NY', watchlistPriority: 'High'
    },
    {
      code: 'SBUX', name: 'Starbucks Corporation', sector: 'Restaurants', market: 'NASDAQ', country: 'US',
      marketCap: 'Large', avgVolume: 7500000, volatility: 'Medium', beta: 0.88, liquidity: 'High',
      dividendYield: 2.2, peRatio: 28.5, analystRating: 'Hold',
      esgRating: 'B', tradingStyle: ['Growth', 'Consumer', 'Dividend', 'Brand'],
      cmpSuitability: 'Good', bestTradingSession: 'NY', watchlistPriority: 'Medium'
    },
    {
      code: 'NKE', name: 'Nike Inc.', sector: 'Apparel', market: 'NYSE', country: 'US',
      marketCap: 'Large', avgVolume: 7800000, volatility: 'Medium', beta: 1.05, liquidity: 'High',
      dividendYield: 1.6, peRatio: 32.5, analystRating: 'Hold',
      esgRating: 'A', tradingStyle: ['Growth', 'Brand', 'Consumer', 'Global'],
      cmpSuitability: 'Good', bestTradingSession: 'NY', watchlistPriority: 'Medium'
    },
    {
      code: 'BABA', name: 'Alibaba Group', sector: 'E-commerce', market: 'NYSE', country: 'China',
      marketCap: 'Large', avgVolume: 18000000, volatility: 'High', beta: 1.45, liquidity: 'Extreme',
      dividendYield: 0.0, peRatio: 18.5, analystRating: 'Buy',
      esgRating: 'C', tradingStyle: ['Value', 'E-commerce', 'China', 'High Risk'],
      cmpSuitability: 'Fair', bestTradingSession: 'Asia', watchlistPriority: 'Medium'
    },
    { code: 'MCD', name: "McDonald's Corporation", sector: 'Restaurants', market: 'NYSE', country: 'US' },
    { code: 'KO', name: 'Coca-Cola Company', sector: 'Beverages', market: 'NYSE', country: 'US' },
    { code: 'PEP', name: 'PepsiCo Inc.', sector: 'Beverages', market: 'NASDAQ', country: 'US' },
    { code: 'TGT', name: 'Target Corporation', sector: 'Retail', market: 'NYSE', country: 'US' },
    { code: 'LOW', name: "Lowe's Companies", sector: 'Retail', market: 'NYSE', country: 'US' },
    { code: 'YUM', name: 'Yum! Brands', sector: 'Restaurants', market: 'NYSE', country: 'US' },
    { code: 'CMG', name: 'Chipotle Mexican Grill', sector: 'Restaurants', market: 'NYSE', country: 'US' },
    { code: 'BBY', name: 'Best Buy Co.', sector: 'Retail', market: 'NYSE', country: 'US' },
    { code: 'EBAY', name: 'eBay Inc.', sector: 'E-commerce', market: 'NASDAQ', country: 'US' },
  ],

  // Entertainment & Media (ENHANCED)
  media: [
    {
      code: 'NFLX', name: 'Netflix Inc.', sector: 'Streaming', market: 'NASDAQ', country: 'US',
      marketCap: 'Large', avgVolume: 4500000, volatility: 'High', beta: 1.35, liquidity: 'High',
      dividendYield: 0.0, peRatio: 42.5, analystRating: 'Buy',
      esgRating: 'B', tradingStyle: ['Growth', 'Streaming', 'Content', 'Tech'],
      cmpSuitability: 'Fair', bestTradingSession: 'NY', watchlistPriority: 'High'
    },
    { code: 'DIS', name: 'Walt Disney Company', sector: 'Entertainment', market: 'NYSE', country: 'US' },
    { code: 'CMCSA', name: 'Comcast Corporation', sector: 'Media', market: 'NASDAQ', country: 'US' },
  ],

  // Energy
  energy: [
    { code: 'XOM', name: 'Exxon Mobil', sector: 'Oil & Gas', market: 'NYSE', country: 'US' },
    { code: 'CVX', name: 'Chevron Corporation', sector: 'Oil & Gas', market: 'NYSE', country: 'US' },
  ],

  // Industrial (ENHANCED)
  industrial: [
    {
      code: 'BA', name: 'Boeing Company', sector: 'Aerospace', market: 'NYSE', country: 'US',
      marketCap: 'Large', avgVolume: 7500000, volatility: 'High', beta: 1.45, liquidity: 'Extreme',
      dividendYield: 0.0, peRatio: -8.5, analystRating: 'Hold',
      esgRating: 'C', tradingStyle: ['Cyclical', 'Aerospace', 'Recovery', 'High Risk'],
      cmpSuitability: 'Poor', bestTradingSession: 'NY', watchlistPriority: 'Low'
    },
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

  // Crypto & Fintech (ENHANCED)
  fintech: [
    {
      code: 'PYPL', name: 'PayPal Holdings', sector: 'Fintech', market: 'NASDAQ', country: 'US',
      marketCap: 'Large', avgVolume: 12000000, volatility: 'High', beta: 1.35, liquidity: 'Extreme',
      dividendYield: 0.0, peRatio: 18.5, analystRating: 'Hold',
      esgRating: 'B', tradingStyle: ['Value', 'Fintech', 'Payments', 'Turnaround'],
      cmpSuitability: 'Good', bestTradingSession: 'NY', watchlistPriority: 'Medium'
    },
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
    { code: 'AI', name: 'C3.ai Inc.', sector: 'AI/Software', market: 'NYSE', country: 'US' },
  ],

  // Airlines & Travel
  airlines: [
    { code: 'AAL', name: 'American Airlines', sector: 'Airlines', market: 'NASDAQ', country: 'US' },
    { code: 'DAL', name: 'Delta Air Lines', sector: 'Airlines', market: 'NYSE', country: 'US' },
    { code: 'UAL', name: 'United Airlines', sector: 'Airlines', market: 'NASDAQ', country: 'US' },
    { code: 'LUV', name: 'Southwest Airlines', sector: 'Airlines', market: 'NYSE', country: 'US' },
    { code: 'ABNB', name: 'Airbnb Inc.', sector: 'Travel', market: 'NASDAQ', country: 'US' },
    { code: 'BKNG', name: 'Booking Holdings', sector: 'Travel', market: 'NASDAQ', country: 'US' },
    { code: 'MAR', name: 'Marriott International', sector: 'Hospitality', market: 'NASDAQ', country: 'US' },
  ],

  // Gaming & Entertainment
  gaming: [
    { code: 'RBLX', name: 'Roblox Corporation', sector: 'Gaming', market: 'NYSE', country: 'US' },
    { code: 'EA', name: 'Electronic Arts', sector: 'Gaming', market: 'NASDAQ', country: 'US' },
    { code: 'ATVI', name: 'Activision Blizzard', sector: 'Gaming', market: 'NASDAQ', country: 'US' },
    { code: 'TTWO', name: 'Take-Two Interactive', sector: 'Gaming', market: 'NASDAQ', country: 'US' },
    { code: 'DKNG', name: 'DraftKings Inc.', sector: 'Gaming', market: 'NASDAQ', country: 'US' },
  ],

  // Luxury & Fashion
  luxury: [
    { code: 'LULU', name: 'Lululemon Athletica', sector: 'Apparel', market: 'NASDAQ', country: 'US' },
    { code: 'TJX', name: 'TJX Companies', sector: 'Retail', market: 'NYSE', country: 'US' },
    { code: 'RH', name: 'RH (Restoration Hardware)', sector: 'Retail', market: 'NYSE', country: 'US' },
  ],

  // Food & Beverage
  food_beverage: [
    { code: 'MNST', name: 'Monster Beverage', sector: 'Beverages', market: 'NASDAQ', country: 'US' },
    { code: 'KHC', name: 'Kraft Heinz Company', sector: 'Food', market: 'NASDAQ', country: 'US' },
    { code: 'GIS', name: 'General Mills', sector: 'Food', market: 'NYSE', country: 'US' },
    { code: 'K', name: 'Kellogg Company', sector: 'Food', market: 'NYSE', country: 'US' },
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
    ...US_STOCKS.airlines,
    ...US_STOCKS.gaming,
    ...US_STOCKS.luxury,
    ...US_STOCKS.food_beverage,
  ];
};

// Get US stock by code
export const getUSStockByCode = (code) => {
  return getAllUSStocks().find(stock => stock.code === code);
};

// Default US watchlist
export const DEFAULT_US_WATCHLIST = [
  // Magnificent 7 + Tech Giants (8 stocks)
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'ORCL',

  // Semiconductors & AI (6 stocks)
  'AMD', 'INTC', 'AVGO', 'QCOM', 'PLTR', 'AI',

  // Finance & Payments (3 stocks)
  'JPM', 'V', 'MA',

  // Consumer & Retail (5 stocks)
  'WMT', 'HD', 'COST', 'SBUX', 'NKE',

  // Tech Platforms (4 stocks)
  'UBER', 'SHOP', 'SPOT', 'NFLX',

  // Healthcare & Industrial (2 stocks)
  'UNH', 'BA',

  // E-commerce & Fintech (2 stocks)
  'BABA', 'PYPL'
];

export default {
  US_STOCKS,
  getAllUSStocks,
  getUSStockByCode,
  DEFAULT_US_WATCHLIST
};
