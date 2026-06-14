// FCPO / stock technical indicator engine — pure JS, no dependencies, no API cost.
// Feeds computed numbers to the AI report (api/analyze.js) and the UI panel.
// Input: an array of daily/intraday candles { close, high, low, volume } oldest→newest.

const last = (a) => a[a.length - 1]
const round = (n, d = 2) => (n == null || isNaN(n) ? null : Number(n.toFixed(d)))

export function sma(values, period) {
  if (values.length < period) return null
  const slice = values.slice(-period)
  return slice.reduce((s, v) => s + v, 0) / period
}

export function ema(values, period) {
  if (values.length < period) return null
  const k = 2 / (period + 1)
  let e = values.slice(0, period).reduce((s, v) => s + v, 0) / period
  for (let i = period; i < values.length; i++) e = values[i] * k + e * (1 - k)
  return e
}

// Wilder's RSI
export function rsi(values, period = 14) {
  if (values.length < period + 1) return null
  let gain = 0, loss = 0
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1]
    if (d >= 0) gain += d; else loss -= d
  }
  let avgG = gain / period, avgL = loss / period
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1]
    avgG = (avgG * (period - 1) + (d > 0 ? d : 0)) / period
    avgL = (avgL * (period - 1) + (d < 0 ? -d : 0)) / period
  }
  if (avgL === 0) return 100
  const rs = avgG / avgL
  return 100 - 100 / (1 + rs)
}

export function macd(values, fast = 12, slow = 26, signal = 9) {
  if (values.length < slow + signal) return null
  // build MACD line series, then signal EMA
  const macdSeries = []
  for (let i = slow; i <= values.length; i++) {
    const win = values.slice(0, i)
    macdSeries.push(ema(win, fast) - ema(win, slow))
  }
  const signalLine = ema(macdSeries, signal)
  const macdLine = last(macdSeries)
  return { macd: macdLine, signal: signalLine, histogram: macdLine - signalLine }
}

// Annualized volatility from daily log returns (252 trading days)
export function annualizedVolatility(values) {
  if (values.length < 2) return null
  const rets = []
  for (let i = 1; i < values.length; i++) rets.push(Math.log(values[i] / values[i - 1]))
  const mean = rets.reduce((s, v) => s + v, 0) / rets.length
  const variance = rets.reduce((s, v) => s + (v - mean) ** 2, 0) / (rets.length - 1)
  return Math.sqrt(variance) * Math.sqrt(252) * 100 // percent
}

export function dailyStdev(values) {
  if (values.length < 2) return null
  const rets = []
  for (let i = 1; i < values.length; i++) rets.push((values[i] - values[i - 1]) / values[i - 1])
  const mean = rets.reduce((s, v) => s + v, 0) / rets.length
  const variance = rets.reduce((s, v) => s + (v - mean) ** 2, 0) / (rets.length - 1)
  return Math.sqrt(variance)
}

// Nearest support/resistance from recent swing pivots
export function supportResistance(highs, lows, lookback = 60) {
  const h = highs.slice(-lookback), l = lows.slice(-lookback)
  return { resistance: Math.max(...h), support: Math.min(...l) }
}

// Statistical 1-week (5 trading day) projected range around last close
export function projectedRange(closes) {
  const price = last(closes)
  const sd = dailyStdev(closes)
  if (sd == null) return null
  const move = price * sd * Math.sqrt(5)
  return { low: price - move, high: price + move }
}

// Composite 0–100 score with label
export function compositeScore({ price, sma20, sma50, rsiVal, hist }) {
  let score = 50
  if (sma20 != null) score += price > sma20 ? 12 : -12
  if (sma50 != null) score += price > sma50 ? 12 : -12
  if (rsiVal != null) {
    if (rsiVal > 70) score += 4       // strong but overbought
    else if (rsiVal > 55) score += 12
    else if (rsiVal < 30) score -= 4  // weak but oversold (possible bounce)
    else if (rsiVal < 45) score -= 12
  }
  if (hist != null) score += hist > 0 ? 12 : -12
  score = Math.max(0, Math.min(100, Math.round(score)))
  const label = score >= 70 ? 'Strong' : score >= 55 ? 'Bullish' : score >= 45 ? 'Neutral' : score >= 30 ? 'Bearish' : 'Weak'
  return { score, label }
}

// One call → all indicators for a symbol's candle series
export function analyzeSeries(candles) {
  const closes = candles.map(c => c.close).filter(v => v != null)
  const highs = candles.map(c => c.high ?? c.close)
  const lows = candles.map(c => c.low ?? c.close)
  if (closes.length < 30) return { error: 'insufficient data (need ≥30 candles)' }

  const price = last(closes)
  const s20 = sma(closes, 20), s50 = sma(closes, 50)
  const rsiVal = rsi(closes, 14)
  const m = macd(closes)
  const vol = annualizedVolatility(closes.slice(-30))
  const sr = supportResistance(highs, lows)
  const proj = projectedRange(closes.slice(-30))
  const yrHigh = Math.max(...closes.slice(-252))
  const yrLow = Math.min(...closes.slice(-252))
  const { score, label } = compositeScore({ price, sma20: s20, sma50: s50, rsiVal, hist: m?.histogram })

  return {
    price: round(price),
    sma20: round(s20), sma50: round(s50),
    trend: s20 != null && s50 != null ? (price > s20 && price > s50 ? 'uptrend' : price < s20 && price < s50 ? 'downtrend' : 'mixed') : 'n/a',
    rsi: round(rsiVal, 1),
    macd: m ? { macd: round(m.macd, 3), signal: round(m.signal, 3), histogram: round(m.histogram, 3), crossing: m.histogram > 0 ? 'bullish' : 'bearish' } : null,
    annualizedVolatilityPct: round(vol, 1),
    support: round(sr.support), resistance: round(sr.resistance),
    week52High: round(yrHigh), week52Low: round(yrLow),
    nearYearHigh: yrHigh ? round((price / yrHigh) * 100, 1) : null, // % of 52w high
    projectedWeekRange: proj ? { low: round(proj.low), high: round(proj.high) } : null,
    score, label,
  }
}
