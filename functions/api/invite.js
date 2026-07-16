import { json } from "../_lib/auth.js";

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // 헷갈리는 0/O, 1/I 제외
const INVITE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7일

function generateInviteCode(length = 8) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let code = "";
  for (const b of bytes) code += ALPHABET[b % ALPHABET.length];
  return code;
}

export async function onRequestPost(context) {
  const { request, env, data } = context;
  const user = data.user;

  if (user.role !== "owner") {
    return json({ error: "forbidden" }, { status: 403 });
  }

  const partnerCount = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM users WHERE id != ?"
  )
    .bind(user.id)
    .first();

  if (partnerCount.count >= 1) {
    return json({ error: "partner_already_connected" }, { status: 409 });
  }

  const now = Math.floor(Date.now() / 1000);
  const code = generateInviteCode();

  await env.DB.prepare(
    `INSERT INTO invites (code, created_by, expires_at, created_at)
     VALUES (?, ?, ?, ?)`
  )
    .bind(code, user.id, now + INVITE_TTL_SECONDS, now)
    .run();

  const url = new URL(request.url);
  const inviteUrl = `${url.origin}/?invite=${code}`;

  return json({ code, url: inviteUrl, expiresAt: now + INVITE_TTL_SECONDS });
}
