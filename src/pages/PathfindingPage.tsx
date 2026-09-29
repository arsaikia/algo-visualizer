import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  PATH_ALGORITHMS,
  PATH_ALGORITHM_LIST,
  createWalls,
  samePoint,
  toIndex,
  type GridSpec,
  type PathAlgorithmId,
  type PathResult,
  type Point,
} from '../algorithms/pathfinding';
import {
  Button,
  ComplexityTable,
  Legend,
  PageHeader,
  Panel,
  Select,
  Slider,
  StatusBar,
} from '../components/controls';
import { delayForSpeed, useFramePlayer } from '../hooks/useFramePlayer';
import { useMediaQuery } from '../hooks/useMediaQuery';

type CellKind = 'empty' | 'wall' | 'visited' | 'path';
type DragMode = 'start' | 'end' | 'wall-add' | 'wall-remove';
type Layout = 'desktop' | 'tablet' | 'mobile';

/** Column range and rows-per-column aspect for each breakpoint. */
const LAYOUTS: Record<Layout, { min: number; max: number; initial: number; aspect: number }> = {
  desktop: { min: 12, max: 60, initial: 36, aspect: 0.5 },
  tablet: { min: 10, max: 40, initial: 24, aspect: 0.65 },
  mobile: { min: 6, max: 22, initial: 13, aspect: 1.3 },
};

const rowsFor = (layout: Layout, cols: number) =>
  Math.max(5, Math.round(cols * LAYOUTS[layout].aspect));

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function createGrid(rows: number, cols: number): GridSpec {
  const midRow = Math.floor(rows / 2);
  return {
    rows,
    cols,
    walls: createWalls(rows, cols),
    start: { row: midRow, col: Math.floor(cols / 5) },
    end: { row: midRow, col: cols - 1 - Math.floor(cols / 5) },
  };
}

/** Resizes a grid, keeping walls that still fit and clamping start/end inside it. */
function resizeGrid(g: GridSpec, rows: number, cols: number): GridSpec {
  const walls = createWalls(rows, cols);
  for (let r = 0; r < Math.min(rows, g.rows); r++) {
    for (let c = 0; c < Math.min(cols, g.cols); c++) {
      walls[r * cols + c] = g.walls[r * g.cols + c] === true;
    }
  }
  const start = { row: clamp(g.start.row, 0, rows - 1), col: clamp(g.start.col, 0, cols - 1) };
  let end = { row: clamp(g.end.row, 0, rows - 1), col: clamp(g.end.col, 0, cols - 1) };
  if (samePoint(start, end)) {
    end = { row: end.row, col: end.col > 0 ? end.col - 1 : end.col + 1 };
  }
  walls[toIndex(start, cols)] = false;
  walls[toIndex(end, cols)] = false;
  return { rows, cols, walls, start, end };
}

const increment = (count: number) => count + 1;

function StartIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-full w-full">
      <circle cx="12" cy="12" r="9" className="fill-emerald-500" />
      <path d="M10 8l5 4-5 4z" className="fill-white" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-full w-full">
      <circle cx="12" cy="12" r="9" className="fill-rose-500" />
      <circle cx="12" cy="12" r="5.5" className="fill-white" />
      <circle cx="12" cy="12" r="2.5" className="fill-rose-500" />
    </svg>
  );
}

const GRID_LINE =
  'shadow-[inset_-1px_-1px_0_theme(colors.slate.200)] dark:shadow-[inset_-1px_-1px_0_theme(colors.slate.800)]';

const KIND_CLASS: Record<CellKind, string> = {
  empty: `${GRID_LINE} bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800`,
  wall: 'wall-texture',
  visited: `${GRID_LINE} bg-sky-300 animate-pop dark:bg-sky-700`,
  path: `${GRID_LINE} bg-amber-400 animate-pop`,
};

// Walls use a 2×2-cell texture tile; each cell shows its quadrant so adjacent walls join up.
const WALL_QUADRANT = ['bg-left-top', 'bg-right-top', 'bg-left-bottom', 'bg-right-bottom'];

const Cell = memo(function Cell({
  row,
  col,
  kind,
  isStart,
  isEnd,
}: {
  row: number;
  col: number;
  kind: CellKind;
  isStart: boolean;
  isEnd: boolean;
}) {
  const marker = isStart || isEnd;
  const markerBg =
    kind === 'visited'
      ? 'bg-sky-300 dark:bg-sky-700'
      : kind === 'path'
        ? 'bg-amber-400'
        : 'bg-white dark:bg-slate-900';
  const className = marker
    ? `${GRID_LINE} ${markerBg} cursor-grab p-[8%] active:cursor-grabbing`
    : kind === 'wall'
      ? `${KIND_CLASS.wall} ${WALL_QUADRANT[(row % 2) * 2 + (col % 2)]}`
      : KIND_CLASS[kind];
  return (
    <div
      data-row={row}
      data-col={col}
      data-kind={isStart ? 'start' : isEnd ? 'end' : kind}
      title={isStart ? 'Start — drag to move' : isEnd ? 'Target — drag to move' : undefined}
      className={`aspect-square transition-colors duration-200 ${className}`}
    >
      {isStart && <StartIcon />}
      {isEnd && <TargetIcon />}
    </div>
  );
});

