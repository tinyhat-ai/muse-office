import { Fragment } from "react";
import Link from "next/link";
import { all, json, type MemberRow, type ProjectRow, type TaskRow } from "@/lib/db";
import { ago } from "@/lib/time";
import { Avatar } from "@/components/Avatar";
import "./team.css";

// Small counts read as words ("runs five specialists"); bigger ones stay digits.
const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const countWord = (n: number) => WORDS[n] ?? String(n);
const listWords = (xs: string[]) => (xs.length < 3 ? xs.join(" and ") : `${xs.slice(0, -1).join(", ")}, and ${xs[xs.length - 1]}`);
const article = (noun: string) => (/^[aeiou]/i.test(noun) ? "an" : "a");
const finishedAt = (t: TaskRow) => t.done_at ?? t.updated_at;

type Status = { kind: "needs" | "working" | "next"; label: string; task?: string };

// Waiting on the user beats working, which beats the next thing to pick up.
// A single task goes on its own line under the label; counts stay in the label.
function statusOf(mine: TaskRow[]): Status {
  const waiting = mine.filter((t) => t.column_name === "waiting_on_you");
  const doing = mine.filter((t) => t.column_name === "in_progress");
  const todo = mine
    .filter((t) => t.column_name === "todo")
    .sort((a, b) => (a.due ?? "~").localeCompare(b.due ?? "~") || a.created_at.localeCompare(b.created_at));
  if (waiting.length > 1) return { kind: "needs", label: `Waiting on you: ${waiting.length} tasks` };
  if (waiting.length) return { kind: "needs", label: "Waiting on you:", task: waiting[0].title };
  if (doing.length > 1) return { kind: "working", label: `Working on ${doing.length} tasks` };
  if (doing.length) return { kind: "working", label: "Working on", task: doing[0].title };
  if (todo.length) return { kind: "next", label: "Next:", task: todo[0].title };
  return { kind: "next", label: "Free right now" };
}

function latestDone(mine: TaskRow[]): TaskRow[] {
  return mine
    .filter((t) => t.column_name === "done")
    .sort((a, b) => finishedAt(b).localeCompare(finishedAt(a)))
    .slice(0, 2);
}

