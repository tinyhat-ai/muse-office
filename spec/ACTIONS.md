# Actions: how the Muse changes the Office

The user normally tells Muse, and Muse changes the Office through these actions. On task, note and project pages the user can comment and reply. Muse checks the ordered, paginated `list_recent_updates` feed on a schedule.

In the reference app each action is an HTTP call: `POST /api/actions/<name>` with a JSON body, returning `{ "ok": true, "data": ... }` or `{ "ok": false, "error": "..." }`. `GET /api/actions` lists every action with its arguments. When the Muse builds the Office as an artifact, it publishes these same names as the artifact's actions, with the same arguments.

Names are `snake_case`. Slugs are short, lowercase, `kebab-case`. Dates are ISO 8601. Money is in dollars as a number. Text fields that render as Markdown (`job_definition`, `markdown` on notes and processes) are sanitized before they reach a page: no scripts, event handlers, or `javascript:` links survive, so pasting text from a page or an email is safe.

## Team

| Action | Arguments | What it does |
| --- | --- | --- |
| `upsert_member` | `slug`, `name`, `role`, `hat?`, `job`, `avatar_url?`, `color?`, `does?: string[]`, `never?`, `skills?: string[]`, `is_chief?` | Adds or updates one card on the Team page. |
| `set_member_avatar` | `slug`, `avatar_url` | Changes any existing member's portrait, including the chief, and returns the stored member row, including `avatar_url`. Use the chief's actual Muse avatar image or Office asset URL, not the bundled sample. |
| `set_member_rule` | `slug`, `rule` | Sets the "last rule learned" shown in the specialist's detail. |
| `remove_member` | `slug` | Removes a specialist. Refused while they have open tasks, and refused for the chief. Their finished work stays; it is unlinked from them. Never called without the user's yes. |

The chief's portrait comes from that Muse's own avatar, with its recognizable face preserved under the small hat. Use `set_member_avatar` to put that image on the Team card; the bundled sample image is only for this repository's standalone preview. For a new specialist, `avatar_url` holds a real, specialty-relevant face or mascot image in the same illustration style and crop as the chief. `hat` is only a wearable accessory; writing an animal name there does not create its image. Verify the image loads on Team, in the desktop detail panel, and on a task card before reporting setup complete. If an image cannot yet be made or the chief's image cannot be accessed, leave an avatar task open and say which portrait still uses initials.

Both avatar actions accept an HTTPS image URL or an Office asset path beginning with `/`. They reject local paths such as `/Users/...`, `file://...`, `~/...`, and relative paths that a visitor cannot open. To clear a portrait, pass an empty `avatar_url` to `upsert_member`; `set_member_avatar` requires a nonempty URL.

For a generated Office, import portraits into durable private app assets;
do not persist an expiring platform preview URL. A compact copy of the approved
image may be used to meet upload limits. Every avatar
renderer reads `members.avatar_url` and uses the platform's private asset
reader when needed; sample portraits keyed by slug must not override it.
An action success only proves the field was written. Check that the returned
stored member's `avatar_url` equals the imported durable asset path or URL, then
reopen the actual pages to verify a decoded image with the approved face before
calling the portrait installed or closing its setup task. Keep existing member
identity, role, skills and task ownership intact during an avatar change.

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
| `create_task` | `project`, `title`, `specialist?`, `id?`, `column?`, `step?`, `job_definition?`, `original_request?`, `done_when?: string[]`, `plan?: string[]`, `due?`, `note?`, `overview?`, `overview_html?` | Creates the task and its page (`column` may be `todo`, `in_progress`, or `done`; to wait on the user, create it and then `move_task` with a question). Adds the event "Made this task". Returns the task id. |
| `update_task` | `id`, then any of `title`, `specialist`, `step`, `note`, `overview`, `overview_html`, `job_definition`, `original_request`, `due`, `done_when: [{text, met}]`, `plan: [{text, state}]` | Updates the current snapshot or description. Supplied fields replace their previous values; omitted fields stay unchanged. `overview` and `overview_html` accept null to clear. Read `get_task` first to preserve existing checks and their `met` states and plan steps with their `state`. `plan` states are `done`, `now`, `later`. |
| `move_task` | `id`, `column`, `question?`, `question_kind?` | Moves the card and adds a small event. `waiting_on_you` requires `question` (one clear question) and takes `question_kind`: `money` (the page shows "Yes, pay …" / "Not yet"), `approve`, or `answer` (the default). The move also posts the question on the task's page (a `question` update by the specialist) and returns its id as `question_update_id`; the page pins that row, and the user's answer is a reply to it. Moving out of `waiting_on_you` clears the question. Moving to `done` sets `done_at`; moving out of `done` clears it. |
| `add_task_note` | `id`, `author`, `kind: "update" or "question" or "event"`, `body`, `files?: [{name, url}]` | Posts to Updates on the task's page. `author` is a member slug. Files also appear under "Files from this task". Posting the task's current question again as a `question` note returns the row `move_task` already posted instead of adding a second one. The last `update` before a task moves to `done` is its closing report: what was done, the result, the files, what was learned. |
| `attach_file` | `id`, `name`, `url` | Adds a file to "Files from this task". The URL must open for the user (a file artifact link, or a file stored in the app), never a path on the Muse's computer. |
| `get_task` | `id` | Everything on the task's page. |
| `list_tasks` | `project?`, `column?`, `specialist?` | Cards, with title, column, specialist, step, question, note, overview, due, updated_at. Visual HTML is omitted; use `get_task` when needed. |

