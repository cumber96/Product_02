import { json } from "../../_lib/auth.js";
import { notifyPartner } from "../../_lib/push.js";

export async function onRequestPatch(context) {
  const { request, env, data, params } = context;
  const user = data.user;

  if (user.role !== "owner") {
    return json({ error: "forbidden" }, { status: 403 });
  }

  const existing = await env.DB.prepare("SELECT * FROM cycle_logs WHERE id = ?")
    .bind(params.id)
    .first();
  if (!existing) {
    return json({ error: "not_found" }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_request" }, { status: 400 });
  }

  const start_date = body.start_date ?? existing.start_date;
  const end_date = body.end_date !== undefined ? body.end_date : existing.end_date;
  const note = body.note !== undefined ? body.note : existing.note;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
    return json({ error: "invalid_start_date" }, { status: 400 });
  }
  if (end_date && !/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
    return json({ error: "invalid_end_date" }, { status: 400 });
  }

  const now = Math.floor(Date.now() / 1000);

  await env.DB.prepare(
    "UPDATE cycle_logs SET start_date = ?, end_date = ?, note = ?, updated_at = ? WHERE id = ?"
  )
    .bind(start_date, end_date || null, note || null, now, params.id)
    .run();

  context.waitUntil(
    notifyPartner(env, user.id, {
      title: "생리주기 기록 수정됨",
      body: `${user.name}님이 기록을 수정했어요 (${start_date} 시작)`,
      url: "/",
    })
  );

  return json({ ok: true });
}

export async function onRequestDelete(context) {
  const { env, data, params } = context;
  const user = data.user;

  if (user.role !== "owner") {
    return json({ error: "forbidden" }, { status: 403 });
  }

  await env.DB.prepare("DELETE FROM cycle_logs WHERE id = ?").bind(params.id).run();

  context.waitUntil(
    notifyPartner(env, user.id, {
      title: "생리주기 기록 삭제됨",
      body: `${user.name}님이 기록을 삭제했어요`,
      url: "/",
    })
  );

  return json({ ok: true });
}
