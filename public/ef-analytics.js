(function () {
  // Analitice proprii ElectroField: fără cookie-uri, fără IP stocat. Se numără doar afișările de pagini publice.
  try {
    if (localStorage.getItem("ef-no-track") || navigator.doNotTrack === "1") return;
    var path = location.pathname.replace(/\/+$/, "") || "/";
    var q = new URLSearchParams(location.search);
    var body = JSON.stringify({ path: path, referrer: document.referrer || "", utm: q.get("utm_source") || "" });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/analytics", new Blob([body], { type: "text/plain" }));
    else fetch("/api/analytics", { method: "POST", body: body, keepalive: true });
  } catch (e) { /* analiticele nu trebuie să strice niciodată pagina */ }
})();
