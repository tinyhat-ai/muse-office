import { CommentBody } from "@/components/comments/CommentBody";
import { ExpandableContent } from "@/components/comments/ExpandableContent";
import { TaskHistory } from "@/components/task/TaskHistory";
import { commentThreads } from "@/lib/comment-threads";
import { recentTaskThreadIds } from "@/lib/task-history";
import Link from "next/link";
import { notFound } from "next/navigation";
import { renderMarkdown } from "@/lib/markdown";
import {
  all,
  get,
  json,
  COLUMN_LABEL,
  type CheckRow,
  type FileRow,
  type MemberRow,
  type PlanRow,
  type ProjectRow,
  type TaskRow,
  type UpdateRow,
} from "@/lib/db";
import { ago, dueWord, span, stamp } from "@/lib/time";
import { Avatar, You } from "@/components/Avatar";
import { CommentForm, ReplyToggle } from "@/components/task/CommentForm";
import { FocusCommentButton, MoneyButtons } from "@/components/task/MoneyButtons";
import "../tasks.css";

// A task's page, like an issue: the description on top, then the
// conversation. It is the one page where the user writes.

type Props = { params: Promise<{ id: string }> };

interface FileChip {
  name: string;
  url: string | null;
}

const VERB: Record<UpdateRow["kind"], string> = {
  event: "",
  update: "posted an update",
  question: "asked you",
  comment: "commented",
  reply: "replied",
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const task = get<Pick<TaskRow, "title">>("SELECT title FROM tasks WHERE id = ?", id);
  return { title: task ? `${task.title} · Office` : "Office" };
}

/** "Yes, pay $1,240 on Sep 28": the amount (and a date right after it) lifted from the question. */
function yesLabel(question: string): string {
  const m = question.match(/\$\s?\d[\d,]*(?:\.\d{1,2})?(?:\s+on\s+[A-Z][a-z]{2,8}\.?\s+\d{1,2})?/);
  return m ? `Yes, pay ${m[0].replace(/\s+/g, " ").replace("$ ", "$")}` : "Yes, pay";
}

/** One line under the question saying what a yes does. */
function yesHint(kind: string | null, who: string): string {
  if (kind === "money") return `A yes lets ${who} pay it and file the receipt; nothing moves without it.`;
  if (kind === "approve") return `A yes lets ${who} go ahead; nothing moves without it.`;
  return `Your answer lets ${who} carry on; nothing moves without it.`;
}

function When({ iso }: { iso: string }) {
  return (
    <time className="tm" dateTime={iso} title={stamp(iso)}>
      {ago(iso)}
    </time>
  );
}

function Chip({ file }: { file: FileChip }) {
  const label = (
    <>
      <span aria-hidden="true">📎</span> {file.name}
    </>
  );
  return file.url ? (
    <a className="tk-fl" href={file.url} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  ) : (
    <span className="tk-fl">{label}</span>
  );
}

