// News Service — REAL financial headlines via the /api/news serverless proxy
// (Google News RSS, fetched server-side to avoid CORS). No hardcoded articles.

// Minimal offline fallback, only if the API itself is unreachable.
const FALLBACK_NEWS = [
  { id: 'fb-1', category: 'market', title: 'Berita tidak dapat dimuat', summary: 'Sambungan ke sumber berita gagal — cuba refresh sebentar lagi.', source: 'System', time: 'now', url: '#', timestamp: Date.now(), stocks: [], sentiment: 'neutral' },
];

// Fetch real financial news for the selected market.
export const fetchFinancialNews = async () => {
  try {
    const selectedMarket = localStorage.getItem('selectedMarket') || 'BURSA';
    const res = await fetch(`/api/news?market=${encodeURIComponent(selectedMarket)}`);
    if (!res.ok) throw new Error(`api/news ${res.status}`);
    const data = await res.json();
    const headlines = data?.headlines || [];
    if (!headlines.length) return FALLBACK_NEWS;

    return headlines.map((h, i) => {
      const text = cleanHtml(h.title || '');
      const ts = h.ts || Date.now();
      return {
        id: `gn-${i}-${ts}`,
        category: detectCategory(text),
        title: text,
        summary: `via ${h.source || 'Google News'}`,
        source: h.source || 'Google News',
        time: getTimeAgo(ts),
        url: h.link || '#',
        timestamp: ts,
        stocks: extractStockMentions(text),
        sentiment: detectSentiment(text),
      };
    });
  } catch (error) {
    console.error('Error loading news:', error);
    return FALLBACK_NEWS;
  }
};

export const getMarketInsights = async () => ({
  topGainer: { name: 'N/A', change: 0 },
  mostActive: { name: 'N/A', volume: 0 },
  foreignFlow: { net: 0 },
});

// Filter news by stock codes (include general market news + watchlist mentions).
export const filterNewsByStocks = (newsArticles, stockCodes) => {
  if (!stockCodes || stockCodes.length === 0) return newsArticles;
  return newsArticles.filter(article => {
    if (!article.stocks || article.stocks.length === 0) return true;
    return article.stocks.some(stock => stockCodes.includes(stock));
  });
};

// ── Helpers ──────────────────────────────────────────────────────────────
const detectCategory = (text) => {
  const t = (text || '').toLowerCase();
  if (t.match(/bank|finance|loan|credit|maybank|cimb|public bank|rhb|ammb|hong leong bank|jpmorgan|goldman/i)) return 'banking';
  if (t.match(/palm oil|fcpo|cpo|mpob|plantation|kl kepong|ioi|sime darby/i)) return 'agriculture';
  if (t.match(/energy|oil|gas|petronas|tenaga|renewable|solar|power|electricity|crude/i)) return 'energy';
  if (t.match(/property|real estate|reit|construction|developer|sunway/i)) return 'property';
  if (t.match(/glove|healthcare|medical|hospital|pharmaceutical/i)) return 'healthcare';
  if (t.match(/bitcoin|ethereum|crypto|btc|eth|blockchain|altcoin|token/i)) return 'crypto';
  if (t.match(/apple|microsoft|google|alphabet|amazon|meta|netflix|tesla|nvidia|semiconductor|ai|chip/i)) return 'tech';
  if (t.match(/s&p 500|nasdaq|dow jones|federal reserve|\bfed\b|wall street|stock market/i)) return 'market';
  if (t.match(/global|world|international|china|asia|europe|emerging market/i)) return 'global';
  return 'market';
};

const extractStockMentions = (text) => {
  const t = (text || '').toLowerCase();
  const mentioned = [];
  const malaysian = {
    '1155': ['maybank', 'malayan banking'], '1295': ['public bank', 'pbbank'],
    '5347': ['tenaga', 'tnb'], '1023': ['cimb'], '5183': ['petronas chemicals', 'pchem'],
    '7113': ['top glove', 'topglove'], '6742': ['ytl power'], '1082': ['genting'],
    '6888': ['axiata'], '1961': ['ioi'], '2445': ['kl kepong', 'klk'], '6947': ['celcomdigi'],
  };
  const us = {
    AAPL: ['apple', 'iphone'], MSFT: ['microsoft', 'azure'], GOOGL: ['google', 'alphabet'],
    AMZN: ['amazon', 'aws'], TSLA: ['tesla', 'elon musk'], NVDA: ['nvidia'], META: ['meta', 'facebook'],
    NFLX: ['netflix'], JPM: ['jpmorgan', 'jp morgan'], AMD: ['amd', 'ryzen'], INTC: ['intel'],
  };
  for (const [code, kws] of Object.entries(malaysian)) for (const k of kws) if (t.includes(k)) mentioned.push(code);
  for (const [code, kws] of Object.entries(us)) for (const k of kws) if (t.includes(k)) mentioned.push(code);
  return [...new Set(mentioned)];
};

const getTimeAgo = (timestamp) => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000), hours = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(timestamp).toLocaleDateString();
};

const detectSentiment = (text) => {
  const t = (text || '').toLowerCase();
  const bull = ['gain', 'surge', 'rise', 'rally', 'higher', 'jump', 'soar', 'climb', 'breakout', 'growth', 'strong', 'beat', 'record', 'boost', 'profit', 'demand', 'upgrade', 'bullish', 'rebound', 'recovery', 'tighten', 'support'];
  const bear = ['fall', 'drop', 'decline', 'lower', 'plunge', 'tumble', 'slide', 'crash', 'weak', 'loss', 'miss', 'slump', 'concern', 'risk', 'warning', 'cut', 'layoff', 'debt', 'bearish', 'fear', 'downgrade', 'pressure'];
  let b = 0, s = 0;
  bull.forEach(w => { if (t.includes(w)) b++; });
  bear.forEach(w => { if (t.includes(w)) s++; });
  if (b >= 2 && b > s) return 'bullish';
  if (s >= 2 && s > b) return 'bearish';
  if (b === 1 && s === 0) return 'bullish';
  if (s === 1 && b === 0) return 'bearish';
  return 'neutral';
};

const cleanHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/\s+/g, ' ').trim();
};

export default { fetchFinancialNews, getMarketInsights, filterNewsByStocks };
