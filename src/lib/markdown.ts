import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

// Markdown reaches the pages through the actions, and a Muse may paste in
// text it copied from a page, an email, or a document. Rendered HTML is
// therefore cut down to an allowlist before it is put on a page: no
// scripts, no event handlers, no javascript: links. Everything the pages
// need (headings with ids, tables with phone labels, the small ".by"
// attribution span) is kept.
const ALLOWED_TAGS = [
  "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "code",
  "ul", "ol", "li", "strong", "em", "b", "i", "u", "s", "del", "sup", "sub", "mark", "small",
  "table", "thead", "tbody", "tr", "th", "td", "a", "img", "span", "div", "dl", "dt", "dd", "input",
];

const SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ["href", "title", "name", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    h1: ["id"], h2: ["id"], h3: ["id"], h4: ["id"], h5: ["id"], h6: ["id"],
    td: ["align", "data-label"], th: ["align", "data-label"],
    span: ["class"], code: ["class"], pre: ["class"], div: ["class"],
    input: ["type", "checked", "disabled"], // task-list checkboxes
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  allowedSchemesAppliedToAttributes: ["href", "src"],
  allowProtocolRelative: false,
  // Keep the text of a removed tag (a pasted <script> is dropped whole).
  nonTextTags: ["script", "style", "textarea", "option", "noscript", "iframe", "object", "embed"],
  transformTags: {
    a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, rel: "noopener noreferrer" } }),
  },
};

/** Markdown → safe HTML for a page. Never render Markdown any other way. */
export function renderMarkdown(markdown: string | null | undefined): string {
  if (!markdown) return "";
  const html = marked.parse(markdown, { async: false }) as string;
  return sanitizeHtml(html, SANITIZE);
}

/** Sanitize HTML that a page built itself from rendered Markdown (e.g. after adding heading ids). */
export function sanitizeRendered(html: string): string {
  return sanitizeHtml(html, SANITIZE);
}
