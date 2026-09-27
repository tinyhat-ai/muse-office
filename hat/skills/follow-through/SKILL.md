---
name: follow-through
description: Keep Office comments and owned tasks moving until their results are checked, including after a comment has been answered.
---

# Follow the work through

A reply is not completion. You remain responsible for the work after the
comment is read and the worker is dispatched.

## Set up the check

- Inspect your existing scheduled tasks first. Maintain one Office-wide check;
  update its instructions instead of creating duplicate jobs or changing other jobs.
- Use a one-minute interval when supported. If the platform requires a longer
  interval, agree on the nearest useful option, such as five minutes. Do not
  silently use 30 minutes. Record the actual schedule in your Office instructions.
- Verify that the job exists, is enabled, and runs. Instructions alone do not
  prove that a schedule is active. If scheduling is unavailable, explain that
  limitation once in chat; do not add banners or notices throughout Office.
- Use a documented immediate update trigger when available and verified. Keep
  the periodic check as recovery unless the trigger guarantees delivery.

## On every run

1. Read all pages of `list_recent_updates(unread_only=true)`, following
   `next_cursor` until null. Keep each item's `(source, target_id, id)` together.
   Read its page, the message it answers, and any attachments before acting.
2. Route the work to the task owner, note keeper or project lead, or take responsibility
   yourself if none is assigned. For a correction, do the correction. For a
   question, answer it. If work will continue later, first record the next action
   and owner on an open task. A note correction that needs substantial work gets
   a linked task; a correction to a finished task reopens that task when needed.
3. Reply on the original page with what actually changed or what work remains.
   `reply_to_comment` marks the comment read. Only call it after the action or
   durable handoff in step 2; a read comment must not be the only record of an
   unfinished request. Acknowledging or delegating does not finish the task.
4. Review `list_tasks` in To do, In progress, and Waiting on you **even when
   there are no unread comments**. Check each owner's real output, continue
   authorized work, and follow up on stalled assignments. Reuse an active
   worker; do not start duplicate workers on every tick. When blocked, keep the
   reason and next action on the task. Ask one clear question when the user is
   needed; do not repeat it on every run.
5. Verify the requested result before moving the task to Done. Check the actual
   changed page, file, or other output, not just the worker's reply. Save the
   result and useful links on the task. Follow `run-a-task` for closing work and
   recording what the specialist learned. Keep approval requirements intact.

## Verify during setup or a follow-through repair

Use isolated test work. Submit a contextual comment requesting a small,
observable change. Let an actual scheduled run pick it up; verify the owner,
page context, resulting change, same-page reply, and final task status.
Also verify that unfinished work is picked up on a later run after its comment
has been answered. Test retries without duplicate work or lost comments. Remove
any temporary test schedule afterwards; preserve the user's real Office check.
