-- 알림함: 푸시 발송 시점에 알림 데이터를 영구 저장해 앱이 꺼져 있어도, 지난 알림도 조회 가능하게 함.
-- 생성은 서버(functions/_lib/push.js)에서만 하고, 클라이언트는 조회/읽음 처리만 한다.

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  related_date TEXT,       -- YYYY-MM-DD, nullable
  related_record_id TEXT,  -- cycle_logs.id / love_logs.id 등, nullable
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
