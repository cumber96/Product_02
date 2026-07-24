import { json } from "../../_lib/auth.js";

// 본인에게 온 알림만 최신순으로 조회 — user_id는 세션에서만 가져오므로 클라이언트가 다른 사용자의
// 알림을 조회하도록 조작할 수 없음
export async function onRequestGet(context) {
  const { env, data } = context;
  const user = data.user;

  const { results } = await env.DB.prepare(
    `SELECT id, type, title, body, related_date, related_record_id, is_read, created_at
     FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 200`
  )
    .bind(user.id)
    .all();

  return json({ notifications: results || [] });
}
