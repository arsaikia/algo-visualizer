import type { GridSpec, PathResult } from './types';
import { weightedSearch } from './weightedSearch';

export function dijkstra(grid: GridSpec): PathResult {
  return weightedSearch(grid, () => 0);
}
