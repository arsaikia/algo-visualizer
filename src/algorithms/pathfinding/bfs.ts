import { fromIndex, neighbors, reconstructPath, toIndex, validateGrid } from './grid';
import type { GridSpec, PathResult, Point } from './types';

export function bfs(grid: GridSpec): PathResult {
  const invalid = validateGrid(grid);
  if (invalid) return invalid;
  const { cols } = grid;
  const startIndex = toIndex(grid.start, cols);
  const endIndex = toIndex(grid.end, cols);
  const previous = new Map<number, number>();
  const seen = new Set<number>([startIndex]);
  const queue: number[] = [startIndex];
  const visited: Point[] = [];

  for (let head = 0; head < queue.length; head++) {
    const current = queue[head] as number;
    visited.push(fromIndex(current, cols));
    if (current === endIndex) {
      return { visited, path: reconstructPath(previous, endIndex, cols), found: true };
    }
    for (const next of neighbors(grid, fromIndex(current, cols))) {
      const ni = toIndex(next, cols);
      if (seen.has(ni)) continue;
      seen.add(ni);
      previous.set(ni, current);
      queue.push(ni);
    }
  }
  return { visited, path: [], found: false };
}
