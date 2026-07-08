// Shared admin token helpers. The admin panel obtains a short-lived signed token
// from the `admin-login` function and includes it in subsequent admin requests.
// The HMAC secret reuses SUPABASE_SERVICE_ROLE_KEY so no extra secret is needed.

const TOKEN_TTL_SECONDS = 60 * 60 * 8; // 8h

function getKey() {
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
}

async function hmacHex(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getKey()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function issueAdminToken(): Promise<{ token: string; exp: number }> {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const sig = await hmacHex(`admin.${exp}`);
  return { token: `${exp}.${sig}`, exp };
}

export async function verifyAdminToken(token: string | null | undefined): Promise<boolean> {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  const [expStr, sig] = token.split(".");
  const exp = parseInt(expStr, 10);
  if (!exp || exp * 1000 < Date.now()) return false;
  const expected = await hmacHex(`admin.${exp}`);
  // constant-time-ish compare
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

export const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") ?? "";
