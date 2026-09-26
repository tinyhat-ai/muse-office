import Link from "next/link";
import { notFound } from "next/navigation";
import { all, get, COLUMN_LABEL, type Column, type MemberRow, type ProjectRow, type TaskRow, type ProjectCommentRow, type RuleRow } from "@/lib/db";
import { projectProgress } from "@/lib/project-progress";
import { renderMarkdown } from "@/lib/markdown";
import { ago, shortDate } from "@/lib/time";
import { Avatar } from "@/components/Avatar";
import { CommentForm } from "@/components/task/CommentForm";
import { CommentFollowUp } from "@/components/CommentFollowUp";
import { RefreshUpdates } from "@/components/RefreshUpdates";
import "../projects.css";
import "../../tasks/tasks.css";

const PILL: Record<Column, string> = { todo: "next", in_progress: "working", waiting_on_you: "needs", done: "done" };
const RANK: Record<Column, number> = { waiting_on_you: 0, in_progress: 1, todo: 2, done: 3 };

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = get<ProjectRow>("SELECT * FROM projects WHERE slug = ?", slug);
  if (!project) notFound();
  const members = all<MemberRow>("SELECT * FROM members ORDER BY sort_order");
  const member = new Map(members.map((item) => [item.slug, item]));
  const chief = members.find((item) => item.is_chief);
  const lead = member.get(project.lead ?? "") ?? chief;
  const tasks = all<TaskRow>("SELECT * FROM tasks WHERE project = ? ORDER BY updated_at DESC", slug).sort((a, b) => RANK[a.column_name] - RANK[b.column_name]);
  const progress = projectProgress(tasks);
  const comments = all<ProjectCommentRow>("SELECT * FROM project_comments WHERE project = ? ORDER BY id", slug);
  const rules = all<RuleRow>("SELECT * FROM project_rules WHERE project = ? ORDER BY learned_at DESC", slug);
  return <main className="wrap pp-wrap">
    <RefreshUpdates />
    <nav className="crumb"><Link href="/projects">‹ Projects</Link><span>/</span><span>{project.name}</span></nav>
    <header className="pp-head">
      <div><h1 className="title">{project.name}</h1><p className="lede">{project.description}</p>
        <div className="pp-meta"><Avatar member={lead} size="sm" /><span>Led by {lead?.name ?? "Muse"}</span><span className={`pill ${PILL[progress.column]}`}>{COLUMN_LABEL[progress.column]}</span></div>
      </div>
    </header>
    <section className="card pp-summary" aria-label="Project progress">
      <div><b>{progress.percent}% complete</b><progress value={progress.done} max={progress.total || 1} aria-label="Tasks complete" /><span>{progress.done} of {progress.total} {progress.total === 1 ? "task" : "tasks"} done</span></div>
      <div><b>{progress.waiting ? "Needs your answer" : "Next milestone"}</b><p>{progress.question ?? (progress.nextDue ? `Next task due ${shortDate(progress.nextDue)}` : progress.column === "done" ? "All task results are ready below." : "The team keeps the next steps on each task.")}</p></div>
    </section>
    <section className="pp-tasks" aria-labelledby="project-tasks">
      <h2 id="project-tasks">Tasks and results</h2>
      <p className="pp-help">Open a task to see the plan, completion checks, and conversation.</p>
      <div className="pp-task-list">{tasks.map((task) => {
        const owner = member.get(task.specialist ?? "") ?? lead;
        return <Link className="pp-task-card" key={task.id} href={`/tasks/${task.id}`}>
          <div className="pp-task-title"><h3>{task.title}</h3><span className={`pill ${PILL[task.column_name]}`}>{COLUMN_LABEL[task.column_name]}</span></div>
          <p>{task.column_name === "done" ? task.result_summary ?? "Open this task to review its recorded result." : task.question ?? task.note ?? task.job_definition}</p>
          <div className="pp-task-meta"><span><Avatar member={owner} size="xs" /> {owner?.name ?? "Muse"}</span><span>{task.due ? `Due ${shortDate(task.due)}` : `Updated ${ago(task.updated_at)}`}</span><b>{task.column_name === "done" ? "Review result ↗" : "Open task ↗"}</b></div>
        </Link>;
      })}</div>
      {!tasks.length && <p className="dashed pj-none">Tell {lead?.name ?? "Muse"} what you want to achieve here.</p>}
    </section>
    <section className="card pp-comments" aria-labelledby="project-comments">
      <h2 id="project-comments">Project direction</h2>
      <CommentFollowUp owner={lead?.name ?? "Muse"} />
      {comments.map((comment) => <article key={comment.id} className={`pp-comment ${comment.reply_to ? "reply" : ""}`}>
        <b>{comment.author === "you" ? "You" : member.get(comment.author)?.name ?? comment.author}</b><time>{ago(comment.created_at)}</time>
        <div className="md" dangerouslySetInnerHTML={{ __html: renderMarkdown(comment.body) }} />
        {comment.author === "you" && <span className="comment-state">{comment.unread_by_agent ? `Awaiting ${lead?.name ?? "Muse"}’s reply` : comments.some((reply) => reply.reply_to === comment.id && reply.author !== "you") ? "Replied" : "Seen"}</span>}
      </article>)}
      <CommentForm project={slug} placeholder="Add direction for the team…" buttonLabel="Comment" />
    </section>
    <details className="card pp-process"><summary>How this project runs</summary>
      <div className="md" dangerouslySetInnerHTML={{ __html: renderMarkdown(project.process_markdown ?? "") }} />
      {project.done_when && <><h3>Done when</h3><p>{project.done_when}</p></>}
      {rules.length > 0 && <><h3>What the team learned</h3><ul>{rules.map((rule) => <li key={rule.id}>{rule.text}</li>)}</ul></>}
    </details>
  </main>;
}
