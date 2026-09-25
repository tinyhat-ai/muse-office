"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function NoteCommentForm({ note }: { note: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const busy = sending || refreshing;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !body.trim()) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ note, body: body.trim() }),
      });
      const result = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
      if (!result) throw new Error(`The Office answered ${response.status} without a result. Try again.`);
      if (!response.ok || !result.ok) throw new Error(result.error || "Comment did not save.");
      setBody("");
      startTransition(() => router.refresh());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Comment did not save.");
    } finally {
      setSending(false);
    }
  }

  return <form className="nt-comment-form" onSubmit={submit}>
    <label htmlFor="note-comment">Add a comment for your Office team</label>
    <textarea id="note-comment" value={body} onChange={(event) => setBody(event.target.value)} rows={3} disabled={busy} />
    <div className="nt-comment-actions"><span>Your note keeper checks comments regularly.</span><button type="submit" disabled={busy || !body.trim()}>{busy ? "Saving…" : "Comment"}</button></div>
    {error && <p role="alert">{error}</p>}
  </form>;
}
