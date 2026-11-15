"use client";

import { useCallback, useState } from "react";
import s from "./mail.module.css";

export function MailReaderBody({ html, text, showImages }: { html?: string; text: string; showImages: boolean }) {
  const [height, setHeight] = useState(160);
  const trackHeight = useCallback((frame: HTMLIFrameElement | null) => {
    if (!frame) return;
    let observer: ResizeObserver | undefined;
    const observe = () => {
      observer?.disconnect();
      const content = frame.contentDocument?.body;
      if (!content) return;
      const resize = () => setHeight(Math.max(160, content.offsetHeight));
      observer = new ResizeObserver(resize);
      observer.observe(content);
      resize();
    };
    frame.addEventListener("load", observe);
    return () => {
      frame.removeEventListener("load", observe);
      observer?.disconnect();
    };
  }, []);

  if (!html?.trim()) return <div className={s.body}>{text}</div>;

  const imageSources = showImages ? "data: https:" : "data:";
  const document = `<!doctype html><html><head><meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src ${imageSources}; base-uri 'none'; form-action 'none'">
    <meta name="referrer" content="no-referrer">
    <style>body{margin:0;padding:12px;box-sizing:border-box;background:white;color:#222;font:14px/1.5 Arial,sans-serif;overflow-wrap:anywhere}img{max-width:100%;height:auto}table{max-width:100%}pre{white-space:pre-wrap}a{color:#2854ad}</style>
    </head><body>${html}</body></html>`;

  return (
    <div className={s.formattedBody}>
      <iframe title="Conținutul emailului" ref={trackHeight}
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer" srcDoc={document} style={{ height }}
      />
    </div>
  );
}
