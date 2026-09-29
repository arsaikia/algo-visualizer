import { bubbleSort } from './bubbleSort';
import { heapSort } from './heapSort';
import { insertionSort } from './insertionSort';
import { mergeSort } from './mergeSort';
import { quickSort } from './quickSort';
import { selectionSort } from './selectionSort';
import type { SortAlgorithmId, SortAlgorithmInfo } from './types';

export * from './types';
export * from './replay';
export { bubbleSort, heapSort, insertionSort, mergeSort, quickSort, selectionSort };

export const SORT_ALGORITHMS: Record<SortAlgorithmId, SortAlgorithmInfo> = {
  bubble: {
    id: 'bubble',
    name: 'Bubble Sort',
    generator: bubbleSort,
    description:
      'Repeatedly steps through the list, swapping adjacent out-of-order pairs. The largest remaining value "bubbles" to the end each pass; stops early when a pass makes no swaps.',
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    stable: true,
  },
  selection: {
    id: 'selection',
    name: 'Selection Sort',
    generator: selectionSort,
    description:
      'Finds the minimum of the unsorted suffix and swaps it into place, growing a sorted prefix one element at a time.',
    complexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    stable: false,
  },
  insertion: {
    id: 'insertion',
    name: 'Insertion Sort',
    generator: insertionSort,
    description:
      'Takes each element in turn and shifts it left past larger neighbours until it reaches its place in the sorted prefix.',
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    stable: true,
  },
  merge: {
    id: 'merge',
    name: 'Merge Sort',
    generator: mergeSort,
    description:
      'Divide and conquer: recursively sorts both halves, then merges them by repeatedly writing the smaller front element.',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
    stable: true,
  },
  quick: {
    id: 'quick',
    name: 'Quick Sort',
    generator: quickSort,
    description:
      'Picks the middle element as pivot, partitions smaller values to its left (Lomuto scheme), fixes the pivot in place, then recurses on each side.',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)' },
    stable: false,
  },
  heap: {
    id: 'heap',
    name: 'Heap Sort',
    generator: heapSort,
    description:
      'Builds a max-heap in place, then repeatedly swaps the root (maximum) to the end of the array and sifts the new root down.',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)' },
    stable: false,
  },
};

export const SORT_ALGORITHM_LIST = Object.values(SORT_ALGORITHMS);
