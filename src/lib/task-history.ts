interface HistoryRow { id: number; kind: string; created_at: string }

/** A new reply makes its original thread recent; routine events stay in history. */
export function recentTaskThreadIds<T extends HistoryRow>(threads: Array<{ root: T; replies: T[] }>, limit = 3): number[] {
  if (limit <= 0) return [];
  return threads.filter(({ root }) => root.kind !== "event").map(({ root, replies }) => ({
    id: root.id,
    latest: [root, ...replies].reduce((latest, row) => {
      const difference = Date.parse(row.created_at) - Date.parse(latest.created_at);
      return difference > 0 || (difference === 0 && row.id > latest.id) ? row : latest;
    }, root),
  })).sort((a, b) => Date.parse(a.latest.created_at) - Date.parse(b.latest.created_at) || a.latest.id - b.latest.id).slice(-limit).map(({ id }) => id);
}
