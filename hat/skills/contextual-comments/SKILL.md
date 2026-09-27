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
- Use compact attachment and microphone controls, not another toolbar, chat
  history, help paragraph, or scheduler banner. Show an error only when an action
  fails. Preserve the draft and attachments on a failed save.
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
  and open it with its image/audio tools. Do not publish uploads for access.
- Read/listen to attachments before acting; their filenames are not their
  contents. If you cannot access or understand one, ask for that missing context
  on the same page rather than claiming you handled it. Reply there as the owner.
- Follow unfinished work through after acknowledging it; an unread flag is not
  a task queue. Keep a recurring Office check and verify real scheduled pickup.

Test a screenshot and audio comment in the actual Muse client, not only in a
standalone browser. Verify saved content, agent access, same-page follow-up,
keyboard behavior, mobile layout, and retry behavior. Do not impose spoken
responses or another person's presentation preferences on everyone.
