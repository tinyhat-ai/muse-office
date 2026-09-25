# The pages

Five pages in one top bar: **Projects · Team · Customers · Reports · Notes**, with "Updated x ago" on the right. Plus a page for each project, each task, and each note. The user looks; the Muse changes things. Wherever a control would normally be, one quiet line says: "To change this, tell <your Muse's name> in chat."

Every page opens with the same header: a small kicker line, a large title, one line of lede. Then the content. Nothing is hidden behind tabs inside a page.

## Projects (`/projects`)

The board. It opens straight on the tasks.

1. A row of **project tiles**: "All projects" (white) then one tile per project, a plain rounded tile filled with the project's colour, the name at the top left, the task count at the bottom left. Tapping a tile filters the board; the chosen tile gets a thin ink outline. When a project is chosen, a line under the tiles reads "Website · led by Patch" with a link "Open the Website page →".
2. **Four lanes**: To do, In progress, Waiting on you, Done. Each lane has a coloured top rule (grey, blue-grey, orange, green), a title, a one-line subtitle ("Not started yet", "Working or in review", "Needs your answer", "Finished this week"), and a round count badge. The Waiting lane's title and badge are orange, with a faint peach wash behind the lane.
3. **Cards are sticky notes**, one readable card across each lane, in the project's colour. See `spec/DESIGN.md` for the exact look. A card shows: the project name with a small colour bar; the title in bold; one short note (the question, as a small white pill, when it waits on the user); at the bottom the specialist's small round avatar and name on the left and the time on the right ("2 hours ago", "due Thursday", "waiting 3 hours"). A done card shows "✓ Done · 2 days ago" instead of the specialist.
4. An empty lane shows a dashed box: "No tasks", or "Nothing needs your answer right now" for the Waiting lane.
5. On a phone the lanes stack, Waiting on you first, and the tiles scroll sideways.

Tapping a card opens the task's page.

## A project's page (`/projects/<slug>`)

1. Breadcrumb "Projects / Website".
2. A colour bar, the project name, its one-line description, and three small pills: "[avatar] Led by Patch", "Runs like: build", "2 open" (plus "1 waiting on you" in orange when true).
3. **How it runs**: the steps as a horizontal row of round nodes, each with the doer's avatar (or a "you" ring for the user's steps), the step name, and the doer's name. A small badge on a node counts the open tasks at that step. Steps that need the user's OK carry a small orange "your OK" tag. On a phone the row becomes a vertical list.
4. The **process text**, rendered from markdown: "How Website runs", "Done when", "Rules learned" (each rule dated, with "from you" or "<Muse> suggested · you OK'd"), then one line: "Written and kept current by <Muse>. It changes when you correct something."
5. A side list **Right now**: the open tasks with their column pill. Tapping one opens the task.

## A task's page (`/tasks/<id>`)

Like an issue page, top to bottom:

1. Breadcrumb "‹ Projects / Money". The project name with its colour bar. The title, large. A status line: the column (orange dot for Waiting on you), "[avatar] Penny is on it", "Waiting 3 hours" or "Updated 2 hours ago", and "Due Thursday" when set.
2. **When the task waits on the user**, the unanswered question is pinned right here, in a peach card: "[avatar] Penny asked you · 3 hours ago", the question, and either two buttons for a `money` question ("Yes, pay $1,240 on Sep 28" / "Not yet") or a "Reply to Penny" button, plus one line saying what a yes does. It disappears once answered.
3. **What this is**: the job definition. A collapsed "Original request" with the user's own words.
4. **Done when**: a checklist; met items show a green check.
5. **Plan**: a numbered list; the current step is bold with "· now"; done steps are grey.
6. **Conversation**: a vertical timeline. The last update before a task was moved to Done is its closing report (what was done, the result, the files, what was learned); that is where the detail of a task lives, not in chat. Small grey events ("<Muse> made this task from your chat", "Scout started on it"). Update cards with the author's avatar, name, "posted an update" / "asked you" / "reported a result", the time, the body, and attached files as chips. A question card is peach. The user's comments have a blue-grey header and show replies indented under them. Each card has a "Reply" link that opens a small box.
7. **The comment box**: "[you] Add a comment for <Muse> and Penny…" with a "Comment" button and a small tag "The one place you can write in Office". Posting stores a `task_updates` row (`author = you`, `kind = comment`, `unread_by_agent = 1`).
8. **Files from this task**: chips that open the file; "No files yet. They show up here when Penny finishes." when empty.
9. Footer: "[avatar] Managed by <Muse> · worked on by Penny".

