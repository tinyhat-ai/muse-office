import {
  getDb, nowIso, all, get, run, json, COLUMNS, COLUMN_LABEL, STAGES,
  type Column, type MemberRow, type ProjectRow, type StepRow, type RuleRow, type TaskRow, type CheckRow,
  type PlanRow, type FileRow, type UpdateRow, type ContactRow, type TouchRow, type ReportRow, type MetricRow, type NoteRow, type NoteCommentRow,
} from "./db";
import { shortDate } from "./time";
import {
  ActionError, notFound, listOf, present, isObject, asInput, requiredString, optionalString, oneOf, isoDate,
  int, num, bool, array, stringArray, intArray, object, openableUrl, within, type Input,
} from "./validate";

// The agent-facing contract from spec/ACTIONS.md: one registry, in spec order.
// Every write runs in one transaction and stamps settings.last_agent_visit;
// reads have no side effects, so a browser may GET them.

export interface ActionDef {
  section: string;
  description: string;
  /** argument → "type · what it is · required or optional" */
  params: Record<string, string>;
  /** Reads only; these also answer GET with the query string as the input. */
  read?: boolean;
  run(input: Input): unknown;
}

const QUESTION_KINDS = ["money", "approve", "answer"] as const;
const NOTE_KINDS = ["update", "question", "event"] as const;
const PLAN_STATES = ["done", "now", "later"] as const;
const RULE_ORIGINS = ["you", "ok"] as const;
const CHANNELS = ["email", "call", "meeting", "message", "website", "invoice", "note"] as const;
const CHARTS = ["bars", "timeline", "donut", "grouped-bars", "stacked-bars", "bars-horizontal", "list", "savings", "number"] as const;
const SETTING_KEYS = ["office_name", "user_name", "hat_version", "last_agent_visit"] as const;
// Project pastels from spec/DESIGN.md, the five in use then the spares; a new project takes the first free pair.
const PASTELS: ReadonlyArray<readonly [string, string]> = [
  ["#f2e4a9", "#b89a3a"], ["#d5eaea", "#2f8a8a"], ["#d8e7d3", "#5b8a5a"], ["#e3dcf0", "#7e6aa6"], ["#e9e7df", "#9a978c"],
  ["#efd3d3", "#b86e6e"], ["#d3e0e6", "#5f8497"], ["#f5dcc4", "#b8743a"],
];
const MEMBER_COLORS = ["#f3d2d9", "#cddcee", "#f3e2a4", "#e6cba6", "#d3e6d0", "#ebe0cb", "#efd3d3", "#d3e0e6"];

type Patch = Record<string, unknown>;
type FileRef = { name: string; url: string };

const tx = <T>(fn: () => T): T => getDb().transaction(fn)();

// ------------------------------------------------------------ small helpers

export function kebab(s: string): string {
  const k = s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return k.slice(0, 60).replace(/-+$/, "") || "item";
}

/** The slug passed, else one made from the name field. */
function slugFrom(input: Input, nameField: string, example: string): string {
  const slug = optionalString(input, "slug");
  if (slug) return kebab(slug);
  const name = optionalString(input, nameField);
  if (name) return kebab(name);
  throw new ActionError(`slug is required (kebab-case, e.g. ${example}); or pass ${nameField} and the slug is made from it.`);
}

const memberSlugs = () => all<{ slug: string }>("SELECT slug FROM members ORDER BY sort_order, slug").map((r) => r.slug);
const projectSlugs = () => all<{ slug: string }>("SELECT slug FROM projects ORDER BY sort_order, slug").map((r) => r.slug);
const taskIds = () => all<{ id: string }>("SELECT id FROM tasks ORDER BY updated_at DESC").map((r) => r.id);
const contactSlugs = () => all<{ slug: string }>("SELECT slug FROM contacts ORDER BY name").map((r) => r.slug);
const reportSlugs = () => all<{ slug: string }>("SELECT slug FROM reports ORDER BY sort_order, slug").map((r) => r.slug);
const noteSlugs = () => all<{ slug: string }>("SELECT slug FROM notes ORDER BY title").map((r) => r.slug);
const chiefSlug = () => get<{ slug: string }>("SELECT slug FROM members WHERE is_chief = 1 ORDER BY sort_order LIMIT 1")?.slug ?? "chief";

// The row an action is about must exist (404, listing what does).
function mustMember(slug: string): MemberRow {
  const m = get<MemberRow>("SELECT * FROM members WHERE slug = ?", slug);
  if (!m) throw notFound("member", slug, memberSlugs());
  return m;
}
function mustProject(slug: string): ProjectRow {
  const p = get<ProjectRow>("SELECT * FROM projects WHERE slug = ?", slug);
  if (!p) throw notFound("project", slug, projectSlugs());
  return p;
}
function mustTask(id: string): TaskRow {
  const t = get<TaskRow>("SELECT * FROM tasks WHERE id = ?", id);
  if (!t) throw notFound("task", id, taskIds());
  return t;
}
function mustContact(slug: string): ContactRow {
  const c = get<ContactRow>("SELECT * FROM contacts WHERE slug = ?", slug);
  if (!c) throw notFound("contact", slug, contactSlugs());
  return c;
}
function mustReport(slug: string): ReportRow {
  const r = get<ReportRow>("SELECT * FROM reports WHERE slug = ?", slug);
  if (!r) throw notFound("report", slug, reportSlugs());
  return r;
}
function mustNote(slug: string): NoteRow {
  const n = get<NoteRow>("SELECT * FROM notes WHERE slug = ?", slug);
  if (!n) throw notFound("note", slug, noteSlugs());
  return n;
}

// A field that points at another row (400, listing the valid values). null clears, undefined is "not passed".
function refField(input: Input, name: string, kind: string, valid: readonly string[]): string | null | undefined {
  const v = optionalString(input, name);
  if (v === undefined || v === null) return v;
  if (valid.includes(v)) return v;
  throw new ActionError(`${name} must be a ${kind}, one of: ${listOf(valid)} (got '${v}').`);
}
const memberField = (input: Input, name: string, extra: readonly string[] = []) => refField(input, name, "member slug", [...memberSlugs(), ...extra]);
const projectField = (input: Input, name: string) => refField(input, name, "project slug", projectSlugs());
const taskField = (input: Input, name: string) => refField(input, name, "task id", taskIds());

