---
name: follow-through
description: Keep Office comments and owned tasks moving until their results are checked, including after a comment has been answered.
---

# Follow the work through

A reply is not completion. You remain responsible for the work after the
comment is read and the worker is dispatched.

## Set up the check

- Inspect existing schedules first. Maintain one Office-wide check; update its
  instructions instead of creating duplicates or changing unrelated jobs.
- Use a one-minute interval when supported. If the platform requires a longer
  interval, agree on the nearest useful option, such as five minutes. Replace
  an old 30-minute sweep when adopting this skill. Save the job identity, actual
  interval and scope in your own chief-of-staff skill in your workspace.
- Verify that the job exists, is enabled, and runs. Instructions alone do not
  prove that a schedule is active. If scheduling is unavailable, explain that
  limitation once in chat; do not add banners or notices throughout Office.
- A documented, verified immediate trigger can accelerate feedback handling.
  Always retain the periodic review of unfinished tasks, even when event
  delivery is reliable: work can need attention without a new comment.

## Prevent repeated work

Use the scheduler's documented no-overlap mode only when every entry path
invokes that same job. Otherwise every entry path, including chat and immediate
triggers, must share an atomic workspace lock with an owner and bounded lease. A competing run exits
without dispatching work. Renew the lease during a long run; if ownership is
lost, stop dispatching or performing side effects. After a crash or expired
lease, reconcile existing workers and results before taking over.

Keep a durable checkpoint keyed by `(source, target_id, id)` with its task,
owner, next action and its due time, worker identity and action state. For work
without a comment, key the checkpoint by task id. Persist it before starting
a worker or performing a side effect. On retry, resume that checkpoint instead
of starting again. For sending, payment or other external actions, keep the
approval scope and operation identity, use the provider's idempotency key when
supported, and save the actual receipt. If an attempt's outcome is unknown,
reconcile it with the provider before retrying; ask for help rather than risk
repeating it. The user's answer to an exact approval question approves that one
operation only. Retrying, re-reading that reply, another comment or an expired
lock never grants approval for a second operation.
This is agent coordination state, not another Office page or user-facing entity.

## On every run

1. Read every page of `list_recent_updates(unread_only=true)`, following
   `next_cursor` until null. Keep each item's `(source, target_id, id)` together.
   Read its page, the message it answers, and its attachments before acting.
   Missing or unreadable context is a blocker to resolve, not permission to
   infer a request or mark the work complete.
2. Route the work to its task owner, note keeper or project lead, with yourself
   as fallback. For continuing work, first record its owner in
   `update_task.specialist` and its next action in the task's `plan` with one
   `now` step. Read `get_task` first and preserve its other plan steps and their
   states: `update_task.plan` replaces the whole list. Save the coordination
   checkpoint. Reuse the existing task and
   active worker. A substantial note correction gets a linked task: read
   `get_note` first and preserve existing `linked_tasks` when calling
   `upsert_note`, which replaces that list. Reopen a finished task when needed.
3. Reply on the original page with what changed or the owned next action.
   `reply_to_comment` itself marks that comment read; call it after a completed
   correction or durable handoff, before long-running work. For feedback that
   needs no answer, use `mark_comments_read` after handling it. Neither action
   finishes the task. Start or resume the recorded work under the guard above.
4. Call `list_tasks` without a column filter and review non-Done tasks, **even
   when no comments are unread**. Read `get_task` for their plan and outputs.
   Check the real worker state and the checkpoint's next-action due time; do not launch a new worker
   or repeat an unchanged question on every tick. Continue authorized work,
   follow up when that action is due or stalled, and keep blockers and next
   actions on the task. Ask one clear question when the user is needed.
5. Verify the actual changed page, file or other requested output before Done;
   the worker's reply alone is insufficient. A blocked attempt stays open: a
   report explaining why work could not be done is not the requested result.
   Do not close it unless the user explicitly cancels that work. Save the result and useful links
   on the task and reply with the final result on the original task, note or
   project thread. Follow `run-a-task` for closing work and recording what the
   specialist learned. Preserve approval requirements throughout.

## Verify during setup or a follow-through repair

After starter data exists, use an isolated test Office, or reopen the Office
setup task while verifying setup and close it only after verification. Clearly
label synthetic comments as tests; never invent a user approval
or business request. Do not advance the test task until a scheduled run has
handled the test comment. Let an actual scheduled run pick up a contextual request
for a small observable change. Verify its owner, page and attachments, an owned
next action and same-page reply. On a later scheduled run, verify unfinished
work continues after its comment is read, the requested result exists and the
task closes. Exercise a retry or overlapping run without duplicate dispatch or
side effects. Remove temporary test schedules afterwards and verify cleanup;
preserve the user's real Office check and the test record as evidence.
