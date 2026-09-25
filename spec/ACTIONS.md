# Actions: how the Muse changes the Office

The user never fills in a form. They tell their Muse, and the Muse changes the Office through these actions. Every page is view-only except one place: on a task's page the user can comment or reply, and the Muse reads that through `list_new_comments`.

In the reference app each action is an HTTP call: `POST /api/actions/<name>` with a JSON body, returning `{ "ok": true, "data": ... }` or `{ "ok": false, "error": "..." }`. `GET /api/actions` lists every action with its arguments. When the Muse builds the Office as an artifact, it publishes these same names as the artifact's actions, with the same arguments.

Names are `snake_case`. Slugs are short, lowercase, `kebab-case`. Dates are ISO 8601. Money is in dollars as a number. Text fields that render as Markdown (`job_definition`, `markdown` on notes and processes) are sanitized before they reach a page: no scripts, event handlers, or `javascript:` links survive, so pasting text from a page or an email is safe.

## Team

| Action | Arguments | What it does |
| --- | --- | --- |
| `upsert_member` | `slug`, `name`, `role`, `hat?`, `job`, `avatar_url?`, `color?`, `does?: string[]`, `never?`, `skills?: string[]`, `is_chief?` | Adds or updates one card on the Team page. |
| `set_member_rule` | `slug`, `rule` | Sets the "last rule learned" shown in the specialist's detail. |
| `remove_member` | `slug` | Removes a specialist. Refused while they have open tasks, and refused for the chief. Their finished work stays; it is unlinked from them. Never called without the user's yes. |

The Team page works out each specialist's status ("working on", "next", "waiting on you") and their latest finished work from `tasks`; there is no action for those.

## Projects

| Action | Arguments | What it does |
| --- | --- | --- |
| `upsert_project` | `slug`, `name`, `description?`, `color?`, `color_dark?`, `lead?`, `kind?`, `done_when?` | Adds or updates a project tile and its page header. Colours default to the next free pastel. |
| `set_process` | `project`, `steps: [{name, who, note?, needs_you?}]`, `markdown` | Replaces the project's steps (the diagram) and the process text (rendered as markdown on the project's page). |
| `add_rule` | `project`, `text`, `origin?: "you" or "ok"` | Adds a dated line under "Rules learned". |
| `list_projects` | — | Every project with its open and waiting counts. |

## Tasks

| Action | Arguments | What it does |
| --- | --- | --- |
| `create_task` | `project`, `title`, `specialist?`, `id?`, `column?`, `step?`, `job_definition?`, `original_request?`, `done_when?: string[]`, `plan?: string[]`, `due?`, `note?` | Creates the task and its page (`column` may be `todo`, `in_progress`, or `done`; to wait on the user, create it and then `move_task` with a question). Adds the event "Made this task". Returns the task id. |
| `update_task` | `id`, then any of `title`, `specialist`, `step`, `note`, `job_definition`, `original_request`, `due`, `done_when: [{text, met}]`, `plan: [{text, state}]` | Changes the description parts of the task's page. `plan` states are `done`, `now`, `later`. |
| `move_task` | `id`, `column`, `question?`, `question_kind?` | Moves the card and adds a small event. `waiting_on_you` requires `question` (one clear question) and takes `question_kind`: `money` (the page shows "Yes, pay …" / "Not yet"), `approve`, or `answer` (the default). The move also posts the question on the task's page (a `question` update by the specialist) and returns its id as `question_update_id`; the page pins that row, and the user's answer is a reply to it. Moving out of `waiting_on_you` clears the question. Moving to `done` sets `done_at`; moving out of `done` clears it. |
| `add_task_note` | `id`, `author`, `kind: "update" or "question" or "event"`, `body`, `files?: [{name, url}]` | Posts to the conversation on the task's page. `author` is a member slug. Files also appear under "Files from this task". Posting the task's current question again as a `question` note returns the row `move_task` already posted instead of adding a second one. The last `update` before a task moves to `done` is its closing report: what was done, the result, the files, what was learned. |
| `attach_file` | `id`, `name`, `url` | Adds a file to "Files from this task". The URL must open for the user (a file artifact link, or a file stored in the app), never a path on the Muse's computer. |
| `get_task` | `id` | Everything on the task's page. |
| `list_tasks` | `project?`, `column?`, `specialist?` | Cards, with title, column, specialist, step, question, note, due, updated_at. |

## Comments (the one thing the user writes)