/** UPDATE only the columns in the patch, plus updated_at. Column names come from code, never from input. */
function patchRow(table: string, keyCol: string, key: string, patch: Patch): boolean {
  const cols = Object.keys(patch).filter((c) => patch[c] !== undefined);
  if (!cols.length) return false;
  run(`UPDATE ${table} SET ${cols.map((c) => `${c} = ?`).join(", ")}, updated_at = ? WHERE ${keyCol} = ?`, ...cols.map((c) => patch[c]), nowIso(), key);
  return true;
}
function insertRow(table: string, row: Patch): void {
  const cols = Object.keys(row).filter((c) => row[c] !== undefined);
  run(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`, ...cols.map((c) => row[c]));
}
function nextSort(table: string): number {
  return (get<{ n: number | null }>(`SELECT MAX(sort_order) AS n FROM ${table}`)?.n ?? -1) + 1;
}
function requireForNew(patch: Patch, fields: string[], what: string): void {
  const missing = fields.filter((f) => patch[f] === undefined || patch[f] === null);
  if (missing.length) throw new ActionError(`${listOf(missing)} ${missing.length > 1 ? "are" : "is"} required to add the new ${what}.`);
}
function setSetting(key: string, value: string | null): void {
  run("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", key, value);
}

// Rows go out with JSON columns unpacked and 0/1 flags as booleans.
function memberOut(m: MemberRow) {
  const { does_json, skills_json, ...rest } = m;
  return { ...rest, does: json<string[]>(does_json, []), skills: json<string[]>(skills_json, []), is_chief: !!m.is_chief };
}
const stepOut = (s: StepRow) => ({ ...s, needs_you: !!s.needs_you });
function taskOut(t: TaskRow) {
  const { column_name, ...rest } = t;
  return { ...rest, column: column_name };
}
const checkOut = (c: CheckRow) => ({ id: c.id, text: c.text, met: !!c.met });
const planOut = (p: PlanRow) => ({ id: p.id, text: p.text, state: p.state });
const fileOut = (f: FileRow) => ({ id: f.id, name: f.name, url: f.url, added_at: f.added_at });
function updateOut(u: UpdateRow) {
  const { files_json, ...rest } = u;
  return { ...rest, files: json<FileRef[]>(files_json, []), unread_by_agent: !!u.unread_by_agent };
}
function contactOut(c: ContactRow) {
  const { notes_json, value_cents, ...rest } = c;
  return { ...rest, notes: json<string[]>(notes_json, []), value: value_cents == null ? null : value_cents / 100, next_waiting_on_you: !!c.next_waiting_on_you, in_funnel: !!c.in_funnel };
}
function metricOut(m: MetricRow) {
  const { note_json, ...rest } = m;
  return { ...rest, note: json<Input>(note_json, {}) };
}
/** Tags are short, lowercase words or phrases; duplicates and empties dropped; at most 12. */
function normalizeTags(tags: string[]): string[] {
  const out: string[] = [];
  for (const raw of tags) {
    const t = raw.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 30);
    if (t && !out.includes(t)) out.push(t);
  }
  if (out.length > 12) throw new ActionError(`tags: at most 12 per note (got ${out.length}); keep the topics and the words someone would search for.`);
  return out;
}
function noteOut(n: NoteRow) {
  const { linked_tasks_json, tags_json, ...rest } = n;
  return { ...rest, linked_tasks: json<string[]>(linked_tasks_json, []), tags: json<string[]>(tags_json, []), pinned: !!n.pinned };
}

// ------------------------------------------------------------ task helpers

function addUpdate(task: string, author: string, kind: UpdateRow["kind"], body: string, files: FileRef[] = [], replyTo: number | null = null, unread = 0, at = nowIso()): UpdateRow {
  const r = run(
    "INSERT INTO task_updates (task, author, kind, body, files_json, reply_to, unread_by_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    task, author, kind, body, JSON.stringify(files), replyTo, unread, at,
  );
  return get<UpdateRow>("SELECT * FROM task_updates WHERE id = ?", Number(r.lastInsertRowid)) as UpdateRow;
}
/** The update row that carries the task's current question: the newest question whose text is the task's. */
function currentQuestionId(task: string): number | null {
  const t = get<TaskRow>("SELECT column_name, question FROM tasks WHERE id = ?", task);
  if (!t || t.column_name !== "waiting_on_you" || !t.question) return null;
  const row = get<{ id: number }>("SELECT id FROM task_updates WHERE task = ? AND kind = 'question' AND body = ? ORDER BY id DESC LIMIT 1", task, t.question);
  return row?.id ?? null;
}
function touchTask(id: string, at = nowIso()): void {
  run("UPDATE tasks SET updated_at = ? WHERE id = ?", at, id);
}
/** One row under "Files from this task" per name + url, however many updates mention it. */
function attach(task: string, file: FileRef, at = nowIso()): FileRow {
  const existing = get<FileRow>("SELECT * FROM task_files WHERE task = ? AND name = ? AND url IS ?", task, file.name, file.url);
  if (existing) return existing;
  const r = run("INSERT INTO task_files (task, name, url, added_at) VALUES (?, ?, ?, ?)", task, file.name, file.url, at);
  return get<FileRow>("SELECT * FROM task_files WHERE id = ?", Number(r.lastInsertRowid)) as FileRow;
}

/** `step` must point at one of the project's process steps (0-based) when the project has any. */
function stepField(input: Input, project: string): number | null | undefined {
  const step = int(input, "step", { min: 0 });
  if (step === undefined || step === null) return step;
  const n = get<{ n: number }>("SELECT COUNT(*) AS n FROM process_steps WHERE project = ?", project)?.n ?? 0;
  if (n > 0 && step >= n) throw new ActionError(`step must be between 0 and ${n - 1}: the ${project} process has ${n} steps, counted from 0.`);
  return step;
}

function normalizeChecks(items: unknown[], name = "done_when"): Array<{ text: string; met: boolean }> {
  return items.map((item, i) => {
    if (isObject(item)) return within(`${name}[${i}]`, () => ({ text: requiredString(item, "text"), met: bool(item, "met") ?? false }));
    const text = typeof item === "string" ? item.trim() : "";
    if (!text) throw new ActionError(`${name}[${i}] must be a short text or {"text": "...", "met": true}.`);
    return { text, met: false };
  });
}
function normalizePlan(items: unknown[], name = "plan"): Array<{ text: string; state: PlanRow["state"] }> {
  const rows = items.map((item, i) => {
    if (isObject(item)) return within(`${name}[${i}]`, () => ({ text: requiredString(item, "text"), state: oneOf(item, "state", PLAN_STATES) }));
    const text = typeof item === "string" ? item.trim() : "";
    if (!text) throw new ActionError(`${name}[${i}] must be a short text or {"text": "...", "state": "now"}; states are ${listOf(PLAN_STATES)}.`);
    return { text, state: undefined };
  });
  // Plain strings mean "start here": the first is now, the rest later. Given states are kept; missing ones become later.
  const anyState = rows.some((r) => r.state !== undefined);
  return rows.map((r, i) => ({ text: r.text, state: r.state ?? (!anyState && i === 0 ? "now" : "later") }));
}
function normalizeFiles(items: unknown[]): FileRef[] {
  return items.map((item, i) => {
    if (!isObject(item)) throw new ActionError(`files[${i}] must be {"name": "...", "url": "https://..."}.`);
    return within(`files[${i}]`, () => ({ name: requiredString(item, "name", "the file's name as the user should see it"), url: openableUrl(item, "url") }));
  });
}
function replaceChecks(task: string, checks: Array<{ text: string; met: boolean }>): void {
  run("DELETE FROM task_checks WHERE task = ?", task);
  checks.forEach((c, i) => run("INSERT INTO task_checks (task, position, text, met) VALUES (?, ?, ?, ?)", task, i, c.text, c.met ? 1 : 0));
}
function replacePlan(task: string, plan: Array<{ text: string; state: string }>): void {
  run("DELETE FROM task_plan WHERE task = ?", task);
  plan.forEach((p, i) => run("INSERT INTO task_plan (task, position, text, state) VALUES (?, ?, ?, ?)", task, i, p.text, p.state));
}

/** Everything on a task's page. */
function taskPage(id: string) {
  const t = mustTask(id);
  const project = get<ProjectRow>("SELECT * FROM projects WHERE slug = ?", t.project);
  const specialist = t.specialist ? get<MemberRow>("SELECT * FROM members WHERE slug = ?", t.specialist) : undefined;
  return {
    ...taskOut(t),
    project_name: project?.name ?? t.project,
    project_color: project?.color ?? null,
    specialist_name: specialist?.name ?? null,
    done_when: all<CheckRow>("SELECT * FROM task_checks WHERE task = ? ORDER BY position", id).map(checkOut),
    plan: all<PlanRow>("SELECT * FROM task_plan WHERE task = ? ORDER BY position", id).map(planOut),
    files: all<FileRow>("SELECT * FROM task_files WHERE task = ? ORDER BY added_at, id", id).map(fileOut),
    updates: all<UpdateRow>("SELECT * FROM task_updates WHERE task = ? ORDER BY id", id).map(updateOut),
  };
}

// ---------------------------------------------------------- customer helpers

function nextPastel(): readonly [string, string] {
  const used = new Set(all<{ color: string }>("SELECT color FROM projects").map((r) => r.color.toLowerCase()));
  return PASTELS.find(([fill]) => !used.has(fill)) ?? PASTELS[used.size % PASTELS.length];
}

/** Everyone with a next step due within `days` (overdue included) or waiting on the user; waiting first, then soonest. */
function followups(days: number) {
  const cutoff = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
  return all<ContactRow>(
    `SELECT * FROM contacts
     WHERE next_waiting_on_you = 1 OR (next_due IS NOT NULL AND substr(next_due, 1, 10) <= ?)
     ORDER BY next_waiting_on_you DESC, next_due IS NULL, next_due, name`,
    cutoff,
  ).map(contactOut);
}
const escapeLike = (s: string) => s.replace(/[\\%_]/g, "\\$&");

// ------------------------------------------------------------ the registry

export const ACTIONS: Record<string, ActionDef> = {
  // ---------------------------------------------------------------- Team
  upsert_member: {
    section: "Team",
    description: "Adds or updates one card on the Team page. Only the fields passed change; a new member needs name, role, and job.",
    params: {
      slug: "string · kebab-case id, e.g. penny · optional, made from the name when missing",
      name: "string · the specialist's name · required for a new member",
      role: "string · e.g. Bookkeeper · required for a new member",
      job: "string · one line, what they do · required for a new member",
      hat: "string · wearable accessory, e.g. navy bowler; not the mascot · optional",
      avatar_url: "string · a link to their distinct face or mascot image · optional",
      color: "string · soft tile colour, e.g. #d3e6d0 · optional, picked for a new member when missing",
      does: "string[] · three bullets, how they work · optional",
      never: "string · one line, what they never do · optional",
      skills: "string[] · skill chips · optional",
      is_chief: "boolean · true only for the chief of staff · optional",
    },
    run(input) {
      const slug = slugFrom(input, "name", "penny");
      const existing = get<MemberRow>("SELECT * FROM members WHERE slug = ?", slug);
      const patch: Patch = {};
      if (present(input, "name")) patch.name = requiredString(input, "name", "the specialist's name");
      if (present(input, "role")) patch.role = requiredString(input, "role", "e.g. Bookkeeper");
      if (present(input, "job")) patch.job = requiredString(input, "job", "one line, what they do");
      if (present(input, "hat")) patch.hat = optionalString(input, "hat");
      if (present(input, "avatar_url")) patch.avatar_url = optionalString(input, "avatar_url");
      if (present(input, "color")) patch.color = optionalString(input, "color");
      if (present(input, "does")) patch.does_json = JSON.stringify(stringArray(input, "does"));
      if (present(input, "never")) patch.never = optionalString(input, "never");
      if (present(input, "skills")) patch.skills_json = JSON.stringify(stringArray(input, "skills"));
      if (present(input, "is_chief")) patch.is_chief = bool(input, "is_chief") ? 1 : 0;
      if (existing) {
        patchRow("members", "slug", slug, patch);
      } else {
        requireForNew(patch, ["name", "role", "job"], `member '${slug}'`);
        const now = nowIso();
        const sort = nextSort("members");
        insertRow("members", { slug, does_json: "[]", skills_json: "[]", is_chief: 0, color: MEMBER_COLORS[sort % MEMBER_COLORS.length], ...patch, sort_order: sort, created_at: now, updated_at: now });
      }
      return memberOut(mustMember(slug));
    },
  },
  set_member_rule: {
    section: "Team",
    description: "Sets the \"last rule learned\" shown in the specialist's detail, dated today.",
    params: { slug: "string · the member's slug · required", rule: "string · the rule, in the user's words · required" },
    run(input) {
      const m = mustMember(requiredString(input, "slug", "the member's slug"));
      const rule = requiredString(input, "rule", "the rule, in the user's words");
      // Stored the way the Team page shows it, 'Sep 20 — “Round to the cent.”', unless the agent already dated it.
      const dated = /^[A-Z][a-z]{2} \d{1,2} — /.test(rule) ? rule : `${shortDate(nowIso())} — “${rule.replace(/^[“"]+|[”"]+$/g, "")}”`;
      patchRow("members", "slug", m.slug, { last_rule: dated });
      return memberOut(mustMember(m.slug));
    },
  },
  remove_member: {
    section: "Team",
    description: "Removes a specialist. Refused while they have open tasks, and never for the chief of staff. Only after the user's yes.",
    params: { slug: "string · the member's slug · required" },
    run(input) {
      const m = mustMember(requiredString(input, "slug", "the member's slug"));
      if (m.is_chief) throw new ActionError(`${m.name} is the chief of staff and cannot be removed.`);
      const open = all<{ id: string }>("SELECT id FROM tasks WHERE specialist = ? AND column_name != 'done' ORDER BY updated_at DESC", m.slug);
      if (open.length) {
        throw new ActionError(`${m.name} still has ${open.length} open task${open.length > 1 ? "s" : ""} (${listOf(open.map((t) => t.id), 8)}). Finish or reassign them first, then remove ${m.name}.`);
      }
      return tx(() => {
        // History keeps the name on updates and touches; live links point at "no one" so the pages still render.
        const projects = run("UPDATE projects SET lead = NULL, updated_at = ? WHERE lead = ?", nowIso(), m.slug).changes;
        const doneTasks = run("UPDATE tasks SET specialist = NULL WHERE specialist = ?", m.slug).changes;
        const reports = run("UPDATE reports SET owner = NULL WHERE owner = ?", m.slug).changes;
        const notes = run("UPDATE notes SET kept_by = NULL WHERE kept_by = ?", m.slug).changes;
        const steps = run("UPDATE process_steps SET who = 'any' WHERE who = ?", m.slug).changes;
        run("DELETE FROM members WHERE slug = ?", m.slug);
        return { removed: m.slug, unlinked: { projects, done_tasks: doneTasks, reports, notes, steps } };
      });
    },
  },

  // ------------------------------------------------------------ Projects
  upsert_project: {
    section: "Projects",
    description: "Adds or updates a project tile and its page header. Only the fields passed change; colours default to the next free pastel.",
    params: {
      slug: "string · kebab-case id, e.g. website · optional, made from the name when missing",
      name: "string · the project's name · required for a new project",
      description: "string · one line · optional",
      color: "string · pastel fill, e.g. #f2e4a9 · optional",
      color_dark: "string · darker shade for bars and chart series, e.g. #b89a3a · optional",
      lead: "string · member slug who leads it · optional",
      kind: "string · how it runs: Build, Publish, Follow up, Money, General · optional",
      done_when: "string · one line, what done means · optional",
    },
    run(input) {
      const slug = slugFrom(input, "name", "website");
      const existing = get<ProjectRow>("SELECT * FROM projects WHERE slug = ?", slug);
      const patch: Patch = {};
      if (present(input, "name")) patch.name = requiredString(input, "name", "the project's name");
      if (present(input, "description")) patch.description = optionalString(input, "description");
      if (present(input, "color")) patch.color = requiredString(input, "color", "a pastel fill like #f2e4a9");
      if (present(input, "color_dark")) patch.color_dark = requiredString(input, "color_dark", "a darker shade like #b89a3a");
      if (present(input, "lead")) patch.lead = memberField(input, "lead");
      if (present(input, "kind")) patch.kind = optionalString(input, "kind");
      if (present(input, "done_when")) patch.done_when = optionalString(input, "done_when");
      if (existing) {
        patchRow("projects", "slug", slug, patch);
      } else {
        requireForNew(patch, ["name"], `project '${slug}'`);
        const [fill, dark] = nextPastel();
        const now = nowIso();
        insertRow("projects", { slug, color: fill, color_dark: dark, ...patch, sort_order: nextSort("projects"), created_at: now, updated_at: now });
      }
      return mustProject(slug);
    },
  },
  set_process: {
    section: "Projects",
    description: "Replaces the project's steps (the diagram) and its process text, rendered as markdown on the project's page.",
    params: {
      project: "string · project slug · required",
      steps: "[{name, who, note?, needs_you?}] · in order; who is a member slug, you, or any · required",
      markdown: "string · the process written out · required",
    },
    run(input) {
      const p = mustProject(requiredString(input, "project", "the project's slug"));
      const markdown = requiredString(input, "markdown", "the process written out, in markdown");
      const who = [...memberSlugs(), "you", "any"];
      const steps = (array(input, "steps", { required: true }) ?? []).map((s, i) => {
        if (!isObject(s)) throw new ActionError(`steps[${i}] must be an object like {"name": "Design", "who": "pastel", "note": "...", "needs_you": true}.`);
        return within(`steps[${i}]`, () => {
          const doer = oneOf(s, "who", who, { required: true }) as string;
          return {
            name: requiredString(s, "name", "the step's name"),
            who: doer,
            note: optionalString(s, "note") ?? null,
            needs_you: bool(s, "needs_you") ?? doer === "you",
          };
        });
      });
      return tx(() => {
        run("DELETE FROM process_steps WHERE project = ?", p.slug);
        steps.forEach((s, i) => run("INSERT INTO process_steps (project, position, name, who, note, needs_you) VALUES (?, ?, ?, ?, ?, ?)", p.slug, i, s.name, s.who, s.note, s.needs_you ? 1 : 0));
        patchRow("projects", "slug", p.slug, { process_markdown: markdown });
        return { project: p.slug, steps: all<StepRow>("SELECT * FROM process_steps WHERE project = ? ORDER BY position", p.slug).map(stepOut), process_markdown: markdown };
      });
    },
  },
  add_rule: {
    section: "Projects",
    description: "Adds a dated line under the project's \"Rules learned\".",
    params: {
      project: "string · project slug · required",
      text: "string · the rule, in the user's words · required",
      origin: "string · you (the user said it) or ok (the agent suggested it, the user agreed) · optional, default you",
    },
    run(input) {
      const p = mustProject(requiredString(input, "project", "the project's slug"));
      const text = requiredString(input, "text", "the rule, in the user's words");
      const origin = oneOf(input, "origin", RULE_ORIGINS) ?? "you";
      return tx(() => {
        const now = nowIso();
        const r = run("INSERT INTO project_rules (project, text, origin, learned_at) VALUES (?, ?, ?, ?)", p.slug, text, origin, now);
        patchRow("projects", "slug", p.slug, { updated_at: now });
        return get<RuleRow>("SELECT * FROM project_rules WHERE id = ?", Number(r.lastInsertRowid));
      });
    },
  },
  list_projects: {
    section: "Projects",
    description: "Every project with its open, waiting-on-you, and total task counts.",
    params: {},
    read: true,
    run() {
      return all<ProjectRow & { open: number; waiting: number; total: number }>(
        `SELECT p.*,
           (SELECT COUNT(*) FROM tasks t WHERE t.project = p.slug AND t.column_name != 'done') AS open,
           (SELECT COUNT(*) FROM tasks t WHERE t.project = p.slug AND t.column_name = 'waiting_on_you') AS waiting,
           (SELECT COUNT(*) FROM tasks t WHERE t.project = p.slug) AS total
         FROM projects p ORDER BY p.sort_order, p.name`,
      );
    },
  },

  // --------------------------------------------------------------- Tasks
  create_task: {
    section: "Tasks",
    description: "Creates the task and its page, with the event \"Made this task\" by the chief. Returns the task; the id is made from the title when not given.",
    params: {
      project: "string · project slug · required",
      title: "string · the card's title · required",
      specialist: "string · member slug who does it · optional",
      id: "string · kebab-case id, e.g. acme-proposal · optional, made unique from the title when missing",
      column: "string · todo, in_progress, or done · optional, default todo (use move_task for waiting_on_you)",
      step: "integer · index of the process step it is on, from 0 · optional",
      job_definition: "string · what this is, in plain words · optional",
      original_request: "string · the user's own words · optional",
      done_when: "string[] · the Done when checklist; or [{text, met}] · optional",
      plan: "string[] · the steps, first one now, the rest later; or [{text, state}] · optional",
      due: "string · ISO date · optional",
      note: "string · one line shown on the card · optional",
    },
    run(input) {
      const project = mustProject(requiredString(input, "project", "the project's slug"));
      const title = requiredString(input, "title", "the card's title");
      if (optionalString(input, "column") === "waiting_on_you") {
        throw new ActionError("column cannot be waiting_on_you when creating a task: create it, then call move_task with a question. Valid here: todo, in_progress, done.");
      }
      const column = oneOf(input, "column", COLUMNS) ?? "todo";
      const specialist = memberField(input, "specialist") ?? null;
      const step = stepField(input, project.slug) ?? null;
      const checks = normalizeChecks(array(input, "done_when") ?? []);
      const plan = normalizePlan(array(input, "plan") ?? []);
      const wanted = optionalString(input, "id");
      let id = wanted ? kebab(wanted) : kebab(title);
      if (wanted && get("SELECT 1 FROM tasks WHERE id = ?", id)) {
        throw new ActionError(`A task with id '${id}' already exists. Pass another id, or leave it out to make one from the title.`);
      }
      for (let n = 2; get("SELECT 1 FROM tasks WHERE id = ?", id); n++) id = `${kebab(title)}-${n}`;
      return tx(() => {
        const now = nowIso();
        insertRow("tasks", {
          id, project: project.slug, title, specialist, column_name: column, step,
          note: optionalString(input, "note") ?? null,
          job_definition: optionalString(input, "job_definition") ?? null,
          original_request: optionalString(input, "original_request") ?? null,
          due: isoDate(input, "due") ?? null,
          created_at: now, updated_at: now, done_at: column === "done" ? now : null,
        });
        replaceChecks(id, checks);
        replacePlan(id, plan);
        addUpdate(id, chiefSlug(), "event", "Made this task", [], null, 0, now);
        return taskPage(id);
      });
    },
  },
  update_task: {
    section: "Tasks",
    description: "Changes the description parts of a task's page. Only the fields passed change; done_when and plan replace their lists.",
    params: {
      id: "string · task id · required",
      title: "string · optional",
      specialist: "string · member slug, or null to unassign · optional",
      step: "integer · process step index, from 0 · optional",
      note: "string · one line shown on the card · optional",
      job_definition: "string · optional",
      original_request: "string · optional",
      due: "string · ISO date, or null to clear · optional",
      done_when: "[{text, met}] · replaces the checklist; plain strings are unmet · optional",
      plan: "[{text, state}] · replaces the plan; states are done, now, later · optional",
    },
    run(input) {
      const t = mustTask(requiredString(input, "id", "the task's id"));
      const patch: Patch = {};
      if (present(input, "title")) patch.title = requiredString(input, "title", "the card's title");
      if (present(input, "specialist")) patch.specialist = memberField(input, "specialist");
      if (present(input, "step")) patch.step = stepField(input, t.project);
      if (present(input, "note")) patch.note = optionalString(input, "note");
      if (present(input, "job_definition")) patch.job_definition = optionalString(input, "job_definition");
      if (present(input, "original_request")) patch.original_request = optionalString(input, "original_request");
      if (present(input, "due")) patch.due = isoDate(input, "due");
      const checks = present(input, "done_when") ? normalizeChecks(array(input, "done_when") ?? []) : undefined;
      const plan = present(input, "plan") ? normalizePlan(array(input, "plan") ?? []) : undefined;
      return tx(() => {
        let changed = patchRow("tasks", "id", t.id, patch);
        if (checks) { replaceChecks(t.id, checks); changed = true; }
        if (plan) { replacePlan(t.id, plan); changed = true; }
        if (changed) touchTask(t.id);
        return taskPage(t.id);
      });
    },
  },
  move_task: {
    section: "Tasks",
    description: "Moves the card. waiting_on_you needs one clear question (and its kind); leaving it clears the question; done sets done_at. Adds the event \"Moved to …\".",
    params: {
      id: "string · task id · required",
      column: "string · todo, in_progress, waiting_on_you, or done · required",
      question: "string · the one question for the user · required when column is waiting_on_you",
      question_kind: "string · money (Yes, pay / Not yet buttons), approve, or answer · optional, default answer",
    },
    run(input) {
      const t = mustTask(requiredString(input, "id", "the task's id"));
      const column = oneOf(input, "column", COLUMNS, { required: true }) as Column;
      let question: string | null = null;
      let kind: string | null = null;
      if (column === "waiting_on_you") {
        question = optionalString(input, "question") ?? null;
        if (!question) {
          throw new ActionError(`Moving to waiting_on_you needs a question: pass question (one clear question for the user) and question_kind, one of: ${listOf(QUESTION_KINDS)}.`);
        }
        kind = oneOf(input, "question_kind", QUESTION_KINDS) ?? "answer";
      }
      const moved = column !== t.column_name;
      return tx(() => {
        const now = nowIso();
        const doneAt = column === "done" ? (t.column_name === "done" ? t.done_at : now) : null;
        run("UPDATE tasks SET column_name = ?, question = ?, question_kind = ?, done_at = ?, updated_at = ? WHERE id = ?", column, question, kind, doneAt, now, t.id);
        if (moved) addUpdate(t.id, t.specialist ?? chiefSlug(), "event", `Moved to ${COLUMN_LABEL[column]}`, [], null, 0, now);
        // The question is posted in the same transaction, so the page always has a
        // current question row to pin, and an answer can only ever reply to that row.
        // An earlier "yes" to an earlier question stays attached to the earlier row.
        let questionUpdate: UpdateRow | null = null;
        if (question && (moved || question !== t.question)) {
          questionUpdate = addUpdate(t.id, t.specialist ?? chiefSlug(), "question", question, [], null, 0, now);
        }
        return { ...taskOut(mustTask(t.id)), moved, question_update_id: questionUpdate?.id ?? currentQuestionId(t.id) };
      });
    },
  },
  add_task_note: {
    section: "Tasks",
    description: "Posts to the conversation on the task's page. A question while the task waits on the user is the pinned question's author and time. Files also appear under \"Files from this task\".",
    params: {
      id: "string · task id · required",
      author: "string · member slug · required",
      kind: "string · update, question, or event · required",
      body: "string · plain words · required",
      files: "[{name, url}] · links the user can open · optional",
    },
    run(input) {
      const t = mustTask(requiredString(input, "id", "the task's id"));
      const author = memberField(input, "author");
      if (!author) throw new ActionError(`author is required: a member slug, one of: ${listOf(memberSlugs())}.`);
      const kind = oneOf(input, "kind", NOTE_KINDS, { required: true }) as UpdateRow["kind"];
      const body = requiredString(input, "body", "what to say, in plain words");
      const files = normalizeFiles(array(input, "files") ?? []);
      return tx(() => {
        const now = nowIso();
        // move_task already posted the task's current question; asking it again
        // must not make a second card (or a second thing for the user to answer).
        if (kind === "question" && t.column_name === "waiting_on_you" && t.question === body) {
          const current = currentQuestionId(t.id);
          if (current) return updateOut(get<UpdateRow>("SELECT * FROM task_updates WHERE id = ?", current) as UpdateRow);
        }
        const u = addUpdate(t.id, author, kind, body, files, null, 0, now);
        for (const f of files) attach(t.id, f, now);
        touchTask(t.id, now);
        return updateOut(u);
      });
    },
  },
  attach_file: {
    section: "Tasks",
    description: "Adds a file to \"Files from this task\". The URL must open for the user: a file artifact link or a file stored in the app, never a path on the agent's computer.",
    params: { id: "string · task id · required", name: "string · e.g. Acme proposal, draft (PDF) · required", url: "string · a link the user can open · required" },
    run(input) {
      const t = mustTask(requiredString(input, "id", "the task's id"));
      const file = { name: requiredString(input, "name", "the file's name as the user should see it"), url: openableUrl(input, "url") };
      return tx(() => {
        const now = nowIso();
        const row = attach(t.id, file, now);
        touchTask(t.id, now);
        return fileOut(row);
      });
    },
  },
  get_task: {
    section: "Tasks",
    description: "Everything on the task's page: the card, done when, plan, files, and the conversation.",
    params: { id: "string · task id · required" },
    read: true,
    run(input) {
      return taskPage(requiredString(input, "id", "the task's id"));
    },
  },
  list_tasks: {
    section: "Tasks",
    description: "The cards, with title, column, specialist, step, question, note, due, and updated_at. Filters combine.",
    params: { project: "string · project slug · optional", column: "string · todo, in_progress, waiting_on_you, or done · optional", specialist: "string · member slug · optional" },
    read: true,
    run(input) {
      const project = projectField(input, "project") ?? null;
      const column = oneOf(input, "column", COLUMNS) ?? null;
      const specialist = memberField(input, "specialist") ?? null;
      type Row = TaskRow & { project_name: string; specialist_name: string | null };
      return all<Row>(
        `SELECT t.*, p.name AS project_name, m.name AS specialist_name
         FROM tasks t JOIN projects p ON p.slug = t.project LEFT JOIN members m ON m.slug = t.specialist
         WHERE (? IS NULL OR t.project = ?) AND (? IS NULL OR t.column_name = ?) AND (? IS NULL OR t.specialist = ?)
         ORDER BY CASE t.column_name WHEN 'todo' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'waiting_on_you' THEN 2 ELSE 3 END, t.updated_at DESC`,
        project, project, column, column, specialist, specialist,
      ).map(({ project_name, specialist_name, ...t }) => ({ ...taskOut(t), project_name, specialist_name }));
    },
  },

  // ------------------------------------------------------------ Comments
  list_recent_updates: {
    section: "Comments",
    description: "Newest task updates and note comments, including every user comment. Cursor pagination stays stable as new updates arrive. Use unread_only for the scheduled comment check and follow next_cursor until null.",
    params: {
      limit: "integer · 1 to 100, default 30 · optional",
      cursor: "string · next_cursor returned by an earlier page · optional",
      unread_only: "boolean · only user comments awaiting an agent · optional, default false",
    },
    read: true,
    run(input) {
      const limit = int(input, "limit", { min: 1, max: 100 }) ?? 30;
      const unreadOnly = bool(input, "unread_only") ?? false;
      const cursorText = optionalString(input, "cursor");
      type UpdateCursor = { at: string; source: "task" | "note"; id: number };
      let cursor: UpdateCursor | null = null;
      if (cursorText) {
        try {
          const parsed = JSON.parse(Buffer.from(cursorText, "base64url").toString("utf8")) as UpdateCursor;
          if (!parsed || typeof parsed.at !== "string" || !["task", "note"].includes(parsed.source) || !Number.isSafeInteger(parsed.id) || parsed.id < 1) throw new Error("invalid cursor");
          cursor = parsed;
        } catch {
          throw new ActionError("cursor must be a next_cursor returned by list_recent_updates.");
        }
      }
      type Row = {
        id: number; source: "task" | "note"; target_id: string; target_title: string;
        owner: string | null; author: string; kind: string; body: string;
        reply_to: number | null; replying_to_body: string | null;
        unread_by_agent: number; created_at: string;
      };
      const rows = all<Row>(
        `SELECT * FROM (
           SELECT u.id, 'task' AS source, t.id AS target_id, t.title AS target_title,
                  COALESCE(t.specialist, p.lead) AS owner, u.author, u.kind, u.body,
                  u.reply_to, r.body AS replying_to_body, u.unread_by_agent, u.created_at
           FROM task_updates u JOIN tasks t ON t.id = u.task
           JOIN projects p ON p.slug = t.project LEFT JOIN task_updates r ON r.id = u.reply_to
           UNION ALL
           SELECT c.id, 'note' AS source, n.slug AS target_id, n.title AS target_title,
                  n.kept_by AS owner, c.author, CASE WHEN c.reply_to IS NULL THEN 'comment' ELSE 'reply' END AS kind,
                  c.body, c.reply_to, r.body AS replying_to_body, c.unread_by_agent, c.created_at
           FROM note_comments c JOIN notes n ON n.slug = c.note
           LEFT JOIN note_comments r ON r.id = c.reply_to
         ) WHERE (? = 0 OR (author = 'you' AND unread_by_agent = 1))
           AND (? IS NULL OR created_at < ? OR (created_at = ? AND (source < ? OR (source = ? AND id < ?))))
         ORDER BY created_at DESC, source DESC, id DESC LIMIT ?`,
        unreadOnly ? 1 : 0,
        cursor?.at ?? null, cursor?.at ?? null, cursor?.at ?? null,
        cursor?.source ?? "", cursor?.source ?? "", cursor?.id ?? 0,
        limit + 1,
      );
      const page = rows.slice(0, limit);
      const last = page.at(-1);
      return {
        updates: page.map((r) => ({
          ...r, owner: r.owner ?? chiefSlug(), unread_by_agent: !!r.unread_by_agent,
          url: r.source === "task" ? `/tasks/${r.target_id}` : `/notes/${r.target_id}`,
        })),
        next_cursor: rows.length > limit && last
          ? Buffer.from(JSON.stringify({ at: last.created_at, source: last.source, id: last.id })).toString("base64url")
          : null,
      };
    },
  },
  list_new_comments: {
    section: "Comments",
    description: "Every comment or reply the user wrote that the agent has not read yet, oldest first, with its task and the update it answers.",
    params: {},
    read: true,
    run() {
      type Row = {
        id: number; kind: string; body: string; created_at: string; reply_to: number | null;
        task_id: string; task_title: string; project: string; project_name: string; specialist: string | null; column_name: Column; question: string | null; question_kind: string | null;
        r_id: number | null; r_author: string | null; r_kind: string | null; r_body: string | null; r_created_at: string | null;
      };
      return all<Row>(
        `SELECT u.id, u.kind, u.body, u.created_at, u.reply_to,
                t.id AS task_id, t.title AS task_title, t.project, p.name AS project_name, t.specialist, t.column_name, t.question, t.question_kind,
                r.id AS r_id, r.author AS r_author, r.kind AS r_kind, r.body AS r_body, r.created_at AS r_created_at
         FROM task_updates u
         JOIN tasks t ON t.id = u.task
         JOIN projects p ON p.slug = t.project
         LEFT JOIN task_updates r ON r.id = u.reply_to
         WHERE u.author = 'you' AND u.unread_by_agent = 1
         ORDER BY u.id`,
      ).map((r) => ({
        id: r.id, kind: r.kind, body: r.body, created_at: r.created_at,
        task: { id: r.task_id, title: r.task_title, project: r.project, project_name: r.project_name, specialist: r.specialist, column: r.column_name, question: r.question, question_kind: r.question_kind },
        replying_to: r.r_id == null ? null : { id: r.r_id, author: r.r_author, kind: r.r_kind, body: r.r_body, created_at: r.r_created_at },
      }));
    },
  },
  reply_to_comment: {
    section: "Comments",
    description: "Answers a task comment in the same thread and marks it read. Pass source from list_recent_updates so a note id cannot route the reply to an unrelated task.",
    params: { source: "string · task · required", comment_id: "integer · task comment id · required", author: "string · member slug · required", body: "string · the answer, in plain words · required" },
    run(input) {
      oneOf(input, "source", ["task"], { required: true });
      const id = int(input, "comment_id", { required: true, min: 1 }) as number;
      const parent = get<UpdateRow>("SELECT * FROM task_updates WHERE id = ?", id);
      if (!parent) throw new ActionError(`No comment with id ${id}. list_new_comments returns the ids of the user's unread comments.`, 404);
      if (parent.author !== "you") throw new ActionError(`comment_id ${id} is not something the user wrote (it is ${parent.author}'s ${parent.kind}); reply to a comment or reply by the user.`);
      const author = memberField(input, "author");
      if (!author) throw new ActionError(`author is required: a member slug, one of: ${listOf(memberSlugs())}.`);
      const body = requiredString(input, "body", "the answer, in plain words");
      return tx(() => {
        const now = nowIso();
        const u = addUpdate(parent.task, author, "reply", body, [], parent.id, 0, now);
        run("UPDATE task_updates SET unread_by_agent = 0 WHERE id = ?", parent.id);
        touchTask(parent.task, now);
        return updateOut(u);
      });
    },
  },
  mark_comments_read: {
    section: "Comments",
    description: "Clears unread_by_agent on task comments only. Pass source from list_recent_updates so a note id cannot silently mark a different task comment read.",
    params: { source: "string · task · required", ids: "integer[] · task comment ids · required" },
    run(input) {
      oneOf(input, "source", ["task"], { required: true });
      const ids = intArray(input, "ids", { required: true }) ?? [];
      if (!ids.length) throw new ActionError("ids is required: a list of task comment ids from list_recent_updates or list_new_comments.");
      const r = run(`UPDATE task_updates SET unread_by_agent = 0 WHERE author = 'you' AND id IN (${ids.map(() => "?").join(", ")})`, ...ids);
      return { marked: r.changes };
    },
  },
  reply_to_note_comment: {
    section: "Comments",
    description: "Answers a user comment on a note and marks it read. The note's keeper owns the follow-up. Pass source from list_recent_updates so a task id cannot route the reply to an unrelated note.",
    params: { source: "string · note · required", comment_id: "integer · note comment id · required", author: "string · member slug · required", body: "string · answer · required" },
    run(input) {
      oneOf(input, "source", ["note"], { required: true });
      const id = int(input, "comment_id", { required: true, min: 1 }) as number;
      const parent = get<NoteCommentRow>("SELECT * FROM note_comments WHERE id = ?", id);
      if (!parent || parent.author !== "you") throw new ActionError(`No user note comment with id ${id}.`, 404);
      const author = memberField(input, "author");
      if (!author) throw new ActionError("author is required: a member slug.");
      const body = requiredString(input, "body", "the answer");
      return tx(() => {
        const r = run("INSERT INTO note_comments (note, author, body, reply_to) VALUES (?, ?, ?, ?)", parent.note, author, body, id);
        run("UPDATE note_comments SET unread_by_agent = 0 WHERE id = ?", id);
        return get<NoteCommentRow>("SELECT * FROM note_comments WHERE id = ?", Number(r.lastInsertRowid));
      });
    },
  },
  mark_note_comments_read: {
    section: "Comments",
    description: "Marks user comments on notes read after their owner has handled them. Pass source from list_recent_updates to guard against id collisions with task comments.",
    params: { source: "string · note · required", ids: "integer[] · note comment ids · required" },
    run(input) {
      oneOf(input, "source", ["note"], { required: true });
      const ids = intArray(input, "ids", { required: true }) ?? [];
      if (!ids.length) throw new ActionError("ids is required.");
      return { marked: run(`UPDATE note_comments SET unread_by_agent = 0 WHERE author = 'you' AND id IN (${ids.map(() => "?").join(", ")})`, ...ids).changes };
    },
  },

  // ----------------------------------------------------------- Customers
  upsert_contact: {
    section: "Customers",
    description: "Adds or updates a person. Only the fields passed change; a stage change is recorded for the funnel.",
    params: {
      slug: "string · kebab-case id, e.g. sarah-chen · optional, made from the name when missing",
      name: "string · required for a new person",
      company: "string · optional",
      title: "string · their role at the company · optional",
      stage: "string · lead, talking, proposal, customer, or past · optional, default lead",
      source: "string · where they came from, e.g. website inquiry · optional",
      notes: "string[] · short facts, e.g. Prefers email. · optional",
      value: "number · what they are worth this year, in dollars · optional",
      in_funnel: "boolean · false for someone kept here without selling to them (the person themselves, the maker of the hat): shown as Contact, no stage, not counted in the funnel or the reports · optional, default true",
    },
    run(input) {
      const slug = slugFrom(input, "name", "sarah-chen");
      const existing = get<ContactRow>("SELECT * FROM contacts WHERE slug = ?", slug);
      const patch: Patch = {};
      if (present(input, "name")) patch.name = requiredString(input, "name", "the person's name");
      if (present(input, "company")) patch.company = optionalString(input, "company");
      if (present(input, "title")) patch.title = optionalString(input, "title");
      if (present(input, "source")) patch.source = optionalString(input, "source");
      if (present(input, "notes")) patch.notes_json = JSON.stringify(stringArray(input, "notes"));
      if (present(input, "value")) {
        const v = num(input, "value", { min: 0 });
        patch.value_cents = v == null ? null : Math.round(v * 100);
      }
      const stage = oneOf(input, "stage", STAGES);
      const inFunnel = bool(input, "in_funnel");
      return tx(() => {
        const now = nowIso();
        if (existing) {
          // Someone kept outside the funnel enters it when given a stage (or in_funnel true);
          // that entry is the first recorded stage change.
          const enters = existing.in_funnel === 0 && (inFunnel === true || (stage !== undefined && inFunnel !== false));
          if (inFunnel === false && existing.in_funnel === 1) {
            // Kept here without selling to them: whatever stages were recorded were not
            // sales history, so they go, and the funnel and the reports stop counting them.
            patch.in_funnel = 0;
            run("DELETE FROM stage_changes WHERE contact = ?", slug);
          }
          if (enters) {
            // Entering the funnel is their first recorded stage change; without a stage, they enter as a lead.
            patch.in_funnel = 1;
            patch.stage = stage ?? "lead";
            run("INSERT INTO stage_changes (contact, stage, changed_at) VALUES (?, ?, ?)", slug, patch.stage, now);
          } else if (stage && stage !== existing.stage && inFunnel !== false && existing.in_funnel === 1) {
            patch.stage = stage;
            run("INSERT INTO stage_changes (contact, stage, changed_at) VALUES (?, ?, ?)", slug, stage, now);
          } else if (stage && inFunnel === false) {
            patch.stage = stage; // remembered, shown nowhere
          }
          patchRow("contacts", "slug", slug, patch);
        } else {
          requireForNew(patch, ["name"], `contact '${slug}'`);
          const off = inFunnel === false;
          insertRow("contacts", { slug, notes_json: "[]", ...patch, stage: stage ?? (off ? "past" : "lead"), in_funnel: off ? 0 : 1, created_at: now, updated_at: now });
          if (!off) run("INSERT INTO stage_changes (contact, stage, changed_at) VALUES (?, ?, ?)", slug, stage ?? "lead", now);
        }
        return contactOut(mustContact(slug));
      });
    },
  },
  log_touch: {
    section: "Customers",
    description: "Adds a line to the person's timeline and to \"Lately\".",
    params: {
      contact: "string · contact slug · required",
      channel: "string · email, call, meeting, message, website, invoice, or note · required",
      summary: "string · one line · required",
      by: "string · member slug or you · optional",
      task: "string · task id it came from · optional",
      happened_at: "string · ISO timestamp · optional, default now",
    },
    run(input) {
      const c = mustContact(requiredString(input, "contact", "the person's slug"));
      const channel = oneOf(input, "channel", CHANNELS, { required: true });
      const summary = requiredString(input, "summary", "one line");
      const by = memberField(input, "by", ["you"]) ?? null;
      const task = taskField(input, "task") ?? null;
      const at = isoDate(input, "happened_at") ?? nowIso();
      return tx(() => {
        const r = run("INSERT INTO touches (contact, channel, summary, by, task, happened_at) VALUES (?, ?, ?, ?, ?, ?)", c.slug, channel, summary, by, task, at);
        run("UPDATE contacts SET updated_at = ? WHERE slug = ?", nowIso(), c.slug);
        return get<TouchRow>("SELECT * FROM touches WHERE id = ?", Number(r.lastInsertRowid));
      });
    },
  },
  set_next_step: {
    section: "Customers",
    description: "Sets what happens next with this person and when.",
    params: {
      contact: "string · contact slug · required",
      text: "string · the next step, e.g. Send the proposal · required",
      due: "string · ISO date · optional",
      waiting_on_you: "boolean · true when the step waits on the user · optional, default false",
    },
    run(input) {
      const c = mustContact(requiredString(input, "contact", "the person's slug"));
      const text = requiredString(input, "text", "the next step, in plain words");
      const due = isoDate(input, "due") ?? null;
      const waiting = bool(input, "waiting_on_you") ?? false;
      patchRow("contacts", "slug", c.slug, { next_step: text, next_due: due, next_waiting_on_you: waiting ? 1 : 0 });
      return contactOut(mustContact(c.slug));
    },
  },
  set_stage: {
    section: "Customers",
    description: "Moves a person along the funnel; the change is recorded when the stage actually changes. Someone kept outside the funnel enters it.",
    params: { contact: "string · contact slug · required", stage: "string · lead, talking, proposal, customer, or past · required" },
    run(input) {
      const c = mustContact(requiredString(input, "contact", "the person's slug"));
      const stage = oneOf(input, "stage", STAGES, { required: true });
      const changed = stage !== c.stage || c.in_funnel === 0;
      return tx(() => {
        if (changed) {
          const now = nowIso();
          run("INSERT INTO stage_changes (contact, stage, changed_at) VALUES (?, ?, ?)", c.slug, stage, now);
          patchRow("contacts", "slug", c.slug, { stage, in_funnel: 1 });
        }
        return { ...contactOut(mustContact(c.slug)), changed };
      });
    },
  },
  find_contacts: {
    section: "Customers",
    description: "Search people by name or company, with an optional stage filter; most recently updated first.",
    params: { q: "string · part of a name or company · optional", stage: "string · lead, talking, proposal, customer, or past · optional" },
    read: true,
    run(input) {
      const q = optionalString(input, "q") ?? null;
      const like = q ? `%${escapeLike(q)}%` : null;
      const stage = oneOf(input, "stage", STAGES) ?? null;
      type Row = ContactRow & { last_touch_at: string | null; last_channel: string | null };
      return all<Row>(
        `SELECT c.*,
           (SELECT happened_at FROM touches x WHERE x.contact = c.slug ORDER BY happened_at DESC LIMIT 1) AS last_touch_at,
           (SELECT channel FROM touches x WHERE x.contact = c.slug ORDER BY happened_at DESC LIMIT 1) AS last_channel
         FROM contacts c
         WHERE (? IS NULL OR c.name LIKE ? ESCAPE '\\' OR c.company LIKE ? ESCAPE '\\') AND (? IS NULL OR c.stage = ?)
         ORDER BY c.updated_at DESC`,
        like, like, like, stage, stage,
      ).map(({ last_touch_at, last_channel, ...c }) => ({ ...contactOut(c), last_touch_at, last_channel }));
    },
  },
  list_followups: {
    section: "Customers",
    description: "Everyone with a next step due in the window (overdue included) or waiting on the user; waiting first, then soonest.",
    params: { days: "integer · how many days ahead · optional, default 7" },
    read: true,
    run(input) {
      return followups(int(input, "days", { min: 0, max: 3650 }) ?? 7);
    },
  },

  // ------------------------------------------------------------- Reports
  upsert_report: {
    section: "Reports",
    description: "Adds or updates a report card. Only the fields passed change; a new report needs section, title, and chart.",
    params: {
      slug: "string · kebab-case id, e.g. in-out · optional, made from the title when missing",
      section: "string · Your business or Your money · required for a new report",
      title: "string · required for a new report",
      description: "string · one line, what it measures · optional",
      chart: "string · bars, timeline, donut, grouped-bars, stacked-bars, bars-horizontal, list, savings, or number · required for a new report",
      owner: "string · member slug who keeps it fresh · optional",
      source: "string · where the numbers come from · optional",
      source_url: "string · https URL for a published source · optional",
    },
    run(input) {
      const slug = slugFrom(input, "title", "in-out");
      const existing = get<ReportRow>("SELECT * FROM reports WHERE slug = ?", slug);
      const patch: Patch = {};
      if (present(input, "section")) patch.section = requiredString(input, "section", "Your business or Your money");
      if (present(input, "title")) patch.title = requiredString(input, "title", "the report's title");
      if (present(input, "description")) patch.description = optionalString(input, "description");
      if (present(input, "chart")) patch.chart = oneOf(input, "chart", CHARTS, { required: true });
      if (present(input, "owner")) patch.owner = memberField(input, "owner");
      if (present(input, "source")) patch.source = optionalString(input, "source");
      if (present(input, "source_url")) {
        const url = optionalString(input, "source_url");
        if (url && !/^https:\/\/[^\s]+$/i.test(url)) throw new ActionError("source_url must be an https URL.");
        patch.source_url = url;
      }
      if (existing) {
        patchRow("reports", "slug", slug, patch);
      } else {
        requireForNew(patch, ["section", "title", "chart"], `report '${slug}' (chart is one of: ${listOf(CHARTS)})`);
        insertRow("reports", { slug, ...patch, sort_order: nextSort("reports"), updated_at: nowIso() });
      }
      return mustReport(slug);
    },
  },
  record_metric: {
    section: "Reports",
    description: "Adds or replaces one number: the same report + series + label replaces the row (no series counts as a value). See spec/SCHEMA.md for what each report expects.",
    params: {
      report: "string · report slug · required",
      label: "string · a week start, a month, a bill name, a client, … · required",
      value: "number · dollars for money, counts for people · required",
      series: "string · visitors, in, a category, a client, … · optional",
      note: "object · chart-specific fields, e.g. {due, how} · optional, kept from the old row when omitted",
      recorded_at: "string · ISO timestamp · optional, default now",
    },
    run(input) {
      const r = mustReport(requiredString(input, "report", "the report's slug"));
      const label = requiredString(input, "label", "what the number is for");
      const value = num(input, "value", { required: true }) as number;
      const series = optionalString(input, "series") ?? null;
      const note = object(input, "note");
      const at = isoDate(input, "recorded_at") ?? nowIso();
      return tx(() => {
        const existing = get<MetricRow>("SELECT * FROM metrics WHERE report = ? AND series IS ? AND label = ?", r.slug, series, label);
        const noteJson = note !== undefined ? JSON.stringify(note) : existing?.note_json ?? "{}";
        let id: number;
        if (existing) {
          run("UPDATE metrics SET value = ?, note_json = ?, recorded_at = ? WHERE id = ?", value, noteJson, at, existing.id);
          id = existing.id;
        } else {
          id = Number(run("INSERT INTO metrics (report, series, label, value, note_json, recorded_at) VALUES (?, ?, ?, ?, ?, ?)", r.slug, series, label, value, noteJson, at).lastInsertRowid);
        }
        run("UPDATE reports SET updated_at = ? WHERE slug = ?", nowIso(), r.slug);
        return { ...metricOut(get<MetricRow>("SELECT * FROM metrics WHERE id = ?", id) as MetricRow), replaced: !!existing };
      });
    },
  },
  clear_metrics: {
    section: "Reports",
    description: "Removes a report's numbers (or one series of them) before a full refresh.",
    params: { report: "string · report slug · required", series: "string · only this series · optional" },
    run(input) {
      const r = mustReport(requiredString(input, "report", "the report's slug"));
      const series = optionalString(input, "series") ?? null;
      const removed = series === null
        ? run("DELETE FROM metrics WHERE report = ?", r.slug).changes
        : run("DELETE FROM metrics WHERE report = ? AND series = ?", r.slug, series).changes;
      return { report: r.slug, series, removed };
    },
  },
  list_reports: {
    section: "Reports",
    description: "Every report with its numbers.",
    params: {},
    read: true,
    run() {
      return all<ReportRow>("SELECT * FROM reports ORDER BY sort_order, slug").map((r) => ({
        ...r,
        metrics: all<MetricRow>("SELECT * FROM metrics WHERE report = ? ORDER BY series, label", r.slug).map(metricOut),
      }));
    },
  },

  // --------------------------------------------------------------- Notes
  upsert_note: {
    section: "Notes",
    description: "Adds or updates a note. One note per topic: update rather than add. Only the fields passed change.",
    params: {
      slug: "string · kebab-case id, e.g. brand-guide · optional, made from the title when missing",
      title: "string · required for a new note",
      markdown: "string · the body · required for a new note",
      project: "string · project slug · optional",
      lede: "string · one line under the title · optional",
      kept_by: "string · member slug who keeps it · optional",
      linked_tasks: "string[] · task ids it came from · optional",
      tags: "string[] · topics and keywords for finding it later, e.g. [\"brand\", \"colors\", \"decision\"] · lowercase, up to 12 · optional",
      pinned: "boolean · true for the Start here note · optional",
    },
    run(input) {
      const slug = slugFrom(input, "title", "brand-guide");
      const existing = get<NoteRow>("SELECT * FROM notes WHERE slug = ?", slug);
      const patch: Patch = {};
      if (present(input, "title")) patch.title = requiredString(input, "title", "the note's title");
      if (present(input, "markdown")) patch.markdown = requiredString(input, "markdown", "the note's body, in markdown");
      if (present(input, "project")) patch.project = projectField(input, "project");
      if (present(input, "lede")) patch.lede = optionalString(input, "lede");
      if (present(input, "kept_by")) patch.kept_by = memberField(input, "kept_by");
      if (present(input, "linked_tasks")) {
        const ids = stringArray(input, "linked_tasks") ?? [];
        const unknown = ids.filter((id) => !get("SELECT 1 FROM tasks WHERE id = ?", id));
        if (unknown.length) throw new ActionError(`linked_tasks must be task ids; unknown: ${listOf(unknown)}. Known tasks: ${listOf(taskIds())}.`);
        patch.linked_tasks_json = JSON.stringify(ids);
      }
      if (present(input, "tags")) patch.tags_json = JSON.stringify(normalizeTags(stringArray(input, "tags") ?? []));
      if (present(input, "pinned")) patch.pinned = bool(input, "pinned") ? 1 : 0;
      if (existing) {
        patchRow("notes", "slug", slug, patch);
      } else {
        requireForNew(patch, ["title", "markdown"], `note '${slug}'`);
        const now = nowIso();
        insertRow("notes", { slug, linked_tasks_json: "[]", tags_json: "[]", pinned: 0, ...patch, created_at: now, updated_at: now });
      }
      return noteOut(mustNote(slug));
    },
  },
  get_note: {
    section: "Notes",
    description: "The note, with the tasks it came from.",
    params: { slug: "string · note slug · required" },
    read: true,
    run(input) {
      const n = noteOut(mustNote(requiredString(input, "slug", "the note's slug")));
      const came_from = n.linked_tasks
        .map((id) => get<TaskRow>("SELECT * FROM tasks WHERE id = ?", id))
        .filter((t): t is TaskRow => !!t)
        .map((t) => ({ id: t.id, title: t.title, project: t.project, column: t.column_name }));
      return { ...n, came_from };
    },
  },
  list_notes: {
    section: "Notes",
    description: "Search and filter the notes; each comes with an excerpt instead of the full body (get_note has that).",
    params: { q: "string · part of the title, lede, body, or a tag · optional", project: "string · project slug · optional", kept_by: "string · member slug · optional", tag: "string · one tag, exact · optional" },
    read: true,
    run(input) {
      const q = optionalString(input, "q") ?? null;
      const like = q ? `%${escapeLike(q)}%` : null;
      const project = projectField(input, "project") ?? null;
      const keptBy = memberField(input, "kept_by") ?? null;
      const tag = optionalString(input, "tag")?.trim().toLowerCase() ?? null;
      return all<NoteRow>(
        `SELECT * FROM notes
         WHERE (? IS NULL OR title LIKE ? ESCAPE '\\' OR lede LIKE ? ESCAPE '\\' OR markdown LIKE ? ESCAPE '\\' OR tags_json LIKE ? ESCAPE '\\')
           AND (? IS NULL OR project = ?) AND (? IS NULL OR kept_by = ?)
         ORDER BY pinned DESC, updated_at DESC`,
        like, like, like, like, like, project, project, keptBy, keptBy,
      ).filter((n) => !tag || json<string[]>(n.tags_json, []).includes(tag)).map((n) => {
        const { markdown, ...rest } = noteOut(n);
        return { ...rest, excerpt: markdown.replace(/<[^>]+>/g, " ").replace(/[#*_>|`-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 160) };
      });
    },
  },
  remove_note: {
    section: "Notes",
    description: "Removes a note. Only after the user's yes.",
    params: { slug: "string · note slug · required" },
    run(input) {
      const n = mustNote(requiredString(input, "slug", "the note's slug"));
      run("DELETE FROM notes WHERE slug = ?", n.slug);
      return { removed: n.slug, title: n.title };
    },
  },

  // -------------------------------------------------------------- Office
  summary: {
    section: "Office",
    description: "What the agent checks on every visit, in one call: task counts per column, tasks waiting on the user with their questions, follow-ups due this week, unread comments, bills waiting on the user, and the settings.",
    params: {},
    read: true,
    run() {
      const columns: Record<Column, number> = { todo: 0, in_progress: 0, waiting_on_you: 0, done: 0 };
      for (const r of all<{ column_name: Column; n: number }>("SELECT column_name, COUNT(*) AS n FROM tasks GROUP BY column_name")) {
        if (r.column_name in columns) columns[r.column_name] = r.n;
      }
      const waiting = all(
        `SELECT t.id, t.title, t.project, p.name AS project_name, t.specialist, t.question, t.question_kind, t.updated_at AS since
         FROM tasks t JOIN projects p ON p.slug = t.project WHERE t.column_name = 'waiting_on_you' ORDER BY t.updated_at`,
      );
      const taskUnread = get<{ n: number }>("SELECT COUNT(*) AS n FROM task_updates WHERE author = 'you' AND unread_by_agent = 1")?.n ?? 0;
      const noteUnread = get<{ n: number }>("SELECT COUNT(*) AS n FROM note_comments WHERE author = 'you' AND unread_by_agent = 1")?.n ?? 0;
      const bills = all(
        `SELECT label, value, json_extract(note_json, '$.due') AS due, json_extract(note_json, '$.task') AS task
         FROM metrics WHERE report = 'bills' AND json_extract(note_json, '$.how') = 'waiting_on_you' ORDER BY due`,
      );
      const settings = Object.fromEntries(all<{ key: string; value: string | null }>("SELECT key, value FROM settings").map((s) => [s.key, s.value]));
      return {
        now: nowIso(),
        columns,
        waiting_on_you: waiting,
        unread_comments: taskUnread + noteUnread,
        unread_task_comments: taskUnread,
        unread_note_comments: noteUnread,
        followups_this_week: followups(7).map((c) => ({ slug: c.slug, name: c.name, company: c.company, next_step: c.next_step, next_due: c.next_due, next_waiting_on_you: c.next_waiting_on_you })),
        bills_waiting_on_you: bills,
        settings,
      };
    },
  },
  set_setting: {
    section: "Office",
    description: "Sets one office setting.",
    params: { key: "string · office_name, user_name, hat_version, or last_agent_visit · required", value: "string · the value (an ISO timestamp for last_agent_visit) · required" },
    run(input) {
      const key = oneOf(input, "key", SETTING_KEYS, { required: true }) as string;
      const value = key === "last_agent_visit" ? (isoDate(input, "value", { required: true }) as string) : requiredString(input, "value", "the setting's value");
      setSetting(key, value);
      return { key, value };
    },
  },
};

// ------------------------------------------------------------- entry points

/** Runs one action. Throws ActionError (with an HTTP status) for anything the agent can fix. */
export function runAction(name: string, input: unknown): unknown {
  const def = ACTIONS[name];
  if (!def) throw new ActionError(`Unknown action ${name}. Known actions: ${Object.keys(ACTIONS).join(", ")}`, 404);
  const inp = asInput(input);
  if (def.read) return def.run(inp);
  // One transaction per write: the change and the "the agent was here" stamp land together or not at all.
  return tx(() => {
    const data = def.run(inp);
    if (!(name === "set_setting" && inp.key === "last_agent_visit")) setSetting("last_agent_visit", nowIso());
    return data;
  });
}

export type ActionResult = { status: number; body: { ok: true; data: unknown } | { ok: false; error: string } };

/** Any error as an HTTP status and a plain sentence; never a stack trace. */
export function describeError(err: unknown): ActionResult {
  if (err instanceof ActionError) return { status: err.status, body: { ok: false, error: err.message } };
  const e = err as { code?: unknown; message?: unknown };
  const message = typeof e?.message === "string" ? e.message : String(err);
  // SQLite refusing a change (a link to a missing row, a duplicate id) is the input's fault, so 400.
  if (typeof e?.code === "string" && e.code.startsWith("SQLITE_CONSTRAINT")) return { status: 400, body: { ok: false, error: `The database refused that change: ${message}.` } };
  return { status: 500, body: { ok: false, error: `Something went wrong: ${message}`.slice(0, 300) } };
}

/** runAction for HTTP handlers: never throws. */
export function callAction(name: string, input: unknown): ActionResult {
  try {
    return { status: 200, body: { ok: true, data: runAction(name, input) } };
  } catch (err) {
    return describeError(err);
  }
}

/** The contract as data, in spec order, for GET /api/actions. */
export function catalog() {
  return Object.entries(ACTIONS).map(([name, d]) => ({ name, section: d.section, description: d.description, params: d.params }));
}

/**
 * The user may comment on a task or note page (POST /api/comments).
 * Stored with author 'you' and unread_by_agent = 1 for list_recent_updates.
 * The money buttons post body "yes" or "not yet" as a reply to the question's update id.
 */
export function postComment(raw: unknown): { id: number; kind: "comment" | "reply" } {
  const input = asInput(raw);
  const noteSlug = optionalString(input, "note");
  if (noteSlug) {
    if (present(input, "task")) throw new ActionError("Comment on one task or one note, not both.");
    if (!get("SELECT 1 FROM notes WHERE slug = ?", noteSlug)) throw new ActionError(`No note '${noteSlug}'.`, 404);
    const body = optionalString(input, "body");
    if (!body) throw new ActionError("Write something first: the comment is empty.");
    const replyTo = int(input, "reply_to", { min: 1 }) ?? null;
    if (replyTo !== null && !get("SELECT 1 FROM note_comments WHERE id = ? AND note = ?", replyTo, noteSlug)) {
      throw new ActionError(`reply_to must be a comment on note '${noteSlug}'.`);
    }
    return tx(() => {
      const r = run("INSERT INTO note_comments (note, author, body, reply_to, unread_by_agent) VALUES (?, 'you', ?, ?, 1)", noteSlug, body, replyTo);
      return { id: Number(r.lastInsertRowid), kind: replyTo === null ? "comment" : "reply" };
    });
  }
  const taskId = requiredString(input, "task", "the task's id");
  if (!get("SELECT 1 FROM tasks WHERE id = ?", taskId)) throw new ActionError(`No task '${taskId}'. Open a task's page and comment there.`, 404);
  const body = optionalString(input, "body") ?? null;
  if (!body) throw new ActionError("Write something first: the comment is empty.");
  const replyTo = int(input, "reply_to", { min: 1 }) ?? null;
  if (replyTo !== null && !get("SELECT 1 FROM task_updates WHERE id = ? AND task = ?", replyTo, taskId)) {
    throw new ActionError(`reply_to must be the id of an update on task '${taskId}'; ${replyTo} is not one.`);
  }
  // A money answer is only meaningful as a reply to the question it answers.
  // A bare "yes" on a task waiting on a payment is refused rather than stored
  // as something the agent might read as approval.
  const task = get<TaskRow>("SELECT column_name, question_kind FROM tasks WHERE id = ?", taskId) as TaskRow;
  if (replyTo === null && task.column_name === "waiting_on_you" && task.question_kind === "money" && /^(yes|no|not yet)[.!]?$/i.test(body.trim())) {
    const current = currentQuestionId(taskId);
    throw new ActionError(
      `This task is waiting on a money question. Answer it with the Yes / Not yet buttons on the task's page` +
        (current ? ` (reply_to: ${current})` : "") + `, so the answer is tied to that question.`,
    );
  }
  const kind = replyTo === null ? "comment" : "reply";
  return tx(() => {
    const now = nowIso();
    const u = addUpdate(taskId, "you", kind, body, [], replyTo, 1, now);
    touchTask(taskId, now);
    return { id: u.id, kind };
  });
}
