import Link from "next/link";
import { renderMarkdown } from "@/lib/markdown";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { all, get, COLUMN_LABEL, type Column, type MemberRow, type ProjectRow, type RuleRow, type StepRow, type TaskRow } from "@/lib/db";
import { shortDate } from "@/lib/time";
import { Avatar, You } from "@/components/Avatar";
import "../projects.css";

// Column → the shared status pill; "Right now" lists what needs the user first, then live work, then the queue.
const PILL: Record<Column, string> = { todo: "next", in_progress: "working", waiting_on_you: "needs", done: "done" };
const RANK: Record<Column, number> = { waiting_on_you: 0, in_progress: 1, todo: 2, done: 3 };

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = get<ProjectRow>("SELECT * FROM projects WHERE slug = ?", slug);
  if (!project) notFound();

  const members = all<MemberRow>("SELECT * FROM members ORDER BY sort_order");
  const member = new Map(members.map((m) => [m.slug, m]));
  const chiefName = members.find((m) => m.is_chief === 1)?.name ?? "your chief of staff";
  const lead = project.lead ? member.get(project.lead) : undefined;
  const steps = all<StepRow>("SELECT * FROM process_steps WHERE project = ? ORDER BY position", slug);
  const rules = all<RuleRow>("SELECT * FROM project_rules WHERE project = ? ORDER BY learned_at DESC, id DESC", slug);
  // Sorted by time in SQL, then by column here; the sort is stable so newest stays first within a column.
  const open = all<TaskRow>("SELECT * FROM tasks WHERE project = ? AND column_name != 'done' ORDER BY updated_at DESC", slug).sort(
    (a, b) => RANK[a.column_name] - RANK[b.column_name],
  );
  const waiting = open.filter((t) => t.column_name === "waiting_on_you").length;
  const paper = { "--c": project.color, "--d": project.color_dark } as CSSProperties;

  // The process text as the Muse wrote it; "Done when" is added only when the text left it out.
  let md = project.process_markdown ?? "";
  if (project.done_when && !/done when/i.test(md)) md += `\n\n## Done when\n\n${project.done_when}\n`;
  const html = renderMarkdown(md);

  const stepNode = (s: StepRow) => {
    const here = open.filter((t) => t.step === s.position);
    const you = s.who === "you";
    const doer = you ? undefined : member.get(s.who);
    const doerName = you ? "You" : s.who === "any" ? "Whoever fits" : (doer?.name ?? s.who);
    const cls = ["pp-step", you ? "you" : "", here.some((t) => t.column_name === "waiting_on_you") ? "wait" : ""].filter(Boolean).join(" ");
    return (
      <li key={s.id} className={cls}>
        <span className="pp-dot">
          {you ? <You size="md" /> : <Avatar member={doer} size={doer ? "lg" : "md"} />}
          {here.length ? <span className="pp-badge">{here.length} open</span> : null}
        </span>
        <span className="pp-step-txt">
          <span className="pp-step-nm">{s.name}</span>
          <span className="pp-step-who">{doerName}</span>
          {s.needs_you ? <span className="pp-ok">your OK</span> : null}
          {s.note ? <span className="pp-step-desc">{s.note}</span> : null}
        </span>
      </li>
    );
  };

  return (
    <main className="wrap pp-wrap">
      <nav className="crumb" aria-label="Breadcrumb">
        <Link href="/projects">Projects</Link>
        <span aria-hidden="true">/</span>
        <span>{project.name}</span>
      </nav>

      <header className="pp-head" style={paper}>
        <span className="pp-bar" aria-hidden="true" />
        <div>
          <h1 className="title">{project.name}</h1>
          {project.description ? <p className="pp-desc">{project.description}</p> : null}
          <div className="pp-meta">
            {lead ? (
              <span className="pp-pill">
                <Avatar member={lead} size="xs" />
                Led by {lead.name}
              </span>
            ) : null}
            {project.kind ? <span className="pp-pill plain">Runs like: {project.kind}</span> : null}
            <span className="pp-pill plain">{open.length} open</span>
            {waiting ? <span className="pp-pill plain w">{waiting} waiting on you</span> : null}
          </div>
        </div>
      </header>

      <div className="pp-body">
        <section className="card pp-flow" aria-labelledby="pp-how">
          <h2 id="pp-how">How {project.name} runs</h2>
          {steps.length ? (
            <ol className="pp-steps" style={paper}>
              {steps.map(stepNode)}
            </ol>
          ) : (
            <p className="pp-empty">
              No steps written down yet. Ask {chiefName} how {project.name} runs.
            </p>
          )}
        </section>

        <section className="card pp-md" aria-label="The process, written out">
          <div className="md">
            <div dangerouslySetInnerHTML={{ __html: html }} />
            <h2>Rules learned</h2>
            {rules.length ? (
              <ul>
                {rules.map((r) => (
                  <li key={r.id}>
                    {r.text}{" "}
                    <span className="by">
                      — {shortDate(r.learned_at)}, {r.origin === "ok" ? `${chiefName} suggested · you OK’d` : "from you"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="by">None yet. When you correct something, {chiefName} writes it here.</p>
            )}
          </div>
          <p className="pp-src">Written and kept current by {chiefName}. It changes when you correct something.</p>
        </section>

        <aside className="card pp-side" aria-labelledby="pp-now">
          <h2 id="pp-now" className="pp-side-h">
            Right now
          </h2>
          {open.length ? (
            open.map((t) => (
              <Link key={t.id} href={`/tasks/${t.id}`} className="pp-row">
                <Avatar member={t.specialist ? member.get(t.specialist) : undefined} size="xs" />
                <span className="pp-row-t">{t.title}</span>
                <span className={`pill ${PILL[t.column_name]}`}>{COLUMN_LABEL[t.column_name]}</span>
              </Link>
            ))
          ) : (
            <p className="pp-empty">Nothing open. Ask {chiefName} for something.</p>
          )}
          <p className="tell pp-tell">To change how {project.name} runs, tell {chiefName} in chat.</p>
        </aside>
      </div>
    </main>
  );
}
