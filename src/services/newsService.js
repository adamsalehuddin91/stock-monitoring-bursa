// News Service - Fetch real financial news from multiple sources
// Using AllOrigins as CORS proxy to fetch RSS feeds
import { fetchFinnhubMarketNews, isFinnhubConfigured } from './finnhubService';

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Financial News RSS Feeds (Google Finance aggregates from these sources)
const NEWS_SOURCES = {
  yahoo: 'https://finance.yahoo.com/rss/topfinstories',
  reuters: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best',
  bloomberg: 'https://www.bloomberg.com/feed/podcast/bloomberg-surveillance.xml',
  marketwatch: 'https://feeds.marketwatch.com/marketwatch/topstories/',
  cnbc: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
  seekingalpha: 'https://seekingalpha.com/feed.xml',
  benzinga: 'https://www.benzinga.com/feed',
};

// Fallback news when API unavailable
const FALLBACK_NEWS = [
  {
    id: 1,
    category: 'market',
    title: 'Bursa Malaysia Trading Activity Update',
    summary: 'Market participants monitor key stock movements as trading activity picks up in major sectors.',
    source: 'Market Update',
    time: '30 min ago',
    url: '#'
  },
  {
    id: 2,
    category: 'banking',
    title: 'Banking Sector Shows Resilience',
    summary: 'Major banking stocks maintain steady performance amid market volatility.',
    source: 'Financial Times',
    time: '1 hour ago',
    url: '#'
  },
  {
    id: 3,
    category: 'energy',
    title: 'Energy Stocks React to Oil Price Movements',
    summary: 'Petronas-linked counters track global energy market trends.',
    source: 'Energy News',
    time: '2 hours ago',
    url: '#'
  }
];

// Fetch news from Google Finance sources (RSS feeds)
const fetchGoogleFinanceSources = async () => {
  try {
    const selectedMarket = localStorage.getItem('selectedMarket') || 'BURSA';

    // Only fetch for US and GLOBAL markets (these sources are US-focused)
    if (selectedMarket === 'BURSA') {
      return [];
    }

    // Fetch from multiple sources in parallel
    const newsPromises = [
      fetchRSSFeed(NEWS_SOURCES.marketwatch, 'MarketWatch', 'market'),
      fetchRSSFeed(NEWS_SOURCES.cnbc, 'CNBC', 'market'),
      fetchRSSFeed(NEWS_SOURCES.yahoo, 'Yahoo Finance', 'market')
    ];

    const results = await Promise.allSettled(newsPromises);

    // Combine all successful results
    const allNews = results
      .filter(result => result.status === 'fulfilled' && result.value.length > 0)
      .flatMap(result => result.value);

    // Remove duplicates by title
    const uniqueNews = [];
    const seenTitles = new Set();

    allNews.forEach(article => {
      const titleKey = article.title.toLowerCase().substring(0, 50);
      if (!seenTitles.has(titleKey)) {
        seenTitles.add(titleKey);
        uniqueNews.push(article);
      }
    });

    return uniqueNews.slice(0, 15); // Limit to 15 RSS articles
  } catch (error) {
    console.error('Error fetching Google Finance sources:', error);
    return [];
  }
};

