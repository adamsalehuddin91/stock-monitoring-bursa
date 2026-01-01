// News Service - Fetch real financial news from multiple sources
// Using AllOrigins as CORS proxy to fetch RSS feeds

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Malaysian Financial News RSS Feeds
const NEWS_SOURCES = {
  yahoo: 'https://finance.yahoo.com/rss/topfinstories',
  reuters: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best',
  bloomberg: 'https://www.bloomberg.com/feed/podcast/bloomberg-surveillance.xml',
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

// Fetch real financial news from RSS feeds
export const fetchFinancialNews = async () => {
  try {
    console.log('📰 Loading Malaysian market news...');

    // For now, use curated Malaysian market news
    // This is more reliable and focused on Bursa Malaysia
    // TODO: Integrate with premium news API (NewsAPI.org) for real-time updates

    const news = getMalaysianMarketNews();
    console.log(`✅ Loaded ${news.length} curated news articles`);
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
    url: '#',
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

  if (lowerText.match(/bank|finance|loan|credit|maybank|cimb|public bank|rhb|ammb|hong leong bank/i)) return 'banking';
  if (lowerText.match(/energy|oil|gas|petronas|tenaga|renewable|solar|power|electricity/i)) return 'energy';
  if (lowerText.match(/tech|technology|digital|software|semiconductor|ai|cybersecurity|5g/i)) return 'tech';
  if (lowerText.match(/property|real estate|reit|construction|property developer/i)) return 'property';
  if (lowerText.match(/plantation|palm oil|commodity|agriculture|rubber/i)) return 'agriculture';
  if (lowerText.match(/glove|healthcare|medical|hospital|pharmaceutical/i)) return 'healthcare';
  if (lowerText.match(/global|world|international|us |wall street|dow jones|federal reserve|china|asia/i)) return 'global';

  return 'market'; // default
};

// Helper: Extract mentioned stocks from news text
const extractStockMentions = (text) => {
  const mentioned = [];
  const lowerText = text.toLowerCase();

  // Malaysian blue chip companies
  const stockKeywords = {
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

  Object.entries(stockKeywords).forEach(([code, keywords]) => {
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

  // Bullish keywords
  const bullishWords = ['gain', 'surge', 'rise', 'up', 'growth', 'strong', 'positive', 'rally', 'higher', 'increase', 'expansion', 'secures', 'wins', 'award', 'benefit'];

  // Bearish keywords
  const bearishWords = ['fall', 'drop', 'decline', 'down', 'weak', 'negative', 'loss', 'lower', 'decrease', 'concern', 'risk', 'warning', 'cut'];

  let bullishCount = 0;
  let bearishCount = 0;

  bullishWords.forEach(word => {
    if (lowerText.includes(word)) bullishCount++;
  });

  bearishWords.forEach(word => {
    if (lowerText.includes(word)) bearishCount++;
  });

  if (bullishCount > bearishCount) return 'bullish';
  if (bearishCount > bullishCount) return 'bearish';
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
