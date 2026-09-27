/** Keep every descendant under its original comment without nesting the layout. */
export function commentThreads<T extends { id: number; reply_to: number | null }>(rows: T[]) {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const roots = new Map<number, number>();
  for (const row of rows) {
    let root = row;
    const seen = new Set([row.id]);
    while (root.reply_to !== null && byId.has(root.reply_to)) {
      if (seen.has(root.reply_to)) { root = row; break; }
      seen.add(root.reply_to);
      root = byId.get(root.reply_to)!;
    }
    roots.set(row.id, root.id);
  }
  return rows.filter((row) => roots.get(row.id) === row.id).map((root) => ({
    root, replies: rows.filter((row) => row.id !== root.id && roots.get(row.id) === root.id),
  }));
}
