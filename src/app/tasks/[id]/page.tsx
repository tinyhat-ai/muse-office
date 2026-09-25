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

  // Replies hang under the top-level update they answer, following a chain
  // of replies up to its root. A reply whose parent is gone stands on its own.
  const byId = new Map(updates.map((u) => [u.id, u]));
  function rootOf(u: UpdateRow): UpdateRow | null {
    let cur = u;
    for (let hops = 0; cur.reply_to != null && hops < 20; hops++) {
      const parent = byId.get(cur.reply_to);
      if (!parent) break;
      cur = parent;
    }
    return cur === u ? null : cur;
  }
  const top: UpdateRow[] = [];
  const replies = new Map<number, UpdateRow[]>();
  for (const u of updates) {
    const root = rootOf(u);
    if (!root) {
      top.push(u);
      continue;
    }
    const list = replies.get(root.id) ?? [];
    list.push(u);
    replies.set(root.id, list);
  }
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

  // Files: the task's own files first, then anything attached to an update, once each.
  const files: FileChip[] = [];
  const seen = new Set<string>();
  const attached = updates.flatMap((u) => json<Array<Partial<FileChip>>>(u.files_json, []));
  for (const f of [...taskFiles, ...attached]) {
    if (!f || typeof f.name !== "string" || !f.name || seen.has(f.name)) continue;
    seen.add(f.name);
    files.push({ name: f.name, url: typeof f.url === "string" && f.url ? f.url : null });
  }

  const replyHint = `${audience} will see this.`;

  function renderReply(r: UpdateRow) {
    return (
      <div className="tk-r" key={r.id}>
        {avatarOf(r.author, "sm")}
        <div>
          <b>{nameOf(r.author)}</b>
          <When iso={r.created_at} />
          <br />
          <span className="body">{r.body}</span>
        </div>
      </div>
    );
  }

  function renderCard(u: UpdateRow) {
    const mine = u.author === "you";
    const pinnedAbove = u.id === pinnedId;
    const cls = ["tk-cm", u.kind === "question" ? "q" : "", pinnedAbove ? "pinned-above" : "", mine ? "mine" : ""].filter(Boolean).join(" ");
    const attachedHere = json<Array<Partial<FileChip>>>(u.files_json, []).filter((f): f is FileChip => typeof f?.name === "string" && !!f.name);
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
            <div className="body">{u.body}</div>
            {attachedHere.length ? (
              <div className="tk-chips">
                {attachedHere.map((f) => (
                  <Chip key={f.name} file={{ name: f.name, url: f.url ?? null }} />
                ))}
              </div>
            ) : null}
          </div>
          {own.length ? <div className="tk-replies">{own.map(renderReply)}</div> : null}
          {pinnedAbove ? (
            <div className="tk-cm-note">Waiting on you · answer above ↑</div>
          ) : (
            <div className="tk-cm-f">
              <ReplyToggle
                task={task!.id}
                replyTo={u.id}
                label={u.kind === "question" && !mine ? `Reply to ${who}` : "Reply"}
                placeholder={mine ? "Add to your comment…" : `Reply to ${who}…`}
                hint={replyHint}
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
        <Link href="/projects">‹ Projects</Link>
        <span>/</span>
        <Link href={`/projects?project=${encodeURIComponent(projectSlug)}`}>{projectName}</Link>
      </nav>
      <div className="tk-proj">
        <span className="stripe" style={{ background: barColor }} aria-hidden="true" />
        {projectName}
      </div>
      <h1 className="title">{task.title}</h1>
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
                  <span className="body">You answered: {answer.body}</span> <span className="tm">· {ago(answer.created_at)}</span>
                  <span className="next">{chiefName} will pick it up</span>
                </div>
              </div>
            ) : (
              <div className="tk-cm-f">
                {task.question_kind === "money" && questionRow ? (
                  <MoneyButtons task={task.id} questionId={questionRow.id} yesLabel={yesLabel(questionText)} />
                ) : questionRow ? (
                  <ReplyToggle task={task.id} replyTo={questionRow.id} label={`Reply to ${askerName}`} placeholder={`Reply to ${askerName}…`} hint={replyHint} />
                ) : (
                  <FocusCommentButton label={`Reply to ${askerName}`} />
                )}
                <span className="qhint">{yesHint(task.question_kind, askerName)}</span>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* 3. what this is */}
      <h2 className="tk-h2">What this is</h2>
      {task.job_definition ? (
        <div className="md tk-def" dangerouslySetInnerHTML={{ __html: renderMarkdown(task.job_definition) }} />
      ) : (
        <p className="tk-empty">Not written yet.</p>
      )}
      {task.original_request ? (
        <details className="tk-req">
          <summary>Original request</summary>
          <div>{task.original_request}</div>
        </details>
      ) : null}

      {/* 4. done when */}
      <div className="tk-sec" />
      <h3 className="tk-h3">Done when</h3>
      {checks.length ? (
        <ul className="tk-chk">
          {checks.map((c) => (
            <li key={c.id} className={c.met ? "ok" : undefined}>
              <span>{c.text}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="tk-empty">Not written yet.</p>
      )}

      {/* 5. plan */}
      <div className="tk-sec" />
      <h3 className="tk-h3">Plan</h3>
      {plan.length ? (
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
      ) : (
        <p className="tk-empty">No plan yet.</p>
      )}

      {/* 6. the conversation */}
      <div className="tk-sec" />
      <h2 className="tk-h2">
        Conversation
        <span className="sub">
          {updateCount} {updateCount === 1 ? "update" : "updates"}
        </span>
      </h2>
      {top.length ? (
        <div className="tk-conv">
          {top.map((u) =>
            u.kind === "event" ? (
              <div className="tk-ev" key={u.id}>
                <span className="d" aria-hidden="true" />
                <div>
                  {u.body}
                  <span className="t">
                    <When iso={u.created_at} />
                  </span>
                </div>
              </div>
            ) : (
              renderCard(u)
            ),
          )}
        </div>
      ) : (
        <p className="tk-empty">Nothing yet. Updates from the team show up here.</p>
      )}

      {/* 7. the comment box */}
      <div className="tk-composer">
        <You size="md" />
        <div className="cbox">
          <CommentForm task={task.id} id="new-comment" placeholder={`Add a comment for ${audience}…`} buttonLabel="Comment" hint="✎ The one place you can write in Office" />
        </div>
      </div>

      {/* 8. files */}
      <div className="tk-sec" />
      <div className="tk-out">
        <h2 className="tk-h2">Files from this task</h2>
        {files.length ? (
          <div className="tk-files">
            {files.map((f) => (
              <Chip key={f.name} file={f} />
            ))}
          </div>
        ) : (
          <p className="tk-empty">No files yet. They show up here when {workerName} finishes.</p>
        )}
      </div>

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
