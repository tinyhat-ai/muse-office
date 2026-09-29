# The pages

Five pages in one top bar: **Tasks · Team · Customers · Reports · Notes**, with "Updated x ago" on the right. Plus a page for each project, each task, and each note. The user looks; the Muse changes things. Keep the existing reference layout and avoid adding standing helper text. Contextual comments are the only input exception.

Every page opens with the same header: a small kicker line, a large title, one line of lede. Then the content. Nothing is hidden behind tabs inside a page.

## Tasks (`/projects`)

The board. It opens straight on the tasks.

1. A row of **project tiles**: "All projects" (white) then one tile per project, a plain rounded tile filled with the project's colour, the name at the top left, the task count at the bottom left. Tapping a tile filters the board; the chosen tile gets a thin ink outline. Each project tile has a small link icon opening its existing project page; only the chosen tile shows a muted "Details" label to the left of the icon. "All projects" only filters. Keep the original square sizes and leave padding for the outline. When a project is chosen, the existing line under the tiles reads "Website · led by Patch".
2. **Four lanes**: To do, In progress, Waiting on you, Done. Each lane has a coloured top rule (grey, blue-grey, orange, green), a title, a one-line subtitle ("Queued work", "Working or in review", "Needs your answer", "Finished this week"), and a round count badge. The Waiting lane's title and badge are orange, with a faint peach wash behind the lane.
3. **Cards are sticky notes**, one readable card across each lane, in the project's colour. See `spec/DESIGN.md` for the exact look. A card shows: the project name with a small colour bar; the title in bold; one short note (a waiting question appears directly on the paper with a small orange dot, without a bubble); at the bottom the specialist's small round avatar and name on the left and the time on the right ("2 hours ago", "due Thursday", "waiting 3 hours"). A done card shows "✓ Done · 2 days ago" instead of the specialist.
4. An empty lane shows a dashed box: "No tasks", or "Nothing needs your answer right now" for the Waiting lane.
5. On a phone the lanes stack, Waiting on you first, and the tiles scroll sideways.

Tapping a card opens the task's page.

Before hand-over, filter by each initial project and open its separate link.
Check the correct project page opens and the selected tile still shows its
task count, secondary Details text, and entire icon at phone and Muse-panel
widths. Use the non-overlap checks in `spec/DESIGN.md`; a working click alone
does not establish that the selected tile fits.

## A project's page (`/projects/<slug>`)

1. Breadcrumb "Tasks / Website".
2. A colour bar, the project name, its one-line description, and three small pills: "[avatar] Led by Patch", "Runs like: build", "2 open" (plus "1 waiting on you" in orange when true).
3. **How it runs**: the steps as a horizontal row of round nodes, each with the doer's avatar (or a "you" ring for the user's steps), the step name, and the doer's name. A small badge on a node counts the open tasks at that step. Steps that need the user's OK carry a small orange "your OK" tag. On a phone the row becomes a vertical list.
4. The **process text**, rendered from markdown: "How Website runs", "Done when", "Rules learned" (each rule dated, with "from you" or "<Muse> suggested · you OK'd"), then one line: "Written and kept current by <Muse>. It changes when you correct something."
5. A shared comment thread and input below the process text, using the same component and attachment/keyboard behavior as task and note pages. Replies at any depth stay visible under the original comment.
6. A side list **Right now**: the open tasks with their column pill. Tapping one opens the task.

## A task's page (`/tasks/<id>`)

Top to bottom, with the current state visible before detailed history:

