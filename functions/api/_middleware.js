import { getSessionUser, json } from "../_lib/auth.js";

const PUBLIC_PATHS = new Set(["/api/auth/google", "/api/config"]);

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (PUBLIC_PATHS.has(url.pathname)) {
    return context.next();
  }

  const user = await getSessionUser(env.DB, request);
  if (!user) {
    return json({ error: "unauthorized" }, { status: 401 });
  }

  context.data.user = user;
  return context.next();
}