// Fetch real financial news from RSS feeds
export const fetchFinancialNews = async () => {
  try {
    // Detect which market is selected
    const selectedMarket = localStorage.getItem('selectedMarket') || 'BURSA';

    console.log(`📰 Loading ${selectedMarket} market news...`);

    let news;
    if (selectedMarket === 'US') {
      news = getUSMarketNews();
      console.log(`✅ Loaded ${news.length} US market news articles`);
    } else if (selectedMarket === 'GLOBAL') {
      // Combine both markets for global view
      const malaysianNews = getMalaysianMarketNews();
      const usNews = getUSMarketNews();
      news = [...malaysianNews, ...usNews].sort((a, b) => b.timestamp - a.timestamp);
      console.log(`✅ Loaded ${news.length} global news articles (MY: ${malaysianNews.length}, US: ${usNews.length})`);
    } else {
      news = getMalaysianMarketNews();
      console.log(`✅ Loaded ${news.length} Malaysian market news articles`);
    }

    // Add RSS news from Google Finance sources (MarketWatch, CNBC, etc.)
    try {
      console.log('📡 Fetching RSS news from Google Finance sources...');
      const rssNews = await fetchGoogleFinanceSources();

      if (rssNews && rssNews.length > 0) {
        news = [...rssNews, ...news]
          .sort((a, b) => b.timestamp - a.timestamp);
        console.log(`✅ Added ${rssNews.length} articles from RSS feeds`);
      }
    } catch (rssError) {
      console.warn('RSS feeds not available:', rssError.message);
    }

    // Add Finnhub real-time news if API is configured
    if (isFinnhubConfigured()) {
      try {
        console.log('📡 Fetching real-time news from Finnhub...');
        const finnhubNews = await fetchFinnhubMarketNews('general');

        if (finnhubNews && finnhubNews.length > 0) {
          // Merge Finnhub news with curated news
          news = [...finnhubNews, ...news]
            .sort((a, b) => b.timestamp - a.timestamp);
          console.log(`✅ Added ${finnhubNews.length} real-time articles from Finnhub`);
        }
      } catch (finnhubError) {
        console.warn('Finnhub API not available, using curated news only:', finnhubError.message);
      }
    } else {
      console.log('ℹ️ Finnhub API not configured. Add VITE_FINNHUB_API_KEY to .env.local for real-time news');
    }

    // Limit total articles to prevent overload
    news = news.slice(0, 40);

    return news;

  } catch (error) {
    console.error('Error loading news:', error);
    return FALLBACK_NEWS;
  }
};

