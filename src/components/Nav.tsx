import Link from "next/link";
import { headers } from "next/headers";
import { get, type MemberRow } from "@/lib/db";
import { ago } from "@/lib/time";
import { Avatar } from "./Avatar";

const TABS = [
  ["/projects", "Projects"],
  ["/team", "Team"],
  ["/customers", "Customers"],
  ["/reports", "Reports"],
  ["/notes", "Notes"],
] as const;

export async function Nav() {
  const h = await headers();
  const current = h.get("x-pathname") || "";
  const chief = get<MemberRow>("SELECT * FROM members WHERE is_chief = 1 ORDER BY sort_order LIMIT 1");
  const last = get<{ t: string }>(
    "SELECT MAX(t) AS t FROM (SELECT MAX(updated_at) t FROM tasks UNION SELECT MAX(updated_at) FROM contacts UNION SELECT MAX(updated_at) FROM notes UNION SELECT MAX(updated_at) FROM reports)",
  );
  return (
    <header className="nav">
      <Link href="/projects" className="brand">
        {chief ? <Avatar member={chief} size="sm" /> : null}
        Office
      </Link>
      <nav className="tabs">
        {TABS.map(([href, label]) => (
          <Link key={href} href={href} className={"tab" + (current.startsWith(href) ? " on" : "")}>
            {label}
          </Link>
        ))}
      </nav>
      <span className="upd">{last?.t ? `Updated ${ago(last.t)}` : ""}</span>
    </header>
  );
}
