-- Muse Office — SQLite schema.
-- One file. The app applies it on first start. Muse recreates these tables
-- when it builds the Office as an artifact (see spec/SCHEMA.md).

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------- Team
CREATE TABLE IF NOT EXISTS members (
  slug        TEXT PRIMARY KEY,                 -- 'chief', 'designer', 'developer', ...
  name        TEXT NOT NULL,                    -- the name the Muse gave this specialist
  role        TEXT NOT NULL,                    -- 'Chief of staff', 'Designer', ...
  hat         TEXT,                             -- 'red beret'
  job         TEXT NOT NULL,                    -- one line, what they do
  avatar_url  TEXT,
  color       TEXT,                             -- soft tile colour for the card
  does_json   TEXT NOT NULL DEFAULT '[]',       -- ["...", "...", "..."]
  never       TEXT,                             -- one line, what they never do
  skills_json TEXT NOT NULL DEFAULT '[]',       -- ["Receipts", "Invoices", "Bills"]
  last_rule   TEXT,                             -- 'Sep 20 — "Round to the cent, never to the dollar."'
  is_chief    INTEGER NOT NULL DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ------------------------------------------------------------ Projects
CREATE TABLE IF NOT EXISTS projects (
  slug             TEXT PRIMARY KEY,            -- related-work collection: 'website', 'personal', 'school'
  name             TEXT NOT NULL,
  description      TEXT,                        -- one line
  color            TEXT NOT NULL,               -- pastel fill, e.g. '#f2e4a9'
  color_dark       TEXT NOT NULL,               -- darker shade for bars and chart series, e.g. '#b89a3a'
  lead             TEXT REFERENCES members(slug),
  kind             TEXT,                        -- how it runs: 'Build', 'Publish', 'Follow up', 'Money', 'General'
  process_markdown TEXT,                        -- the process, written out (rendered on the project page)
  done_when        TEXT,                        -- one line
  archived_at      TEXT,                        -- removed from the active board; restore keeps every task
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS process_steps (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  project   TEXT NOT NULL REFERENCES projects(slug) ON DELETE CASCADE,
  position  INTEGER NOT NULL,                   -- 0-based
  name      TEXT NOT NULL,                      -- 'Design'
  who       TEXT NOT NULL,                      -- member slug, or 'you', or 'any'
  note      TEXT,                               -- one line: what happens in this step
  needs_you INTEGER NOT NULL DEFAULT 0          -- 1 when the user's OK is part of this step
);
CREATE INDEX IF NOT EXISTS process_steps_project ON process_steps(project, position);

CREATE TABLE IF NOT EXISTS project_rules (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  project    TEXT NOT NULL REFERENCES projects(slug) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  origin     TEXT NOT NULL DEFAULT 'you',       -- 'you' (the user said it) | 'ok' (the agent suggested, the user OK'd)
  learned_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- --------------------------------------------------------------- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id               TEXT PRIMARY KEY,            -- short slug, e.g. 'acme-proposal'
  project          TEXT NOT NULL REFERENCES projects(slug),
  title            TEXT NOT NULL,
  specialist       TEXT REFERENCES members(slug),
  column_name      TEXT NOT NULL DEFAULT 'todo', -- 'todo' | 'in_progress' | 'waiting_on_you' | 'done'
  step             INTEGER,                     -- index of the process step the task is on
  question         TEXT,                        -- set while waiting on the user: the one question
  question_kind    TEXT,                        -- 'money' | 'approve' | 'answer'; replies stay comments
  note             TEXT,                        -- one line shown on the card
  job_definition   TEXT,                        -- what this is, in plain words
  original_request TEXT,                        -- the user's own words
  due              TEXT,                        -- ISO date, optional
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  result_summary   TEXT,                        -- verified result, shown on completion
  verification     TEXT,                        -- what was checked and observed
  result_url       TEXT,                        -- openable result, when applicable
  done_at          TEXT
);
CREATE INDEX IF NOT EXISTS tasks_project ON tasks(project);
CREATE INDEX IF NOT EXISTS tasks_column ON tasks(column_name);

CREATE TABLE IF NOT EXISTS task_checks (                -- optional legacy completion notes
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  task     TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  text     TEXT NOT NULL,
  met      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS task_plan (                  -- optional legacy plan notes
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  task     TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  text     TEXT NOT NULL,
  state    TEXT NOT NULL DEFAULT 'later'        -- 'done' | 'now' | 'later'
);

CREATE TABLE IF NOT EXISTS task_files (                 -- "Files from this task"
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  task     TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,                       -- 'Acme workshop proposal, draft (PDF)'
  url      TEXT,                                -- where the user can open it
  added_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS task_updates (               -- the conversation on a task's page
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  task            TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author          TEXT NOT NULL,                -- member slug, or 'you'
  kind            TEXT NOT NULL,                -- 'event' | 'update' | 'question' | 'comment' | 'reply'
  body            TEXT NOT NULL,
  files_json      TEXT NOT NULL DEFAULT '[]',   -- [{"name": "...", "url": "..."}]
  reply_to        INTEGER REFERENCES task_updates(id),
  unread_by_agent INTEGER NOT NULL DEFAULT 0,   -- 1 on anything the user wrote until the agent reads it
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS task_updates_task ON task_updates(task, id);
CREATE INDEX IF NOT EXISTS task_updates_unread ON task_updates(unread_by_agent);

-- ----------------------------------------------------------- Customers
CREATE TABLE IF NOT EXISTS contacts (
  slug                TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  company             TEXT,
  title               TEXT,                     -- their role at the company
  stage               TEXT NOT NULL DEFAULT 'lead',   -- 'lead' | 'talking' | 'proposal' | 'customer' | 'past'
  in_funnel           INTEGER NOT NULL DEFAULT 1,    -- 0 for someone kept here without selling to them (the person, the maker of the hat): no stage shown, not counted anywhere
  source              TEXT,                     -- where they came from: 'website inquiry', 'referral', ...
  next_step           TEXT,
  next_due            TEXT,                     -- ISO date
  next_waiting_on_you INTEGER NOT NULL DEFAULT 0,
  notes_json          TEXT NOT NULL DEFAULT '[]',     -- ["Prefers email.", "Decides by end of October."]
  value_cents         INTEGER,                  -- what they are worth this year, if known
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS touches (                    -- the timeline on a person
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  contact     TEXT NOT NULL REFERENCES contacts(slug) ON DELETE CASCADE,
  channel     TEXT NOT NULL,                    -- 'email' | 'call' | 'meeting' | 'message' | 'website' | 'invoice' | 'note'
  summary     TEXT NOT NULL,
  by          TEXT,                             -- member slug or 'you'
  task        TEXT REFERENCES tasks(id),        -- linked task, if any
  happened_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS touches_contact ON touches(contact, happened_at);

CREATE TABLE IF NOT EXISTS stage_changes (              -- feeds the funnel's "+3 this month"
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  contact    TEXT NOT NULL REFERENCES contacts(slug) ON DELETE CASCADE,
  stage      TEXT NOT NULL,
  changed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ------------------------------------------------------------- Reports
CREATE TABLE IF NOT EXISTS reports (
  slug        TEXT PRIMARY KEY,                 -- 'website', 'new-customers', 'owed', 'in-out', 'spending', 'bills', 'subscriptions', 'savings'
  section     TEXT NOT NULL,                    -- 'Your business' | 'Your money'
  title       TEXT NOT NULL,
  description TEXT,                             -- one line: what it measures
  chart       TEXT NOT NULL,                    -- 'bars' | 'timeline' | 'donut' | 'stacked-bars' | 'grouped-bars' | 'list' | 'bars-horizontal' | 'savings'
  owner       TEXT REFERENCES members(slug),    -- who keeps it fresh
  source      TEXT,                             -- 'from receipts and card alerts in your email'
  source_url  TEXT,                             -- https citation for a published data source
  sort_order  INTEGER NOT NULL DEFAULT 0,
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS metrics (                    -- every number on the Reports page
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  report      TEXT NOT NULL REFERENCES reports(slug) ON DELETE CASCADE,
  series      TEXT,                             -- 'visitors' | 'inquiries' | a spending category | 'in' | 'out' | ...
  label       TEXT NOT NULL,                    -- a week start (ISO date), a month, a bill name, a client, ...
  value       REAL NOT NULL,                    -- dollars for money, counts for people
  note_json   TEXT NOT NULL DEFAULT '{}',       -- extra fields per chart, e.g. {"due":"2026-09-30","how":"waiting_on_you"}
  recorded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS metrics_report ON metrics(report, series, label);

-- --------------------------------------------------------------- Notes
CREATE TABLE IF NOT EXISTS notes (
  slug              TEXT PRIMARY KEY,
  project           TEXT REFERENCES projects(slug),
  title             TEXT NOT NULL,
  lede              TEXT,                       -- one line under the title
  markdown          TEXT NOT NULL,
  kept_by           TEXT REFERENCES members(slug),
  linked_tasks_json TEXT NOT NULL DEFAULT '[]', -- ["acme-proposal", ...]
  tags_json         TEXT NOT NULL DEFAULT '[]', -- ["brand", "colors", "decision"]: topics and keywords, lowercase, for finding it later
  pinned            INTEGER NOT NULL DEFAULT 0, -- 1 for "Start here"
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS note_comments (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  note            TEXT NOT NULL REFERENCES notes(slug) ON DELETE CASCADE,
  author          TEXT NOT NULL,                -- member slug, or 'you'
  body            TEXT NOT NULL,
  reply_to        INTEGER REFERENCES note_comments(id),
  unread_by_agent INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS note_comments_note ON note_comments(note, id);
CREATE INDEX IF NOT EXISTS note_comments_unread ON note_comments(unread_by_agent, id);

-- ------------------------------------------------------------ Settings
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,                       -- 'office_name', 'user_name', 'last_agent_visit', 'hat_version'
  value TEXT
);
-- Project direction is routed to its lead through the same typed comment feed.
CREATE TABLE IF NOT EXISTS project_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project TEXT NOT NULL REFERENCES projects(slug) ON DELETE CASCADE,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  reply_to INTEGER REFERENCES project_comments(id) ON DELETE SET NULL,
  unread_by_agent INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS project_comments_page ON project_comments(project, id);
CREATE TABLE IF NOT EXISTS screenshots (
  id TEXT PRIMARY KEY,
  task TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  mime TEXT NOT NULL,
  data BLOB NOT NULL
);

-- Durable Office-wide activity, written atomically with every supported mutation.
-- IDs are monotonic even after deletion; checkpoints never depend on timestamps.
-- No foreign keys: history survives removal of its target.
CREATE TABLE IF NOT EXISTS office_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_title TEXT NOT NULL,
  owner TEXT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  changes_json TEXT NOT NULL DEFAULT '{}',
  comment_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
