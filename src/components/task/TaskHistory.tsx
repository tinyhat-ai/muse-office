"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

interface HistoryItem { id: number; anchors: number[]; content: ReactNode }

/** Recent threads first; an explicit update link can still reveal older context. */
export function TaskHistory({ items, previewIds, className, label }: { items: HistoryItem[]; previewIds: number[]; className: string; label: string }) {
  const [expanded, setExpanded] = useState(false);
  const region = useRef<HTMLDivElement>(null);
  const focusAfterExpand = useRef(false);
  const id = useId();

  useEffect(() => {
    const revealLinkedUpdate = () => {
      const match = /^#update-(\d+)$/.exec(window.location.hash);
      if (match && items.some((item) => item.anchors.includes(Number(match[1])))) setExpanded(true);
    };
    revealLinkedUpdate();
    window.addEventListener("hashchange", revealLinkedUpdate);
    return () => window.removeEventListener("hashchange", revealLinkedUpdate);
  }, [items]);

  useEffect(() => {
    if (!expanded) return;
    const frame = requestAnimationFrame(() => {
      if (focusAfterExpand.current) {
        region.current?.focus({ preventScroll: true });
        focusAfterExpand.current = false;
      } else if (/^#update-\d+$/.test(window.location.hash)) {
        document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "center" });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [expanded]);

  const preview = new Set(previewIds);
  const visible = expanded ? items : items.filter((item) => preview.has(item.id));
  return <>
    <div id={id} ref={region} className={className} tabIndex={-1} role="region" aria-label={label}>
      {visible.map((item) => item.content)}
    </div>
    {!expanded && visible.length < items.length && <button type="button" className="oc-more" aria-controls={id} aria-expanded={false} aria-label={`Show all ${label.toLowerCase()}`} onClick={() => { focusAfterExpand.current = true; setExpanded(true); }}>
      Show more
    </button>}
  </>;
}
