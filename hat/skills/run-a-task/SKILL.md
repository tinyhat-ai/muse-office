---
name: run-a-task
description: How work routed into Office moves from a card to a verified result.
---

# Run a task

Use this after routing a request into Office because it needs specialists,
team coordination or ongoing follow-up and visibility. Simple jobs you can
finish yourself stay in chat. Follow `SOUL.md` ("Route work into Office when
needed"). Check `list_tasks` and reuse the matching task before creating
another; a chat answer or change belongs on that task. Create its record before starting
or dispatching work, then brief every worker to use it. Update relevant
reports with verified figures and save reusable decisions in linked, tagged
notes. Read back these records and the result before moving the task to Done
or reporting completion in chat.

1. Create the task in Office (create_task) with: project, title, its owner
   (the specialist from process.md, or you for chief-owned follow-up), step
   (which process step it is on),
   job_definition (what and why, in plain words), original_request (the
   user's own words), note (a brief card summary), overview (the current
   snapshot for the person), and, when useful,
   done_when (a short checklist) and plan (the steps, one marked "now").
   The person opens this task to see what is happening and what remains,
   not to read the workers' whole conversation. At each meaningful change,
   update_task: keep note and overview current, tick verified done_when items, move
   plan's "now", and change step. Read get_task first and preserve the
   original job definition and existing checks/states unless the user's goal
   changes; supplied checklist and plan arrays replace the saved lists.
   You, the chief, own the overview's clarity. In a few plain-language sentences,
   say what has happened, what comes next and whether the person is needed.
   Leave internal coordination and detailed evidence in Updates, closed by
   default. Use Markdown, a diagram or SVG when it helps explain the current
   state. Distill verification into outcomes; keep audit logs, record IDs and
   policy diagnostics in Updates rather than copying them into the overview.
   Optional overview_html can supply a compact self-contained visual
   in the app's sandbox. Keep a readable explanation in overview and verify
   the visual on a phone. No jargon, repeated log entries or invented progress.
   Prefer static visuals; add scripts only for useful interaction, with bounded
   work that leaves the Office's comment/reply controls responsive.
   Put links in overview; a visual cannot open another document.
2. If specialist work is needed, start a worker for that specialist. For a
   chief-owned follow-up, do the work yourself and keep the same task current
   without creating an unnecessary worker. Brief a specialist with exactly
   four things:
   - the task card
   - ~/workspace/office/team/<name>/AGENT.md and its skills/
   - ~/workspace/office/projects/<slug>/process.md
   - ~/workspace/office/projects/<slug>/memory.md
   Never the whole conversation. If a worker inherits the chat it starts
   in, start it outside the main chat (a project chat, opened when this
   first task starts there, not before).
3. The owner posts progress as updates on the task's page (add_task_note),
   moves the card (move_task), and saves files under
   ~/workspace/office/projects/<slug>/files/.
   Anything worth remembering goes into that project's memory.md only.
   If something looks like it belongs to another project, the worker asks
   you instead of guessing.
4. Choose and maintain the task's lane using `SOUL.md` ("Keep the office true"),
   including when a blocker appears or clears. Before waiting on the user,
   inspect the task's comments, attachments,
   recorded approvals and actual outputs. A reply may already answer the
   question or choose the task; an installed approved portrait may resolve
   an old setup blocker. Continue within that authorization rather than
   asking again. If a step still needs the user, including the first step of
   a chief-owned task, move the card to Waiting on you before asking in chat.
   Use one clear question (move_task posts it on the task's page). They may answer in either
   place. For a chat answer, the chief records the exact words and approval
   scope as its own `add_task_note` update and in the private checkpoint
   before acting; never fabricate a comment authored by the user. Workers
   and the scheduled check do not inherit chat. An answer on the page is a reply to that question, so read
   which question it answers before you act on it.
5. When the work is ready, check the result against the job definition and
   any done_when checklist before telling the user, including work you
   handled yourself. If a worker's result falls short, send it back once
   with one clear note.
   If it still falls short, keep the task open with the blocker. After the
   result passes, the task's page gets the closing report (add_task_note, kind
   update): what was done, the result, the files (attach_file, or a link to
   a file artifact), and what was learned. Update note and overview to the
   brief verified result and keep any visual/checks consistent with it, so
   the person can understand the outcome without opening Updates.
   A file that only sits on your
   computer is not an output the user can see. Only then move_task to done.
6. If a specialist did the work, it writes what it learned about this kind
   of work for this user into its own AGENT.md, skills, or memory.md (one rule
   per line). Check that it did. If the lesson is a project matter, it goes into the
   project's process.md or memory.md instead.
7. Tell the user in one line, with a link to the result or the task's page.

Run up to 3 tasks at the same time. More waits in To do.

Follow `skills/follow-through/SKILL.md` while work is open. Dispatching a
worker or replying to a comment is not the end of your responsibility. Keep
the next action and owner on the task and verify the actual result before Done.

The actions named here (create_task, update_task, move_task, add_task_note,
attach_file, upsert_note, list_recent_updates, reply_to_comment) are defined
with their arguments in spec/ACTIONS.md of the repository. An action that
refuses tells you what was wrong and what the valid values are; correct the
call instead of asking the user. For a comment reply or read receipt,
re-read the original `list_recent_updates` item and copy its `source`,
`target_id`, and `id` together. Never change one of those fields just to
make a refused call pass.
