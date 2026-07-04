// Vercel Serverless Function — Commodity AI analysis (FCPO + Gold).
// DEMO MODE (no ANTHROPIC_API_KEY): templated report from real numbers, zero cost.
// REAL MODE (key set): Claude Sonnet 4.6. Set a hard spend cap in the console.
import { buildDemoReport, DISCLAIMER } from '../src/services/commodityReportTemplate.js'

const MODEL = 'claude-sonnet-5'   // cost/quality balance for a daily report (intro $2/$10 per M)

function buildPrompt(snap) {
  const gold = snap.key === 'gold'
  const subject = gold ? 'emas (Gold futures)' : 'minyak sawit mentah (FCPO)'
  const factors = gold
    ? 'US Dollar Index (DXY, korelasi songsang), real yields/Fed, geopolitik, pembelian bank pusat, dan USD/MYR untuk harga RM/gram'
    : 'soybean oil (ZL=F, leading indicator), USD/MYR, data MPOB (stok/eksport), dasar biodiesel Indonesia (B40), permintaan India/China, cuaca'
  return `Anda penganalisis komoditi ${subject} untuk trader Malaysia. Hasilkan laporan harian RINGKAS dalam Bahasa Melayu (markdown), profesional tapi mudah faham. Wajib ada: Bottom line (1-2 ayat), Teknikal (trend/RSI/MACD), pemacu utama (${factors}), Floor & Ceiling (support/resistance + julat minggu), dan "Watch minggu ni" (3-4 poin). Jangan reka nombor — guna yang diberi. Akhiri dengan disclaimer "BUKAN nasihat pelaburan".

DATA:
${JSON.stringify(snap, null, 2)}`
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  let snap
  try { snap = typeof req.body === 'string' ? JSON.parse(req.body) : req.body } catch { return res.status(400).json({ error: 'Invalid JSON body' }) }
  if (!snap?.main) return res.status(400).json({ error: 'Missing commodity snapshot' })

  const score = snap.main?.indicators?.score ?? null
  const label = snap.main?.indicators?.label ?? null
  const key = process.env.ANTHROPIC_API_KEY

  if (!key) {
    return res.status(200).json({ demo: true, model: null, score, label, reportMarkdown: buildDemoReport(snap), generatedAt: new Date().toISOString(), disclaimer: DISCLAIMER })
  }

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      // thinking disabled: a narrative from given numbers needs no deep reasoning,
      // and on Sonnet 5 adaptive thinking is ON by default → would eat the token budget.
      body: JSON.stringify({ model: MODEL, max_tokens: 3000, thinking: { type: 'disabled' }, messages: [{ role: 'user', content: buildPrompt(snap) }] }),
    })
    const data = await r.json()
    if (!r.ok) return res.status(502).json({ error: 'Claude API error', detail: data })
    if (data.stop_reason === 'refusal') {
      return res.status(200).json({ demo: false, model: MODEL, score, label, reportMarkdown: buildDemoReport(snap), note: 'AI declined; showing computed report.', disclaimer: DISCLAIMER })
    }
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n')
    return res.status(200).json({ demo: false, model: MODEL, score, label, reportMarkdown: text || buildDemoReport(snap), usage: data.usage, generatedAt: new Date().toISOString(), disclaimer: DISCLAIMER })
  } catch (e) {
    return res.status(500).json({ error: 'analyze failed', message: e.message })
  }
}
