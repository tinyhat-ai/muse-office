import { test } from "node:test";
import assert from "node:assert/strict";
import { commentThreads } from "../src/lib/comment-threads";

test("an owner response to a user's reply remains in the original thread", () => {
  const rows = [
    { id: 1, reply_to: null, body: "User comment" },
    { id: 2, reply_to: 1, body: "User clarification" },
    { id: 3, reply_to: 2, body: "Owner answer" },
    { id: 4, reply_to: 3, body: "Follow-up" },
    { id: 5, reply_to: 99, body: "Orphan kept visible" },
  ];
  assert.deepEqual(commentThreads(rows).map(({ root, replies }) => [root.id, replies.map((r) => r.id)]), [[1, [2, 3, 4]], [5, []]]);
});

test("a malformed cycle cannot hide comments or hang rendering", () => {
  const rows = [{ id: 1, reply_to: 2 }, { id: 2, reply_to: 1 }];
  assert.deepEqual(commentThreads(rows).map((t) => t.root.id), [1, 2]);
});
