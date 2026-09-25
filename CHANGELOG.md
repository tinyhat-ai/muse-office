# Changelog

All notable changes to this repository are listed here. The version is the
one in `VERSION` and in the `version:` line of `hat/HAT.md`.

## 0.1.0 — 2026-09-25

- The sample specialists are explicitly editable. Muse keeps each agent's
  briefing, skills, memory, avatar, Team record, and routing registry aligned
  when creating, changing, or retiring one.
- The Office exposes `set_member_avatar` for the chief and specialists. Muse
  uses its own current avatar on Team, keeps specialist portraits in the same
  illustration style, and shows larger portraits on Team cards and details.
- Task and note comments share a newest-first, paginated update feed with an
  owner for each item. Notes gain a comment box and reply actions. Muse's
  scheduled check follows all pages and marks comments read after follow-up.
- Existing Offices need the new `note_comments` table and three new actions:
  `list_recent_updates`, `reply_to_note_comment`, `mark_note_comments_read`,
  and note support in `POST /api/comments`. Their scheduled comment job must
  switch from task-only `list_new_comments` to `list_recent_updates`, follow
  every cursor page, and use each item's `(source, id)` when replying or
  marking it read. Both reply actions and both read actions now require
  `source: "task"` or `source: "note"` as appropriate, preventing an
  overlapping integer id from routing a reply or read receipt to another page.
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
