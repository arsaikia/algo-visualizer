import type { SortFrame } from './types';
import { compare, sorted, swap, swapInPlace, valueAt } from './utils';

function* siftDown(a: number[], root: number, size: number): Generator<SortFrame, void, undefined> {
  let i = root;
  for (;;) {
    const left = 2 * i + 1;
    const right = left + 1;
    let largest = i;
    if (left < size) {
      yield compare(left, largest);
      if (valueAt(a, left) > valueAt(a, largest)) largest = left;
    }
    if (right < size) {
      yield compare(right, largest);
      if (valueAt(a, right) > valueAt(a, largest)) largest = right;
    }
    if (largest === i) return;
    swapInPlace(a, i, largest);
    yield swap(i, largest);
    i = largest;
  }
}

export function* heapSort(input: readonly number[]): Generator<SortFrame, void, undefined> {
  const a = [...input];
  const n = a.length;
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    yield* siftDown(a, i, n);
  }
  for (let end = n - 1; end > 0; end--) {
    swapInPlace(a, 0, end);
    yield swap(0, end);
    yield sorted(end);
    yield* siftDown(a, 0, end);
  }
  if (n > 0) yield sorted(0);
}