1. Breadcrumb "‹ Tasks / Money", the project colour bar and name, then the title. The rendered job definition follows without another heading. Long descriptions start collapsed (96px on phones, 160px on desktop), with "Show more" only when needed; the full description remains available.
2. **Current overview** directly after the description: the column (orange dot for Waiting on you), "[avatar] Penny is on it", updated/waiting time, optional due date, and a current snapshot in `tasks.overview`. The chief keeps this understandable without reading agent history: what has happened, what comes next and whether the person is needed. Render sanitized Markdown, including Mermaid diagrams and inline SVG when useful. An optional self-contained `overview_html` visual appears in an isolated, responsive sandbox with inline styles/scripts, no same-origin privilege, remote resources, API fetches or forms. Every Office page must also enforce `Content-Security-Policy: frame-src 'none'` (a response header on each page, or an early meta policy in a generated app shell), so scripts, links and meta refresh cannot navigate its frame to an external document. In-app navigation keeps the first loaded page's policy, so task responses alone miss a task opened from the board. Keep a brief readable explanation in `overview`; do not put the whole activity log in either field. Without an overview, show `note` or the current plan step, without inventing progress. Preserve the original job definition. No extra overview heading or helper paragraph.
   Use `src/components/task/TaskVisual.tsx` and `src/lib/task-visual.ts` as the visual's reference. Keep `overview_html` inside that isolated document; do not pass it through the Markdown sanitizer, which strips the inline scripts needed for useful interaction. If the host cannot support scripted visuals safely, keep a static visual and report that limitation to the chief; do not claim the script checks passed.
   For a completed task, the worker label reads `Done by <name>` rather than `<name> is on it`; derive it from the current column instead of saving stale activity text.
3. **When the task waits on the user**, keep the current question visible in the overview, in the existing peach treatment: author/avatar, time, question and the contextual reply or money-answer controls. Do not make the user expand Updates to discover that they are needed.
4. **Done when**, only if the task has a useful checklist. Met items show a green check; unmet items show what remains. Muse updates those states against verified work. This is read-only; no percentages or checklist editor. Omit empty checklist headings and placeholder text.
5. The **Original request** and **Plan** are collapsed by default and omitted when absent. Opening Plan reveals its numbered steps and the current/completed states; no records are removed.
6. **Updates** is closed by default: one disclosure with the count of all entries, no conversation preview. Opening it reveals the full chronological history, including routine events and every reply. A task with only events still has Updates; omit it only when there are no entries. Explicit `#update-<id>` links open it and reveal the target in its original context, clear of the sticky top bar. Keep all authors, times, attachments, reply relationships and the shared input. Render sanitized GitHub-flavored Markdown: headings, emphasis, lists, quotes, tables and code appear as formatted content, not source punctuation. Ordinary updates stay flat; no padded cards or colored headers. Agents use this for detailed coordination; the chief distills meaningful changes into the overview. The closing report stays here with the result, files and learning.
7. **The comment box** stays outside the Updates disclosure and remains available when history is closed. Hide the worker log, not contextual input. "[you] Add a comment for <Muse> and Penny…" in one compact field containing paperclip, microphone and upward-arrow send icons. Use the same component on task, note and project pages and replies, with accessible names and 44px touch targets. Audio drafts have compact local Play/Pause controls before Send, including recordings after they stop. No extra input heading, shortcut hint or privacy caption. Posting stores a `task_updates` row (`author = you`, `kind = comment`, `unread_by_agent = 1`). Enter inserts a line; Shift+Enter sends, with Ctrl/Cmd+Enter retained. See `hat/skills/contextual-comments/SKILL.md` for input, host capability, and verification rules.
   All attachment entry paths append to the existing draft. Use stable item
   ids, not filenames, so same-name files can be removed independently. Clear
   the picker value after reading it to permit re-selection; preserve the
   draft on picker cancellation, validation error, or failed save. Verify choosing
   an image and audio in two separate picker visits before accepting the build.
   A failed recording attempt shows one brief local error, preserves the draft
   and restores controls; a silent catch is not a fallback. Clear recording
   state and stop any acquired stream on failure. Show Recording only after
   capture starts, never while permission is pending or after denial. Keep the
   initial composer free of warnings and help text. If recording fails after
   capturing some audio, retain that partial draft without clearing the error
   when its final data/stop events append it.
8. **Files from this task**: chips that open the file. Omit the section when empty.
9. Footer: "[avatar] Managed by <Muse> · worked on by Penny".