## Team (`/team`)

1. Header: kicker "Who does the work", title "Team", lede "<Muse> runs five specialists for you. Ask <Muse> to hire, retrain, pause, or retire one."
2. The **chief of staff's card** on top, wide: the Muse's avatar (large), name, "Chief of staff", one line: "<Muse> talks with you, runs the team, and handles the everyday one-offs itself.", and "Wearing the Chief of Staff hat from Tinyhat".
3. A grid of **specialist cards**, two across: avatar, name, role; the one-line job; a status pill worked out from the tasks (green "Working on …", grey "Next: …", peach "Waiting on you: …", or "Free right now"); the two latest finished tasks with their time. Tapping a card opens its detail.
4. The **detail panel** (right on desktop, under the tapped card on a phone): avatar, name, "Bookkeeper · wears a navy bowler"; "How Penny works" (three bullets); "Never" (one); "Skills" (chips); "Last rule learned" (a highlighted line); and "To change how Penny works, or to pause Penny, tell <Muse> in chat."
5. One quiet dashed card in the last grid slot: "These five cover your website, marketing, customers, and money. Need someone new, or a break? Ask <Muse> in chat."

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
3. On the first visit, **Around the world** leads with three actual bar charts and linked sources: world population, women at the Olympics, and recorded music revenue. Do not lead with empty business cards or textual chart substitutes.
4. Section **Your business** appears once real figures exist: "Website visitors and inquiries" (bars per week with the inquiry count under each), "New customers" (grouped bars per month: new leads, new customers), "Money owed to you" (a list of unpaid invoices with due dates), "Money in and out" (grouped bars per month).
5. Section **Your money** appears once real figures exist: "Spending by category, each week" (stacked bars with an average line and a legend), "Bills coming up" (a dated list; "Waiting on your OK" in orange), "Subscriptions" (horizontal bars; unused ones striped and flagged), "Savings the team found" (a big number, then "Saved" rows and "Waiting on you" rows in peach).
6. Every visible card: title, one-line description, a big number with a comparison line, the visual report, and a source line with the owner's avatar or a public source link.
7. Footer: ask <Muse> in chat for a report about your work. Once its source is verified, it appears here as a chart.

Charts are inline SVG. Axis text 12px grey. Series colours are the projects' darker shades so the charts and the board agree.

## Notes (`/notes` and `/notes/<slug>`)

The find page: header (kicker "What the team has learned, written down for you"), a large search box, filter rows "Project", "Kept by" (chips with avatars), and "Tags" (the most used tags as `#tag` chips), a count line, and a grid of note cards (project, title, excerpt, up to four tags, kept by · updated). The pinned "Start here" note spans two columns. Searching filters as you type, matches tags too, and highlights matches.

A note's page: breadcrumb "Notes / Website / Brand guide"; the project label; a large title; the lede; "Kept by Pastel · Updated 2 days ago · 1 min read"; the tags as `#tag` chips that filter the find page; the **rendered GitHub-flavored Markdown body** (headings, links, bold text, lists, tables, code, small inline SVG visuals, and fenced `mermaid` diagrams); "Came from these tasks" as sticky-note chips that open the tasks; and "To change this note, tell <Muse> in chat." On the right, "On this page" (the headings) and "More in Website". A Markdown table must appear as an actual table; `**bold**` must appear bold; a Mermaid fence must draw a diagram. Invalid Mermaid source stays visible as code for correction. Never show the Markdown punctuation as ordinary prose.

## Times

Relative within a week ("just now", "20 min ago", "2 hours ago", "yesterday", "3 days ago"), then a date ("Sep 12"). Due dates read "due Thursday" or "Fri, Oct 2".
