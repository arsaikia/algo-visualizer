import { fromIndex, neighbors, reconstructPath, toIndex, validateGrid } from './grid';
import type { GridSpec, PathResult, Point } from './types';

export function dfs(grid: GridSpec): PathResult {
  const invalid = validateGrid(grid);
  if (invalid) return invalid;
  const { cols } = grid;
  const startIndex = toIndex(grid.start, cols);
  const endIndex = toIndex(grid.end, cols);
  const previous = new Map<number, number>();
  const done = new Set<number>();
  const stack: Array<{ index: number; parent: number | null }> = [
    { index: startIndex, parent: null },
  ];
  const visited: Point[] = [];

  while (stack.length > 0) {
    const { index, parent } = stack.pop() as { index: number; parent: number | null };
    if (done.has(index)) continue;
    done.add(index);
    if (parent !== null) previous.set(index, parent);
    visited.push(fromIndex(index, cols));
    if (index === endIndex) {
      return { visited, path: reconstructPath(previous, endIndex, cols), found: true };
    }
    // Push in reverse so the first direction (up) is explored first.
    const next = neighbors(grid, fromIndex(index, cols)).reverse();
    for (const n of next) {
      const ni = toIndex(n, cols);
      if (!done.has(ni)) stack.push({ index: ni, parent: index });
    }
  }
  return { visited, path: [], found: false };
}
