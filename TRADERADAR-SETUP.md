# TradeRadar Bot — Setup (MVP)

Multi-asset sentiment radar (FCPO · Global · Bursa · Crypto) → **Telegram**, logged to **Supabase**.
Built on the existing SwiftSignal scoring engine — the bot is a *delivery layer*, not a new brain.

```
 dataSource.js      → multi-source adapter (Yahoo + Binance, normalized candles)
 marketAssets.js    → the 4 modules + their symbols/sources
 sentimentEngine.js → scores each symbol (reuses indicators.js) → module + overall
 api/cron-sentiment → orchestrator: fetch → score → Claude(optional) → Supabase → Telegram
 api/telegram.js    → sender + manual test endpoint
 sql/traderadar-schema.sql → Supabase tables
```

No new npm packages — everything is `fetch`-based.

---

## 1. Supabase
1. Create a project → **SQL Editor** → paste & run `sql/traderadar-schema.sql`.
2. **Settings → API** → copy the **Project URL**, the **anon** key, and the **service_role** key.

## 2. Telegram
1. Talk to **@BotFather** → `/newbot` → copy the **bot token**.
2. Send any message to your new bot, then message **@userinfobot** to get your numeric **chat id**
   (or open `https://api.telegram.org/bot<TOKEN>/getUpdates` and read `chat.id`).

## 3. Env vars
Copy `.env.local.example` → `.env.local` for local dev, and set the **same keys in Vercel**
(Project → Settings → Environment Variables). Required:

| Var | Where | Notes |
|-----|-------|-------|
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | server | cron writes (service key bypasses RLS) |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | build | dashboard read |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | server | delivery |
| `ANTHROPIC_API_KEY` | server | **optional** — omit = demo mode (RM0) |
| `CRON_SECRET` | server | protects the cron endpoint |

> ⚠️ The service key is admin-level — **server only, never** prefix it `VITE_` (that ships it to the browser).

## 4. Test locally
```bash
npm run dev
# Telegram wiring:
curl -X POST "http://localhost:3000/api/telegram?secret=$CRON_SECRET" -H "content-type: application/json" -d '{"text":"hello"}'
# Full run (morning session):
curl "http://localhost:3000/api/cron-sentiment?session=morning&secret=$CRON_SECRET"
```
The JSON response includes a `preview` field (the exact Telegram message) so you can eyeball it.

## 5. Schedule (3× daily)

**Times are UTC.** MYT = UTC+8, so:

| Session | MYT | UTC cron | Modules |
|---------|-----|----------|---------|
| morning | 08:45 | `45 0 * * *` | Global + Bursa + Crypto |
| fcpo | 10:00 | `0 2 * * *` | FCPO |
| evening | 20:30 | `12:30 → 30 12 * * *` | Global + Crypto |

Two ways to trigger:

- **Vercel Cron** — already declared in `vercel.json`. ⚠️ **Hobby plan = max 2 cron jobs, once-daily granularity.** 3 sessions may exceed it.
- **External cron (recommended, free, unlimited)** — [cron-job.org](https://cron-job.org): create 3 jobs hitting
  `https://<your-app>/api/cron-sentiment?session=morning&secret=<CRON_SECRET>` (and `fcpo`, `evening`).
  Decouples you from the Vercel plan and works even if you later move to Coolify.

---

## What's real vs proxy (don't over-trust)
- 🌴 **FCPO** = `CPO=F` (CME palm oil, USD) + `ZL=F` soyoil proxy, Yahoo ~15min delayed. Good for swing/EOD sentiment, **not** Bursa FCPO MYR exact. Real-time FCPO needs a broker feed (see project notes).
- ₿ **Crypto** = Binance public data endpoint — real-time, reliable. The strongest module.
- 🌍 **Global** = Yahoo indices/VIX/DXY — delayed, fine for mood.
- 🇲🇾 **Bursa** = Yahoo `.KL` EOD/delayed, manual watchlist. Real-time intraday scan = paid feed later.

## Next
- [ ] Wire a dashboard "History" view using `traderadarLog.js` (reads `traderadar_sentiment_logs`).
- [ ] Add news/RSS catalyst into the module payload (Finnhub already wired for news).
- [ ] Paper-trade log UI (table already in schema).
