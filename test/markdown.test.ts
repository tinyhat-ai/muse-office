import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown, sanitizeRendered } from "../src/lib/markdown";

test("event handlers, scripts and javascript: links never reach a page", () => {
  const html = renderMarkdown([
    "# Hello",
    "",
    '<img src=x onerror="window.reviewMarker=1">',
    "",
    "<script>window.reviewMarker=2</script>",
    "",
    '<a href="javascript:alert(1)">click</a>',
    "",
    '<p onclick="alert(1)">text</p>',
  ].join("\n"));
  assert.doesNotMatch(html, /onerror/i);
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /reviewMarker/);
  assert.doesNotMatch(html, /javascript:/i);
  assert.doesNotMatch(html, /onclick/i);
  assert.match(html, /<h1[^>]*>Hello<\/h1>/);
  assert.match(html, /<p>text<\/p>/);
});

test("what the pages need survives: headings with ids, tables with phone labels, links, the attribution span", () => {
  const html = sanitizeRendered(renderMarkdown([
    "## Colors",
    "",
    "| Bill | Due |",
    "| --- | --- |",
    "| Internet | Oct 5 |",
    "",
    "Logo option B. <span class=\"by\">— Sep 19, you picked it</span>",
    "",
    "[the site](https://example.com) and [mail](mailto:hi@example.com)",
  ].join("\n")).replace("<h2>", '<h2 id="colors">').replace("<td>Internet</td>", '<td data-label="Bill">Internet</td>'));
  assert.match(html, /<h2 id="colors">Colors<\/h2>/);
  assert.match(html, /<td data-label="Bill">Internet<\/td>/);
  assert.match(html, /<span class="by">— Sep 19, you picked it<\/span>/);
  assert.match(html, /<a href="https:\/\/example.com" rel="noopener noreferrer">the site<\/a>/);
  assert.match(html, /href="mailto:hi@example.com"/);
});

test("empty input renders nothing", () => {
  assert.equal(renderMarkdown(null), "");
  assert.equal(renderMarkdown(""), "");
});
