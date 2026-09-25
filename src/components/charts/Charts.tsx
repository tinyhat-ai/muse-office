import type { CSSProperties, ReactNode } from "react";
import { money } from "@/lib/time";

// Charts for the Reports page: pure server components that draw inline SVG,
// so the page ships no chart JavaScript. The page prepares the numbers and
// the series colours (the projects' darker shades) and these only draw.
// Wide charts render twice, at 640×230 and again at 320 wide for phones;
// src/app/reports/reports.css shows one or the other (.rp-ch-desk / .rp-ch-phone)
// and styles the small HTML parts (.rp-lg legend, .rp-hb rows).

export type Unit = "count" | "money";
export interface Series {
  name: string;
  color: string;
  values: number[];
}

const SOFT = "var(--soft)";
const INK = "var(--ink)";
const GRID = "#ecebe6";
const GREEN = "#2d6a43";
// A white halo behind a number so a gridline or the average line never strikes through it.
const HALO: CSSProperties = { paintOrder: "stroke", stroke: "#fff", strokeWidth: 4, strokeLinejoin: "round" };

/** Numbers as the charts print them: counts plain, money through `money()`, "$2.5k" on a money axis. */
export function fmt(n: number, unit: Unit = "count", axis = false): string {
  if (unit === "money") {
    if (axis && Math.abs(n) >= 1000) {
      const k = n / 1000;
      return `$${Number.isInteger(k) ? k : k.toFixed(1)}k`;
    }
    return money(n);
  }
  return Math.round(n).toLocaleString("en-US");
}

/** A round top value and step for the gridlines: 720 → 800 by 200, 945 → 1000 by 250, 9 leads → 9 by 3. */
export function niceScale(max: number, unit: Unit = "count", steps = 4): { top: number; step: number } {
  if (!(max > 0)) return unit === "count" ? { top: 4, step: 1 } : { top: 100, step: 25 };
  const raw = max / steps;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const units = unit === "count" && mag < 10 ? [1, 2, 3, 4, 5, 10] : [1, 2, 2.5, 3, 4, 5, 10];
  let step = units.map((u) => u * mag).find((s) => s >= raw) ?? mag * 10;
  if (unit === "count") step = Math.max(1, Math.round(step)); // people come in whole numbers
  return { top: Math.ceil(max / step - 1e-9) * step, step };
}

/** Mixes two hex colours; t = 0 keeps `a`, t = 1 gives `b`. Used for the lighter shade of a series. */
export function blend(a: string, b: string, t: number): string {
  const parse = (h: string) => {
    const s = h.replace("#", "");
    const f = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
    return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
  };
  const [x, y] = [parse(a), parse(b)];
  if (x.some(Number.isNaN) || y.some(Number.isNaN)) return a;
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

/** Axis and legend text: 12px, soft grey; `strong` for the latest label. */
export function AxisText({ x, y, anchor = "middle", strong = false, children }: { x: number; y: number; anchor?: "start" | "middle" | "end"; strong?: boolean; children: ReactNode }) {
  return (
    <text x={x} y={y} fontSize={12} fill={strong ? INK : SOFT} fontWeight={strong ? 700 : 400} textAnchor={anchor}>
      {children}
    </text>
  );
}

/** A value printed on a bar, with the halo. */
function ValueText({ x, y, children, color = INK }: { x: number; y: number; children: ReactNode; color?: string }) {
  return (
    <text x={x} y={y} fontSize={12} fontWeight={700} fill={color} textAnchor="middle" style={HALO}>
      {children}
    </text>
  );
}

// ---- geometry shared by the bar charts ----
interface Frame {
  W: number; H: number; L: number; R: number; T: number; B: number; plotW: number; plotH: number; bottom: number;
}
function frame(W: number, H: number, L: number, B: number, T = 16): Frame {
  const R = 8;
  return { W, H, L, R, T, B, plotW: W - L - R, plotH: H - T - B, bottom: H - B };
}

function Gridlines({ f, top, step, unit, labels }: { f: Frame; top: number; step: number; unit: Unit; labels: boolean }) {
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  return (
    <>
      {ticks.map((v) => {
        const y = f.bottom - (v / top) * f.plotH;
        return (
          <g key={v}>
            <line x1={f.L} x2={f.W - f.R} y1={y} y2={y} stroke={GRID} />
            {labels ? <AxisText x={f.L - 8} y={y + 4} anchor="end">{fmt(v, unit, true)}</AxisText> : null}
          </g>
        );
      })}
    </>
  );
}

// On a phone, eight week labels cannot all fit: show every other one, counting back from the latest.
const showX = (i: number, n: number, compact: boolean) => !compact || n <= 6 || (n - 1 - i) % 2 === 0;

/** Draws the chart at 640×230, plus a 320-wide copy for phones; a half-width chart is 320×180 only. */
function Chart({ wide, title, draw }: { wide: boolean; title: string; draw: (W: number, H: number, compact: boolean) => ReactNode }) {
  const svg = (W: number, H: number, compact: boolean, cls: string) => (
    <svg className={`rp-ch ${cls}`} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} preserveAspectRatio="xMidYMid meet">
      <title>{title}</title>
      {draw(W, H, compact)}
    </svg>
  );
  if (!wide) return svg(320, 180, true, "rp-ch-half");
  return (
    <>
      {svg(640, 230, false, "rp-ch-desk")}
      {svg(320, 200, true, "rp-ch-phone")}
    </>
  );
}

