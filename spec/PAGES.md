# The pages

Five pages in one top bar: **Tasks · Team · Customers · Reports · Notes**, with "Updated x ago" on the right. Plus a page for each project, each task, and each note. Muse builds this first version for the user and can change it with them. Say so in a short, visible line. Users can search, filter, manage projects, and comment. Muse updates the remaining work records. For those records a quiet line says: "To change this, tell <your Muse's name> in chat."

Every page opens with the same header: a small kicker line, a large title, one line of lede. Then the content. Nothing is hidden behind tabs inside a page.

## Tasks (`/projects`, retained for existing links)

Use familiar board, status-list, and task-card meanings. Projects group related
tasks: Website, Personal, School. “Launch a landing page” is a task in Website.
Projects are user choices; the starter names are examples, not a fixed taxonomy.

Show **All projects** and one selector per active project, then task search and
owner filtering, matching counts, and Clear filters. Filters combine. Four status
lists: To do, In progress, Waiting on you, Done. Each card is a task and opens its
task page. Show project colour/name, task title, owner portrait/name (including
Done), verified-check progress, due/updated date, and the question when waiting.
Keep all completed tasks discoverable. Selected project context links to its
separate detail page and shows completed tasks / all project tasks; filtering
does not alter that denominator. Empty projects have zero tasks, not a completion.

**Manage projects** lets the user add, rename, describe, archive, and restore
projects. Archiving hides a project and its tasks from the active board and
preserves notes, comments, files, process, and history. Explain this before the
control. List archived projects here with Restore. Every save enters the unified
updates feed so Muse learns what changed. Never turn status lists into projects.

Use four lists on desktop, two on smaller screens, and one column on phones
with Waiting on you first. No squeezed cards or clipped controls.

## A project's page (`/projects/<slug>`)

Breadcrumb, project title and purpose, lead, derived status, completion count,
and the current question or next due task. Show **all tasks**, including finished
ones, with owner, status, next step or result, and a due/updated date. Open a task
for its plan, criteria, conversation, and delivered output.

**Project direction** holds comments for the project lead. Save them in
`project_comments`, include them in the typed updates feed, and reply here.
Explain the real checking interval when configured; distinguish awaiting reply
from replied. Keep the written process, done criteria, and learned rules in an
expandable “How this project runs” section.

This is the starting layout. Muse may change it, including replacing the whole
view, when the person asks. Keep the records and user choices intact.

## A task's page (`/tasks/<id>`)

Like an issue page, top to bottom:

1. Breadcrumb "‹ Tasks / Money". The project name with its colour bar. The title, large. A status line: the column (orange dot for Waiting on you), "[avatar] Penny is on it", "Waiting 3 hours" or "Updated 2 hours ago", and "Due Thursday" when set.
2. **When the task waits on the user**, the unanswered question is pinned right here, in a peach card: "[avatar] Penny asked you · 3 hours ago", the question, and either two buttons for a `money` question ("Yes, pay $1,240 on Sep 28" / "Not yet") or a "Reply to Penny" button, plus one line saying what a yes does. It disappears once answered.
3. **What this is**: the job definition. A collapsed "Original request" with the user's own words.
4. **Done when**: a checklist; met items show a green check. Show verified count and percent from `task_progress`; no criteria means “Completion checks not set”, never a made-up percentage.
5. **Plan**: a numbered list; the current step is bold with "· now"; done steps are grey.
6. **Conversation**: a vertical timeline. The last update before a task was moved to Done is its closing report (what was done, the result, the files, what was learned); that is where the detail of a task lives, not in chat. Small grey events ("<Muse> made this task from your chat", "Scout started on it"). Update cards with the author's avatar, name, "posted an update" / "asked you" / "reported a result", the time, the body, and attached files as chips. A question card is peach. The user's comments have a blue-grey header and show replies indented under them. Each card has a "Reply" link that opens a small box.
7. **The comment box**: "[you] Add a comment for <Muse> and Penny…" with a "Comment" button and a small line "Your comment stays with this task." Posting stores a `task_updates` row (`author = you`, `kind = comment`, `unread_by_agent = 1`). Note pages have their own comment box.
8. **Files from this task**: chips that open the file; "No files yet. They show up here when Penny finishes." when empty.
9. Footer: "[avatar] Managed by <Muse> · worked on by Penny".

## Team (`/team`)

1. Header: kicker "Who does the work", title "Team", lede "<Muse> runs <current count> specialists for you. Ask <Muse> to hire, retrain, pause, or retire one."
2. The **chief of staff's card** on top, wide: the Muse's avatar (large), name, "Chief of staff", one line: "<Muse> talks with you, runs the team, and handles the everyday one-offs itself.", and "Wearing the Chief of Staff hat from Tinyhat".
3. A grid of **specialist cards**, two across: avatar, name, role; the one-line job; a status pill worked out from the tasks (green "Working on …", grey "Next: …", peach "Waiting on you: …", or "Free right now"); the two latest finished tasks with their time. Tapping a card opens its detail.
4. The **detail panel** (right on desktop, under the tapped card on a phone): avatar, name, "Bookkeeper · wears a navy bowler"; "How Penny works" (three bullets); "Never" (one); "Skills" (chips); "Last rule learned" (a highlighted line); and "To change how Penny works, or to pause Penny, tell <Muse> in chat."
5. One quiet dashed card in the last grid slot names the current team's coverage, then invites the person to ask <Muse> in chat for another specialist or a change.

