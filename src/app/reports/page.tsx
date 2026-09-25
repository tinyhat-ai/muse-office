import Link from "next/link";
import type { ReactNode } from "react";
import { all, get, json, type MemberRow, type MetricRow, type ProjectRow, type ReportRow, type TaskRow } from "@/lib/db";
import { ago, dueWord, money, shortDate } from "@/lib/time";
import { Avatar, Initials } from "@/components/Avatar";
import { Bars, GroupedBars, HBars, StackedBars, blend, fmt } from "@/components/charts/Charts";
import "./reports.css";

// The Reports page: every card is a `reports` row and every number a `metrics`
// row (spec/SCHEMA.md "How the reports use metrics"), except "new customers",
// which is counted from stage_changes. Cards are laid out wide, half, half, wide
// in each section, so the grid reads like the mockup whatever the Muse adds.

// Spare dark shades for series beyond the projects' own (spec/DESIGN.md).
const SPARE_DARKS = ["#b86e6e", "#5f8497", "#b8743a"];
// Money in and out keep the colours spec/DESIGN.md §Charts gives them.
const IN_COLOR = "#5b8a5a";
const OUT_COLOR = "#3d5a6c";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

interface Ctx {
  chiefName: string;
  members: Map<string, MemberRow>;
  projects: ProjectRow[];
  tasks: Map<string, TaskRow>;
  contacts: Map<string, string>; // slug → name, for the initials on invoices
  palette: string[];
  now: Date;
}
interface CardProps {
  report: ReportRow;
  rows: MetricRow[];
  ctx: Ctx;
  wide: boolean;
}

// ---- small words and dates ----
// A date-only string parses as UTC midnight; at local noon the calendar day is right in every timezone.
const atNoon = (d: string) => (d.length === 10 ? `${d}T12:00:00` : d);
const monthShort = (ym: string) => MONTHS[Number(ym.slice(5, 7)) - 1] ?? ym;
const monthLong = (ym: string) => MONTHS_LONG[Number(ym.slice(5, 7)) - 1] ?? ym;
const utcMonth = (d: Date) => d.toISOString().slice(0, 7);
const pct = (now: number, before: number) => (before > 0 ? ` (${now >= before ? "+" : ""}${Math.round(((now - before) / before) * 100)}%)` : "");
const plural = (n: number, word: string, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;
const uniqSorted = (xs: string[]) => Array.from(new Set(xs)).sort();
const seriesMap = (rows: MetricRow[], series: string) => new Map(rows.filter((r) => r.series === series).map((r) => [r.label, r.value]));
const startOfToday = (now: Date) => new Date(now.getFullYear(), now.getMonth(), now.getDate());
const isLate = (due: string, now: Date) => new Date(atNoon(due)) < startOfToday(now);
/** "due Tuesday", "due Fri, Oct 2", or the plain "3 days late". */
const dueText = (due: string, now: Date) => {
  const w = dueWord(atNoon(due), now);
  return w.endsWith("late") ? w : `due ${w}`;
};
/** True when dueWord gives a calendar date ("Fri, Oct 2") rather than a nearby word. */
const isDateWord = (due: string, now: Date) => /^[A-Z][a-z]{2}, /.test(dueWord(atNoon(due), now));
function lastMonths(n: number, now: Date): string[] {
  return Array.from({ length: n }, (_, i) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (n - 1 - i), 1)).toISOString().slice(0, 7));
}
/** The series colour for a report: the project with the same slug, else the project its owner leads, else the palette. */
function colorFor(report: ReportRow, ctx: Ctx): string {
  const examples: Record<string, string> = { "world-population": "#5f8497", "olympic-women": "#5b8a5a", "recorded-music": "#7e6aa6" };
  if (report.section === "Around the world" && examples[report.slug]) return examples[report.slug];
  const p = ctx.projects.find((x) => x.slug === report.slug) ?? ctx.projects.find((x) => x.lead && x.lead === report.owner);
  return p?.color_dark ?? ctx.palette[0] ?? "#9a978c";
}

