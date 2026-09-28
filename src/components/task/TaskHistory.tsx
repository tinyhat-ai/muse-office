"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** The work log is available on demand, including direct links to any reply. */
export function TaskHistory({ children, count }: { children: ReactNode; count: number }) {
  const disclosure = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const revealLinkedUpdate = () => {
      const match = /^#update-(\d+)$/.exec(window.location.hash);
      if (!match) return;
      const target = document.getElementById(`update-${match[1]}`);
      if (!target || !disclosure.current?.contains(target)) return;
      disclosure.current.open = true;
      requestAnimationFrame(() => target.scrollIntoView({ block: "center" }));
    };
    revealLinkedUpdate();
    window.addEventListener("hashchange", revealLinkedUpdate);
    return () => window.removeEventListener("hashchange", revealLinkedUpdate);
  }, [children]);

  return <details className="tk-updates" ref={disclosure}>
    <summary>Updates <span className="sub">{count}</span></summary>
    <div className="tk-conv">{children}</div>
  </details>;
}
