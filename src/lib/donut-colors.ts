/** Stable, distinct slice colors independent of the order metrics were recorded. */
const COLORS = ["#5f8497", "#c8b990", "#5b8a5a", "#7e6aa6", "#b86e6e", "#b8743a", "#3d5a6c", "#b89a3a"];

export function colorDonutSegments(rows: Array<{ label: string; value: number }>, reportSlug: string) {
  const sorted = [...rows].sort((a, b) => a.label.localeCompare(b.label));
  return sorted.map((row, index) => {
    const earthColor = reportSlug === "earth-surface"
      ? ({ land: "#c8b990", ocean: "#5f8497" } as Record<string, string>)[row.label.toLowerCase()]
      : undefined;
    const color = earthColor ?? (sorted.length <= COLORS.length
      ? COLORS[index]
      : `hsl(${Math.round(index * 360 / sorted.length)} 37% 44%)`);
    return { label: row.label, value: row.value, color };
  });
}
