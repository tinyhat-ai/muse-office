# Changelog

All notable changes to this repository are listed here. The version is the
one in `VERSION` and in the `version:` line of `hat/HAT.md`.

## 0.2.0 — 2026-09-27

- Office opens directly on the Tasks board. Project squares filter the work;
  their small links open details without adding another navigation layer.
- New Offices start with three familiar groups: Work, Personal, and Office.
  Ask Muse to change them as your needs change. Existing projects are preserved.
- On phones, selecting a teammate expands the details inside that same card.
  Comment text stays readable when the device uses dark mode.
- One comment box works across tasks, notes, and projects, with formatted text,
  screenshots and audio files. Recording is available only where the host
  permits it. Native Muse chat remains the main way to ask for work.
- Muse checks new feedback and unfinished tasks regularly, records the owner
  and next action, and verifies the requested result before marking work done.
- The hat makes clear that Muse builds and adapts your Office. The starting
  design stays simple; bug fixes and larger product decisions stay separate.

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
