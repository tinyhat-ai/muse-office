# First-experience verification

This change improves the starting instructions and reference Office. Each Muse builds its user's Office and may adapt the design, team, and communication choices. It does not automatically replace existing Offices.

## Reference app

- `npm test`: 30 tests pass, including completion guards, correction requests, page-specific comment routing and pagination, owner replies, screenshot validation/rollback, project progress, and comment line breaks.
- `npm run build`: production build passes.
- Browser: Tasks shows task cards; project/owner/search filters combine and clear. Project progress still counts all its tasks when filters narrow the board. Cards open their task; completed tasks show result, verification, and result link.
- User project management: created School, renamed it, archived it with a task, and restored it. The task returned intact. The unified feed records these edits with actor `you`.
- Review follow-up: archiving a waiting task removes it from active `summary`, default `list_tasks`, and Team work. Direct history reads retain `project_archived_at`. Browser detail pages show Archived / Paused and keep the conversation; restoration returns the task. `archived-project.jpg` captures this. Three names without Latin letters created distinct projects through `/api/projects`; the disposable projects were archived afterward. Regression cases also cover normalized event links/owners and SQL/JavaScript rounding at 23 of 40 checks.
- The Office-wide feed covers all supported mutation actions, with fixed-batch ascending pagination and a checkpoint. Tests cover simultaneous writes, writes arriving during pagination, failed mutations, and poll calls not generating new events. SQL progress views agree with action results.
- At 375px: project and task pages fit the viewport; the comment field is #1c1c19 on white. A task screenshot was uploaded through the file picker and retrieved with the expected image MIME type, private/no-store, and nosniff.
- A correction comment reopened a completed task, cleared its current completion fields, reset its checks, and kept the previous result in its history. A plain acknowledgement does not reopen work.
- Project, task, and note comments were submitted through the browser, fetched through the typed updates action, answered by the relevant owner action, and displayed on the original page.
- Notes still render their Markdown table and Mermaid diagram.
- Review follow-up: two project comments posted before either reply retain their own nested reply; typed line breaks render as line breaks. Two result files with the same name and different URLs both appear, newest first.

Screenshots in `screenshots/feedback/` use reference-app records and a local verification task. No real customer data is included.

## Muse platform boundary

A documentation probe in Muse found scheduled checks and delivery to a chosen side chat, plus a documented speech tool. It did not find a supported immediate comment-to-agent wake-up action. The instructions require checking current platform capabilities, preserving the user's preferences, and showing only a verified polling interval. Saving a comment is not proof that an agent has started work.

## Native Muse integration

Muse built a separate private **Office Feedback Test** from candidate `a89b20d`
and the earlier starting instructions. The initial test created two separate web goals, each with a
task, plus a setup project and an orientation note. This was a deliberately
small integration fixture, not the full starter Office. The existing personal
Office and its scheduled job were kept outside the test.

Through the Muse desktop UI, the tester posted a wording correction on the
completed setup task, requested changes, and uploaded a real screenshot. The
task reopened and its completion checks reset. Muse found the comments during
its active verification, changed the rendered Projects introduction, and
posted replies attributed to the task owner on that same task. Both the tester's
screenshot and the builder's review capture remained attached. This proves the
attachment was saved; it does not prove the owner read the screenshot, because
the reply did not address its contrast request.

The first generated build then exposed a defect: it allowed Done while its
criteria still appeared unchecked. The tester asked Muse to fix that contract.
Muse added the completion guard and checklist update action, reported negative
tests for unchecked criteria and an empty result, then re-verified and completed
the task. Independent desktop inspection confirmed all three visible checks,
the result and verification, the preserved conversation and files, and the
project's Done/100% state with the active correction label cleared. The hat's
handover checks now explicitly require this negative test and visible agreement.

Muse explained in chat that Tinyhat provides the starting instructions and it
builds an Office whose layout, pages, and teamwork can change with the user.
It treated voice as an individual option. This first pass used an active,
requested follow-up with no recurring job. The separate scheduled test below
covers polling; neither test claims an immediate comment wake-up or successful
audio generation.

The `muse-*.jpg` captures show the test artifact inside Muse. They contain only
the integration fixture and its test conversation, not personal work records.

## Restored task board and user-owned projects

The initial project-card interpretation above was superseded by the product
owner's clarification. Tasks are cards in status lists; projects group related
work. The reference and hat now use Tasks, with project/owner/search filters,
project management, preserved portraits, and defined task/project progress.

Native desktop inspection confirmed that Muse rebuilt the test Office with a
Tasks tab, task cards, Website project filtering (two of three tasks), separate
project context, and loaded Noche, Paleta, and Forja portraits. Their images were
reused from the existing Office through the avatar actions. The two web tasks
now belong to Website, and their existing conversations and files remain.
`muse-tasks-board.jpg`, `muse-project-filter.jpg`, and `muse-team-portraits.jpg`
show this corrected version.

Reference captures: `tasks-board.jpg`, `task-filters.jpg`, `manage-projects.jpg`,
and `tasks-mobile.jpg`. The phone board is 375px wide with document width 375px;
all ten visible agent portrait images loaded.

## One-minute scheduled follow-up

Muse created a temporary one-minute checker scoped to the private test Office.
Its first run consumed project changes and a comment, persisted a checkpoint,
but only drafted a reply. That was insufficient. The hat now explicitly says
to post the owner's reply inside the private Office; drafting is not follow-up.

The tester then posted a new comment through the native desktop task UI, asking
to keep the homepage review within Website and confirm receipt. A second
temporary scheduled checker posted Forja's reply on that same task. Independent
desktop inspection confirmed the original comment, nested reply, actual Forja
portrait, unchanged Website membership, and unchanged open task progress.
`muse-scheduled-reply.jpg` captures that result.

Muse's action/scheduler inspection reported the stored author `forja`, a reply
linked to the original comment, the comment's unread flag cleared, checkpoint
8 persisted, and a later run producing no duplicate. Muse confirmed both
temporary jobs were deleted and the original personal Office's job remained
unchanged. Those backend and scheduler receipts are Muse's report; the posted
reply and its visible attribution were checked independently in the desktop.

The tester also asked Muse to inspect the previously missed screenshot. Muse
then described its actual phone layout, dark comment text on white, and the
lighter helper text below the textarea. This corrected the earlier omission;
it is a qualitative image inspection, not a measured contrast audit.

After both temporary checkers were removed, Muse cleared the test Office's
verified schedule setting and rebuilt its save feedback. The tester posted a
harmless acknowledgement through the native task UI and independently observed:
“Comment saved. Regular checks aren’t set up. Ask Noche in chat to continue.”
The footer agreed. `muse-save-confirmation.jpg` records this disabled-schedule
state; it does not imply that the user's personal Office polling was disabled.
