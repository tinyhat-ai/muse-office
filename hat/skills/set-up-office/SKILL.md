---
name: set-up-office
description: One-time setup of the chief-of-staff office. Run when the user first asks you to wear this hat.
---

# Set up the office

Read every file in this hat before you change anything.

## 1. Show the plan and wait for yes

Tell the user, in plain words and one message:
- Tinyhat account: you will create or sign in to their Tinyhat account with
  their email. It is where hat updates live.
  It is optional.
- Your office: ~/workspace/office/ on your computer, with a starter team
  of five specialists (from team/): a Designer, a Developer, a Marketer,
  Sales, and a Bookkeeper. Give each one a name in your own style.
  If you already keep lanes or boards folders (for example
  ~/workspace/boards/), say you will turn them into projects.
- Projects: the four most solo businesses need, Website, Marketing,
  Customers, and Money, plus General for one-offs. Drop any the user does
  not need, and add any they name.
- One private app, Office, with five pages: Projects, Team, Customers, Reports,
  and Notes. Each task and each project also gets its own page.
  It saves what you add, so it is private to them and has no public link.
  If they already have a boards or tasks app, say you will turn it into
  Office and keep its data.
- A tiny chief-of-staff hat on your avatar, preview first.
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
- ~/workspace/office/projects/<slug>/PROJECT.md — goal, lead, status.
- ~/workspace/office/projects/<slug>/process.md — from the closest
  processes/ template, adapted to this project — plus memory.md.
If you already have lane folders (AGENT.md, skills/, memory.md per lane),
move each lane into projects/ and keep its memory.md. Ask first.

Do not open chats for the projects ahead of work; a project chat, if your
platform needs one to keep a specialist from seeing the main chat, is
opened when the first task actually starts there.
Global memory keeps only facts that matter everywhere (name, timezone,
family). Everything else lives in a project's or specialist's memory.md.

## 4. The Office app

Build one web_fullstack app from apps/office.json, the way HAT.md step 3
says: from the repository https://github.com/tinyhat-ai/muse-office when you
can, otherwise an exact match of its schema (db/schema.sql), pages
(spec/PAGES.md), look (spec/DESIGN.md), and actions (spec/ACTIONS.md).
Do not run a web app on your own computer for the user to look at:
the user's browser cannot reach your computer. The Office app is the view.
- Present the build to the user as the plan you already agreed.
- If an app with slug "office" exists, or a boards/tasks app exists, follow
  the fallbacks in office.json. Never delete an app without asking.
- Run the checks in HAT.md ("Check that the Office is right") before you go on.
- Create a scheduled task of yours (every 30 minutes) that calls
  list_new_comments and handles what it finds, as SOUL.md says; without it
  a comment on a task's page waits until the user next talks to you.
- After the build, load the office through the app's actions so that no
  page is empty on the first visit. Not the repository's demo data (that is
  for people trying the app locally), but a real first-week set:
  - the team (upsert_member, you included with is_chief);
  - each project with its process (upsert_project, then set_process with
    the steps and the process.md text);
  - tasks: the setup itself as finished cards ("Set up the office", "Build
    the Office app": create_task, then move_task to done, each with a
    closing report), one first task per project in To do for the specialist
    who will take it (for example: look at the current website and note what
    to keep; draft a simple posting plan; find last month's receipts), and
    one card in Waiting on you with the question the team needs answered
    first ("What do you charge, and for what?", question_kind answer);
  - contacts: anyone the user named as a real lead or customer, at their
    real stage. So that the page is not empty, also add two people who are
    not in the funnel: the user themselves and Tinyhat, both with stage
    `past` (the funnel and the reports ignore `past`), with `source` saying
    why ("you", "made this hat") and the details in `notes` (the user's
    business and email; https://tinyhat.ai and support@tinyhat.ai). Never
    give them a funnel stage: `lead`, `talking`, `proposal`, and `customer`
    all count as sales activity on the Reports page;
  - the eight report cards (upsert_report: website, new-customers, owed,
    in-out, spending, bills, subscriptions, savings, as spec/SCHEMA.md
    lists them) with no numbers yet; each shows who fills it and when;
  - three notes, each with tags: "How your office works" (pinned; where
    things live, who does what), "Your first week" (what the team will do
    first and what it needs from the user), and "Where things live" (chat
    for updates, the board for work, notes for what to find later).

## 5. Avatars

Follow skills/hat-avatar/SKILL.md for your own avatar.
Then make one sibling avatar per specialist (the "Hat:" and "Fur:" lines in
each team/ template) and set it on the Team page.

## 6. Hand over

Send the Office link, one line on how it works ("tell me what you need;
watch it here"), and one suggested first request.
