import { json } from "../../_lib/auth.js";
import { notifyPartner } from "../../_lib/push.js";

export async function onRequestGet(context) {
  const { env } = context;
  const { results } = await env.DB.prepare(
    "SELECT id, start_date, end_date, note, created_by, created_at, updated_at FROM cycle_logs ORDER BY start_date DESC"
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

  const { start_date, end_date, note } = body || {};
  if (!start_date || !/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
    return json({ error: "invalid_start_date" }, { status: 400 });
  }
  if (end_date && !/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
    return json({ error: "invalid_end_date" }, { status: 400 });
  }

  const now = Math.floor(Date.now() / 1000);
  const id = crypto.randomUUID();

  await env.DB.prepare(
    `INSERT INTO cycle_logs (id, start_date, end_date, note, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, start_date, end_date || null, note || null, user.id, now, now)
    .run();

  context.waitUntil(
    notifyPartner(env, user.id, {
      type: "cycle_created",
      title: "생리주기 기록 업데이트",
      body: `${user.name}님이 새 기록을 남겼어요 (${start_date} 시작)`,
      url: "/",
      relatedDate: start_date,
      relatedRecordId: id,
    })
  );

  return json({ id }, { status: 201 });
}
