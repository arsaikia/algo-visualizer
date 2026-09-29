import { describe, expect, it } from 'vitest';
import {
  PATH_ALGORITHM_LIST,
  createWalls,
  isWall,
  manhattan,
  samePoint,
  toIndex,
  type GridSpec,
  type Point,
} from '.';
import { MinHeap } from './minHeap';

function makeGrid(
  rows: number,
  cols: number,
  start: Point,
  end: Point,
  walls: Point[] = [],
): GridSpec {
  const flags = createWalls(rows, cols);
  for (const w of walls) flags[toIndex(w, cols)] = true;
  return { rows, cols, walls: flags, start, end };
}

/** Independent reference: shortest distance via plain BFS over a distance matrix. */
function referenceDistance(grid: GridSpec): number {
  const dist = new Map<number, number>([[toIndex(grid.start, grid.cols), 0]]);
  const queue: Point[] = [grid.start];
  while (queue.length) {
    const p = queue.shift() as Point;
    const d = dist.get(toIndex(p, grid.cols)) as number;
    if (samePoint(p, grid.end)) return d;
    for (const [dr, dc] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const n = { row: p.row + dr, col: p.col + dc };
      if (n.row < 0 || n.col < 0 || n.row >= grid.rows || n.col >= grid.cols) continue;
      if (isWall(grid, n) || dist.has(toIndex(n, grid.cols))) continue;
      dist.set(toIndex(n, grid.cols), d + 1);
      queue.push(n);
    }
  }
  return -1;
}

function expectValidPath(grid: GridSpec, path: Point[]): void {
  expect(samePoint(path[0]!, grid.start)).toBe(true);
  expect(samePoint(path.at(-1)!, grid.end)).toBe(true);
  const seen = new Set<number>();
  path.forEach((p, i) => {
    expect(isWall(grid, p)).toBe(false);
    expect(seen.has(toIndex(p, grid.cols))).toBe(false);
    seen.add(toIndex(p, grid.cols));
    if (i > 0) expect(manhattan(p, path[i - 1]!)).toBe(1);
  });
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function randomGrid(seed: number, rows = 12, cols = 16, density = 0.28): GridSpec {
  const rand = seededRandom(seed);
  const start = { row: Math.floor(rand() * rows), col: Math.floor(rand() * cols) };
  let end = { row: Math.floor(rand() * rows), col: Math.floor(rand() * cols) };
  if (samePoint(start, end)) end = { row: (start.row + 1) % rows, col: start.col };
  const walls: Point[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const p = { row: r, col: c };
      if (!samePoint(p, start) && !samePoint(p, end) && rand() < density) walls.push(p);
    }
  }
  return makeGrid(rows, cols, start, end, walls);
}

describe.each(PATH_ALGORITHM_LIST)('$name', (algo) => {
  it('finds a straight path on an open grid', () => {
    const grid = makeGrid(5, 5, { row: 2, col: 0 }, { row: 2, col: 4 });
    const result = algo.run(grid);
    expect(result.found).toBe(true);
    expectValidPath(grid, result.path);
    expect(samePoint(result.visited[0]!, grid.start)).toBe(true);
  });

  it('routes around walls', () => {
    const walls = [0, 1, 2, 3].map((row) => ({ row, col: 2 }));
    const grid = makeGrid(5, 5, { row: 0, col: 0 }, { row: 0, col: 4 }, walls);
    const result = algo.run(grid);
    expect(result.found).toBe(true);
    expectValidPath(grid, result.path);
    if (algo.guaranteesShortest) expect(result.path).toHaveLength(13);
  });

  it('handles an unreachable target gracefully', () => {
    const walls = [0, 1, 2, 3, 4].map((row) => ({ row, col: 2 }));
    const grid = makeGrid(5, 5, { row: 0, col: 0 }, { row: 4, col: 4 }, walls);
    const result = algo.run(grid);
    expect(result.found).toBe(false);
    expect(result.path).toEqual([]);
    expect(result.visited).toHaveLength(10);
  });

  it('returns a single-cell path when start equals end', () => {
    const grid = makeGrid(3, 3, { row: 1, col: 1 }, { row: 1, col: 1 });
    const result = algo.run(grid);
    expect(result.found).toBe(true);
    expect(result.path).toEqual([{ row: 1, col: 1 }]);
  });

  it('never visits walls or a cell twice', () => {
    const grid = randomGrid(7);
    const result = algo.run(grid);
    const keys = result.visited.map((p) => toIndex(p, grid.cols));
    expect(new Set(keys).size).toBe(keys.length);
    expect(result.visited.some((p) => isWall(grid, p))).toBe(false);
  });

  it('agrees with the reference on reachability and produces valid paths', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const grid = randomGrid(seed);
      const expected = referenceDistance(grid);
      const result = algo.run(grid);
      expect(result.found).toBe(expected >= 0);
      if (result.found) {
        expectValidPath(grid, result.path);
        if (algo.guaranteesShortest) expect(result.path.length - 1).toBe(expected);
        else expect(result.path.length - 1).toBeGreaterThanOrEqual(expected);
      }
    }
  });
});

describe('A* vs Dijkstra', () => {
  it('A* expands no more cells than Dijkstra on an open grid', () => {
    const grid = makeGrid(20, 30, { row: 10, col: 2 }, { row: 10, col: 27 });
    const d = PATH_ALGORITHM_LIST.find((a) => a.id === 'dijkstra')!.run(grid);
    const a = PATH_ALGORITHM_LIST.find((a) => a.id === 'astar')!.run(grid);
    expect(a.path).toHaveLength(d.path.length);
    expect(a.visited.length).toBeLessThan(d.visited.length);
  });
});

describe('MinHeap', () => {
  it('pops in ascending order', () => {
    const heap = new MinHeap<number>((a, b) => a - b);
    const values = [5, 1, 9, 3, 3, 7, 0, 2];
    values.forEach((v) => heap.push(v));
    const out: number[] = [];
    while (heap.size) out.push(heap.pop()!);
    expect(out).toEqual([...values].sort((a, b) => a - b));
    expect(heap.pop()).toBeUndefined();
  });
});
