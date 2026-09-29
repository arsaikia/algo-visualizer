import { describe, expect, it } from 'vitest';
import { SORT_ALGORITHM_LIST, collectFrames, replaySort } from '.';

function randomArray(length: number, max = 50): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * max));
}

const reference = (a: readonly number[]) => [...a].sort((x, y) => x - y);

const fixedCases: Record<string, number[]> = {
  empty: [],
  singleton: [42],
  duplicates: [5, 3, 5, 1, 3, 3, 5, 1],
  allEqual: [7, 7, 7, 7, 7],
  sorted: [1, 2, 3, 4, 5, 6, 7, 8],
  reversed: [9, 8, 7, 6, 5, 4, 3, 2, 1],
  twoElements: [2, 1],
  negatives: [3, -1, 0, -5, 2],
};

describe.each(SORT_ALGORITHM_LIST)('$name', ({ generator }) => {
  it.each(Object.entries(fixedCases))('sorts %s input', (_label, input) => {
    expect(replaySort(generator, input).array).toEqual(reference(input));
  });

  it('sorts 100 random arrays of varying length', () => {
    for (let t = 0; t < 100; t++) {
      const input = randomArray(Math.floor(Math.random() * 60));
      expect(replaySort(generator, input).array).toEqual(reference(input));
    }
  });

  it('does not mutate the input', () => {
    const input = randomArray(30);
    const copy = [...input];
    collectFrames(generator, input);
    expect(input).toEqual(copy);
  });

  it('marks every index as sorted exactly once', () => {
    for (const input of [...Object.values(fixedCases), randomArray(40)]) {
      const counts = new Array<number>(input.length).fill(0);
      for (const frame of collectFrames(generator, input)) {
        if (frame.type === 'sorted')
          for (const i of frame.indices) counts[i] = (counts[i] ?? 0) + 1;
      }
      expect(counts).toEqual(input.map(() => 1));
    }
  });

  it('only references valid indices', () => {
    const input = randomArray(25);
    for (const frame of collectFrames(generator, input)) {
      const indices =
        frame.type === 'overwrite'
          ? [frame.index]
          : frame.type === 'sorted'
            ? frame.indices
            : frame.indices;
      for (const i of indices) {
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThan(input.length);
      }
    }
  });

  it('emits no frames for an empty array', () => {
    expect(collectFrames(generator, [])).toEqual([]);
  });
});

describe('frame semantics', () => {
  it('bubble sort does a single pass on sorted input', () => {
    const bubble = SORT_ALGORITHM_LIST.find((a) => a.id === 'bubble');
    const frames = collectFrames(bubble!.generator, [1, 2, 3, 4]);
    expect(frames.filter((f) => f.type === 'compare')).toHaveLength(3);
    expect(frames.some((f) => f.type === 'swap')).toBe(false);
  });

  it('merge sort uses overwrites rather than swaps', () => {
    const merge = SORT_ALGORITHM_LIST.find((a) => a.id === 'merge');
    const frames = collectFrames(merge!.generator, [4, 3, 2, 1]);
    expect(frames.some((f) => f.type === 'overwrite')).toBe(true);
    expect(frames.some((f) => f.type === 'swap')).toBe(false);
  });

  it('counts comparisons and writes in the replayed view', () => {
    const view = replaySort(SORT_ALGORITHM_LIST[0]!.generator, [2, 1]);
    expect(view.comparisons).toBe(1);
    expect(view.writes).toBe(2);
  });
});
