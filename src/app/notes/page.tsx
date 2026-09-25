import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { all, get, json, type MemberRow, type NoteRow, type ProjectRow } from "@/lib/db";
import { ago } from "@/lib/time";
import { Avatar } from "@/components/Avatar";
import "./notes.css";

// The Notes find page. Search and filters are plain query params (?q= &project= &by=)
// so the page stays a server component: the search box is a GET form, the chips
// are links that keep the other params, and matches are highlighted server-side.

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] ?? "" : v ?? "").trim().slice(0, 100);

/** Markdown as plain words, for searching and for an excerpt around a match. */
function plain(md: string): string {
  return md
    .replace(/<[^>]+>/g, " ")
    .replace(/\|?\s*-{2,}\s*\|?/g, " ")
    .replace(/[#*_`>|]/g, " ")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Wraps every match of `q` in <mark>, case-insensitively. */
function highlight(text: string, q: string): ReactNode {
  if (!q) return text;
  const lower = text.toLowerCase(), ql = q.toLowerCase();
  const parts: ReactNode[] = [];
  let i = 0, k = 0;
  for (let j = lower.indexOf(ql); j >= 0; j = lower.indexOf(ql, i)) {
    if (j > i) parts.push(text.slice(i, j));
    parts.push(<mark key={k++}>{text.slice(j, j + q.length)}</mark>);
    i = j + q.length;
  }
  parts.push(text.slice(i));
  return parts;
}

export default async function NotesPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const q = one(sp.q), project = one(sp.project), by = one(sp.by), tag = one(sp.tag).toLowerCase();
  const now = new Date();

  const chief = get<MemberRow>("SELECT * FROM members WHERE is_chief = 1 ORDER BY sort_order LIMIT 1");
  const chiefName = chief?.name ?? "your chief of staff";
  const members = all<MemberRow>("SELECT * FROM members ORDER BY sort_order, slug");
  const projects = all<ProjectRow>("SELECT * FROM projects ORDER BY sort_order, slug");
  const notes = all<NoteRow>("SELECT * FROM notes ORDER BY pinned DESC, updated_at DESC");
  const projectBy = new Map(projects.map((p) => [p.slug, p]));
  const memberBy = new Map(members.map((m) => [m.slug, m]));

  // Only chips that lead somewhere: projects and people with at least one note.
  const projectChips = projects.filter((p) => notes.some((n) => n.project === p.slug));
  const keeperChips = members.filter((m) => notes.some((n) => n.kept_by === m.slug));
  // Tags: the topics and keywords the team put on notes, most used first.
  const tagsOf = (n: NoteRow) => json<string[]>(n.tags_json, []);
  const tagCount = new Map<string, number>();
  for (const n of notes) for (const t of tagsOf(n)) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
  const tagChips = [...tagCount.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 14).map(([t]) => t);

  const ql = q.toLowerCase();
  const matches = (n: NoteRow) => !ql || n.title.toLowerCase().includes(ql) || (n.lede ?? "").toLowerCase().includes(ql) || n.markdown.toLowerCase().includes(ql) || tagsOf(n).some((t) => t.includes(ql));
  const list = notes.filter((n) => (!project || n.project === project) && (!by || n.kept_by === by) && (!tag || tagsOf(n).includes(tag)) && matches(n));

  // Links keep the other params: a project chip does not drop the search, and so on.
  const href = (patch: Partial<{ q: string; project: string; by: string; tag: string }>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, project, by, tag, ...patch })) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/notes?${s}` : "/notes";
  };

  const excerpt = (n: NoteRow): ReactNode => {
    const inHead = ql && (n.title.toLowerCase().includes(ql) || (n.lede ?? "").toLowerCase().includes(ql));
    const body = plain(n.markdown);
    // A match that only lives in the body shows the words around it instead of the lede.
    if (ql && !inHead && body.toLowerCase().includes(ql)) {
      const at = body.toLowerCase().indexOf(ql);
      const from = Math.max(0, at - 50);
      return highlight(`${from > 0 ? "…" : ""}${body.slice(from, from + 150)}${from + 150 < body.length ? "…" : ""}`, q);
    }
    return highlight(n.lede ?? body.slice(0, 150), q);
  };

  const count = `${list.length} ${list.length === 1 ? "note" : "notes"}${q ? ` ${list.length === 1 ? "matches" : "match"} “${q}”` : ""}${tag ? ` tagged #${tag}` : ""}`;

  return (
    <main className="wrap nt">
      <div className="head">
        <div className="kick">What the team has learned, written down for you</div>
        <h1 className="title">Notes</h1>
        <p className="lede nt-lede">
          {chief ? <Avatar member={chief} size="xs" /> : null}
          <span>Kept by the team, managed by {chiefName}</span>
        </p>
      </div>

      <form className="nt-search" action="/notes" method="get" role="search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.6-3.6" />
        </svg>
        <input type="search" name="q" defaultValue={q} placeholder="Search notes — a client, a price, a tool…" aria-label="Search notes" autoComplete="off" />
        {project ? <input type="hidden" name="project" value={project} /> : null}
        {by ? <input type="hidden" name="by" value={by} /> : null}
        {tag ? <input type="hidden" name="tag" value={tag} /> : null}
        {q ? <Link className="nt-clear" href={href({ q: "" })}>Clear</Link> : <button type="submit" className="nt-go">Search</button>}
      </form>

      <div className="nt-filters">
        <div className="nt-fl">
          <span className="nt-lbl">Project</span>
          <Link className={`nt-chip${!project ? " on" : ""}`} href={href({ project: "" })}>All</Link>
          {projectChips.map((p) => (
            <Link key={p.slug} className={`nt-chip${project === p.slug ? " on" : ""}`} href={href({ project: p.slug })} style={{ "--d": p.color_dark } as CSSProperties}>
              <i aria-hidden="true" />
              {p.name}
            </Link>
          ))}
        </div>
        <div className="nt-fl">
          <span className="nt-lbl">Kept by</span>
          <Link className={`nt-chip${!by ? " on" : ""}`} href={href({ by: "" })}>Anyone</Link>
          {keeperChips.map((m) => (
            <Link key={m.slug} className={`nt-chip${by === m.slug ? " on" : ""}`} href={href({ by: m.slug })}>
              <Avatar member={m} size="sm" />
              {m.name}
            </Link>
          ))}
        </div>
        {tagChips.length ? (
          <div className="nt-fl">
            <span className="nt-lbl">Tags</span>
            <Link className={`nt-chip${!tag ? " on" : ""}`} href={href({ tag: "" })}>Any</Link>
            {tagChips.map((t) => (
              <Link key={t} className={`nt-chip nt-tag${tag === t ? " on" : ""}`} href={href({ tag: t })}>#{t}</Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="nt-count">
        <span>{count}</span>
        <span>Newest first</span>
      </div>

      <div className="nt-grid">
        {list.length ? (
          list.map((n) => {
            const p = n.project ? projectBy.get(n.project) : undefined;
            const keeper = n.kept_by ? memberBy.get(n.kept_by) : undefined;
            const isStart = n.project === "general";
            return (
              <Link key={n.slug} className={`nt-card${n.pinned ? " nt-pin" : ""}`} href={`/notes/${n.slug}`} style={{ "--d": p?.color_dark ?? "#9a978c" } as CSSProperties}>
                <div className="nt-card-top">
                  <span className="nt-card-proj">
                    <i aria-hidden="true" />
                    {isStart ? "Start here" : p?.name ?? "Note"}
                  </span>
                  {n.pinned && !isStart ? <span className="nt-card-pin">Start here</span> : null}
                </div>
                <h3>{highlight(n.title, q)}</h3>
                <p>{excerpt(n)}</p>
                {tagsOf(n).length ? <div className="nt-card-tags">{tagsOf(n).slice(0, 4).map((t) => <span key={t}>#{t}</span>)}</div> : null}
                <div className="nt-card-foot">
                  {keeper ? <Avatar member={keeper} size="xs" /> : null}
                  Kept by {keeper?.name ?? chiefName} · updated {ago(n.updated_at, now)}
                </div>
              </Link>
            );
          })
        ) : (
          <div className="nt-empty">No note matches. Ask {chiefName} to write one.</div>
        )}
      </div>

      <p className="tell nt-foot">The team writes these notes from its work. To add or change one, tell {chiefName} in chat.</p>
    </main>
  );
}
