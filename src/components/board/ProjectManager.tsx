"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectRow } from "@/lib/db";

export function ProjectManager({ projects }: { projects: ProjectRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<ProjectRow | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function save(input: object) {
    setBusy(true); setError(""); setMessage("");
    try {
      const res = await fetch("/api/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
      const result = await res.json();
      if (!res.ok || !result.ok) throw new Error(result.error || "Could not save this project.");
      setMessage(`Saved. ${result.follow_up}`); setEditing(null); setName(""); setDescription("");
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not reach your Office."); }
    finally { setBusy(false); }
  }
  return <details className="pj-manager">
    <summary>Manage projects</summary>
    <p>Projects group related tasks. Add your own or change these examples. Archiving removes a project and its tasks from the active board; you can restore them here.</p>
    <form className="pj-filters" onSubmit={(event) => { event.preventDefault(); void save({ action: "upsert_project", create_only: !editing, ...(editing ? {slug: editing.slug} : {}), name, description }); }}>
      <label>Project name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="For example, School" disabled={busy} /></label>
      <label>Description<input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What belongs here?" disabled={busy} /></label>
      <button disabled={busy || !name.trim()}>{editing ? "Save project" : "Add project"}</button>
      {editing && <button type="button" disabled={busy} onClick={() => { setEditing(null); setName(""); setDescription(""); }}>Cancel edit</button>}
    </form>
    <ul className="pj-manage-list">{projects.map((project) => <li key={project.slug}>
      <span>{project.name}{project.archived_at ? " · Archived" : ""}</span>
      <button type="button" disabled={busy} onClick={() => { setEditing(project); setName(project.name); setDescription(project.description ?? ""); }}>Edit {project.name}</button>
      <button type="button" disabled={busy} onClick={() => void save({action:"archive_project", slug:project.slug, archived:!project.archived_at})}>{project.archived_at ? "Restore" : "Archive"} {project.name}</button>
    </li>)}</ul>
    {message && <p role="status">{message}</p>}{error && <p role="alert">{error}</p>}
  </details>;
}
