// Sentiment engine — turns raw candles into per-module + overall sentiment.
// Reuses the existing indicator engine (analyzeSeries) and commodity snapshot
// so scoring is identical across the web dashboard and the Telegram bot.
import { getCandles, lastChange } from './dataSource.js'
import { analyzeSeries } from './indicators.js'
import { getCommoditySnapshot } from './commodityData.js'
import { MODULES } from './marketAssets.js'

// Same thresholds as compositeScore() in indicators.js — kept in sync.
export function labelFor(score) {
  if (score == null) return 'No data'
  return score >= 70 ? 'Strong' : score >= 55 ? 'Bullish' : score >= 45 ? 'Neutral' : score >= 30 ? 'Bearish' : 'Weak'
}

async function scoreSymbol(s, opts) {
  const candles = await getCandles({ symbol: s.ticker, source: s.source, ...opts }).catch(() => null)
  if (!candles || candles.length < 30) return { ticker: s.ticker, name: s.name, role: s.role, sector: s.sector, error: 'no data' }
  const ind = analyzeSeries(candles)
  const { last, changePct } = lastChange(candles)
  // Inverted gauges (e.g. VIX): a high reading = risk-off = bearish for the tape.
  const score = s.invert && typeof ind.score === 'number' ? 100 - ind.score : ind.score
  return {
    ticker: s.ticker, name: s.name, role: s.role, sector: s.sector,
    last, changePct, score, label: labelFor(score), rsi: ind.rsi, trend: ind.trend,
  }
}

function aggregate(items) {
  const valid = items.filter(i => typeof i.score === 'number')
  if (!valid.length) return { score: null, label: 'No data' }
  const score = Math.round(valid.reduce((a, b) => a + b.score, 0) / valid.length)
  return { score, label: labelFor(score) }
}

export async function getModuleSnapshot(moduleKey, opts = {}) {
  const m = MODULES[moduleKey]
  if (!m) throw new Error(`Unknown module: ${moduleKey}`)

  // FCPO (and any future commodity module) → existing commodity engine.
  if (m.driver === 'commodity') {
    const snap = await getCommoditySnapshot(m.commodityKey, opts)
    const ind = snap.main?.indicators || {}
    return {
      module: moduleKey, label: m.label, emoji: m.emoji, asOf: snap.asOf,
      overall: { score: ind.score ?? null, label: ind.label ?? 'No data' },
      items: [
        { ticker: snap.main.symbol, name: snap.main.name, last: snap.main.lastClose, changePct: snap.main.changePct, score: ind.score, label: ind.label, rsi: ind.rsi, trend: ind.trend },
        { ticker: snap.lead.symbol, name: snap.lead.name, last: snap.lead.lastClose, changePct: snap.lead.changePct, role: 'leading' },
        { ticker: snap.fx.symbol, name: snap.fx.name, last: snap.fx.lastClose, changePct: snap.fx.changePct, role: 'fx' },
      ],
      levels: ind.support != null ? { support: ind.support, resistance: ind.resistance, projected: ind.projectedWeekRange } : null,
      raw: snap,
    }
  }

  // Basket modules (global / bursa / crypto) → score each symbol, then average.
  const items = await Promise.all(m.symbols.map(s => scoreSymbol(s, opts)))
  return { module: moduleKey, label: m.label, emoji: m.emoji, asOf: new Date().toISOString(), overall: aggregate(items), items }
}

// Fetch several modules at once; a failing module degrades to { error } rather
// than sinking the whole report.
export async function getAllModules(keys = ['global', 'bursa', 'fcpo', 'crypto'], opts = {}) {
  const modules = await Promise.all(
    keys.map(k => getModuleSnapshot(k, opts).catch(e => ({ module: k, label: k, error: e.message }))),
  )
  return { asOf: new Date().toISOString(), modules }
}
