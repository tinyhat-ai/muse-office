"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function TeamCard({ selected, reveal, children }: { selected: boolean; reveal: boolean; children: ReactNode }) {
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Collapsing the previous card can move the newly selected one above the
    // viewport. The breakpoint matches team.css. Keep its portrait and details together in view on small screens.
    if (reveal && window.matchMedia("(max-width: 980px)").matches) {
      card.current?.scrollIntoView({ block: "start" });
    }
  }, [reveal]);

  return <div ref={card} className={"tm-mate" + (selected ? " tm-on" : "")}>{children}</div>;
}
