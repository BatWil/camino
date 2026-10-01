// Supabase Edge Function (Deno) · sends a push for each new row in public.notifications.
// Trigger: Database Webhook on INSERT into public.notifications → POST here with header
// `x-camino-webhook: <PUSH_WEBHOOK_SECRET>`. See docs/notifications.md.
// Secrets (Supabase → Edge Functions → Secrets, never in the repo):
//   PUSH_WEBHOOK_SECRET
//   FCM_SERVICE_ACCOUNT  (JSON of a Firebase service account) — Android
//   APNS_KEY (.p8 contents), APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID (app.camino), APNS_ENV (production|sandbox) — iOS
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected by Supabase and only exist server-side.
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  apnsOutcome,
  apnsPayload,
  buildPush,
  decide,
  fcmMessage,
  safeEqual,
  type NoticeRow,
  type Prefs,
} from "./logic.ts";

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

const b64url = (data: ArrayBuffer | string) =>
  btoa(typeof data === "string" ? data : String.fromCharCode(...new Uint8Array(data)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

let cachedToken: { value: string; exp: number } | null = null;

async function googleAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.value;
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const pem = sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claims}`));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${b64url(signature)}`,
    }),
  });
  if (!res.ok) throw new Error(`oauth ${res.status}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, exp: now + json.expires_in };
  return json.access_token;
}

let cachedApns: { value: string; iat: number } | null = null;

/** APNs provider token (ES256 JWT), reused for up to 50 minutes as Apple recommends. */
async function apnsToken(keyPem: string, keyId: string, teamId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedApns && now - cachedApns.iat < 3000) return cachedApns.value;
  const header = b64url(JSON.stringify({ alg: "ES256", kid: keyId }));
  const claims = b64url(JSON.stringify({ iss: teamId, iat: now }));
  const pem = keyPem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(`${header}.${claims}`),
  );
  cachedApns = { value: `${header}.${claims}.${b64url(sig)}`, iat: now };
  return cachedApns.value;
}

Deno.serve(async (req) => {
  const secret = Deno.env.get("PUSH_WEBHOOK_SECRET") ?? "";
  if (req.method !== "POST" || !secret || !safeEqual(req.headers.get("x-camino-webhook") ?? "", secret)) {
    return new Response("forbidden", { status: 403 });
  }
  const payload = (await req.json().catch(() => null)) as { type?: string; table?: string; record?: NoticeRow } | null;
  const notice = payload?.record;
  if (payload?.type !== "INSERT" || payload.table !== "notifications" || !notice?.user_id) {
    return new Response("ignored", { status: 202 });
  }

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const [prefs, profile, devices, pushed] = await Promise.all([
    db
      .from("notification_preferences")
      .select("push_enabled, community, quiet_start, quiet_end")
      .eq("user_id", notice.user_id)
      .maybeSingle(),
    db.from("profiles").select("timezone").eq("id", notice.user_id).maybeSingle(),
    db.from("device_tokens").select("id, token, platform").eq("user_id", notice.user_id),
    db
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", notice.user_id)
      .gte("pushed_at", since),
  ]);

  const decision = decide({
    notice,
    prefs: (prefs.data as Prefs | null) ?? null,
    timeZone: (profile.data?.timezone as string | undefined) ?? "UTC",
    now: new Date(),
    pushedToday: pushed.count ?? 0,
    devices: devices.data?.length ?? 0,
  });
  if (!decision.send) return Response.json({ sent: 0, reason: decision.reason });

  const push = buildPush(notice);
  let sent = 0;
  const all = devices.data ?? [];

  // Android → FCM HTTP v1
  const fcmRaw = Deno.env.get("FCM_SERVICE_ACCOUNT");
  const android = all.filter((d) => d.platform === "android");
  if (fcmRaw && android.length) {
    const sa = JSON.parse(fcmRaw) as ServiceAccount;
    const accessToken = await googleAccessToken(sa);
    for (const device of android) {
      const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
        method: "POST",
        headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
        body: JSON.stringify(fcmMessage(device.token as string, push)),
      });
      if (res.ok) sent++;
      // UNREGISTERED / INVALID_ARGUMENT: the app was uninstalled or the token rotated.
      else if (res.status === 404 || res.status === 400) await db.from("device_tokens").delete().eq("id", device.id);
    }
  }

  // iOS → APNs (token-based auth)
  const apnsKey = Deno.env.get("APNS_KEY");
  const ios = all.filter((d) => d.platform === "ios");
  if (apnsKey && ios.length) {
    const jwt = await apnsToken(apnsKey, Deno.env.get("APNS_KEY_ID") ?? "", Deno.env.get("APNS_TEAM_ID") ?? "");
    const host = Deno.env.get("APNS_ENV") === "sandbox" ? "api.sandbox.push.apple.com" : "api.push.apple.com";
    for (const device of ios) {
      const res = await fetch(`https://${host}/3/device/${device.token}`, {
        method: "POST",
        headers: {
          authorization: `bearer ${jwt}`,
          "apns-topic": Deno.env.get("APNS_BUNDLE_ID") ?? "app.camino",
          "apns-push-type": "alert",
          "apns-priority": "5", // gentle: delivered with power considerations
          "content-type": "application/json",
        },
        body: JSON.stringify(apnsPayload(push, notice.kind)),
      });
      const reason = res.ok ? null : (((await res.json().catch(() => ({}))) as { reason?: string }).reason ?? null);
      const outcome = apnsOutcome(res.status, reason);
      if (outcome === "sent") sent++;
      else if (outcome === "drop_token") await db.from("device_tokens").delete().eq("id", device.id);
    }
  }

  if (!fcmRaw && !apnsKey) return Response.json({ sent: 0, reason: "push_not_configured" });
  if (sent > 0) await db.from("notifications").update({ pushed_at: new Date().toISOString() }).eq("id", notice.id);
  return Response.json({ sent });
});
