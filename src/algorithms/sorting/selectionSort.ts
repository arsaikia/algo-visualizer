import type { SortFrame } from './types';
import { compare, sorted, swap, swapInPlace, valueAt } from './utils';

export function* selectionSort(input: readonly number[]): Generator<SortFrame, void, undefined> {
  const a = [...input];
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      yield compare(min, j);
      if (valueAt(a, j) < valueAt(a, min)) min = j;
    }
    if (min !== i) {
      swapInPlace(a, i, min);
      yield swap(i, min);
    }
    yield sorted(i);
  }
  if (n > 0) yield sorted(n - 1);
}
