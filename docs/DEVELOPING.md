# Build and inspect Muse Office

Muse Office is an open source reference app for the Chief of Staff hat. The
[README](../README.md) explains what it does for a person using Muse. This page
covers the app, its actions, and its files.

## Run the reference app

```bash
npm ci
npm run dev
```

Open <http://localhost:3007>. On first start, the app creates `data/office.db`
with a useful starter: setup tasks, an initial team, a guide in Notes, two
contacts outside the customer funnel, and four cited public charts. It does
not invent business results or customers.

`npm test` runs the app tests. `npm run reset` deletes the local database; the
next start seeds the starter again. Use `OFFICE_SEED=demo npm run dev` for the
fictional consultant showcase shown in some screenshots, or
`OFFICE_SEED=none npm run dev` for an empty database.

Most pages are for reading. A person can comment on tasks and notes, and reply
to a task update. Muse changes the other records through Office actions.

## What the starter shows

Projects opens with setup work and a real question for the person. Team members
have illustrated faces. Customers contains orientation contacts outside the
sales funnel; the funnel stays at zero until real people are added. Reports
opens with four charts from linked public sources. Notes renders Markdown,
tables, and Mermaid diagrams.

- [Starter Projects board](screenshots/starter-projects.jpg)
- [Starter Team](screenshots/starter-team.jpg)
- [Starter Customers](screenshots/starter-customers.jpg)
- [Starter Reports](screenshots/starter-reports.jpg)
- [Starter Note with Markdown and Mermaid](screenshots/starter-note-mermaid.jpg)
- [More Office screenshots](screenshots/)

Earlier examples from an Office built by Muse are available in the
[Team](live/team.png) and [Notes](live/notes.png) captures. They predate the
current starter layout.

## Office actions

```bash
curl -s localhost:3007/api/actions | jq .
curl -s -X POST localhost:3007/api/actions/create_task \
  -H 'content-type: application/json' \
  -d '{"project":"website","title":"Pick brand colors","specialist":"designer"}'
```

Every action is `POST /api/actions/<name>` with a JSON body. It responds with
`{"ok":true,"data":…}` or `{"ok":false,"error":"…"}`. The complete contract
is in [the actions specification](../spec/ACTIONS.md).

## Find the source

| Path | Purpose |
| --- | --- |
| [`hat/PROMPT.md`](../hat/PROMPT.md) | The message a person sends Muse; the stable copy is on `channels/lts`. |
| [`hat/HAT.md`](../hat/HAT.md) | The entry instruction, published with each release and channel. |
| [`hat/SOUL.md`](../hat/SOUL.md) | How the chief of staff behaves each day. |
| [`hat/skills/`](../hat/skills/) | Setup, running a task, improving a process, and the avatar. |
| [`hat/team/`](../hat/team/) | Five optional starter specialists; Muse can change the team. |
| [`hat/processes/`](../hat/processes/) | Five ways a project can run. |
| [`hat/apps/office.json`](../hat/apps/office.json) | The build request for Office. |
| [`spec/PAGES.md`](../spec/PAGES.md) | What each page shows. |
| [`spec/STARTER.md`](../spec/STARTER.md) | What the first visit shows. |
| [`spec/DESIGN.md`](../spec/DESIGN.md) | Design tokens, colours, and the board. |
| [`spec/SCHEMA.md`](../spec/SCHEMA.md), [`db/schema.sql`](../db/schema.sql) | The database. |
| [`spec/ACTIONS.md`](../spec/ACTIONS.md) | The actions. |
| [`src/`](../src/) | The Next.js reference app. |

## Releases and channels

`VERSION` and the `version:` line in `hat/HAT.md` move together. See
[Releasing](../RELEASING.md) and the [Changelog](../CHANGELOG.md).

[`channels/lts`](https://github.com/tinyhat-ai/muse-office/tree/channels/lts)
carries the stable promotion message. [`channels/latest`](https://github.com/tinyhat-ai/muse-office/tree/channels/latest)
tracks the newest published release. `main` is for upcoming changes and may
move ahead of both channels. The hat's build-file links use `channels/lts`
too. For an unreleased integration test, give Muse the candidate commit and
explicitly read all build files from it; the public LTS links will not contain
new files until the complete release is promoted. See the rollout checks in
[Releasing](../RELEASING.md).
