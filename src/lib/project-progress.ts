import type { Column, TaskRow, CheckRow } from "./db";

export interface TaskProgress { basis: "done_when"; met: number; total: number; percent: number | null }
/** Verified criteria, not an estimate of time spent or permission to close. */
export function taskProgress(checks: Pick<CheckRow, "met">[]): TaskProgress {
  const met = checks.filter((check) => !!check.met).length;
  return { basis: "done_when", met, total: checks.length, percent: checks.length ? Math.round(100 * met / checks.length) : null };
}

/** A project's state is derived from its tasks; an empty project is never Done. */
export function projectProgress(tasks: Pick<TaskRow, "column_name" | "question" | "due">[]) {
  const done = tasks.filter((task) => task.column_name === "done").length;
  const waiting = tasks.filter((task) => task.column_name === "waiting_on_you");
  const column: Column = waiting.length ? "waiting_on_you"
    : tasks.length && done === tasks.length ? "done"
    : tasks.some((task) => task.column_name === "in_progress") || done > 0 ? "in_progress" : "todo";
  return {
    column, done, total: tasks.length,
    percent: tasks.length ? Math.round(100 * done / tasks.length) : 0,
    waiting: waiting.length,
    question: waiting[0]?.question ?? null,
    nextDue: tasks.filter((task) => task.column_name !== "done" && task.due).map((task) => task.due!).sort()[0] ?? null,
  };
}
