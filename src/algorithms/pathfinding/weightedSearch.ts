import { fromIndex, neighbors, reconstructPath, toIndex, validateGrid } from './grid';
import { MinHeap } from './minHeap';
import type { GridSpec, PathResult, Point } from './types';

interface QueueEntry {
  index: number;
  g: number;
  h: number;
  order: number;
}

/**
 * Best-first search over a uniform-cost grid. With `heuristic = 0` this is Dijkstra;
 * with an admissible, consistent heuristic it is A*.
 */
export function weightedSearch(grid: GridSpec, heuristic: (p: Point) => number): PathResult {
  const invalid = validateGrid(grid);
  if (invalid) return invalid;
  const { cols } = grid;
  const startIndex = toIndex(grid.start, cols);
  const endIndex = toIndex(grid.end, cols);
  const dist = new Map<number, number>([[startIndex, 0]]);
  const previous = new Map<number, number>();
  const closed = new Set<number>();
  const visited: Point[] = [];
  let order = 0;
  const open = new MinHeap<QueueEntry>(
    (a, b) => a.g + a.h - (b.g + b.h) || a.h - b.h || a.order - b.order,
  );
  open.push({ index: startIndex, g: 0, h: heuristic(grid.start), order: order++ });

  while (open.size > 0) {
    const current = open.pop() as QueueEntry;
    if (closed.has(current.index)) continue;
    closed.add(current.index);
    const point = fromIndex(current.index, cols);
    visited.push(point);
    if (current.index === endIndex) {
      return { visited, path: reconstructPath(previous, endIndex, cols), found: true };
    }
    for (const next of neighbors(grid, point)) {
      const ni = toIndex(next, cols);
      if (closed.has(ni)) continue;
      const g = current.g + 1;
      if (g < (dist.get(ni) ?? Infinity)) {
        dist.set(ni, g);
        previous.set(ni, current.index);
        open.push({ index: ni, g, h: heuristic(next), order: order++ });
      }
    }
  }
  return { visited, path: [], found: false };
}
