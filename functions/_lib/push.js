import { sendWebPush } from "./webpush.js";

export async function notifyUser(env, userId, payload) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM push_subscriptions WHERE user_id = ?"
  )
    .bind(userId)
    .all();

  if (!results || results.length === 0) return;

  await Promise.all(
    results.map(async (sub) => {
      try {
        const res = await sendWebPush(env, sub, payload);
        if (res.status === 404 || res.status === 410) {
          await env.DB.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?")
            .bind(sub.endpoint)
            .run();
        }
      } catch {
        // 개별 구독 발송 실패는 무시하고 나머지는 계속 진행
      }
    })
  );
}

export async function notifyPartner(env, actingUserId, payload) {
  const partner = await env.DB.prepare("SELECT id FROM users WHERE id != ?")
    .bind(actingUserId)
    .first();
  if (!partner) return;
  await notifyUser(env, partner.id, payload);
}
