// TradeRadar orchestrator (Vercel Cron / external cron).
// Flow:  scores → news headlines → Claude synthesis (STRUCTURED JSON) →
//        Telegram + Supabase.
//
// Sessions (see vercel.json crons / TRADERADAR-SETUP.md):
//   ?session=morning  → Global + Bursa + Crypto      (08:45 MYT / 00:45 UTC)
//   ?session=fcpo     → FCPO pre-market              (10:00 MYT / 02:00 UTC)
//   ?session=evening  → Global + Crypto              (20:30 MYT / 12:30 UTC)
//
// Auth: set CRON_SECRET. Vercel Cron sends `Authorization: Bearer <secret>`;
// manual/external trigger appends `?secret=<secret>`.
import { getAllModules } from '../src/services/sentimentEngine.js'
import { getHeadlines } from '../src/services/news.js'
import { screenSymbols } from '../src/services/screener.js'
import { MODULES } from '../src/services/marketAssets.js'
import { sendTelegram } from './telegram.js'

const MODEL = 'claude-opus-4-8'   // top-tier reasoning for the analysis ($5/$25 per M)
const DISCLAIMER = 'Educational purpose only. Bukan nasihat kewangan.'

const SESSIONS = {
  morning: { title: 'MORNING SENTIMENT', modules: ['global', 'bursa', 'crypto'] },
  fcpo: { title: 'FCPO PRE-MARKET', modules: ['fcpo'] },
  evening: { title: 'US / GLOBAL EVENING WATCH', modules: ['global', 'crypto'] },
}

// PHASE 1 — Structured output. Forces Claude to return consistent, storable fields
// instead of a freeform paragraph (JSON-schema constrained; Sonnet 5).
const ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    overall_bias: { type: 'string', enum: ['Risk-On', 'Mild Risk-On', 'Neutral', 'Mild Risk-Off', 'Risk-Off'] },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    summary: { type: 'string' },
    catalysts: { type: 'array', items: { type: 'string' } },
    focus: { type: 'array', items: { type: 'string' } },
    cautions: { type: 'array', items: { type: 'string' } },
  },
  required: ['overall_bias', 'confidence', 'summary', 'catalysts', 'focus', 'cautions'],
}

const GAUGE = { Strong: '🟢🟢', Bullish: '🟢', Neutral: '⚪', Bearish: '🔴', Weak: '🔴🔴' }
const gauge = label => GAUGE[label] || '⚪'
const fmtPct = p => (p == null ? '—' : p >= 0 ? `+${p}%` : `${p}%`)
const BIAS_EMOJI = { 'Risk-On': '🟢', 'Mild Risk-On': '🟢', Neutral: '⚪', 'Mild Risk-Off': '🔴', 'Risk-Off': '🔴' }
const fmtList = arr => (arr || []).map(x => `• ${x}`).join('\n')

// ---- Per-module block (deterministic, always works — RM0) ----
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

// #3 — rank the session's basket symbols by opportunity score (screener.js).
async function topSetups(moduleKeys, n = 3) {
  const symbols = moduleKeys.flatMap(k => (MODULES[k]?.driver === 'basket' ? MODULES[k].symbols : []))
  if (symbols.length < 2) return []
  return screenSymbols(symbols, { top: n }).catch(() => [])
}

