(function () {
  // Analitice proprii ElectroField: fără cookie-uri, fără IP stocat. Se numără afișările de pagini publice,
  // cât timp a stat vizitatorul pe pagină (la plecare) și cererile de programare (window.efTrackLead).
  var send = function (data) {
    try {
      var body = JSON.stringify(data);
      if (navigator.sendBeacon) navigator.sendBeacon("/api/analytics", new Blob([body], { type: "text/plain" }));
      else fetch("/api/analytics", { method: "POST", body: body, keepalive: true });
    } catch (e) { /* analiticele nu trebuie să strice niciodată pagina */ }
  };
  var off = false;
  try { off = Boolean(localStorage.getItem("ef-no-track")) || navigator.doNotTrack === "1"; } catch (e) { off = navigator.doNotTrack === "1"; }
  var path = location.pathname.replace(/\/+$/, "") || "/";
  window.efTrackLead = function () { if (!off) send({ type: "lead", path: path }); };
  if (off) return;
  var q = new URLSearchParams(location.search);
  var scr = "";
  try { scr = Math.round(screen.width) + "x" + Math.round(screen.height); } catch (e) { /* fără ecran */ }
  send({ path: path, referrer: document.referrer || "", utm: q.get("utm_source") || "", screen: scr, lang: navigator.language || "" });

  // Timpul se numără doar cât pagina e vizibilă; se trimite când vizitatorul pleacă sau schimbă tabul.
  var visibleMs = 0, since = document.visibilityState === "visible" ? Date.now() : 0, sent = 0;
  var flush = function () {
    if (since) { visibleMs += Date.now() - since; since = 0; }
    var s = Math.round(visibleMs / 1000);
    if (s >= 2 && s > sent) { sent = s; send({ type: "time", path: path, seconds: s }); }
  };
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flush(); else since = Date.now();
  });
  window.addEventListener("pagehide", flush);
})();
