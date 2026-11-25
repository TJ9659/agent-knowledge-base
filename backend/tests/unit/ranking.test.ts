import { describe, expect, it } from 'vitest';
import { cosineSimilarity, mergeRankings } from '../../src/utils/ranking.js';

describe('cosineSimilarity', () => {
  it('is 1 for the same direction, whatever the length', () => {
    expect(cosineSimilarity([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
  });

  it('is 0 for unrelated vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it('is -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 1], [-1, -1])).toBeCloseTo(-1);
  });
});

describe('mergeRankings', () => {
  const a = { id: 1 };
  const b = { id: 2 };
  const c = { id: 3 };
  const d = { id: 4 };

  it('puts an item found by both lists above the top of a single list', () => {
    // b is 2nd and 3rd, a and d top one list each
    expect(mergeRankings([[a, b, c], [d, c, b]]).map((item) => item.id)[0]).toBe(2);
  });

  it('keeps each item once', () => {
    const merged = mergeRankings([[a, b], [b, a]]);
    expect(merged).toHaveLength(2);
  });

  it('keeps the order of a single list', () => {
    expect(mergeRankings([[c, a, b]]).map((item) => item.id)).toEqual([3, 1, 2]);
  });

  it('works when one list is empty', () => {
    expect(mergeRankings([[a, b], []]).map((item) => item.id)).toEqual([1, 2]);
  });
});
