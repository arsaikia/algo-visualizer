import { astar } from './astar';
import { bfs } from './bfs';
import { dfs } from './dfs';
import { dijkstra } from './dijkstra';
import type { PathAlgorithmId, PathAlgorithmInfo } from './types';

export * from './types';
export * from './grid';
export { astar, bfs, dfs, dijkstra };

export const PATH_ALGORITHMS: Record<PathAlgorithmId, PathAlgorithmInfo> = {
  bfs: {
    id: 'bfs',
    name: 'Breadth-First Search',
    run: bfs,
    guaranteesShortest: true,
    description:
      'Explores the grid in rings of increasing distance using a queue. Guarantees the shortest path on an unweighted grid.',
    complexity: 'O(V + E)',
  },
  dfs: {
    id: 'dfs',
    name: 'Depth-First Search',
    run: dfs,
    guaranteesShortest: false,
    description:
      'Dives as deep as possible along one direction before backtracking, using a stack. Finds a path, but usually not the shortest.',
    complexity: 'O(V + E)',
  },
  dijkstra: {
    id: 'dijkstra',
    name: "Dijkstra's Algorithm",
    run: dijkstra,
    guaranteesShortest: true,
    description:
      'Always expands the closest unsettled cell via a priority queue. Guarantees the shortest path; on a uniform grid it expands like BFS.',
    complexity: 'O((V + E) log V)',
  },
  astar: {
    id: 'astar',
    name: 'A* Search',
    run: astar,
    guaranteesShortest: true,
    description:
      'Dijkstra guided by the Manhattan-distance heuristic to the target (f = g + h). Guarantees the shortest path while usually visiting far fewer cells.',
    complexity: 'O((V + E) log V)',
  },
};

export const PATH_ALGORITHM_LIST = Object.values(PATH_ALGORITHMS);
