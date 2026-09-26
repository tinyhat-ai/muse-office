import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { renderMarkdown, sanitizeRendered } from "@/lib/markdown";
import { all, get, json, type MemberRow, type NoteRow, type NoteCommentRow, type ProjectRow, type TaskRow } from "@/lib/db";
import { ago } from "@/lib/time";
import { Avatar } from "@/components/Avatar";
import { RenderedNote } from "@/components/notes/RenderedNote";
import { NoteCommentForm } from "@/components/notes/NoteCommentForm";
import { CommentFollowUp } from "@/components/CommentFollowUp";
import { RefreshUpdates } from "@/components/RefreshUpdates";
import "../notes.css";
import "../../tasks/tasks.css";

// One note, rendered from its markdown. The headings get ids so "On this page"
// can link to them, and table cells get the header's text as data-label so the
// phone stylesheet can stack each row into a small card.

const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

interface Heading { level: number; text: string; id: string }

/** Gives every h2/h3 an id built from its words (deduplicated) and returns them for the side list. */
function addHeadingIds(html: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = [];
  const seen = new Map<string, number>();
  const out = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_m, lvl: string, inner: string) => {
    const text = decode(inner.replace(/<[^>]+>/g, "")).trim();
    const base = slugify(text) || "section";
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    const id = n ? `${base}-${n + 1}` : base;
    headings.push({ level: Number(lvl), text, id });
    return `<h${lvl} id="${id}">${inner}</h${lvl}>`;
  });
  return { html: out, headings };
}

