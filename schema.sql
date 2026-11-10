-- Stockly Finance - Cloudflare D1 Database Schema
-- Run this in Cloudflare D1 Console or via Wrangler

-- 1. Users Table (Google OAuth profile & 30-day session)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,               -- Google 'sub' ID
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at INTEGER NOT NULL,       -- Epoch milliseconds
  updated_at INTEGER NOT NULL
);

-- 2. User Watchlists Table
CREATE TABLE IF NOT EXISTS watchlists (
  id TEXT PRIMARY KEY,               -- e.g. 'wl_uuid'
  user_id TEXT NOT NULL,
  symbol TEXT NOT NULL,              -- e.g. '^NSEBANK', 'NVDA', 'AAPL'
  name TEXT NOT NULL,
  asset_type TEXT DEFAULT 'STOCK',   -- 'STOCK', 'INDEX', 'CRYPTO'
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_watchlists_user ON watchlists(user_id);

-- 3. Price Alerts Table (Perplexity Finance Style)
CREATE TABLE IF NOT EXISTS price_alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  criteria TEXT NOT NULL,            -- 'TARGET_PRICE' | 'MOVEMENT_AMOUNT'
  target_price REAL,
  movement_pct REAL,
  channels TEXT NOT NULL,            -- JSON array e.g. '["in_app", "email"]'
  default_query TEXT,
  additional_instructions TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'TRIGGERED', 'DISABLED'
  triggered_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_status ON price_alerts(status);

-- 4. User Portfolios Table
CREATE TABLE IF NOT EXISTS portfolios (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  quantity REAL NOT NULL,
  avg_buy_price REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_portfolios_user ON portfolios(user_id);
