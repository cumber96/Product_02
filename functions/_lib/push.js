import { sendWebPush } from "./webpush.js";

// 알림함에서 조회할 수 있도록, 푸시 구독 여부와 무관하게 항상 먼저 저장한다
// (구독이 없거나 앱이 꺼져 있어도 알림 기록 자체는 남아야 함).
async function saveNotification(env, userId, { type, title, body, relatedDate, relatedRecordId }) {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    `INSERT INTO notifications (id, user_id, type, title, body, related_date, related_record_id, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`
  )
    .bind(id, userId, type, title, body, relatedDate || null, relatedRecordId || null, now)
    .run();
}

export async function notifyUser(env, userId, payload) {
  await saveNotification(env, userId, payload);

  const { results } = await env.DB.prepare(
    "SELECT * FROM push_subscriptions WHERE user_id = ?"
  )
    .bind(userId)
    .all();

  if (!results || results.length === 0) return;

  const { title, body, url } = payload;
  await Promise.all(
    results.map(async (sub) => {
      try {
        const res = await sendWebPush(env, sub, { title, body, url });
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