### Saved comment media

Task, note and project comments and replies use the same saved-media renderer.
Store each attachment's durable private reference, name, actual media type and
size with its comment (the reference app uses `/api/attachments/<id>`).
Neither a draft object URL nor an expiring signed link is a saved source.
Resolve the stored reference through the Office's own private asset reader. Render
images inline and audio as `<audio controls preload="metadata">`, without
autoplay. Where the host cannot provide a durable playable private URL, read
the complete saved bytes and create a local Blob URL with the correct type;
stop playback and revoke it on unmount, and reconstruct it on reopening.

Before hand-over, send a known-valid WAV of a few seconds, larger than one
attachment chunk, and an image. Reopen the actual comment in the Muse client:
the saved WAV must play for its full known duration and the image must show
inline. Repeat inside a reply and after reopening the app. A working draft,
another file viewer, or a player that stops early does not prove the saved
comment player works. If it fails, verify byte
count/type and the private storage reader rather than sending the person to
an external expired link or making uploads public.

## Team (`/team`)

1. Header: kicker "Who does the work", title "Team", lede "<Muse> runs <current count> specialists for you. Ask <Muse> to hire, retrain, pause, or retire one."
2. The **chief of staff's card** on top, wide: the Muse's avatar (large), name, "Chief of staff", one line: "<Muse> talks with you, runs the team, and handles the everyday one-offs itself.", and "Wearing the Chief of Staff hat from Tinyhat".
3. A grid of **specialist cards**, two across: avatar, name, role; the one-line job; a status pill worked out from the tasks (green "Working on …", grey "Next: …", peach "Waiting on you: …", or "Free right now"); the two latest finished tasks with their time. Tapping a card opens its detail.
4. The **detail panel** (right on desktop; inside the selected card on narrow screens, using the card's existing avatar and name): avatar, name, "Bookkeeper · wears a navy bowler"; "How Penny works" (three bullets); "Never" (one); "Skills" (chips); "Last rule learned" (a highlighted line); and "To change how Penny works, or to pause Penny, tell <Muse> in chat."
5. One quiet dashed card in the last grid slot names the current team's coverage, then invites the person to ask <Muse> in chat for another specialist or a change.

No statistics strip, no project chips, no counts.

For a generated Office, use one selected-member state shared by the cards and
desktop panel. Below the reference's 980px desktop layout breakpoint, render that member's
details directly inside its selected card, immediately after the summary;
hide the trailing side panel. Reuse the existing portrait/name rather than
rendering a second header inside the expansion, and add the hat to that card's
role line ("Bookkeeper · wears a navy bowler"). Selecting another member
collapses the previous details. Do not append details after the entire roster
or scroll the person to a separate bottom panel.

Before hand-over, select both the first and last specialist at 390px and in a
roughly 560px Muse artifact panel. The selected details must be visible at
that card, with one portrait/name, the hat on its role line, and no duplicate
trailing details. Repeat
at desktop width: retain the original grid and right-hand detail panel.

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

Use one Markdown/Mermaid renderer for all saved note bodies, including notes
created or edited through `upsert_note` after setup. Do not pre-render only
starter notes or display later notes as plain strings. Pass the stored
`markdown` through GFM parsing, sanitization, and the strict Mermaid renderer;
initialize diagrams again when the note body changes or a different note opens.

Verify a newly created test note through actions, not just a starter note.
Its body must have actual line breaks, a heading, bold text, a pipe table, and
a fenced Mermaid flowchart. Open it in the actual Office, reopen it, then edit
one diagram label through `upsert_note` and check the changed drawing. A raw
`get_note` response or a comment saying it renders is not visual proof. Invalid
diagram source stays readable; unsafe Markdown/diagram content remains blocked.

## Times

Relative within a week ("just now", "20 min ago", "2 hours ago", "yesterday", "3 days ago"), then a date ("Sep 12"). Due dates read "due Thursday" or "Fri, Oct 2".
