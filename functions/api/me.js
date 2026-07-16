import { json } from "../_lib/auth.js";

export async function onRequestGet(context) {
  const { env, data } = context;
  const user = data.user;

  const partner = await env.DB.prepare(
    "SELECT id, name, email, role FROM users WHERE id != ? LIMIT 1"
  )
    .bind(user.id)
    .first();

  return json({
    user: { id: user.id, email: user.email, name: user.name, picture: user.picture, role: user.role },
    partnerConnected: !!partner,
    partner: partner || null,
  });
}
