import { all, json, type NoteCommentRow } from "@/lib/db";
import { ago } from "@/lib/time";
import { CommentForm, ReplyToggle } from "./CommentForm";
import { CommentBody } from "./CommentBody";

export function PageComments({ source, id, names }: { source: "note" | "project"; id: string; names: Map<string, string> }) {
  const table = source === "note" ? "note_comments" : "project_comments";
  const comments = all<NoteCommentRow>(`SELECT * FROM ${table} WHERE ${source} = ? ORDER BY id`, id);
  const ids = new Set(comments.map((c) => c.id));
  const target = source === "note" ? { note: id } : { project: id };
  function content(c: NoteCommentRow) {
    return <><b>{c.author === "you" ? "You" : names.get(c.author) ?? c.author}</b><time dateTime={c.created_at}>{ago(c.created_at)}</time><CommentBody body={c.body} files={json(c.files_json, [])} /></>;
  }
  return <section className="oc-thread" aria-label="Comments">
    <h2>Comments</h2>
    {comments.filter((c) => c.reply_to === null || !ids.has(c.reply_to)).map((c) => <div key={c.id} className="oc-comment">
      {content(c)}
      {comments.filter((r) => r.reply_to === c.id).map((r) => <div key={r.id} className="oc-reply">{content(r)}</div>)}
      <ReplyToggle {...target} replyTo={c.id} label="Reply" placeholder="Add a reply…" />
    </div>)}
    <CommentForm {...target} placeholder="Add a comment…" buttonLabel="Comment" />
  </section>;
}
