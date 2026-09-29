export type SearchFrame =
  | { type: 'check'; index: number; low: number; high: number }
  | { type: 'narrow'; low: number; high: number; reason: 'greater' | 'smaller' }
  | { type: 'found'; index: number }
  | { type: 'not-found' };

export type SearchAlgorithmId = 'linear' | 'binary';

export interface SearchAlgorithmInfo {
  id: SearchAlgorithmId;
  name: string;
  requiresSorted: boolean;
  generator: (array: readonly number[], target: number) => Generator<SearchFrame, void, undefined>;
  description: string;
  complexity: { best: string; average: string; worst: string; space: string };
}

function at(array: readonly number[], index: number): number {
  const value = array[index];
  if (value === undefined) throw new RangeError(`Index ${index} out of bounds`);
  return value;
}

export function* linearSearch(
  array: readonly number[],
  target: number,
): Generator<SearchFrame, void, undefined> {
  const high = array.length - 1;
  for (let i = 0; i < array.length; i++) {
    yield { type: 'check', index: i, low: i, high };
    if (at(array, i) === target) {
      yield { type: 'found', index: i };
      return;
    }
  }
  yield { type: 'not-found' };
}

/** Requires `array` to be sorted in ascending order. */
export function* binarySearch(
  array: readonly number[],
  target: number,
): Generator<SearchFrame, void, undefined> {
  let low = 0;
  let high = array.length - 1;
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    yield { type: 'check', index: mid, low, high };
    const value = at(array, mid);
    if (value === target) {
      yield { type: 'found', index: mid };
      return;
    }
    if (value < target) {
      low = mid + 1;
      yield { type: 'narrow', low, high, reason: 'greater' };
    } else {
      high = mid - 1;
      yield { type: 'narrow', low, high, reason: 'smaller' };
    }
  }
  yield { type: 'not-found' };
}

export const SEARCH_ALGORITHMS: Record<SearchAlgorithmId, SearchAlgorithmInfo> = {
  linear: {
    id: 'linear',
    name: 'Linear Search',
    requiresSorted: false,
    generator: linearSearch,
    description:
      'Checks every element from left to right until it finds the target or runs out of elements. Works on any array.',
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' },
  },
  binary: {
    id: 'binary',
    name: 'Binary Search',
    requiresSorted: true,
    generator: binarySearch,
    description:
      'Compares the target with the middle of the remaining range and discards the half that cannot contain it. Only correct on a sorted array.',
    complexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)' },
  },
};

export const SEARCH_ALGORITHM_LIST = Object.values(SEARCH_ALGORITHMS);

export type SearchStatus = 'idle' | 'searching' | 'found' | 'not-found';

export interface SearchView {
  current: number | null;
  low: number;
  high: number;
  steps: number;
  status: SearchStatus;
  foundIndex: number | null;
  message: string;
}

export function initialSearchView(length: number): SearchView {
  return {
    current: null,
    low: 0,
    high: length - 1,
    steps: 0,
    status: 'idle',
    foundIndex: null,
    message: 'Press Play to start searching.',
  };
}

export function applySearchFrame(
  view: SearchView,
  frame: SearchFrame,
  array: readonly number[],
  target: number,
): SearchView {
  switch (frame.type) {
    case 'check':
      return {
        ...view,
        current: frame.index,
        low: frame.low,
        high: frame.high,
        steps: view.steps + 1,
        status: 'searching',
        message: `Step ${view.steps + 1}: is array[${frame.index}] = ${at(array, frame.index)} equal to ${target}?`,
      };
    case 'narrow':
      return {
        ...view,
        low: frame.low,
        high: frame.high,
        message:
          frame.reason === 'greater'
            ? `${target} is greater — discard the left half; search [${frame.low}, ${frame.high}].`
            : `${target} is smaller — discard the right half; search [${frame.low}, ${frame.high}].`,
      };
    case 'found':
      return {
        ...view,
        current: frame.index,
        status: 'found',
        foundIndex: frame.index,
        message: `Found ${target} at index ${frame.index} in ${view.steps} step${view.steps === 1 ? '' : 's'}.`,
      };
    case 'not-found':
      return {
        ...view,
        current: null,
        status: 'not-found',
        message: `${target} is not in the array (${view.steps} step${view.steps === 1 ? '' : 's'}).`,
      };
  }
}

export function runSearch(
  id: SearchAlgorithmId,
  array: readonly number[],
  target: number,
): { index: number; steps: number } {
  let steps = 0;
  for (const frame of SEARCH_ALGORITHMS[id].generator(array, target)) {
    if (frame.type === 'check') steps++;
    if (frame.type === 'found') return { index: frame.index, steps };
  }
  return { index: -1, steps };
}
