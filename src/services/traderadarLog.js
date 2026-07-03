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
