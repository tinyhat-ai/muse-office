import type { Column, TaskRow } from "./db";

/** A project's state is derived from its tasks; an empty project is never Done. */
export function projectProgress(tasks: Pick<TaskRow, "column_name" | "question" | "due">[]) {
  const done = tasks.filter((task) => task.column_name === "done").length;
  const waiting = tasks.filter((task) => task.column_name === "waiting_on_you");
  const column: Column = waiting.length ? "waiting_on_you"
    : tasks.length && done === tasks.length ? "done"
    : tasks.some((task) => task.column_name === "in_progress") || done > 0 ? "in_progress" : "todo";
  return {
    column, done, total: tasks.length,
    percent: tasks.length ? Math.round(done / tasks.length * 100) : 0,
    waiting: waiting.length,
    question: waiting[0]?.question ?? null,
    nextDue: tasks.filter((task) => task.column_name !== "done" && task.due).map((task) => task.due!).sort()[0] ?? null,
  };
}
