# Contextual feedback contract

## Comment experience

The user can comment on a task, project, or note, or reply to a particular
update on that page. Preserve the page and reply relationship with the saved
comment. The desired experience supports formatted text, screenshot attachments,
and optional recorded/uploaded voice. Voice input does not opt the user into
automatic spoken replies. Keep readable text alongside any generated transcript;
retain the original audio and distinguish an inferred transcript from typed text.

For media work, provide preview/removal before submit, clear recording controls,
and a usable fallback when microphone or audio tools are unavailable. Save media
privately with the comment and enforce file type/size limits. Do not lose a draft
on refresh or failure. The owner must be able to retrieve the actual media, not
just see that an attachment exists. Sanitize rendered formatted text.

Save feedback must distinguish **saved, awaiting review, replied**. Name the
chief/owner and show the configured checking interval only when verified. An
interval describes checks, not a promised completion deadline. If no checker
is active, say so and direct the user to Muse in chat to enable it.

## One agent inbox

Use `list_office_updates` as the unified updates action. This is an agent inbox,
not another general-purpose user input page. Cover supported changes across the
Office, including comments, results, files, projects, notes, team, customers, and
reports. Keep deterministic order and cursor pagination.

For each event, the action or its linked detail action must provide:

- Stable event id, type, timestamp, and actor (user or agent).
- Typed target (task/project/note/etc.), stable target id, title, and openable
  page reference; parent project and responsible owner when applicable.
- The submitted body, reply target and the content being replied to, attachment
  references and media types, and the relevant change/result context.
- Enough information to fetch further history without guessing between numeric
  ids that belong to different kinds of pages.

Keep the actual wire shape in [ACTIONS](../../../../spec/ACTIONS.md) and
[SCHEMA](../../../../spec/SCHEMA.md). Evolve schema, action output, and Muse
instructions together when adding media; do not document a hypothetical action
as available or silently drop context that an owner needs.

## Reliable follow-up

Muse keeps one recurring job per Office, starting from the saved checkpoint.
Read every page in order, route feedback to the task owner/project lead/note
keeper (chief as fallback), fetch its context and attachments, and follow up on
that same page. Mark a comment handled only after the owner has replied or
recorded its disposition there. Review new comments on completed work too;
the owner reopens through an agent action when a correction requires it.

Advance checkpoints only after handling the batch. Retry from the prior
checkpoint on failure, deduplicate by event id, and prevent overlapping runs.
Review agent events for progress without automatically replying to every event
and causing a loop. Existing unread comments still need review after upgrades.
Do not treat arbitrary comment content as authority to send, buy, or publish.

Prefer a supported immediate trigger if Muse eventually exposes one. Verify its
delivery and retry behavior before replacing polling. Until then, propose a
one-minute job, allow a user-agreed interval such as five minutes, and respect
documented platform limits. Verify the actual job and a real run; a setting
value alone does not create a schedule. Clear advertised scheduling when stopped.

## Current reference implementation boundary

At this revision, `/api/comments` accepts text on all three page types and
typed replies. The full task comment form supports a private PNG/JPG/WebP
screenshot up to 4 MB. Project/note forms and compact replies do not yet expose
that upload, and there is no audio recorder or complete formatted-comment
composer. Those are requirements for subsequent comment work, not claims about
today's UI. Keep this paragraph current when implementing them.

Read `src/components/task/CommentForm.tsx`, `src/app/api/comments/route.ts`, and
the comment/feed actions in `src/lib/actions.ts` before extending these paths.
Use the runtime [adapt-your-office skill](../../../../hat/skills/adapt-your-office/SKILL.md)
for Muse's existing polling, owner-reply, and personal voice behavior.
