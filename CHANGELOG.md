# Changelog

All notable changes to this repository are listed here. The version is the
one in `VERSION` and in the `version:` line of `hat/HAT.md`.

## 0.4.0 — 2026-09-29

- Fresh setup now checks the Office people actually see: Muse's own portrait
  with its hat, distinct specialist portraits, a readable task snapshot,
  branching Mermaid diagrams, and saved image and voice replies on tasks,
  notes, and projects. A failed recording shows a brief error instead of
  appearing to do nothing.
- Muse checks that its specialists really use their own briefing, skills, and
  memory, and that the scheduled Office review follows unfinished work through
  to a verified result. Setup explains what will happen, including permission
  requests, before asking for approval.
- Existing specialists can be updated one field at a time with `upsert_member`.
  Omitted fields, including a portrait or learned rule, remain unchanged.

### Updating an existing Office

Ask Muse to show its update plan, then refresh the chief's and specialists'
skills from this release without resetting the Office or replacing your
records and customizations. Update `upsert_member` so partial updates preserve
omitted fields while new members still require a name, role, and job. Use the
checks in `hat/HAT.md` to verify the real Office pages, saved attachments,
specialist files, and recurring follow-through before calling it updated.

## 0.3.0 — 2026-09-28

- Task pages lead with a brief, current overview, status and optional checks.
  Longer descriptions can be expanded. Detailed work stays under Updates,
  closed by default, while the comment box remains available.
- Task overviews can include diagrams or a small interactive visual. They
  stay separate from the Office's private data and fit the available space.
- Recording shows visible feedback, and draft and sent audio stay usable on
  phones. Muse's regular check can read the complete saved image or voice
  file, not just its name.
- Muse stores an approved portrait in the Office itself, not behind a preview
  link that can expire. A portrait too large to upload is resized, not
  redrawn, without asking again. New Markdown notes and Mermaid diagrams are
  checked in the actual Office.
- Muse shows its setup plan in the chat message before asking for approval.
- Simple jobs stay in chat. Work needing specialists or ongoing follow-up
  goes on the board, including work requested in the main chat. Blocked work
  uses the existing lanes according to its real next action.
- Once you have answered a question, on the page or in chat, Muse does not
  ask it again: the regular Office check finishes that work when its result
  is verified. It also reviews the board, relevant reports and recent notes
  once an hour, keeping their summaries accurate without rewriting unchanged
  records.

### Updating an existing Office

Ask Muse to review this release and show you its update plan before saving
the revised chief-of-staff rules and skills. Keep your existing records,
projects, team, portraits, customizations and recurring Office check.

