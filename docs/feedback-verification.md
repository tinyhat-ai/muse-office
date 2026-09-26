# First-experience verification

This change improves the starting instructions and reference Office. Each Muse builds its user's Office and may adapt the design, team, and communication choices. It does not automatically replace existing Offices.

## Reference app

- `npm test`: 23 tests pass, including completion guards, correction requests, page-specific comment routing and pagination, owner replies, screenshot validation/rollback, and project progress.
- `npm run build`: production build passes.
- Browser: project overview opens its task list; completed tasks show result, verification, and result link.
- At 375px: project and task pages fit the viewport; the comment field is #1c1c19 on white. A task screenshot was uploaded through the file picker and retrieved with the expected image MIME type, private/no-store, and nosniff.
- A correction comment reopened a completed task, cleared its current completion fields, reset its checks, and kept the previous result in its history. A plain acknowledgement does not reopen work.
- Project, task, and note comments were submitted through the browser, fetched through the typed updates action, answered by the relevant owner action, and displayed on the original page.
- Notes still render their Markdown table and Mermaid diagram.

Screenshots in `screenshots/feedback/` use reference-app records and a local verification task. No real customer data is included.

## Muse platform boundary

A documentation probe in Muse found scheduled checks and delivery to a chosen side chat, plus a documented speech tool. It did not find a supported immediate comment-to-agent wake-up action. The instructions require checking current platform capabilities, preserving the user's preferences, and showing only a verified polling interval. Saving a comment is not proof that an agent has started work.

A native Muse-generated Office is a separate integration check from the reference app tests above.
