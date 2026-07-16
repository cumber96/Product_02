import { verifyGoogleIdToken } from "../../_lib/googleAuth.js";
import { createSession, sessionCookie, json } from "../../_lib/auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.DB;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_request" }, { status: 400 });
  }

  const { idToken, inviteCode } = body || {};
  if (!idToken) {
    return json({ error: "id_token_required" }, { status: 400 });
  }

  let googleUser;
  try {
    googleUser = await verifyGoogleIdToken(idToken, env.GOOGLE_CLIENT_ID);
  } catch (err) {
    return json({ error: "invalid_id_token" }, { status: 401 });
  }

  let user = await db
    .prepare("SELECT * FROM users WHERE google_sub = ?")
    .bind(googleUser.sub)
    .first();

  if (!user) {
    const { count } = await db
      .prepare("SELECT COUNT(*) as count FROM users")
      .first();

    const now = Math.floor(Date.now() / 1000);
    const id = crypto.randomUUID();

    if (count === 0) {
      // 첫 가입자 = 여자친구 = owner
      await db
        .prepare(
          `INSERT INTO users (id, google_sub, email, name, picture, role, created_at)
           VALUES (?, ?, ?, ?, ?, 'owner', ?)`
        )
        .bind(id, googleUser.sub, googleUser.email, googleUser.name, googleUser.picture, now)
        .run();
    } else {
      if (count >= 2) {
        return json({ error: "already_full" }, { status: 403 });
      }
      if (!inviteCode) {
        return json({ error: "invite_code_required" }, { status: 403 });
      }
      const invite = await db
        .prepare(
          "SELECT * FROM invites WHERE code = ? AND used_by IS NULL AND expires_at > ?"
        )
        .bind(inviteCode, now)
        .first();
      if (!invite) {
        return json({ error: "invalid_invite_code" }, { status: 403 });
      }

      await db
        .prepare(
          `INSERT INTO users (id, google_sub, email, name, picture, role, created_at)
           VALUES (?, ?, ?, ?, ?, 'viewer', ?)`
        )
        .bind(id, googleUser.sub, googleUser.email, googleUser.name, googleUser.picture, now)
        .run();

      await db
        .prepare("UPDATE invites SET used_by = ? WHERE code = ?")
        .bind(id, inviteCode)
        .run();
    }

    user = await db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
  }

  const { token, maxAge } = await createSession(db, user.id);

  return json(
    { user: { id: user.id, email: user.email, name: user.name, picture: user.picture, role: user.role } },
    { headers: { "Set-Cookie": sessionCookie(token, maxAge) } }
  );
}
