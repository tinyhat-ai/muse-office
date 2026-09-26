# Office feedback verification

## Product boundary

The final candidate restores the simple Office model: Muse manages the work
through conversation; the artifact shows it. The Tasks page retains the original
paper sticky notes and project selectors. Comments on a task, project, or note
are the only user writes. There are no project management forms, completion
percentages, formal checklist panels, milestones, or direct status controls.
Project rules and useful plans are readable text. Previous preview screenshots
and checks of those removed controls are superseded by this candidate.

## Reference app

- 29 action, feed, rendering, avatar, and starter tests pass; TypeScript and the
  production build pass. A task can be completed with a checked result and no
  structured checklist. A correction comment leaves its status unchanged;
  the owner may reopen it through an action after reading the request.
- Project selectors filter task cards. Owner faces remain on open and completed
  cards. Project context links back to its board and has plain rules plus comments.
- Agent project actions preserve tasks/history on archive and restore. Active
  task reads, Team, and Reports leave paused work out. Reports was inspected
  after archiving a waiting project's work, then the project was restored.
- The unified updates feed records all supported changes, not only comments.
  Tests cover fixed-batch pagination, simultaneous writes, writes during a batch,
  failed-write rollback, correct saved IDs, and reads not creating event loops.
- Private screenshot attachments, same-page owner replies, Markdown tables,
  Mermaid, line breaks, and distinct same-name files retain the earlier verified
  behavior. The comment forms retain typed page references and honest save feedback.
- Older databases retain their records and legacy plan/check fields. The new
  UI does not expose those fields as a project management system, and new
  starter records do not require process-step or checklist rows.

Final desktop and 375-pixel phone checks show the original sticky cards and project
selectors, with no page overflow. A browser-posted comment on a completed task
left it Done; an action-posted reply appeared under that comment after reload.
The project filter showed only its matching task. Current screenshots in
`screenshots/feedback/` show reference or disposable test records only.

## Native Muse verification

Muse built a separate private **Office Feedback Test** from the candidate
instructions, then adapted it as the product direction was clarified. Its real
Noche, Paleta, and Forja portraits were reused from the personal Office. The
personal Office and its existing 30-minute job remained outside this test.

An earlier actual one-minute scheduled run read a comment from the test Office's
updates feed and posted Forja's reply on the original homepage-review task.
The comment and reply were independently observed in Muse desktop. Muse reported
the stored author, handled flag, saved checkpoint, and no duplicate on a later
run. Both temporary jobs were removed. A subsequent UI comment independently
showed: “Comment saved. Regular checks aren’t set up. Ask Noche in chat to
continue.” This verifies the inactive-schedule wording, not an immediate wake.

The first scheduled run had only drafted a reply. The instructions now explicitly
require posting an owner reply in the private Office before marking feedback
handled. Muse also inspected a previously missed screenshot after being asked;
its description was qualitative, not a measured contrast audit.

After the final simplification, Muse desktop independently showed the restored
colored project selectors, four desktop lanes, real portraits, and plain project
rules with comments. Selecting Website showed only its two tasks. The existing
scheduled owner reply remained visible. A new UI comment on the completed setup
task left it Done and showed the truthful inactive-schedule message. Direct
project controls, percentages, checklist panels, and comment-triggered reopening
were absent from the inspected generated pages. A final pass removed derived
project status labels: project selectors show only the name and task count.
Muse posted the final contextual acknowledgement on its original task. When
asked to update the old completion description, it reopened and reverified the
task through agent actions; the comment itself had left the status unchanged.
Muse also added the missing set_process action, used it to replace escaped
line breaks in the project rules, and reported the corresponding feed event.
The corrected plain rules were independently seen on the project page. Its
three original tasks, conversations, files, checked result, and real portraits
remain. Disposable archive/name-test projects are archived. These backend and
scheduler statements are Muse's action receipts; screenshots and visible UI
checks are separate evidence. No successful audio generation or instant wake-up
is claimed.

## Project navigation and contributor contract

The project selector now reserves 8px on every side for selection/focus rings
and has no fading edge mask. Each project has two sibling links: the name/count
filters tasks, and a 44px **Open project** footer opens its page directly.
All projects remains filter-only. The redundant selected-project link is removed.

On the reference app, Website filtering showed only its task. Tab moved from
that filter to its project link; Enter opened Website's rules/comments. At
375px, the page scroll width equalled its viewport width; all footer targets
measured 44px. Keyboard navigation scrolled to the last project with 8px of
space to the right, above, and below it. Opening that project reached its page.
Desktop and phone screenshots were refreshed after the change.

Muse independently built the same two-target layout in the private test Office.
Opening Website from All projects reached its context/rules/comments; selecting
Website separately filtered out the setup task. The native board screenshot
shows the padded row and separate page links. Phone geometry measurements above
are from the reference app, not a claim about the native generated app.

The contributor skill in `.agents/skills/office-product-model/` is now routed
from `AGENTS.md` and the developer guide, with a Claude skill adapter. Its
frontmatter passed the skill validator. The contextual-feedback reference
records formatted text, screenshots, and voice as requirements and explicitly
lists today's media support gaps; it does not claim an audio composer exists.

## Scope of proof

The local reference app and a Muse-generated private app are separate
implementations. Passing the reference tests does not prove every future Muse
build. The hat asks Muse to inspect its own rendered pages and actual action
results during setup, preserve the user's preferences, and keep the interaction
boundary when applying feedback. No personal Office was reset or replaced.
