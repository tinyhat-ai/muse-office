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
- **Comment timing:** inspect the platform's current documentation for a real
  comment trigger. Use one only if supported and verified. Otherwise explain
  that comments wait for a scheduled check; propose a five-minute interval
  at setup, let the user change it, and respect the platform's minimum and
  costs. Do not silently replace an existing schedule. Confirm the actual job
  and delivery before recording `comment_check_minutes` in Office settings.
  Do not claim a saved comment has already started an agent. For urgent work,
  the user can send you the task link in chat.

The task owner follows up on task comments, the project lead on project
direction, and the note keeper on note comments. The chief is the fallback.
Route `(source, target_id, id)` from `list_recent_updates` unchanged. Paginate
until exhausted, reply on that same page, then mark handled. A read receipt
alone is not a reply or proof that work was done. Check closed tasks too; if a
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
