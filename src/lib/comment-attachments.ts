import { randomUUID } from "node:crypto";
import { getDb } from "./db";
import { postComment } from "./actions";
import { ActionError } from "./validate";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_COMMENT_BYTES = 20 * 1024 * 1024;
export const MAX_COMMENT_FILES = 5;
export type CommentFile = { name: string; url: string; type?: string; size?: number };
export type Upload = { name: string; type: string; data: Uint8Array };

// Keep uploads in the same private database/transaction as their comment. There
// are no public bucket URLs or abandoned uploads if validation or saving fails.
export function saveComment(input: unknown, uploads: Upload[] = []) {
  if (uploads.length > MAX_COMMENT_FILES) throw new ActionError("Attach up to 5 files.");
  if (uploads.reduce((n, f) => n + f.data.byteLength, 0) > MAX_COMMENT_BYTES) throw new ActionError("Keep attachments under 20 MB in total.", 413);
  const checked = uploads.map((f) => {
    if (!f.data.byteLength || f.data.byteLength > MAX_FILE_BYTES) throw new ActionError("Each file must be between 1 byte and 10 MB.", 413);
    let type = f.type.split(";")[0].toLowerCase();
    if (type === "audio/x-m4a") type = "audio/mp4";
    if (type === "audio/mp3") type = "audio/mpeg";
    if (!type && /\.(txt|md)$/i.test(f.name)) type = "text/plain";
    if (!/^(image\/(png|jpeg|webp|gif)|audio\/(webm|ogg|wav|x-wav|mpeg|mp4|aac)|application\/pdf|text\/(plain|markdown))$/.test(type)) {
      throw new ActionError("Use an image, audio recording, PDF, or text file.");
    }
    const name = f.name.replace(/[\x00-\x1f\x7f/\\]/g, "_").slice(0, 180) || "attachment";
    return { id: randomUUID(), name, type, data: Buffer.from(f.data) };
  });
  return getDb().transaction(() => {
    const files: CommentFile[] = checked.map((f) => {
      getDb().prepare("INSERT INTO comment_attachments (id, name, media_type, data) VALUES (?, ?, ?, ?)").run(f.id, f.name, f.type, f.data);
      return { name: f.name, url: `/api/attachments/${f.id}`, type: f.type, size: f.data.length };
    });
    return postComment(input, files);
  })();
}

/** Bound the entire request before decoding multipart, even without Content-Length. */
export async function readCommentRequest(req: Request): Promise<{ input: unknown; uploads: Upload[] }> {
  const origin = req.headers.get("origin");
  if (origin) {
    // Next can reconstruct req.url with its internal localhost hostname. The
    // browser's Host header retains the Office address (also behind a proxy).
    const protocol = req.headers.get("x-forwarded-proto")?.split(",")[0].trim() || new URL(req.url).protocol.slice(0, -1);
    const host = req.headers.get("host") || new URL(req.url).host;
    let sameOrigin = false;
    try { sameOrigin = ["http", "https"].includes(protocol) && new URL(origin).origin === new URL(`${protocol}://${host}`).origin; } catch { /* Reject malformed origins. */ }
    if (!sameOrigin) throw new ActionError("Send the comment from this Office.", 403);
  }
  const cap = MAX_COMMENT_BYTES + 256 * 1024;
  const reader = req.body?.getReader();
  if (!reader) throw new ActionError("The comment is empty.");
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > cap) { await reader.cancel(); throw new ActionError("Keep the comment and attachments under 20 MB.", 413); }
    chunks.push(value);
  }
  const body = Buffer.concat(chunks);
  const type = req.headers.get("content-type") || "";
  if (!type.startsWith("multipart/form-data")) {
    try { return { input: JSON.parse(body.toString()), uploads: [] }; }
    catch { throw new ActionError("The comment could not be read. Try again."); }
  }
  let form: FormData;
  try { form = await new Response(body, { headers: { "content-type": type } }).formData(); }
  catch { throw new ActionError("The comment could not be read. Try again."); }
  const input: Record<string, unknown> = {};
  for (const key of ["task", "note", "project", "body"]) {
    const value = form.get(key);
    if (typeof value === "string") input[key] = value.replace(/\r\n/g, "\n");
  }
  if (form.has("reply_to")) input.reply_to = Number(form.get("reply_to"));
  const uploads: Upload[] = [];
  for (const file of form.getAll("files")) {
    if (typeof file === "string") throw new ActionError("Attach a file using the attachment button.");
    uploads.push({ name: file.name, type: file.type, data: new Uint8Array(await file.arrayBuffer()) });
  }
  return { input, uploads };
}
