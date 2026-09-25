import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

// One SQLite file holds the whole Office. The schema is applied on first
// open; a truthful starter office is seeded when the database is empty.
// OFFICE_SEED=demo loads the fictional showcase instead, and none skips seeds.

const DATA_DIR = process.env.OFFICE_DATA_DIR || path.join(process.cwd(), "data");
const DB_PATH = process.env.OFFICE_DB_PATH || path.join(DATA_DIR, "office.db");

type Db = Database.Database;

declare global {
  // eslint-disable-next-line no-var
  var __officeDb: Db | undefined;
}

function open(): Db {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  const schema = fs.readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf8");
  db.exec(schema);
  // Columns added after a database was first created (CREATE TABLE IF NOT EXISTS
  // does not add them). Keep this list short and append-only.
  const noteCols = (db.prepare("PRAGMA table_info(notes)").all() as Array<{ name: string }>).map((c) => c.name);
  if (!noteCols.includes("tags_json")) db.exec("ALTER TABLE notes ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]'");
  const contactCols = (db.prepare("PRAGMA table_info(contacts)").all() as Array<{ name: string }>).map((c) => c.name);
  if (!contactCols.includes("in_funnel")) db.exec("ALTER TABLE contacts ADD COLUMN in_funnel INTEGER NOT NULL DEFAULT 1");
  const reportCols = (db.prepare("PRAGMA table_info(reports)").all() as Array<{ name: string }>).map((c) => c.name);
  if (!reportCols.includes("source_url")) db.exec("ALTER TABLE reports ADD COLUMN source_url TEXT");
  const count = db.prepare("SELECT COUNT(*) AS n FROM members").get() as { n: number };
  if (count.n === 0 && process.env.OFFICE_SEED !== "none") {
    // Lazy imports keep seed data out of the hot path once the office exists.
    if (process.env.OFFICE_SEED === "demo") {
      const { seed } = require("./seed") as typeof import("./seed");
      seed(db);
    } else {
      const { seedStarter } = require("./starter-seed") as typeof import("./starter-seed");
      seedStarter(db);
    }
  }
  return db;
}

export function getDb(): Db {
  if (!global.__officeDb) global.__officeDb = open();
  return global.__officeDb;
}

export function nowIso(): string {
  return new Date().toISOString();
}

// Small typed helpers so pages and actions read the same way.
export function all<T = Record<string, unknown>>(sql: string, ...params: unknown[]): T[] {
  return getDb().prepare(sql).all(...params) as T[];
}
export function get<T = Record<string, unknown>>(sql: string, ...params: unknown[]): T | undefined {
  return getDb().prepare(sql).get(...params) as T | undefined;
}
export function run(sql: string, ...params: unknown[]): Database.RunResult {
  return getDb().prepare(sql).run(...params);
}
export function json<T>(text: string | null | undefined, fallback: T): T {
  if (!text) return fallback;
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

// The four columns and five stages, in the order the pages show them.
export const COLUMNS = ["todo", "in_progress", "waiting_on_you", "done"] as const;
export type Column = (typeof COLUMNS)[number];
export const COLUMN_LABEL: Record<Column, string> = {
  todo: "To do",
  in_progress: "In progress",
  waiting_on_you: "Waiting on you",
  done: "Done",
};
export const STAGES = ["lead", "talking", "proposal", "customer", "past"] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_LABEL: Record<Stage, string> = {
  lead: "Lead",
  talking: "Talking",
  proposal: "Proposal",
  customer: "Customer",
  past: "Past",
};

// Row shapes, matching db/schema.sql.
export interface MemberRow {
  slug: string; name: string; role: string; hat: string | null; job: string;
  avatar_url: string | null; color: string | null; does_json: string; never: string | null;
  skills_json: string; last_rule: string | null; is_chief: number; sort_order: number;
  created_at: string; updated_at: string;
}
export interface ProjectRow {
  slug: string; name: string; description: string | null; color: string; color_dark: string;
  lead: string | null; kind: string | null; process_markdown: string | null; done_when: string | null;
  sort_order: number; created_at: string; updated_at: string;
}
export interface StepRow { id: number; project: string; position: number; name: string; who: string; note: string | null; needs_you: number }
export interface RuleRow { id: number; project: string; text: string; origin: string; learned_at: string }
export interface TaskRow {
  id: string; project: string; title: string; specialist: string | null; column_name: Column; step: number | null;
  question: string | null; question_kind: string | null; note: string | null; job_definition: string | null;
  original_request: string | null; due: string | null; created_at: string; updated_at: string; done_at: string | null;
}
export interface CheckRow { id: number; task: string; position: number; text: string; met: number }
export interface PlanRow { id: number; task: string; position: number; text: string; state: "done" | "now" | "later" }
export interface FileRow { id: number; task: string; name: string; url: string | null; added_at: string }
export interface UpdateRow {
  id: number; task: string; author: string; kind: "event" | "update" | "question" | "comment" | "reply";
  body: string; files_json: string; reply_to: number | null; unread_by_agent: number; created_at: string;
}
export interface ContactRow {
  slug: string; name: string; company: string | null; title: string | null; stage: Stage; source: string | null;
  next_step: string | null; next_due: string | null; next_waiting_on_you: number; notes_json: string;
  value_cents: number | null; in_funnel: number; created_at: string; updated_at: string;
}
export interface TouchRow { id: number; contact: string; channel: string; summary: string; by: string | null; task: string | null; happened_at: string }
export interface StageChangeRow { id: number; contact: string; stage: Stage; changed_at: string }
export interface ReportRow {
  slug: string; section: string; title: string; description: string | null; chart: string; owner: string | null;
  source: string | null; source_url: string | null; sort_order: number; updated_at: string;
}
export interface MetricRow { id: number; report: string; series: string | null; label: string; value: number; note_json: string; recorded_at: string }
export interface NoteRow {
  slug: string; project: string | null; title: string; lede: string | null; markdown: string; kept_by: string | null;
  linked_tasks_json: string; tags_json: string; pinned: number; created_at: string; updated_at: string;
}
export interface NoteCommentRow {
  id: number; note: string; author: string; body: string; reply_to: number | null;
  unread_by_agent: number; created_at: string;
}
