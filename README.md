# muse-office

Promote your Muse to chief of staff. It manages a small team of specialist
agents for you and shows you what is going on in one private app, **Office**,
but it does the managing itself. Your Muse does more; you run nothing.

This repository holds two things:

1. **The hat** (`hat/`): the instructions a Muse follows to become a chief
   of staff, set up its office, build the Office app, and run it every day.
2. **The Office** (`src/`, `db/`, `spec/`): the reference application, a
   small Next.js + SQLite app you can run locally, with the database schema,
   the pages, and the actions a Muse uses to change it.

## For people: promote your Muse

A Muse does not take standing instructions from a web page (it will read one
and then ask you to say it in your own words, which is the right behaviour).
So the promotion is a message from you: copy the text in
[`hat/PROMPT.md`](hat/PROMPT.md), change anything you like, and send it to
your Muse. It shows you its plan, waits for your yes, sets up its office,
builds your Office app from this repository, and hands you the link. You keep
talking to it the way you always have.

The long form of the promotion, which your Muse reads as build material, is
[`hat/HAT.md`](hat/HAT.md), also served at <https://tinyhat.ai/hats/chief-of-staff.md>.

## What a Muse builds from this hat

Built by a Muse from the message in `hat/PROMPT.md`, on a freshly reset agent, with the specialists named by the Muse itself: the Team page after a few requests were routed (a post with the marketer and a lead with sales, both waiting on the person; a receipt pile next for the bookkeeper; the designer's finished task), and the Notes page. That build predates note tags; a Muse that refines its Office from the current spec gets the tag chips above.

![Team page of an Office built by a Muse](docs/live/team.png)

![Notes page of an Office built by a Muse](docs/live/notes.png)

## Run the Office locally

```bash
npm install
npm run dev
```

`npm test` runs the small test suite (the Markdown sanitizer and the question/answer loop) with Node's built-in runner.

Open <http://localhost:3007>. The first start creates `data/office.db` and
fills it with a starter Office: real setup tasks, an initial team, a guide in
Notes, two contacts outside the customer funnel, and four cited public charts.
It does not invent business results or customers. `npm run reset` deletes the
data; the next start seeds the starter again. Use `OFFICE_SEED=demo npm run dev`
for the fictional consultant showcase shown in some screenshots, or
`OFFICE_SEED=none npm run dev` for an empty database.

The pages are view-only. The one thing you can write is a comment or a reply
on a task's page. Everything else changes through the actions.

## First visit

The starter board shows setup work and one real question for the person. Team
members have distinct illustrated faces. Customers contains orientation contacts
outside the sales funnel; the funnel stays at zero until real people are added.
Reports opens with four charts from linked public sources, and Notes renders a
Markdown table and a Mermaid flowchart.

![Starter Projects board](docs/screenshots/starter-projects.jpg)

![Starter Team and specialist mascots](docs/screenshots/starter-team.jpg)

![Starter Customers page](docs/screenshots/starter-customers.jpg)

![Starter Reports with public charts](docs/screenshots/starter-reports.jpg)

![Starter Note with rendered Markdown and Mermaid](docs/screenshots/starter-note-mermaid.jpg)

## What it looks like

The board: lanes with a coloured rule, sticky notes in the project's colour, and a "Waiting on you" lane for the things only the person can answer.

![The Projects board](docs/screenshots/projects.png)

A task's page, the one place the person can write: the pinned question with a one-tap answer, what the task is, done-when, the plan, and the conversation.

![A task waiting on a money question](docs/screenshots/task-waiting-money.png)

Customers (a small funnel, this week's follow-ups, the people table; the person and the hat's maker kept as contacts outside the funnel) and Reports (results, not activity):

![Customers](docs/screenshots/customers.png)

![Reports](docs/screenshots/reports.png)

Notes carry tags for finding them later, and a note can hold a small visual (here, how a change goes live), which scales down on a phone:

![Notes with tags](docs/screenshots/notes.png)

![A note with tags and an inline visual](docs/screenshots/note-page.png)

More in [`docs/screenshots/`](docs/screenshots/): a project's page, Team, the board and a note on a phone, and a task whose money question was asked again with a new amount (the earlier yes stays with the earlier question).

## The actions

```bash
curl -s localhost:3007/api/actions | jq .            # the catalog
curl -s -X POST localhost:3007/api/actions/create_task \
  -H 'content-type: application/json' \
  -d '{"project":"website","title":"Pick brand colors","specialist":"pastel"}'
```

Every action is `POST /api/actions/<name>` with a JSON body and answers
`{"ok":true,"data":…}` or `{"ok":false,"error":"…"}`. The full contract is
in [`spec/ACTIONS.md`](spec/ACTIONS.md).

## What is where

| Path | What |
| --- | --- |
| `hat/HAT.md` | The entry instruction. tinyhat.ai serves this file. |
| `hat/SOUL.md` | How the chief of staff behaves every day. |
| `hat/skills/` | Setup, running a task, improving a process, the avatar. |
| `hat/team/` | The five specialists. |
| `hat/processes/` | Five ways a project can run. |
| `hat/apps/office.json` | The build request for the Office app. |
| `spec/PAGES.md` | What every page shows. |
| `spec/DESIGN.md` | Tokens, colours, the sticky-note board. |
| `spec/SCHEMA.md`, `db/schema.sql` | The database. |
| `spec/ACTIONS.md` | The actions. |
| `src/` | The reference app (Next.js app router, `better-sqlite3`). |

## Versioning

`VERSION` and the `version:` line in `hat/HAT.md` move together; see
[`RELEASING.md`](RELEASING.md) and [`CHANGELOG.md`](CHANGELOG.md).

## License

MIT, see [`LICENSE`](LICENSE).
