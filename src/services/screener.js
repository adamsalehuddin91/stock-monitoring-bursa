// Stock screener — ranks a symbol list by a composite "opportunity score"
// built from the shared indicator engine. Surfaces momentum CANDIDATES worth
// investigating — NOT buy signals. Score is trend-weighted (a single green day
// won't flip a downtrend), so read it as "where to look", then confirm on chart.
import { getCandles, lastChange } from './dataSource.js'
import { analyzeSeries } from './indicators.js'

// Latest volume vs the average of the prior `lookback` bars. 1.0 = normal, 2.0 = double.
function volumeSpike(candles, lookback = 20) {
  const vols = candles.map(c => c.volume).filter(v => Number.isFinite(v) && v > 0)
  if (vols.length < lookback + 1) return null
  const recent = vols[vols.length - 1]
  const avg = vols.slice(-lookback - 1, -1).reduce((a, b) => a + b, 0) / lookback
  if (!avg) return null
  return Number((recent / avg).toFixed(2))
}

// Long-bias momentum screen: engine composite (trend/RSI/MACD) + volume confirmation
// + breakout proximity, minus an overbought/weak-volume penalty. Returns score + reasons.
function opportunityScore(ind, vs) {
  let score = ind.score ?? 50
  const reasons = []

  if (ind.trend === 'uptrend') reasons.push('uptrend (atas SMA20+50)')
  if (ind.macd?.crossing === 'bullish') reasons.push('MACD bullish')

  if (vs != null) {
    if (vs >= 2) { score += 10; reasons.push(`volume spike ${vs}×`) }
    else if (vs >= 1.3) { score += 5; reasons.push(`volume naik ${vs}×`) }
    else if (vs < 0.7) { score -= 8; reasons.push('volume lemah') }
  }

  if (ind.nearYearHigh != null) {
    if (ind.nearYearHigh >= 95) { score += 8; reasons.push(`dekat 52w high (${ind.nearYearHigh}%)`) }
    else if (ind.nearYearHigh <= 40) { score -= 5; reasons.push('jauh bawah 52w high') }
  }

  if (ind.rsi != null && ind.rsi > 78) { score -= 8; reasons.push(`RSI overbought (${ind.rsi})`) }

  score = Math.max(0, Math.min(100, Math.round(score)))
  return { score, reasons }
}

async function screenOne(item, opts) {
  const candles = await getCandles({ symbol: item.ticker, source: item.source || 'yahoo', ...opts }).catch(() => null)
  if (!candles || candles.length < 30) return { ...item, error: 'no data' }
  const ind = analyzeSeries(candles)
  const { last, changePct } = lastChange(candles)
  const vs = volumeSpike(candles)
  const { score, reasons } = opportunityScore(ind, vs)
  return {
    ticker: item.ticker, name: item.name, sector: item.sector,
    last, changePct, opportunityScore: score,
    trend: ind.trend, rsi: ind.rsi, volumeSpike: vs,
    support: ind.support, resistance: ind.resistance,
    nearYearHigh: ind.nearYearHigh, reasons,
  }
}

// Screen a list → ranked candidates (highest opportunity first), top N.
// `list` items: { ticker, name?, source?, sector? }.
export async function screenSymbols(list, { top = 10, interval, range } = {}) {
  const scored = await Promise.all(list.map(i => screenOne(i, { interval, range })))
  return scored
    .filter(s => typeof s.opportunityScore === 'number')
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, top)
}
