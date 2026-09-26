import Link from "next/link";
import type { CSSProperties } from "react";
import { all, COLUMNS, COLUMN_LABEL, type Column, type MemberRow, type ProjectRow, type TaskRow } from "@/lib/db";
import { Avatar } from "@/components/Avatar";
import { RefreshUpdates } from "@/components/RefreshUpdates";
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
  done: { sub: "Completed work", color: "#2d5a45" },
};

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const finishedAt = (t: TaskRow) => Date.parse(t.done_at ?? t.updated_at);
// Open lanes: due soonest first, then whatever has sat untouched the longest.
const openOrder = (a: TaskRow, b: TaskRow) => cmp(a.due ?? "9999", b.due ?? "9999") || cmp(a.updated_at, b.updated_at);

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project: wanted } = await searchParams;
  const allProjects = all<ProjectRow>("SELECT * FROM projects ORDER BY sort_order, name");
  const projects = allProjects.filter((project) => !project.archived_at);
  const members = all<MemberRow>("SELECT * FROM members ORDER BY sort_order");
  const tasks = all<BoardTask>("SELECT t.*, p.name AS project_name, p.color, p.color_dark FROM tasks t JOIN projects p ON p.slug = t.project WHERE p.archived_at IS NULL");
  const member = new Map(members.map((m) => [m.slug, m]));
  const chief = members.find((m) => m.is_chief === 1);
  const chiefName = chief?.name ?? "your chief of staff";
  const chosen = projects.find((p) => p.slug === wanted); // an unknown slug just shows everything
  const lead = chosen?.lead ? member.get(chosen.lead) : undefined;

  // Keep every task discoverable, including completed work.
  const doneAll = tasks.filter((t) => t.column_name === "done").sort((a, b) => finishedAt(b) - finishedAt(a));
  const onBoard = [...tasks.filter((t) => t.column_name !== "done").sort(openOrder), ...doneAll];
  const visible = onBoard.filter((t) => !chosen || t.project === chosen.slug);
  const counts = new Map<string, number>();
  for (const t of onBoard) counts.set(t.project, (counts.get(t.project) ?? 0) + 1);
  const filterHref = (slug?: string) => slug ? `/projects?project=${encodeURIComponent(slug)}` : "/projects";

  return (
    <main className="wrap">
      <RefreshUpdates />
      <header className="head">
        <div className="kick">What the team is doing</div>
        <h1 className="title">Tasks</h1>
        <p className="lede pj-lede">
          {chief ? <Avatar member={chief} size="sm" /> : null}
          <span>Managed by {chiefName}</span>
        </p>
      </header>

      <nav className="pj-tiles" aria-label="Show one project">
        <ProjectTile href={filterHref()} name="All projects" count={onBoard.length} chosen={!chosen} />
        {projects.map((p) => (
          <ProjectTile key={p.slug} href={filterHref(p.slug)} name={p.name} count={counts.get(p.slug) ?? 0} color={p.color} chosen={chosen?.slug === p.slug} />
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
                  <div className="pj-lane-sb">{LANE[col].sub}</div>
                </div>
                <span className="pj-lane-ct">{cards.length}</span>
              </div>
              {cards.length ? (
                <div className="pj-notes">
                  {cards.map((t) => (
                    <Sticky key={t.id} task={t} specialist={member.get(t.specialist ?? projects.find((p) => p.slug === t.project)?.lead ?? "") ?? chief} />
                  ))}
                </div>
              ) : (
                <div className="dashed pj-none">{waiting ? "Nothing needs your answer right now" : "No tasks"}</div>
              )}
            </section>
          );
        })}
      </div>
      <p className="tell pj-tell">To add or change projects and tasks, tell {chiefName} in chat.</p>
    </main>
  );
}
