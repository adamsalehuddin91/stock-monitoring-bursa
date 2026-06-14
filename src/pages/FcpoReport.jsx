import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';

import Sidebar from '../partials/StockSidebar';
import Header from '../partials/Header';
import { getFcpoSnapshot } from '../services/fcpoData';

// Minimal, dependency-free markdown renderer (headings, bold, lists, hr).
function MiniMarkdown({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  const out = [];
  let list = [];
  const flush = (k) => { if (list.length) { out.push(<ul key={`u${k}`} className="list-disc pl-5 space-y-1 my-2">{list}</ul>); list = []; } };
  const inline = (s) => s.split(/(\*\*[^*]+\*\*)/g).map((p, i) => p.startsWith('**') && p.endsWith('**')
    ? <strong key={i} className="text-gray-900 dark:text-gray-100">{p.slice(2, -2)}</strong> : p);
  lines.forEach((ln, i) => {
    if (ln.startsWith('### ')) { flush(i); out.push(<h3 key={i} className="text-base font-bold text-gray-800 dark:text-gray-100 mt-4 mb-1">{inline(ln.slice(4))}</h3>); }
    else if (ln.startsWith('## ')) { flush(i); out.push(<h2 key={i} className="text-lg font-bold text-gray-900 dark:text-white mt-2 mb-2">{inline(ln.slice(3))}</h2>); }
    else if (ln.startsWith('- ')) { list.push(<li key={i} className="text-sm text-gray-600 dark:text-gray-300">{inline(ln.slice(2))}</li>); }
    else if (ln.trim() === '---') { flush(i); out.push(<hr key={i} className="my-3 border-gray-200 dark:border-gray-700" />); }
    else if (ln.trim() === '') { flush(i); }
    else { flush(i); out.push(<p key={i} className="text-sm text-gray-600 dark:text-gray-300 my-1 leading-relaxed">{inline(ln)}</p>); }
  });
  flush('end');
  return <div>{out}</div>;
}

const scoreColor = (s) => s >= 70 ? 'text-green-600 bg-green-100' : s >= 55 ? 'text-emerald-600 bg-emerald-50' : s >= 45 ? 'text-gray-600 bg-gray-100' : s >= 30 ? 'text-orange-600 bg-orange-100' : 'text-red-600 bg-red-100';

function MiniStat({ label, value, sub, chg }) {
  const up = (chg ?? 0) >= 0;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{value ?? 'n/a'} <span className="text-xs font-normal text-gray-400">{sub}</span></div>
      {chg != null && <div className={`text-xs font-semibold flex items-center gap-0.5 ${up ? 'text-green-500' : 'text-red-500'}`}>{up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{up ? '+' : ''}{chg}%</div>}
    </div>
  );
}

function FcpoReport() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [interval, setIntervalSel] = useState('1d');
  const [snap, setSnap] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (iv) => {
    setLoading(true); setError(null);
    try {
      const snapshot = await getFcpoSnapshot({ interval: iv, range: iv === '1d' ? '6mo' : '5d' });
      setSnap(snapshot);
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(snapshot),
      });
      setReport(await res.json());
    } catch (e) {
      setError(e.message || 'Gagal jana laporan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { run(interval); }, [interval, run]);

  const ind = snap?.fcpo?.indicators || {};
  const score = report?.score ?? ind.score;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-5xl mx-auto">

            <div className="sm:flex sm:justify-between sm:items-center mb-6">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold flex items-center gap-2">
                  <Sparkles className="text-amber-500" /> Laporan AI FCPO
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Analisis harian minyak sawit mentah — teknikal + soybean oil + ringgit</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
                  {['1d', '15m'].map(iv => (
                    <button key={iv} onClick={() => setIntervalSel(iv)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold ${interval === iv ? 'bg-white dark:bg-gray-800 shadow text-violet-600' : 'text-gray-500'}`}>
                      {iv === '1d' ? 'Swing/EOD' : 'Intraday'}
                    </button>
                  ))}
                </div>
                <button onClick={() => run(interval)} disabled={loading} className="btn bg-violet-500 hover:bg-violet-600 text-white disabled:opacity-50">
                  <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Menjana…' : 'Refresh'}
                </button>
              </div>
            </div>

            {report?.demo && (
              <div className="mb-4 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-lg px-3 py-2">
                🧪 Mod Demo — laporan dijana dari data sebenar guna template (RM0). Masukkan Anthropic API key untuk naratif AI penuh.
              </div>
            )}
            {error && <div className="mb-4 text-sm bg-red-50 text-red-600 rounded-lg px-3 py-2">{error}</div>}

            {/* Top stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <MiniStat label="FCPO (CME USD)" value={snap?.fcpo?.lastClose} sub={snap?.fcpo?.unit} chg={snap?.fcpo?.changePct} />
              <MiniStat label="Soybean Oil" value={snap?.soy?.lastClose} sub={snap?.soy?.unit} chg={snap?.soy?.changePct} />
              <MiniStat label="USD/MYR" value={snap?.myr?.lastClose} chg={snap?.myr?.changePct} />
              <div className={`rounded-xl p-4 shadow-sm flex flex-col justify-center ${scoreColor(score ?? 50)}`}>
                <div className="text-xs opacity-80">Skor</div>
                <div className="text-2xl font-extrabold">{score ?? '—'}<span className="text-sm font-medium">/100</span></div>
                <div className="text-xs font-semibold">{report?.label ?? ind.label ?? ''}</div>
              </div>
            </div>

            {/* Report */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-5">
              {loading ? (
                <div className="text-center py-12 text-gray-400">Menjana laporan FCPO…</div>
              ) : report?.reportMarkdown ? (
                <MiniMarkdown text={report.reportMarkdown} />
              ) : (
                <div className="text-center py-12 text-gray-400">Tiada laporan. Tekan Refresh.</div>
              )}
            </div>

            {/* Key indicators */}
            {ind.price && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3 text-sm">Indikator Teknikal</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  {[
                    ['Trend', ind.trend], ['RSI', ind.rsi], ['MACD', ind.macd?.crossing],
                    ['MA20', ind.sma20], ['MA50', ind.sma50], ['Support', ind.support],
                    ['Resistance', ind.resistance], ['Volatiliti', `${ind.annualizedVolatilityPct}%`],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-gray-50 dark:bg-gray-700/40 rounded-lg px-3 py-2">
                      <div className="text-xs text-gray-400">{k}</div>
                      <div className="font-semibold text-gray-700 dark:text-gray-200">{v ?? 'n/a'}</div>
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

export default FcpoReport;
