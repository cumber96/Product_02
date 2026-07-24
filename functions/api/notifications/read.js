import { json } from "../../_lib/auth.js";

// 본인 알림의 is_read만 일괄 수정 가능 — WHERE user_id = ? 로 다른 사용자 알림은 절대 건드릴 수 없음
export async function onRequestPost(context) {
  const { env, data } = context;
  const user = data.user;

  await env.DB.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0")
    .bind(user.id)
    .run();

  return json({ ok: true });
}