This release adds optional `overview` and `overview_html` task fields and
extends `create_task`, `update_task` and `get_task` for them; `list_tasks`
returns `overview` without the HTML. Follow `spec/SCHEMA.md`,
`spec/ACTIONS.md`, `spec/PAGES.md` and `spec/DESIGN.md` from the
[v0.3.0 release](https://github.com/tinyhat-ai/muse-office/tree/v0.3.0).
Apply their generated-Office requirements for the shared comment box and
audio players, accumulating draft attachments, saved media and private file
access, the updates feed, notes, portraits, inline Team details and project
tiles.
The reference app adds the fields in place; a Muse-built Office needs its
own corresponding update. Do not reset or reseed it. After changing the app,
run the "Check that the Office is right" list in `hat/HAT.md` with labeled
test records or an isolated test Office.

Refresh the runtime skills from `hat/skills/` and keep the approved agreement
in Muse's retrievable chief skill and memory. Update the existing job to load
or carry the full `follow-through` rules, including the hourly review, shared
guard, saved updates boundary and pending repairs. Verify a real scheduled
run and a quiet review. Long polling is an option only after private listener
access and event-to-owner follow-up are proven; no listener is delivered in
this release. Recording and interactive visuals still depend on host support.

## 0.2.1 — 2026-09-28

- Comment boxes use attachment, microphone, and send icons, with less text
  and padding. Task pages use a simpler, flatter layout.
- You can play and pause an attached or recorded voice message before sending
  it. Removing a draft stops playback; a failed send keeps the draft available.

### Updating an existing Office

Ask Muse to refresh its saved `contextual-comments` skill from
[this release](https://raw.githubusercontent.com/tinyhat-ai/muse-office/v0.2.1/hat/skills/contextual-comments/SKILL.md).
Then update the shared comment box on tasks, notes, and projects, and apply
the task-detail layout refinements.
Keep existing records, customizations, portraits, and the follow-through job.
The database schema and agent actions are unchanged from 0.2.0. Recording still
depends on the host's microphone support; uploaded audio can be previewed too.

## 0.2.0 — 2026-09-27

- The board's tab is now called Tasks. Project squares filter the work;
  their small links open details without adding another navigation layer.
- New Offices start with three familiar groups: Work, Personal, and Office.
  Ask Muse to change them as your needs change. Existing projects are preserved.
  When a request fits no project, Muse now asks where it belongs instead of
  filing it under General.
- On phones, selecting a teammate expands the details inside that same card.
  Comment text stays readable when the device uses dark mode.
- One comment box works across tasks, notes, and projects, with formatted text,
  screenshots and audio files. Recording is available only where the host
  permits it. Native Muse chat remains the main way to ask for work.
- Muse checks new feedback and unfinished tasks regularly, records the owner
  and next action, and verifies the requested result before marking work done.
- Muse keeps your Office's existing layout and does not add more help text or
  notices to its pages.

### Updating an existing Office

Preserve existing records and customizations. Add `project_comments` and
`comment_attachments`, plus attachment references on note comments. Extend
`list_recent_updates`, `reply_to_comment`, and `mark_comments_read` to handle
project context. Add bounded `get_comment_attachment` access so the owner can
read private image and audio bytes; follow `spec/ACTIONS.md` and `db/schema.sql`.
Use the shared comment component on all three page types. Update the chief's
recurring job to the `follow-through` skill: every minute when supported, or an
agreed supported interval such as five minutes. Check unfinished owned work
even after comments are acknowledged. Verify actual media understanding before
promising voice follow-up; the current Mac artifact host rejected microphone
recording and native chat handoff, while uploaded audio was verified.

## 0.1.1 — 2026-09-25

- The repository's first page now explains how Muse organizes work with a team
  of specialist agents, and gives a short path to the message you send Muse.
- Setup and developer details live in a separate guide, leaving the first page
  focused on what the hat does for you. The Office app and promotion message
  have not changed.

## 0.1.0 — 2026-09-25

- The sample specialists are explicitly editable. Muse keeps each agent's
  briefing, skills, memory, avatar, Team record, and routing registry aligned
  when creating, changing, or retiring one.
- The Office exposes `set_member_avatar` for the chief and specialists. Muse
  uses its own current avatar on Team, keeps specialist portraits in the same
  illustration style, and shows larger portraits on Team cards and details.
  Both avatar actions reject paths on Muse's computer that the person cannot
  open; an empty `avatar_url` through `upsert_member` clears a portrait.
- Task and note comments share a newest-first, paginated update feed with an
  owner for each item. Notes gain a comment box and reply actions. Muse's
  scheduled check follows all pages and marks comments read after follow-up.
- Existing Offices need the new `note_comments` table and the
  `list_recent_updates` action, plus note support in `POST /api/comments`.
  Their scheduled comment job must
  switch from task-only `list_new_comments` to `list_recent_updates`, follow
  every cursor page, and use each item's `(source, target_id, id)` when
  replying or marking it read. `reply_to_comment` and `mark_comments_read`
  now handle both task and note comments and require their source and page id;
  an overlapping integer id with the wrong page is refused.
  Preserve existing data.

## 0.0.1 — 2026-09-25

First public version.

- The Chief of Staff hat: `HAT.md`, `SOUL.md`, four skills, five specialists,
  five processes, and the Office build request.
- The Office reference app: five pages plus project, task, and note pages,
  the SQLite schema, a truthful default starter, an opt-in fictional
  `OFFICE_SEED=demo` showcase, and the 33 actions.
- Sourced public report charts and `reports.source_url` / `upsert_report.source_url`.
- The spec: pages, design, schema, actions.
