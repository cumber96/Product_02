-- 사랑기록: 날짜 단위 이벤트 기록 (기간이 아닌 단일 날짜 + 선택적 메모)

CREATE TABLE IF NOT EXISTS love_logs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL, -- YYYY-MM-DD
  note TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_love_logs_date ON love_logs(date);
