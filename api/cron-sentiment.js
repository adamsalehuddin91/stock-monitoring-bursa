// TradeRadar orchestrator (Vercel Cron / external cron).
// Flow:  fetch modules → deterministic scoring → optional Claude narrative
//        → log to Supabase → push to Telegram.
//
// Sessions (see vercel.json crons / TRADERADAR-SETUP.md):
//   ?session=morning  → Global + Bursa + Crypto      (08:45 MYT / 00:45 UTC)
//   ?session=fcpo     → FCPO pre-market              (10:00 MYT / 02:00 UTC)
//   ?session=evening  → Global + Crypto              (20:30 MYT / 12:30 UTC)
//
// Auth: set CRON_SECRET. Vercel Cron sends it as `Authorization: Bearer <secret>`.
// Manual/external trigger: append `?secret=<secret>`.
import { getAllModules } from '../src/services/sentimentEngine.js'
import { sendTelegram } from './telegram.js'

const MODEL = 'claude-sonnet-4-6'
const DISCLAIMER = 'Educational purpose only. Bukan nasihat kewangan.'

const SESSIONS = {
  morning: { title: 'MORNING SENTIMENT', modules: ['global', 'bursa', 'crypto'] },
  fcpo: { title: 'FCPO PRE-MARKET', modules: ['fcpo'] },
  evening: { title: 'US / GLOBAL EVENING WATCH', modules: ['global', 'crypto'] },
}

const GAUGE = { Strong: '🟢🟢', Bullish: '🟢', Neutral: '⚪', Bearish: '🔴', Weak: '🔴🔴' }
const gauge = label => GAUGE[label] || '⚪'
const fmtPct = p => (p == null ? '—' : p >= 0 ? `+${p}%` : `${p}%`)

// ---- Telegram message (deterministic, always works — RM0) ----
function fmtModule(m) {
  if (m.error) return `${m.emoji || '•'} *${m.label}* — _data tak tersedia_`
  const lines = [`${m.emoji} *${m.label}* — ${m.overall.label} ${gauge(m.overall.label)}`]

  if (m.module === 'fcpo' && m.levels) {
    const main = m.items[0]
    lines.push(`Harga: ${main.last ?? '—'} (${fmtPct(main.changePct)})`)
    lines.push(`Support: ${m.levels.support}  |  Resistance: ${m.levels.resistance}`)
    if (m.levels.projected) lines.push(`Julat minggu: ${m.levels.projected.low} – ${m.levels.projected.high}`)
  } else {
    ;(m.items || [])
      .filter(i => typeof i.score === 'number')
      .slice(0, 4)
      .forEach(i => lines.push(`• ${i.name}: ${i.label} (${fmtPct(i.changePct)})`))
  }
  return lines.join('\n')
}

function buildMessage(session, data, overall) {
  const s = SESSIONS[session]
  const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16)
  const head = `📡 *TRADERADAR ${s.title}*\n_${stamp} UTC_`
  const body = data.modules.map(fmtModule).join('\n\n')
  const view = overall ? `\n\n🎯 *Overall View*\n${overall}` : ''
  return `${head}\n\n${body}${view}\n\n_${DISCLAIMER}_`
}

// ---- Optional Claude narrative (one short call; skipped when no key) ----
async function claudeOverall(data) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return null
  const compact = data.modules.map(m => ({
    label: m.label,
    overall: m.overall,
    top: (m.items || []).slice(0, 3).map(i => ({ n: i.name, s: i.score, c: i.changePct })),
  }))
  const prompt = `Anda penganalisis pasaran untuk trader Malaysia. Berdasarkan skor sentimen modul di bawah, tulis SATU perenggan "Overall View" ringkas (2-3 ayat) dalam Bahasa Melayu: nada pasaran keseluruhan + fokus atau amaran. Guna bahasa selamat (cth "bullish valid jika...", "elakkan chase candle pertama"). JANGAN reka nombor — rujuk data sahaja.\n\nDATA:\n${JSON.stringify(compact)}`
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 400, messages: [{ role: 'user', content: prompt }] }),
    })
    const d = await r.json()
    if (!r.ok || d.stop_reason === 'refusal') return null
    return (d.content || []).filter(b => b.type === 'text').map(b => b.text).join(' ').trim() || null
  } catch {
    return null
  }
}

// ---- Supabase log (REST, no dependency; service key bypasses RLS) ----
async function logToSupabase(session, data, overall) {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return { skipped: true, reason: 'SUPABASE_URL / SUPABASE_SERVICE_KEY not set' }
  const rows = data.modules
    .filter(m => !m.error)
    .map(m => ({
      session,
      module: m.module,
      asset_class: m.module,
      sentiment_score: m.overall?.score ?? null,
      sentiment_label: m.overall?.label ?? null,
      key_levels: m.levels || null,
      top_setups: (m.items || []).slice(0, 5),
      claude_summary: overall || null,
      raw_data: m.raw || { items: m.items },
    }))
  if (!rows.length) return { skipped: true, reason: 'no valid modules' }
  const res = await fetch(`${url}/rest/v1/traderadar_sentiment_logs`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'content-type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(rows),
  })
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`)
  return { ok: true, inserted: rows.length }
}

export default async function handler(req, res) {
  // --- auth ---
  const secret = process.env.CRON_SECRET
  if (secret) {
    const bearer = req.headers.authorization === `Bearer ${secret}`
    if (!bearer && req.query?.secret !== secret) return res.status(401).json({ error: 'unauthorized' })
  }

  const session = (req.query?.session || 'morning').toLowerCase()
  if (!SESSIONS[session]) return res.status(400).json({ error: `unknown session: ${session}`, valid: Object.keys(SESSIONS) })

  try {
    const data = await getAllModules(SESSIONS[session].modules)
    const overall = await claudeOverall(data)
    const message = buildMessage(session, data, overall)

    const errors = []
    let saved = null, sent = false
    try { saved = await logToSupabase(session, data, overall) } catch (e) { errors.push(`supabase: ${e.message}`) }
    try { await sendTelegram(message); sent = true } catch (e) { errors.push(`telegram: ${e.message}`) }

    return res.status(200).json({
      ok: true,
      session,
      demo: !process.env.ANTHROPIC_API_KEY,
      modules: data.modules.map(m => ({ module: m.module, sentiment: m.overall?.label || m.error })),
      saved, sent, errors,
      preview: message,
    })
  } catch (e) {
    return res.status(500).json({ error: 'cron failed', message: e.message })
  }
}
