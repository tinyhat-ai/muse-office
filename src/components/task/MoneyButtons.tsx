"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { postComment } from "./CommentForm";

// The two answers to a money question. A yes is stored as a reply with body
// "yes" (the Muse treats it as the user's OK); "not yet" is stored the same
// way so the Muse knows the question was seen.

interface MoneyButtonsProps {
  task: string;
  /** The question update the answer replies to; null when the task has no question row yet. */
  questionId: number | null;
  /** "Yes, pay $1,240 on Sep 28" — worked out from the question text by the page. */
  yesLabel: string;
}

export function MoneyButtons({ task, questionId, yesLabel }: MoneyButtonsProps) {
  const router = useRouter();
  const [sending, setSending] = useState<"yes" | "not yet" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, startTransition] = useTransition();
  const busy = sending !== null || refreshing;

  async function answer(body: "yes" | "not yet") {
    if (busy) return;
    setSending(body);
    setError(null);
    const res = await postComment({ task, body, reply_to: questionId });
    setSending(null);
    if (!res.ok) {
      setError(res.error || "That did not save. Try again.");
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="tk-money" role="group" aria-label="Your answer">
      <button type="button" className="btn needs" disabled={busy} onClick={() => void answer("yes")}>
        {sending === "yes" ? "Sending…" : yesLabel}
      </button>
      <button type="button" className="btn quiet" disabled={busy} onClick={() => void answer("not yet")}>
        {sending === "not yet" ? "Sending…" : "Not yet"}
      </button>
      {error ? (
        <span className="tk-form-err" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

/** "Reply to Penny" when there is no question row to reply to: scrolls to the comment box and focuses it. */
export function FocusCommentButton({ label }: { label: string }) {
  function focusBox() {
    const el = document.getElementById("new-comment");
    if (!(el instanceof HTMLTextAreaElement)) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus({ preventScroll: true });
  }
  return (
    <button type="button" className="btn needs" onClick={focusBox}>
      {label}
    </button>
  );
}
