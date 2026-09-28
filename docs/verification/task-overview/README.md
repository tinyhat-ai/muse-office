# Compact task details — verification

September 28, 2026. These screenshots show the reference app with isolated,
synthetic records, using Codex's in-app browser. They are not evidence of a
newly generated Office running inside Muse.

## Checked

- Desktop and 320px/390px phone layouts: the long description starts capped;
  Show more/Show less preserves the complete text. The current, formatted
  snapshot comes before history; the optional checklist shows verified outcomes.
- Waiting tasks keep the user question and contextual reply visible above
  history. Simple tasks omit empty descriptions, checklists, plans and files.
- Updates shows only its label and count, closed by default. Opening reveals
  all threads and replies; keyboard activation works. Closing and reopening
  preserves an unsent contextual reply. Reloading a direct link to an older
  update or nested reply opens Updates and reveals its original context.
- Comment Markdown renders headings, bold, lists, quotes, tables and code.
  Full prose and saved media remain available inside expanded Updates. A saved
  WAV played after reopening through its full 5.85-second duration without an
  error. No horizontal page overflow at 320px or 390px.
- A Markdown/Mermaid snapshot renders its accessible diagram. A self-contained
  HTML visual works at phone width and resizes when its detail expands. A
  separate probe confirmed its parent-page read and Office API fetch fail.
- The agent's `update_task` action changed the current snapshot and verified
  checklist item. Reopening showed both changes. The original description,
  original request, plan, other checklist states, full conversation, files and
  task column were preserved.
- The neighboring Kanban board still renders its project filters and sticky
  notes.

## Code checks

- `npm test`: 30 tests passed, including an existing-database upgrade and
  snapshot/action preservation checks, plus visual isolation policy checks.
- `npm run build`: production build and type checks passed.
- Builder manifest JSON and all six runtime skill files validate.
- `git diff --check`: passed.

## Evidence

- [Desktop overview](desktop.jpg)
- [Phone, 390px](mobile-390.jpg)
- [Phone, 320px](mobile-320.jpg)
- [Waiting on the user](mobile-waiting.jpg)
- [Expanded Markdown comment](comment-markdown.jpg)
- [Saved audio inside expanded Updates](mobile-comment-audio.jpg)
- [Interactive visual snapshot](mobile-visual.jpg)

## Muse verification

The existing isolated Muse test artifact has a native loading failure.
Its builder preview does not establish a native-client pass. The instructions
and handover checklist now include these task-detail requirements; a fresh
installation and native handover remain separate verification steps.