/** A legend under a chart: a dot per series and its name (and, if given, a value). */
export function Legend({ items }: { items: Array<{ color: string; text: string }> }) {
  return (
    <div className="rp-lg">
      {items.map((it) => (
        <span key={it.text}>
          <i style={{ background: it.color }} />
          {it.text}
        </span>
      ))}
    </div>
  );
}

/**
 * One series of bars; the latest bar is the full colour, the earlier ones a lighter shade.
 * `captions` prints a second number under each bar (inquiries under visitors), with `captionLabel` in the gutter.
 */
export function Bars({ title, labels, values, color, captions, captionLabel, unit = "count", wide = true }: {
  title: string; labels: string[]; values: number[]; color: string; captions?: number[]; captionLabel?: string; unit?: Unit; wide?: boolean;
}) {
  const n = values.length;
  const { top, step } = niceScale(Math.max(0, ...values), unit);
  const light = blend(color, "#ffffff", 0.55);
  const hasCaptions = !!captions && captions.length === n;
  return (
    <Chart wide={wide} title={title} draw={(W, H, compact) => {
      // The caption label needs the gutter, so charts with captions keep the axis on phones too.
      const L = hasCaptions ? 62 : compact ? 8 : 44;
      const f = frame(W, H, L, hasCaptions ? 38 : 22);
      const slot = f.plotW / n, bw = slot * 0.56;
      const y = (v: number) => f.bottom - (v / top) * f.plotH;
      return (
        <>
          <Gridlines f={f} top={top} step={step} unit={unit} labels={L >= 40} />
          {values.map((v, i) => {
            const x = L + slot * (i + 0.5) - bw / 2, last = i === n - 1;
            return (
              <g key={i}>
                <rect x={x} y={y(v)} width={bw} height={Math.max(0, f.bottom - y(v))} rx={3} fill={last ? color : light} />
                <ValueText x={x + bw / 2} y={y(v) - 5}>{fmt(v, unit)}</ValueText>
                {showX(i, n, compact) ? <AxisText x={x + bw / 2} y={f.bottom + 16} strong={last}>{labels[i]}</AxisText> : null}
                {hasCaptions ? <ValueText x={x + bw / 2} y={H - 6} color={GREEN}>{captions[i]}</ValueText> : null}
              </g>
            );
          })}
          {hasCaptions && captionLabel ? <AxisText x={L - 8} y={H - 6} anchor="end">{captionLabel}</AxisText> : null}
        </>
      );
    }} />
  );
}

/** Two (or more) series side by side per label, with a legend. `showValues` prints non-zero values on the bars. */
export function GroupedBars({ title, labels, series, unit = "count", wide = true, showValues = false }: {
  title: string; labels: string[]; series: Series[]; unit?: Unit; wide?: boolean; showValues?: boolean;
}) {
  const n = labels.length, k = series.length;
  const { top, step } = niceScale(Math.max(0, ...series.flatMap((s) => s.values)), unit);
  return (
    <>
      <Chart wide={wide} title={title} draw={(W, H, compact) => {
        const L = unit === "money" ? 44 : compact ? 28 : 44;
        const f = frame(W, H, L, 22);
        const slot = f.plotW / n, bw = slot * 0.3, gap = 2, groupW = k * bw + (k - 1) * gap;
        const y = (v: number) => f.bottom - (v / top) * f.plotH;
        return (
          <>
            <Gridlines f={f} top={top} step={step} unit={unit} labels />
            {labels.map((label, i) => {
              const x0 = L + slot * i + (slot - groupW) / 2, last = i === n - 1;
              return (
                <g key={i}>
                  {series.map((s, j) => {
                    const v = s.values[i] ?? 0, x = x0 + j * (bw + gap);
                    return (
                      <g key={s.name}>
                        <rect x={x} y={y(v)} width={bw} height={Math.max(0.5, f.bottom - y(v))} rx={2} fill={s.color} />
                        {showValues && v > 0 ? <ValueText x={x + bw / 2} y={y(v) - 4} color="#3d3c38">{fmt(v, unit)}</ValueText> : null}
                      </g>
                    );
                  })}
                  {showX(i, n, compact) ? <AxisText x={x0 + groupW / 2} y={f.bottom + 16} strong={last}>{label}</AxisText> : null}
                </g>
              );
            })}
          </>
        );
      }} />
      <Legend items={series.map((s) => ({ color: s.color, text: s.name }))} />
    </>
  );
}

