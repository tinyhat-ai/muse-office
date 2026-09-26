# First-experience verification

This change improves the starting instructions and reference Office. Each Muse builds its user's Office and may adapt the design, team, and communication choices. It does not automatically replace existing Offices.

## Reference app

- `npm test`: 24 tests pass, including completion guards, correction requests, page-specific comment routing and pagination, owner replies, screenshot validation/rollback, project progress, and comment line breaks.
- `npm run build`: production build passes.
- Browser: project overview opens its task list; completed tasks show result, verification, and result link.
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
and the starting instructions. It created two separate web goals, each with a
task, plus a setup project and an orientation note. This was a deliberately
small integration fixture, not the full starter Office. The existing personal
Office and its scheduled job were kept outside the test.

Through the Muse desktop UI, the tester posted a wording correction on the
completed setup task, requested changes, and uploaded a real screenshot. The
task reopened and its completion checks reset. Muse found the comments during
its active verification, changed the rendered Projects introduction, and
posted replies attributed to the task owner on that same task. Both the tester's
screenshot and the builder's review capture remained attached.

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
It treated voice as an individual option. No recurring job was created for this
test, and the Office visibly says to ask Muse in chat to review comments. This
test verifies an active, requested follow-up; it does not claim an automatic
comment wake-up, a scheduled-run test, or successful audio generation.

The `muse-*.jpg` captures show the test artifact inside Muse. They contain only
the integration fixture and its test conversation, not personal work records.
