export function attachmentResponse(req: Request, file: { name: string; media_type: string; data: Uint8Array }): Response {
  const size = file.data.byteLength;
  const headers: Record<string, string> = {
    "Content-Type": file.media_type === "audio/x-wav" ? "audio/wav" : file.media_type,
    "Content-Disposition": `${/^(image|audio)\//.test(file.media_type) ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(file.name).replace(/'/g, "%27")}`,
    "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox",
    "Cache-Control": "private, no-store", "Accept-Ranges": "bytes",
  };
  const range = req.headers.get("range");
  let start = 0, end = size - 1;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${size}` } });
    if (!match[1]) start = Math.max(0, size - Number(match[2]));
    else { start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), end) : end; }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${size}` } });
    headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
  }
  headers["Content-Length"] = String(end - start + 1);
  return new Response(new Uint8Array(file.data.slice(start, end + 1)), { status: range ? 206 : 200, headers });
}
