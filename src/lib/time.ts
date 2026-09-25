// Time words the pages use: relative within a week, then a date.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// A bare date ("2026-10-02") is a calendar day, not an instant: read it as
// local midnight so it does not slip a day west of UTC. Timestamps parse as usual.
export function parseDate(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso);
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = parseDate(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** "just now", "20 min ago", "2 hours ago", "yesterday", "3 days ago", then "Sep 12". */
export function ago(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return "";
  const then = parseDate(iso);
  const s = Math.max(0, (now.getTime() - then.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return h === 1 ? "1 hour ago" : `${h} hours ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  if (d < 7) return `${d} days ago`;
  return shortDate(iso);
}

/** "3 hours", "1 day" (no "ago"), for "waiting 3 hours". */
export function span(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return "";
  const s = Math.max(0, (now.getTime() - parseDate(iso).getTime()) / 1000);
  const m = Math.floor(s / 60);
  if (m < 60) return `${Math.max(1, m)} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return h === 1 ? "1 hour" : `${h} hours`;
  const d = Math.floor(h / 24);
  return d === 1 ? "1 day" : `${d} days`;
}

/** "today", "tomorrow", "Thursday" (within a week), then "Fri, Oct 2". */
export function dueWord(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return "";
  const d = parseDate(iso);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - startToday.getTime()) / 86400000);
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays === -1) return "yesterday";
  if (diffDays > 1 && diffDays < 7) return DAYS[d.getDay()];
  if (diffDays < 0) return `${Math.abs(diffDays)} days late`;
  return `${DAYS[d.getDay()].slice(0, 3)}, ${shortDate(iso)}`;
}

/** "Sep 24 · 15:02" for timeline stamps. */
export function stamp(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = parseDate(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${shortDate(iso)} · ${hh}:${mm}`;
}

export function money(n: number): string {
  const abs = Math.abs(n);
  const whole = Number.isInteger(abs) || abs >= 100;
  const s = whole ? Math.round(abs).toLocaleString("en-US") : abs.toFixed(2);
  return `${n < 0 ? "-" : ""}$${s}`;
}
