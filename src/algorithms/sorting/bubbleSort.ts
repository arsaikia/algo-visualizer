import type { SortFrame } from './types';
import { compare, range, sorted, swap, swapInPlace, valueAt } from './utils';

export function* bubbleSort(input: readonly number[]): Generator<SortFrame, void, undefined> {
  const a = [...input];
  const n = a.length;
  for (let end = n - 1; end > 0; end--) {
    let swapped = false;
    for (let i = 0; i < end; i++) {
      yield compare(i, i + 1);
      if (valueAt(a, i) > valueAt(a, i + 1)) {
        swapInPlace(a, i, i + 1);
        yield swap(i, i + 1);
        swapped = true;
      }
    }
    if (!swapped) {
      yield sorted(...range(0, end + 1));
      return;
    }
    yield sorted(end);
  }
  if (n > 0) yield sorted(0);
}
