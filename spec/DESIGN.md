# The look

The Office should feel like one calm, everyday app: a paper-coloured page, readable project and task cards, and one strong colour, which means "waiting on you".

## Tokens

```css
:root {
  --bg: #f3f3ef;        /* page */
  --card: #ffffff;
  --ink: #1c1c19;       /* text */
  --soft: #6d6c66;      /* secondary text */
  --line: #e2e1db;      /* hairlines */
  --needs: #b3541e;     /* the one accent: waiting on you */
  --needs-bg: #fbeee6;
  --done: #2d5a45;

  --t-display: 40px;    /* page title */
  --t-big: 28px;        /* big numbers on Reports */
  --t-h2: 20px;         /* card titles, section titles */
  --t-body: 16px;
  --t-sec: 14px;        /* secondary */
  --t-cap: 13px;        /* captions, meta, table cells */
  --t-badge: 12px;      /* tiny badges and the small-caps kicker; nothing smaller */

  --r-chip: 8px;
  --r-card: 14px;
  --r-pill: 999px;

  --shadow-card: 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.05);
}
```

Type: the system sans-serif (`-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`). Seven sizes, never smaller than 12px. Weights: 400 body, 600 secondary labels, 700 titles, 750–800 page titles.

Spacing on an 8px grid: 20px inside cards, 16px between cards, 32px between sections, 32px page side padding (16px on a phone).

## Project colours

Each project has a pastel fill and a darker shade. Project accents, task labels, and chart series use them, so the board and the reports agree.

| Project | Fill | Dark |
| --- | --- | --- |
| Website | `#f2e4a9` | `#b89a3a` |
| Marketing | `#d5eaea` | `#2f8a8a` |
| Customers | `#d8e7d3` | `#5b8a5a` |
| Money | `#e3dcf0` | `#7e6aa6` |
| General | `#e9e7df` | `#9a978c` |

Spare pastels for new projects: `#efd3d3` / `#b86e6e`, `#d3e0e6` / `#5f8497`, `#f5dcc4` / `#b8743a`.

## The board

Use task cards in four status lists with project selectors above. Projects are
umbrellas for related tasks. Keep a readable paper surface, project accent, task
title, owner portrait/name, a short update, and the current question.
Open a card for task details. Keep project context accessible separately. No white
speech bubbles inside coloured cards. Keep project filters and agent portraits
when refining the layout. Keep the optimized sticky-note design. No percentage
bars, checklist dashboards, project forms, or milestone panels. See
`spec/PAGES.md` for the comments-only interaction boundary.

Keep cards full lane width. Use four lanes on a wide desktop, two below 900px,
and one column below 560px with Waiting on you first. Text must wrap; never
squeeze two narrow cards into a lane or clip controls on a phone.

## Readability and personal choice

Pair foreground and background colors explicitly, including typed comments,
placeholders, selected cards, and buttons. Normal text needs at least 4.5:1
contrast; large text and meaningful control boundaries need 3:1. Never inherit
white host text onto a light pastel. Check the actual app in the user's theme,
including focus, error, pending, and selected states. The reference starts with
an explicit light color scheme; a requested dark theme needs its own verified
pairs, not an automatic color inversion.

This is a polished starting design, not a restriction on the user's Office.
Muse can replace any layout or palette when asked. Explain that the Office was
built for them from Tinyhat's starting instructions and can keep evolving.

## Cards and pills

Cards: white, `--r-card`, `--shadow-card`, 20px padding. Small chips: `--r-chip`. Pills: `--r-pill`. Status pills: green (`#e7f1ea` / `#2d6a43`) for working, grey (`#efeee9` / `#66655f`) for next, peach (`--needs-bg` / `--needs`) for waiting on you. The orange accent appears nowhere else: not on charts, not on buttons that are not about the user's OK.

## Avatars

Always round, always the head crop: 20px on project cards and in lists, 32px for compact task and process rows, and 40px for larger task and project portraits. On the Team page, use 56px on specialist cards, 80px in the selected specialist's detail panel, and 96px for the chief. People (contacts) get initials on a coloured circle instead.

Use the Muse's actual current avatar as the chief's Team portrait and add only a small top hat, preserving its recognizable face. The sample chief image in this standalone repository must not replace the Muse's own avatar. Specialists each get a different face and mascot suited to their specialty, rendered in the chief avatar's overall illustration style and crop. A hat or color change on the chief's face is not a specialist identity. Compare the faces side by side at card size; they should be recognizable without reading the name. `hat/skills/hat-avatar/SKILL.md` owns the creation steps.

## Charts

Inline SVG, drawn at 640×230 for wide cards and 320×180 for narrow ones (redrawn at 320 wide on a phone). Axis and legend text 12px `--soft`. Bars have 2–3px radius. The spending chart is stacked with a dashed average line and the label "8-week average $680". Money in and out are grouped bars in `#5b8a5a` (in) and `#3d5a6c` (out). Website visitors are one series of blue-grey bars with the last one darker.

Donut slices use distinct colours keyed to their labels, regardless of metric insertion order. The Earth example always uses sand `#c8b990` for Land and blue `#5f8497` for Ocean. Other donuts sort labels before assigning palette colours; the legend uses the same colours as the slices.

## Icon

The Office's icon is the small building in `src/app/icon.svg`: two windows,
an orange doorway (`#b3541e`), ink outlines (`#1c1c19`), and a warm off-white
background (`#f3f3ef`). Use it wherever the platform shows the app's icon
(an app list, a tab, an artifact card). The top hat belongs on the chief's
avatar, so people can distinguish the workspace from the role.

## Visuals in notes

A note explains; a visual is for when a picture says it faster. Use, in this order: a Markdown table (choices, prices, dates); a fenced `mermaid` diagram for a flow, timeline, or relationship; a small inline SVG for a custom comparison; an image by URL only when it already exists somewhere the person can open. Render GitHub-flavored Markdown before styling it: a pipe table is a table and `**bold**` is bold. A `mermaid` fence becomes a diagram at its intrinsic width; a wide diagram scrolls horizontally inside the note so labels remain legible. Keep the source visible if rendering fails. Use strict Mermaid security with HTML labels and clickable links disabled, and display the generated SVG as an image. Rules for an inline SVG: `viewBox` set and `width` at most 640, so it scales on a phone; the page's colours only (project pastels and darks, `--ink`, `--soft`, `--line`, `--needs`, `--done`); text 12–13px in the page font; a `role="img"` and an `aria-label` that says what it shows; no scripts, links, images, or references to anything outside the SVG (the page strips them). Say in one line above the visual what it shows.
