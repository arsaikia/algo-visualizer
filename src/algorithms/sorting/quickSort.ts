import type { SortFrame } from './types';
import { compare, sorted, swap, swapInPlace, valueAt } from './utils';

function* partition(a: number[], lo: number, hi: number): Generator<SortFrame, number, undefined> {
  // Middle element as pivot avoids quadratic behaviour on already-sorted input.
  const mid = Math.floor((lo + hi) / 2);
  if (mid !== hi) {
    swapInPlace(a, mid, hi);
    yield swap(mid, hi);
  }
  const pivot = valueAt(a, hi);
  let store = lo;
  for (let i = lo; i < hi; i++) {
    yield compare(i, hi);
    if (valueAt(a, i) < pivot) {
      if (i !== store) {
        swapInPlace(a, i, store);
        yield swap(i, store);
      }
      store++;
    }
  }
  if (store !== hi) {
    swapInPlace(a, store, hi);
    yield swap(store, hi);
  }
  return store;
}

function* sortRange(a: number[], lo: number, hi: number): Generator<SortFrame, void, undefined> {
  if (lo > hi) return;
  if (lo === hi) {
    yield sorted(lo);
    return;
  }
  const p = yield* partition(a, lo, hi);
  yield sorted(p);
  yield* sortRange(a, lo, p - 1);
  yield* sortRange(a, p + 1, hi);
}

export function* quickSort(input: readonly number[]): Generator<SortFrame, void, undefined> {
  const a = [...input];
  yield* sortRange(a, 0, a.length - 1);
}
