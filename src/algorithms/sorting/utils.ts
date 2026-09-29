import type { SortFrame } from './types';

export function valueAt(array: readonly number[], index: number): number {
  const value = array[index];
  if (value === undefined) {
    throw new RangeError(`Index ${index} out of bounds for length ${array.length}`);
  }
  return value;
}

export function swapInPlace(array: number[], i: number, j: number): void {
  const tmp = valueAt(array, i);
  array[i] = valueAt(array, j);
  array[j] = tmp;
}

export function range(start: number, end: number): number[] {
  const out: number[] = [];
  for (let i = start; i < end; i++) out.push(i);
  return out;
}

export const compare = (i: number, j: number): SortFrame => ({ type: 'compare', indices: [i, j] });
export const swap = (i: number, j: number): SortFrame => ({ type: 'swap', indices: [i, j] });
export const overwrite = (index: number, value: number): SortFrame => ({
  type: 'overwrite',
  index,
  value,
});
export const sorted = (...indices: number[]): SortFrame => ({ type: 'sorted', indices });
