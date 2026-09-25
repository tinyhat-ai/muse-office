# The look

The Office should feel like one calm, everyday app: a paper-coloured page, sticky notes for tasks, soft cards for everything else, and exactly one loud colour, which means "waiting on you".

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

Each project has a pastel fill and a darker shade. The tiles, the sticky notes, the project label bars, and the chart series all use them, so the board and the reports agree.

| Project | Fill | Dark |
| --- | --- | --- |
| Website | `#f2e4a9` | `#b89a3a` |
| Marketing | `#d5eaea` | `#2f8a8a` |
| Customers | `#d8e7d3` | `#5b8a5a` |
| Money | `#e3dcf0` | `#7e6aa6` |
| General | `#e9e7df` | `#9a978c` |

Spare pastels for new projects: `#efd3d3` / `#b86e6e`, `#d3e0e6` / `#5f8497`, `#f5dcc4` / `#b8743a`.

## The board

Lanes: a 3px top rule in the lane colour (To do `#c9c8c1`, In progress `#3d5a6c`, Waiting on you `#b3541e`, Done `#2d5a45`), then the title (15px/700), a one-line subtitle (12px, soft), and a round count badge (24px, `#e7e6e0`; orange with white text on the Waiting lane). The Waiting lane sits on a faint peach wash (`#fbeee6` at 60%, rounded, 8px inside).

Cards are **sticky notes**, laid out **one per lane** with a 12px vertical gap. Four desktop lanes leave too little width for two readable notes in each lane.

- Filled with the project's pastel, with faint ruled lines: `repeating-linear-gradient(0deg, rgba(0,0,0,.022) 0 1px, transparent 1px 7px)`.
- A 1px border `rgba(0,0,0,.07)`, corners `3px 3px 16px 3px` (the bottom-right corner is the big one), and a folded corner drawn with a small diagonal gradient in that corner.
- A soft shadow: `0 1px 1px rgba(0,0,0,.05), 0 6px 14px rgba(0,0,0,.05)`; lifts 1px on hover.
- Desktop height 206px, width at most 270px, padding 12px 13px 10px. Keep every note the same size; the task page carries the full text.
- Inside: the project name (12px/650, soft) with a 3.5px × 13px bar in the project's dark shade; the title (15px/750, ink, two lines at most); up to three lines of summary or a waiting question directly on the pastel paper with a small orange dot, without a bubble; and a footer pushed to the bottom: the specialist's 20px round avatar and name on the left, the time on the right. A done card's footer reads "✓ Done" in green with a small green check circle, then the time.
- On a phone: one column of notes per lane, lanes stacked, Waiting on you first.

Project tiles above the board: 118px squares (88px on a phone), the pastel fill, no border, no stripe; name top-left (14px/750), count bottom-left (13px/600 soft); the chosen tile gets a 2px ink outline; "All projects" is white with a hairline border.

## Cards and pills

Cards: white, `--r-card`, `--shadow-card`, 20px padding. Small chips: `--r-chip`. Pills: `--r-pill`. Status pills: green (`#e7f1ea` / `#2d6a43`) for working, grey (`#efeee9` / `#66655f`) for next, peach (`--needs-bg` / `--needs`) for waiting on you. The orange accent appears nowhere else: not on charts, not on buttons that are not about the user's OK.

## Avatars

Always round, always the head crop: 20px on project cards and in lists; on the Team page, 56px on specialist cards, 80px in the selected specialist's detail panel, and 96px for the chief. People (contacts) get initials on a coloured circle instead.

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
