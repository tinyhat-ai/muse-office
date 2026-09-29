import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("the promotion message has one complete copyable section", () => {
  const markdown = fs.readFileSync(path.join(process.cwd(), "hat", "PROMPT.md"), "utf8");
  const sections = markdown.replace(/\r\n/g, "\n").split(/^---\s*$/m);
  assert.equal(sections.length, 3, "keep exactly two separator lines around the message");
  assert.ok(sections[0].trim(), "keep the copying instructions outside the message");
  assert.match(sections[1].trim(), /^Here is how I want you to work from now on\./);
  assert.ok(sections[2].trim(), "keep the closing contributor guidance outside the message");
});
