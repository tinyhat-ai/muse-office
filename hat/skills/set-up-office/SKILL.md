---
name: set-up-office
description: One-time setup of the chief-of-staff office. Run when the user first asks you to wear this hat.
---

# Set up the office

Read every file in this hat before you change anything.

## 1. Show the plan and wait for yes

Put the actual plan in the body of one chat message, in plain words, before
asking for approval. A choice button, collapsed card, or "that's the plan"
sentence without the plan is insufficient. The person must be able to read:
- Tinyhat account: you will create or sign in to their Tinyhat account with
  their email. It is where hat updates live.
  It is optional.
- Your office: ~/workspace/office/ on your computer, with a starter team
  of five specialists (from team/): a Designer, a Developer, a Marketer,
  Sales, and a Bookkeeper. Give each one a name in your own style.
  If you already keep lanes or boards folders (for example
  ~/workspace/boards/), say you will turn them into projects.
- Projects: start with Work, Personal, and Office. Adapt these groups to
  what the user needs; keep any existing projects and add ones they name.
- One private app, Office, with five pages: Tasks, Team, Customers, Reports,
  and Notes. Each task and each project also gets its own page.
  It saves what you add, so it is private to them and has no public link.
  If they already have a boards or tasks app, say you will turn it into
  Office and keep its data.
- A tiny chief-of-staff hat on your avatar, preview first.
- Your working agreement: simple jobs you can finish yourself stay in chat.
  Work needing specialists, team coordination or ongoing follow-up and
  visibility uses Office, including requests made in the main chat. You and the
  team will keep its board, relevant reports and notes current through actions.
  The recurring check handles feedback frequently and reviews their accuracy
  once an hour, even without new comments.
  After their yes, you will save this agreement in your own persistent memory
  and chief-of-staff skill so it applies in later chats (HAT.md, step 2).
Before you start, ask at most two questions: which projects, and "shall I start?"
(The avatar preview and the email code come later, only if needed.)

Check the sent message contains the plan itself. If the host omitted or hid it,
send the plain-text plan before offering approval again. Reuse an existing yes
only when it covered that visible plan; a button response to a missing plan
does not authorize a build the person could not review.

## 2. Tinyhat account (skippable)

Follow https://tinyhat.ai/agents.md to sign in with the user's email.
Tinyhat emails a 6-digit code. Read it from the user's inbox only if you
have email access and they allow it; otherwise ask them for it.
Keep the token in your credential store. Then record that you wear this hat
(the wear call in agents.md). If the user says no account, skip this step.

## 3. Office folders

Create:
- ~/workspace/office/HAT.md — copy of this hat's HAT.md (it pins the version).
- ~/workspace/office/SOUL.md — copy.
- ~/workspace/office/REGISTRY.md — one line per project (process, lead,
  what it must never do) and one line per specialist (role, folder).
- ~/workspace/office/team/<name>/AGENT.md — from the matching team/
  template, plus skills/ (the starter skills it names) and memory.md.
- ~/workspace/office/projects/<slug>/PROJECT.md — goal, lead, status.
- ~/workspace/office/projects/<slug>/process.md — from the closest
  processes/ template, adapted to this project — plus memory.md.
If you already have lane folders (AGENT.md, skills/, memory.md per lane),
move each lane into projects/ and keep its memory.md. Ask first.

Do not open chats for the projects ahead of work; a project chat, if your
platform needs one to keep a specialist from seeing the main chat, is
opened when the first task actually starts there.
Global memory keeps facts that matter everywhere (name, timezone, family)
and the approved Office working agreement. Project details and specialist
techniques stay in their own memory.md. Read back the saved agreement and
skill and check the platform's retrieval path before reporting that it will
persist across chats; disclose an unavailable persistence mechanism in chat.

## 4. The Office app

Build one web_fullstack app from apps/office.json, the way HAT.md step 3
says: from the repository https://github.com/tinyhat-ai/muse-office when you
can, otherwise an exact match of its schema (db/schema.sql), pages
(spec/PAGES.md), look (spec/DESIGN.md), and actions (spec/ACTIONS.md).
Pass the complete `apps/office.json`, including `builder_notes`, and those
specifications to the builder. Do not replace them with a short page list or
your own summary. The builder must preserve the task snapshot and collapsed
Updates contract, not just make a board that looks similar.
When running the repository code for this person, set `OFFICE_SEED=none`
**before the first database open**. The app's default starter is for browsing
the reference app; loading it and then calling setup actions creates duplicate
chiefs and first-week records. Check that the new Office is empty before
calling the actions below. For an existing Office, inspect and update its
records in place; do not append another starter set.
Do not run a web app on your own computer for the user to look at:
the user's browser cannot reach your computer. The Office app is the view.
- Present the build to the user as the plan you already agreed.
- If an app with slug "office" exists, or a boards/tasks app exists, follow
  the fallbacks in office.json. Never delete an app without asking.
