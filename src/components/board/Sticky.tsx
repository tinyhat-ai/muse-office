import Link from "next/link";
import type { CSSProperties } from "react";
import type { MemberRow, TaskRow } from "@/lib/db";
import { ago, dueWord, span } from "@/lib/time";
import { Avatar } from "@/components/Avatar";
import "@/app/projects/projects.css";

/** What a sticky note needs: the task's card fields plus its project's name and colours. */
export type StickyTask = Pick<TaskRow, "id" | "title" | "column_name" | "question" | "note" | "due" | "updated_at" | "done_at"> & {
  project_name: string;
  color: string;
  color_dark: string;
};

/** The time word in the footer: a due day beats a waiting span, which beats "x ago". */
export function stickyTime(task: StickyTask): string {
  if (task.column_name === "done") return ago(task.done_at ?? task.updated_at);
  if (task.due) return `due ${dueWord(task.due)}`;
  if (task.column_name === "waiting_on_you") return `waiting ${span(task.updated_at)}`;
  return ago(task.updated_at);
}

/**
 * A task as a sticky note in its project's colour (spec/DESIGN.md §Board). The whole
 * note links to the task's page. A server component; its styles live in projects.css,
 * imported above so the note looks right wherever it is used.
 */
export function Sticky({ task, specialist }: { task: StickyTask; specialist?: MemberRow | null }) {
  const done = task.column_name === "done";
  // The question is the card's middle line only while the task waits on the user.
  const question = task.column_name === "waiting_on_you" ? task.question : null;
  const paper = { "--c": task.color, "--d": task.color_dark } as CSSProperties;
  return (
    <Link href={`/tasks/${task.id}`} className={"pj-note" + (done ? " done" : "")} style={paper}>
      <span className="pj-note-p">
        <i aria-hidden="true" />
        {task.project_name}
      </span>
      <span className="pj-note-t">{task.title}</span>
      {question ? (
        <span className="pj-note-q">
          <span>{question}</span>
        </span>
      ) : task.note ? (
        <span className="pj-note-n">{task.note}</span>
      ) : null}
      <span className="pj-note-f">
        <Avatar member={specialist} size="sm" />
        <span className="pj-note-who">{specialist?.name ?? "No one yet"}</span>
        {done && <span className="pj-note-dn">Done</span>}
        <span className="pj-note-ago">{stickyTime(task)}</span>
      </span>
    </Link>
  );
}
