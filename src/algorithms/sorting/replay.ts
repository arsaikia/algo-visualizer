import type { SortFrame, SortGenerator } from './types';
import { valueAt } from './utils';

export interface SortView {
  array: number[];
  comparing: readonly number[];
  writing: readonly number[];
  sorted: readonly boolean[];
  comparisons: number;
  writes: number;
  lastFrame: SortFrame | null;
}

export function initialSortView(input: readonly number[]): SortView {
  return {
    array: [...input],
    comparing: [],
    writing: [],
    sorted: input.map(() => false),
    comparisons: 0,
    writes: 0,
    lastFrame: null,
  };
}

export function applySortFrame(view: SortView, frame: SortFrame): SortView {
  switch (frame.type) {
    case 'compare':
      return {
        ...view,
        comparing: frame.indices,
        writing: [],
        comparisons: view.comparisons + 1,
        lastFrame: frame,
      };
    case 'swap': {
      const [i, j] = frame.indices;
      const array = [...view.array];
      array[i] = valueAt(view.array, j);
      array[j] = valueAt(view.array, i);
      return {
        ...view,
        array,
        comparing: [],
        writing: frame.indices,
        writes: view.writes + 2,
        lastFrame: frame,
      };
    }
    case 'overwrite': {
      const array = [...view.array];
      array[frame.index] = frame.value;
      return {
        ...view,
        array,
        comparing: [],
        writing: [frame.index],
        writes: view.writes + 1,
        lastFrame: frame,
      };
    }
    case 'sorted': {
      const sortedFlags = [...view.sorted];
      for (const i of frame.indices) sortedFlags[i] = true;
      return { ...view, sorted: sortedFlags, comparing: [], writing: [], lastFrame: frame };
    }
  }
}

export function collectFrames(generator: SortGenerator, input: readonly number[]): SortFrame[] {
  return Array.from(generator(input));
}

export function replaySort(generator: SortGenerator, input: readonly number[]): SortView {
  return collectFrames(generator, input).reduce(applySortFrame, initialSortView(input));
}
