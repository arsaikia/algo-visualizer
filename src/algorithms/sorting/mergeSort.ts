import type { SortFrame } from './types';
import { compare, overwrite, range, sorted, valueAt } from './utils';

function* merge(
  a: number[],
  lo: number,
  mid: number,
  hi: number,
): Generator<SortFrame, void, undefined> {
  const left = a.slice(lo, mid + 1);
  const right = a.slice(mid + 1, hi + 1);
  let i = 0;
  let j = 0;
  let k = lo;
  while (i < left.length && j < right.length) {
    yield compare(lo + i, mid + 1 + j);
    const l = valueAt(left, i);
    const r = valueAt(right, j);
    if (l <= r) {
      a[k] = l;
      i++;
    } else {
      a[k] = r;
      j++;
    }
    yield overwrite(k, valueAt(a, k));
    k++;
  }
  while (i < left.length) {
    a[k] = valueAt(left, i++);
    yield overwrite(k, valueAt(a, k));
    k++;
  }
  while (j < right.length) {
    a[k] = valueAt(right, j++);
    yield overwrite(k, valueAt(a, k));
    k++;
  }
}

function* sortRange(a: number[], lo: number, hi: number): Generator<SortFrame, void, undefined> {
  if (lo >= hi) return;
  const mid = Math.floor((lo + hi) / 2);
  yield* sortRange(a, lo, mid);
  yield* sortRange(a, mid + 1, hi);
  yield* merge(a, lo, mid, hi);
}

export function* mergeSort(input: readonly number[]): Generator<SortFrame, void, undefined> {
  const a = [...input];
  yield* sortRange(a, 0, a.length - 1);
  if (a.length > 0) yield sorted(...range(0, a.length));
}