/**
 * Series stacked per label, the total printed on top of each stack, a dashed average line, and a legend.
 * `legendValues` adds each series' latest value to its legend entry.
 */
export function StackedBars({ title, labels, series, unit = "money", wide = true, averageLabel = "average", legendValues = false }: {
  title: string; labels: string[]; series: Series[]; unit?: Unit; wide?: boolean; averageLabel?: string; legendValues?: boolean;
}) {
  const n = labels.length;
  const totals = labels.map((_, i) => series.reduce((a, s) => a + (s.values[i] ?? 0), 0));
  const avg = n ? totals.reduce((a, b) => a + b, 0) / n : 0;
  const maxI = totals.indexOf(Math.max(...totals));
  const { top, step } = niceScale(Math.max(0, ...totals, avg), unit);
  return (
    <>
      <Chart wide={wide} title={title} draw={(W, H, compact) => {
        const L = compact ? 8 : 44;
        const f = frame(W, H, L, 22);
        const slot = f.plotW / n, bw = slot * 0.56;
        const y = (v: number) => f.bottom - (v / top) * f.plotH;
        const ya = y(avg);
        return (
          <>
            <Gridlines f={f} top={top} step={step} unit={unit} labels={!compact} />
            {labels.map((label, i) => {
              const x = L + slot * (i + 0.5) - bw / 2, last = i === n - 1;
              let acc = 0;
              return (
                <g key={i}>
                  {series.map((s) => {
                    const v = s.values[i] ?? 0, yTop = y(acc + v), h = y(acc) - yTop;
                    acc += v;
                    return v > 0 ? <rect key={s.name} x={x} y={yTop + 0.5} width={bw} height={Math.max(0, h - 1)} rx={2} fill={s.color} /> : null;
                  })}
                  {/* On a phone only the biggest and the latest total are printed, so the numbers do not collide. */}
                  {!compact || i === maxI || last ? <ValueText x={x + bw / 2} y={y(totals[i]) - 6}>{fmt(totals[i], unit)}</ValueText> : null}
                  {showX(i, n, compact) ? <AxisText x={x + bw / 2} y={f.bottom + 16} strong={last}>{label}</AxisText> : null}
                </g>
              );
            })}
            {n ? (
              <>
                <line x1={L} x2={f.W - f.R} y1={ya} y2={ya} stroke={SOFT} strokeDasharray="4 4" />
                <text x={L + 6} y={ya - 5} fontSize={12} fill={SOFT} textAnchor="start" style={HALO}>
                  {compact ? "avg " : `${averageLabel} `}{fmt(avg, unit)}
                </text>
              </>
            ) : null}
          </>
        );
      }} />
      <Legend items={series.map((s) => ({ color: s.color, text: legendValues ? `${s.name} ${fmt(s.values[n - 1] ?? 0, unit)}` : s.name }))} />
    </>
  );
}

export interface HBarRow {
  label: string;
  value: number;
  unused?: boolean;
  why?: string | null;
}

/** Horizontal bars, one row per item; rows flagged `unused` are striped orange and say why. */
export function HBars({ rows, color, unit = "money", patternId = "rp-stripes" }: { rows: HBarRow[]; color: string; unit?: Unit; patternId?: string }) {
  const max = Math.max(0, ...rows.map((r) => r.value));
  return (
    <div className="rp-hb-list">
      {/* One stripe pattern shared by every unused row; "needs your call" wears the orange. */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <defs>
          <pattern id={patternId} patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
            <rect width="4" height="8" fill="#b3541e" />
            <rect x="4" width="4" height="8" fill="#f3d9c8" />
          </pattern>
        </defs>
      </svg>
      {rows.map((r) => {
        const pct = max > 0 ? Math.max(2, Math.round((r.value / max) * 100)) : 0;
        return (
          <div className={`rp-hb${r.unused ? " rp-unused" : ""}`} key={r.label}>
            <span className="rp-hb-name">{r.label}</span>
            <svg className="rp-hb-track" width="100%" height="10" role="img" aria-label={`${r.label}: ${fmt(r.value, unit)}`}>
              <rect width="100%" height="10" rx="5" fill="#efeee9" />
              <rect width={`${pct}%`} height="10" rx="5" fill={r.unused ? `url(#${patternId})` : color} />
            </svg>
            <span className="rp-hb-amt">{fmt(r.value, unit)}</span>
            {/* The flag takes a full line under the bar so a long reason does not squeeze the name column. */}
            {r.unused ? <span className="rp-hb-flag">looks unused{r.why ? ` · ${r.why}` : ""}</span> : null}
          </div>
        );
      })}
    </div>
  );
}