- After the build, load the office through its actions exactly as
  `spec/STARTER.md` describes. That file names the first tasks, three notes,
  two real orientation contacts outside the sales funnel, and four sourced
  public reports with exact values. Create the eight business report definitions,
  but hide their cards until your team has verified figures to plot. On the first
  visit the Reports page must lead with actual charts, not empty text cards.
  Never invent a lead, customer, website visitor, invoice, or completion to make
  a page look busy. The repository's `OFFICE_SEED=demo` data is a fictional
  showcase, not for this person's Office.

- After loading the starter, run the checks in HAT.md ("Check that the Office is right").
  Label synthetic comments as tests on the setup task; do not impersonate user approvals.
- Open an action-created setup test task with a real member as owner, a current
  overview, one met and one unmet `done_when` item, a Markdown agent update and
  a clearly labeled test comment. Reopen it. The overview, status, owner and
  checks must appear before a closed **Updates** disclosure with the full count;
  the shared comment box stays available. Expand Updates and verify the agent
  update keeps its actual author and rendered Markdown. Change the overview and
  a check through `update_task`, then reopen and verify the current values.
  A successful action or a builder's completion message is not this visual
  check. Fix any generated-page mismatch in place before calling it ready.
  Read back the chief's saved skill too: it must load the installed `run-a-task`
  skill and retain responsibility for keeping that snapshot clear and current.
- Verify routing with a simple job the chief can finish (such as rewriting a
  paragraph): it must produce no board task. Then use a clearly labeled
  main-chat test needing specialists or ongoing follow-through: its task
  must exist before that workflow starts, and a later
  chat correction must update that same task and any affected note or report.
  Use a labeled test note or report, or an isolated test Office; never change
  the person's own notes or reports as a test.
  Check the saved records and the installed skill/memory; a chat claim alone
  does not prove routing or persistence. A simple factual question also needs no card.
- Check Notes using a newly action-created test note as well as the starter:
  follow `spec/PAGES.md` to open, reopen, and edit its heading/table/Mermaid
  body. A source readback alone does not pass. Keep it clearly labeled as a
  setup check rather than invented user work.
- Follow `skills/follow-through/SKILL.md` to create or update one recurring
  Office check, every minute when supported. Verify the real enabled schedule
  and an actual run. It reviews unread comments and all unfinished tasks, even
  after a comment has been answered. Agree on a supported fallback such as five
  minutes when necessary; do not silently default to 30 minutes.
  Its private checkpoint also makes an hourly board/report/note review due.
  Verify that branch with synthetic stale records and distinguish a manual
  test from an actual scheduled pass; follow-through defines both checks.

## 5. Avatars

Complete `skills/hat-avatar/SKILL.md` as part of the approved setup, before
handover. Load the native avatar tools, edit the existing Muse face, show the
tiny plain top-hat preview for approval, and activate it. Reuse an already
approved active hat image. Give the actual image to the specialist image tool
and builder as their style reference; do not silently keep bundled sample faces.
Then create a distinct
face and specialty-relevant mascot for each specialist in a consistent visual
style. Use the "Hat:" and "Color:" lines in each team/ template as optional
visual cues, not instructions to recolor the same face. Store each image on
that specialist's Team card with `set_member_avatar(slug, avatar_url)` after
creating its member row. Follow the private import and reopen checks in
`hat-avatar`; a native activation, upload acknowledgement or stored path alone
is not success. Read back each member's `avatar_url` and inspect its loaded
image after reopening Team, a task and the board. Show the person
the team together before you finish; if images are unavailable, keep initials
temporarily and record avatar creation as a setup task. When creating or
changing an agent later, use `hat` only for a wearable accessory, never as a
stand-in for the mascot. Open Team and verify the card, live specialist count,
and loaded image. Check the specialist's folder and the actual briefing,
skills, and memory files before reporting the agent as ready. If any part is
missing, report that exact gap and keep its setup task open.

## 6. Hand over

Send the Office link, one line on how it works ("tell me what you need;
watch it here"), and one suggested first request.
