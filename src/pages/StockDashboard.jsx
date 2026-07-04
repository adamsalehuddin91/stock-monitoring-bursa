import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Activity, RefreshCw, Loader2 } from 'lucide-react';

import Sidebar from '../partials/StockSidebar';
import Header from '../partials/Header';
import { fetchMultipleStocks, fetchKLCIIndex } from '../services/stockApi';
import { getAllStocks } from '../data/malaysianStocks';
import { getAllUSStocks } from '../data/globalStocks';

const dedupe = (arr) => { const seen = new Set(); return arr.filter(x => (seen.has(x.code) ? false : (seen.add(x.code), true))); };
const movers = (list) => ({
  gainers: [...list].filter(s => s.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent).slice(0, 4),
  losers: [...list].filter(s => s.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 4),
  active: [...list].sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 4),
  adv: list.filter(s => s.change > 0).length,
  dec: list.filter(s => s.change < 0).length,
  total: list.length,
});

function Row({ s, cur, nav, showVol }) {
  const up = s.changePercent >= 0;
  return (
    <div onClick={() => nav(`/stock/${s.code}`)} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/30 cursor-pointer">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{s.name}</div>
        <div className="text-[11px] text-gray-400">{s.code}</div>
      </div>
      <div className="text-right shrink-0 ml-2">
        <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{showVol ? `${(s.volume || 0).toFixed(1)}M` : `${cur}${s.price.toFixed(2)}`}</div>
        <div className={`text-[11px] font-medium ${up ? 'text-emerald-500' : 'text-red-500'}`}>{up ? '+' : ''}{s.changePercent.toFixed(2)}%</div>
      </div>
    </div>
  );
}

function MoverCard({ title, Icon, tone, items, cur, nav, showVol }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{title}</h3>
        <Icon className={`w-4 h-4 ${tone}`} />
      </div>
      {items.length ? <div className="space-y-0.5">{items.map(s => <Row key={s.code} s={s} cur={cur} nav={nav} showVol={showVol} />)}</div>
        : <p className="text-xs text-gray-400 px-2 py-3 text-center">Tiada data</p>}
    </div>
  );
}

function MarketPanel({ flag, name, cur, data, nav }) {
  if (!data) return null;
  const bull = data.adv > data.dec;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-extrabold text-gray-800 dark:text-gray-100 flex items-center gap-2">{flag} {name}</h2>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-emerald-500 font-semibold">↑{data.adv}</span>
          <span className="text-red-500 font-semibold">↓{data.dec}</span>
          <span className={`font-bold rounded-full px-2 py-0.5 ${bull ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : data.dec > data.adv ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-gray-500/10 text-gray-500'}`}>{bull ? 'BULLISH' : data.dec > data.adv ? 'BEARISH' : 'NEUTRAL'}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MoverCard title="Top Gainers" Icon={TrendingUp} tone="text-emerald-500" items={data.gainers} cur={cur} nav={nav} />
        <MoverCard title="Top Losers" Icon={TrendingDown} tone="text-red-500" items={data.losers} cur={cur} nav={nav} />
        <MoverCard title="Most Active" Icon={Activity} tone="text-blue-500" items={data.active} cur={cur} nav={nav} showVol />
      </div>
    </div>
  );
}

function StockDashboard() {
  const nav = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [klci, setKlci] = useState(null);
  const [bursa, setBursa] = useState(null);
  const [us, setUs] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [k, b, u] = await Promise.all([
      fetchKLCIIndex().catch(() => null),
      fetchMultipleStocks(getAllStocks().slice(0, 40).map(s => s.code)).then(dedupe).catch(() => []),
      fetchMultipleStocks(getAllUSStocks().slice(0, 40).map(s => s.code)).then(dedupe).catch(() => []),
    ]);
    setKlci(k); setBursa(movers(b)); setUs(movers(u));
    setLoading(false);
  };
  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, []);

  const klciUp = (klci?.change ?? 0) >= 0;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-900">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-7 w-full max-w-6xl mx-auto">

            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-2xl md:text-[28px] text-gray-800 dark:text-gray-100 font-extrabold tracking-tight">SwiftSignal</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Data pasaran real-time · Bursa &amp; Global</p>
              </div>
              <button onClick={load} disabled={loading} className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold px-3.5 py-2 rounded-xl disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {/* KLCI hero — Bursa Malaysia prominent */}
            <div className={`relative overflow-hidden rounded-3xl p-6 mb-6 shadow-lg text-white bg-gradient-to-br ${klciUp ? 'from-emerald-600 via-emerald-700 to-teal-800' : 'from-rose-600 via-red-700 to-red-900'}`}>
              <div className="absolute -right-8 -top-10 w-44 h-44 rounded-full bg-white/10" />
              <div className="relative flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-white/80 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">🇲🇾 FTSE Bursa Malaysia KLCI</div>
                  {klci ? (
                    <>
                      <div className="text-4xl font-black mt-1">{klci.value.toFixed(2)}</div>
                      <div className="text-sm font-bold mt-0.5">{klciUp ? '▲' : '▼'} {klciUp ? '+' : ''}{klci.change.toFixed(2)} ({klciUp ? '+' : ''}{klci.changePercent.toFixed(2)}%)</div>
                    </>
                  ) : loading ? <div className="mt-2"><Loader2 className="w-6 h-6 animate-spin" /></div> : <div className="text-sm mt-2 text-white/80">Indeks tidak tersedia</div>}
                </div>
                {bursa && <div className="text-right text-sm"><div className="text-white/80 text-xs uppercase tracking-wide">Breadth Bursa</div><div className="font-bold mt-1">↑{bursa.adv} · ↓{bursa.dec}</div></div>}
              </div>
            </div>

            {loading && !bursa ? (
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-14 text-center shadow-sm"><Loader2 className="w-10 h-10 text-blue-500 mx-auto mb-3 animate-spin" /><p className="text-gray-500 dark:text-gray-400 text-sm">Memuat data pasaran…</p></div>
            ) : (
              <div className="space-y-7">
                <MarketPanel flag="🇲🇾" name="Bursa Malaysia" cur="RM" data={bursa} nav={nav} />
                <MarketPanel flag="🇺🇸" name="US Markets" cur="$" data={us} nav={nav} />
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

export default StockDashboard;
