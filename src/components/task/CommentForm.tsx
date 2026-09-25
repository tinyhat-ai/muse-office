"use client";

import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";

// The one place the user writes: a comment on a task, or a reply to one
// update. Both post to /api/comments, which stores a task_updates row with
// author 'you' and unread_by_agent = 1, then the page re-reads itself.

export type ApiResult = { ok: true; data?: unknown } | { ok: false; error?: string };

export async function postComment(payload: { task: string; body: string; reply_to?: number | null }): Promise<ApiResult> {
  // reply_to is left out of the JSON when there is nothing to reply to, so
  // the API sees a plain comment.
  const body: Record<string, unknown> = { task: payload.task, body: payload.body };
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
  task: string;
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

export function CommentForm({ task, replyTo, placeholder, buttonLabel, compact, hint, id, autoFocus, onDone }: CommentFormProps) {
  const router = useRouter();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The refresh is a transition so the form stays disabled until the new
  // conversation is on screen, not just until the POST returns.
  const [refreshing, startTransition] = useTransition();
  const busy = sending || refreshing;

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
    const res = await postComment({ task, body: text, reply_to: replyTo });
    setSending(false);
    if (!res.ok) {
      setError(res.error || "That did not save. Try again.");
      return;
    }
    setBody("");
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
      <div className="row">
        {hint ? <span className={compact ? "hint" : "tk-onlyhere"}>{hint}</span> : <span />}
        <button type="submit" className="btn" disabled={busy}>
          {busy ? "Sending…" : buttonLabel}
        </button>
      </div>
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
          <CommentForm task={task} replyTo={replyTo} placeholder={placeholder} buttonLabel="Reply" compact hint={hint} autoFocus onDone={() => setOpen(false)} />
        </div>
      ) : null}
    </>
  );
}
