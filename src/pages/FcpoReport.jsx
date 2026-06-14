import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';

import Sidebar from '../partials/StockSidebar';
import Header from '../partials/Header';
import { getCommoditySnapshot } from '../services/commodityData';
import { buildDemoReport, DISCLAIMER } from '../services/commodityReportTemplate';

const THEME = {
  fcpo: { name: 'FCPO — Crude Palm Oil', emoji: '🌴', grad: 'from-emerald-500 via-emerald-600 to-teal-700', tabActive: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30', soft: 'text-emerald-600' },
  gold: { name: 'Gold — Emas', emoji: '🥇', grad: 'from-amber-400 via-amber-500 to-yellow-600', tabActive: 'bg-amber-500 text-white shadow-md shadow-amber-500/30', soft: 'text-amber-600' },
};

// Inline markdown (headings/bold/lists/hr) — no dependency.
function MiniMarkdown({ text }) {
  if (!text) return null;
  const lines = text.split('\n'); const out = []; let list = [];
  const flush = (k) => { if (list.length) { out.push(<ul key={`u${k}`} className="list-disc pl-5 space-y-1 my-2">{list}</ul>); list = []; } };
  const inline = (s) => s.split(/(\*\*[^*]+\*\*)/g).map((p, i) => p.startsWith('**') && p.endsWith('**') ? <strong key={i} className="text-gray-900 dark:text-white">{p.slice(2, -2)}</strong> : p);
  lines.forEach((ln, i) => {
    if (ln.startsWith('### ')) { flush(i); out.push(<h3 key={i} className="text-sm font-bold text-gray-800 dark:text-gray-100 mt-5 mb-1.5 flex items-center gap-1.5">{inline(ln.slice(4))}</h3>); }
    else if (ln.startsWith('## ')) { flush(i); out.push(<h2 key={i} className="text-lg font-extrabold text-gray-900 dark:text-white mb-1">{inline(ln.slice(3))}</h2>); }
    else if (ln.startsWith('- ')) { list.push(<li key={i} className="text-sm text-gray-600 dark:text-gray-300">{inline(ln.slice(2))}</li>); }
    else if (ln.trim() === '---') { flush(i); out.push(<hr key={i} className="my-4 border-gray-100 dark:border-gray-700" />); }
    else if (ln.trim() === '') { flush(i); }
    else { flush(i); out.push(<p key={i} className="text-sm text-gray-600 dark:text-gray-300 my-1 leading-relaxed">{inline(ln)}</p>); }
  });
  flush('end'); return <div>{out}</div>;
}

function ScoreRing({ score }) {
  const s = score ?? 50, R = 34, C = 2 * Math.PI * R, off = C * (1 - s / 100);
  const col = s >= 70 ? '#16a34a' : s >= 55 ? '#10b981' : s >= 45 ? '#9ca3af' : s >= 30 ? '#f97316' : '#dc2626';
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 80 80" className="w-24 h-24 -rotate-90">
        <circle cx="40" cy="40" r={R} fill="none" className="text-gray-200 dark:text-gray-700" stroke="currentColor" strokeWidth="7" />
        <circle cx="40" cy="40" r={R} fill="none" stroke={col} strokeWidth="7" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset .6s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">{score ?? '—'}</span>
        <span className="text-[10px] text-gray-400 -mt-1">/100</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, chg }) {
  const up = (chg ?? 0) >= 0;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
      <div className="text-[11px] uppercase tracking-wide text-gray-400">{label}</div>
      <div className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-0.5">{value ?? 'n/a'} <span className="text-xs font-normal text-gray-400">{sub}</span></div>
      {chg != null && <div className={`text-xs font-semibold flex items-center gap-0.5 mt-0.5 ${up ? 'text-green-500' : 'text-red-500'}`}>{up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{up ? '+' : ''}{chg}%</div>}
    </div>
  );
}