// ---- pieces every card shares ----
function Kpi({ big, words, cmp, tone, children }: { big: ReactNode; words: ReactNode; cmp?: ReactNode; tone?: "up" | "dn" | "warn"; children?: ReactNode }) {
  return (
    <div className="rp-kpi">
      <b>{big}</b>
      <span>{words}</span>
      {cmp ? <span className={tone ? `rp-${tone}` : undefined}>{cmp}</span> : null}
      {children}
    </div>
  );
}

function Empty({ report, ctx }: { report: ReportRow; ctx: Ctx }) {
  const owner = report.owner ? ctx.members.get(report.owner) : undefined;
  return <div className="dashed rp-empty">No figures collected from your work yet. {owner?.name ?? ctx.chiefName} adds them as the relevant sources become available.</div>;
}

function Card({ report, ctx, wide, children }: { report: ReportRow; ctx: Ctx; wide: boolean; children: ReactNode }) {
  const owner = report.owner ? ctx.members.get(report.owner) : undefined;
  return (
    <article className={`rp-card${wide ? " rp-wide" : ""}`} id={report.slug}>
      <h3>{report.title}</h3>
      {report.description ? <p className="rp-why">{report.description}</p> : null}
      <div className="rp-main">{children}</div>
      <div className="rp-src">
        {owner ? <Avatar member={owner} size="xs" /> : null}
        <span>
          {owner ? `${owner.name} · ` : ""}
          {report.source ? (report.source_url ? <><a href={report.source_url} target="_blank" rel="noopener noreferrer">{report.source} ↗</a> · </> : `${report.source} · `) : ""}updated {ago(report.updated_at, ctx.now)}
        </span>
      </div>
    </article>
  );
}

// ---- Your business ----
function WebsiteCard({ report, rows, ctx, wide }: CardProps) {
  const weeks = uniqSorted(rows.map((r) => r.label));
  if (!weeks.length) return <Empty report={report} ctx={ctx} />;
  const vis = seriesMap(rows, "visitors"), inq = seriesMap(rows, "inquiries");
  const visitors = weeks.map((w) => vis.get(w) ?? 0);
  const inquiries = weeks.map((w) => inq.get(w) ?? 0);
  const n = weeks.length, last = visitors[n - 1], prev = n > 1 ? visitors[n - 2] : undefined;
  const inqLast = inquiries[n - 1], inqPrev = n > 1 ? inquiries[n - 2] : undefined;
  const inqWord = inqPrev === undefined ? "" : inqLast > inqPrev ? `, up from ${inqPrev}` : inqLast < inqPrev ? `, down from ${inqPrev}` : ", same as the week before";
  return (
    <>
      <Kpi big={fmt(last)} words="visitors last week" cmp={prev === undefined ? undefined : `vs ${fmt(prev)} the week before${pct(last, prev)}`} tone={prev !== undefined && last >= prev ? "up" : "dn"}>
        {inq.size ? (
          <span className="rp-kpi2">
            <b>{fmt(inqLast)}</b> {inqLast === 1 ? "inquiry" : "inquiries"} last week{inqWord}
          </span>
        ) : null}
      </Kpi>
      <Bars
        title="Website visitors per week, with inquiries under each week"
        labels={weeks.map((w) => shortDate(atNoon(w)))}
        values={visitors}
        color={colorFor(report, ctx)}
        captions={inq.size ? inquiries : undefined}
        captionLabel="Inquiries"
        wide={wide}
      />
    </>
  );
}