function cellFromEvent(event: {
  clientX: number;
  clientY: number;
  target: EventTarget | null;
}): Point | null {
  const hit =
    typeof document.elementFromPoint === 'function'
      ? document.elementFromPoint(event.clientX, event.clientY)
      : null;
  const element = (hit ?? event.target) as HTMLElement | null;
  const cell = element?.closest?.('[data-row]') as HTMLElement | null;
  if (!cell) return null;
  return { row: Number(cell.dataset.row), col: Number(cell.dataset.col) };
}

const LEGEND = [
  { label: 'Start', className: 'rounded-full bg-emerald-500' },
  { label: 'Target', className: 'rounded-full bg-rose-500' },
  { label: 'Wall', className: 'wall-texture bg-left-top' },
  { label: 'Visited', className: 'bg-sky-300 dark:bg-sky-700' },
  { label: 'Shortest path', className: 'bg-amber-400' },
];

export function PathfindingPage() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 640px)');
  const layout: Layout = isDesktop ? 'desktop' : isTablet ? 'tablet' : 'mobile';
  const range = LAYOUTS[layout];

  const [layoutState, setLayoutState] = useState(layout);
  const [cols, setCols] = useState(range.initial);
  const [grid, setGrid] = useState<GridSpec>(() =>
    createGrid(rowsFor(layout, range.initial), range.initial),
  );
  const [algorithmId, setAlgorithmId] = useState<PathAlgorithmId>('astar');
  const [speed, setSpeed] = useState(5);
  const [result, setResult] = useState<PathResult | null>(null);
  // When true the current result is shown fully (live update while dragging start/target).
  const [instant, setInstant] = useState(false);

  if (layoutState !== layout) {
    setLayoutState(layout);
    setCols(range.initial);
    setGrid((g) => resizeGrid(g, rowsFor(layout, range.initial), range.initial));
    setResult(null);
  }

  const frames = useMemo(
    () =>
      result && !instant
        ? new Array<null>(result.visited.length + result.path.length).fill(null)
        : [],
    [result, instant],
  );
  const player = useFramePlayer(frames, 0, increment, delayForSpeed(speed), {
    autoPlay: result !== null && !instant,
  });
  const progress = instant && result ? result.visited.length + result.path.length : player.index;
  const done = result !== null && (instant || player.isDone);
  const running = player.isPlaying;
  const inProgress = result !== null && !done;
  const locked = running || inProgress;

  const kinds = useMemo(() => {
    const out: CellKind[] = grid.walls.map((w) => (w ? 'wall' : 'empty'));
    if (result) {
      const visitedCount = Math.min(progress, result.visited.length);
      for (let i = 0; i < visitedCount; i++)
        out[toIndex(result.visited[i] as Point, grid.cols)] = 'visited';
      const pathCount = Math.max(0, progress - result.visited.length);
      for (let i = 0; i < pathCount; i++) out[toIndex(result.path[i] as Point, grid.cols)] = 'path';
    }
    return out;
  }, [grid, result, progress]);

  const dragMode = useRef<DragMode | null>(null);
  const lastCell = useRef<number | null>(null);

  useEffect(() => {
    const stop = () => {
      dragMode.current = null;
      lastCell.current = null;
    };
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, []);

  const applyEdit = (mode: DragMode, p: Point) => {
    const index = toIndex(p, grid.cols);
    let next: GridSpec;
    if (mode === 'start' || mode === 'end') {
      const other = mode === 'start' ? grid.end : grid.start;
      if (samePoint(p, other) || grid.walls[index]) return;
      next = { ...grid, [mode]: p };
    } else {
      if (samePoint(p, grid.start) || samePoint(p, grid.end)) return;
      const wall = mode === 'wall-add';
      if (grid.walls[index] === wall) return;
      const walls = [...grid.walls];
      walls[index] = wall;
      next = { ...grid, walls };
    }
    setGrid(next);
    // After a finished run, keep the result live so moving markers or walls updates it instantly.
    if (done) {
      setResult(PATH_ALGORITHMS[algorithmId].run(next));
      setInstant(true);
    } else {
      setResult(null);
    }
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (locked) return;
    const p = cellFromEvent(event);
    if (!p) return;
    event.preventDefault();
    let mode: DragMode;
    if (samePoint(p, grid.start)) mode = 'start';
    else if (samePoint(p, grid.end)) mode = 'end';
    else mode = grid.walls[toIndex(p, grid.cols)] ? 'wall-remove' : 'wall-add';
    dragMode.current = mode;
    lastCell.current = toIndex(p, grid.cols);
    if (mode === 'wall-add' || mode === 'wall-remove') applyEdit(mode, p);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const mode = dragMode.current;
    if (!mode || locked) return;
    const p = cellFromEvent(event);
    if (!p) return;
    const index = toIndex(p, grid.cols);
    if (index === lastCell.current) return;
    lastCell.current = index;
    applyEdit(mode, p);
  };

  const reset = useCallback(() => {
    setResult(null);
    setInstant(false);
  }, []);

  const visualize = () => {
    setInstant(false);
    setResult(PATH_ALGORITHMS[algorithmId].run(grid));
  };
  const clearWalls = () => {
    setGrid((g) => ({ ...g, walls: createWalls(g.rows, g.cols) }));
    reset();
  };
  const clearGrid = () => {
    setGrid(createGrid(rowsFor(layout, cols), cols));
    reset();
  };
  const randomWalls = () => {
    setGrid((g) => ({
      ...g,
      walls: g.walls.map((_, i) => {
        const p = { row: Math.floor(i / g.cols), col: i % g.cols };
        return !samePoint(p, g.start) && !samePoint(p, g.end) && Math.random() < 0.28;
      }),
    }));
    reset();
  };
  const changeSize = (nextCols: number) => {
    setCols(nextCols);
    setGrid((g) => resizeGrid(g, rowsFor(layout, nextCols), nextCols));
    reset();
  };

  const algorithm = PATH_ALGORITHMS[algorithmId];
  const visitedShown = result ? Math.min(progress, result.visited.length) : 0;

  let message = 'Click or drag to draw walls. Drag the start (▶) or target (◎) to move them.';
  let tone: 'neutral' | 'success' | 'error' = 'neutral';
  if (result && !done) {
    message = `${running ? 'Exploring' : 'Paused'}… ${visitedShown} cells visited.`;
  } else if (result?.found) {
    message = `Path found! Length ${result.path.length - 1} steps; ${result.visited.length} cells visited. Drag the start or target to update it live.`;
    tone = 'success';
  } else if (result) {
    message = `No path exists — the target is unreachable. ${result.visited.length} cells visited.`;
    tone = 'error';
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Pathfinding"
        subtitle="Draw walls, move the start and target, then watch each algorithm explore the grid."
      />
      <Panel>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <Select
              label="Algorithm"
              value={algorithmId}
              options={PATH_ALGORITHM_LIST.map((a) => ({ value: a.id, label: a.name }))}
              onChange={(id) => {
                setAlgorithmId(id);
                reset();
              }}
              disabled={locked}
            />
            <Slider
              label="Grid size"
              value={clamp(cols, range.min, range.max)}
              min={range.min}
              max={range.max}
              onChange={changeSize}
              disabled={locked}
              display={`${grid.rows}×${grid.cols}`}
            />
            <Slider
              label="Speed"
              value={speed}
              min={1}
              max={10}
              onChange={setSpeed}
              display={`${delayForSpeed(speed)} ms/cell`}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={visualize} disabled={locked}>
              Visualize
            </Button>
            {inProgress && (
              <Button onClick={running ? player.pause : player.play}>
                {running ? 'Pause' : 'Resume'}
              </Button>
            )}
            {inProgress && (
              <Button onClick={player.finish} disabled={running}>
                Skip to end
              </Button>
            )}
            <Button onClick={reset} disabled={running || result === null}>
              Clear path
            </Button>
            <Button onClick={clearWalls} disabled={running}>
              Clear walls
            </Button>
            <Button onClick={randomWalls} disabled={running}>
              Random walls
            </Button>
            <Button variant="danger" onClick={clearGrid} disabled={running}>
              Clear grid
            </Button>
          </div>
        </div>
      </Panel>

      <Panel>
        <StatusBar
          message={message}
          tone={tone}
          stats={[
            { label: 'Visited', value: visitedShown },
            { label: 'Path length', value: result?.found && done ? result.path.length - 1 : '—' },
            { label: 'Grid', value: `${grid.rows}×${grid.cols}` },
          ]}
        />
        <div
          role="application"
          aria-label={`Pathfinding grid, ${grid.rows} rows by ${grid.cols} columns`}
          data-testid="grid"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          className={`mt-4 grid touch-none select-none overflow-hidden rounded-lg border-l border-t border-slate-200 ring-1 ring-slate-200 dark:border-slate-800 dark:ring-slate-800 ${locked ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
          style={{ gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))` }}
        >
          {kinds.map((kind, i) => {
            const row = Math.floor(i / grid.cols);
            const col = i % grid.cols;
            return (
              <Cell
                key={i}
                row={row}
                col={col}
                kind={kind}
                isStart={grid.start.row === row && grid.start.col === col}
                isEnd={grid.end.row === row && grid.end.col === col}
              />
            );
          })}
        </div>
        <div className="mt-3">
          <Legend items={LEGEND} />
        </div>
      </Panel>

      <ComplexityTable
        name={algorithm.name}
        description={algorithm.description}
        rows={[
          { label: 'Time', value: algorithm.complexity },
          { label: 'Space', value: 'O(V)' },
          { label: 'Shortest path', value: algorithm.guaranteesShortest ? 'Guaranteed' : 'No' },
          { label: 'Heuristic', value: algorithmId === 'astar' ? 'Manhattan' : 'None' },
        ]}
      />
    </div>
  );
}
