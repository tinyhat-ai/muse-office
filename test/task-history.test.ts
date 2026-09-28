import { test } from "node:test";
import assert from "node:assert/strict";
import { commentThreads } from "../src/lib/comment-threads";
import { recentTaskThreadIds } from "../src/lib/task-history";

test("a new nested reply brings its old original thread into the recent preview", () => {
  const rows = [
    { id: 1, reply_to: null, kind: "comment", created_at: "2026-09-28T10:00:00Z" },
    { id: 2, reply_to: 1, kind: "reply", created_at: "2026-09-28T10:01:00Z" },
    { id: 3, reply_to: null, kind: "update", created_at: "2026-09-28T10:02:00Z" },
    { id: 4, reply_to: null, kind: "update", created_at: "2026-09-28T10:03:00Z" },
    { id: 5, reply_to: null, kind: "update", created_at: "2026-09-28T10:04:00Z" },
    { id: 6, reply_to: 2, kind: "reply", created_at: "2026-09-28T10:05:00Z" },
    { id: 7, reply_to: null, kind: "event", created_at: "2026-09-28T10:06:00Z" },
  ];
  assert.deepEqual(recentTaskThreadIds(commentThreads(rows)), [4, 5, 1]);
});

test("same-time replies rank by their own id, not their old parent id", () => {
  const time = "2026-09-28T10:00:00.000Z";
  const threads = commentThreads([
    { id: 1, reply_to: null, kind: "comment", created_at: time },
    { id: 2, reply_to: null, kind: "comment", created_at: time },
    { id: 3, reply_to: 1, kind: "reply", created_at: time },
  ]);
  assert.deepEqual(recentTaskThreadIds(threads, 1), [1]);
  assert.deepEqual(recentTaskThreadIds(threads, 0), []);
});

test("the preview leaves the complete history and original reply relationships intact", () => {
  const threads = commentThreads([
    { id: 1, reply_to: null, kind: "event", created_at: "2026-09-28T10:00:00Z" },
    { id: 2, reply_to: null, kind: "comment", created_at: "2026-09-28T10:01:00Z" },
    { id: 3, reply_to: 2, kind: "reply", created_at: "2026-09-28T10:02:00Z" },
  ]);
  const before = structuredClone(threads);
  assert.deepEqual(recentTaskThreadIds(threads), [2]);
  assert.deepEqual(threads, before);
});