function NewCustomersCard({ report, ctx, wide }: CardProps) {
  const months = lastMonths(6, ctx.now);
  // A person is a new lead in the month of their first `lead` change, a new customer in any month they reached `customer`.
  const leadRows = all<{ month: string; n: number }>(
    `SELECT substr(first_lead, 1, 7) AS month, COUNT(*) AS n
       FROM (SELECT s.contact, MIN(s.changed_at) AS first_lead FROM stage_changes s JOIN contacts c ON c.slug = s.contact WHERE s.stage = 'lead' AND c.in_funnel = 1 GROUP BY s.contact)
      GROUP BY month`,
  );
  const custRows = all<{ month: string; n: number; value: number }>(
    `SELECT month, COUNT(*) AS n, COALESCE(SUM(value_cents), 0) AS value
       FROM (SELECT DISTINCT s.contact, substr(s.changed_at, 1, 7) AS month, c.value_cents
               FROM stage_changes s JOIN contacts c ON c.slug = s.contact WHERE s.stage = 'customer' AND c.in_funnel = 1)
      GROUP BY month`,
  );
  const leads = new Map(leadRows.map((r) => [r.month, r.n]));
  const custs = new Map(custRows.map((r) => [r.month, r]));
  const leadVals = months.map((m) => leads.get(m) ?? 0);
  const custVals = months.map((m) => custs.get(m)?.n ?? 0);
  if (!leadVals.some(Boolean) && !custVals.some(Boolean)) return <Empty report={report} ctx={ctx} />;
  const thisMonth = months[months.length - 1], lastMonth = months[months.length - 2];
  const now = custVals[custVals.length - 1], before = custVals[custVals.length - 2];
  const value = (custs.get(thisMonth)?.value ?? 0) / 100;
  const dark = colorFor(report, ctx);
  return (
    <>
      <Kpi big={fmt(now)} words={`new ${now === 1 ? "customer" : "customers"} in ${monthLong(thisMonth)}`} cmp={`vs ${fmt(before)} in ${monthLong(lastMonth)}`} tone={now >= before ? "up" : "dn"}>
        {value > 0 ? <span className="rp-kpi2">{money(value)} from new customers this month</span> : null}
      </Kpi>
      <GroupedBars
        title="New leads and new customers per month"
        labels={months.map(monthShort)}
        series={[
          { name: "New leads", color: blend(dark, "#ffffff", 0.5), values: leadVals },
          { name: "New customers", color: dark, values: custVals },
        ]}
        wide={wide}
        showValues
      />
    </>
  );
}

