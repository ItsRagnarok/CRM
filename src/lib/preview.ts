export const PREVIEW_COOKIE = "ef-preview";
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parsePreview(value?: string) {
  const parts = (value ?? "").split(":");
  if (parts.length !== 2) return null;
  const [organizationId, profileId] = parts;
  return UUID.test(organizationId ?? "") && UUID.test(profileId ?? "")
    ? { organizationId, profileId } : null;
}

// Defence in depth: database policies and triggers also reject preview writes.
export function readOnlyFetch(baseFetch: typeof fetch): typeof fetch {
  return async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    const readRpc = /^\/rest\/v1\/rpc\/(platform_admin_(list|get)_[a-z0-9_]+|company_admin_get_employee_email|ef_preview_employee_email)$/.test(url.pathname);
    const signUrl = /^\/storage\/v1\/object\/sign(?:\/|$)/.test(url.pathname);
    const auth = url.pathname.startsWith("/auth/v1/");
    if (!["GET", "HEAD"].includes(method) && !readRpc && !signUrl && !auth) {
      return Response.json({ message: "Vizualizare doar în citire. Modificările sunt dezactivate.", code: "42501" }, { status: 403 });
    }
    return baseFetch(input, init);
  };
}
