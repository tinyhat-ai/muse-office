---
name: improve-a-process
description: Keep processes and the team fitted to the user. Use after a correction, every Monday, and when work does not fit the team.
---

# Improve a process

Use this skill whenever the user asks to add, change or retire a
specialist, including a temporary test member. A Team card is a view of the
agent, not its briefing, skills or memory. Use the existing member actions;
do not rebuild the app or add a one-off action for each requested person.

After a correction: when the user corrects how something was done, add a
line under "Rules learned" in that project's process.md (or, when it is
about how a specialist works, in that specialist's AGENT.md and
set_member_rule), dated, and send the new text to the project's page
(set_process). Keep specialty rules out of your own general memory: the rule
lives where that kind of work lives. A correction to the approved Office
working agreement belongs in your existing `chief-of-staff` skill and memory
entry instead; follow HAT.md step 2 and preserve other personal rules.
Read back the changed file and Office rule before saying the preference is
saved. Include that updated context in the specialist's next brief.
Say: "Noted — I updated how <project> runs."
or "Noted — <specialist> now does it that way."

Every Monday:
- Review the reports and send the user a three-line summary in chat:
  what came in, what went out, what the team saved.
  Relevant verified figures are kept current as work happens under SOUL.md;
  Monday is a review, not the first time reports are updated.
- List cards that did not move for 2 days and say why.
- Read each specialist's AGENT.md and memory.md: every lesson from last
  week's tasks is written down there, one rule per line, and stale rules
  are gone. Tidy what piled up. Specialist and project techniques stay in
  those files; your own memory keeps the approved working agreement.
- Propose at most one process change. Apply it only after a yes.

New project: when the user says yes to a new project, create
~/workspace/office/projects/<slug>/ with PROJECT.md, process.md (from the
closest processes/ template) and memory.md; add a line to REGISTRY.md;
then upsert_project and set_process so its page shows the steps and the
process. No chat for it until its first task starts.

Hiring: when the same kind of task keeps arriving and no specialist fits,
propose a new one: role, mascot, first tasks. On yes, create
~/workspace/office/team/<name>/ with AGENT.md from the closest template,
its own skills/ and memory.md. Add it to REGISTRY.md, make its distinct
mascot image, and create its Team row with `upsert_member` without `avatar_url`.
Then follow `hat-avatar` to import the portrait into durable private assets,
install it with `set_member_avatar(slug, avatar_url)`, and check the returned
stored row and reopened pages. Check the files and loaded portrait before
saying the agent is ready. A new specialist follows `set-up-office` step 3's
usable skill-file and roster checks too. Being temporary does not waive its
files or portrait checks. Keep any unavailable part as an open setup task,
and report that exact gap rather than calling the agent ready. A relationship
record in your own memory is not the agent's working memory.

Changing a specialist: keep the same registered slug and folder. Update its
AGENT.md, relevant skills and REGISTRY.md to reflect the approved name, role
or job, preserving its learned rules and memory. Use `upsert_member` for that
same member and read back its returned row, its files and Team. Do not add a
second member or change unrelated agents or records.

Retiring: on the user's yes, reassign the specialist's open tasks and
notes, including their comment follow-ups. Update REGISTRY.md and any
project process steps that name them, then call remove_member. Keep their
folder and learned memory until the user separately asks to delete them.
