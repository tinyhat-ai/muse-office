import Link from "next/link";
import type { CSSProperties } from "react";
import { all, COLUMNS, COLUMN_LABEL, type Column, type MemberRow, type ProjectRow, type TaskRow } from "@/lib/db";
import { Avatar } from "@/components/Avatar";
import { ProjectTile } from "@/components/board/ProjectTile";
import { Sticky } from "@/components/board/Sticky";
import "./projects.css";

// A task joined with its project's name and colours, which is all a sticky note needs.
type BoardTask = TaskRow & { project_name: string; color: string; color_dark: string };

// Lane rules and subtitles from spec/DESIGN.md §Board; the titles come from COLUMN_LABEL.
const LANE: Record<Column, { sub: string; color: string }> = {
  todo: { sub: "Not started yet", color: "#c9c8c1" },
  in_progress: { sub: "Working or in review", color: "#3d5a6c" },
  waiting_on_you: { sub: "Needs your answer", color: "#b3541e" },
  done: { sub: "Finished this week", color: "#2d5a45" },
};
const WEEK = 7 * 24 * 3600 * 1000;

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const finishedAt = (t: TaskRow) => Date.parse(t.done_at ?? t.updated_at);
// Open lanes: due soonest first, then whatever has sat untouched the longest.
const openOrder = (a: TaskRow, b: TaskRow) => cmp(a.due ?? "9999", b.due ?? "9999") || cmp(a.updated_at, b.updated_at);

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ project?: string | string[] }> }) {
  const { project: wanted } = await searchParams;
  const projects = all<ProjectRow>("SELECT * FROM projects ORDER BY sort_order, name");
  const members = all<MemberRow>("SELECT * FROM members ORDER BY sort_order");
  const tasks = all<BoardTask>("SELECT t.*, p.name AS project_name, p.color, p.color_dark FROM tasks t JOIN projects p ON p.slug = t.project");
  const member = new Map(members.map((m) => [m.slug, m]));
  const chief = members.find((m) => m.is_chief === 1);
  const chiefName = chief?.name ?? "your chief of staff";
  const chosen = projects.find((p) => p.slug === wanted); // an unknown slug just shows everything
  const lead = chosen?.lead ? member.get(chosen.lead) : undefined;

  // Done shows this week's finishes; with none, the last four, so the lane is never bare.
  const doneAll = tasks.filter((t) => t.column_name === "done").sort((a, b) => finishedAt(b) - finishedAt(a));
  const thisWeek = doneAll.filter((t) => finishedAt(t) >= Date.now() - WEEK);
  const doneShown = thisWeek.length ? thisWeek : doneAll.slice(0, 4);
  const doneSub = thisWeek.length || !doneShown.length ? LANE.done.sub : "Finished lately";

  // Tile counts are the tasks on the board, so a chosen tile's count matches its lanes.
  const onBoard = [...tasks.filter((t) => t.column_name !== "done").sort(openOrder), ...doneShown];
  const visible = chosen ? onBoard.filter((t) => t.project === chosen.slug) : onBoard;
  const counts = new Map<string, number>();
  for (const t of onBoard) counts.set(t.project, (counts.get(t.project) ?? 0) + 1);

  return (
    <main className="wrap">
      <header className="head">
        <div className="kick">What the team is doing</div>
        <h1 className="title">Projects</h1>
        <p className="lede pj-lede">
          {chief ? <Avatar member={chief} size="xs" /> : null}
          <span>Managed by {chiefName}</span>
        </p>
      </header>

      <nav className="pj-tiles" aria-label="Show one project">
        <ProjectTile href="/projects" name="All projects" count={onBoard.length} chosen={!chosen} />
        {projects.map((p) => (
          <ProjectTile key={p.slug} href={`/projects?project=${encodeURIComponent(p.slug)}`} name={p.name} count={counts.get(p.slug) ?? 0} color={p.color} chosen={chosen?.slug === p.slug} />
        ))}
      </nav>
      <div className="pj-info">
        {chosen ? (
          <>
            <span>
              {chosen.name}
              {lead ? ` · led by ${lead.name}` : ""}
            </span>
            <Link href={`/projects/${chosen.slug}`}>Open the {chosen.name} page →</Link>
          </>
        ) : null}
      </div>

      <div className="pj-board">
        {COLUMNS.map((col) => {
          const cards = visible.filter((t) => t.column_name === col);
          const waiting = col === "waiting_on_you";
          const cls = ["pj-lane", `pj-lane-${col}`, waiting ? "wait" : "", col === "done" ? "done" : ""].filter(Boolean).join(" ");
          return (
            <section key={col} className={cls} style={{ "--lc": LANE[col].color } as CSSProperties} aria-labelledby={`lane-${col}`}>
              <div className="pj-lane-h">
                <div>
                  <h2 className="pj-lane-t" id={`lane-${col}`}>
                    {COLUMN_LABEL[col]}
                  </h2>
                  <div className="pj-lane-sb">{col === "done" ? doneSub : LANE[col].sub}</div>
                </div>
                <span className="pj-lane-ct">{cards.length}</span>
              </div>
              {cards.length ? (
                <div className="pj-notes">
                  {cards.map((t) => (
                    <Sticky key={t.id} task={t} specialist={t.specialist ? member.get(t.specialist) : null} />
                  ))}
                </div>
              ) : (
                <div className="dashed pj-none">{waiting ? "Nothing needs your answer right now" : "No tasks"}</div>
              )}
            </section>
          );
        })}
      </div>
      <p className="tell pj-tell">To add or move a task, tell {chiefName} in chat.</p>
    </main>
  );
}
