"use client";

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
