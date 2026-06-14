// Shared demo-report template (FCPO + Gold) — used as the client fallback when
// /api/analyze isn't served (plain vite dev), and mirrors the server demo mode.
// Builds a useful report from REAL computed numbers — zero AI cost.

export const DISCLAIMER = 'Analisis automatik untuk tujuan pendidikan. BUKAN nasihat pelaburan. Dagang atas risiko sendiri.'
const f = (n) => (n == null ? 'n/a' : n)
const sign = (n) => `${(n ?? 0) >= 0 ? '+' : ''}${f(n)}`

function header(snap, title) {
  const m = snap.main || {}, ind = m.indicators || {}
  return `## ${title} — ${new Date(snap.asOf).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}

**Skor: ${f(ind.score)}/100 — ${f(ind.label)}** · Harga: ${f(m.lastClose)} ${m.unit || ''} (${sign(m.changePct)}%)`
}

function technicals(ind) {
  const dir = (ind.score ?? 50) >= 55 ? 'condong NAIK' : (ind.score ?? 50) <= 45 ? 'condong TURUN' : 'NEUTRAL'
  return `### 📊 Bottom line
Pasaran ${dir}. Trend **${f(ind.trend)}** (harga ${ind.price > ind.sma20 ? 'atas' : 'bawah'} MA20 ${f(ind.sma20)}, ${ind.price > ind.sma50 ? 'atas' : 'bawah'} MA50 ${f(ind.sma50)}). RSI **${f(ind.rsi)}** ${ind.rsi > 70 ? '(overbought — hati-hati pullback)' : ind.rsi < 30 ? '(oversold — peluang bounce)' : '(zon neutral)'}, MACD **${ind.macd?.crossing}**.`
}

function floorCeiling(ind) {
  return `### 🧱 Floor & Ceiling
Support **${f(ind.support)}** · Resistance **${f(ind.resistance)}**. Julat statistik minggu depan: **${f(ind.projectedWeekRange?.low)} – ${f(ind.projectedWeekRange?.high)}**. Volatiliti tahunan ~${f(ind.annualizedVolatilityPct)}%.`
}

function fcpoReport(snap) {
  const m = snap.main || {}, lead = snap.lead || {}, fx = snap.fx || {}, ind = m.indicators || {}
  const soyDir = (lead.changePct ?? 0) >= 0 ? 'naik' : 'turun'
  const myrNote = (fx.changePct ?? 0) > 0 ? 'MYR lemah (USD naik) — biasanya sokong harga FCPO dalam RM' : 'MYR kukuh (USD turun) — tekanan ke atas FCPO dalam RM'
  return `${header(snap, 'Laporan FCPO Harian')}

${technicals(ind)}

### 🌱 Soybean Oil (leading indicator)
ZL=F ${soyDir} ${sign(lead.changePct)}% — sawit biasanya ikut arah soybean oil. ${soyDir === 'naik' ? 'Sentimen kompleks minyak sayuran positif.' : 'Tekanan dari kompleks minyak sayuran.'}

### 💱 Ringgit
USD/MYR ${f(fx.lastClose)} (${sign(fx.changePct)}%). ${myrNote}.

${floorCeiling(ind)}

### 👀 Watch minggu ni
- Arah **soybean oil** (ZL=F) — pemandu utama
- **MYR** — kelemahan ringgit sokong FCPO
- Tahap **${f(ind.support)}** / **${f(ind.resistance)}** — breakout/breakdown
- Data **MPOB** (stok/eksport) + dasar biodiesel Indonesia (B40), permintaan India/China

---
*${DISCLAIMER}*`
}

function goldReport(snap) {
  const m = snap.main || {}, dxy = snap.lead || {}, fx = snap.fx || {}, ind = m.indicators || {}
  const dxyDir = (dxy.changePct ?? 0) >= 0 ? 'naik' : 'turun'
  const dxyNote = dxyDir === 'naik' ? 'USD kukuh — biasanya TEKAN emas (korelasi songsang)' : 'USD lemah — biasanya SOKONG emas'
  return `${header(snap, 'Laporan Emas Harian')}
${snap.rmPerGram ? `· **RM ${snap.rmPerGram}/gram** (999)` : ''}

${technicals(ind)}

### 💵 US Dollar Index (pemacu songsang)
DXY ${dxyDir} ${sign(dxy.changePct)}% (${f(dxy.lastClose)}). ${dxyNote}.

### 💱 Ringgit / harga RM
USD/MYR ${f(fx.lastClose)} (${sign(fx.changePct)}%). ${snap.rmPerGram ? `Emas 999 ≈ **RM ${snap.rmPerGram}/gram**. ` : ''}MYR lemah naikkan harga emas dalam RM walaupun USD/oz stabil.

${floorCeiling(ind)}

### 👀 Watch minggu ni
- **US Dollar Index** (DXY) & real yields (10Y TIPS) — pemandu utama
- **Fed** — jangkaan kadar faedah / inflasi
- **Geopolitik** + pembelian **bank pusat** (demand fizikal)
- **USD/MYR** — untuk harga emas dalam RM (RM/gram)

---
*${DISCLAIMER}*`
}

export function buildDemoReport(snap) {
  return snap.key === 'gold' ? goldReport(snap) : fcpoReport(snap)
}
