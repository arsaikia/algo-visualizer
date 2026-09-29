export interface Point {
  row: number;
  col: number;
}

export interface GridSpec {
  rows: number;
  cols: number;
  /** Flat, row-major wall flags (`row * cols + col`). */
  walls: readonly boolean[];
  start: Point;
  end: Point;
}

export interface PathResult {
  /** Cells in the order the algorithm finalised/expanded them, starting with `start`. */
  visited: Point[];
  /** Cells from start to end inclusive; empty when the end is unreachable. */
  path: Point[];
  found: boolean;
}

export type PathAlgorithmId = 'bfs' | 'dfs' | 'dijkstra' | 'astar';

export interface PathAlgorithmInfo {
  id: PathAlgorithmId;
  name: string;
  run: (grid: GridSpec) => PathResult;
  guaranteesShortest: boolean;
  description: string;
  complexity: string;
}
