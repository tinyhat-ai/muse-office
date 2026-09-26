"use client";

import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";

// The one place the user writes: a comment on a task, or a reply to one
// update. Both post to /api/comments, which stores a task_updates row with
// author 'you' and unread_by_agent = 1, then the page re-reads itself.

export type ApiResult = { ok: true; data?: { follow_up?: string } } | { ok: false; error?: string };

export async function postComment(payload: { task?: string; note?: string; project?: string; body: string; reply_to?: number | null; request_changes?: boolean; screenshot?: string }): Promise<ApiResult> {
  // reply_to is left out of the JSON when there is nothing to reply to, so
  // the API sees a plain comment.
  const body: Record<string, unknown> = { ...payload };
  if (payload.reply_to != null) body.reply_to = payload.reply_to;
  try {
    const res = await fetch("/api/comments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = (await res.json().catch(() => null)) as ApiResult | null;
    if (data && typeof data === "object" && "ok" in data) return data;
    return { ok: false, error: `The Office answered ${res.status} without a result. Try again.` };
  } catch {
    return { ok: false, error: "Could not reach the Office. Check the connection and try again." };
  }
}

interface CommentFormProps {
  task?: string;
  note?: string;
  project?: string;
  canRequestChanges?: boolean;
  replyTo?: number | null;
  placeholder: string;
  buttonLabel: string;
  compact?: boolean;
  /** The small line left of the button ("Your comment stays with this task.", "Muse and Penny will see this."). */
  hint?: string;
  /** The textarea id; the page's main box is "new-comment" so the pinned question can focus it. */
  id?: string;
  autoFocus?: boolean;
  onDone?: () => void;
}

export function CommentForm({ task, note, project, canRequestChanges, replyTo, placeholder, buttonLabel, compact, hint, id, autoFocus, onDone }: CommentFormProps) {
  const router = useRouter();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState("");
  const [requestChanges, setRequestChanges] = useState(false);
  const [screenshot, setScreenshot] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);
  const fileVersion = useRef(0);
  const [readingFile, setReadingFile] = useState(false);
  // The refresh is a transition so the form stays disabled until the new
  // conversation is on screen, not just until the POST returns.
  const [refreshing, startTransition] = useTransition();
  const busy = sending || refreshing || readingFile;

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  async function submit() {
    const text = body.trim();
    if (busy) return;
    if (!text) {
      ref.current?.focus();
      return;
    }
    setSending(true);
    setError(null);
    setSaved("");
    const res = await postComment({ task, note, project, body: text, reply_to: replyTo, request_changes: requestChanges, screenshot });
    setSending(false);
    if (!res.ok) {
      setError(res.error || "That did not save. Try again.");
      return;
    }
    setBody("");
    setScreenshot(undefined);
    if (fileRef.current) fileRef.current.value = "";
    setSaved(`Saved${requestChanges ? "; task reopened" : ""}. ${res.data?.follow_up ?? "Awaiting the owner’s reply here."}`);
    setRequestChanges(false);
    startTransition(() => router.refresh());
    onDone?.();
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void submit();
    }
  }

  return (
    <form
      className={"tk-form" + (compact ? " compact" : "")}
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <textarea
        ref={ref}
        id={id}
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={onKey}
        placeholder={placeholder}
        aria-label={placeholder}
        rows={compact ? 2 : 3}
        disabled={busy}
      />
      {task && !compact && <label className="comment-attachment">Attach a screenshot <span>(PNG, JPG or WebP, up to 4 MB)</span>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={(event) => {
          const version = ++fileVersion.current;
          setScreenshot(undefined);
          const file = event.target.files?.[0];
          if (!file) return;
          if (file.size > 4 * 1024 * 1024) { setError("Choose a screenshot smaller than 4 MB."); event.target.value = ""; return; }
          const reader = new FileReader();
          setReadingFile(true);
          reader.onload = () => { if (version === fileVersion.current) { setScreenshot(String(reader.result).split(",")[1]); setError(null); setReadingFile(false); } };
          reader.onerror = () => { if (version === fileVersion.current) { setError("Could not read that screenshot."); setReadingFile(false); } };
          reader.readAsDataURL(file);
        }} />
      </label>}
      {canRequestChanges && <label className="comment-changes"><input type="checkbox" checked={requestChanges} onChange={(event) => setRequestChanges(event.target.checked)} /> Request changes — reopen this task</label>}
      <div className="row">
        {hint ? <span className={compact ? "hint" : "tk-onlyhere"}>{hint}</span> : <span />}
        <button type="submit" className="btn" disabled={busy || !body.trim()}>
          {busy ? "Saving…" : requestChanges ? "Request changes" : buttonLabel}
        </button>
      </div>
      {saved && <p className="comment-state" role="status">{saved}</p>}
      {error ? (
        <p className="tk-form-err" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

interface ReplyToggleProps {
  task: string;
  replyTo: number;
  /** "Reply", or "Reply to Penny" on a question. */
  label: string;
  placeholder: string;
  hint?: string;
}

/** A "Reply" link that reveals a compact CommentForm posting a reply to one update. */
export function ReplyToggle({ task, replyTo, label, placeholder, hint }: ReplyToggleProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={"tk-reply" + (open ? " open" : "")} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? "Cancel" : label}
      </button>
      {open ? (
        <div className="tk-rbox">
          <CommentForm task={task} replyTo={replyTo} placeholder={placeholder} buttonLabel="Reply" compact hint={hint} autoFocus  />
        </div>
      ) : null}
    </>
  );
}
