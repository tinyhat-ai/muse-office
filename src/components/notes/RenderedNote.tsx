"use client";

import { useEffect, useRef } from "react";

let mermaidReady = false;

/**
 * The server supplies sanitized GFM HTML. Mermaid code fences stay as escaped
 * code until the browser draws them. SVGs are displayed as images, so diagram
 * text cannot become active page markup or a clickable link.
 */
export function RenderedNote({ html }: { html: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const blocks = [...(root.current?.querySelectorAll<HTMLElement>("pre > code.language-mermaid") ?? [])];
    if (!blocks.length) return;

    async function draw() {
      const { default: mermaid } = await import("mermaid");
      if (!mermaidReady) {
        mermaid.initialize({ startOnLoad: false, securityLevel: "strict", htmlLabels: false, theme: "neutral", maxTextSize: 10000 });
        mermaidReady = true;
      }
      for (const block of blocks) {
        if (cancelled || !block.isConnected) return;
        const code = (block.textContent ?? "").trim();
        if (!code || code.length > 10000) continue;
        try {
          const id = `office-mermaid-${crypto.randomUUID().replaceAll("-", "")}`;
          const { svg } = await mermaid.render(id, code);
          if (cancelled || !block.isConnected) return;
          const image = document.createElement("img");
          image.className = "md-mermaid-image";
          image.alt = `Diagram: ${code.split("\n", 1)[0]}`;
          image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
          const figure = document.createElement("figure");
          figure.className = "md-mermaid";
          figure.append(image);
          block.parentElement?.replaceWith(figure);
        } catch {
          // The source remains visible so the note is still readable and the
          // chief can fix an invalid diagram without losing its text.
          block.parentElement?.classList.add("md-mermaid-error");
        }
      }
    }
    void draw();
    return () => { cancelled = true; };
  }, [html]);

  return <div className="md nt-body" ref={root} dangerouslySetInnerHTML={{ __html: html }} />;
}
