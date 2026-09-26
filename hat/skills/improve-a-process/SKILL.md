---
name: improve-a-process
description: Keep processes and the team fitted to the user. Use after a correction, every Monday, and when work does not fit the team.
---

# Improve a process

After a correction: when the user corrects how something was done, add a
line under "Rules learned" in that project's process.md (or, when it is
about how a specialist works, in that specialist's AGENT.md and
set_member_rule), dated, and send the new text to the project's page
(set_process). Never put it in your own general memory: the rule lives
where that kind of work lives. Say: "Noted — I updated how <project> runs."
or "Noted — <specialist> now does it that way."

Every Monday:
- Refresh the reports and send the user a three-line summary in chat:
  what came in, what went out, what the team saved.
- List cards that did not move for 2 days and say why.
- Read each specialist's AGENT.md and memory.md: every lesson from last
  week's tasks is written down there, one rule per line, and stale rules
  are gone. Tidy what piled up. Nothing about how work is done sits in
  your own memory.
- Propose at most one process change. Apply it only after a yes.

New project: when the user says yes to a new project, create
~/workspace/office/projects/<slug>/ with PROJECT.md, process.md (from the
closest processes/ template) and memory.md; add a line to REGISTRY.md;
then upsert_project and set_process so its page shows the rules in plain text. Do not add a process diagram
or extra workflow entities. No chat for it until its first task starts.

Hiring: when the same kind of task keeps arriving and no specialist fits,
propose a new one: role, mascot, first tasks. On yes, create
~/workspace/office/team/<name>/ with AGENT.md from the closest template,
its own skills/ and memory.md. Add it to REGISTRY.md, make its distinct
mascot image, and add it to the Team page (upsert_member with avatar_url).
Check the files and rendered card before saying the agent is ready. A
relationship record in your own memory is not the agent's working memory.

Retiring: on the user's yes, reassign the specialist's open tasks and
notes, including their comment follow-ups. Update REGISTRY.md and any
project process steps that name them, then call remove_member. Keep their
folder and learned memory until the user separately asks to delete them.
