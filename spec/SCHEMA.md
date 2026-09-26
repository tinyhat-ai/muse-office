# The Office database

The whole Office is one small SQLite database. `db/schema.sql` is the source of truth; this page explains it in plain words so a Muse can rebuild it in its own app.

Every page reads from these tables. Nothing on a page is stored anywhere else, so if the tables are right, the pages can be rebuilt from them.

## What lives where

| Page | Reads from |
| --- | --- |
| Tasks (the board) | `projects`, `tasks`, `members` |
| A project's page | `projects`, `process_steps`, `project_rules`, `tasks` |
| A task's page | `tasks`, `task_checks`, `task_plan`, `task_files`, `task_updates`, `members` |
| Team | `members`, `tasks` (for "working on" and "latest") |
| Customers | `contacts`, `touches`, `stage_changes` |
| Reports | `reports`, `metrics`, plus `contacts`/`stage_changes` for the funnel numbers |
| Notes | `notes`, `tasks` (for "came from these tasks"), `note_comments` |

## Tables, one line each

- **members** — the chief of staff and each specialist: name, role, hat, one-line job, three "does" bullets, one "never", skills, the last rule learned. `is_chief = 1` marks the Muse itself.
- **projects** — a project: name, colour (a pastel fill and a darker shade), who leads it, how it runs (`kind`), the process written out (`process_markdown`), and what "done" means.
- **process_steps** — the steps of a project, in order: name, who does it (`who` is a member slug, `you`, or `any`), a one-line note, and whether the user's OK is part of it.
- **project_rules** — rules the project learned from the user, each dated, with `origin = you` (the user said it) or `ok` (the agent suggested it, the user agreed).
- **tasks** — a task: which project, title, which specialist, which column (`todo`, `in_progress`, `waiting_on_you`, `done`), which process step it is on, the one question when it waits on the user, a one-line note for the card, the job definition, the user's original words, an optional due date.
- **task_checks** — the task's "Done when" checklist.
- **task_plan** — the task's plan, one row per step, each `done`, `now`, or `later`.
- **task_files** — the files the task produced, with a URL the user can open.
- **task_updates** — the conversation on the task's page: events, updates, questions, the user's comments, and replies. `unread_by_agent = 1` on anything the user wrote until the Muse reads it.
- **contacts** — the people who matter: name, company, stage (`lead`, `talking`, `proposal`, `customer`, `past`), source, next step and its date, notes, value.
- **touches** — the timeline on a person: channel, summary, who, when.
- **stage_changes** — when a person moved to a stage; the funnel's "+3 this month" counts these.
- **reports** — one row per report card: section, title, chart type, who keeps it, where the numbers come from.
- **metrics** — every number on the Reports page: `report`, `series`, `label`, `value`, plus a JSON note for chart-specific fields.
- **notes** — the Notes page: title, lede, markdown, who keeps it, which tasks it came from, and `pinned = 1` for "Start here".
- **note_comments** — user comments and owner replies on a note, with `reply_to` and `unread_by_agent` so the chief can follow them up.
- **settings** — a few key/value pairs: the office name, the user's name, the hat version, when the Muse last checked in.

## Rules the Muse must keep

- Columns are exactly `todo`, `in_progress`, `waiting_on_you`, `done`. The pages show them as "To do", "In progress", "Waiting on you", "Done".
- Moving a task to `waiting_on_you` requires a `question`. Moving it anywhere else clears the question.
- A task belongs to exactly one project. A task update belongs to one task; a note comment belongs to one note.
- A project's non-null `archived_at` pauses its open tasks without changing their saved status or deleting history. Task actions return `project_archived_at`; active summaries exclude archived projects. Restoring clears the timestamp.
- Stages are exactly `lead`, `talking`, `proposal`, `customer`, `past`. Changing a stage adds a `stage_changes` row.
- Times are ISO 8601 in UTC. The pages render them as "2 hours ago" or "Sep 24".
- The agent writes only through the actions in `spec/ACTIONS.md`. The user can manage projects and comment on a task, project, or note page. The app stores user comments in `task_updates`, `project_comments`, or `note_comments` with `author = 'you'` and `unread_by_agent = 1`; `list_recent_updates` pages through all three kinds.

## How the reports use `metrics`

| Report | `series` | `label` | `value` | `note_json` |
| --- | --- | --- | --- | --- |
| `website` | `visitors` or `inquiries` | week start, ISO date | count | — |
| `in-out` | `in` or `out` | month, `YYYY-MM` | dollars | — |
| `spending` | a category name | week start, ISO date | dollars | — |
| `owed` | client name | invoice label | dollars | `{"due": "2026-09-29", "sent": "2026-08-30"}` |
| `bills` | — | bill name | dollars | `{"due": "2026-09-30", "how": "autopay_bank" or "autopay_card" or "waiting_on_you"}` |
| `subscriptions` | — | subscription name | dollars a month | `{"unused": true, "why": "no booking email since Aug 8"}` |
| `savings` | who found it (member slug) | what was saved, in words | dollars | `{"state": "saved" or "waiting", "task": "task-id", "monthly": true}` |

