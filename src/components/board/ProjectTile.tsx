import Link from "next/link";
import type { CSSProperties } from "react";
import "@/app/projects/projects.css";

/**
 * One square above the board: the project's pastel with its name top-left and its
 * task count bottom-left. Without a colour it is the white "All projects" tile.
 * The chosen tile wears an ink outline.
 */
export function ProjectTile({ href, name, count, color, chosen }: { href: string; name: string; count: number; color?: string; chosen: boolean }) {
  const fill = color ? ({ "--c": color } as CSSProperties) : undefined;
  return (
    <Link href={href} className={"pj-tile" + (color ? "" : " all") + (chosen ? " on" : "")} style={fill} aria-current={chosen ? "true" : undefined}>
      <span className="pj-tile-nm">{name}</span>
      <span className="pj-tile-n">
        {count} {count === 1 ? "task" : "tasks"}
      </span>
    </Link>
  );
}
