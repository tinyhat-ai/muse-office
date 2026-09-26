import { randomUUID } from "node:crypto";
import { run } from "./db";
import { ActionError } from "./validate";

export function saveScreenshot(task: string, base64: string) {
  if (base64.length > 5600000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) throw new ActionError("Choose a PNG, JPG or WebP screenshot smaller than 4 MB.");
  const data = Buffer.from(base64, "base64");
  const mime = data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? "image/png"
    : data[0] === 255 && data[1] === 216 && data[2] === 255 ? "image/jpeg"
    : data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP" ? "image/webp" : null;
  if (!mime || data.length > 4 * 1024 * 1024) throw new ActionError("Choose a PNG, JPG or WebP screenshot smaller than 4 MB.");
  const id = randomUUID();
  run("INSERT INTO screenshots (id, task, mime, data) VALUES (?, ?, ?, ?)", id, task, mime, data);
  return { name: "Screenshot", url: `/api/screenshots/${id}` };
}
