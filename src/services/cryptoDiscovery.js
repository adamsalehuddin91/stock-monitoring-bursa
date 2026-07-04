// Auto-discover crypto candidates — no hardcoded coin list. Rank the most liquid
// Binance USDT pairs by opportunity score → a dynamic "potential watchlist" that
// changes with the market each morning.
import { screenSymbols } from './screener.js'

const isServer = typeof window === 'undefined'
const BINANCE = 'https://data-api.binance.vision'   // public data host (no geo-block)

const LEVERAGED = /(UP|DOWN|BULL|BEAR)USDT$/         // 3x/leveraged tokens — skip
const STABLES = new Set(['USDCUSDT', 'FDUSDUSDT', 'TUSDUSDT', 'BUSDUSDT', 'DAIUSDT', 'USDPUSDT', 'EURUSDT', 'AEURUSDT'])

// topLiquid = how many top-volume coins to screen; top = how many to return.
export async function discoverCrypto({ topLiquid = 25, top = 6 } = {}) {
  const res = await fetch(`${BINANCE}/api/v3/ticker/24hr`, { headers: isServer ? { 'User-Agent': 'Mozilla/5.0' } : undefined })
  if (!res.ok) throw new Error(`Binance 24hr ${res.status}`)
  const all = await res.json()
  const liquid = all
    .filter(t => t.symbol.endsWith('USDT') && !LEVERAGED.test(t.symbol) && !STABLES.has(t.symbol))
    .filter(t => Number(t.quoteVolume) > 0)
    .sort((a, b) => Number(b.quoteVolume) - Number(a.quoteVolume))   // most liquid first
    .slice(0, topLiquid)
    .map(t => ({ ticker: t.symbol, name: t.symbol.replace('USDT', ''), source: 'binance' }))
  return screenSymbols(liquid, { top })   // score each on candles → rank → top N
}
