// Server callers only: never expose token/secret in props, errors or logs.
const BASE = "https://www.oblio.eu/api";
export class OblioError extends Error {
  constructor(
    message: string,
    public readonly uncertain = false,
    public readonly rejected = false,
  ) {
    super(message);
  }
}
type ResponseBody = {
  status?: number;
  statusMessage?: string;
  data?: unknown;
  access_token?: string;
};
async function request(path: string, init: RequestInit) {
  let response: Response;
  try {
    response = await fetch(BASE + path, {
      ...init,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(25000),
    });
  } catch {
    throw new OblioError(
      "Oblio nu a răspuns. Verifică starea documentului înainte de a reîncerca.",
      true,
    );
  }
  let body: ResponseBody;
  try {
    body = await response.json();
  } catch {
    throw new OblioError("Răspunsul Oblio nu a putut fi citit.", true);
  }
  if (
    !response.ok ||
    (body.status !== undefined && Number(body.status) !== 200)
  ) {
    const status = Number(body.status) || response.status;
    if (status === 401 || status === 403)
      throw new OblioError(
        "Oblio a refuzat accesul. Verifică e-mailul și Client Secret din Setări → Date cont.",
      );
    if (status === 429)
      throw new OblioError(
        "Limita de apeluri Oblio a fost atinsă. Reîncearcă peste un minut.",
        true,
      );
    // Only document validation messages are surfaced, with auth material removed.
    const duplicate = /idempoten|duplic|exist|already/i.test(
      body.statusMessage ?? "",
    );
    const detail =
      typeof body.statusMessage === "string"
        ? body.statusMessage.replace(new Headers(init.headers).get("Authorization")?.replace(/^Bearer /, "") || "__no_token__", "[redactat]").replace(/<[^>]*>/g, "").slice(0, 300)
        : "";
    throw new OblioError(
      "Oblio nu a acceptat operația." +
        (path.startsWith("/docs/") && detail
          ? " " + detail
          : " Verifică datele clientului, seria și cotele TVA din cont."),
      status >= 500 || duplicate,
      status === 400 && !duplicate,
    );
  }
  return body;
}
export async function authorize(email: string, secret: string) {
  const r = await request("/authorize/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: email,
      client_secret: secret,
    }).toString(),
  });
  if (typeof r.access_token !== "string" || !r.access_token)
    throw new OblioError("E-mailul sau Client Secret nu este valid.");
  return r.access_token;
}
export async function oblioRead<T>(path: string, token: string): Promise<T> {
  return (
    await request(path, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
  ).data as T;
}
// Emit JSON numeric literals without converting decimal strings to IEEE floats.
export function fiscalJson(payload: unknown) {
  return JSON.stringify(payload).replace(
    /"(quantity|price|vatPercentage)":"(-?\d+(?:\.\d+)?)"/g,
    '"$1":$2',
  );
}
export function safeOblioUrl(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const u = new URL(value);
    return u.protocol === "https:" &&
      u.hostname === "www.oblio.eu" &&
      !u.username &&
      !u.password &&
      u.pathname === "/utils/show_file/"
      ? u.href
      : null;
  } catch {
    return null;
  }
}
export async function issueOblio(
  token: string,
  kind: string,
  payload: Record<string, unknown>,
) {
  const r = await request(
    kind === "proforma" ? "/docs/proforma" : "/docs/invoice",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: fiscalJson(payload),
    },
  );
  const d = r.data as
    | { seriesName?: string; number?: string | number; link?: string }
    | undefined;
  if (!d?.seriesName || d.number === undefined || String(d.number) === "")
    throw new OblioError(
      "Oblio nu a confirmat numărul documentului. Verifică starea înainte de a reîncerca.",
      true,
    );
  return {
    series: d.seriesName,
    number: String(d.number),
    url: safeOblioUrl(d.link),
  };
}
export type OblioSeries = { type: string; name: string; next?: string };
