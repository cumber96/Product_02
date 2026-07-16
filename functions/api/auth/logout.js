import { deleteSession, clearSessionCookie, json } from "../../_lib/auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  await deleteSession(env.DB, request);
  return json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
}
