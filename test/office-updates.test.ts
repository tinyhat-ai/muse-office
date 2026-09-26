import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "office-updates-"));
process.env.OFFICE_DB_PATH = path.join(dir, "office.db");
process.env.OFFICE_SEED = "none";
const {runAction, postComment} = require("../src/lib/actions") as typeof import("../src/lib/actions");
const {getDb} = require("../src/lib/db") as typeof import("../src/lib/db");
const act = (name: string, input: object = {}, actor: "agent"|"you" = "agent") => runAction(name, input, actor) as any;
after(() => { getDb().close(); fs.rmSync(dir, { recursive: true, force: true }); });

test("all-page updates paginate a fixed batch without missing simultaneous or later changes", () => {
  act("upsert_member", {slug:"chief", name:"Noche", role:"Chief", job:"Coordinates", is_chief:true});
  act("upsert_project", {slug:"school", name:"School"}, "you");
  const task = act("create_task", {project:"school", title:"Review school dates", done_when:["Dates checked"]});
  act("upsert_note", {slug:"dates", title:"School dates", markdown:"Ask for the dates", project:"school"});
  act("upsert_contact", {slug:"support", name:"Support", in_funnel:false});
  act("upsert_report", {slug:"test", title:"Test report", section:"Around the world", chart:"bars"});
  act("record_metric", {report:"test", label:"A", value:1});
  act("set_member_avatar", {slug:"chief", avatar_url:"/faces/chief.svg"});
  const comment = postComment({task:task.id, body:"Use the current calendar"});
  const taskEvent = act("list_office_updates", {limit:100}).updates.find((event:any) => event.action === "create_task");
  assert.equal(taskEvent.target_id, task.id);
  assert.equal(taskEvent.owner, "chief");
  getDb().prepare("UPDATE office_updates SET created_at = '2026-09-26T10:00:00.000Z'").run();
  let page = act("list_office_updates", {limit:2});
  const first = page.updates;
  act("upsert_project", {slug:"school", name:"Family school"}, "you"); // lands after fixed upper bound
  let events = [...first];
  while(page.next_cursor) { page = act("list_office_updates", {cursor:page.next_cursor, limit:2}); events.push(...page.updates); }
  assert.equal(new Set(events.map((event:any) => event.id)).size, 9);
  assert.deepEqual([...new Set(events.map((event:any) => event.source))].sort(), ["contact","member","note","project","report","task"]);
  assert.equal(events.find((event:any) => event.action === "post_comment").comment_id, comment.id);
  assert.equal(events.find((event:any) => event.action === "post_comment").actor, "you");
  assert.equal(events.find((event:any) => event.source === "project").actor, "you");
  const next = act("list_office_updates", {after:page.checkpoint});
  assert.equal(next.updates.length, 1); assert.equal(next.updates[0].changes.name, "Family school");
  act("summary"); act("set_setting", {key:"last_agent_visit", value:new Date().toISOString()});
  assert.equal(act("list_office_updates", {after:next.checkpoint}).updates.length, 0);
  assert.throws(() => act("list_office_updates", {cursor:"invalid"}), /cursor/);
  assert.throws(() => act("list_office_updates", {after:9999999}), /ahead/);
  const before = act("list_office_updates", {limit:100}).checkpoint;
  assert.throws(() => act("move_task", {id:task.id, column:"done"}), /./);
  assert.equal(act("list_office_updates", {after:before}).updates.length, 0); // failed write is atomic
});

