import { manhattan } from './grid';
import type { GridSpec, PathResult } from './types';
import { weightedSearch } from './weightedSearch';

export function astar(grid: GridSpec): PathResult {
  return weightedSearch(grid, (p) => manhattan(p, grid.end));
}