function CommodityReports() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState('fcpo');
  const [interval, setIntervalSel] = useState('1d');
  const [snap, setSnap] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const theme = THEME[tab];

  const run = useCallback(async (key, iv) => {
    setLoading(true); setError(null);
    try {
      const snapshot = await getCommoditySnapshot(key, { interval: iv });
      setSnap(snapshot);
      let rep;
      try {
        const res = await fetch('/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(snapshot) });
        if (!res.ok) throw new Error('api');
        rep = await res.json();
      } catch {
        rep = { demo: true, score: snapshot.main?.indicators?.score, label: snapshot.main?.indicators?.label, reportMarkdown: buildDemoReport(snapshot), disclaimer: DISCLAIMER };
      }
      setReport(rep);
    } catch (e) { setError(e.message || 'Gagal jana laporan'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { run(tab, interval); }, [tab, interval, run]);

  const m = snap?.main || {}, ind = m.indicators || {};
  const score = report?.score ?? ind.score;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-900">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-7 w-full max-w-5xl mx-auto">

            {/* Title + tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h1 className="text-2xl md:text-[28px] text-gray-800 dark:text-gray-100 font-extrabold flex items-center gap-2 tracking-tight">
                  <Sparkles className="text-violet-500" /> Laporan AI Komoditi
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Analisis harian — teknikal + pemacu fundamental</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                  {Object.entries(THEME).map(([k, t]) => (
                    <button key={k} onClick={() => setTab(k)} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${tab === k ? t.tabActive : 'text-gray-500 hover:text-gray-700'}`}>
                      {t.emoji} {t.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Premium hero */}
            <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${theme.grad} text-white p-6 mb-5 shadow-lg`}>
              <div className="absolute -right-8 -top-10 w-44 h-44 rounded-full bg-white/10" />
              <div className="absolute -right-16 bottom-0 w-56 h-56 rounded-full bg-white/5" />
              <div className="relative flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-white/80 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                    <span className="text-lg">{theme.emoji}</span> {theme.name}
                  </div>
                  <div className="text-4xl font-black mt-1">{m.lastClose ?? '—'} <span className="text-base font-medium text-white/80">{m.unit}</span></div>
                  <div className="flex items-center gap-3 mt-1 text-sm">
                    <span className={`font-bold ${(m.changePct ?? 0) >= 0 ? 'text-green-200' : 'text-red-200'}`}>{(m.changePct ?? 0) >= 0 ? '▲' : '▼'} {Math.abs(m.changePct ?? 0)}%</span>
                    {snap?.rmPerGram && <span className="bg-white/20 rounded-full px-2.5 py-0.5 text-xs font-semibold">RM {snap.rmPerGram}/g (999)</span>}
                    <span className="bg-white/15 rounded-full px-2.5 py-0.5 text-xs">{report?.label ?? ind.label ?? ''}</span>
                  </div>
                </div>
                <div className="bg-white/95 dark:bg-gray-800 rounded-2xl p-2"><ScoreRing score={score} /></div>
              </div>
              {/* controls */}
              <div className="relative flex items-center gap-2 mt-4">
                <div className="flex bg-white/20 rounded-lg p-0.5 backdrop-blur">
                  {['1d', '15m'].map(iv => (
                    <button key={iv} onClick={() => setIntervalSel(iv)} className={`px-3 py-1 rounded-md text-xs font-semibold ${interval === iv ? 'bg-white text-gray-800' : 'text-white/90'}`}>
                      {iv === '1d' ? 'Swing/EOD' : 'Intraday'}
                    </button>
                  ))}
                </div>
                <button onClick={() => run(tab, interval)} disabled={loading} className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-lg backdrop-blur disabled:opacity-50">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Menjana…' : 'Refresh'}
                </button>
                {report?.demo && <span className="ml-auto text-[11px] bg-white/20 rounded-full px-2.5 py-1 backdrop-blur">🧪 Demo · RM0</span>}
              </div>
            </div>

            {error && <div className="mb-4 text-sm bg-red-50 text-red-600 rounded-xl px-3 py-2">{error}</div>}

            {/* Stat strip */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
              <StatCard label={snap?.main?.name || 'Harga'} value={m.lastClose} sub={m.unit} chg={m.changePct} />
              <StatCard label={snap?.lead?.name || 'Driver'} value={snap?.lead?.lastClose} sub={snap?.lead?.unit} chg={snap?.lead?.changePct} />
              <StatCard label="USD/MYR" value={snap?.fx?.lastClose} chg={snap?.fx?.changePct} />
            </div>

            {/* Report */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-7 shadow-sm border border-gray-100 dark:border-gray-700/50 mb-5">
              {loading ? <div className="text-center py-14 text-gray-400">Menjana laporan…</div>
                : report?.reportMarkdown ? <MiniMarkdown text={report.reportMarkdown} />
                : <div className="text-center py-14 text-gray-400">Tiada laporan. Tekan Refresh.</div>}
            </div>

            {/* Indicators */}
            {ind.price && (
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700/50">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3 text-sm">Indikator Teknikal</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-sm">
                  {[['Trend', ind.trend], ['RSI', ind.rsi], ['MACD', ind.macd?.crossing], ['MA20', ind.sma20], ['MA50', ind.sma50], ['Support', ind.support], ['Resistance', ind.resistance], ['Volatiliti', `${ind.annualizedVolatilityPct}%`]].map(([k, v]) => (
                    <div key={k} className="bg-gray-50 dark:bg-gray-700/40 rounded-xl px-3 py-2">
                      <div className="text-[11px] text-gray-400">{k}</div>
                      <div className="font-semibold text-gray-700 dark:text-gray-200 capitalize">{v ?? 'n/a'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

export default CommodityReports;