// Fetch RSS feed via CORS proxy and parse XML
const fetchRSSFeed = async (rssUrl, sourceName, defaultCategory) => {
  try {
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(rssUrl)}`;

    const response = await fetch(proxyUrl, {
      headers: {
        'Accept': 'application/xml, text/xml, */*',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // Check for parse errors
    if (xmlDoc.querySelector('parsererror')) {
      throw new Error('XML parse error');
    }

    // Parse RSS items
    const items = xmlDoc.querySelectorAll('item');

    if (items.length === 0) {
      throw new Error('No items in feed');
    }

    console.log(`✅ ${sourceName}: ${items.length} articles`);

    // Convert RSS items to our news format
    const newsItems = [];
    items.forEach((item, index) => {
      if (index >= 10) return; // Limit to 10 items

      const title = item.querySelector('title')?.textContent || '';
      const description = item.querySelector('description')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '#';
      const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();

      // Detect category from title/content
      const category = detectCategory(title + ' ' + description) || defaultCategory;

      // Calculate time ago
      const timestamp = new Date(pubDate).getTime();
      const timeAgo = getTimeAgo(timestamp);

      const fullText = title + ' ' + description;
      const stockMentions = extractStockMentions(fullText);

      newsItems.push({
        id: `${sourceName}-${index}-${Date.now()}`,
        category: category,
        title: cleanHtml(title),
        summary: cleanHtml(description).substring(0, 200) + '...',
        source: sourceName,
        time: timeAgo,
        url: link,
        timestamp: timestamp,
        stocks: stockMentions
      });
    });

    return newsItems;
  } catch (error) {
    console.error(`Error fetching ${sourceName}:`, error);
    return [];
  }
};

// Get US market-specific news (curated for trading)
const getUSMarketNews = () => {
  const now = Date.now();

  const newsItems = [
    {
      category: 'market',
      title: 'Tech Stocks Rally on AI Optimism',
      summary: 'Major technology stocks surge as artificial intelligence investments drive growth. Nvidia, Microsoft, and Google lead gains with strong earnings outlooks.',
      source: 'Bloomberg',
      stocks: ['NVDA', 'MSFT', 'GOOGL'],
      sentiment: 'bullish',
      minutes: 15,
      url: 'https://www.google.com/finance/quote/NVDA:NASDAQ'
    },
    {
      category: 'tech',
      title: 'Apple Announces Record iPhone Sales in Q4',
      summary: 'Apple Inc. reports 15% YoY revenue growth driven by iPhone 15 demand and services expansion. Stock jumps 3.5% on strong guidance.',
      source: 'CNBC',
      stocks: ['AAPL'],
      sentiment: 'bullish',
      minutes: 30
    },
    {
      category: 'tech',
      title: 'Tesla Delivers 500K Vehicles, Beats Estimates',
      summary: 'Electric vehicle maker exceeds delivery targets for Q4, driven by Model 3 and Model Y demand. Production capacity expansion continues.',
      source: 'Reuters',
      stocks: ['TSLA'],
      sentiment: 'bullish',
      minutes: 60
    },
    {
      category: 'banking',
      title: 'JPMorgan Chase Reports Strong Q4 Earnings',
      summary: 'Largest US bank posts record profits with investment banking and trading revenue up 25%. CEO optimistic on economic outlook.',
      source: 'Wall Street Journal',
      stocks: ['JPM'],
      sentiment: 'bullish',
      minutes: 90
    },
    {
      category: 'tech',
      title: 'Meta Platforms Revenue Surges on Ad Growth',
      summary: 'Social media giant sees 23% revenue increase as advertising business rebounds. AI-powered ad tools drive engagement.',
      source: 'TechCrunch',
      stocks: ['META'],
      sentiment: 'bullish',
      minutes: 120
    },
    {
      category: 'retail',
      title: 'Amazon Prime Day Breaks Sales Records',
      summary: 'E-commerce leader reports best-ever Prime Day with $14B in sales. Cloud services AWS maintains strong growth trajectory.',
      source: 'CNBC',
      stocks: ['AMZN'],
      sentiment: 'bullish',
      minutes: 150
    },
    {
      category: 'market',
      title: 'S&P 500 Reaches New All-Time High',
      summary: 'Benchmark index hits record levels as economic data supports soft landing narrative. Tech and financials lead broad market rally.',
      source: 'Bloomberg',
      sentiment: 'bullish',
      minutes: 180
    },
    {
      category: 'tech',
      title: 'Microsoft Cloud Revenue Accelerates 30%',
      summary: 'Azure cloud platform growth accelerates as enterprise AI adoption increases. Gaming and productivity segments also beat expectations.',
      source: 'Reuters',
      stocks: ['MSFT'],
      sentiment: 'bullish',
      minutes: 210
    },
    {
      category: 'streaming',
      title: 'Netflix Adds 15M Subscribers in Quarter',
      summary: 'Streaming giant exceeds subscriber growth targets with hit original content. Ad-tier gaining traction with 40% of new signups.',
      source: 'Variety',
      stocks: ['NFLX'],
      sentiment: 'bullish',
      minutes: 240
    },
    {
      category: 'fintech',
      title: 'PayPal Transaction Volume Up 18% YoY',
      summary: 'Digital payments leader processes record transaction volumes. International expansion and Venmo growth drive results.',
      source: 'Financial Times',
      stocks: ['PYPL'],
      sentiment: 'bullish',
      minutes: 270
    },
    {
      category: 'market',
      title: 'Fed Holds Rates Steady, Markets Rally',
      summary: 'Federal Reserve maintains current interest rate policy, signaling potential cuts ahead. Equities surge on dovish tone.',
      source: 'Wall Street Journal',
      sentiment: 'bullish',
      minutes: 300
    },
    {
      category: 'travel',
      title: 'Airbnb Bookings Surge 25% in Summer Season',
      summary: 'Home-sharing platform reports record bookings as travel demand remains strong. International markets drive growth.',
      source: 'Bloomberg',
      stocks: ['ABNB'],
      sentiment: 'bullish',
      minutes: 330
    }
  ];

  const newsWithSentiment = newsItems.map(item => ({
    ...item,
    sentiment: item.sentiment || detectSentiment(item.title + ' ' + item.summary)
  }));

  return newsWithSentiment.map((item, index) => ({
    id: `us-news-${index}-${Date.now()}`,
    category: item.category,
    title: item.title,
    summary: item.summary,
    source: item.source,
    time: getTimeAgo(now - (item.minutes * 60 * 1000)),
    url: item.url || `https://www.google.com/finance/quote/${item.stocks?.[0]}:NASDAQ`,
    timestamp: now - (item.minutes * 60 * 1000),
    stocks: item.stocks || [],
    sentiment: item.sentiment
  }));
};

