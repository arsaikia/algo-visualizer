export type SortFrame =
  | { type: 'compare'; indices: [number, number] }
  | { type: 'swap'; indices: [number, number] }
  | { type: 'overwrite'; index: number; value: number }
  | { type: 'sorted'; indices: number[] };

export type SortGenerator = (input: readonly number[]) => Generator<SortFrame, void, undefined>;

export type SortAlgorithmId = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick' | 'heap';

export interface SortAlgorithmInfo {
  id: SortAlgorithmId;
  name: string;
  generator: SortGenerator;
  description: string;
  complexity: { best: string; average: string; worst: string; space: string };
  stable: boolean;
}
