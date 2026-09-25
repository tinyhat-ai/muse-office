import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// A throwaway, empty office for every run of this file. The database path is
// read when the db module loads, so it is set before the first require.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "office-test-"));
process.env.OFFICE_DB_PATH = path.join(dir, "office.db");
process.env.OFFICE_SEED = "none";
const { runAction, postComment, callAction } = require("../src/lib/actions") as typeof import("../src/lib/actions");
const { getDb } = require("../src/lib/db") as typeof import("../src/lib/db");

before(() => {
  runAction("upsert_member", { slug: "chief", name: "Muse", role: "Chief of staff", job: "Runs the team.", is_chief: true });
  runAction("upsert_member", { slug: "penny", name: "Penny", role: "Bookkeeper", job: "Money." });
  runAction("upsert_project", { slug: "money", name: "Money", lead: "penny" });
});

after(() => {
  getDb().close();
  fs.rmSync(dir, { recursive: true, force: true });
});

test("moving to waiting_on_you posts the question in the same step, and an answer binds to that row", () => {
  const created = runAction("create_task", { project: "money", title: "Pay the bill", specialist: "penny" }) as { id: string };
  const id = created.id;

  const first = runAction("move_task", { id, column: "waiting_on_you", question: "Can I pay $12?", question_kind: "money" }) as { question_update_id: number };
  assert.ok(first.question_update_id, "the move returns the question row it posted");
  const rows = () => getDb().prepare("SELECT id, kind, body, reply_to, author FROM task_updates WHERE task = ? ORDER BY id").all(id) as Array<{ id: number; kind: string; body: string; reply_to: number | null; author: string }>;
  assert.deepEqual(rows().filter((r) => r.kind === "question").map((r) => r.body), ["Can I pay $12?"]);

  // Asking the same question again through add_task_note does not make a second card.
  const again = runAction("add_task_note", { id, author: "penny", kind: "question", body: "Can I pay $12?" }) as { id: number };
  assert.equal(again.id, first.question_update_id);
  assert.equal(rows().filter((r) => r.kind === "question").length, 1);

  // The user says yes to the $12 question.
  const yes = postComment({ task: id, body: "yes", reply_to: first.question_update_id });
  assert.equal(yes.kind, "reply");

  // Back to work, then a different money question.
  runAction("move_task", { id, column: "todo" });
  const second = runAction("move_task", { id, column: "waiting_on_you", question: "Can I pay $99 now?", question_kind: "money" }) as { question_update_id: number };
  assert.notEqual(second.question_update_id, first.question_update_id);
  const current = rows().filter((r) => r.kind === "question").at(-1)!;
  assert.equal(current.body, "Can I pay $99 now?");
  // The old yes replies to the old row, never to the new question.
  const oldYes = rows().find((r) => r.author === "you")!;
  assert.equal(oldYes.reply_to, first.question_update_id);
  assert.equal(rows().filter((r) => r.author === "you" && r.reply_to === current.id).length, 0);
});

test("a bare yes on a money question is refused; a linked one is stored and reported with its question", () => {
  const { id } = runAction("create_task", { project: "money", title: "Renew the domain", specialist: "penny" }) as { id: string };
  const moved = runAction("move_task", { id, column: "waiting_on_you", question: "OK to pay $16?", question_kind: "money" }) as { question_update_id: number };

  assert.throws(() => postComment({ task: id, body: "yes" }), /Yes \/ Not yet buttons/);
  assert.throws(() => postComment({ task: id, body: "Not yet." }), /Yes \/ Not yet buttons/);
  // An ordinary comment is still welcome.
  assert.equal(postComment({ task: id, body: "Use the business card, please." }).kind, "comment");

  const linked = postComment({ task: id, body: "yes", reply_to: moved.question_update_id });
  const unread = runAction("list_new_comments", {}) as Array<{ id: number; body: string; replying_to: { id: number; body: string } | null }>;
  const mine = unread.find((c) => c.id === linked.id)!;
  assert.equal(mine.replying_to?.id, moved.question_update_id);
  assert.equal(mine.replying_to?.body, "OK to pay $16?");
});

test("moving to waiting_on_you without a question is refused with the valid kinds", () => {
  const { id } = runAction("create_task", { project: "money", title: "File receipts" }) as { id: string };
  const r = callAction("move_task", { id, column: "waiting_on_you" });
  assert.equal(r.status, 400);
  assert.match(String((r.body as { error: string }).error), /money, approve, answer/);
});

test("notes carry tags for finding them later; list_notes filters by one tag and searches tags", () => {
  runAction("upsert_note", { slug: "brand-guide", title: "Brand guide", markdown: "Warm and earthy.", tags: ["Brand", " colors ", "brand", "decision"] });
  runAction("upsert_note", { slug: "bills", title: "Bills and due dates", markdown: "Taxes on the 30th.", tags: ["money", "taxes"] });
  const brand = runAction("get_note", { slug: "brand-guide" }) as { tags: string[] };
  assert.deepEqual(brand.tags, ["brand", "colors", "decision"]);
  const byTag = runAction("list_notes", { tag: "taxes" }) as Array<{ slug: string }>;
  assert.deepEqual(byTag.map((n) => n.slug), ["bills"]);
  const byWord = runAction("list_notes", { q: "decision" }) as Array<{ slug: string }>;
  assert.deepEqual(byWord.map((n) => n.slug), ["brand-guide"]);
  assert.throws(() => runAction("upsert_note", { slug: "bills", tags: Array.from({ length: 13 }, (_, i) => `t${i}`) }), /at most 12/);
});
