import { json } from "../../_lib/auth.js";
import { notifyPartner } from "../../_lib/push.js";

export async function onRequestGet(context) {
  const { env } = context;
  const { results } = await env.DB.prepare(
    "SELECT id, date, note, created_by, created_at FROM love_logs ORDER BY date DESC"
  ).all();
  return json({ logs: results || [] });
}

export async function onRequestPost(context) {
  const { request, env, data } = context;
  const user = data.user;

  if (user.role !== "owner") {
    return json({ error: "forbidden" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_request" }, { status: 400 });
  }

  const { date, note } = body || {};
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ error: "invalid_date" }, { status: 400 });
  }

  const now = Math.floor(Date.now() / 1000);
  const id = crypto.randomUUID();

  await env.DB.prepare(
    `INSERT INTO love_logs (id, date, note, created_by, created_at) VALUES (?, ?, ?, ?, ?)`
  )
    .bind(id, date, note || null, user.id, now)
    .run();

  context.waitUntil(
    notifyPartner(env, user.id, {
      type: "love_log_created",
      title: "사랑기록 추가됨",
      body: `${user.name}님이 새 사랑기록을 남겼어요 (${date})`,
      url: "/",
      relatedDate: date,
      relatedRecordId: id,
    })
  );

  return json({ id }, { status: 201 });
}