function buildMessage(session, data, { analysis, headlines, setups }) {
  const s = SESSIONS[session]
  const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16)
  const head = `📡 *TRADERADAR ${s.title}*\n_${stamp} UTC_`
  const body = data.modules.map(fmtModule).join('\n\n')

  let setupBlock = ''
  if (setups?.length >= 2) {
    setupBlock = '\n\n🎯 *Top Setups* _(calon momentum — sahkan sendiri)_\n' +
      setups.map((s2, i) => {
        const chg = s2.changePct != null ? ` (${fmtPct(s2.changePct)})` : ''
        const why = s2.reasons?.length ? `\n   _${s2.reasons.slice(0, 2).join(' · ')}_` : ''
        return `${i + 1}. *${s2.name}* — skor ${s2.opportunityScore}${chg}${why}`
      }).join('\n')
  }

  let insight = ''
  if (analysis) {
    // Real mode — AI synthesis (structured).
    insight = `\n\n🎯 *Overall: ${analysis.overall_bias}* ${BIAS_EMOJI[analysis.overall_bias] || ''} _(confidence: ${analysis.confidence})_\n${analysis.summary}`
    if (analysis.catalysts?.length) insight += `\n\n📰 *Catalyst*\n${fmtList(analysis.catalysts)}`
    if (analysis.focus?.length) insight += `\n\n🔍 *Fokus*\n${fmtList(analysis.focus)}`
    if (analysis.cautions?.length) insight += `\n\n⚠️ *Awas*\n${fmtList(analysis.cautions)}`
  } else if (headlines?.length) {
    // Demo mode (no Claude key) — still show raw headlines; news is free.
    insight = `\n\n📰 *Tajuk Berita*\n${headlines.slice(0, 5).map(h => `• ${h.title} _(${h.source})_`).join('\n')}`
  }
  return `${head}\n\n${body}${setupBlock}${insight}\n\n_${DISCLAIMER}_`
}

// ---- PHASE 2 — Claude reads scores + headlines → structured catalyst analysis ----
async function claudeAnalysis(data, headlines) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return null
  const compact = data.modules.map(m => ({
    label: m.label,
    overall: m.overall,
    top: (m.items || []).slice(0, 3).map(i => ({ n: i.name, s: i.score, c: i.changePct })),
  }))
  const news = (headlines || []).map(h => `- ${h.title} (${h.source})`).join('\n') || '(tiada berita)'
  const prompt = `Anda penganalisis pasaran untuk pasukan trader Malaysia. Berdasarkan SKOR SENTIMEN teknikal + TAJUK BERITA di bawah, hasilkan analisis ringkas dalam Bahasa Melayu.

Peraturan:
- "catalysts": ekstrak 2-4 pemacu SEBENAR dari TAJUK BERITA (bukan teknikal). Kalau tiada berita relevan, pulangkan array kosong.
- "summary": 2-3 ayat nada pasaran keseluruhan.
- "focus": 2-3 perkara nak dipantau.
- "cautions": 1-3 risiko/amaran; guna bahasa selamat ("valid jika...", "elakkan chase").
- JANGAN reka nombor atau berita — rujuk data yang diberi sahaja.

SKOR SENTIMEN:
${JSON.stringify(compact)}

TAJUK BERITA HARI INI:
${news}`
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 900,
        thinking: { type: 'disabled' },
        output_config: { format: { type: 'json_schema', schema: ANALYSIS_SCHEMA } },
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const d = await r.json()
    if (!r.ok || d.stop_reason === 'refusal') return null
    const text = (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('')
    return JSON.parse(text)   // structured output → the text block IS the JSON
  } catch {
    return null   // any failure → deterministic message still ships
  }
}

// ---- Supabase log (service key bypasses RLS) ----
async function logToSupabase(session, data, analysis, headlines) {
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
      drivers: analysis?.focus || null,
      risks: analysis?.cautions || null,
      claude_summary: analysis?.summary || null,
      raw_data: { items: m.items, analysis: analysis || null, headlines: (headlines || []).slice(0, 8) },
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
    const mods = SESSIONS[session].modules
    const [data, headlines, setups] = await Promise.all([
      getAllModules(mods),
      getHeadlines(mods).catch(() => []),
      topSetups(mods),
    ])
    const analysis = await claudeAnalysis(data, headlines)
    const message = buildMessage(session, data, { analysis, headlines, setups })

    const errors = []
    let saved = null, sent = false
    try { saved = await logToSupabase(session, data, analysis, headlines) } catch (e) { errors.push(`supabase: ${e.message}`) }
    try { await sendTelegram(message); sent = true } catch (e) { errors.push(`telegram: ${e.message}`) }

    return res.status(200).json({
      ok: true,
      session,
      demo: !process.env.ANTHROPIC_API_KEY,
      structured: !!analysis,
      headlines: headlines.length,
      setups: setups.length,
      modules: data.modules.map(m => ({ module: m.module, sentiment: m.overall?.label || m.error })),
      saved, sent, errors,
      preview: message,
    })
  } catch (e) {
    return res.status(500).json({ error: 'cron failed', message: e.message })
  }
}
