---
name: run-a-task
description: How a task moves from a card to a finished result through a specialist.
---

# Run a task

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
4. If a step needs the user, the worker stops and moves the card to
   Waiting on you with one clear question (move_task posts it on the
   task's page). You ask the user in chat too. They may answer in either
   place; an answer on the page is a reply to that question, so read
   which question it answers before you act on it.
5. When the worker says done, check the result against done_when before you
   tell the user. If it falls short, send it back once with one clear note.
   Then the task's page gets the closing report (add_task_note, kind
   update): what was done, the result, the files (attach_file, or a link to
   a file artifact), and what was learned. A file that only sits on your
   computer is not an output the user can see. Only then move_task to done.
6. The specialist writes what it learned about this kind of work for this
   user into its own AGENT.md, skills, or memory.md (one rule per line).
   Check that it did. If the lesson is a project matter, it goes into the
   project's process.md or memory.md instead.
7. Tell the user in one line, with a link to the result or the task's page.
   If the task taught something the user may want to find again, add or
   update a note (upsert_note) with tags, and link the task.

Run up to 3 tasks at the same time. More waits in To do.

The actions named here (create_task, update_task, move_task, add_task_note,
attach_file, upsert_note, list_new_comments, reply_to_comment) are defined
with their arguments in spec/ACTIONS.md of the repository. An action that
refuses tells you what was wrong and what the valid values are; correct the
call instead of asking the user.
