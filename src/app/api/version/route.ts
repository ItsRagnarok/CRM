// Versiunea care rulează acum pe server. Paginile deschise o compară cu versiunea lor (VersionWatcher):
// după o actualizare, o pagină veche ar trimite butoanele la o versiune care nu mai există și
// „nu s-ar întâmpla nimic” la clic — așa că se reîncarcă singură.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { v: process.env.NEXT_PUBLIC_APP_VERSION ?? "local" },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