// The panel renders twice: once as the sticky right column (desktop), once
// inline after the selected card (narrow screens). CSS shows one at a time.
function MateDetail({ m, chiefName, variant }: { m: MemberRow; chiefName: string; variant: "side" | "inline" }) {
  const does = json<string[]>(m.does_json, []);
  const skills = json<string[]>(m.skills_json, []);
  return (
    <aside className={`card tm-detail tm-detail-${variant}`} aria-label={`How ${m.name} works`}>
      <div className="tm-hd">
        <Avatar member={m} size="lg" />
        <div>
          <h2 className="tm-dnm">{m.name}</h2>
          <div className="tm-drl">
            {m.role}
            {m.hat ? ` · wears ${article(m.hat)} ${m.hat}` : ""}
          </div>
        </div>
      </div>
      <h3>How {m.name} works</h3>
      {does.length ? (
        <ul>
          {does.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      ) : (
        <p className="tm-none">Not written down yet.</p>
      )}
      <h3>Never</h3>
      {m.never ? (
        <ul>
          <li>{m.never}</li>
        </ul>
      ) : (
        <p className="tm-none">Not written down yet.</p>
      )}
      <h3>Skills</h3>
      {skills.length ? (
        <div className="tm-skills">
          {skills.map((s, i) => (
            <span className="chip" key={i}>
              {s}
            </span>
          ))}
        </div>
      ) : (
        <p className="tm-none">None listed yet.</p>
      )}
      <h3>Last rule learned</h3>
      {m.last_rule ? <div className="tm-learned">{m.last_rule}</div> : <p className="tm-none">No rules yet.</p>}
      <p className="tell tm-home">
        To change how {m.name} works, or to pause {m.name}, tell {chiefName} in chat.
      </p>
    </aside>
  );
}

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function TeamPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const who = Array.isArray(params.who) ? params.who[0] : params.who;

  const members = all<MemberRow>("SELECT * FROM members ORDER BY is_chief DESC, sort_order, name");
  const chief = members.find((m) => m.is_chief === 1);
  const specialists = members.filter((m) => m !== chief);
  const tasks = all<TaskRow>("SELECT * FROM tasks WHERE specialist IS NOT NULL ORDER BY updated_at DESC");
  const projects = all<ProjectRow>("SELECT * FROM projects ORDER BY sort_order, name");

  const chiefName = chief?.name ?? "your chief of staff";
  const selected = specialists.find((m) => m.slug === who) ?? specialists[0];
  const n = specialists.length;
  // The dashed card names what the team covers: the projects a specialist leads.
  const areas = projects.filter((p) => specialists.some((s) => s.slug === p.lead)).map((p) => p.name.toLowerCase());

  const lede =
    n === 0
      ? `${chiefName} has no specialists yet. Ask ${chiefName} to hire one.`
      : `${chiefName} runs ${n === 1 ? "one specialist" : `${countWord(n)} specialists`} for you. Ask ${chiefName} to hire, retrain, pause, or retire one.`;
  const cover = n === 1 ? "This one covers" : `These ${countWord(n)} cover`;

  return (
    <main className="wrap">
      <header className="head">
        <div className="kick">Who does the work</div>
        <h1 className="title">Team</h1>
        <p className="lede">{lede}</p>
      </header>

      <div className="tm-grid">
        <div className="tm-left">
          {chief && (
            <section className="card tm-chief">
              <Avatar member={chief} size="xl" />
              <div>
                <h2 className="tm-nm">{chief.name}</h2>
                <div className="tm-rl">{chief.role}</div>
                <p>{chief.job}</p>
                <div className="tm-wear">
                  Wearing the <b>Chief of Staff</b> hat from Tinyhat
                </div>
              </div>
            </section>
          )}

          <div className="tm-mates">
            {specialists.map((m) => {
              const mine = tasks.filter((t) => t.specialist === m.slug);
              const st = statusOf(mine);
              const done = latestDone(mine);
              const on = m.slug === selected?.slug;
              return (
                <Fragment key={m.slug}>
                  <Link
                    href={`/team?who=${encodeURIComponent(m.slug)}`}
                    scroll={false}
                    className={"tm-mate" + (on ? " tm-on" : "")}
                    aria-current={on ? "true" : undefined}
                  >
                    <div className="tm-top">
                      <Avatar member={m} size="md" />
                      <div>
                        <h2 className="tm-nm">{m.name}</h2>
                        <div className="tm-rl">{m.role}</div>
                      </div>
                    </div>
                    <p className="tm-job">{m.job}</p>
                    <span className={`pill ${st.kind} tm-status`}>
                      <b>{st.label}</b>
                      {st.task ? (
                        <span className="tm-task" title={st.task}>
                          {st.task}
                        </span>
                      ) : null}
                    </span>
                    {done.length > 0 && (
                      <div className="tm-latest">
                        {done.map((t) => (
                          <div key={t.id}>
                            <span className="tm-ok" role="img" aria-label="Done">
                              ✓
                            </span>
                            <span>{t.title}</span>
                            <span className="tm-when">{ago(finishedAt(t))}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Link>
                  {on && <MateDetail m={m} chiefName={chiefName} variant="inline" />}
                </Fragment>
              );
            })}

            <div className="dashed tm-note">
              {n === 0 ? (
                <>No specialists yet. Ask {chiefName} in chat to hire one.</>
              ) : (
                <>
                  <b>
                    {cover} {areas.length ? listWords(areas) : "your projects"}.
                  </b>{" "}
                  Need someone new, or a break? Ask {chiefName} in chat.
                </>
              )}
            </div>
          </div>
        </div>

        {selected && <MateDetail m={selected} chiefName={chiefName} variant="side" />}
      </div>
    </main>
  );
}
