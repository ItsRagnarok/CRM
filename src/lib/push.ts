import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

// Real (system-tray, works with the app closed) push notifications via
// Firebase Cloud Messaging's HTTP v1 API, called directly with fetch — same
// approach as the Gemini/Groq integrations: no SDK, just the REST API and a
// hand-signed service-account JWT, so this has zero extra dependencies.
// Requires three Vercel env vars from a Firebase project's service account:
// FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.
// Silently no-ops (logging only) when unconfigured or on failure — a push
// notification is a nice-to-have side effect and must never block the
// action that triggered it (job started, call requested, etc.).

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

async function getAccessToken(): Promise<string | null> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) return null;

  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 30_000) {
    return cachedAccessToken.token;
  }

  const { createSign } = await import("node:crypto");
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const signingInput = `${header}.${claim}`;
  const signature = createSign("RSA-SHA256").update(signingInput).sign(privateKey, "base64url");
  const jwt = `${signingInput}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    console.error("push: failed to mint FCM access token", res.status, await res.text().catch(() => ""));
    return null;
  }
  const data = await res.json();
  cachedAccessToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedAccessToken.token;
}

// Must match the channel the app creates in push-registration.tsx. Without a
// high-importance channel Android shows the push silently in the tray (no
// heads-up banner, no sound), and without HIGH priority Doze can hold it for
// minutes while the phone is idle — exactly the "app closed" case.
export const PUSH_CHANNEL_ID = "electrofield_alerts";

async function sendToToken(projectId: string, accessToken: string, token: string, title: string, body: string, data?: Record<string, string>) {
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: "POST",
    signal: AbortSignal.timeout(8000),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        data,
        android: {
          priority: "HIGH",
          ttl: "86400s",
          notification: { channel_id: PUSH_CHANNEL_ID, sound: "default", default_vibrate_timings: true },
        },
      },
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    // Only an explicit UNREGISTERED error code means this token is dead.
    // A bare NOT_FOUND also comes back when FIREBASE_PROJECT_ID is wrong, and
    // treating that as "stale" would wipe every device's token in one send.
    let errorCode = "";
    try {
      const parsed = JSON.parse(errText) as { error?: { details?: { errorCode?: string }[] } };
      errorCode = parsed.error?.details?.find((d) => d.errorCode)?.errorCode ?? "";
    } catch {
      /* non-JSON error body */
    }
    if (errorCode === "UNREGISTERED") {
      return { token, stale: true, ok: false };
    }
    console.error("push: FCM send failed", res.status, errText);
    return { token, stale: false, ok: false };
  }
  return { token, stale: false, ok: true };
}

export type PushResult =
  | { status: "sent"; delivered: number; devices: number }
  | { status: "no_profiles" | "not_configured" | "no_devices" | "failed"; delivered: number; devices: number };

// Sends a real push to every registered device of the given profiles, in
// addition to whatever in-app `notifications` row the caller already wrote.
// Safe to call unconditionally — no-ops cleanly if Firebase isn't configured
// or a profile has no registered device.
export async function sendPushToProfiles(
  supabase: SupabaseClient<Database>,
  profileIds: string[],
  message: { title: string; body: string; data?: Record<string, string> }
): Promise<PushResult> {
  if (profileIds.length === 0) return { status: "no_profiles", delivered: 0, devices: 0 };
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) return { status: "not_configured", delivered: 0, devices: 0 };

  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return { status: "not_configured", delivered: 0, devices: 0 };

    const { data: tokens } = await supabase
      .from("device_push_tokens")
      .select("token")
      .in("profile_id", profileIds);
    if (!tokens || tokens.length === 0) return { status: "no_devices", delivered: 0, devices: 0 };

    const results = await Promise.all(
      tokens.map((t) => sendToToken(projectId, accessToken, t.token, message.title, message.body, message.data))
    );
    const staleTokens = results.filter((r) => r.stale).map((r) => r.token);
    if (staleTokens.length > 0) {
      await supabase.from("device_push_tokens").delete().in("token", staleTokens);
    }
    const delivered = results.filter((r) => r.ok).length;
    return { status: delivered > 0 ? "sent" : "failed", delivered, devices: tokens.length };
  } catch (err) {
    console.error("push: sendPushToProfiles failed", err);
    return { status: "failed", delivered: 0, devices: 0 };
  }
}