// Get Malaysian market-specific news (curated for trading)
const getMalaysianMarketNews = () => {
  const now = Date.now();

  const newsItems = [
    {
      category: 'market',
      title: 'FBM KLCI Opens Higher on Regional Optimism',
      summary: 'Bursa Malaysia benchmark index gains 0.8% in morning trade, tracking positive sentiment from Wall Street and Asian markets. Key blue chips Maybank, Public Bank lead gainers.',
      source: 'The Edge Markets',
      stocks: ['1155', '1295'],
      sentiment: 'bullish',
      minutes: 15
    },
    {
      category: 'banking',
      title: 'Maybank Reports Strong Q4 Earnings',
      summary: 'Malaysia\'s largest bank posts 12% YoY profit growth driven by loan expansion and improved asset quality. Stock rises 2.3% on results.',
      source: 'The Star',
      stocks: ['1155'],
      minutes: 45
    },
    {
      category: 'energy',
      title: 'Tenaga Nasional Secures RM2.5B Green Energy Contract',
      summary: 'National utility company awarded major solar farm project, strengthening renewable energy portfolio. Analysts maintain BUY rating.',
      source: 'Bloomberg',
      stocks: ['5347'],
      minutes: 90
    },
    {
      category: 'tech',
      title: 'Malaysian Tech Sector Attracts Foreign Investment',
      summary: 'Data center and semiconductor initiatives draw RM5 billion in foreign direct investment commitments. Industry outlook remains positive.',
      source: 'Reuters',
      stocks: ['0123'],
      minutes: 120
    },
    {
      category: 'gloves',
      title: 'Top Glove Sees Volume Surge on Export Recovery',
      summary: 'Glove manufacturer reports 45% increase in export orders as healthcare demand stabilizes. Stock up 8% on heavy volume.',
      source: 'The Edge Markets',
      stocks: ['7113'],
      minutes: 180
    },
    {
      category: 'banking',
      title: 'CIMB Group Announces Digital Banking Expansion',
      summary: 'Regional banking group invests RM800M in fintech and digital services, targeting 5 million new digital customers by 2026.',
      source: 'The Star',
      stocks: ['1023'],
      minutes: 240
    },
    {
      category: 'market',
      title: 'Foreign Funds Return to Bursa with RM320M Net Inflow',
      summary: 'International investors resume buying Malaysian equities after three-week selloff. Blue chips and plantation stocks see strongest inflows.',
      source: 'Bloomberg',
      stocks: ['1961', '2445'],
      minutes: 300
    },
    {
      category: 'property',
      title: 'Sunway Property Launches RM1.2B Integrated Development',
      summary: 'Property developer unveils mixed-use project in Klang Valley, pre-sales exceed 60% within first week.',
      source: 'The Edge Markets',
      stocks: ['6399'],
      minutes: 360
    },
    {
      category: 'energy',
      title: 'Petronas Chemicals Ups Production Capacity 15%',
      summary: 'Integrated chemicals producer completes RM1.8B expansion, targeting export markets. Margins expected to improve.',
      source: 'Reuters',
      stocks: ['5168'],
      minutes: 420
    },
    {
      category: 'global',
      title: 'US Fed Signals Steady Rates, Asian Markets Rally',
      summary: 'Federal Reserve maintains interest rates, boosting Asian equities including Bursa Malaysia. Technology and banking sectors outperform.',
      source: 'Bloomberg',
      minutes: 480
    },
    {
      category: 'plantation',
      title: 'Palm Oil Prices Rise 3% on Supply Concerns',
      summary: 'Crude palm oil futures climb on production slowdown and strong export demand. KL Kepong, IOI Corp benefit from price surge.',
      source: 'The Star',
      stocks: ['2445', '1961'],
      minutes: 540
    },
    {
      category: 'telco',
      title: 'Axiata Group Finalizes 5G Infrastructure Partnership',
      summary: 'Regional telco giant secures government 5G network agreement, shares up 4% on strategic win.',
      source: 'The Edge Markets',
      stocks: ['6888'],
      minutes: 600
    }
  ];

  // Add sentiment to all news items
  const newsWithSentiment = newsItems.map(item => ({
    ...item,
    sentiment: item.sentiment || detectSentiment(item.title + ' ' + item.summary)
  }));

  return newsWithSentiment.map((item, index) => ({
    id: `news-${index}-${Date.now()}`,
    category: item.category,
    title: item.title,
    summary: item.summary,
    source: item.source,
    time: getTimeAgo(now - (item.minutes * 60 * 1000)),
    url: item.url || `https://www.google.com/finance/quote/${item.stocks?.[0]}:KLSE`,
    timestamp: now - (item.minutes * 60 * 1000),
    stocks: item.stocks || [],
    sentiment: item.sentiment
  }));
};