| Action | Arguments | What it does |
| --- | --- | --- |
| `list_new_comments` | — | Every comment or reply the user wrote that the Muse has not read yet, with its task and, if it is a reply, the update it answers. |
| `reply_to_comment` | `comment_id`, `author`, `body` | Answers in the same thread. |
| `mark_comments_read` | `ids: number[]` | Clears `unread_by_agent`. |

When a user answers a `money` question with the "Yes, pay …" button, the app stores a reply with body `yes` whose `reply_to` is the question's update row (the one `move_task` posted); `list_new_comments` shows that question as `replying_to`. The Muse treats that reply as the user's OK **for that question only**. A bare "yes" typed as a comment on a task that waits on a money question is refused by the app, so an approval is never stored without the question it answers.

## Customers

| Action | Arguments | What it does |
| --- | --- | --- |
| `upsert_contact` | `slug`, `name`, `company?`, `title?`, `stage?`, `source?`, `notes?: string[]`, `value?`, `in_funnel?` | Adds or updates a person. A stage change is recorded for the funnel. `in_funnel: false` keeps someone on the page without selling to them (the person themselves, the maker of the hat): shown as "Contact", no stage, not counted anywhere. |
| `log_touch` | `contact`, `channel`, `summary`, `by?`, `task?`, `happened_at?` | Adds a line to the person's timeline and to "Lately". `channel` is one of `email`, `call`, `meeting`, `message`, `website`, `invoice`, `note`. |
| `set_next_step` | `contact`, `text`, `due?`, `waiting_on_you?` | Sets what happens next and when. |
| `set_stage` | `contact`, `stage` | Moves a person along the funnel. Someone kept outside the funnel (`in_funnel: false`) enters it with the first stage they are given. |
| `find_contacts` | `q?`, `stage?` | Search by name or company. |
| `list_followups` | `days?` (default 7) | Everyone with a next step due in the window, waiting-on-you first. |

## Reports

| Action | Arguments | What it does |
| --- | --- | --- |
| `upsert_report` | `slug`, `section`, `title`, `description?`, `chart`, `owner?`, `source?`, `source_url?` | Adds or updates a report card. `source_url` is an HTTPS link to published data. Charts: `bars`, `timeline` (year labels use calendar spacing), `donut` (parts of a whole), `stacked-bars`, `grouped-bars`, `list`, `bars-horizontal`, `savings`, `number`. |
| `record_metric` | `report`, `label`, `value`, `series?`, `note?: object`, `recorded_at?` | Adds or replaces one number (same report + series + label replaces; an omitted `note` keeps the old one). See `spec/SCHEMA.md` for what each report expects. |
| `clear_metrics` | `report`, `series?` | Removes numbers before a full refresh. |
| `list_reports` | — | Every report with its latest numbers. |

## Notes

Notes are where anything worth finding later goes: a decision, a how-to, a price list, a comparison, a lesson. Plain words, tags, a visual when it helps, and links to the tasks it came from, so that finding something never means searching chat.


| Action | Arguments | What it does |
| --- | --- | --- |
| `upsert_note` | `slug`, `title`, `markdown`, `project?`, `lede?`, `kept_by?`, `linked_tasks?: string[]`, `tags?: string[]`, `pinned?` | Adds or updates a note. One note per topic; update rather than add. `tags` are topics and search words (lowercase, up to 12). The body is GitHub-flavored Markdown: tables and fenced `mermaid` diagrams render as visuals. |
| `get_note` | `slug` | The note. |
| `list_notes` | `q?`, `project?`, `kept_by?`, `tag?` | Search (title, lede, body, tags) and filter, `tag` exact. |
| `remove_note` | `slug` | Removes a note. Never called without the user's yes. |

## The whole office

| Action | Arguments | What it does |
| --- | --- | --- |
| `summary` | — | Counts the Muse checks on every visit: tasks waiting on the user, unread comments, follow-ups due this week, bills waiting on the user. |
| `set_setting` | `key`, `value` | `office_name`, `user_name`, `hat_version`, `last_agent_visit`. |

## Errors

Every action answers `{ "ok": false, "error": "…" }` with HTTP 400 for a bad argument, 404 for a row that does not exist (or an unknown action), and 500 for anything else. Every action checks its arguments and refuses clearly: an unknown project, a task that does not exist, a column that is not one of the four, a stage that is not one of the five, a move to `waiting_on_you` without a question. The error text says what was wrong and what the valid values are, so the Muse can correct itself without asking the user.
