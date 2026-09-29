# Algo Visualizer

Interactive, step-by-step visualizations of classic **sorting**, **searching** and **pathfinding**
algorithms, built with Vite, React 18, strict TypeScript and Tailwind CSS.

**Live demo:** https://arsaikia.github.io/algo-visualizer/

## Routes

| Route          | Page                                          |
| -------------- | --------------------------------------------- |
| `/`            | Landing page with a card for each category    |
| `/sorting`     | Bar-chart sorting visualizer                  |
| `/searching`   | Linear and Binary Search on an array of cells |
| `/pathfinding` | Editable grid for graph search algorithms     |

Every page shares a responsive navigation bar (with a mobile menu) and a light/dark theme toggle.
The theme defaults to your OS `prefers-color-scheme` and is saved in `localStorage` after you change it.

## Algorithms

### Sorting (`src/algorithms/sorting`)

| Algorithm      | Best       | Average    | Worst      | Space    | Stable |
| -------------- | ---------- | ---------- | ---------- | -------- | ------ |
| Bubble Sort    | O(n)       | O(n²)      | O(n²)      | O(1)     | Yes    |
| Selection Sort | O(n²)      | O(n²)      | O(n²)      | O(1)     | No     |
| Insertion Sort | O(n)       | O(n²)      | O(n²)      | O(1)     | Yes    |
| Merge Sort     | O(n log n) | O(n log n) | O(n log n) | O(n)     | Yes    |
| Quick Sort     | O(n log n) | O(n log n) | O(n²)      | O(log n) | No     |
| Heap Sort      | O(n log n) | O(n log n) | O(n log n) | O(1)     | No     |

Each algorithm is a pure TypeScript generator that copies its input and yields typed frames:
`compare`, `swap`, `overwrite` (merge sort writes) and `sorted` markers. The UI replays those frames
with `requestAnimationFrame`, showing comparisons, writes, the step counter and a live status line.

### Searching (`src/algorithms/searching`)

- **Linear Search** — O(n); works on any array.
- **Binary Search** — O(log n); **requires a sorted array**. The page sorts the array before running
  it and says so in the UI. The `low`/`mid`/`high` pointers and the remaining range are shown as the
  search runs.

### Pathfinding (`src/algorithms/pathfinding`)

| Algorithm | Data structure           | Shortest path? |
| --------- | ------------------------ | -------------- |
| BFS       | Queue                    | Yes            |
| DFS       | Stack                    | No             |
| Dijkstra  | Binary min-heap          | Yes            |
| A\*       | Min-heap + Manhattan `h` | Yes            |

Each function takes an immutable grid description (`rows`, `cols`, wall flags, `start`, `end`) and
returns `{ visited, path, found }`. An unreachable target returns `found: false` with an empty path,
and the UI reports it clearly.

On the grid you can click or drag to add or remove walls, drag the start and target cells, and use
the Visualize, Pause/Resume, Skip to end, Clear path, Clear walls, Random walls and Clear grid
buttons. A **Grid size** slider changes the number of columns (rows follow the screen's aspect
ratio) and keeps existing walls that still fit. After a run finishes, dragging the start, target or
walls recomputes the result instantly. Walls use a seamless SVG brick texture that joins across
adjacent cells in both themes. Grid editing works with mouse, touch and pen through pointer events.

## Local development

Requires Node.js 18+.

```bash
npm install
npm run dev          # start the dev server at http://localhost:5173/algo-visualizer/
npm run build        # type-check and build to dist/ (also writes dist/404.html for SPA routing)
npm run preview      # serve the production build locally
npm test             # run the Vitest + React Testing Library suite once
npm run test:watch   # run tests in watch mode
npm run lint         # ESLint (fails on any warning)
npm run format       # Prettier write
npm run format:check # Prettier check
```

## Project structure

```
src/
  algorithms/   pure, framework-free algorithm code + unit tests
  hooks/        useFramePlayer (rAF playback), useTheme, useMediaQuery
  components/   Layout, NavBar, ThemeToggle, shared controls
  pages/        Landing, Sorting, Searching, Pathfinding, NotFound
  lib/          random helpers
```

## Deploying to GitHub Pages

The app is configured for https://arsaikia.github.io/algo-visualizer/:

- `vite.config.ts` sets `base: '/algo-visualizer/'`, and the router uses the same base path.
- `npm run build` copies `index.html` to `404.html`, so deep links such as `/algo-visualizer/sorting`
  load the app on GitHub Pages.

To deploy:

```bash
npm run deploy   # runs the build (predeploy), then publishes dist/ to the gh-pages branch
```

Then, in the repository settings, go to **Settings → Pages** and set the source to the `gh-pages`
branch (root).
