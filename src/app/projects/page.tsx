import Link from "next/link";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { all, COLUMNS, COLUMN_LABEL, type MemberRow, type ProjectRow, type TaskRow } from "@/lib/db";
import { projectProgress } from "@/lib/project-progress";
import { Avatar } from "@/components/Avatar";
import { RefreshUpdates } from "@/components/RefreshUpdates";
import "./projects.css";

const LANE = {
  todo: { color: "#94958d", sub: "Ready to start" },
  in_progress: { color: "#466474", sub: "The team is working" },
  waiting_on_you: { color: "#a54619", sub: "A decision needs you" },
  done: { color: "#2d5a45", sub: "Results ready to see" },
};

export default async function Projects({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project } = await searchParams;
  if (project) redirect(`/projects/${encodeURIComponent(project)}`);
  const members = all<MemberRow>("SELECT * FROM members ORDER BY sort_order");
  const chief = members.find((member) => member.is_chief);
  const tasks = all<TaskRow>("SELECT * FROM tasks ORDER BY updated_at DESC");
  const projects = all<ProjectRow>("SELECT * FROM projects ORDER BY sort_order, name").map((item) => ({ ...item, progress: projectProgress(tasks.filter((task) => task.project === item.slug)) }));
  return <main className="wrap pj-wrap">
    <RefreshUpdates />
    <header className="page-head">
      <div className="kick">The bigger picture</div>
      <h1 className="title">Projects</h1>
      <p className="lede">See where each project stands. Open one for its tasks, results, and decisions.</p>
    </header>
    <div className="pj-board">
      {COLUMNS.map((column) => {
        const cards = projects.filter((item) => item.progress.column === column);
        return <section key={column} className={`pj-lane ${column === "waiting_on_you" ? "wait" : ""}`} style={{ "--lc": LANE[column].color } as CSSProperties} aria-labelledby={`lane-${column}`}>
          <div className="pj-lane-h"><div><h2 id={`lane-${column}`} className="pj-lane-t">{COLUMN_LABEL[column]}</h2><p className="pj-lane-sb">{LANE[column].sub}</p></div><span className="pj-lane-ct">{cards.length}</span></div>
          <div className="pj-notes">{cards.map((item) => {
            const owner = members.find((member) => member.slug === item.lead) ?? chief;
            return <Link key={item.slug} href={`/projects/${item.slug}`} className="pj-project-card" style={{ "--project-accent": item.color_dark } as CSSProperties}>
              <h3>{item.name}</h3><p className="pj-project-desc">{item.description}</p>
              {item.progress.question && <p className="pj-project-question">{item.progress.question}</p>}
              <div className="pj-progress-label"><span>{item.progress.done} of {item.progress.total} {item.progress.total === 1 ? "task" : "tasks"} done</span><b>{item.progress.percent}%</b></div>
              <progress value={item.progress.done} max={item.progress.total || 1} aria-label={`${item.name} task completion`} />
              <div className="pj-project-owner"><Avatar member={owner} size="sm" /><span>{owner?.name ?? "Your Muse"}</span><span aria-hidden="true">↗</span></div>
            </Link>;
          })}</div>
          {!cards.length && <p className="dashed pj-none">{column === "waiting_on_you" ? "Nothing needs your answer" : "No projects here"}</p>}
        </section>;
      })}
    </div>
    <p className="tell pj-tell">{chief?.name ?? "Muse"} organizes the work. You steer through comments and decisions inside each project.</p>
  </main>;
}
