import Link from "next/link";
import { all, get, type MemberRow } from "@/lib/db";
import { ago } from "@/lib/time";

export function OfficeActivity() {
  const chief = get<MemberRow>("SELECT * FROM members WHERE is_chief = 1")?.name ?? "Muse";
  const events = all<{id:number; source:string; target_id:string; target_title:string; actor:string; action:string; created_at:string}>("SELECT * FROM office_updates ORDER BY id DESC LIMIT 12");
  if (!events.length) return null;
  const routes: Record<string,string> = { task:"/tasks/", project:"/projects/", note:"/notes/", member:"/team", contact:"/customers", report:"/reports", office:"/projects" };
  return <details className="pj-manager"><summary>Recent updates</summary><ul className="office-activity">{events.map((event) => {
    const base = routes[event.source] ?? "/projects";
    const href = ["task","project","note"].includes(event.source) ? base + encodeURIComponent(event.target_id) : base;
    const verb = event.action === "post_comment" ? "commented on" : event.action === "reply_to_comment" ? "replied on" : "updated";
    return <li key={event.id}>{event.actor === "you" ? "You" : chief} {verb} <Link href={href}>{event.target_title}</Link> <span>· {ago(event.created_at)}</span></li>;
  })}</ul></details>;
}