// Get top market movers for news insights
export const getMarketInsights = async () => {
  try {
    // This would integrate with stock data to show real insights
    return {
      topGainer: { name: 'Loading...', change: 0 },
      mostActive: { name: 'Loading...', volume: 0 },
      foreignFlow: { net: 0 }
    };
  } catch (error) {
    console.error('Error fetching insights:', error);
    return {
      topGainer: { name: 'N/A', change: 0 },
      mostActive: { name: 'N/A', volume: 0 },
      foreignFlow: { net: 0 }
    };
  }
};

// Helper: Detect category from text content
const detectCategory = (text) => {
  const lowerText = text.toLowerCase();

  // Malaysian-specific categories
  if (lowerText.match(/bank|finance|loan|credit|maybank|cimb|public bank|rhb|ammb|hong leong bank/i)) return 'banking';
  if (lowerText.match(/energy|oil|gas|petronas|tenaga|renewable|solar|power|electricity/i)) return 'energy';
  if (lowerText.match(/property|real estate|reit|construction|property developer|sunway/i)) return 'property';
  if (lowerText.match(/plantation|palm oil|commodity|agriculture|rubber|ioi|kl kepong/i)) return 'agriculture';
  if (lowerText.match(/glove|top glove|healthcare|medical|hospital|pharmaceutical/i)) return 'healthcare';

  // US-specific categories
  if (lowerText.match(/jpmorgan|jp morgan|chase|goldman|bank of america|wells fargo|citigroup/i)) return 'banking';
  if (lowerText.match(/apple|microsoft|google|alphabet|amazon|meta|facebook|netflix|tesla|nvidia/i)) return 'tech';
  if (lowerText.match(/streaming|netflix|disney\+|hbo|paramount|subscriber|content/i)) return 'streaming';
  if (lowerText.match(/e-commerce|retail|amazon|walmart|target|ebay|shopping/i)) return 'retail';
  if (lowerText.match(/paypal|venmo|square|stripe|fintech|digital payment|crypto|coinbase/i)) return 'fintech';
  if (lowerText.match(/airbnb|uber|lyft|travel|ride-sharing|home-sharing|booking/i)) return 'travel';
  if (lowerText.match(/boeing|aerospace|airline|aviation|aircraft/i)) return 'aerospace';

  // General tech categories (both markets)
  if (lowerText.match(/tech|technology|digital|software|semiconductor|ai|artificial intelligence|cybersecurity|5g|cloud|saas/i)) return 'tech';

  // Global market indicators
  if (lowerText.match(/s&p 500|nasdaq|dow jones|federal reserve|fed|wall street|stock market/i)) return 'market';
  if (lowerText.match(/global|world|international|china|asia|europe|emerging market/i)) return 'global';

  return 'market'; // default
};

// Helper: Extract mentioned stocks from news text
const extractStockMentions = (text) => {
  const mentioned = [];
  const lowerText = text.toLowerCase();

  // Malaysian blue chip companies
  const malaysianStockKeywords = {
    '1155': ['maybank', 'malayan banking'],
    '1295': ['public bank', 'pbbank'],
    '5347': ['tenaga', 'tnb', 'tenaga nasional'],
    '1023': ['cimb', 'cimb group'],
    '5168': ['petronas chemicals', 'pchem'],
    '7113': ['top glove', 'topglove'],
    '6742': ['ytl power', 'ytlpowr'],
    '1082': ['genting'],
    '5183': ['dialog'],
    '4197': ['maxis'],
    '6888': ['axiata'],
    '1961': ['ioi', 'ioi corp'],
    '2445': ['kl kepong', 'klk'],
  };

  // US company stock mappings
  const usStockKeywords = {
    'AAPL': ['apple', 'iphone', 'ipad', 'macbook', 'tim cook'],
    'MSFT': ['microsoft', 'windows', 'azure', 'xbox', 'satya nadella'],
    'GOOGL': ['google', 'alphabet', 'youtube', 'android', 'search engine'],
    'AMZN': ['amazon', 'aws', 'prime', 'jeff bezos', 'andy jassy'],
    'TSLA': ['tesla', 'elon musk', 'electric vehicle', 'model 3', 'model y'],
    'NVDA': ['nvidia', 'gpu', 'ai chip', 'gaming graphics'],
    'META': ['meta', 'facebook', 'instagram', 'whatsapp', 'mark zuckerberg'],
    'NFLX': ['netflix', 'streaming service', 'subscriber'],
    'JPM': ['jpmorgan', 'jp morgan', 'chase bank', 'jamie dimon'],
    'V': ['visa', 'payment network', 'credit card'],
    'WMT': ['walmart', 'retail giant'],
    'DIS': ['disney', 'marvel', 'pixar', 'disney+'],
    'PYPL': ['paypal', 'venmo', 'digital payment'],
    'INTC': ['intel', 'semiconductor', 'processor'],
    'AMD': ['amd', 'ryzen', 'radeon'],
    'NFLX': ['netflix', 'streaming'],
    'CRM': ['salesforce', 'crm software'],
    'CSCO': ['cisco', 'networking'],
    'ORCL': ['oracle', 'database'],
    'ABNB': ['airbnb', 'home-sharing', 'vacation rental'],
    'UBER': ['uber', 'ride-sharing', 'uber eats'],
    'BABA': ['alibaba', 'jack ma', 'chinese e-commerce'],
    'BA': ['boeing', 'aircraft', 'aerospace'],
    'COIN': ['coinbase', 'crypto exchange'],
  };

  // Check Malaysian stocks
  Object.entries(malaysianStockKeywords).forEach(([code, keywords]) => {
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        mentioned.push(code);
      }
    });
  });

  // Check US stocks
  Object.entries(usStockKeywords).forEach(([code, keywords]) => {
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        mentioned.push(code);
      }
    });
  });

  return [...new Set(mentioned)]; // Remove duplicates
};