interface OwedNote { due?: string; sent?: string; contact?: string }
function OwedCard({ report, rows, ctx }: CardProps) {
  if (!rows.length) return <Empty report={report} ctx={ctx} />;
  const items = rows
    .map((r) => ({ r, note: json<OwedNote>(r.note_json, {}) }))
    .sort((a, b) => (a.note.due ?? "9999").localeCompare(b.note.due ?? "9999"));
  const total = rows.reduce((a, r) => a + r.value, 0);
  const clients = new Set(rows.map((r) => r.series ?? r.label)).size;
  const late = items.filter((x) => x.note.due && isLate(x.note.due, ctx.now)).reduce((a, x) => a + x.r.value, 0);
  const weekAhead = new Date(ctx.now.getTime() + 7 * 86400000);
  const soon = items.filter((x) => x.note.due && !isLate(x.note.due, ctx.now) && new Date(atNoon(x.note.due)) <= weekAhead).reduce((a, x) => a + x.r.value, 0);
  return (
    <>
      <Kpi
        big={money(total)}
        words={`from ${plural(clients, "client")}`}
        cmp={late > 0 ? `${money(late)} overdue` : soon > 0 ? `${money(soon)} due within a week` : undefined}
        tone={late > 0 ? "warn" : undefined}
      />
      <div className="rp-list">
        {items.map(({ r, note }) => {
          const client = r.series ?? r.label;
          return (
            <div className="rp-owe" key={r.id}>
              <Initials name={(note.contact && ctx.contacts.get(note.contact)) || client} size={28} />
              <div className="rp-w2">
                <b>{note.contact ? <Link href={`/customers?person=${encodeURIComponent(note.contact)}`}>{client}</Link> : client}</b>
                <span>
                  {r.label}
                  {note.sent ? ` · sent ${shortDate(atNoon(note.sent))}` : ""}
                </span>
              </div>
              <div className="rp-amt4">
                {money(r.value)}
                {note.due ? <span className={isLate(note.due, ctx.now) ? "rp-late" : undefined}>{dueText(note.due, ctx.now)}</span> : null}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function InOutCard({ report, rows, ctx, wide }: CardProps) {
  const months = uniqSorted(rows.map((r) => r.label));
  if (!months.length) return <Empty report={report} ctx={ctx} />;
  const inn = seriesMap(rows, "in"), out = seriesMap(rows, "out");
  const inVals = months.map((m) => inn.get(m) ?? 0), outVals = months.map((m) => out.get(m) ?? 0);
  const kept = months.map((_, i) => inVals[i] - outVals[i]);
  const n = months.length, now = kept[n - 1], before = n > 1 ? kept[n - 2] : undefined;
  return (
    <>
      <Kpi
        big={money(Math.abs(now))}
        words={now >= 0 ? `kept in ${monthLong(months[n - 1])}` : `more out than in, ${monthLong(months[n - 1])}`}
        cmp={before === undefined ? undefined : `vs ${money(before)} kept in ${monthLong(months[n - 2])}`}
        tone={before !== undefined && now >= before ? "up" : "dn"}
      />
      <GroupedBars
        title="Money in and money out per month"
        labels={months.map(monthShort)}
        series={[
          { name: "Money in", color: IN_COLOR, values: inVals },
          { name: "Money out", color: OUT_COLOR, values: outVals },
        ]}
        unit="money"
        wide={wide}
      />
    </>
  );
}

// ---- Your money ----
function SpendingCard({ report, rows, ctx, wide }: CardProps) {
  const weeks = uniqSorted(rows.map((r) => r.label));
  if (!weeks.length) return <Empty report={report} ctx={ctx} />;
  const cats = Array.from(new Set(rows.map((r) => r.series ?? "Other")));
  const series = cats.map((c, i) => ({ name: c, color: ctx.palette[i % ctx.palette.length], values: weeks.map((w) => seriesMap(rows, c).get(w) ?? 0) }));
  const totals = weeks.map((_, i) => series.reduce((a, s) => a + s.values[i], 0));
  const n = weeks.length, last = totals[n - 1], avg = totals.reduce((a, b) => a + b, 0) / n;
  const diff = avg > 0 ? Math.round(((last - avg) / avg) * 100) : 0;
  const cmp = diff < 0 ? `${-diff}% under your ${n}-week average (${money(avg)})` : diff > 0 ? `${diff}% over your ${n}-week average (${money(avg)})` : `on your ${n}-week average (${money(avg)})`;
  const top = series.map((s) => ({ name: s.name, v: s.values[n - 1] })).filter((s) => s.v > 0).sort((a, b) => b.v - a.v);
  return (
    <>
      <Kpi big={money(last)} words={`last week, from ${shortDate(atNoon(weeks[n - 1]))}`} cmp={cmp} tone={diff <= 0 ? "up" : "dn"} />
      <StackedBars title="Spending by category, each week" labels={weeks.map((w) => shortDate(atNoon(w)))} series={series} unit="money" wide={wide} averageLabel={`${n}-week average`} legendValues />
      {top.length ? (
        <p className="rp-note">
          Most of last week went on <b>{top[0].name}</b> ({money(top[0].v)}){top[1] ? <>, then {top[1].name} ({money(top[1].v)})</> : null}.
        </p>
      ) : null}
    </>
  );
}

interface BillNote { due?: string; how?: string; task?: string }
function BillsCard({ report, rows, ctx }: CardProps) {
  if (!rows.length) return <Empty report={report} ctx={ctx} />;
  const owner = report.owner ? ctx.members.get(report.owner) : undefined;
  const items = rows
    .map((r) => ({ r, note: json<BillNote>(r.note_json, {}) }))
    .sort((a, b) => (a.note.due ?? "9999").localeCompare(b.note.due ?? "9999"));
  const horizon = new Date(ctx.now.getTime() + 30 * 86400000);
  const inWindow = items.filter((x) => !x.note.due || new Date(atNoon(x.note.due)) <= horizon);
  const total = inWindow.reduce((a, x) => a + x.r.value, 0);
  const waiting = inWindow.filter((x) => x.note.how === "waiting_on_you").reduce((a, x) => a + x.r.value, 0);
  const autopay = items.some((x) => (x.note.how ?? "").startsWith("autopay"));
  const howWord = (note: BillNote) => {
    if (note.how === "autopay_bank") return "Autopay · bank";
    if (note.how === "autopay_card") return "Autopay · card";
    if (note.how === "waiting_on_you") {
      return note.task && ctx.tasks.has(note.task) ? <Link className="rp-w" href={`/tasks/${note.task}`}>Waiting on your OK</Link> : <span className="rp-w">Waiting on your OK</span>;
    }
    return note.how ? note.how.replace(/_/g, " ") : "";
  };
  return (
    <>
      <Kpi big={money(total)} words={`due by ${shortDate(horizon.toISOString())}`} cmp={waiting > 0 ? `${money(waiting)} of it waits on your OK` : autopay ? "all on autopay" : undefined} tone={waiting > 0 ? "warn" : undefined} />
      <div className="rp-list">
        {items.map(({ r, note }) => {
          const [mon, day] = note.due ? shortDate(atNoon(note.due)).split(" ") : ["", ""];
          const how = howWord(note);
          // The date block already shows a far-off date; the due word is added only when it says more ("tomorrow", "3 days late").
          const near = note.due && !isDateWord(note.due, ctx.now);
          return (
            <div className="rp-bill" key={r.id}>
              <div className="rp-dt" aria-hidden={!note.due}>
                <span>{mon}</span>
                <b>{day}</b>
              </div>
              <div>
                <div className="rp-nm2">{r.label}</div>
                <div className="rp-how">
                  {near ? <span className={isLate(note.due!, ctx.now) ? "rp-late" : undefined}>{dueText(note.due!, ctx.now)}</span> : null}
                  {near && how ? " · " : ""}
                  {how}
                </div>
              </div>
              <div className="rp-amt2">{money(r.value)}</div>
            </div>
          );
        })}
      </div>
      {autopay ? (
        <p className="rp-note">
          Autopay bills are paid by your bank or card, as they are today. {owner?.name ?? ctx.chiefName} watches them and never pays anything without your OK.
        </p>
      ) : null}
    </>
  );
}

interface SubNote { unused?: boolean; why?: string }
function SubscriptionsCard({ report, rows, ctx }: CardProps) {
  if (!rows.length) return <Empty report={report} ctx={ctx} />;
  const items = rows.map((r) => ({ r, note: json<SubNote>(r.note_json, {}) })).sort((a, b) => b.r.value - a.r.value);
  const total = rows.reduce((a, r) => a + r.value, 0);
  const unused = items.filter((x) => x.note.unused);
  const unusedSum = unused.reduce((a, x) => a + x.r.value, 0);
  const names = unused.map((x) => x.r.label.toLowerCase());
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
  return (
    <>
      <Kpi big={money(total)} words={`a month · ${money(total * 12)} a year`} cmp={unusedSum > 0 ? `${money(unusedSum)} of it looks unused` : undefined} tone={unusedSum > 0 ? "warn" : undefined} />
      <HBars rows={items.map((x) => ({ label: x.r.label, value: x.r.value, unused: !!x.note.unused, why: x.note.why }))} color={colorFor(report, ctx)} patternId={`rp-stripes-${report.slug}`} />
      {unused.length ? (
        <p className="rp-tip">
          {unused.length === 1 ? "One looks" : `${unused.length} look`} unused: {list}. That is <b>{money(unusedSum)} a month</b>. Ask {ctx.chiefName} in chat to cancel {unused.length === 1 ? "it" : "them"}.
        </p>
      ) : null}
    </>
  );
}

interface SavingNote { state?: "saved" | "waiting"; task?: string; monthly?: boolean }
function SavingsCard({ report, rows, ctx }: CardProps) {
  if (!rows.length) return <Empty report={report} ctx={ctx} />;
  const items = rows.map((r) => ({ r, note: json<SavingNote>(r.note_json, {}) }));
  const saved = items.filter((x) => x.note.state === "saved");
  const waiting = items.filter((x) => x.note.state === "waiting");
  const month = utcMonth(ctx.now);
  const savedThisMonth = saved.filter((x) => x.r.recorded_at.slice(0, 7) === month).reduce((a, x) => a + x.r.value, 0);
  const monthly = waiting.filter((x) => x.note.monthly).reduce((a, x) => a + x.r.value, 0);
  const once = waiting.filter((x) => !x.note.monthly).reduce((a, x) => a + x.r.value, 0);
  const more = [monthly > 0 ? `${money(monthly)} a month` : "", once > 0 ? money(once) : ""].filter(Boolean).join(" and ");
  const finder = (slug: string | null) => (slug ? ctx.members.get(slug)?.name ?? ctx.chiefName : ctx.chiefName);
  return (
    <>
      <Kpi big={<span className="rp-green">{money(savedThisMonth)}</span>} words="saved this month" cmp={more ? `${more} more once you say yes` : undefined} />
      <div className="rp-save-lbl">Saved</div>
      {saved.length ? (
        <div className="rp-list">
          {saved.map(({ r, note }) => {
            const task = note.task ? ctx.tasks.get(note.task) : undefined;
            return (
              <div className="rp-save" key={r.id}>
                <span className="rp-check" aria-label="Saved">✓</span>
                <span className="rp-v">{money(r.value)}</span>
                <div>
                  {r.label}
                  <span className="rp-by2">
                    {finder(r.series)}
                    {task ? <> · <Link href={`/tasks/${task.id}`}>{task.title}</Link></> : null}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rp-note">Nothing saved yet this month.</p>
      )}
      {waiting.length ? (
        <>
          <div className="rp-save-lbl rp-w">Waiting on you</div>
          <div className="rp-list">
            {waiting.map(({ r, note }) => {
              const task = note.task ? ctx.tasks.get(note.task) : undefined;
              return (
                <div className="rp-save rp-wait" key={r.id}>
                  <span className="rp-v">
                    {money(r.value)}
                    {note.monthly ? "/month" : ""}
                  </span>
                  <div>
                    {r.label}
                    <span className="rp-by2">
                      {finder(r.series)} · {task ? <Link href={`/tasks/${task.id}`}>{task.title}</Link> : `say yes to ${ctx.chiefName} in chat`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </>
  );
}

// ---- a card the Muse added later: drawn from its chart type alone ----
function GenericCard({ report, rows, ctx, wide }: CardProps) {
  if (!rows.length) return <Empty report={report} ctx={ctx} />;
  const labels = uniqSorted(rows.map((r) => r.label));
  const isMoney = /\$|money|spend|cost|revenue|income|bill|owed|paid/i.test(`${report.title} ${report.description ?? ""}`);
  const unit = isMoney ? "money" : "count";
  const show = (label: string) => (/^\d{4}-\d{2}-\d{2}$/.test(label) ? shortDate(atNoon(label)) : /^\d{4}-\d{2}$/.test(label) ? monthShort(label) : label);
  const seriesNames = Array.from(new Set(rows.map((r) => r.series ?? report.title)));
  const series = seriesNames.map((s, i) => ({ name: s, color: ctx.palette[i % ctx.palette.length], values: labels.map((l) => rows.find((r) => (r.series ?? report.title) === s && r.label === l)?.value ?? 0) }));
  const total = rows.reduce((a, r) => a + r.value, 0);
  const lastLabel = labels[labels.length - 1];
  if (report.chart === "bars") {
    const v = series[0].values, last = v[v.length - 1], prev = v[v.length - 2];
    const publicExample = report.section === "Around the world";
    const comparison = prev === undefined ? undefined : publicExample
      ? `vs ${fmt(prev, unit)} in ${show(labels[labels.length - 2])}`
      : `vs ${fmt(prev, unit)} before${pct(last, prev)}`;
    return (
      <>
        <Kpi big={fmt(last, unit)} words={`latest, ${show(lastLabel)}`} cmp={comparison} tone={publicExample ? undefined : prev !== undefined && last >= prev ? "up" : "dn"} />
        <Bars title={report.title} labels={labels.map(show)} values={v} color={colorFor(report, ctx)} unit={unit} wide={wide} />
      </>
    );
  }
  if (report.chart === "grouped-bars" || report.chart === "stacked-bars") {
    const lastTotal = series.reduce((a, s) => a + (s.values[s.values.length - 1] ?? 0), 0);
    return (
      <>
        <Kpi big={fmt(lastTotal, unit)} words={`latest, ${show(lastLabel)}`} />
        {report.chart === "grouped-bars" ? (
          <GroupedBars title={report.title} labels={labels.map(show)} series={series} unit={unit} wide={wide} showValues={unit === "count"} />
        ) : (
          <StackedBars title={report.title} labels={labels.map(show)} series={series} unit={unit} wide={wide} averageLabel={`${labels.length}-period average`} />
        )}
      </>
    );
  }
  if (report.chart === "bars-horizontal") {
    return (
      <>
        <Kpi big={fmt(total, unit)} words="in total" />
        <HBars rows={rows.map((r) => ({ label: r.label, value: r.value, unused: !!json<SubNote>(r.note_json, {}).unused, why: json<SubNote>(r.note_json, {}).why }))} color={colorFor(report, ctx)} unit={unit} patternId={`rp-stripes-${report.slug}`} />
      </>
    );
  }
  // `list`, `savings`, or anything unknown: plain rows of label and value.
  return (
    <>
      <Kpi big={fmt(total, unit)} words="in total" />
      <div className="rp-list">
        {rows.map((r) => {
          const note = json<{ due?: string }>(r.note_json, {});
          return (
            <div className="rp-owe" key={r.id}>
              <div className="rp-w2">
                <b>{r.series ? `${r.series} · ${r.label}` : r.label}</b>
              </div>
              <div className="rp-amt4">
                {fmt(r.value, unit)}
                {note.due ? <span>{dueText(note.due, ctx.now)}</span> : null}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function ReportCard(props: CardProps) {
  const { report } = props;
  const body =
    report.slug === "website" && report.chart === "bars" ? <WebsiteCard {...props} />
    : report.slug === "new-customers" ? <NewCustomersCard {...props} />
    : report.slug === "owed" && report.chart === "list" ? <OwedCard {...props} />
    : report.slug === "in-out" && report.chart === "grouped-bars" ? <InOutCard {...props} />
    : report.slug === "spending" && report.chart === "stacked-bars" ? <SpendingCard {...props} />
    : report.slug === "bills" && report.chart === "list" ? <BillsCard {...props} />
    : report.slug === "subscriptions" && report.chart === "bars-horizontal" ? <SubscriptionsCard {...props} />
    : report.chart === "savings" ? <SavingsCard {...props} />
    : <GenericCard {...props} />;
  return (
    <Card report={report} ctx={props.ctx} wide={props.wide}>
      {body}
    </Card>
  );
}

// ---- the orange line: what waits on the user ----
function NeedsLine({ tasks, ctx }: { tasks: TaskRow[]; ctx: Ctx }) {
  if (!tasks.length) return null;
  const part = (t: TaskRow) => {
    const amount = t.question?.match(/\$\d[\d,]*(?:\.\d+)?/)?.[0];
    return `${t.title}${amount ? ` · ${amount}` : ""}${t.due ? ` · ${dueText(t.due, ctx.now)}` : ""}`;
  };
  const lead = `${tasks.length} ${tasks.length === 1 ? "thing needs" : "things need"} you: `;
  const tail = " · open the task to answer";
  if (tasks.length === 1) {
    return (
      <Link className="rp-needs rp-needs-link" href={`/tasks/${tasks[0].id}`}>
        <span className="rp-d" aria-hidden="true" />
        <span>{lead}{part(tasks[0])}{tail}</span>
      </Link>
    );
  }
  return (
    <p className="rp-needs">
      <span className="rp-d" aria-hidden="true" />
      <span>
        {lead}
        {tasks.map((t, i) => (
          <span key={t.id}>
            {i > 0 ? (i === tasks.length - 1 ? " and " : ", ") : ""}
            <Link href={`/tasks/${t.id}`}>{part(t)}</Link>
          </span>
        ))}
        {tail}
      </span>
    </p>
  );
}

export default function ReportsPage() {
  const now = new Date();
  const chief = get<MemberRow>("SELECT * FROM members WHERE is_chief = 1 ORDER BY sort_order LIMIT 1");
  const members = new Map(all<MemberRow>("SELECT * FROM members").map((m) => [m.slug, m]));
  const projects = all<ProjectRow>("SELECT * FROM projects ORDER BY sort_order, slug");
  const tasks = new Map(all<TaskRow>("SELECT * FROM tasks").map((t) => [t.id, t]));
  const contacts = new Map(all<{ slug: string; name: string }>("SELECT slug, name FROM contacts").map((c) => [c.slug, c.name]));
  const reports = all<ReportRow>(`SELECT * FROM reports ORDER BY
    CASE section WHEN 'Around the world' THEN 0 WHEN 'Your business' THEN 1 WHEN 'Your money' THEN 2 ELSE 3 END,
    section, sort_order, slug`);
  const metrics = all<MetricRow>("SELECT * FROM metrics ORDER BY report, id");
  // Money questions first: they carry the amount the line quotes.
  const waiting = all<TaskRow>(
    "SELECT * FROM tasks WHERE column_name = 'waiting_on_you' ORDER BY CASE WHEN question_kind = 'money' THEN 0 ELSE 1 END, updated_at",
  );
  const ctx: Ctx = {
    chiefName: chief?.name ?? "your chief of staff",
    members,
    projects,
    tasks,
    contacts,
    palette: [...projects.map((p) => p.color_dark), ...SPARE_DARKS],
    now,
  };
  const byReport = new Map<string, MetricRow[]>();
  for (const m of metrics) byReport.set(m.report, [...(byReport.get(m.report) ?? []), m]);
  // Keep unsourced business templates in the database for the team to fill,
  // but show a report card only once it can display real figures.
  const customerHistory = get<{ n: number }>(`SELECT COUNT(*) AS n FROM stage_changes s
    JOIN contacts c ON c.slug = s.contact WHERE c.in_funnel = 1`)?.n ?? 0;
  const visibleReports = reports.filter((r) =>
    (byReport.get(r.slug)?.length ?? 0) > 0 || (r.slug === "new-customers" && customerHistory > 0));
  // Published examples lead the first visit; cards keep their sort_order within each section.
  const sections: Array<{ name: string; cards: ReportRow[] }> = [];
  for (const r of visibleReports) {
    const s = sections.find((x) => x.name === r.section);
    if (s) s.cards.push(r);
    else sections.push({ name: r.section, cards: [r] });
  }

  return (
    <main className="wrap rp">
      <div className="head">
        <div className="kick">How things are going</div>
        <h1 className="title">Reports</h1>
        <p className="lede">
          Visual reports about the results that matter to you. Explore the sourced examples below; your team adds charts from your work as its sources become available.
        </p>
      </div>

      <NeedsLine tasks={waiting} ctx={ctx} />

      {sections.length ? (
        sections.map((s) => (
          <section className="rp-section" key={s.name}>
            <h2 className="rp-sec">{s.name}</h2>
            {s.name === "Around the world" ? <p className="rp-examples">Published examples show what visual reports can do. As you share your priorities and communication channels, {ctx.chiefName} adds reports about what matters to you.</p> : null}
            <div className={`rp-grid${s.name === "Around the world" ? " rp-grid-examples" : ""}`}>
              {s.cards.map((r, i) => (
                <ReportCard key={r.slug} report={r} rows={byReport.get(r.slug) ?? []} ctx={ctx} wide={s.name === "Around the world" ? i === 0 : i % 4 === 0 || i % 4 === 3} />
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="dashed rp-empty-page">No reports yet. {ctx.chiefName} sets them up on Monday, or ask for one in chat.</div>
      )}

      <p className="tell rp-foot">
        Want a report about your work? Ask {ctx.chiefName} in chat. Once the team can verify its source, it will appear here as a chart.
      </p>
    </main>
  );
}
