/** An overview visual can run its own UI without access to Office data or APIs. */
export function taskVisualDocument(html: string): string {
  const policy = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'";
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="viewport" content="width=device-width, initial-scale=1"><style>
html,body{margin:0;padding:0;background:transparent;color:#1c1c19;font:16px/1.45 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;overflow-wrap:anywhere}*{box-sizing:border-box}img,svg,canvas{max-width:100%}
</style><script>
(() => {
  const measure = () => parent.postMessage({ type: 'office-overview-height', height: Math.ceil(document.body.getBoundingClientRect().height) }, '*');
  addEventListener('load', () => { new ResizeObserver(measure).observe(document.body); measure(); });
  addEventListener('message', event => { if (event.source === parent && event.data?.type === 'office-overview-measure') measure(); });
})();
</script></head><body>${html}</body></html>`;
}

export function taskVisualHeight(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(64, Math.min(720, Math.ceil(value))) : null;
}
