// 1 means the two vectors point the same way (same meaning), 0 means unrelated
export function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let lengthA = 0;
  let lengthB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    lengthA += a[i]! * a[i]!;
    lengthB += b[i]! * b[i]!;
  }
  return dot / (Math.sqrt(lengthA) * Math.sqrt(lengthB));
}

// reciprocal rank fusion: an item scores 1 / (60 + rank) in each list it is in, so near the top of both wins
// works on ranks, so the two lists' own scores never need to be comparable
export function mergeRankings<T extends { id: number }>(lists: T[][]) {
  const merged = new Map<number, { item: T; score: number }>();
  for (const list of lists) {
    list.forEach((item, i) => {
      const entry = merged.get(item.id) ?? { item, score: 0 };
      entry.score += 1 / (60 + i + 1);
      merged.set(item.id, entry);
    });
  }
  return [...merged.values()].sort((a, b) => b.score - a.score).map(({ item }) => item);
}
