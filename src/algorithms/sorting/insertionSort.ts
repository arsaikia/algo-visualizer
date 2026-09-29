import type { SortFrame } from './types';
import { compare, range, sorted, swap, swapInPlace, valueAt } from './utils';

export function* insertionSort(input: readonly number[]): Generator<SortFrame, void, undefined> {
  const a = [...input];
  for (let i = 1; i < a.length; i++) {
    for (let j = i; j > 0; j--) {
      yield compare(j - 1, j);
      if (valueAt(a, j - 1) <= valueAt(a, j)) break;
      swapInPlace(a, j - 1, j);
      yield swap(j - 1, j);
    }
  }
  if (a.length > 0) yield sorted(...range(0, a.length));
}
