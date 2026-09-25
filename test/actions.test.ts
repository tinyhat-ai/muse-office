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

test("the team can change, and task and note comments reach an ordered paginated owner feed", () => {
  runAction("upsert_member", { slug: "researcher", name: "Rae", role: "Researcher", job: "Checks sources." });
  runAction("upsert_member", { slug: "researcher", job: "Checks sources and writes briefs." });
  const task = runAction("create_task", { project: "money", title: "Investigate a market", specialist: "researcher" }) as { id: string };
  const note = runAction("upsert_note", { slug: "market-brief", title: "Market brief", markdown: "# Brief", kept_by: "researcher" }) as { slug: string };
  const taskComment = postComment({ task: task.id, body: "Please compare two sources." });
  const noteComment = postComment({ note: note.slug, body: "Add the source date." });
  const beforeFollowUp = runAction("summary", {}) as { unread_task_comments: number; unread_note_comments: number; unread_comments: number };
  assert.ok(beforeFollowUp.unread_task_comments >= 1);
  assert.ok(beforeFollowUp.unread_note_comments >= 1);
  assert.equal(beforeFollowUp.unread_comments, beforeFollowUp.unread_task_comments + beforeFollowUp.unread_note_comments);

  type Item = { id: number; source: string; owner: string; body: string; url: string; unread_by_agent: boolean; created_at: string };
  const found: Item[] = [];
  let cursor: string | null = null;
  do {
    const page = runAction("list_recent_updates", { unread_only: true, limit: 1, ...(cursor ? { cursor } : {}) }) as { updates: Item[]; next_cursor: string | null };
    found.push(...page.updates);
    cursor = page.next_cursor;
  } while (cursor);
  assert.equal(found.filter((item) => item.source === "task" && item.id === taskComment.id).length, 1);
  assert.equal(found.filter((item) => item.source === "note" && item.id === noteComment.id).length, 1);
  assert.equal(found.find((item) => item.body === "Add the source date.")?.owner, "researcher");
  assert.equal(found.find((item) => item.body === "Add the source date.")?.url, "/notes/market-brief");
  assert.ok(found.every((item) => item.unread_by_agent));
  for (let i = 1; i < found.length; i++) {
    const previous = found[i - 1];
    const current = found[i];
    assert.ok(previous.created_at > current.created_at ||
      (previous.created_at === current.created_at && (previous.source > current.source ||
        (previous.source === current.source && previous.id > current.id))));
  }
  assert.equal(callAction("list_recent_updates", { cursor: "bad" }).status, 400);

  // Task and note ids come from different tables. A note id must never
  // silently mark an unrelated task comment with the same integer id read.
  let taskCollision = taskComment;
  let noteCollision = noteComment;
  while (taskCollision.id < noteCollision.id) taskCollision = postComment({ task: task.id, body: "Another task question." });
  while (noteCollision.id < taskCollision.id) noteCollision = postComment({ note: note.slug, body: "Another note question." });
  assert.equal(noteCollision.id, taskCollision.id);
  assert.equal(callAction("mark_comments_read", { ids: [noteCollision.id] }).status, 400);
  assert.equal(callAction("mark_comments_read", { source: "note", ids: [noteCollision.id] }).status, 400);
  assert.equal((runAction("mark_note_comments_read", { source: "note", ids: [noteCollision.id] }) as { marked: number }).marked, 1);
  const stillUnread = runAction("list_recent_updates", { unread_only: true }) as { updates: Item[] };
  assert.ok(stillUnread.updates.some((item) => item.source === "task" && item.id === taskCollision.id));

  runAction("reply_to_note_comment", { comment_id: noteComment.id, author: "researcher", body: "Added the date." });
  runAction("reply_to_comment", { comment_id: taskComment.id, author: "researcher", body: "I will compare them." });
  const remaining = runAction("list_recent_updates", { unread_only: true, limit: 100 }) as { updates: Item[] };
  assert.ok(!remaining.updates.some((item) => item.source === "note" && item.id === noteComment.id));
  assert.ok(!remaining.updates.some((item) => item.source === "task" && item.id === taskComment.id));

  assert.equal(callAction("remove_member", { slug: "researcher" }).status, 400);
  runAction("update_task", { id: task.id, specialist: "penny" });
  runAction("upsert_note", { slug: note.slug, kept_by: "chief" });
  const removed = runAction("remove_member", { slug: "researcher" }) as { removed: string };
  assert.equal(removed.removed, "researcher");
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

test("a Muse can create timeline and donut reports through Office actions", () => {
  for (const chart of ["timeline", "donut"]) {
    const slug = `public-${chart}`;
    const report = runAction("upsert_report", { slug, section: "Around the world", title: `Example ${chart}`, chart, source: "Published source", source_url: "https://example.org/data" }) as { chart: string };
    assert.equal(report.chart, chart);
    runAction("record_metric", { report: slug, label: chart === "timeline" ? "2024" : "Ocean", value: 71 });
  }
  const rows = getDb().prepare("SELECT chart FROM reports WHERE section = 'Around the world' ORDER BY slug").all() as Array<{ chart: string }>;
  assert.deepEqual(rows.map((r) => r.chart), ["donut", "timeline"]);
});

test("a contact kept outside the funnel has no stage change and is not counted until it enters", () => {
  const you = runAction("upsert_contact", { slug: "you", name: "You", in_funnel: false, source: "you", notes: ["hello@example.com"] }) as { in_funnel: boolean; stage: string };
  assert.equal(you.in_funnel, false);
  const changes = () => (getDb().prepare("SELECT COUNT(*) n FROM stage_changes WHERE contact = 'you'").get() as { n: number }).n;
  assert.equal(changes(), 0);
  // Becomes a real lead: enters the funnel, and that entry is recorded once.
  const entered = runAction("set_stage", { contact: "you", stage: "lead" }) as { in_funnel: boolean; stage: string; changed: boolean };
  assert.deepEqual([entered.in_funnel, entered.stage, entered.changed], [true, "lead", true]);
  assert.equal(changes(), 1);
  // A new contact without the flag is in the funnel as before.
  const lead = runAction("upsert_contact", { slug: "new-lead", name: "New Lead" }) as { in_funnel: boolean; stage: string };
  assert.deepEqual([lead.in_funnel, lead.stage], [true, "lead"]);
});

test("moving a contact with sales history outside the funnel drops that history; entering without a stage means lead", () => {
  runAction("upsert_contact", { slug: "legacy-lead", name: "Legacy Lead", stage: "lead" });
  runAction("set_stage", { contact: "legacy-lead", stage: "customer" });
  const rows = () => (getDb().prepare("SELECT COUNT(*) n FROM stage_changes WHERE contact = 'legacy-lead'").get() as { n: number }).n;
  assert.equal(rows(), 2);
  const out = runAction("upsert_contact", { slug: "legacy-lead", in_funnel: false }) as { in_funnel: boolean };
  assert.equal(out.in_funnel, false);
  assert.equal(rows(), 0, "no sales history remains for someone kept outside the funnel");
  // Back in, with no stage named: a lead, and that is the first recorded change.
  const back = runAction("upsert_contact", { slug: "legacy-lead", in_funnel: true }) as { in_funnel: boolean; stage: string };
  assert.deepEqual([back.in_funnel, back.stage], [true, "lead"]);
  assert.equal(rows(), 1);
  assert.equal((getDb().prepare("SELECT stage FROM stage_changes WHERE contact = 'legacy-lead'").get() as { stage: string }).stage, "lead");
});

test("published report sources are HTTPS URLs", () => {
  assert.throws(() => runAction("upsert_report", { slug: "population", section: "Around the world", title: "Population", chart: "bars", source_url: "javascript:alert(1)" }), /https URL/);
  const report = runAction("upsert_report", { slug: "population", section: "Around the world", title: "Population", chart: "bars", source: "UN", source_url: "https://population.un.org/wpp/" }) as { source_url: string };
  assert.equal(report.source_url, "https://population.un.org/wpp/");
});
