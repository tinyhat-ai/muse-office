---
name: office-product-model
description: Classify Office feedback and preserve its chat-led, minimal visualization model when changing UI, actions, schemas, or hat instructions.
---

# Improve Office without adding another management interface

## Rule one: start from the existing design

Add nothing visible by default. Make the smallest change that solves the
reported problem. Preserve layout, density, portraits, and the refined sticky
notes. Avoid extra copy, repeated labels, banners, sections, and forced line
breaks. Keep necessary save/error feedback brief and local to the action.
Operational requirements belong in agent instructions.

## What the product does

The hat provides starting instructions and a reference app. Muse builds and
adapts its user's Office. Muse owns the work system: it delegates, keeps the
records, checks results, and follows up. Office makes that work easier to see
and revisit than a long chat. Sample teams and projects can change through Muse.

Keep native Muse chat, voice, and attachments as the main input. Prefer a
supported, tested handoff that carries the current page's context into the
native composer. Never invent a deep link or assume a link preserves context.
If no supported handoff exists, use one shared contextual-comment component
on task, project, and note pages. It may accept formatted text, screenshots,
and optional voice. Keep its behavior consistent everywhere; do not build a
second general chat or separate editors for each page. These are requirements,
not a claim that every host or current app supports them yet.

Viewing, filtering, searching, opening files, and contextual replies belong in
Office. Creating or managing projects, tasks, agents, customers, reports, or
notes belongs in conversation and agent actions. A contextual comment does not
automatically change task status or grant blanket permission.

## Classify feedback before changing anything

- **A failure during use is a bug.** Fix broken shortcuts, unreadable text,
  missing expected attachment input, lost context, or comments that receive
  no real follow-through in focused bug PRs. Verify the reported path.
- **A new product structure is a decision.** Put proposals for new workflows,
  screens, navigation layers, metrics, or management controls in separate PRs
  for the maintainer's product decision. A user's redesign suggestion alone
  does not authorize replacing the established experience.
- If the report is unclear, ask for the failing steps or a screenshot/example.
  Personal preferences, such as automatic voice summaries, stay personal unless
  deliberately adopted for everyone.

## Preserve the fundamentals

- Opening Office shows the task Kanban immediately. Projects group related
  tasks and filter that board. Avoid a project overview that hides the tasks
  behind another click. Borrow familiar Trello/Asana patterns.
- Keep To do, In progress, Waiting on you, and Done. Show progress through those
  states and useful updates, without adding percentages or planning dashboards.
  Keep rules and plans as simple text; do not introduce new formal entities.
- Keep recognizable agent faces, useful files/results, Markdown and Mermaid
  notes, visual reports, and truthful starter content.
- A task opens on a current, human-readable snapshot, not the agents' work log.
  The chief owns its clarity and freshness: what has happened, what remains,
  and any decision needed. Useful visuals can support it. Keep detailed agent
  updates collapsed under **Updates** with a count; expanding reveals the full
  context. Preserve the original brief, read-only checks and contextual input.
  Keep the shared comment box available outside the collapsed history.
- A reply is not completion. Muse reviews contextual updates and open tasks,
  keeps the next action and owner recorded, and verifies the actual result
  before Done. Verify a real scheduled run before claiming automatic follow-up.

## Deliver a focused change

Read the relevant `spec/PAGES.md`, `spec/DESIGN.md`, `spec/ACTIONS.md`, and
`spec/SCHEMA.md` contracts. Update affected contracts and hat instructions
alongside the fix. Test changed views on desktop and phone, and test native
Muse behavior when the fix depends on its host. Include screenshots for visual
changes. Separate code checks, live verification, and unverified limitations.
