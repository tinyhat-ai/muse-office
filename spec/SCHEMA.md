# The Office database

The whole Office is one small SQLite database. `db/schema.sql` is the source of truth; this page explains it in plain words so a Muse can rebuild it in its own app.

Every page reads from these tables. Nothing on a page is stored anywhere else, so if the tables are right, the pages can be rebuilt from them.

## What lives where

| Page | Reads from |
| --- | --- |
| Projects (the board) | `projects`, `tasks`, `members` |
| A project's page | `projects`, `process_steps`, `project_rules`, `tasks` |
| A task's page | `tasks`, `task_checks`, `task_plan`, `task_files`, `task_updates`, `members` |
| Team | `members`, `tasks` (for "working on" and "latest") |
| Customers | `contacts`, `touches`, `stage_changes` |
| Reports | `reports`, `metrics`, plus `contacts`/`stage_changes` for the funnel numbers |
| Notes | `notes`, `tasks` (for "came from these tasks") |

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
- **settings** — a few key/value pairs: the office name, the user's name, the hat version, when the Muse last checked in.

## Rules the Muse must keep

- Columns are exactly `todo`, `in_progress`, `waiting_on_you`, `done`. The pages show them as "To do", "In progress", "Waiting on you", "Done".
- Moving a task to `waiting_on_you` requires a `question`. Moving it anywhere else clears the question.
- A task belongs to exactly one project. A note, a file, or an update belongs to exactly one task or project.
- Stages are exactly `lead`, `talking`, `proposal`, `customer`, `past`. Changing a stage adds a `stage_changes` row.
- Times are ISO 8601 in UTC. The pages render them as "2 hours ago" or "Sep 24".
- The agent writes only through the actions in `spec/ACTIONS.md`. The one thing the user writes is a comment or reply on a task's page, which the app stores as a `task_updates` row with `author = 'you'` and `unread_by_agent = 1`.

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

## Notes carry tags

`notes.tags_json` is a JSON array of short lowercase strings: the topics a note belongs to and the words someone would search for (`["brand", "colors", "decision"]`, at most 12). The Notes page shows them as chips and filters by one tag; `list_notes` searches them. A note's body may hold a small inline SVG (a timeline, a flow, a comparison) next to tables and lists; the page keeps it and strips anything that runs or links out.

## People outside the funnel

A contact with stage `past` is shown in the people table but counted nowhere: not in the funnel blocks, not in the new-customers report, which counts only `lead` and `customer` changes in `stage_changes`. Use `past` for the person themselves and for the maker of the hat, so that the page is never empty without the numbers lying. There is no email column; an email goes in `notes`.
