-- Molvicos OS — D1 Schema (source of truth)
-- Apply with: wrangler d1 execute molvicos-db --file=src/db/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id                    TEXT PRIMARY KEY,                          -- crypto.randomUUID()
  clerk_id              TEXT UNIQUE NOT NULL,                      -- Clerk user ID (sub)
  email                 TEXT NOT NULL,
  plan                  TEXT DEFAULT 'free'
                             CHECK(plan IN ('free', 'monthly', 'annual')),
  status                TEXT DEFAULT 'active'
                             CHECK(status IN ('active', 'inactive', 'cancelled')),
  ls_customer_id        TEXT,
  ls_subscription_id    TEXT,
  ls_variant_id         TEXT,
  current_period_ends_at TEXT,
  created_at            TEXT DEFAULT (datetime('now')),
  updated_at            TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subscription_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email  TEXT,
  event_type  TEXT NOT NULL,
  ls_event_id TEXT,
  payload     TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email
  ON users (email);

CREATE INDEX IF NOT EXISTS idx_users_clerk_id
  ON users (clerk_id);