test("archive preserves task history and progress, restore returns work, checks agree with SQL", () => {
  const task = act("list_tasks", {project:"school"})[0];
  act("update_task", {id:task.id, done_when:[{text:"Dates checked", met:true}, {text:"Reply drafted", met:false}]});
  const read = act("get_task", {id:task.id});
  assert.deepEqual(read.progress, {basis:"done_when", met:1, total:2, percent:50});
  const sql = getDb().prepare("SELECT basis, met, total, percent FROM task_progress WHERE task = ?").get(task.id);
  assert.deepEqual(sql, read.progress);
  act("archive_project", {slug:"school", archived:true}, "you");
  assert.ok(act("get_project", {slug:"school"}).archived_at);
  assert.equal(act("get_task", {id:task.id}).updates.length, read.updates.length);
  assert.throws(() => act("create_task", {project:"school", title:"Invisible work"}), /Restore/);
  act("archive_project", {slug:"school", archived:false}, "you");
  assert.equal(act("get_project", {slug:"school"}).archived_at, null);
  assert.throws(() => act("upsert_project", {name:"Family school", create_only:true}), /already exists/);
  const p = act("get_project", {slug:"school"}).progress;
  const view = getDb().prepare("SELECT done, total, percent, waiting, column_name FROM project_progress WHERE project = 'school'").get() as any;
  assert.deepEqual(view, {done:p.done,total:p.total,percent:p.percent,waiting:p.waiting,column_name:p.column});
  act("set_setting", {key:"comment_check_minutes", value:"1"});
  const comment = postComment({project:"school", body:"Keep this project"});
  assert.match(comment.follow_up, /Noche checks Office updates every 1 minute/);
  act("set_setting", {key:"comment_check_minutes", value:null});
  assert.match(postComment({note:"dates", body:"Please review"}).follow_up, /Regular checks are not set up/);
});

test("archived work is paused in active reads but retained for history and restored intact", () => {
  act("upsert_project", {slug:"paused", name:"Paused work"});
  const t = act("create_task", {project:"paused", title:"Choose dates", done_when:["Date agreed"]});
  act("move_task", {id:t.id, column:"waiting_on_you", question:"Which date?"});
  const before = act("summary");
  act("archive_project", {slug:"paused", archived:true});
  assert.equal(act("summary").columns.waiting_on_you, before.columns.waiting_on_you - 1);
  assert.equal(act("summary").waiting_on_you.some((r:any) => r.id === t.id), false);
  assert.deepEqual(act("list_tasks", {project:"paused"}), []);
  assert.ok(act("list_tasks", {project:"paused", include_archived:true})[0].project_archived_at);
  assert.ok(act("get_task", {id:t.id}).project_archived_at);
  assert.equal(act("get_task", {id:t.id}).question, "Which date?");
  act("archive_project", {slug:"paused", archived:false});
  assert.equal(act("list_tasks", {project:"paused"})[0].project_archived_at, null);
  assert.equal(act("summary").columns.waiting_on_you, before.columns.waiting_on_you);
});

test("project names in any language do not collide or silently rename an unrelated project", () => {
  const a = act("upsert_project", {name:"Школа", create_only:true}, "you");
  const b = act("upsert_project", {name:"学校", create_only:true}, "you");
  const c = act("upsert_project", {name:"Дом"});
  assert.equal(new Set([a.slug,b.slug,c.slug]).size, 3);
  assert.equal(act("get_project", {slug:a.slug}).name, "Школа");
  assert.throws(() => act("upsert_project", {name:"Школа", create_only:true}), /already exists/);
  assert.equal(act("upsert_project", {name:"学校", description:"School"}).slug, b.slug);
  assert.throws(() => act("upsert_project", {name:"x".repeat(121)}), /120 characters/);
});

test("feed links and owners use normalized persisted ids", () => {
  const start = act("list_office_updates", {limit:100}).checkpoint;
  act("upsert_member", {slug:"Test Owner", name:"Reviewer", role:"Tester", job:"Checks"});
  const project = act("upsert_project", {slug:"Round Project", name:"Round project", lead:"test-owner"});
  const t = act("create_task", {id:"Acme Proposal", title:"Review proposal", project:project.slug, specialist:"test-owner", done_when:Array.from({length:40},(_,i) => `Check ${i}`)});
  act("update_task", {id:t.id, done_when:Array.from({length:40},(_,i) => ({text:`Check ${i}`,met:i<23}))});
  const events = act("list_office_updates", {after:start, limit:100}).updates;
  assert.equal(events.find((e:any) => e.action === "upsert_member").target_id, "test-owner");
  assert.equal(events.find((e:any) => e.action === "upsert_project").url, "/projects/round-project");
  const e = events.find((e:any) => e.action === "create_task");
  assert.equal(e.target_id, t.id); assert.equal(e.url, "/tasks/acme-proposal"); assert.equal(e.owner, "test-owner");
});

