import { Fragment, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import {
  all,
  get,
  json,
  STAGE_LABEL,
  type ContactRow,
  type MemberRow,
  type ProjectRow,
  type Stage,
  type StageChangeRow,
  type TouchRow,
} from "@/lib/db";
import { ago, dueWord, money, shortDate } from "@/lib/time";
import { Avatar, Initials, You } from "@/components/Avatar";
import "./customers.css";

// The funnel's four stages, left to right; `past` sits outside it.
const FUNNEL = ["lead", "talking", "proposal", "customer"] as const;
const DAY = 86400000;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const personHref = (slug: string) => `/customers?person=${encodeURIComponent(slug)}`;

// Waiting on the user first, then the nearest date, then the name.
const byUrgency = (a: ContactRow, b: ContactRow) =>
  b.next_waiting_on_you - a.next_waiting_on_you || (a.next_due ?? "~").localeCompare(b.next_due ?? "~") || a.name.localeCompare(b.name);

// A person kept here without being sold to (the user, the maker of the hat) shows
// "Contact" instead of a stage, and is counted nowhere.
function StagePill({ c, className }: { c: Pick<ContactRow, "stage" | "in_funnel">; className?: string }) {
  if (c.in_funnel === 0) {
    return <span className={`pill cu-stage cu-s-contact${className ? ` ${className}` : ""}`} title="Not in the funnel">Contact</span>;
  }
  return <span className={`pill cu-stage cu-s-${c.stage}${className ? ` ${className}` : ""}`}>{STAGE_LABEL[c.stage] ?? c.stage}</span>;
}

type DetailProps = {
  c: ContactRow;
  touches: TouchRow[]; // this person's, newest first
  changes: StageChangeRow[]; // this person's
  member: Map<string, MemberRow>;
  chiefName: string;
  variant: "side" | "inline";
};

// The panel renders twice: once as the sticky right column (desktop), once
// inline under the selected row (narrow screens). CSS shows one at a time.
function PersonDetail({ c, touches, changes, member, chiefName, variant }: DetailProps) {
  const notes = json<string[]>(c.notes_json, []);
  const waiting = c.next_waiting_on_you === 1;
  const day = dueWord(c.next_due);
  const newest = touches[0];
  const byName = (by: string | null) => (by === "you" ? "you" : by ? (member.get(by)?.name ?? "") : "");
  // Touches and stage changes share one timeline, newest first.
  const timeline = [
    ...touches.map((t) => ({ key: `t${t.id}`, at: t.happened_at, touch: t })),
    ...changes.map((s) => ({ key: `s${s.id}`, at: s.changed_at, stage: s.stage })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const first = c.name.split(/\s+/)[0];

  return (
    <aside className={variant === "side" ? "card cu-detail cu-detail-side" : "cu-detail cu-detail-inline"} aria-label={c.name}>
      <div className="cu-hd">
        <Initials name={c.name} size={40} />
        <div>
          <h2 className="cu-dnm">{c.name}</h2>
          <div className="cu-drl">{[c.title, c.company].filter(Boolean).join(" · ")}</div>
          <StagePill c={c} className="cu-hd-stage" />
          {c.in_funnel === 0 ? <div className="cu-drl">Kept here without selling to them{c.source ? ` · ${c.source}` : ""}</div> : null}
        </div>
      </div>

      <h3>Next step</h3>
      <div className="cu-next-box">
        {c.next_step ? (
          <>
            <b>{c.next_step}</b>
            {day || waiting ? (
              <span className={"cu-next-when" + (waiting ? " cu-nd" : "")}>{[day, waiting ? "waiting on you" : ""].filter(Boolean).join(" · ")}</span>
            ) : null}
          </>
        ) : (
          "No next step set."
        )}
      </div>

      <h3>Timeline</h3>
      {timeline.length ? (
        <div className="cu-tl">
          {timeline.map((item) =>
            "touch" in item ? (
              <div className={"cu-tl-row" + (waiting && item.touch.id === newest?.id ? " cu-hot" : "")} key={item.key}>
                {item.touch.task ? (
                  <Link href={`/tasks/${encodeURIComponent(item.touch.task)}`} className="cu-tl-link">
                    {item.touch.summary} →
                  </Link>
                ) : (
                  item.touch.summary
                )}
                <span className="cu-d2">{[cap(item.touch.channel), shortDate(item.touch.happened_at), byName(item.touch.by)].filter(Boolean).join(" · ")}</span>
              </div>
            ) : (
              <div className="cu-tl-row cu-tl-stage" key={item.key}>
                Became {STAGE_LABEL[item.stage] ?? item.stage} · {shortDate(item.at)}
              </div>
            ),
          )}
        </div>
      ) : (
        <p className="cu-empty">Nothing logged yet.</p>
      )}

      <h3>Notes</h3>
      {notes.length ? (
        <ul>
          {notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      ) : (
        <p className="cu-empty">No notes yet.</p>
      )}

      <p className="tell cu-home">
        To change anything here, tell {chiefName}, for example “move {first}’s follow-up to next Thursday.”
      </p>
    </aside>
  );
}

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function CustomersPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const person = Array.isArray(params.person) ? params.person[0] : params.person;

  const contacts = all<ContactRow>("SELECT * FROM contacts ORDER BY name");
  const touches = all<TouchRow>("SELECT * FROM touches ORDER BY happened_at DESC, id DESC");
  // Only people in the funnel have sales history; someone kept outside it has none to show or count.
  const changes = all<StageChangeRow>("SELECT s.* FROM stage_changes s JOIN contacts c ON c.slug = s.contact WHERE c.in_funnel = 1 ORDER BY s.changed_at DESC, s.id DESC");
  const members = all<MemberRow>("SELECT * FROM members ORDER BY is_chief DESC, sort_order, name");
  const project = get<ProjectRow>("SELECT * FROM projects WHERE slug = 'customers'");

  const member = new Map(members.map((m) => [m.slug, m]));
  const withRole = (role: string) => members.find((m) => m.role.toLowerCase() === role);
  const chief = members.find((m) => m.is_chief === 1);
  const chiefName = chief?.name ?? "your chief of staff";
  const sales = withRole("sales") ?? chief;
  const salesName = sales?.name ?? chiefName;
  const marketer = withRole("marketer");
  const contactName = new Map(contacts.map((c) => [c.slug, c.name]));

  // Funnel: who is in each stage today, and who moved into it in the last 30 days.
  const since = new Date(Date.now() - 30 * DAY).toISOString();
  const recent = changes.filter((s) => s.changed_at >= since);
  const inFunnel = contacts.filter((c) => c.in_funnel !== 0);
  const inStage = (stage: Stage) => inFunnel.filter((c) => c.stage === stage).length;
  const movedInto = (stage: Stage) => new Set(recent.filter((s) => s.stage === stage).map((s) => s.contact)).size;
  const waitingProposals = inFunnel.filter((c) => c.stage === "proposal" && c.next_waiting_on_you === 1).length;
  const wonSlugs = new Set(recent.filter((s) => s.stage === "customer").map((s) => s.contact));
  const wonCents = contacts.filter((c) => wonSlugs.has(c.slug)).reduce((sum, c) => sum + (c.value_cents ?? 0), 0);
  const movement = (stage: Stage): ReactNode => {
    const n = movedInto(stage);
    const plus = n ? `+${n}` : "";
    if (stage === "lead") return n ? `${plus} this month` : "No one new this month";
    if (stage === "customer") return n ? [plus, wonCents ? money(wonCents / 100) : ""].filter(Boolean).join(" · ") : "No one new";
    if (stage === "proposal" && waitingProposals) {
      return (
        <>
          {plus}
          {plus ? " · " : ""}
          <span className="cu-nd">{waitingProposals} waiting on you</span>
        </>
      );
    }
    return n ? plus : "No one new";
  };
  // The funnel's tints come from the customers project row; the CSS defaults cover a missing row.
  const funnelStyle = project ? ({ ["--cu-c" as string]: project.color, ["--cu-d" as string]: project.color_dark } as CSSProperties) : undefined;
  const funnelNote =
    marketer && marketer.slug !== sales?.slug
      ? `${marketer.name} brings people in; ${salesName} moves them along; you say yes before anything is sent.`
      : `${salesName} brings people in and moves them along; you say yes before anything is sent.`;

  // Follow-ups: everyone waiting on the user, then anything due within a week.
  const weekOut = new Date(Date.now() + 7 * DAY).toISOString().slice(0, 10);
  const followups = contacts
    .filter((c) => c.next_step && (c.next_waiting_on_you === 1 || (c.next_due && c.next_due.slice(0, 10) <= weekOut)))
    .sort(byUrgency);
  const lately = touches.slice(0, 6);

  const rows = [...contacts].sort(byUrgency);
  const selected = rows.find((c) => c.slug === person) ?? rows.find((c) => c.next_waiting_on_you === 1) ?? rows[0];
  const latestTouch = new Map<string, TouchRow>();
  for (const t of touches) if (!latestTouch.has(t.contact)) latestTouch.set(t.contact, t);
  const detailProps = selected
    ? {
        c: selected,
        touches: touches.filter((t) => t.contact === selected.slug),
        changes: changes.filter((s) => s.contact === selected.slug),
        member,
        chiefName,
      }
    : null;

  return (
    <main className="wrap">
      <header className="head">
        <div className="kick">Your people</div>
        <h1 className="title">Customers &amp; leads</h1>
        <p className="lede">{salesName} keeps this list current from people you mention and the work channels you choose to share. It drafts follow-ups for your approval.</p>
      </header>

      {contacts.length > 0 && contacts.every((c) => c.in_funnel === 0) ? (
        <p className="cu-start">These first contacts show how your Office keeps people and context together. Tell {chiefName} about a lead, or share a work communication channel when you are ready. The team will add real leads, customers, and follow-ups as it works.</p>
      ) : null}

      <div className="cu-funnel" style={funnelStyle}>
        {FUNNEL.map((stage, i) => (
          <Fragment key={stage}>
            {i > 0 && <i className="cu-arr" aria-hidden="true" />}
            <div className={`cu-stg cu-s-${stage}`}>
              <b>{inStage(stage)}</b>
              <span>{stage === "lead" ? "Leads" : STAGE_LABEL[stage]}</span>
              <small>{movement(stage)}</small>
            </div>
          </Fragment>
        ))}
      </div>
      <p className="cu-funnel-note">{funnelNote}</p>

      <div className="cu-top">
        <section className="card cu-fu">
          <h2>Follow up this week</h2>
          <p className="cu-sub">Waiting on you first, then due soonest. {salesName} drafts each one on the day.</p>
          {followups.length ? (
            <div className="cu-fu-list">
              {followups.map((c) => {
                const waiting = c.next_waiting_on_you === 1;
                const day = dueWord(c.next_due);
                return (
                  <div className="cu-fu-row" key={c.slug}>
                    <Initials name={c.name} size={28} />
                    <div className="cu-who">
                      <b>
                        <Link href={personHref(c.slug)} scroll={false}>
                          {c.name}
                          {c.company ? ` · ${c.company}` : ""}
                        </Link>
                      </b>
                      <span>{c.next_step}</span>
                    </div>
                    <div className={"cu-due" + (waiting ? " cu-nd" : "")}>
                      <b>{day || (waiting ? "waiting on you" : "No date")}</b>
                      {waiting && day ? <span>waiting on you</span> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="cu-empty">Nothing due this week.</p>
          )}
        </section>

        <section className="card cu-fu">
          <h2>Lately</h2>
          <p className="cu-sub">What the team logged in the last few days</p>
          {lately.length ? (
            <div className="cu-tl">
              {lately.map((t) => {
                const who = t.by ? member.get(t.by) : undefined;
                return (
                  <div className="cu-tl-row" key={t.id}>
                    {t.summary} ·{" "}
                    <b>
                      <Link href={personHref(t.contact)} scroll={false}>
                        {contactName.get(t.contact) ?? t.contact}
                      </Link>
                    </b>
                    <span className="cu-d2">
                      <span>{ago(t.happened_at)}</span>
                      {t.by === "you" ? (
                        <>
                          <span>·</span>
                          <You size="xs" />
                        </>
                      ) : who ? (
                        <>
                          <span>·</span>
                          <Avatar member={who} size="xs" />
                          <span>{who.name}</span>
                        </>
                      ) : null}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="cu-empty">Nothing logged yet.</p>
          )}
        </section>
      </div>

      {detailProps ? (
        <div className="cu-main">
          <table className="cu-table">
            <thead>
              <tr>
                <th scope="col">Person</th>
                <th scope="col">Stage</th>
                <th scope="col">Last contact</th>
                <th scope="col">Next step</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const on = c.slug === detailProps.c.slug;
                const href = personHref(c.slug);
                const last = latestTouch.get(c.slug);
                const waiting = c.next_waiting_on_you === 1;
                // Every cell is a link to the same detail, so the whole row is tappable; only the first is a tab stop.
                return (
                  <Fragment key={c.slug}>
                    <tr className={on ? "cu-sel" : undefined} aria-current={on ? "true" : undefined}>
                      <td>
                        <Link href={href} scroll={false} className="cu-cell cu-pn">
                          <Initials name={c.name} size={28} />
                          <div className="cu-pn-text">
                            <b>{c.name}</b>
                            <span>{c.company}</span>
                          </div>
                        </Link>
                      </td>
                      <td>
                        <Link href={href} scroll={false} className="cu-cell" tabIndex={-1}>
                          <StagePill c={c} />
                        </Link>
                      </td>
                      <td>
                        <Link href={href} scroll={false} className="cu-cell cu-last" tabIndex={-1}>
                          {last ? `${cap(last.channel)} · ${shortDate(last.happened_at)}` : "No contact yet"}
                        </Link>
                      </td>
                      <td>
                        <Link href={href} scroll={false} className="cu-cell cu-next" tabIndex={-1}>
                          {c.next_step ? (
                            <>
                              <b>{c.next_step}</b>
                              <span className={"cu-when" + (waiting ? " cu-nd" : "")}>
                                {[dueWord(c.next_due), waiting ? "waiting on you" : ""].filter(Boolean).join(" · ")}
                              </span>
                            </>
                          ) : (
                            <span className="cu-when">No next step yet</span>
                          )}
                        </Link>
                      </td>
                    </tr>
                    {on && (
                      <tr className="cu-detail-row">
                        <td colSpan={4}>
                          <PersonDetail {...detailProps} variant="inline" />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          <PersonDetail {...detailProps} variant="side" />
        </div>
      ) : (
        <div className="dashed cu-none">No one yet. Tell {chiefName} about the first person who wrote to you.</div>
      )}
    </main>
  );
}
