// Serverless news proxy — real Google News RSS (server-side, no CORS).
// Browser calls /api/news?market=BURSA → real, recent headlines.
import { getHeadlines } from '../src/services/news.js'

const MARKET_MODULES = {
  BURSA: ['bursa', 'fcpo'],
  US: ['global'],
  GLOBAL: ['bursa', 'global', 'crypto', 'fcpo'],
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200') // edge-cache 10min
  const market = (req.query?.market || 'BURSA').toUpperCase()
  const modules = MARKET_MODULES[market] || MARKET_MODULES.BURSA
  try {
    const headlines = await getHeadlines(modules, { perTopic: 6, max: 30, maxAgeDays: 7 })
    return res.status(200).json({ market, count: headlines.length, headlines })
  } catch (e) {
    return res.status(500).json({ error: e.message, headlines: [] })
  }
}
