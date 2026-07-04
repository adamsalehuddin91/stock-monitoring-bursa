import React, { useState, useEffect } from 'react';
import { RefreshCw, Radar } from 'lucide-react';

import Sidebar from '../partials/StockSidebar';
import Header from '../partials/Header';
import { getLatestRun, isConfigured } from '../services/traderadarLog';

const MOD_META = {
  fcpo: { emoji: '🌴', name: 'FCPO' },
  global: { emoji: '🌍', name: 'Global Market' },
  bursa: { emoji: '🇲🇾', name: 'Bursa Malaysia' },
  crypto: { emoji: '₿', name: 'Crypto' },
};
const assetIcon = (t = '') => (/USDT$/.test(t) ? '₿' : /\.KL$/.test(t) ? '🇲🇾' : (/^\^/.test(t) || /=/.test(t) || /-Y\.NYB$/.test(t)) ? '🌍' : '📊');
const labelColor = l => (l === 'Strong' || l === 'Bullish' ? 'text-emerald-500' : l === 'Bearish' || l === 'Weak' ? 'text-red-500' : 'text-gray-400');
const scoreColor = s => (s >= 70 ? 'bg-emerald-500' : s >= 55 ? 'bg-emerald-400' : s >= 45 ? 'bg-gray-400' : s >= 30 ? 'bg-orange-400' : 'bg-red-500');
const pct = v => (v == null ? '' : `${v >= 0 ? '+' : ''}${v}%`);

function ListCard({ title, items }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700/50">
      <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-2">{title}</h3>
      <ul className="space-y-1.5">
        {items.map((c, i) => <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex gap-2"><span className="text-gray-400 shrink-0">›</span>{c}</li>)}
      </ul>
    </div>
  );
}

function TradeRadarPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      if (!isConfigured()) { setError('Supabase belum dikonfigur (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).'); setRun(null); }
      else setRun(await getLatestRun());
    } catch (e) { setError(e.message || 'Gagal muat radar'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const a = run?.analysis;
  const focus = run?.focus || [];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-900">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-7 w-full max-w-5xl mx-auto">

            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <h1 className="text-2xl md:text-[28px] text-gray-800 dark:text-gray-100 font-extrabold flex items-center gap-2 tracking-tight">
                  <Radar className="text-blue-500" /> TradeRadar
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sentimen multi-aset + Focus Harian{run?.created_at ? ` · ${new Date(run.created_at).toLocaleString('ms-MY')}` : ''}
                </p>
              </div>
              <button onClick={load} disabled={loading} className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50 shrink-0">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh · RM0
              </button>
            </div>

            {error && <div className="mb-4 text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl px-4 py-3">{error}</div>}
            {loading && <div className="text-center py-16 text-gray-400">Memuat radar…</div>}
            {!loading && !run && !error && <div className="text-center py-16 text-gray-400">Belum ada data. Cron jana pada 8:45 / 10:00 / 20:30 (MYT).</div>}

            {run && (
              <>
                {a && (
                  <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white p-6 mb-5 shadow-lg">
                    <div className="text-white/80 text-xs font-semibold uppercase tracking-wider">Overall Sentiment · sesi {run.session}</div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-3xl font-black">{a.overall_bias}</span>
                      <span className="text-xs bg-white/20 rounded-full px-2.5 py-1">confidence: {a.confidence}</span>
                    </div>
                    <p className="text-sm text-white/90 mt-3 leading-relaxed">{a.summary}</p>
                  </div>
                )}

                {focus.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700/50 mb-5">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-3">🎯 Focus Harian — Top {focus.length} <span className="text-[11px] font-normal text-gray-400">calon momentum · sahkan sendiri</span></h3>
                    <div className="space-y-2">
                      {focus.map((f, i) => (
                        <div key={f.ticker || i} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl px-3 py-2">
                          <span className="text-xs font-bold text-gray-400 w-4 shrink-0">{i + 1}</span>
                          <span className="text-lg shrink-0">{assetIcon(f.ticker)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                              {f.name} <span className={`text-xs ${(f.changePct ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{pct(f.changePct)}</span>
                            </div>
                            {f.reasons?.length > 0 && <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{f.reasons.slice(0, 3).join(' · ')}</div>}
                          </div>
                          <span className={`text-xs font-bold text-white rounded-full px-2 py-0.5 shrink-0 ${scoreColor(f.opportunityScore)}`}>{f.opportunityScore}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  {run.modules.map(m => {
                    const meta = MOD_META[m.module] || { emoji: '📊', name: m.module };
                    const items = (m.top_setups || []).filter(i => i && (typeof i.score === 'number' || i.last != null)).slice(0, 4);
                    return (
                      <div key={m.module} className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700/50">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">{meta.emoji} {meta.name}</h3>
                          <span className={`text-sm font-bold ${labelColor(m.sentiment_label)}`}>{m.sentiment_label} · {m.sentiment_score}</span>
                        </div>
                        {m.key_levels && <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Support {m.key_levels.support} · Resistance {m.key_levels.resistance}</div>}
                        <div className="space-y-1">
                          {items.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-300 truncate">{it.name}</span>
                              <span className={`shrink-0 text-xs font-medium ${(it.changePct ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {it.label ? `${it.label} ` : ''}{it.changePct != null ? `(${pct(it.changePct)})` : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {a && (a.catalysts?.length > 0 || a.cautions?.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {a.catalysts?.length > 0 && <ListCard title="📰 Catalyst" items={a.catalysts} />}
                    {a.cautions?.length > 0 && <ListCard title="⚠️ Awas" items={a.cautions} />}
                  </div>
                )}

                <p className="text-[11px] text-gray-400 text-center mt-6">Educational purpose only. Bukan nasihat kewangan. · dijana cron (RM0 papar)</p>
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

export default TradeRadarPage;
