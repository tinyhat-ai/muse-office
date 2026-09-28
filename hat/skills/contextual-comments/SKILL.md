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
  While the recorder is actually capturing, show a visible `Recording…` status
  beside the stop control (a small level meter or elapsed timer is optional).
  An icon swap or accessible name alone is not visible feedback. Do not show
  recording during a permission prompt or after denial; clear the status on
  stop, error, cancellation, or navigation. Disable Send until capture stops.
- Give every audio draft a compact native player with Play/Pause before Send,
  including recordings after they stop and attached audio files. Preview its
  local File with a browser object URL; do not upload it to listen or autoplay.
  Stop playback and release the URL on removal, successful save, or unmount.
  Preserve the preview on a failed save. Add no extra heading or helper text.
  On a phone, put the player on its own full-width row inside the composer;
  keep the filename and remove control in a separate, shrinkable row. Use
  `min-width: 0`, `width: 100%`, and `max-width: 100%` on the player and its
  layout ancestors. Truncate long filenames visually while preserving their
  accessible name. Use the same width constraints for sent audio in comments
  and nested replies. Never put a fixed-width player beside a long filename.
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
  Persist the private storage key and actual media type, not a draft object
  URL or temporary preview URL. For saved comments, resolve that key through
  the Office's private storage reader and render images inline and audio with
  native controls, without autoplay. If the host has no directly playable
  private URL, read the complete saved bytes, build a typed Blob, and use a
  local object URL. Release it when removed or unmounted; fetch it again on
  reopening. A filename link or a player that errors after Play is not success.
  Test the saved player independently from the draft: send a known-valid short
  audio file with a screenshot, reopen its comment/reply, and press Play. Check
  natural completion without Error and the actual inline image; repeat after
  reopening the app. Publishing media to make a broken URL play is not a repair.
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
  Follow the offset/size validation recipe in `spec/ACTIONS.md`: decode each
  chunk separately, reject gaps, stalled cursors and truncated data, and
  compare the recovered file with the original during setup. An action with
  the right name but metadata-only output fails this check.
- Before promising voice follow-up, verify the scheduled worker can transcribe a
  short spoken file. Playback alone is insufficient. Prefer native audio tools;
  if unavailable, use a private local transcription tool within the setup the
  person approved. Keep the original file and transcript together in the private
  Office workspace. Never silently send audio to
  another service or guess a transcript; keep the work open if understanding is blocked.
  Verify this path with the scheduled worker's real tools before hand-over:
  recover the spoken fixture, transcribe it privately, perform its requested
  edit, and read the actual changed record. Keep the transcript and original
  together. If additional setup permission is needed, report that exact
  blocker; do not claim the media was understood or the request completed.
- Read/listen to attachments before acting; their filenames are not their
  contents. If you cannot access or understand one, ask for that missing context
  on the same page rather than claiming you handled it. Reply there as the owner.
- Follow unfinished work through after acknowledging it; an unread flag is not
  a task queue. Keep a recurring Office check and verify real scheduled pickup.

Test a screenshot and audio comment in the actual Muse client, not only in a
standalone browser. Verify saved content, agent access, same-page follow-up,
keyboard behavior, mobile layout, and retry behavior. Do not impose spoken
responses or another person's presentation preferences on everyone.

Before handing over, test this shared component on a task, note, and project
at 320px and 390px, including an indented reply and a long filename. Start
recording with permission: the live status must appear without adding a
standing caption. Stop, listen to the unsent draft, send, reopen the page,
and listen again. All player controls, the filename row, and Send must fit
inside the gutter without horizontal page scrolling. Test denial separately:
no false recording status or stuck disabled controls. If microphone access
is blocked by the host, report that specific untested path; file playback
does not prove recording works.
