---
name: office-product-model
description: Apply Muse Office's conversational working model when changing its UI, schemas, actions, hat instructions, or product explanations.
---

# Build Office around the chief of staff

## The product model

Tinyhat provides starting instructions and a reference app. Muse builds its own
user's first Office from them, then adapts it with that user. The value is doing
more with Muse through organized, owned work and specialists that improve at
their jobs. The sample roles and projects are replaceable starting choices.

The user talks to Muse. Muse manages the underlying work and data, delegates to
specialists, checks results, and brings decisions back. Office presents that
work in a form easier to understand and revisit than a long chat message:
boards, owner portraits, results, files, charts, and durable notes. The agent
operates the work system; the person uses its views to understand what is happening.

Each specialist has its own instructions, skills, memory, and workspace. Muse
routes lessons to the appropriate specialist and keeps the team current. Preserve
Muse's own recognizable avatar; specialists have distinct faces in the same style.

## Decide whether a UI belongs

For each new control, ask: **Does it help the person see the work or comment in
context, or does it create another place to manage work they can describe to Muse?**

- Viewing, filtering, searching, opening files, and navigating are read-only.
- Create/change/archive projects, tasks, team, contacts, reports, and notes
  through conversation and agent actions. Do not introduce management forms,
  direct status toggles, drag-to-update lanes, or a second general chat in Office.
- The input exception is a comment on a task, project, or note, including a
  reply to specific content there. Context makes that input useful. A comment
  does not directly change task status or become blanket permission to act.
- A new data field alone does not justify a user-facing editor. Provide the
  agent action and show its useful result. Ordinary approvals can be expressed
  as contextual replies and interpreted by Muse within the user's authorization.

Feedback about appearance is not permission to change this model. Clarify an
ambiguous request with a screenshot/example; apply understood feedback within
these boundaries. Personal preferences such as voice summaries belong to that
user's Office, not every user's hat. Explicit requests to change the product
model should be recognized as such, not slipped into a layout fix.

## Keep the presentation simple and useful

- Projects group related tasks (for example Website or School). Tasks are owned
  pieces of work. Keep familiar board lanes: To do, In progress, Waiting on you,
  Done. Do not invent project completion percentages or a project lifecycle.
- Preserve the refined sticky-note board, project filters, owner portraits,
  readable spacing, and a clear route to each project's context page.
- Show progress through status and concise updates. Keep project rules and
  task plans as ordinary text. Avoid milestone panels, mandatory completion
  checklists, and additional entities for concepts that plain text can express.
- Done means a real result was checked. Keep its evidence and history visible.
- Notes render Markdown and Mermaid. Reports contain visual charts with sources.
  First-run content must be useful and honest: real setup work and clearly
  identified public examples, never invented customer or business results.
- Fix layout, contrast, mobile overflow, and broken avatars in the existing
  design. Preserve records and customizations when a user asks Muse to adapt it.

## Contextual feedback and follow-up

Comments should support formatted text, screenshots, and optional voice on
tasks, projects, and notes, including replies. These are ways to express one
contextual comment, not new management forms. Read the
[feedback contract](references/contextual-feedback.md) when changing comment
input, storage, agent delivery, or scheduling. It distinguishes requirements
from the current implementation and names the existing contracts to extend.

All supported changes reach one ordered, paginated agent updates feed with
enough context to understand and route them. Muse owns reviewing this feed,
assigning follow-up, and ensuring the responsible owner replies on the original
page. Until a documented immediate trigger is available and verified, teach
Muse to set up one recurring Office-wide check: propose one minute, allow an
agreed interval such as five minutes, and report the real supported interval.
Do not silently default to 30 minutes or claim receipt means work has started.

## Apply a change

1. State the user outcome and identify whether it changes presentation,
   contextual feedback, or agent operation. Use the UI decision above.
2. Read only the relevant contracts: [pages](../../../spec/PAGES.md),
   [design](../../../spec/DESIGN.md), [actions](../../../spec/ACTIONS.md), and
   [schema](../../../spec/SCHEMA.md). Update affected contracts together.
3. Teach the equivalent behavior through the appropriate `hat/skills/` skill
   and builder instructions. Code alone does not update the Office Muse builds.
4. Verify changed views on desktop and phone. For feedback, test a real saved
   comment through the feed to an owner reply on the original page, including
   attachments and retries when those paths change. Verify an actual scheduled
   run before claiming automatic follow-up works.
5. Review the diff for new user writes, lost fundamentals, invented data, and
   globalized personal preferences. Report tested behavior and remaining gaps
   separately; include screenshots for visible changes.
