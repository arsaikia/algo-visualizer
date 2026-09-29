import type { GridSpec, PathResult, Point } from './types';

const DIRECTIONS: readonly Point[] = [
  { row: -1, col: 0 },
  { row: 0, col: 1 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
];

export const toIndex = (p: Point, cols: number): number => p.row * cols + p.col;
export const fromIndex = (index: number, cols: number): Point => ({
  row: Math.floor(index / cols),
  col: index % cols,
});
export const samePoint = (a: Point, b: Point): boolean => a.row === b.row && a.col === b.col;
export const manhattan = (a: Point, b: Point): number =>
  Math.abs(a.row - b.row) + Math.abs(a.col - b.col);

export function inBounds(grid: GridSpec, p: Point): boolean {
  return p.row >= 0 && p.row < grid.rows && p.col >= 0 && p.col < grid.cols;
}

export function isWall(grid: GridSpec, p: Point): boolean {
  return grid.walls[toIndex(p, grid.cols)] === true;
}

/** Walkable 4-directional neighbours in a fixed up/right/down/left order. */
export function neighbors(grid: GridSpec, p: Point): Point[] {
  const out: Point[] = [];
  for (const d of DIRECTIONS) {
    const next = { row: p.row + d.row, col: p.col + d.col };
    if (inBounds(grid, next) && !isWall(grid, next)) out.push(next);
  }
  return out;
}

export function reconstructPath(
  previous: ReadonlyMap<number, number>,
  endIndex: number,
  cols: number,
): Point[] {
  const path: Point[] = [];
  let cursor: number | undefined = endIndex;
  while (cursor !== undefined) {
    path.push(fromIndex(cursor, cols));
    cursor = previous.get(cursor);
  }
  return path.reverse();
}

export function validateGrid(grid: GridSpec): PathResult | null {
  if (!inBounds(grid, grid.start) || !inBounds(grid, grid.end)) {
    return { visited: [], path: [], found: false };
  }
  if (isWall(grid, grid.start) || isWall(grid, grid.end)) {
    return { visited: [], path: [], found: false };
  }
  return null;
}

export function createWalls(rows: number, cols: number): boolean[] {
  return new Array<boolean>(rows * cols).fill(false);
}
