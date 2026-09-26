"use client";

import Link from "next/link";
import type { CSSProperties, FocusEvent } from "react";
import "@/app/projects/projects.css";

/**
 * The main target filters tasks; the separate footer opens project context.
 * Keeping sibling links makes both destinations explicit and keyboard accessible.
 */
export function ProjectTile({ href, projectHref, name, count, color, chosen }: { href: string; projectHref?: string; name: string; count: number; color?: string; chosen: boolean }) {
  const fill = color ? ({ "--c": color } as CSSProperties) : undefined;
  function revealTile(event: FocusEvent<HTMLAnchorElement>) {
    // Native focus scrolling can leave a partially visible tile clipped. Reveal
    // the whole tile; the row's scroll-padding also reserves room for its ring.
    event.currentTarget.parentElement?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  return (
    <div className={"pj-tile" + (color ? "" : " all") + (chosen ? " on" : "")} style={fill}>
      <Link href={href} className="pj-tile-filter" aria-current={chosen ? "true" : undefined} onFocus={revealTile}>
        <span className="pj-tile-nm">{name}</span>
        <span className="pj-tile-n">{count} {count === 1 ? "task" : "tasks"}</span>
      </Link>
      {projectHref ? <Link href={projectHref} className="pj-tile-open" onFocus={revealTile} aria-label={`Open project: ${name}`}>Open project <span aria-hidden="true">→</span></Link> : null}
    </div>
  );
}
