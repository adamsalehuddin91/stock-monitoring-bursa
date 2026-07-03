// Multi-source market data adapter.
// Routes each asset to its best-fit provider and normalizes everything to a
// single candle shape { time(ms), close, high, low, volume } so the shared
// indicator engine (analyzeSeries) works the same for every asset class.
//
// Isomorphic:
//   - Browser  → Yahoo via the CORS proxy (/api/yahoo)
//   - Server   → Yahoo direct (cron functions run server-side; no CORS)
//   - Binance  → public data endpoint, CORS-open, works in both contexts.

const isServer = typeof window === 'undefined'
const YAHOO = isServer ? 'https://query1.finance.yahoo.com' : '/api/yahoo'

// data-api.binance.vision = Binance public market-data host. Unlike api.binance.com
// it is NOT geo-blocked (US datacenter IPs get 451 on api.binance.com) — important
// because Vercel serverless may run in a US region.
const BINANCE = 'https://data-api.binance.vision'

// ---- Yahoo (stocks, indices, forex, commodity/futures proxies) ----
async function yahooCandles(symbol, { range = '6mo', interval = '1d' } = {}) {
  const res = await fetch(
    `${YAHOO}/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`,
    { headers: isServer ? { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } : undefined },
  )
  if (!res.ok) throw new Error(`Yahoo ${symbol} ${res.status}`)
  const r = (await res.json())?.chart?.result?.[0]
  if (!r) throw new Error(`Yahoo no data ${symbol}`)
  const ts = r.timestamp || [], q = r.indicators?.quote?.[0] || {}
  return ts
    .map((t, i) => ({ time: t * 1000, close: q.close?.[i], high: q.high?.[i], low: q.low?.[i], volume: q.volume?.[i] }))
    .filter(c => c.close != null)
}

// ---- Binance (crypto) ----
const BINANCE_INTERVAL = { '1d': '1d', '1h': '1h', '15m': '15m' }
async function binanceCandles(symbol, { interval = '1d', limit = 200 } = {}) {
  const iv = BINANCE_INTERVAL[interval] || '1d'
  const res = await fetch(`${BINANCE}/api/v3/klines?symbol=${symbol}&interval=${iv}&limit=${limit}`)
  if (!res.ok) throw new Error(`Binance ${symbol} ${res.status}`)
  const rows = await res.json()
  // kline row: [openTime, open, high, low, close, volume, ...]
  return rows
    .map(k => ({ time: k[0], close: +k[4], high: +k[2], low: +k[3], volume: +k[5] }))
    .filter(c => Number.isFinite(c.close))
}

const PROVIDERS = { yahoo: yahooCandles, binance: binanceCandles }

// Public: normalized candles for any registered asset.
export async function getCandles({ symbol, source = 'yahoo', range, interval } = {}) {
  const fn = PROVIDERS[source]
  if (!fn) throw new Error(`Unknown data source: ${source}`)
  return fn(symbol, { range, interval })
}

// Latest close + % change vs previous candle.
export function lastChange(candles) {
  if (!candles || candles.length < 2) return { last: null, changePct: null }
  const a = candles[candles.length - 2].close, b = candles[candles.length - 1].close
  return { last: b, changePct: Number((((b - a) / a) * 100).toFixed(2)) }
}
