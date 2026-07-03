// Generic commodity data layer — FCPO + Gold (extensible).
// Free data via the existing Yahoo proxy. Same indicator engine for all.
import { analyzeSeries } from './indicators.js'

// Isomorphic: browser → CORS proxy; server (cron) → Yahoo direct.
const isServer = typeof window === 'undefined'
const YAHOO = isServer
  ? 'https://query1.finance.yahoo.com/v8/finance/chart'
  : '/api/yahoo/v8/finance/chart'

export const COMMODITIES = {
  fcpo: {
    key: 'fcpo', label: 'FCPO', name: 'Crude Palm Oil',
    main: { symbol: 'CPO=F', name: 'Crude Palm Oil (CME)', unit: 'USD/t' },
    lead: { symbol: 'ZL=F', name: 'Soybean Oil', unit: 'USc/lb', relation: 'leading' },
    fx:   { symbol: 'USDMYR=X', name: 'USD/MYR' },
  },
  gold: {
    key: 'gold', label: 'Gold', name: 'Emas',
    main: { symbol: 'GC=F', name: 'Gold Futures', unit: 'USD/oz' },
    lead: { symbol: 'DX-Y.NYB', name: 'US Dollar Index', unit: '', relation: 'inverse' },
    fx:   { symbol: 'USDMYR=X', name: 'USD/MYR' },
  },
}

async function fetchCandles(symbol, { range = '6mo', interval = '1d' } = {}) {
  const res = await fetch(`${YAHOO}/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`,
    isServer ? { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } } : undefined)
  if (!res.ok) throw new Error(`Yahoo ${symbol} ${res.status}`)
  const r = (await res.json())?.chart?.result?.[0]
  if (!r) throw new Error(`No data for ${symbol}`)
  const ts = r.timestamp || [], q = r.indicators?.quote?.[0] || {}
  return ts.map((t, i) => ({ time: t * 1000, close: q.close?.[i], high: q.high?.[i], low: q.low?.[i], volume: q.volume?.[i] }))
    .filter(c => c.close != null)
}

const pct = (candles) => {
  if (!candles || candles.length < 2) return null
  const a = candles[candles.length - 2].close, b = candles[candles.length - 1].close
  return Number((((b - a) / a) * 100).toFixed(2))
}

export async function getCommoditySnapshot(key, { interval = '1d', range } = {}) {
  const c = COMMODITIES[key]
  if (!c) throw new Error(`Unknown commodity: ${key}`)
  range = range || (interval === '1d' ? '6mo' : '5d')

  const [main, lead, fx] = await Promise.all([
    fetchCandles(c.main.symbol, { range, interval }).catch(() => null),
    fetchCandles(c.lead.symbol, { range, interval }).catch(() => null),
    fetchCandles(c.fx.symbol, { range, interval }).catch(() => null),
  ])

  // RM/gram for gold (USD/oz → RM/g): price * usdmyr / 31.1035
  let rmPerGram = null
  if (key === 'gold' && main?.length && fx?.length) {
    rmPerGram = Number(((main.at(-1).close * fx.at(-1).close) / 31.1035).toFixed(2))
  }

  return {
    key, asOf: new Date().toISOString(), interval,
    main: main ? { ...c.main, lastClose: main.at(-1).close, changePct: pct(main), indicators: analyzeSeries(main) } : { ...c.main, error: 'no data' },
    lead: lead ? { ...c.lead, lastClose: lead.at(-1).close, changePct: pct(lead) } : { ...c.lead, error: 'no data' },
    fx:   fx   ? { ...c.fx,   lastClose: fx.at(-1).close,   changePct: pct(fx) }   : { ...c.fx,   error: 'no data' },
    rmPerGram,
  }
}
