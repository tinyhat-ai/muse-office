# Compact task details — verification

September 28, 2026. Reference screenshots use isolated, synthetic records in
Codex's in-app browser. The three `native-` screenshots show the separately
generated Office Build Check app in the actual Muse Mac client.

## Checked

- Desktop and 320px/390px phone layouts: the long description starts capped;
  Show more/Show less preserves the complete text. A short heading with two
  brief paragraphs also has Show more when clipped; a one-line brief has none.
  The current, formatted
  snapshot comes before history; the optional checklist shows verified outcomes.
- Waiting tasks keep the user question and contextual reply visible above
  history. Simple tasks omit empty descriptions, checklists, plans and files.
- Updates shows only its label and count, closed by default. Opening reveals
  all threads and replies; keyboard activation works. Closing and reopening
  preserves an unsent contextual reply. Posting a separate comment also leaves
  an open reply draft intact. Event-only tasks expose their history and count.
  Reloading a direct link to an older
  update or nested reply opens Updates and reveals its original context.
- Comment Markdown renders headings, bold, lists, quotes, tables and code.
  Full prose and saved media remain available inside expanded Updates. A saved
  WAV played after reopening through its full 5.85-second duration without an
  error. No horizontal page overflow at 320px or 390px.
- A Markdown/Mermaid snapshot renders its accessible diagram. A self-contained
  HTML visual works at phone width and resizes when its detail expands. A
  separate probe confirmed its parent-page read and Office API fetch fail.
  Ordinary heading/paragraph margins are included in the frame height: the
  final line stays visible at both phone widths, including after expansion.
  The Office page policy also blocks frame navigation. Script, link and
  meta-refresh probes are checked after opening the task from the board and
  after a reload, while the intended visual still works.
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
- [HTML paragraph margins fit](mobile-visual-margins.jpg)

## Muse verification

The isolated generated app was updated in place. The saved task **QA: workshop
snapshot** shows its original brief, current overview, optional checklist and
closed Updates. The original request and three plan steps remain available.
Its HTML details control expands inside the actual client.

The first generated version put the comment box inside Updates. After the
contract correction, a comment sent with Updates closed raised the count from
7 to 8 and cleared the composer. Opening Updates showed the saved comment;
reopening after republishing kept it. Muse then changed the overview and the
native-composer check through actions, and both changes were independently
seen in the client. These are synthetic QA records, not user work.

- [Native overview after the action update](native-overview.jpg)
- [Closed Updates with the shared comment box](native-closed-updates.jpg)
- [Saved comment after reopening](native-saved-comment.jpg)

Native handover remains incomplete for scripted visuals. The published script
probe never changed its timer text, and its link probe rendered as plain text.
Neither proves blocked navigation. The builder contract now points to the
isolated visual implementation and requires an active script/link before
accepting those probes. This is an incremental test, not a fresh installation.
