"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/** Keep long prose short on first view without removing the full document. */
export function ExpandableContent({ children, className = "", label }: { children: ReactNode; className?: string; label: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (expanded) return;
    const outer = viewport.current;
    const inner = content.current;
    if (!outer || !inner) return;
    const measure = () => setOverflows(inner.scrollHeight > outer.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [expanded, children]);

  return <div className={`oc-expand ${className}`}>
    <div ref={viewport} id={id} className={`oc-expand-viewport${expanded ? " expanded" : ""}`} onFocusCapture={() => setExpanded(true)}>
      <div ref={content}>{children}</div>
    </div>
    {overflows && <button type="button" className="oc-more" aria-controls={id} aria-expanded={expanded} aria-label={`${expanded ? "Show less" : "Show more"} ${label}`} onClick={() => setExpanded(!expanded)}>
      {expanded ? "Show less" : "Show more"}
    </button>}
  </div>;
}
