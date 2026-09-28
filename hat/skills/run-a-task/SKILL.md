---
name: run-a-task
description: How a task moves from a card to a finished result through a specialist.
---

# Run a task

Use this for work needing visibility from any chat, including work you do
yourself. Follow `SOUL.md` ("Use Office for work from every chat"). Check
`list_tasks` and reuse the matching task before creating another; a chat
answer or change belongs on that task. Create its record before starting
or dispatching work, then brief every worker to use it. Keep relevant
reports and notes consistent with verified results before reporting back.

1. Create the task in Office (create_task) with: project, title, the
   specialist from process.md, step (which process step it is on),
   job_definition (what and why, in plain words), original_request (the
   user's own words), done_when (a short checklist), and plan (the steps,
   one marked "now"). As work moves on, update_task: tick done_when, move
   plan's "now", and change step.
2. Start a worker for that specialist. Brief it with exactly four things:
   - the task card
   - ~/workspace/office/team/<name>/AGENT.md and its skills/
   - ~/workspace/office/projects/<slug>/process.md
   - ~/workspace/office/projects/<slug>/memory.md
   Never the whole conversation. If a worker inherits the chat it starts
   in, start it outside the main chat (a project chat, opened when this
   first task starts there, not before).
3. The worker posts progress as updates on the task's page (add_task_note),
   moves the card (move_task), and saves files under
   ~/workspace/office/projects/<slug>/files/.
   Anything worth remembering goes into that project's memory.md only.
   If something looks like it belongs to another project, the worker asks
   you instead of guessing.
4. Before waiting on the user, inspect the task's comments, attachments,
   recorded approvals and actual outputs. A reply may already answer the
   question or choose the task; an installed approved portrait may resolve
   an old setup blocker. Continue within that authorization rather than
   asking again. If a step still needs the user, the worker stops and moves the card to
   Waiting on you with one clear question (move_task posts it on the
   task's page). You ask the user in chat too. They may answer in either
   place. For a chat answer, the chief records the exact words and approval
   scope as its own `add_task_note` update and in the private checkpoint
   before acting; never fabricate a comment authored by the user. Workers
   and the scheduled check do not inherit chat. An answer on the page is a reply to that question, so read
   which question it answers before you act on it.
5. When the worker says done, check the result against done_when before you
   tell the user. If it falls short, send it back once with one clear note.
   If it still falls short, keep the task open with the blocker. After the
   result passes, the task's page gets the closing report (add_task_note, kind
   update): what was done, the result, the files (attach_file, or a link to
   a file artifact), and what was learned. A file that only sits on your
   computer is not an output the user can see. Refresh relevant reports
   with verified figures; add or update a linked, tagged note for a decision
   or lesson worth keeping. Read back the changed records and result.
   Only then move_task to done and report the result in chat.
6. The specialist writes what it learned about this kind of work for this
   user into its own AGENT.md, skills, or memory.md (one rule per line).
   Check that it did. If the lesson is a project matter, it goes into the
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
