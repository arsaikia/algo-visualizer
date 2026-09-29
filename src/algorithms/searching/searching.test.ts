import { describe, expect, it } from 'vitest';
import { applySearchFrame, binarySearch, initialSearchView, linearSearch, runSearch } from '.';

describe('linearSearch', () => {
  const array = [7, 3, 9, 3, 1];

  it('finds the first occurrence', () => {
    expect(runSearch('linear', array, 3)).toEqual({ index: 1, steps: 2 });
  });

  it('finds first and last elements', () => {
    expect(runSearch('linear', array, 7).index).toBe(0);
    expect(runSearch('linear', array, 1)).toEqual({ index: 4, steps: 5 });
  });

  it('reports not found after checking every element', () => {
    expect(runSearch('linear', array, 42)).toEqual({ index: -1, steps: 5 });
    expect(Array.from(linearSearch(array, 42)).at(-1)).toEqual({ type: 'not-found' });
  });

  it('handles an empty array', () => {
    expect(runSearch('linear', [], 1)).toEqual({ index: -1, steps: 0 });
  });
});

describe('binarySearch', () => {
  const sorted = [1, 3, 5, 7, 9, 11, 13, 15, 17];

  it('finds every element', () => {
    sorted.forEach((value, index) => {
      expect(runSearch('binary', sorted, value).index).toBe(index);
    });
  });

  it('reports missing values including out-of-range targets', () => {
    for (const target of [0, 4, 18, 100]) {
      expect(runSearch('binary', sorted, target).index).toBe(-1);
    }
  });

  it('uses at most floor(log2 n) + 1 checks', () => {
    for (let n = 1; n <= 200; n++) {
      const array = Array.from({ length: n }, (_, i) => i * 2);
      const bound = Math.floor(Math.log2(n)) + 1;
      for (const target of [0, (n - 1) * 2, n, -1, n * 2 + 1]) {
        expect(runSearch('binary', array, target).steps).toBeLessThanOrEqual(bound);
      }
    }
  });

  it('keeps the checked index within the current range', () => {
    for (const frame of binarySearch(sorted, 4)) {
      if (frame.type === 'check') {
        expect(frame.index).toBeGreaterThanOrEqual(frame.low);
        expect(frame.index).toBeLessThanOrEqual(frame.high);
      }
    }
  });

  it('finds a matching index among duplicates', () => {
    const array = [1, 2, 2, 2, 3];
    expect(array[runSearch('binary', array, 2).index]).toBe(2);
  });

  it('handles empty and singleton arrays', () => {
    expect(runSearch('binary', [], 5)).toEqual({ index: -1, steps: 0 });
    expect(runSearch('binary', [5], 5)).toEqual({ index: 0, steps: 1 });
    expect(runSearch('binary', [5], 6)).toEqual({ index: -1, steps: 1 });
  });
});

describe('applySearchFrame', () => {
  it('tracks steps and final status', () => {
    const array = [1, 2, 3];
    const view = Array.from(binarySearch(array, 3)).reduce(
      (v, f) => applySearchFrame(v, f, array, 3),
      initialSearchView(array.length),
    );
    expect(view.status).toBe('found');
    expect(view.foundIndex).toBe(2);
    expect(view.steps).toBe(2);
  });

  it('reports not-found', () => {
    const array = [1, 2, 3];
    const view = Array.from(linearSearch(array, 9)).reduce(
      (v, f) => applySearchFrame(v, f, array, 9),
      initialSearchView(array.length),
    );
    expect(view.status).toBe('not-found');
    expect(view.message).toMatch(/not in the array/);
  });
});
