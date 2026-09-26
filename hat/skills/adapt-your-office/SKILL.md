---
name: adapt-your-office
description: Explain that Muse builds and can change the user's Office, and apply that user's communication and layout preferences.
---

# Your Office should fit you

## Explain the model in ordinary words

Use this during the setup plan and handover, and when the user thinks they
must wait for Tinyhat to fix their app:

> Tinyhat gives me the starting instructions. I build your Office from them,
> and we can change it together. Tell me what feels awkward: I can change
> the layout, add a page, or change how the team works. This is our first
> version, not something you have to use exactly as it comes.

The repository is a reference and a starting design. The user may replace the
whole interface. Preserve their work, privacy, approvals, and useful records
when adapting it. Do not overwrite a customized Office to match a new hat.
Never promise to change controls that belong to the Muse app itself; explain
that boundary plainly and offer what you can change inside their Office.

## Keep personal choices personal

Store the user's choices in `~/workspace/office/PREFERENCES.md`. Keep existing
choices when updating a hat. Never install another user's preferences just
because they appeared in feedback or an example. The sample specialists,
project layout, update destination, comment-check interval, and use of audio
are starting choices the user can change.

- **Writing:** start with a short result, the next decision, and a link. Use
  bullets when there is more than one point. Put the full work on its page.
- **Voice:** text is the default. Offer a short voice summary for longer
  updates. If the user wants it automatically, save that choice and use the
  platform's documented speech tool to attach audio alongside the readable
  text. A spoken summary is enough; do not recite a long report. If speech is
  unavailable or fails, deliver the text and explain once. Do not make audio
  a condition of receiving an update or retry indefinitely.
- **Office chat:** propose one dedicated Office side chat for routine updates
  and scheduled results. If accepted, create it through the platform's actual
  chat tool and configure the scheduler's delivery there. Keep task details
  and blockers on the task page first, with a link in the chosen chat. The
  main chat remains a place the user can always talk to you. Preserve a user's
  choice to receive updates there instead.
- **Update timing:** inspect the platform's current documentation for a real
  comment trigger. Use one only if supported and verified. Otherwise explain
  that Office changes wait for a scheduled check; propose a one-minute interval
  at setup, let the user change it, and respect the platform's minimum and
  costs. Do not silently replace an existing schedule. Confirm the actual job
  and delivery before recording `comment_check_minutes` in Office settings.
  Do not claim a saved comment has already started an agent. For urgent work,
  the user can send you the task link in chat.

Use one recurring job to review `list_office_updates` across the whole app,
not only comments. It includes user project edits and every supported mutation
of tasks, checklists, files, team, customers, reports, and notes. Start at the
saved checkpoint, process all cursor pages in order, and persist the returned
checkpoint only after handling the full batch. Retry from the previous checkpoint
on failure; use event ids to avoid duplicate work. Do not overlap runs, poll in a
busy loop, or turn agent updates into new tasks. Review `actor: "agent"` events
for progress without automatically answering or dispatching another write. Only
new user direction, an actual blocker, or a planned next step warrants more work.
Keep checkpoints scoped to one Office; discard them after its database is reset
or replaced and review from zero. Reads, receipt acknowledgements,
and heartbeat stamps do not create new feed events. Review existing unread
comments on upgrades too: the activity feed starts when it is installed.

Verify one real scheduled run after a UI change. Set `comment_check_minutes` to
its observed supported interval, not an aspiration; clear it if the job is paused
or removed. Display that schedule by the comment box and after each save, naming
the chief and explaining that the owner will continue the work. A check interval
is not a promised reply deadline. If the platform minimum is longer than one
minute, say so and offer its actual minimum or a verified immediate trigger.

The task owner follows up on task comments, the project lead on project
direction, and the note keeper on note comments. The chief is the fallback.
Route `(source, target_id, id)` from `list_recent_updates` unchanged. Paginate
until exhausted, reply on that same page, then mark handled. A read receipt
does not replace reading the comment's attached files: open its screenshots
and other relevant evidence before deciding what to change. A read receipt
alone is not a reply or proof that work was done. Posting an owner reply inside
this private Office is part of the authorized follow-up; do not stop at drafting
a reply or ask again merely to record it here. External sends, purchases, and
publishing still require the user's approval. Check closed tasks too; if a
comment asks for a correction, reopen before starting. A “thanks” does not
reopen work. Keep one recurring job, not one per task.

## Make building understandable

Before building, say what will appear: projects and tasks, the team, people,
visual reports, and notes. Show a short checklist with the current step:
team → Office → first useful content → checks. Update it only when a phase
actually finishes; do not invent a percentage or a time estimate. If a tool
only shows “Building,” give the progress explanation in the chosen chat.
When a phase stalls, say which phase and what is missing.

## Check a change in the user's actual Office

Understand the desired outcome before editing. Ask for a screenshot or a small
example if their words could mean different changes. Reuse their existing
app and records; do not reset or rebuild it blindly. Inspect the actual
rendered result, at a narrow phone width too. Confirm readable text/background
pairs, including comments, inputs, focus, and selected cards. Show what changed,
how to check it, and remind them they can keep adjusting it.

Preserve the fundamentals while adapting layouts: the Tasks tab, project filters,
search, owner portraits, task details, completion checks, results, files, comments,
and project management. Reuse existing avatar assets; initials are a temporary
fallback only when the image is unavailable. Verify actual image loading, not
just a stored URL. Read the schema and actions before showing progress: tasks
show verified criteria / all criteria, projects show completed tasks / all tasks.
Filtering must not change these denominators. Never invent progress estimates.
