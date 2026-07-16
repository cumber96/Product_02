// RFC 8291 (Web Push 메시지 암호화) + RFC 8292 (VAPID) 를 Web Crypto API만으로 직접 구현.
// Cloudflare Workers/Pages Functions 런타임에는 Node의 http/https가 없어서
// npm `web-push` 패키지 대신 fetch 기반으로 직접 만든다.

function concatBytes(...arrays) {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    result.set(a, offset);
    offset += a.length;
  }
  return result;
}

function base64UrlToBytes(str) {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) base64 += "=";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hkdf(ikm, salt, infoBytes, length) {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: infoBytes },
    key,
    length * 8
  );
  return new Uint8Array(bits);
}

async function encryptPayload(payloadBytes, p256dhB64, authB64) {
  const uaPublicBytes = base64UrlToBytes(p256dhB64);
  const authSecret = base64UrlToBytes(authB64);

  const uaPublicKey = await crypto.subtle.importKey(
    "raw",
    uaPublicBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  const asKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );
  const asPublicBytes = new Uint8Array(await crypto.subtle.exportKey("raw", asKeyPair.publicKey));

  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: uaPublicKey },
    asKeyPair.privateKey,
    256
  );
  const ecdhSecret = new Uint8Array(sharedSecretBits);

  const enc = new TextEncoder();
  const keyInfo = concatBytes(enc.encode("WebPush: info\0"), uaPublicBytes, asPublicBytes);
  const ikm = await hkdf(ecdhSecret, authSecret, keyInfo, 32);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(ikm, salt, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(ikm, salt, enc.encode("Content-Encoding: nonce\0"), 12);

  const paddedPlaintext = concatBytes(payloadBytes, new Uint8Array([0x02]));

  const aesKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const ciphertextBits = await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, paddedPlaintext);
  const ciphertext = new Uint8Array(ciphertextBits);

  const rsBuf = new Uint8Array(4);
  new DataView(rsBuf.buffer).setUint32(0, ciphertext.length, false);

  const header = concatBytes(salt, rsBuf, new Uint8Array([asPublicBytes.length]), asPublicBytes);

  return concatBytes(header, ciphertext);
}

async function importVapidPrivateKey(publicKeyB64Url, privateKeyB64Url) {
  const pub = base64UrlToBytes(publicKeyB64Url); // 0x04 || x(32) || y(32)
  const x = pub.slice(1, 33);
  const y = pub.slice(33, 65);
  const jwk = {
    kty: "EC",
    crv: "P-256",
    d: privateKeyB64Url,
    x: bytesToBase64Url(x),
    y: bytesToBase64Url(y),
    ext: true,
  };
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
}

async function createVapidAuthHeader(endpoint, subject, publicKeyB64Url, privateKeyB64Url) {
  const key = await importVapidPrivateKey(publicKeyB64Url, privateKeyB64Url);
  const { origin } = new URL(endpoint);

  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: subject,
  };

  const enc = new TextEncoder();
  const headerB64 = bytesToBase64Url(enc.encode(JSON.stringify(header)));
  const payloadB64 = bytesToBase64Url(enc.encode(JSON.stringify(payload)));
  const unsigned = `${headerB64}.${payloadB64}`;

  const signatureBits = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    enc.encode(unsigned)
  );
  const signatureB64 = bytesToBase64Url(new Uint8Array(signatureBits));

  return `vapid t=${unsigned}.${signatureB64}, k=${publicKeyB64Url}`;
}

export async function sendWebPush(env, subscription, payloadObject, ttlSeconds = 60 * 60 * 24) {
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payloadObject));
  const body = await encryptPayload(payloadBytes, subscription.p256dh, subscription.auth);
  const authHeader = await createVapidAuthHeader(
    subscription.endpoint,
    env.VAPID_SUBJECT,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );

  return fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: String(ttlSeconds),
      Authorization: authHeader,
    },
    body,
  });
}
