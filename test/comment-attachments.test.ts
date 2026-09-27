import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "office-attachments-"));
process.env.OFFICE_DB_PATH = path.join(dir, "office.db");
process.env.OFFICE_SEED = "none";
// Exercise the migration on an Office created before note attachments existed.
const old = new Database(process.env.OFFICE_DB_PATH);
old.exec(fs.readFileSync(path.join(process.cwd(), "db/schema.sql"), "utf8").replace(/  files_json      TEXT NOT NULL DEFAULT '\[\]',\n/, ""));
old.close();
const { saveComment, readCommentRequest, MAX_FILE_BYTES } = require("../src/lib/comment-attachments") as typeof import("../src/lib/comment-attachments");
const { runAction, callAction } = require("../src/lib/actions") as typeof import("../src/lib/actions");
const { getDb } = require("../src/lib/db") as typeof import("../src/lib/db");
after(() => { getDb().close(); fs.rmSync(dir, { recursive: true, force: true }); });

test("uploads stay with their task, note or project and reach the owner's paginated feed", () => {
  runAction("upsert_member", { slug: "chief", name: "Muse", role: "Chief", job: "Organizes", is_chief: true });
  runAction("upsert_project", { slug: "work", name: "Work", lead: "chief" });
  const task = runAction("create_task", { project: "work", title: "Check context", specialist: "chief" }) as { id: string };
  runAction("upsert_note", { slug: "guide", title: "Guide", markdown: "A guide", kept_by: "chief" });
  const uploads = [
    { name: "screenshot.png", type: "image/png", data: new Uint8Array([137,80,78,71]) },
    { name: "voice.m4a", type: "audio/x-m4a", data: new Uint8Array([1,2,3]) },
  ];
  const refs = [
    { source: "task", target: task.id, input: { task: task.id } },
    { source: "note", target: "guide", input: { note: "guide" } },
    { source: "project", target: "work", input: { project: "work" } },
  ];
  const saved = refs.map((r) => ({ ...r, ...saveComment({ ...r.input, body: "**Please check this**" }, uploads) }));
  type Item = { id: number; source: string; target_id: string; target_title: string; owner: string; url: string; files: Array<{ name: string; url: string; type: string }> };
  const found: Item[] = [];
  let cursor: string | null = null;
  do {
    const page = runAction("list_recent_updates", { unread_only: true, limit: 1, ...(cursor ? { cursor } : {}) }) as { updates: Item[]; next_cursor: string | null };
    found.push(...page.updates); cursor = page.next_cursor;
  } while (cursor);
  assert.equal(found.length, 3);
  for (const c of saved) {
    const item = found.find((u) => u.source === c.source && u.id === c.id)!;
    assert.equal(item.target_id, c.target); assert.equal(item.owner, "chief"); assert.ok(item.target_title);
    assert.equal(item.files[1].type, "audio/mp4");
    const key = item.files[0].url.split("/").at(-1)!;
    const file = getDb().prepare("SELECT data FROM comment_attachments WHERE id = ?").get(key) as { data: Buffer };
    assert.deepEqual([...file.data], [...uploads[0].data]);
    assert.equal(callAction("reply_to_comment", { source: c.source, target_id: "wrong-page", comment_id: c.id, author: "chief", body: "wrong" }).status, 404);
    runAction("reply_to_comment", { source: c.source, target_id: c.target, comment_id: c.id, author: "chief", body: "Checked the attachment." });
  }
  assert.equal((runAction("summary", {}) as { unread_comments: number }).unread_comments, 0);
  const note = runAction("get_note", { slug: "guide" }) as { comments: Array<{ files: unknown[] }> };
  assert.equal(note.comments[0].files.length, 2);
  assert.equal(saveComment({ note: "guide", body: "" }, uploads).kind, "comment", "audio or screenshot can be the whole comment");
});

test("failed comment validation rolls back uploads and keeps page references distinct", () => {
  const count = () => (getDb().prepare("SELECT count(*) AS n FROM comment_attachments").get() as { n: number }).n;
  const before = count();
  const file = [{ name: "voice.wav", type: "audio/wav", data: new Uint8Array([1,2]) }];
  assert.throws(() => saveComment({ note: "missing", body: "test" }, file), /No note/);
  assert.equal(count(), before);
  assert.throws(() => saveComment({ task: "x", note: "guide", body: "test" }, file), /exactly one/);
  assert.equal(count(), before);
  assert.throws(() => saveComment({ note: "guide", body: "test" }, [{ ...file[0], type: "text/html" }]), /image, audio/);
  assert.throws(() => saveComment({ note: "guide", body: "test" }, [{ ...file[0], data: new Uint8Array(MAX_FILE_BYTES + 1) }]), /10 MB/);
  assert.equal(count(), before);
});

test("multipart preserves content and rejects cross-origin writes and oversized streams", async () => {
  const form = new FormData(); form.set("note", "guide"); form.set("body", "first\nsecond"); form.set("reply_to", "1");
  form.append("files", new File(["voice fixture"], "voice.webm", { type: "audio/webm" }));
  const parsed = await readCommentRequest(new Request("http://office.test/api/comments", { method: "POST", body: form, headers: { origin: "http://office.test" } }));
  assert.deepEqual(parsed.input, { note: "guide", body: "first\nsecond", reply_to: 1 });
  assert.equal(parsed.uploads[0].name, "voice.webm");
  await assert.rejects(readCommentRequest(new Request("http://office.test/api/comments", { method: "POST", body: "{}", headers: { origin: "http://elsewhere.test" } })), /this Office/);
  await assert.rejects(readCommentRequest(new Request("http://office.test/api/comments", { method: "POST", body: new Uint8Array(21 * 1024 * 1024) })), /under 20 MB/);
  await assert.rejects(readCommentRequest(new Request("http://office.test/api/comments", { method: "POST", body: "broken", headers: { "content-type": "multipart/form-data" } })), /could not be read/);
});

test("removing a note also removes its private uploads", () => {
  runAction("upsert_note", { slug: "temporary", title: "Temporary", markdown: "Test", kept_by: "chief" });
  saveComment({ note: "temporary", body: "" }, [{ name: "private.txt", type: "text/plain", data: new Uint8Array([1,2,3]) }]);
  const before = (getDb().prepare("SELECT count(*) AS n FROM comment_attachments").get() as { n: number }).n;
  runAction("remove_note", { slug: "temporary" });
  assert.equal((getDb().prepare("SELECT count(*) AS n FROM comment_attachments").get() as { n: number }).n, before - 1);
});

test("private audio supports browser range requests without exposing active files", async () => {
  const { attachmentResponse } = await import("../src/lib/attachment-response");
  const file = { name: "voice.wav", media_type: "audio/wav", data: new Uint8Array([1,2,3,4,5]) };
  const response = attachmentResponse(new Request("http://office.test/file", { headers: { range: "bytes=1-3" } }), file);
  assert.equal(response.status, 206); assert.equal(response.headers.get("content-range"), "bytes 1-3/5");
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [2,3,4]);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.match(response.headers.get("content-security-policy")!, /sandbox/);
  assert.equal(attachmentResponse(new Request("http://office.test/file", { headers: { range: "bytes=99-100" } }), file).status, 416);
});
