// Frontend read helper for TradeRadar sentiment history (dashboard).
// Anon read only — writes happen server-side in the cron (service key).
// Zero dependency: talks to Supabase REST directly.
const URL_ = import.meta.env?.VITE_SUPABASE_URL
const ANON = import.meta.env?.VITE_SUPABASE_ANON_KEY

export function isConfigured() {
  return Boolean(URL_ && ANON)
}

export async function getRecentSentiment({ module, session, limit = 30 } = {}) {
  if (!isConfigured()) return []
  const params = new URLSearchParams({ select: '*', order: 'created_at.desc', limit: String(limit) })
  if (module) params.set('module', `eq.${module}`)
  if (session) params.set('session', `eq.${session}`)
  const res = await fetch(`${URL_}/rest/v1/traderadar_sentiment_logs?${params}`, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
  })
  if (!res.ok) return []
  return res.json()
}

// Latest cron run — all module rows sharing the most recent timestamp,
// plus the session-level analysis + Focus Harian list. Free (Supabase read).
export async function getLatestRun() {
  if (!isConfigured()) return null
  const params = new URLSearchParams({ select: '*', order: 'created_at.desc', limit: '16' })
  const res = await fetch(`${URL_}/rest/v1/traderadar_sentiment_logs?${params}`, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
  })
  if (!res.ok) return null
  const rows = await res.json()
  if (!rows.length) return null
  const latestTs = rows[0].created_at
  const modules = rows.filter(r => r.created_at === latestTs)
  const first = modules[0] || {}
  return {
    created_at: latestTs,
    session: first.session,
    modules,
    analysis: first.raw_data?.analysis || null,
    focus: first.raw_data?.focus || [],
  }
}

export async function getWatchlist(assetClass) {
  if (!isConfigured()) return []
  const params = new URLSearchParams({ select: '*', is_active: 'eq.true', order: 'created_at.asc' })
  if (assetClass) params.set('asset_class', `eq.${assetClass}`)
  const res = await fetch(`${URL_}/rest/v1/traderadar_watchlist?${params}`, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
  })
  if (!res.ok) return []
  return res.json()
}
