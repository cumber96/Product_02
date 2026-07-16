import { json } from "../_lib/auth.js";

export async function onRequestGet(context) {
  const { env } = context;
  return json({
    googleClientId: env.GOOGLE_CLIENT_ID,
    vapidPublicKey: env.VAPID_PUBLIC_KEY,
  });
}
