import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { get } from "@/lib/db";
import { ago } from "@/lib/time";

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
  const last = get<{ t: string }>(
    "SELECT MAX(t) AS t FROM (SELECT MAX(updated_at) t FROM tasks UNION SELECT MAX(updated_at) FROM contacts UNION SELECT MAX(updated_at) FROM notes UNION SELECT MAX(updated_at) FROM reports)",
  );
  return (
    <header className="nav">
      <Link href="/projects" className="brand">
        <Image src="/icon.svg" width={28} height={28} alt="" />
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