/** Labels each body cell with its column header, for the phone layout. */
function labelTableCells(html: string): string {
  return html.replace(/<table>[\s\S]*?<\/table>/g, (table) => {
    const heads = Array.from(table.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)).map((m) => decode(m[1].replace(/<[^>]+>/g, "")).trim());
    return table.replace(/<tbody>[\s\S]*?<\/tbody>/, (tbody) =>
      tbody.replace(/<tr>[\s\S]*?<\/tr>/g, (tr) => {
        let i = 0;
        return tr.replace(/<td\b/g, () => `<td data-label="${escapeAttr(heads[i++] ?? "")}"`);
      }),
    );
  });
}

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = get<NoteRow>("SELECT * FROM notes WHERE slug = ?", slug);
  if (!note) notFound();
  const now = new Date();

  const chief = get<MemberRow>("SELECT * FROM members WHERE is_chief = 1 ORDER BY sort_order LIMIT 1");
  const chiefName = chief?.name ?? "your chief of staff";
  const members = new Map(all<MemberRow>("SELECT * FROM members").map((m) => [m.slug, m]));
  const project = note.project ? get<ProjectRow>("SELECT * FROM projects WHERE slug = ?", note.project) : undefined;
  const keeper = note.kept_by ? members.get(note.kept_by) : undefined;
  const projects = new Map(all<ProjectRow>("SELECT * FROM projects").map((p) => [p.slug, p]));

  // Tasks this note came from; ids that no longer exist are skipped.
  const linkedIds = json<string[]>(note.linked_tasks_json, []);
  const linked = linkedIds.map((id) => get<TaskRow>("SELECT * FROM tasks WHERE id = ?", id)).filter((t): t is TaskRow => !!t);

  // Other notes of the same project; when there are none, the newest notes from anywhere.
  let related = note.project ? all<NoteRow>("SELECT * FROM notes WHERE project = ? AND slug <> ? ORDER BY updated_at DESC", note.project, note.slug) : [];
  const sameProject = related.length > 0;
  if (!sameProject) related = all<NoteRow>("SELECT * FROM notes WHERE slug <> ? ORDER BY updated_at DESC LIMIT 3", note.slug);

  const rendered = renderMarkdown(note.markdown);
  const { html: withIds, headings } = addHeadingIds(labelTableCells(rendered));
  const html = sanitizeRendered(withIds);
  const words = note.markdown.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  const tags = json<string[]>(note.tags_json, []);
  const comments = all<NoteCommentRow>("SELECT * FROM note_comments WHERE note = ? ORDER BY id", slug);
  const commentIds = new Set(comments.map((comment) => comment.id));
  const topComments = comments.filter((comment) => comment.reply_to == null || !commentIds.has(comment.reply_to));
  const label = note.project === "general" ? "Start here" : project?.name ?? "Note";
  const dark = project?.color_dark ?? "#9a978c";

  return (
    <main className="nt-page">
      <RefreshUpdates />
      <nav className="crumb nt-bar" aria-label="Breadcrumb">
        <Link href="/notes">Notes</Link>
        {project ? (
          <>
            <span className="nt-sep">/</span>
            <Link href={`/notes?project=${encodeURIComponent(project.slug)}`}>{project.name}</Link>
          </>
        ) : null}
        <span className="nt-sep">/</span>
        <span className="nt-here">{note.title}</span>
      </nav>

      <div className="nt-note">
        <article>
          <div className="nt-proj" style={{ "--d": dark } as CSSProperties}>
            <i aria-hidden="true" />
            {label}
          </div>
          <h1 className="nt-title">{note.title}</h1>
          {note.lede ? <p className="nt-note-lede">{note.lede}</p> : null}
          <div className="nt-meta">
            {keeper ? <Avatar member={keeper} size="sm" /> : null}
            <span>
              Kept by <b>{keeper?.name ?? chiefName}</b>
            </span>
            <span>·</span>
            <span>Updated {ago(note.updated_at, now)}</span>
            <span>·</span>
            <span>{minutes} min read</span>
          </div>
          {tags.length ? (
            <div className="nt-tags" aria-label="Tags">
              {tags.map((t) => (
                <Link key={t} href={`/notes?tag=${encodeURIComponent(t)}`}>#{t}</Link>
              ))}
            </div>
          ) : null}

          <RenderedNote html={html} />

          {linked.length ? (
            <section className="nt-from">
              <h2 className="nt-h4">Came from these tasks</h2>
              <div className="nt-tasks">
                {linked.map((t) => (
                  <Link key={t.id} className="nt-task" href={`/tasks/${t.id}`} style={{ "--c": projects.get(t.project)?.color ?? "#e9e7df" } as CSSProperties}>
                    {t.title}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="nt-comments" aria-labelledby="note-comments-title">
            <h2 id="note-comments-title">Comments</h2>
            <CommentFollowUp owner={keeper?.name ?? chiefName} />
            {topComments.map((comment) => <div className="nt-comment-thread" key={comment.id}>
              <div className="nt-comment">
                <b>{comment.author === "you" ? "You" : members.get(comment.author)?.name ?? comment.author}</b>
                <time dateTime={comment.created_at}>{ago(comment.created_at, now)}</time>
                <div className="md" dangerouslySetInnerHTML={{ __html: renderMarkdown(comment.body) }} />
                {comment.author === "you" && <span className="comment-state">{comment.unread_by_agent ? `Awaiting ${keeper?.name ?? chiefName}’s reply` : comments.some((reply) => reply.reply_to === comment.id && reply.author !== "you") ? "Replied" : "Seen"}</span>}
              </div>
              {comments.filter((reply) => reply.reply_to === comment.id).map((reply) => <div className="nt-comment nt-comment-reply" key={reply.id}>
                <b>{reply.author === "you" ? "You" : members.get(reply.author)?.name ?? reply.author}</b>
                <time dateTime={reply.created_at}>{ago(reply.created_at, now)}</time>
                <p>{reply.body}</p>
              </div>)}
            </div>)}
            <NoteCommentForm note={slug} />
          </section>
          <p className="tell nt-note-foot">To change the note itself, tell {chiefName} in chat.</p>
        </article>

        <aside className="nt-toc">
          {headings.length > 1 ? (
            <nav aria-label="On this page">
              <h2 className="nt-h4">On this page</h2>
              {headings.map((h) => (
                <a key={h.id} href={`#${h.id}`} className={h.level === 3 ? "nt-toc-sub" : undefined}>
                  {h.text}
                </a>
              ))}
            </nav>
          ) : null}
          {related.length ? (
            <div className="nt-rel">
              <h2 className="nt-h4">{sameProject && project ? `More in ${project.name}` : "More notes"}</h2>
              {related.map((r) => (
                <Link key={r.slug} href={`/notes/${r.slug}`}>
                  {r.title}
                  <span>
                    {(r.kept_by && members.get(r.kept_by)?.name) || chiefName} · updated {ago(r.updated_at, now)}
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
