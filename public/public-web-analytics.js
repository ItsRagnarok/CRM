(() => {
  window.va = window.va || function () {
    (window.vaq = window.vaq || []).push(arguments);
  };

  window.va("beforeSend", (event) => {
    const url = new URL(event.url, window.location.origin);
    url.search = "";
    url.hash = "";
    return { ...event, url: url.toString() };
  });

  const script = document.createElement("script");
  script.src = "/_vercel/insights/script.js";
  script.defer = true;
  document.head.appendChild(script);
})();
