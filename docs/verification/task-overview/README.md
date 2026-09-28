# Compact task details — verification

September 28, 2026. These screenshots show the reference app with isolated,
synthetic records, using Codex's in-app browser. They are not evidence of a
newly generated Office running inside Muse.

## Checked

- Desktop and 320px/390px phone layouts: the long description starts capped;
  Show more/Show less preserves the complete text. Current state and summary
  come before history; the optional checklist shows verified outcomes.
- Waiting tasks keep the user question and contextual reply visible above
  history. Simple tasks omit empty descriptions, checklists, plans and files.
- Three active threads and the last two replies per thread form the preview.
  A reply to an old thread brings it back. Show more reveals the remaining
  threads/replies. Reloading a link to an older update or reply reveals its
  original context.
- Comment Markdown renders headings, bold, lists, quotes, tables and code.
  Long prose expands with the button or keyboard. A saved WAV remains outside
  the text clamp; playback started after reopening. No horizontal page overflow
  at 320px or 390px.
- The agent's `update_task` action changed the current summary and one verified
  checklist item. Reopening showed both changes. The original description,
  original request, plan, other checklist states, full conversation, files and
  task column were preserved.
- The neighboring Kanban board still renders its project filters and sticky
  notes.

## Code checks

- `npm test`: 30 tests passed, including three new recent-thread tests.
- `npm run build`: production build and type checks passed.
- Builder manifest JSON and all six runtime skill files validate.
- `git diff --check`: passed.

## Evidence

- [Desktop overview](desktop.jpg)
- [Phone, 390px](mobile-390.jpg)
- [Phone, 320px](mobile-320.jpg)
- [Waiting on the user](mobile-waiting.jpg)
- [Expanded Markdown comment](comment-markdown.jpg)
- [Collapsed comment with saved audio](mobile-comment-audio.jpg)

## Muse verification

The existing isolated Muse test artifact has a native loading failure.
Its builder preview does not establish a native-client pass. The instructions
and handover checklist now include these task-detail requirements; a fresh
installation and native handover remain separate verification steps.
