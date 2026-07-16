// Google ID 토큰(RS256 JWT) 검증을 Web Crypto API만으로 직접 구현.
// Cloudflare Pages의 Git 연동 빌드는 npm install을 실행하지 않고 바로
// Functions를 번들링하기 때문에 `jose` 같은 npm 의존성을 해석하지 못한다.

const JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const JWKS_TTL_MS = 60 * 60 * 1000;

let cachedJWKS = null;
let cachedAt = 0;

function base64UrlToBytes(str) {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) base64 += "=";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlDecodeJSON(str) {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(str)));
}

async function getGoogleJWKS(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedJWKS && now - cachedAt < JWKS_TTL_MS) return cachedJWKS;
  const res = await fetch(JWKS_URL);
  const data = await res.json();
  cachedJWKS = data.keys;
  cachedAt = now;
  return cachedJWKS;
}

async function importGooglePublicKey(jwk) {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
}

export async function verifyGoogleIdToken(idToken, clientId) {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("malformed_token");
  const [headerB64, payloadB64, signatureB64] = parts;

  const header = base64UrlDecodeJSON(headerB64);
  const payload = base64UrlDecodeJSON(payloadB64);

  if (header.alg !== "RS256") throw new Error("unsupported_alg");

  let jwks = await getGoogleJWKS();
  let jwk = jwks.find((k) => k.kid === header.kid);
  if (!jwk) {
    jwks = await getGoogleJWKS(true); // 키 로테이션 대비 강제 재조회
    jwk = jwks.find((k) => k.kid === header.kid);
  }
  if (!jwk) throw new Error("unknown_kid");

  const key = await importGooglePublicKey(jwk);
  const signature = base64UrlToBytes(signatureB64);
  const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

  const valid = await crypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    signature,
    signedData
  );
  if (!valid) throw new Error("invalid_signature");

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp < now) throw new Error("expired_token");
  if (payload.iss !== "https://accounts.google.com" && payload.iss !== "accounts.google.com") {
    throw new Error("invalid_issuer");
  }
  if (payload.aud !== clientId) throw new Error("invalid_audience");
  if (!payload.email_verified) throw new Error("email_not_verified");

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name || payload.email,
    picture: payload.picture || null,
  };
}