No statistics strip, no project chips, no counts.

## Customers (`/customers`)

1. Header: kicker "Your people", title "Customers & leads", lede "Scout keeps this list current from what you tell it and from your work email, and drafts every follow-up."
2. The **funnel**: four connected blocks left to right, each a soft tint of the customers colour getting stronger to the right: Leads 7, Talking 4, Proposal 2, Customer 6, each with a big number, the stage name, and a small movement line ("+3 this month", "+1", "1 waiting on you", "+2 · $6,300"). One sentence under it: "Sunny brings people in; Scout moves them along; you say yes before anything is sent."
3. Two cards side by side: **Follow up this week** (waiting-on-you first, then due soonest: avatar initials, name · company, the next step, and the day on the right in orange when it waits on the user) and **Lately** (the last touches the team logged).
4. The **people table**: Person (initials, name, company), Stage (a pill), Last contact ("Email · Sep 18"), Next step (bold, with the day under it in orange when waiting on the user). Tapping a row opens the **detail panel**: initials, name, title · company, stage pill; "Next step" in a peach box; "Timeline" (touches, newest first, the waiting one with an orange dot); "Notes"; and "To change anything here, tell <Muse>, for example 'move Sarah's follow-up to next Thursday.'"

Eight to ten people is the right size for the table. Stage pills: Lead (sand), Talking (sage), Proposal (green), Customer (dark green), Past (grey); a person kept outside the funnel (`in_funnel = 0`: the person themselves, the maker of the hat) shows a plain "Contact" pill, has no "Became …" line, and is counted in no block.

## Reports (`/reports`)

1. Header: kicker "How things are going", title "Reports", and one line saying the team will add charts from verified work sources.
2. If anything waits on the user, one orange line that links to the task and says to open it to answer.
3. On the first visit, **Around the world** leads with four sourced visual charts: bars for population and recorded music, a timeline for women at the Paris Games, and a donut for Earth's ocean/land share. Do not lead with empty business cards or textual chart substitutes.
4. Section **Your business** appears once real figures exist: "Website visitors and inquiries" (bars per week with the inquiry count under each), "New customers" (grouped bars per month: new leads, new customers), "Money owed to you" (a list of unpaid invoices with due dates), "Money in and out" (grouped bars per month).
5. Section **Your money** appears once real figures exist: "Spending by category, each week" (stacked bars with an average line and a legend), "Bills coming up" (a dated list; "Waiting on your OK" in orange), "Subscriptions" (horizontal bars; unused ones striped and flagged), "Savings the team found" (a big number, then "Saved" rows and "Waiting on you" rows in peach).
6. Every visible card: title, one-line description, a big number with a comparison line, the visual report, and a source line with the owner's avatar or a public source link.
7. Footer: ask <Muse> in chat for a report about your work. Once its source is verified, it appears here as a chart.

Charts are inline SVG. Axis text 12px grey. Series colours are the projects' darker shades so the charts and the board agree.

## Notes (`/notes` and `/notes/<slug>`)

The find page: header (kicker "What the team has learned, written down for you"), a large search box, filter rows "Project", "Kept by" (chips with avatars), and "Tags" (the most used tags as `#tag` chips), a count line, and a grid of note cards (project, title, excerpt, up to four tags, kept by · updated). The pinned "Start here" note spans two columns. Searching filters as you type, matches tags too, and highlights matches.

A note's page: breadcrumb "Notes / Website / Brand guide"; the project label; a large title; the lede; "Kept by Pastel · Updated 2 days ago · 1 min read"; the tags as `#tag` chips that filter the find page; the **rendered GitHub-flavored Markdown body** (headings, links, bold text, lists, tables, code, small inline SVG visuals, and fenced `mermaid` diagrams); "Came from these tasks" as sticky-note chips that open the tasks; a comment thread and box for questions and corrections; and "To change this note, tell <Muse> in chat." On the right, "On this page" (the headings) and "More in Website". A Markdown table must appear as an actual table; `**bold**` must appear bold; a Mermaid fence must draw a diagram. Invalid Mermaid source stays visible as code for correction. Never show the Markdown punctuation as ordinary prose.

## Times

Relative within a week ("just now", "20 min ago", "2 hours ago", "yesterday", "3 days ago"), then a date ("Sep 12"). Due dates read "due Thursday" or "Fri, Oct 2".

## Comments and completed results

Every comment form explains who follows up and where their reply appears.
Show the configured interval only after the scheduled job is verified; otherwise
say the user can ask Muse to enable checks. A saved comment says “awaiting
reply,” never “agent started.” Refresh replies without losing a draft.

On a completed task, lead with **What changed**, **What was checked**, and an
openable result when available. Older completed tasks with no evidence must
say the summary is missing. The form offers **Request changes — reopen this
task**; submitting a correction immediately moves Done to In progress and
clears current completion claims while preserving history. An ordinary comment
such as thanks does not reopen work. A screenshot can accompany task feedback:
PNG/JPG/WebP up to 4 MB, stored privately, not an arbitrary executable upload.

Voice summaries and update chats are personal preferences managed by Muse,
not a forced mode in the app. Explain that the user can ask for them.
