# The Office database

The whole Office is one small SQLite database. `db/schema.sql` is the source of truth; this page explains it in plain words so a Muse can rebuild it in its own app.

Every page reads from these tables. Nothing on a page is stored anywhere else, so if the tables are right, the pages can be rebuilt from them.

## What lives where

| Page | Reads from |
| --- | --- |
| Tasks (the board) | `projects`, `tasks`, `members` |
| A project's page | `projects`, `process_steps`, `project_rules`, `tasks`, `project_comments` |
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
- **tasks** — a task: which project, title, which specialist, which column (`todo`, `in_progress`, `waiting_on_you`, `done`), which process step it is on, the one question when it waits on the user, a brief current summary in `note` for the card and task overview, the stable job definition, the user's original words, an optional due date.
- **task_checks** — an optional "Done when" checklist; `met` records which outcomes have been verified. Muse maintains it as work advances; the user reads it.
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
- **project_comments** — comments and replies on a project, with its lead as owner, reply parent, unread state and attachment references.
- **comment_attachments** — private file bytes, name and media type, stored atomically with the comment.
- **settings** — a few key/value pairs: the office name, the user's name, the hat version, when the Muse last checked in.

## Rules the Muse must keep

- Columns are exactly `todo`, `in_progress`, `waiting_on_you`, `done`. The pages show them as "To do", "In progress", "Waiting on you", "Done".
- Moving a task to `waiting_on_you` requires a `question`. Moving it anywhere else clears the question.
- A task belongs to exactly one project. A task update belongs to one task; a note comment belongs to one note; a project comment belongs to one project.
- Stages are exactly `lead`, `talking`, `proposal`, `customer`, `past`. Changing a stage adds a `stage_changes` row.
- Times are ISO 8601 in UTC. The pages render them as "2 hours ago" or "Sep 24".
- The agent writes only through the actions in `spec/ACTIONS.md`. The user may comment on a task, note or project page. The app stores user comments in `task_updates`, `note_comments`, or `project_comments` with `author = 'you'` and `unread_by_agent = 1`; `list_recent_updates` pages through all three kinds.

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

## Contextual files

Task updates and note/project comments carry `files_json` references with name,
private URL, media type and byte size. `comment_attachments` stores the uploaded
bytes in the same database transaction as the comment. Existing note comments
receive an empty files array during migration. `project_comments` mirrors the
note comment shape with a project foreign key, reply parent and unread flag.
Typed `(source, target_id, id)` references keep numeric ids on different pages
distinct throughout pagination, owner replies and marking comments handled.
