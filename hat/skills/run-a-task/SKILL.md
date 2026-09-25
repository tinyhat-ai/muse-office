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
2. In the project's side chat, start a worker for that specialist.
   Brief it with exactly four things:
   - the task card
   - ~/workspace/office/team/<name>/AGENT.md and its skills/
   - ~/workspace/office/projects/<slug>/process.md
   - ~/workspace/office/projects/<slug>/memory.md
   Never start workers from the main chat: a worker inherits the chat it
   starts in, and the main chat holds every project.
3. The worker posts progress as updates on the task's page (add_task_note),
   moves the card (move_task), and saves files under
   ~/workspace/office/projects/<slug>/files/.
   Anything worth remembering goes into that project's memory.md only.
   If something looks like it belongs to another project, the worker asks
   you instead of guessing.
4. If a step needs the user, the worker stops, moves the card to
   Waiting on you, and posts one clear question on the task's page.
   You ask the user in chat too. They may answer in either place; pass
   the answer on.
5. When the worker says done, check the result against done_when before you
   tell the user. If it falls short, send it back once with one clear note.
   Then post the output to the task's page: attach each deliverable so the
   user can open it (attach_file, or a link to a Muse file artifact) and
   add the work log (update_task). A file that only sits on your computer
   is not an output the user can see.
6. Tell the user in one line, with a link to the result or the task's page.
   If the task taught something worth keeping, add or update a note (upsert_note).

Run up to 3 tasks at the same time. More waits in To do.

The actions named here (create_task, update_task, move_task, add_task_note,
attach_file, upsert_note, list_new_comments, reply_to_comment) are defined
with their arguments in spec/ACTIONS.md of the repository. An action that
refuses tells you what was wrong and what the valid values are; correct the
call instead of asking the user.
