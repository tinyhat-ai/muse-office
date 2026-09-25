import { test } from "node:test";
import assert from "node:assert/strict";
import { colorDonutSegments } from "../src/lib/donut-colors";

test("Earth's land and ocean keep their meanings when metrics arrive in reverse order", () => {
  const forward = colorDonutSegments([{ label: "Land", value: 29 }, { label: "Ocean", value: 71 }], "earth-surface");
  const reverse = colorDonutSegments([{ label: "Ocean", value: 71 }, { label: "Land", value: 29 }], "earth-surface");
  assert.deepEqual(reverse, forward);
  assert.deepEqual(forward.map(({ label, color }) => [label, color]), [["Land", "#c8b990"], ["Ocean", "#5f8497"]]);
});

test("a three-part donut has three distinct slice and legend colours", () => {
  const rows = [{ label: "Marketing", value: 25 }, { label: "Build", value: 35 }, { label: "Design", value: 40 }];
  const segments = colorDonutSegments(rows, "work-mix");
  assert.deepEqual(segments.map(({ label }) => label), ["Build", "Design", "Marketing"]);
  assert.equal(new Set(segments.map(({ color }) => color)).size, 3);
  assert.deepEqual(colorDonutSegments([...rows].reverse(), "work-mix"), segments);
});
