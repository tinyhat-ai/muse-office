import { test, after } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { taskVisualDocument, taskVisualHeight } from "../src/lib/task-visual";
import nextConfig from "../next.config";

// Start from the previous schema, with existing work, to exercise the upgrade.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "office-overview-"));
process.env.OFFICE_DB_PATH = path.join(dir, "office.db");
process.env.OFFICE_SEED = "none";
const previous = new Database(process.env.OFFICE_DB_PATH);
previous.exec(fs.readFileSync("db/schema.sql", "utf8").replace(/^  overview(?:_html)?\s+TEXT,.*\n/gm, ""));
previous.exec("INSERT INTO members(slug,name,role,job,is_chief) VALUES('chief','Muse','Chief of staff','Runs the work',1); INSERT INTO projects(slug,name,color,color_dark) VALUES('work','Work','#eee','#777'); INSERT INTO tasks(id,project,title,note,job_definition,original_request) VALUES('existing','work','Prepare an outline','Drafting the outline','The agreed brief','Please prepare an outline');");
previous.close();
const { runAction, postComment } = require("../src/lib/actions") as typeof import("../src/lib/actions");
const { getDb } = require("../src/lib/db") as typeof import("../src/lib/db");
after(() => { getDb().close(); fs.rmSync(dir, { recursive: true, force: true }); });

test("an existing Office gains a snapshot without replacing its original work", () => {
  const before = runAction("get_task", { id: "existing" }) as Record<string, unknown>;
  assert.equal(before.note, "Drafting the outline");
  assert.equal(before.overview, null);
  assert.equal(before.overview_html, null);
  runAction("update_task", { id: "existing", done_when: [{ text: "Outline ready", met: false }], plan: [{ text: "Draft outline", state: "now" }] });
  runAction("attach_file", { id: "existing", name: "outline.md", url: "/files/outline.md" });
  const comment = postComment({ task: "existing", body: "Include practical examples." });
  runAction("reply_to_comment", { source: "task", target_id: "existing", comment_id: comment.id, author: "chief", body: "I will include those." });
  const withHistory = runAction("get_task", { id: "existing" }) as Record<string, unknown>;

  const updated = runAction("update_task", { id: "existing", overview: "**Outline drafted.** Next: check the examples.", overview_html: '<button onclick="this.textContent=\'Examples checked\'">Review examples</button>' }) as Record<string, unknown>;
  assert.match(String(updated.overview), /Outline drafted/);
  assert.match(String(updated.overview_html), /onclick/); // executable only in the isolated visual
  for (const key of ["note", "job_definition", "original_request", "column", "done_when", "plan", "files", "updates"]) assert.deepEqual(updated[key], withHistory[key], key);
  const cleared = runAction("update_task", { id: "existing", overview_html: null }) as Record<string, unknown>;
  assert.equal(cleared.overview_html, null);
  assert.equal(cleared.overview, updated.overview);
});

test("new tasks expose both snapshot formats to the agent", () => {
  const created = runAction("create_task", { id: "new", project: "work", title: "Check sources", note: "Checking sources", overview: "The sources are being checked.", overview_html: "<p>Sources: 2 checked</p>" }) as Record<string, unknown>;
  assert.equal(created.overview, "The sources are being checked.");
  assert.equal(created.overview_html, "<p>Sources: 2 checked</p>");
  const cards = runAction("list_tasks", { project: "work" }) as Array<Record<string, unknown>>;
  const card = cards.find((item) => item.id === "new");
  assert.equal(card?.overview, created.overview);
  assert.equal(Object.hasOwn(card!, "overview_html"), false);
  const full = runAction("get_task", { id: "new" }) as Record<string, unknown>;
  assert.equal(full.overview_html, created.overview_html);
});

test("an HTML visual has document and embedding policies plus bounded resize messages", async () => {
  const headers = await nextConfig.headers?.();
  assert.equal(headers?.find((entry) => entry.source === "/((?!api/).*)")?.headers.find((entry) => entry.key === "Content-Security-Policy")?.value, "frame-src 'none'");
  const html = taskVisualDocument('<script>fetch("/api/actions")</script>');
  assert.ok(html.indexOf("Content-Security-Policy") < html.indexOf('<script>fetch'));
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /default-src 'none'/);
  assert.match(html, /frame-src 'none'/);
  assert.match(html, /form-action 'none'/);
  assert.equal(taskVisualHeight(170.3), 171);
  assert.equal(taskVisualHeight(-10), 64);
  assert.equal(taskVisualHeight(1e9), 720);
  for (const invalid of ["300", null, NaN, Infinity, {}]) assert.equal(taskVisualHeight(invalid), null);
});
