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
  // A small inline SVG is how a note carries a visual (a timeline, a flow, a
  // comparison). No scripts, no links, no external references inside it.
  "svg", "g", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "text", "tspan", "title", "desc",
];
const SVG_TAGS = ["svg", "g", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "text", "tspan"];
// The HTML parser lowercases attribute names; browsers restore viewBox's case when they parse inline SVG.
const SVG_ATTRS = [
  "viewbox", "width", "height", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "d", "points",
  "fill", "stroke", "stroke-width", "stroke-dasharray", "stroke-linecap", "stroke-linejoin", "opacity",
  "font-size", "font-weight", "font-family", "text-anchor", "dominant-baseline", "transform", "role", "aria-label", "class",
];
// No links inside a visual: an <a> in SVG would be the one way to smuggle a click target.

const SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ["href", "title", "name", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    h1: ["id"], h2: ["id"], h3: ["id"], h4: ["id"], h5: ["id"], h6: ["id"],
    td: ["align", "data-label"], th: ["align", "data-label"],
    span: ["class"], code: ["class"], pre: ["class"], div: ["class"],
    input: ["type", "checked", "disabled"], // task-list checkboxes
    svg: SVG_ATTRS, g: SVG_ATTRS, rect: SVG_ATTRS, circle: SVG_ATTRS, ellipse: SVG_ATTRS, line: SVG_ATTRS,
    polyline: SVG_ATTRS, polygon: SVG_ATTRS, path: SVG_ATTRS, text: SVG_ATTRS, tspan: SVG_ATTRS,
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  allowedSchemesAppliedToAttributes: ["href", "src"],
  allowProtocolRelative: false,
  // Keep the text of a removed tag (a pasted <script> is dropped whole).
  nonTextTags: ["script", "style", "textarea", "option", "noscript", "iframe", "object", "embed"],
  transformTags: {
    // A link keeps only a plain web or mail target; anything else (javascript:,
    // data:, a link inside a visual, no href at all) becomes plain text.
    a: (tagName, attribs) => {
      const href = (attribs.href ?? "").trim();
      const ok = /^(https?:\/\/|mailto:|\/|#|\.\/|\.\.\/)/i.test(href) || (/^[^:]+$/.test(href) && href !== "");
      if (!ok) return { tagName: "span", attribs: {} };
      const kept: Record<string, string> = { href, rel: "noopener noreferrer" };
      for (const k of ["title", "name"]) if (attribs[k]) kept[k] = attribs[k];
      return { tagName, attribs: kept };
    },
  },
};

// Paint attributes may reference other elements (url(#id)); a note's visual never needs that.
SANITIZE.transformTags = {
  ...SANITIZE.transformTags,
  ...Object.fromEntries(SVG_TAGS.map((tag) => [
    tag,
    (tagName: string, attribs: Record<string, string>) => {
      const clean = { ...attribs };
      for (const k of ["fill", "stroke"]) if (clean[k] && /url\(|expression|javascript/i.test(clean[k])) delete clean[k];
      return { tagName, attribs: clean };
    },
  ])),
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