`new-customers` has no metrics: the page counts `stage_changes` per month (new leads, new customers) and sums `contacts.value_cents` for customers won this month.

For the first visit, put four published examples in an **Around the world** section before the person's business cards. They use ordinary `reports` and `metrics` rows, with an HTTPS `reports.source_url` and a dated description. The examples use bars, a timeline, and a donut for world population (UN 2024 revision), women athletes at the Paris Olympic Games (Paris 2024 report), global recorded-music revenue (IFPI), and Earth's ocean/land share (NASA). These figures are public context, never the person's business results. See `spec/STARTER.md` for the exact values and links. Do not invent the person's visitors, income, leads, or customers to fill a chart.

## Notes carry tags

`notes.tags_json` is a JSON array of short lowercase strings: the topics a note belongs to and the words someone would search for (`["brand", "colors", "decision"]`, at most 12). The Notes page shows them as chips and filters by one tag; `list_notes` searches them. A note's body may hold a small inline SVG (a timeline, a flow, a comparison) next to tables and lists; the page keeps it and strips anything that runs or links out.

## People outside the funnel

`contacts.in_funnel` is 1 for everyone in the funnel and 0 for someone kept on the page without being sold to: the person themselves, the maker of the hat, a partner. Such a contact shows the pill "Contact" instead of a stage, gets no `stage_changes` row, and is counted nowhere: not in the funnel blocks, not in the new-customers report. `set_stage` (or `upsert_contact` with a stage, or `in_funnel: true`, which enters them as a lead when no stage is named) moves them into the funnel, and that entry is their first recorded change. Moving someone with sales history outside the funnel removes that history: the flag says it was never sales, and the funnel and the reports only ever count people with `in_funnel = 1`. There is no email column; an email goes in `notes`.

## Project comments, completion evidence, and screenshots

`project_comments` has the same author/body/reply/unread fields as note comments,
with a `project` foreign key. Its owner is the project lead (chief if unset).
Treat comment identifiers as `(source, target_id, id)` across all three tables.
`tasks.result_summary`, `verification`, and `result_url` hold the current verified
completion. Reopening clears them and `done_at`, and resets checks; the completion
update remains in task history. The reference app adds these nullable columns
when opening an existing database, without replacing personal data.
`screenshots` stores task-scoped, size-limited raster image bytes under random ids.
Keep equivalent artifact-platform storage private to the same Office user.

## Projects, tasks, and progress

A project groups related tasks (Website, Personal, School). A task is a concrete
piece of work, such as launching a landing page. Status lists contain task cards.
The Tasks tab keeps `/projects` as its route for existing links. Sample project
names are editable; no fixed project taxonomy is required.

`projects.archived_at` is nullable: an ISO timestamp hides the project and its
tasks from the active board. Restore clears it. Every task, note, file, conversation,
and process remains intact. `list_projects` includes archived rows for management;
filter `archived_at == null` for active selectors. New tasks require an active project.

Progress is derived, never independently writable:

| Record | Durable source | Read contract |
| --- | --- | --- |
| Task | `task_checks.text`, `position`, `met`; `tasks.column_name` | `progress: {basis: "done_when", met, total, percent}`; percent is rounded `100 * met / total`, or null with no criteria. |
| Project | All tasks referencing `tasks.project` | `progress: {done, total, percent, waiting, column, question, nextDue}`; percent is rounded `100 * done / total`, or 0 when empty. |

SQL views `task_progress` and `project_progress` expose the same counts/percentages
(the project view calls status `column_name`). UI and action responses use the
same calculation. Search and owner filters never change progress denominators.
Task progress measures verified criteria, not time spent. 100% criteria does not
bypass result verification or unread-feedback checks. Project 100% means its
current tasks are complete; an ongoing project can receive more work later.

## Unified Office updates

`office_updates` records every supported successful mutation atomically with the
change, including project creation/rename/archive/restore, task/status/owner/
checklist/result/file changes, team/avatar, contacts/touches, reports/metrics,
notes, comments, replies, and settings. It stores monotonic `id`, typed `source`
and `target_id`, `target_title`, `owner`, `actor` (`you` or `agent`), `action`,
`changes_json`, optional `comment_id`, and `created_at`. No foreign key removes
history when a target is deleted. Screenshot bytes stay in private storage;
its comment reference identifies the attachment. Changes use action fields;
read the target for its current state. Direct SQL edits bypass this contract.

The feed starts when installed; old unread comments remain in their original
queue. Read calls, `mark_comments_read`, and `last_agent_visit` stamps create no
feed events. Polling must not generate more polling work.
