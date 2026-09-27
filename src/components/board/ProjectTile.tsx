"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties, type FocusEvent } from "react";
import "@/app/projects/projects.css";

/**
 * One square above the board: the project's pastel with its name top-left and its
 * task count bottom-left. Without a colour it is the white "All projects" tile.
 * The chosen tile wears an ink outline.
 */
export function ProjectTile({ href, projectHref, name, count, color, chosen }: { href: string; projectHref?: string; name: string; count: number; color?: string; chosen: boolean }) {
  const tile = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = tile.current;
    const row = element?.parentElement;
    if (!chosen || !element || !row) return;
    const box = element.getBoundingClientRect();
    const viewport = row.getBoundingClientRect();
    if (box.left < viewport.left + 8) row.scrollLeft += box.left - viewport.left - 8;
    else if (box.right > viewport.right - 8) row.scrollLeft += box.right - viewport.right + 8;
  }, [chosen]);
  const fill = color ? ({ "--c": color } as CSSProperties) : undefined;
  function revealTile(event: FocusEvent<HTMLAnchorElement>) {
    if (event.currentTarget.matches(":focus-visible")) {
      event.currentTarget.parentElement?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }
  return (
    <div ref={tile} className={"pj-tile" + (color ? "" : " all") + (chosen ? " on" : "") + (projectHref ? " has-details" : "")} style={fill}>
      <Link href={href} className="pj-tile-filter" aria-current={chosen ? "true" : undefined} onFocus={revealTile}>
        <span className="pj-tile-nm">{name}</span>
        <span className="pj-tile-n">{count} {count === 1 ? "task" : "tasks"}</span>
      </Link>
      {projectHref && <Link href={projectHref} className="pj-tile-details" aria-label={`Details: ${name}`} onFocus={revealTile}>
        {chosen && <span>Details</span>}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </Link>}
    </div>
  );
}
