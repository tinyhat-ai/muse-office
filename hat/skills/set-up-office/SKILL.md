---
name: set-up-office
description: One-time setup of the chief-of-staff office. Run when the user first asks you to wear this hat.
---

# Set up the office

Read this hat and `../adapt-your-office/SKILL.md` before changing anything.
This is a starting system the user can reshape, including the whole interface.

## 1. Show the plan and wait for yes

Keep the plan scannable: a short opening and at most three bullets, about 120
words. Offer details separately instead of pasting all implementation steps.
Cover the following in plain words:
- Tinyhat account: you will create or sign in to their Tinyhat account with
  their email. It is where hat updates live.
  It is optional.
- Your office: ~/workspace/office/ on your computer, with a starter team
  of five specialists (from team/): a Designer, a Developer, a Marketer,
  Sales, and a Bookkeeper. Give each one a name in your own style.
  Preserve existing boards and their project/task mapping when migrating.
- Projects group related tasks, like Website, Personal, or School. A landing-page
  launch is a task within Website. Start with a few useful example projects,
  which the person can rename, add, archive, and restore themselves. The Tasks
  tab shows task cards in status lists, with project filters, search, and owner
  filtering. Opening a card opens the task; keep project details separately.

- One private app, Office, with five pages: Tasks, Team, Customers, Reports,
  and Notes. Each task and each project also gets its own page.
  It saves what you add, so it is private to them and has no public link.
  If they already have a boards or tasks app, say you will turn it into
  Office and keep its data.
- A tiny chief-of-staff hat on your avatar, preview first.
Include the proposed update chat and comment-check interval in this plan; offer
voice summaries as a choice. Keep existing preferences. Explain that you build
their Office and can change it when they ask.
Before you start, ask at most two questions: which projects, and "shall I start?"
(The avatar preview and the email code come later, only if needed.)

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
- ~/workspace/office/projects/<slug>/PROJECT.md — purpose, lead, and current work summary.
- ~/workspace/office/projects/<slug>/process.md — from the closest
  processes/ template, adapted to this project — plus memory.md.
When migrating existing boards, preserve their projects, tasks, and memory. Status lists are not projects; do not turn To do or Done into a project.

Do not open chats for the projects ahead of work; a project chat, if your
platform needs one to keep a specialist from seeing the main chat, is
opened when the first task actually starts there. A user-approved Office
side chat for routine updates is separate from these specialist work chats.
Global memory keeps only facts that matter everywhere (name, timezone,
family). Everything else lives in a project's or specialist's memory.md.

## 4. The Office app

Build one web_fullstack app from apps/office.json, the way HAT.md step 3
says: from the repository https://github.com/tinyhat-ai/muse-office when you
can, or use its schema (db/schema.sql), pages (spec/PAGES.md), design
(spec/DESIGN.md), and actions (spec/ACTIONS.md) as a starting point for a
native artifact. Adapt the interface to the user. Preserve action contracts
or update your own skills alongside any changed action names and fields.
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
- Run the checks in HAT.md ("Check that the Office is right") before you go on.
- Create one scheduled job to check **every minute** by default, using a verified
  immediate trigger if supported instead. Respect an existing user preference;
  if one minute is unsupported, explain the real minimum and agree the fallback.
  Call `list_office_updates` from the saved checkpoint, follow every cursor page,
  route each change to its owner, and save the checkpoint only after successful
  handling. Include project edits, tasks, status, checklists, files, team, notes,
  customers, and reports. Also drain `list_recent_updates` with `unread_only=true`
  for comment retries; read attachments and reply on the same page before marking
  read. Keep one job and prevent overlapping runs. Verify a real scheduled run
  after a test UI change before recording `comment_check_minutes`. A cron entry
  alone is not verification. After a save the UI names the chief, explains this
  actual schedule, and says the chief will follow up; it never claims instant wake.
  See `adapt-your-office` for setup, checkpoints, and failure handling.

- After the build, load the office through its actions exactly as
  `spec/STARTER.md` describes. That file names the first tasks, three notes,
  two real orientation contacts outside the sales funnel, and four sourced
  public reports with exact values. Create the eight business report definitions,
  but hide their cards until your team has verified figures to plot. On the first
  visit the Reports page must lead with actual charts, not empty text cards.
  Never invent a lead, customer, website visitor, invoice, or completion to make
  a page look busy. The repository's `OFFICE_SEED=demo` data is a fictional
  showcase, not for this person's Office.

## 5. Avatars

Follow skills/hat-avatar/SKILL.md for your own avatar. Then create a distinct
face and specialty-relevant mascot for each specialist in a consistent visual
style. Use the "Hat:" and "Color:" lines in each team/ template as optional
visual cues, not instructions to recolor the same face. Store each image on
that specialist's Team card with `upsert_member.avatar_url`. Show the person
the team together before you finish; if images are unavailable, keep initials
temporarily and record avatar creation as a setup task. When creating or
changing an agent later, use `hat` only for a wearable accessory, never as a
stand-in for the mascot. Open Team and verify the card, live specialist count,
and loaded image. Check the specialist's folder and the actual briefing,
skills, and memory files before reporting the agent as ready. If any part is
missing, report that exact gap and keep its setup task open.

## 6. Hand over

Send the Office link, one suggested first request, and this explanation:
“I built this first version of your Office from Tinyhat’s starting instructions.
Tell me what you want to change — the pages, the layout, or how the team works.
Comments give the owner direction; replies appear on the same page.”
State the actual comment-check interval and the chosen update chat. Never
claim setup is finished while a required check or avatar is still missing.
