-- TradeRadar Bot — Supabase schema (MVP)
-- Run in Supabase Studio → SQL Editor. Idempotent (safe to re-run).

-- ── Sentiment logs (one row per module per run) ─────────────────────────────
create table if not exists traderadar_sentiment_logs (
  id              bigint generated always as identity primary key,
  created_at      timestamptz not null default now(),
  session         text,                 -- morning | fcpo | evening
  module          text not null,        -- fcpo | global | bursa | crypto
  asset_class     text,
  sentiment_score int,                  -- 0–100
  sentiment_label text,                 -- Strong | Bullish | Neutral | Bearish | Weak
  drivers         jsonb,
  risks           jsonb,
  key_levels      jsonb,                -- { support, resistance, projected }
  top_setups      jsonb,                -- scored symbols
  claude_summary  text,                 -- the "Overall View" paragraph
  raw_data        jsonb
);
create index if not exists idx_tr_logs_created on traderadar_sentiment_logs (created_at desc);
create index if not exists idx_tr_logs_module  on traderadar_sentiment_logs (module, created_at desc);

-- ── Watchlist (editable universe; overrides the code defaults if you want) ──
create table if not exists traderadar_watchlist (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  ticker       text not null,
  name         text,
  asset_class  text not null,           -- fcpo | global | bursa | crypto
  market       text,
  source       text default 'yahoo',    -- yahoo | binance
  sector       text,
  is_active    boolean default true,
  notes        text
);

-- ── Paper trade log (Phase 2 — private) ─────────────────────────────────────
create table if not exists traderadar_paper_trade_logs (
  id                    bigint generated always as identity primary key,
  created_at            timestamptz not null default now(),
  trade_date            date,
  ticker                text,
  asset_class           text,
  setup_type            text,
  sentiment_before_entry text,
  entry_price           numeric,
  stop_loss             numeric,
  target_price          numeric,
  exit_price            numeric,
  result                text,
  remarks               text
);

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Sentiment logs + watchlist hold NO personal data (market metrics + tickers),
-- so anon SELECT USING(true) is acceptable here — unlike AP-029 (which was
-- customer PII). Writes go through the service key, which bypasses RLS.
alter table traderadar_sentiment_logs   enable row level security;
alter table traderadar_watchlist        enable row level security;
alter table traderadar_paper_trade_logs enable row level security;

drop policy if exists "public read logs"      on traderadar_sentiment_logs;
drop policy if exists "public read watchlist"  on traderadar_watchlist;
create policy "public read logs"     on traderadar_sentiment_logs for select using (true);
create policy "public read watchlist" on traderadar_watchlist      for select using (true);
-- paper_trade_logs: intentionally no anon policy (private). Service key only.

-- ── Optional: seed watchlist from the code defaults ─────────────────────────
insert into traderadar_watchlist (ticker, name, asset_class, source, sector) values
  ('1155.KL', 'Maybank',            'bursa',  'yahoo', 'Finance'),
  ('1023.KL', 'CIMB',               'bursa',  'yahoo', 'Finance'),
  ('5347.KL', 'Tenaga Nasional',    'bursa',  'yahoo', 'Utilities'),
  ('5183.KL', 'Petronas Chemicals', 'bursa',  'yahoo', 'Energy'),
  ('6947.KL', 'CelcomDigi',         'bursa',  'yahoo', 'Telco'),
  ('BTCUSDT', 'Bitcoin',            'crypto', 'binance', null),
  ('ETHUSDT', 'Ethereum',           'crypto', 'binance', null)
on conflict do nothing;
