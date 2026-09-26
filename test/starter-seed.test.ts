import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { seedStarter } from "../src/lib/starter-seed";

test("first visit contains real setup, source-backed charts, and no invented customers or business numbers", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "office-starter-"));
  const db = new Database(path.join(dir, "office.db"));
  try {
    db.exec(fs.readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf8"));
    seedStarter(db);
    const count = (table: string) => (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;
    assert.equal(count("members"), 6);
    assert.equal(count("projects"), 5);
    assert.equal(count("tasks"), 7);
    assert.equal(count("task_checks"), 0, "the starter does not require a formal checklist");
    assert.equal(count("notes"), 3);
    assert.equal(count("reports"), 12);
    assert.equal(count("metrics"), 10);
    assert.equal((db.prepare("SELECT COUNT(*) AS n FROM contacts WHERE in_funnel = 1").get() as { n: number }).n, 0);
    assert.equal((db.prepare("SELECT COUNT(*) AS n FROM metrics WHERE report NOT IN ('world-population', 'olympic-women', 'recorded-music', 'earth-surface')").get() as { n: number }).n, 0);
    assert.equal((db.prepare("SELECT COUNT(*) AS n FROM reports WHERE section = 'Around the world' AND source_url LIKE 'https://%'").get() as { n: number }).n, 4);
    assert.deepEqual((db.prepare("SELECT chart FROM reports WHERE section = 'Around the world' ORDER BY sort_order").all() as Array<{ chart: string }>).map((r) => r.chart), ["bars", "timeline", "bars", "donut"]);
    const publicFigures = db.prepare("SELECT report, label, value FROM metrics WHERE report IN ('world-population', 'olympic-women') AND label IN ('2000', '2024') ORDER BY report, label").all() as Array<{ report: string; label: string; value: number }>;
    assert.deepEqual(publicFigures, [
      { report: "olympic-women", label: "2024", value: 5300 },
      { report: "world-population", label: "2000", value: 6200 },
      { report: "world-population", label: "2024", value: 8200 },
    ]);
    const guide = db.prepare("SELECT markdown FROM notes WHERE slug = 'how-your-office-works'").get() as { markdown: string };
    assert.match(guide.markdown, /\| Specialist \| Work \|/);
    assert.match(guide.markdown, /~~~mermaid/);
    const avatars = db.prepare("SELECT avatar_url FROM members").all() as Array<{ avatar_url: string }>;
    for (const { avatar_url } of avatars) assert.ok(fs.existsSync(path.join(process.cwd(), "public", avatar_url.slice(1))));
  } finally {
    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
