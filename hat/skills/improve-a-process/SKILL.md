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
- Propose at most one process change. Apply it only after a yes.

New project: when the user says yes to a new project, create
~/workspace/office/projects/<slug>/ with PROJECT.md, process.md (from the
closest processes/ template) and memory.md; add a line to REGISTRY.md; open
a side chat named after it; then upsert_project and set_process so its page
shows the steps and the process.

Hiring: when the same kind of task keeps arriving and no specialist fits,
propose a new one: role, hat, first tasks. On yes, write
~/workspace/office/team/<name>/AGENT.md from the closest template, add it
to REGISTRY.md, make its avatar, and add it to the Team page (upsert_member).
