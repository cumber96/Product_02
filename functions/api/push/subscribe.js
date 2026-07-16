import { json } from "../../_lib/auth.js";

export async function onRequestPost(context) {
  const { request, env, data } = context;
  const user = data.user;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_request" }, { status: 400 });
  }

  const { endpoint, keys } = body || {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return json({ error: "invalid_subscription" }, { status: 400 });
  }

  const now = Math.floor(Date.now() / 1000);
  const id = crypto.randomUUID();

  await env.DB.prepare(
    `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`
  )
    .bind(id, user.id, endpoint, keys.p256dh, keys.auth, now)
    .run();

  return json({ ok: true });
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_request" }, { status: 400 });
  }
  if (body?.endpoint) {
    await env.DB.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?")
      .bind(body.endpoint)
      .run();
  }
  return json({ ok: true });
}