`note` is the brief plain-text card summary. `overview` is the current snapshot
for the person, separate from the original description and detailed worker log:
what has happened, what comes next and any decision needed. It supports sanitized
Markdown, Mermaid and SVG. `overview_html` optionally adds a self-contained HTML
visual using inline styles/scripts in an iframe sandbox without same-origin
access; block remote resources and API fetches with CSP. Every Office page
also enforces `frame-src 'none'` so the visual cannot navigate to an external
document. Keep the plain-language
explanation in `overview`. The chief reviews both for clarity and freshness at
meaningful milestones with `update_task`, together with verified `done_when`
states when needed. Read `get_task` first to retain existing checks and their
states. Small tasks may omit visuals, checklist and plan; omit empty sections.
Full agent history remains stored under Updates, closed by default.

## Comments and updates

| Action | Arguments | What it does |
| --- | --- | --- |
| `get_comment_attachment` | `url`, `offset?`, `max_bytes?` | Bounded private file bytes for agents unable to fetch the URL. Returns `name`, `type`, `size`, `offset`, `data_base64`, `next_offset`. |
| `list_recent_updates` | `limit?`, `cursor?`, `unread_only?` | Newest task updates and note/project comments, with target, page title/link, owner, reply context, files, and unread status. Returns `updates` and `next_cursor`; follow pages until null. `unread_only: true` finds comments needing action. |
| `list_new_comments` | — | Every comment or reply the user wrote that the Muse has not read yet, with its task and, if it is a reply, the update it answers. |
| `reply_to_comment` | `source: "task" \| "note" \| "project"`, `target_id`, `comment_id`, `author`, `body` | Answers a user comment on its task, note or project page and marks it read. Copy `source`, `target_id`, and `id` from one feed item. |
| `mark_comments_read` | `source: "task" \| "note" \| "project"`, `target_id`, `ids: number[]` | Marks handled comments on one task, note or project read. Every id must belong to that page. |

Each open task has an owner (`specialist`, then project lead, then chief). Its owner checks comments until it is closed. A note's `kept_by` member owns its comments, or the chief when unset. The project lead owns project comments, with the chief as fallback. The chief's recurring check follows `hat/skills/follow-through/SKILL.md`: every minute when supported, or an agreed supported interval such as five minutes. It pages through unread updates and checks unfinished `list_tasks` even after comments are read. Before `reply_to_comment` marks an unfinished request read, record its next action and owner on an open task. Acknowledging or delegating is not completion; verify the actual result before Done. Comments on completed tasks still appear and need triage.

Treat an update's identity as `(source, target_id, id)`, never the integer id alone. The same reply and read actions handle all three kinds of page; they choose the table from `source` and verify that the id belongs to `target_id`. Copy all three fields from the same `list_recent_updates` item. Do not infer `source` from an action name or retry with a different value to bypass a page mismatch. Replace any old scheduled job that calls `list_new_comments` with `list_recent_updates`; the old list contains task comments only.

When a user answers a `money` question with the "Yes, pay …" button, the app stores a reply with body `yes` whose `reply_to` is the question's update row (the one `move_task` posted). `list_recent_updates` returns that id and `replying_to_body`; the old `list_new_comments` action returns a `replying_to` object. The Muse treats that reply as the user's OK **for that question only**. A bare "yes" typed as a comment on a task that waits on a money question is refused by the app, so an approval is never stored without the question it answers.

The same check also runs the hourly review in
`hat/skills/follow-through/SKILL.md`: reconcile board snapshots, relevant
report figures/source dates, and recent notes/handled updates even when there
are no unread comments. The current feed is a paginated read, not a long-poll
subscription. A listener requires a supported private endpoint and a tested
agent-wake path; retain scheduled handling until both are proven.

### Build and test the updates feed

Return actual saved records, not a summary of filenames or a task-only list.
Every item includes `source`, `target_id`, `id`, `target_title`, `url`, `owner`,
`author`, `kind`, `body`, `created_at`, `unread_by_agent`, `reply_to`,
`replying_to_body`, and `files: [{name, url, type?, size?}]`. User uploads
include their actual media type and byte size; an agent's output link may
have only its name and URL. `url` is this Office's page path. `owner` is the
task owner, note keeper, or project lead, falling back to the chief. Parent
context must belong to this typed page; non-replies have null parent fields.
When an excerpt is insufficient, read the full parent and its files with
`get_task` or `get_note`. Projects have no read action: page
`list_recent_updates` without `unread_only` to the item with the same `source`
and `target_id` whose `id` equals `reply_to`.

