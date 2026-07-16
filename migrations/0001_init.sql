-- 둘만 쓰는 앱이므로 단일 테넌트: users 테이블에 role만 두고 별도 couple 테이블 없음.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  google_sub TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  picture TEXT,
  role TEXT NOT NULL CHECK (role IN ('owner', 'viewer')),
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS invites (
  code TEXT PRIMARY KEY,
  created_by TEXT NOT NULL REFERENCES users(id),
  used_by TEXT REFERENCES users(id),
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cycle_logs (
  id TEXT PRIMARY KEY,
  start_date TEXT NOT NULL, -- YYYY-MM-DD
  end_date TEXT,            -- YYYY-MM-DD, nullable
  note TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cycle_logs_start_date ON cycle_logs(start_date);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
