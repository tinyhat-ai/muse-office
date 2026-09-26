import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { all, get, type MemberRow, type ProjectRow, type ProjectCommentRow, type RuleRow } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";
import { ago } from "@/lib/time";
import { Avatar, You } from "@/components/Avatar";
import { CommentForm } from "@/components/task/CommentForm";
import { CommentFollowUp } from "@/components/CommentFollowUp";
import { RefreshUpdates } from "@/components/RefreshUpdates";
import "../projects.css";
import "../../tasks/tasks.css";

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = get<ProjectRow>("SELECT * FROM projects WHERE slug = ?", slug);
  if (!project) notFound();
  const members = all<MemberRow>("SELECT * FROM members ORDER BY sort_order");
  const member = new Map(members.map((item) => [item.slug, item]));
  const chief = members.find((item) => item.is_chief);
  const lead = member.get(project.lead ?? "") ?? chief;
  const comments = all<ProjectCommentRow>("SELECT * FROM project_comments WHERE project = ? ORDER BY id", slug);
  const roots = comments.filter((comment) => !comment.reply_to || !comments.some((parent) => parent.id === comment.reply_to));
  const rules = all<RuleRow>("SELECT * FROM project_rules WHERE project = ? ORDER BY learned_at DESC", slug);
  function renderComment(comment: ProjectCommentRow) {
    const replies = comments.filter((reply) => reply.reply_to === comment.id);
    return <article key={comment.id} className={`pp-comment ${comment.reply_to ? "reply" : ""}`}>
      {comment.author === "you" ? <You size="xs" /> : <Avatar member={member.get(comment.author)} size="xs" />} {" "}
      <b>{comment.author === "you" ? "You" : member.get(comment.author)?.name ?? comment.author}</b><time>{ago(comment.created_at)}</time>
      <div className="md" dangerouslySetInnerHTML={{ __html: renderMarkdown(comment.body, true) }} />
      {comment.author === "you" && <span className="comment-state">{comment.unread_by_agent ? `Awaiting ${lead?.name ?? "Muse"}’s reply` : replies.some((reply) => reply.author !== "you") ? "Replied" : "Seen"}</span>}
      {replies.map(renderComment)}
    </article>;
  }
  return <main className="wrap pp-wrap">
    <RefreshUpdates />
    <nav className="crumb"><Link href="/projects">‹ Tasks</Link><span>/</span><span>{project.name}</span></nav>
    <header className="pp-head" style={{ "--c": project.color, "--d": project.color_dark } as CSSProperties}>
      <span className="pp-bar" aria-hidden="true" />
      <div><h1 className="title">{project.name}</h1><p className="pp-desc">{project.description}</p>
        <div className="pp-meta"><span className="pp-pill"><Avatar member={lead} size="xs" />Led by {lead?.name ?? "Muse"}</span></div>
      </div>
    </header>
    {project.archived_at ? <p className="lede">This project is archived. Ask {chief?.name ?? "Muse"} in chat to resume it.</p> : <Link href={`/projects?project=${encodeURIComponent(slug)}`}>View tasks in {project.name} →</Link>}
    {(project.process_markdown || rules.length > 0) && <section className="card pp-context">
      {!project.process_markdown && <h2>How we work here</h2>}
      <div className="md" dangerouslySetInnerHTML={{ __html: renderMarkdown(project.process_markdown ?? "") }} />
      {rules.length > 0 && <><h2>Rules learned</h2><ul>{rules.map((rule) => <li key={rule.id}>{rule.text} <time dateTime={rule.learned_at}>· {ago(rule.learned_at)}</time></li>)}</ul></>}
    </section>}
    <section className="card pp-comments" aria-labelledby="project-comments">
      <h2 id="project-comments">Comments</h2>
      <CommentFollowUp owner={lead?.name ?? "Muse"} />
      {roots.map(renderComment)}
      <CommentForm project={slug} placeholder={`Add a comment for ${lead?.name ?? "Muse"}…`} buttonLabel="Comment" hint="Your comment stays with this project." />
    </section>
    <p className="tell">To change this project, tell {chief?.name ?? "Muse"} in chat.</p>
  </main>;
}
