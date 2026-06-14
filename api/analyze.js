// Vercel Serverless Function — FCPO AI analysis.
// DEMO MODE (no ANTHROPIC_API_KEY): returns a templated report from real computed
// numbers — full product flow at zero cost. REAL MODE (key set): calls Claude.
// Set a hard spend cap in the Anthropic console so cost can never surprise you.

const MODEL = 'claude-sonnet-4-6'        // cost/quality balance for a daily report
const DISCLAIMER = 'Analisis automatik untuk tujuan pendidikan. BUKAN nasihat pelaburan. Dagang atas risiko sendiri.'

const fmt = (n) => (n == null ? 'n/a' : n)

function buildDemoReport(snap) {
  const f = snap.fcpo || {}, soy = snap.soy || {}, myr = snap.myr || {}
  const ind = f.indicators || {}
  const dir = (ind.score ?? 50) >= 55 ? 'condong NAIK' : (ind.score ?? 50) <= 45 ? 'condong TURUN' : 'NEUTRAL'
  const soyDir = (soy.changePct ?? 0) >= 0 ? 'naik' : 'turun'
  const myrNote = (myr.changePct ?? 0) > 0 ? 'MYR lemah (USD naik) — biasanya sokong harga FCPO dalam RM' : 'MYR kukuh (USD turun) — tekanan ke atas FCPO dalam RM'
  return `## Laporan FCPO Harian — ${new Date(snap.asOf).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}

**Skor: ${fmt(ind.score)}/100 — ${fmt(ind.label)}** · Harga: ${fmt(f.lastClose)} ${f.unit || ''} (${(f.changePct ?? 0) >= 0 ? '+' : ''}${fmt(f.changePct)}%)

### 📊 Bottom line
Pasaran sawit ${dir}. Trend **${fmt(ind.trend)}** (harga ${ind.price > ind.sma20 ? 'atas' : 'bawah'} MA20 ${fmt(ind.sma20)}, ${ind.price > ind.sma50 ? 'atas' : 'bawah'} MA50 ${fmt(ind.sma50)}). RSI **${fmt(ind.rsi)}** ${ind.rsi > 70 ? '(overbought — hati-hati pullback)' : ind.rsi < 30 ? '(oversold — peluang bounce)' : '(zon neutral)'}, MACD **${ind.macd?.crossing}**.

### 🌱 Soybean Oil (leading indicator)
ZL=F ${soyDir} ${(soy.changePct ?? 0) >= 0 ? '+' : ''}${fmt(soy.changePct)}% — sawit biasanya ikut arah soybean oil. ${soyDir === 'naik' ? 'Sentimen kompleks minyak sayuran positif.' : 'Tekanan dari kompleks minyak sayuran.'}

### 💱 Ringgit
USD/MYR ${fmt(myr.lastClose)} (${(myr.changePct ?? 0) >= 0 ? '+' : ''}${fmt(myr.changePct)}%). ${myrNote}.

### 🧱 Floor & Ceiling
Support **${fmt(ind.support)}** · Resistance **${fmt(ind.resistance)}**. Julat statistik minggu depan: **${fmt(ind.projectedWeekRange?.low)} – ${fmt(ind.projectedWeekRange?.high)}**. Volatiliti tahunan ~${fmt(ind.annualizedVolatilityPct)}%.

### 👀 Watch minggu ni
- Arah **soybean oil** (ZL=F) — pemandu utama
- **MYR** — kelemahan ringgit sokong FCPO
- Tahap **${fmt(ind.support)}** (support) & **${fmt(ind.resistance)}** (resistance) — breakout/breakdown
- Data **MPOB** (stok/eksport) bulanan + dasar biodiesel Indonesia

---
*${DISCLAIMER}*`
}

function buildPrompt(snap) {
  return `Anda penganalisis pasaran minyak sawit mentah (FCPO) untuk trader Malaysia. Berdasarkan data dikira di bawah, hasilkan laporan harian RINGKAS dalam Bahasa Melayu (markdown), nada profesional tapi mudah faham. Wajib ada: Bottom line (1-2 ayat), Teknikal (trend/RSI/MACD), kaitan Soybean Oil (leading indicator), kesan Ringgit, Floor & Ceiling (support/resistance + julat minggu), dan "Watch minggu ni" (3-4 poin termasuk faktor fundamental: MPOB stok/eksport, dasar biodiesel Indonesia, permintaan India/China, cuaca). Jangan reka nombor — guna yang diberi. Akhiri dengan disclaimer "BUKAN nasihat pelaburan".

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
  try {
    snap = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }
  if (!snap?.fcpo) return res.status(400).json({ error: 'Missing fcpo snapshot' })

  const score = snap.fcpo?.indicators?.score ?? null
  const label = snap.fcpo?.indicators?.label ?? null
  const key = process.env.ANTHROPIC_API_KEY

  // DEMO MODE — no key, no cost
  if (!key) {
    return res.status(200).json({
      demo: true, model: null, score, label,
      reportMarkdown: buildDemoReport(snap),
      generatedAt: new Date().toISOString(), disclaimer: DISCLAIMER,
    })
  }

  // REAL MODE — call Claude
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 3000,
        messages: [{ role: 'user', content: buildPrompt(snap) }],
      }),
    })
    const data = await r.json()
    if (!r.ok) return res.status(502).json({ error: 'Claude API error', detail: data })
    if (data.stop_reason === 'refusal') {
      return res.status(200).json({ demo: false, model: MODEL, score, label, reportMarkdown: buildDemoReport(snap), note: 'AI declined; showing computed report.', disclaimer: DISCLAIMER })
    }
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n')
    return res.status(200).json({
      demo: false, model: MODEL, score, label,
      reportMarkdown: text || buildDemoReport(snap),
      usage: data.usage, generatedAt: new Date().toISOString(), disclaimer: DISCLAIMER,
    })
  } catch (e) {
    return res.status(500).json({ error: 'analyze failed', message: e.message })
  }
}