Use a deterministic newest-first total order with a typed-identity tie-breaker.
The opaque cursor resumes after the last item, not after a numeric offset
into a changing unread list. Marking a page's comments read must not skip
later pages. Newer arrivals are handled by the next sweep. Reads never change
unread state; only a handled reply/read action does that. The worker copies
the typed identity verbatim for all replies and checkpoints.

During setup, post clearly labeled test comments on a task, note, and project,
including replies and a media-only comment. Audit with `limit: 2` through
`next_cursor: null`, checking all fields, newest-first order, and unique typed
keys. Then test unread pagination while replying to the first page: the older
unread test comments must still be returned. Reply only to test comments and
leave any real comment unread. Include a task/note id collision
where possible; a reply/read with a mismatched page must fail. Record the
actual responses, not only that the action is declared in the catalog.

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

Send `upsert_note.markdown` as a string with real line breaks. JSON encoding
escapes these on the wire; encode once and let the action's JSON parser decode
once. Do not pre-escape the string into visible backslash-n sequences, or
blindly replace literal backslash-n text in code examples. When editing,
read `get_note` first, preserve the slug/title/keeper/project/tags/task links
unless the request changes them, and update the same note. Verify the saved
body and its rendered page; neither a reply nor a correct seed note proves
the newly written heading, table, or Mermaid diagram renders.

## The whole office

| Action | Arguments | What it does |
| --- | --- | --- |
| `summary` | — | Counts the Muse checks on every visit: tasks waiting on the user, unread comments, follow-ups due this week, bills waiting on the user. |
| `set_setting` | `key`, `value` | `office_name`, `user_name`, `hat_version`, `last_agent_visit`. |

## Errors

Every action answers `{ "ok": false, "error": "…" }` with HTTP 400 for a bad argument, 404 for a row that does not exist (or an unknown action), and 500 for anything else. Every action checks its arguments and refuses clearly: an unknown project, a task that does not exist, a column that is not one of the four, a stage that is not one of the five, a move to `waiting_on_you` without a question. The error text says what was wrong and what the valid values are, so the Muse can correct itself without asking the user.

## Comment attachments

`POST /api/comments` accepts existing JSON text comments or multipart fields
`task`, `note`, or `project` (exactly one), `body`, optional `reply_to`, and up to
five `files`. A comment may contain files without text. The reference app limits
each file to 10 MB and the combined files to 20 MB. It accepts raster images,
audio, PDF, and text; body Markdown is sanitized for display. Binary data and
comment records save in one transaction in the private Office database.

`list_recent_updates` includes `files: [{name, url, type, size}]` alongside each
comment. Resolve relative URLs against this Office's own origin. Read the files
before acting. `get_note` also returns its comments and files; `get_task` already
includes its updates and files. Image/audio URLs support private download and
audio byte ranges. The legacy `list_new_comments` action remains task-only; use
`list_recent_updates` for all contextual feedback.

When the agent cannot fetch a private attachment URL, call
`get_comment_attachment` with that exact local URL. Decode each `data_base64`
chunk to bytes and append at its returned `offset`; follow `next_offset` until
null, checking the final size before using image/audio tools on the file.
Chunks default to 16 KiB and are capped at 64 KiB to fit action responses. Prefer
the host's supported private file download/inspection tools when available.
A generated artifact must expose an equivalent usable attachment action or
private download, not metadata alone. Never publish the file to make it readable.

### Implement and verify private byte access

The action must read the file from the app's saved private attachment storage,
not return an upload receipt, metadata, or bytes from an expired preview link.
Validate the exact attachment URL against this Office's own saved records;
never fetch an arbitrary URL supplied to the action. Return this bounded shape:

```json
{"ok":true,"data":{"name":"sample.wav","type":"audio/wav","size":40000,"offset":0,"data_base64":"<base64 of this chunk only>","next_offset":16384}}
```

Start at offset zero. Decode each chunk separately and append its bytes, not
its base64 text. Require the returned offset to equal the requested offset,
consistent file size/type, and a positive chunk length until the end. A
non-null `next_offset` must equal offset plus decoded length and advance
without passing size. At null, the assembled byte count must equal size.
Reject malformed/truncated data rather than treating it as inspected media.
Keep default 16 KiB/max 64 KiB chunks and the existing file-size limits.

Before hand-over, retrieve an uploaded image and a known short spoken file
through the same actions or private download available to the scheduled worker. Compare their
complete bytes or hash with the originals, inspect the image, and transcribe
the audio using native tools or an approved private local tool. Playback or a
filename is not transcription. Save the original and transcript privately;
perform the spoken test edit on a clearly labeled test note, or in an isolated
test Office, and re-read it; never change the person's own notes as a test.
If no private inspection/transcription path works, leave that work open and report the
specific blocker once; do not silently upload media elsewhere or ask the
person to repeat a request you have not tried to decode.