export default async function TaskPage({ params }: Props) {
  const { id } = await params;
  const task = get<TaskRow>("SELECT * FROM tasks WHERE id = ?", id);
  if (!task) notFound();

  const project = get<ProjectRow>("SELECT * FROM projects WHERE slug = ?", task.project);
  const memberList = all<MemberRow>("SELECT * FROM members ORDER BY sort_order");
  const members = new Map(memberList.map((m) => [m.slug, m]));
  const chief = memberList.find((m) => m.is_chief) ?? memberList[0];
  const specialist = task.specialist ? members.get(task.specialist) : undefined;
  const worker = specialist ?? chief; // the chief does the one-offs itself
  const checks = all<CheckRow>("SELECT * FROM task_checks WHERE task = ? ORDER BY position, id", id);
  const plan = all<PlanRow>("SELECT * FROM task_plan WHERE task = ? ORDER BY position, id", id);
  const taskFiles = all<FileRow>("SELECT * FROM task_files WHERE task = ? ORDER BY added_at, id", id);
  const updates = all<UpdateRow>("SELECT * FROM task_updates WHERE task = ? ORDER BY created_at, id", id);

  const chiefName = chief?.name ?? "your Muse";
  const workerName = worker?.name ?? "the team";
  const audience = worker && chief && worker.slug !== chief.slug ? `${chiefName} and ${workerName}` : chiefName;
  const nameOf = (slug: string) => (slug === "you" ? "You" : (members.get(slug)?.name ?? slug));
  const avatarOf = (slug: string, size: "sm" | "md") => (slug === "you" ? <You size={size} /> : <Avatar member={members.get(slug)} size={size} />);
  const projectName = project?.name ?? task.project;
  const projectSlug = project?.slug ?? task.project;
  const barColor = project?.color_dark ?? "#9a978c";
  const isDone = task.column_name === "done";
  const waiting = task.column_name === "waiting_on_you";

  const threads = commentThreads(updates);
  const top = threads.map(({ root }) => root);
  const replies = new Map(threads.map(({ root, replies: children }) => [root.id, children]));
  const updateCount = updates.filter((u) => u.kind !== "event").length;

  // The pinned question: the latest question row is its author and the thing
  // a yes replies to; the text is the task's own question.
  // The current question is the newest question row whose text is the task's question
  // (move_task posts it). An answer counts only when it replies to that row, so a yes
  // to an earlier question can never show as the answer to a new one.
  const questionRow = waiting ? [...updates].reverse().find((u) => u.kind === "question" && (!task.question || u.body === task.question)) : undefined;
  const questionText = waiting ? (task.question ?? questionRow?.body ?? null) : null;
  const askerSlug = questionRow?.author ?? worker?.slug ?? "";
  const askerName = questionRow ? nameOf(questionRow.author) : workerName;
  const answer = questionRow ? [...updates].reverse().find((u) => u.author === "you" && u.reply_to === questionRow.id) : undefined;
  const pinnedId = questionRow && !answer ? questionRow.id : null;
  const previewIds = recentTaskThreadIds(threads.filter(({ root }) => root.id !== pinnedId));
  const hasConversation = threads.some(({ root, replies: children }) => root.kind !== "event" && (root.id !== pinnedId || children.length > 0));
  const currentSummary = task.note || plan.find((item) => item.state === "now")?.text;

  // Files: the task's own files first, then anything attached to an update, once each.
  const files: FileChip[] = [];
  const seen = new Set<string>();
  const attached = updates.flatMap((u) => json<Array<Partial<FileChip>>>(u.files_json, []));
  for (const f of [...taskFiles, ...attached]) {
    if (!f || typeof f.name !== "string" || !f.name) continue;
    const key = JSON.stringify([f.name, f.url ?? null]);
    if (seen.has(key)) continue;
    seen.add(key);
    files.push({ name: f.name, url: typeof f.url === "string" && f.url ? f.url : null });
  }

  function renderReply(r: UpdateRow) {
    return (
      <div className="tk-r" key={r.id} id={`update-${r.id}`}>
        {avatarOf(r.author, "sm")}
        <div>
          <b>{nameOf(r.author)}</b>
          <When iso={r.created_at} />
          <br />
          <CommentBody body={r.body} files={json(r.files_json, [])} collapse />
        </div>
      </div>
    );
  }

  function renderCard(u: UpdateRow) {
    const mine = u.author === "you";
    const pinnedAbove = u.id === pinnedId;
    const cls = ["tk-cm", u.kind === "question" ? "q" : "", pinnedAbove ? "pinned-above" : "", mine ? "mine" : ""].filter(Boolean).join(" ");
    const own = replies.get(u.id) ?? [];
    const who = nameOf(u.author);
    return (
      <article className={cls} key={u.id} id={`update-${u.id}`}>
        {avatarOf(u.author, "md")}
        <div className="tk-cm-box">
          <div className="tk-cm-h">
            <b>{who}</b>
            <span className="k">{VERB[u.kind] || u.kind}</span>
            <When iso={u.created_at} />
          </div>
          <div className="tk-cm-b">
            <CommentBody body={u.body} files={json(u.files_json, [])} collapse />
          </div>
          {own.length ? (
            <TaskHistory
              className="tk-replies"
              label="Replies"
              previewIds={own.slice(-2).map((r) => r.id)}
              items={own.map((r) => ({ id: r.id, anchors: [r.id], content: renderReply(r) }))}
            />
          ) : null}
          {pinnedAbove ? (
            <div className="tk-cm-note">Waiting on you · answer above ↑</div>
          ) : (
            <div className="tk-cm-f">
              <ReplyToggle
                task={task!.id}
                replyTo={u.id}
                label={u.kind === "question" && !mine ? `Reply to ${who}` : "Reply"}
                placeholder={mine ? "Add to your comment…" : `Reply to ${who}…`}
              />
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <main className="wrap tk">
      {/* 1. where this task lives, its title, and where it stands */}
      <nav className="crumb tk-crumb" aria-label="Breadcrumb">
        <Link href="/projects">‹ Tasks</Link>
        <span>/</span>
        <Link href={`/projects?project=${encodeURIComponent(projectSlug)}`}>{projectName}</Link>
      </nav>
      <div className="tk-proj">
        <span className="stripe" style={{ background: barColor }} aria-hidden="true" />
        {projectName}
      </div>
      <h1 className="title">{task.title}</h1>
      {task.job_definition ? (
        <ExpandableContent key={task.id} className="tk-description" label="task description">
          <div className="md tk-def" dangerouslySetInnerHTML={{ __html: renderMarkdown(task.job_definition) }} />
        </ExpandableContent>
      ) : null}

      <section className="tk-overview" aria-label="Task overview">
        <div className="tk-meta">
          <span className={`tk-st ${task.column_name}`}>{COLUMN_LABEL[task.column_name] ?? task.column_name}</span>
          {worker ? (
            <span className="tk-who">
              <Avatar member={worker} size="xs" />
              {isDone ? `Done by ${workerName}` : `${workerName} is on it`}
            </span>
          ) : null}
          <span>
            {waiting ? `Waiting ${span(task.updated_at)}` : `Updated ${ago(task.updated_at)}`}
          </span>
          {task.due && !isDone ? <span>Due {dueWord(task.due)}</span> : null}
        </div>
        {currentSummary ? <p className="tk-summary">{currentSummary}</p> : null}

        {/* 2. the unanswered question, pinned while the task waits on the user */}
        {waiting && questionText ? (
          <section className="tk-cm q tk-pin" aria-label={`${askerName} asked you`}>
            {avatarOf(askerSlug, "md")}
            <div className="tk-cm-box">
              <div className="tk-cm-h">
                <b>{askerName}</b>
                <span className="k">asked you</span>
                <When iso={questionRow?.created_at ?? task.updated_at} />
              </div>
              <div className="tk-cm-b">
                <div className="body">{questionText}</div>
              </div>
              {answer ? (
                <div className="tk-answered">
                  <You size="sm" />
                  <div>
                    <span className="body">You answered: {answer.body || json<Array<{ name: string }>>(answer.files_json, []).map((file) => file.name).join(", ")}</span> <span className="tm">· {ago(answer.created_at)}</span>
                    <span className="next">{chiefName} will pick it up</span>
                  </div>
                </div>
              ) : (
                <div className="tk-cm-f">
                  {task.question_kind === "money" && questionRow ? (
                    <MoneyButtons task={task.id} questionId={questionRow.id} yesLabel={yesLabel(questionText)} />
                  ) : questionRow ? (
                    <ReplyToggle task={task.id} replyTo={questionRow.id} label={`Reply to ${askerName}`} placeholder={`Reply to ${askerName}…`} />
                  ) : (
                    <FocusCommentButton label={`Reply to ${askerName}`} />
                  )}
                  <span className="qhint">{yesHint(task.question_kind, askerName)}</span>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {checks.length ? (
          <>
            <h3 className="tk-h3">Done when</h3>
            <ul className="tk-chk">
              {checks.map((c) => (
                <li key={c.id} className={c.met ? "ok" : undefined}>
                  <span>{c.text}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      {task.original_request ? <details className="tk-req">
        <summary>Original request</summary>
        <div>{task.original_request}</div>
      </details> : null}

      {plan.length ? <details className="tk-req">
        <summary>Plan</summary>
        <ol className="tk-plan">
          {plan.map((p) => (
            <li key={p.id} className={p.state === "now" || p.state === "done" ? p.state : undefined}>
              {p.state === "done" ? (
                <span className="tk-tick" aria-label="done">
                  ✓
                </span>
              ) : null}
              {p.text}
              {p.state === "now" ? <span className="tk-now"> · now</span> : null}
            </li>
          ))}
        </ol>
      </details> : null}

      {/* 6. the conversation */}
      {hasConversation ? <>
        <div className="tk-sec" />
        <h2 className="tk-h2">
          Conversation
          <span className="sub">
            {updateCount} {updateCount === 1 ? "update" : "updates"}
          </span>
        </h2>
        <TaskHistory key={task.id} className="tk-conv" label="Task conversation" previewIds={previewIds} items={top.map((u) => ({
          id: u.id,
          anchors: [u.id, ...(replies.get(u.id) ?? []).map((r) => r.id)],
          content: u.kind === "event" ? (
            <div className="tk-ev" key={u.id} id={`update-${u.id}`}>
              <span className="d" aria-hidden="true" />
              <div>
                {u.body}
                <span className="t">
                  <When iso={u.created_at} />
                </span>
              </div>
            </div>
          ) : renderCard(u),
        }))} />
      </> : null}

      {/* 7. the comment box */}
      <div className="tk-composer">
        <You size="md" />
        <div className="cbox">
          <CommentForm task={task.id} id="new-comment" placeholder={`Add a comment for ${audience}…`} buttonLabel="Comment" />
        </div>
      </div>

      {/* 8. files */}
      {files.length ? <>
        <div className="tk-sec" />
        <div className="tk-out">
          <h2 className="tk-h2">Files from this task</h2>
          <div className="tk-files">
            {files.map((f) => (
              <Chip key={JSON.stringify([f.name, f.url])} file={f} />
            ))}
          </div>
        </div>
      </> : null}

      {/* 9. who is behind it */}
      <div className="tk-foot">
        {chief ? <Avatar member={chief} size="xs" /> : null}
        <span>
          Managed by {chiefName} · worked on by {workerName}
        </span>
      </div>
    </main>
  );
}
