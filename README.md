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

Paste this to your Muse:

> Read https://tinyhat.ai/hats/chief-of-staff.md and follow it. It promotes you to my chief of staff.

Your Muse reads the hat, shows you its plan, waits for your yes, and builds
your Office. You keep talking to it the way you always have.

## Run the Office locally

```bash
npm install
npm run dev
```

`npm test` runs the small test suite (the Markdown sanitizer and the question/answer loop) with Node's built-in runner.

Open <http://localhost:3007>. The first start creates `data/office.db` and
fills it with a demo office (a consultant who runs workshops, five
specialists, five projects, a few tasks, customers, reports, and notes).
`npm run reset` deletes the data; the next start seeds it again. Start with
an empty office with `OFFICE_SEED=none npm run dev`.

The pages are view-only. The one thing you can write is a comment or a reply
on a task's page. Everything else changes through the actions.

## What it looks like

The board: lanes with a coloured rule, sticky notes in the project's colour, and a "Waiting on you" lane for the things only the person can answer.

![The Projects board](docs/screenshots/projects.png)

A task's page, the one place the person can write: the pinned question with a one-tap answer, what the task is, done-when, the plan, and the conversation.

![A task waiting on a money question](docs/screenshots/task-waiting-money.png)

Customers (a small funnel, this week's follow-ups, the people table) and Reports (results, not activity):

![Customers](docs/screenshots/customers.png)

![Reports](docs/screenshots/reports.png)

More in [`docs/screenshots/`](docs/screenshots/): a project's page, Team, Notes, a note, and the board on a phone.

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
