import { test } from "node:test";
import assert from "node:assert/strict";
import { projectProgress } from "../src/lib/project-progress";
import type { Column } from "../src/lib/db";
const task = (column_name: Column, question: string | null = null, due: string | null = null) => ({ column_name, question, due });

test("projects derive status from work without hiding a decision or calling an empty project done", () => {
  assert.equal(projectProgress([]).column, "todo");
  assert.equal(projectProgress([task("todo")]).percent, 0);
  assert.equal(projectProgress([task("done"), task("todo")]).column, "in_progress");
  const waiting = projectProgress([task("done"), task("in_progress"), task("waiting_on_you", "Which direction?", "2026-10-01")]);
  assert.equal(waiting.column, "waiting_on_you"); assert.equal(waiting.question, "Which direction?");
  assert.equal(waiting.percent, 33); assert.equal(waiting.nextDue, "2026-10-01");
  assert.equal(projectProgress([task("done")]).percent, 100);
  assert.equal(projectProgress([task("done")]).column, "done");
});