// Helper: Calculate time ago from timestamp
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

// Helper: Detect sentiment from news content
const detectSentiment = (text) => {
  const lowerText = text.toLowerCase();

  // Expanded bullish keywords (more comprehensive)
  const bullishWords = [
    // Price action
    'gain', 'surge', 'rise', 'up', 'rally', 'higher', 'increase', 'jump', 'soar', 'climb', 'advance', 'breakout',
    // Performance
    'growth', 'strong', 'positive', 'beat', 'exceed', 'outperform', 'record', 'high', 'boost', 'improve',
    // Business
    'expansion', 'secures', 'wins', 'award', 'benefit', 'profit', 'revenue', 'earnings', 'demand', 'sales',
    // Sentiment
    'optimism', 'bullish', 'confidence', 'opportunity', 'upgrade', 'buy', 'attractive', 'momentum',
    // Results
    'success', 'achievement', 'milestone', 'deliver', 'recovery', 'rebound', 'innovation'
  ];

  // Expanded bearish keywords (more comprehensive)
  const bearishWords = [
    // Price action
    'fall', 'drop', 'decline', 'down', 'lower', 'decrease', 'plunge', 'tumble', 'slide', 'slip', 'crash',
    // Performance
    'weak', 'negative', 'loss', 'miss', 'disappoint', 'underperform', 'low', 'worst', 'slump',
    // Business
    'concern', 'risk', 'warning', 'cut', 'layoff', 'bankruptcy', 'debt', 'deficit', 'challenge', 'struggle',
    // Sentiment
    'bearish', 'fear', 'uncertainty', 'doubt', 'downgrade', 'sell', 'caution', 'pressure',
    // Results
    'failure', 'setback', 'crisis', 'problem', 'issue', 'trouble', 'difficulty'
  ];

  let bullishCount = 0;
  let bearishCount = 0;

  bullishWords.forEach(word => {
    if (lowerText.includes(word)) bullishCount++;
  });

  bearishWords.forEach(word => {
    if (lowerText.includes(word)) bearishCount++;
  });

  // Need at least 2 keywords for strong signal, otherwise neutral
  if (bullishCount >= 2 && bullishCount > bearishCount) return 'bullish';
  if (bearishCount >= 2 && bearishCount > bullishCount) return 'bearish';
  if (bullishCount === 1 && bearishCount === 0) return 'bullish';
  if (bearishCount === 1 && bullishCount === 0) return 'bearish';
  return 'neutral';
};

// Helper: Clean HTML tags from text
const cleanHtml = (html) => {
  if (!html) return '';

  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'");

  // Remove extra whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
};

// Filter news by stock codes
export const filterNewsByStocks = (newsArticles, stockCodes) => {
  if (!stockCodes || stockCodes.length === 0) return newsArticles;

  return newsArticles.filter(article => {
    if (!article.stocks || article.stocks.length === 0) {
      return true; // Include general market news
    }
    // Include if any mentioned stock is in user's watchlist
    return article.stocks.some(stock => stockCodes.includes(stock));
  });
};

export default {
  fetchFinancialNews,
  getMarketInsights,
  filterNewsByStocks
};
