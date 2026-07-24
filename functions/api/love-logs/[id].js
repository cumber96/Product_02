import { json } from "../../_lib/auth.js";
import { notifyPartner } from "../../_lib/push.js";

export async function onRequestDelete(context) {
  const { env, data, params } = context;
  const user = data.user;

  if (user.role !== "owner") {
    return json({ error: "forbidden" }, { status: 403 });
  }

  const existing = await env.DB.prepare("SELECT date FROM love_logs WHERE id = ?")
    .bind(params.id)
    .first();

  await env.DB.prepare("DELETE FROM love_logs WHERE id = ?").bind(params.id).run();

  context.waitUntil(
    notifyPartner(env, user.id, {
      type: "love_log_deleted",
      title: "사랑기록 삭제됨",
      body: `${user.name}님이 사랑기록을 삭제했어요`,
      url: "/",
      relatedDate: existing ? existing.date : null,
      relatedRecordId: params.id,
    })
  );

  return json({ ok: true });
}
