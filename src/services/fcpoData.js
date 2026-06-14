// FCPO data layer — pulls palm-oil-complex prices via the existing Yahoo proxy.
// Free data. CPO=F (CME USD Malaysian Crude Palm Oil) tracks Bursa FCPO;
// ZL=F (soybean oil) is the #1 leading indicator; USDMYR=X for the ringgit leg.
import { analyzeSeries } from './indicators'

const YAHOO = '/api/yahoo/v8/finance/chart'

export const FCPO_SYMBOLS = {
  fcpo: { symbol: 'CPO=F', name: 'Crude Palm Oil (CME USD)', unit: 'USD/t' },
  soy:  { symbol: 'ZL=F',  name: 'Soybean Oil (CBOT)',       unit: 'USc/lb' },
  myr:  { symbol: 'USDMYR=X', name: 'USD/MYR',               unit: '' },
}

// Fetch one symbol's candles. interval: '1d' (swing/EOD) or '15m'/'5m' (intraday, ~15min delayed).
export async function fetchCandles(symbol, { range = '6mo', interval = '1d' } = {}) {
  const url = `${YAHOO}/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Yahoo ${symbol} ${res.status}`)
  const json = await res.json()
  const r = json?.chart?.result?.[0]
  if (!r) throw new Error(`No data for ${symbol}`)
  const ts = r.timestamp || []
  const q = r.indicators?.quote?.[0] || {}
  const candles = ts.map((t, i) => ({
    time: t * 1000,
    close: q.close?.[i],
    high: q.high?.[i],
    low: q.low?.[i],
    volume: q.volume?.[i],
  })).filter(c => c.close != null)
  return { meta: r.meta, candles }
}

// Pull the whole palm-oil complex + computed indicators in one shot.
export async function getFcpoSnapshot({ interval = '1d', range = '6mo' } = {}) {
  const [fcpo, soy, myr] = await Promise.all([
    fetchCandles(FCPO_SYMBOLS.fcpo.symbol, { range, interval }).catch(e => ({ error: e.message })),
    fetchCandles(FCPO_SYMBOLS.soy.symbol, { range, interval }).catch(e => ({ error: e.message })),
    fetchCandles(FCPO_SYMBOLS.myr.symbol, { range, interval }).catch(e => ({ error: e.message })),
  ])

  const pct = (c) => {
    if (!c?.candles || c.candles.length < 2) return null
    const a = c.candles[c.candles.length - 2].close, b = c.candles[c.candles.length - 1].close
    return Number((((b - a) / a) * 100).toFixed(2))
  }

  return {
    asOf: new Date().toISOString(),
    interval,
    fcpo: fcpo.candles ? { ...FCPO_SYMBOLS.fcpo, lastClose: fcpo.candles.at(-1).close, changePct: pct(fcpo), indicators: analyzeSeries(fcpo.candles) } : { ...FCPO_SYMBOLS.fcpo, error: fcpo.error },
    soy:  soy.candles  ? { ...FCPO_SYMBOLS.soy,  lastClose: soy.candles.at(-1).close,  changePct: pct(soy),  indicators: analyzeSeries(soy.candles) }  : { ...FCPO_SYMBOLS.soy,  error: soy.error },
    myr:  myr.candles  ? { ...FCPO_SYMBOLS.myr,  lastClose: myr.candles.at(-1).close,  changePct: pct(myr) }  : { ...FCPO_SYMBOLS.myr,  error: myr.error },
  }
}
