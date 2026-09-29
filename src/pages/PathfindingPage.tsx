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

interface Dimensions {
  rows: number;
  cols: number;
}

function gridDimensions(isDesktop: boolean, isTablet: boolean): Dimensions {
  if (isDesktop) return { rows: 16, cols: 30 };
  if (isTablet) return { rows: 14, cols: 20 };
  return { rows: 16, cols: 11 };
}

function createGrid({ rows, cols }: Dimensions): GridSpec {
  const midRow = Math.floor(rows / 2);
  return {
    rows,
    cols,
    walls: createWalls(rows, cols),
    start: { row: midRow, col: Math.floor(cols / 5) },
    end: { row: midRow, col: cols - 1 - Math.floor(cols / 5) },
  };
}

const increment = (count: number) => count + 1;

function StartIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-full w-full drop-shadow">
      <circle cx="12" cy="12" r="10" className="fill-emerald-500" />
      <path d="M10 7.5l5 4.5-5 4.5z" className="fill-white" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-full w-full drop-shadow">
      <path
        d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z"
        className="fill-rose-600"
      />
      <circle cx="12" cy="9" r="2.6" className="fill-white" />
    </svg>
  );
}

const TILE = 'aspect-square rounded-[3px] transition-colors duration-300 ease-out';
const TILE_SHADOW = 'shadow-[0_2px_0_rgb(117,108,108)] dark:shadow-[0_2px_0_rgb(15,23,42)]';

const KIND_CLASS: Record<CellKind, string> = {
  empty: `${TILE_SHADOW} bg-stone-400 dark:bg-slate-600`,
  wall: `${TILE_SHADOW} brick-wall animate-pop`,
  visited: `${TILE_SHADOW} bg-sky-500/70 dark:bg-sky-500/60`,
  path: `${TILE_SHADOW} bg-rose-500 animate-pop`,
};

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
  return (
    <div
      data-row={row}
      data-col={col}
      data-kind={isStart ? 'start' : isEnd ? 'end' : kind}
      className={`${TILE} ${marker ? 'cursor-grab p-px' : KIND_CLASS[kind]}`}
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
  { label: 'Target', className: 'rounded-full bg-rose-600' },
  { label: 'Unvisited', className: 'bg-stone-400 dark:bg-slate-600' },
  { label: 'Wall', className: 'brick-wall' },
  { label: 'Visited', className: 'bg-sky-500/70' },
  { label: 'Shortest path', className: 'bg-rose-500' },
];

export function PathfindingPage() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 640px)');
  const dims = gridDimensions(isDesktop, isTablet);

  const [grid, setGrid] = useState<GridSpec>(() => createGrid(dims));
  const [algorithmId, setAlgorithmId] = useState<PathAlgorithmId>('astar');
  const [speed, setSpeed] = useState(5);
  const [result, setResult] = useState<PathResult | null>(null);

  if (grid.rows !== dims.rows || grid.cols !== dims.cols) {
    setGrid(createGrid(dims));
    setResult(null);
  }

  const frames = useMemo(
    () => (result ? new Array<null>(result.visited.length + result.path.length).fill(null) : []),
    [result],
  );
  const player = useFramePlayer(frames, 0, increment, delayForSpeed(speed), {
    autoPlay: result !== null,
  });
  const running = player.isPlaying;
  const inProgress = result !== null && !player.isDone;
  const locked = running || inProgress;

  const kinds = useMemo(() => {
    const out: CellKind[] = grid.walls.map((w) => (w ? 'wall' : 'empty'));
    if (result) {
      const visitedCount = Math.min(player.index, result.visited.length);
      for (let i = 0; i < visitedCount; i++)
        out[toIndex(result.visited[i] as Point, grid.cols)] = 'visited';
      const pathCount = Math.max(0, player.index - result.visited.length);
      for (let i = 0; i < pathCount; i++) out[toIndex(result.path[i] as Point, grid.cols)] = 'path';
    }
    return out;
  }, [grid, result, player.index]);

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

  const applyEdit = useCallback((mode: DragMode, p: Point) => {
    setGrid((g) => {
      const index = toIndex(p, g.cols);
      if (mode === 'start' || mode === 'end') {
        const other = mode === 'start' ? g.end : g.start;
        if (samePoint(p, other) || g.walls[index]) return g;
        return { ...g, [mode]: p };
      }
      if (samePoint(p, g.start) || samePoint(p, g.end)) return g;
      const wall = mode === 'wall-add';
      if (g.walls[index] === wall) return g;
      const walls = [...g.walls];
      walls[index] = wall;
      return { ...g, walls };
    });
    setResult(null);
  }, []);

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

  const visualize = () => setResult(PATH_ALGORITHMS[algorithmId].run(grid));
  const clearPath = () => setResult(null);
  const clearWalls = () => {
    setGrid((g) => ({ ...g, walls: createWalls(g.rows, g.cols) }));
    setResult(null);
  };
  const clearGrid = () => {
    setGrid(createGrid(dims));
    setResult(null);
  };
  const randomWalls = () => {
    setGrid((g) => ({
      ...g,
      walls: g.walls.map((_, i) => {
        const p = { row: Math.floor(i / g.cols), col: i % g.cols };
        return !samePoint(p, g.start) && !samePoint(p, g.end) && Math.random() < 0.28;
      }),
    }));
    setResult(null);
  };

  const algorithm = PATH_ALGORITHMS[algorithmId];
  const visitedShown = result ? Math.min(player.index, result.visited.length) : 0;

  let message = 'Click or drag to draw walls. Drag the green start or red target to move them.';
  let tone: 'neutral' | 'success' | 'error' = 'neutral';
  if (result && !player.isDone) {
    message = `${running ? 'Exploring' : 'Paused'}… ${visitedShown} cells visited.`;
  } else if (result?.found) {
    message = `Path found! Length ${result.path.length - 1} steps; ${result.visited.length} cells visited.`;
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
                setResult(null);
              }}
              disabled={locked}
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
            <Button onClick={clearPath} disabled={running || result === null}>
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
            {
              label: 'Path length',
              value: result?.found && player.isDone ? result.path.length - 1 : '—',
            },
            { label: 'Grid', value: `${grid.rows}×${grid.cols}` },
          ]}
        />
        <div
          role="application"
          aria-label={`Pathfinding grid, ${grid.rows} rows by ${grid.cols} columns`}
          data-testid="grid"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          className={`mt-4 grid touch-none select-none gap-[3px] pb-[2px] sm:gap-1 ${locked ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
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
