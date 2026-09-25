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

Cards are **sticky notes**, laid out **two across** in each lane with a 12px gap:

- Filled with the project's pastel, with faint ruled lines: `repeating-linear-gradient(0deg, rgba(0,0,0,.022) 0 1px, transparent 1px 7px)`.
- A 1px border `rgba(0,0,0,.07)`, corners `3px 3px 16px 3px` (the bottom-right corner is the big one), and a folded corner drawn with a small diagonal gradient in that corner.
- A soft shadow: `0 1px 1px rgba(0,0,0,.05), 0 6px 14px rgba(0,0,0,.05)`; lifts 1px on hover.
- Minimum height 180px so a short note is still a square-ish note, padding 12px 13px 10px.
- Inside: the project name (12px/650, soft) with a 3.5px × 13px bar in the project's dark shade; the title (15px/750, ink, two lines at most); one line (the question as a white pill with an orange dot, or the note in 12px soft); and a footer pushed to the bottom: the specialist's 20px round avatar and name on the left, the time on the right. A done card's footer reads "✓ Done" in green with a small green check circle, then the time.
- On a phone: one column of notes per lane, lanes stacked, Waiting on you first.

Project tiles above the board: 118px squares (88px on a phone), the pastel fill, no border, no stripe; name top-left (14px/750), count bottom-left (13px/600 soft); the chosen tile gets a 2px ink outline; "All projects" is white with a hairline border.

## Cards and pills

Cards: white, `--r-card`, `--shadow-card`, 20px padding. Small chips: `--r-chip`. Pills: `--r-pill`. Status pills: green (`#e7f1ea` / `#2d6a43`) for working, grey (`#efeee9` / `#66655f`) for next, peach (`--needs-bg` / `--needs`) for waiting on you. The orange accent appears nowhere else: not on charts, not on buttons that are not about the user's OK.

## Avatars

Always round, always the head crop: 20px on cards and in lists, 32px in card headers, 40px in page headers, 64px for the chief of staff's card. People (contacts) get initials on a coloured circle instead.

## Charts

Inline SVG, drawn at 640×230 for wide cards and 320×180 for narrow ones (redrawn at 320 wide on a phone). Axis and legend text 12px `--soft`. Bars have 2–3px radius. The spending chart is stacked with a dashed average line and the label "8-week average $680". Money in and out are grouped bars in `#5b8a5a` (in) and `#3d5a6c` (out). Website visitors are one series of blue-grey bars with the last one darker.

## Icon

The Office's icon is the chief of staff's top hat: ink (`#1c1c19`) with a
thin orange band (`#b3541e`) on the warm off-white (`#f3f3ef`), rounded
corners, as in `src/app/icon.svg`. Use that file for the app's icon wherever
the platform shows one (an app list, a tab, an artifact card). Never a
briefcase, a suitcase, a building, or a generic "office" symbol: the hat is
what says "this is the office my chief of staff runs".
