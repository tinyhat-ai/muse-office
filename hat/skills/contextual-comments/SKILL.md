---
name: contextual-comments
description: Keep contextual feedback attached to its Office page while preserving Muse chat as the primary input.
---

# Contextual comments

Office shows the work. The user normally talks to you in Muse, using its native
text, screenshots, and voice input. Before adding an Office input, check whether
the current host supports a documented handoff to that native composer with the
page title, link, and relevant content. Verify the handoff in the user's client;
API presence alone is not proof. Never invent a deep link or bypass iframe policy.

When no supported handoff works, use one shared comment component on task, note,
and project pages and their replies. It preserves the context of what the user
is reading; it is not a second chat app or a way to edit project data.

- Reuse the same input everywhere: formatted text, pasted screenshots, image or
  audio attachments, and user-triggered voice recording where supported. Enter
  adds a line; Shift+Enter sends. Keep existing Ctrl/Cmd+Enter compatibility and
  do not submit during IME composition.
  Every picker selection, paste, drop, and stopped recording appends to the
  existing draft attachments; it never replaces the list. Give each draft
  item its own stable id, including files with identical names. Remove by id,
  not filename or a changing list index. Clear the picker value after reading
  it so selecting the same file again works. Cancelling a picker changes
  nothing. Reject a selection that exceeds the limits without discarding the
  existing draft; a failed save also keeps its body, files, and previews.
  Verify separate picker visits for image then audio, independent removal of
  two same-name files, and supported paste/drop/record appends. After a failed
  save and retry, the stored comment retains all intended files once and the
  draft clears only on success.
- Keep the input in one compact field with familiar paperclip, microphone and
  upward-arrow send icons inside its bottom edge. Use a stop-square icon while
  recording. Give these three controls an accessible name, hover title, keyboard focus and
  44px touch target. One attachment picker accepts photos, audio and other files.
  Keep the recording icon neutral. Change its Record/Stop accessible name with
  its action and leave `aria-pressed` unset.
  Do not replace icons with Image/Audio/Record text buttons or add an input
  heading, shortcut hint, privacy caption, help paragraph or scheduler banner.
  Show recording state or an error only when the action needs it. Preserve the
  draft and attachments on a failed save.
- Give every audio draft a compact native player with Play/Pause before Send,
  including recordings after they stop and attached audio files. Preview its
  local File with a browser object URL; do not upload it to listen or autoplay.
  Stop playback and release the URL on removal, successful save, or unmount.
  Preserve the preview on a failed save. Add no extra heading or helper text.
- Keep task and note detail pages flat, like a document. Description, updates, comments and
  files share the page gutter; do not stack padded white cards around them.
  Preserve the board, portraits, page colors, data and follow-through behavior.
- Request microphone access only after a deliberate click. Stop its tracks after
  recording, cancellation, or navigation. Keep recording bounded and never send
  automatically. If the host blocks recording, accept an audio file; do not claim
  that recording was tested or works there.
- Save the body, files, author, time, page type/id and reply parent together. Use
  private storage with bounded file sizes; keep images viewable and audio playable.
  Existing text-only comments and replies must remain readable after upgrade.
- `list_recent_updates` must include every comment with its typed identity,
  page title/link, owner, reply context, and openable file references including
  media type. Paginate deterministically. Identical numeric ids on different
  page types must never route to the wrong page.
- Verify the scheduled agent can retrieve the bytes, not just list filenames.
  Use supported private download/inspection tools; when only actions are
  available, expose `get_comment_attachment` with bounded chunks as specified
  in `spec/ACTIONS.md`. Reassemble the file in the agent's private workspace
  and open it with its image/audio tools. Validate the complete byte count before
  opening it. Do not publish uploads for access.
- Before promising voice follow-up, verify the scheduled worker can transcribe a
  short spoken file. Playback alone is insufficient. Prefer native audio tools;
  if unavailable, use a private local transcription tool within the setup the
  person approved. Keep the original file and transcript together in the private
  Office workspace. Never silently send audio to
  another service or guess a transcript; keep the work open if understanding is blocked.
- Read/listen to attachments before acting; their filenames are not their
  contents. If you cannot access or understand one, ask for that missing context
  on the same page rather than claiming you handled it. Reply there as the owner.
- Follow unfinished work through after acknowledging it; an unread flag is not
  a task queue. Keep a recurring Office check and verify real scheduled pickup.

Test a screenshot and audio comment in the actual Muse client, not only in a
standalone browser. Verify saved content, agent access, same-page follow-up,
keyboard behavior, mobile layout, and retry behavior. Do not impose spoken
responses or another person's presentation preferences on everyone.
