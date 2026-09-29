import { useMemo, useState } from 'react';
import {
  Button,
  ComplexityTable,
  Legend,
  PageHeader,
  Panel,
  PlaybackButtons,
  Select,
  Slider,
  StatusBar,
} from '../components/controls';
import { delayForSpeed, useFramePlayer } from '../hooks/useFramePlayer';
import {
  SORT_ALGORITHMS,
  SORT_ALGORITHM_LIST,
  applySortFrame,
  collectFrames,
  initialSortView,
  type SortAlgorithmId,
  type SortFrame,
  type SortView,
} from '../algorithms/sorting';
import { randomArray } from '../lib/random';

const MIN_VALUE = 5;
const MAX_VALUE = 100;
const randomBars = (size: number) => randomArray(size, MIN_VALUE, MAX_VALUE);

function describeFrame(view: SortView, isDone: boolean, total: number): string {
  if (isDone && total > 0) return 'Sorted! Every bar is in its final position.';
  const frame = view.lastFrame;
  if (!frame) return 'Ready. Press Play to start sorting.';
  switch (frame.type) {
    case 'compare': {
      const [i, j] = frame.indices;
      return `Comparing index ${i} (${view.array[i]}) with index ${j} (${view.array[j]})`;
    }
    case 'swap':
      return `Swapped indices ${frame.indices[0]} and ${frame.indices[1]}`;
    case 'overwrite':
      return `Wrote ${frame.value} to index ${frame.index}`;
    case 'sorted':
      return frame.indices.length === 1
        ? `Index ${frame.indices[0]} is in its final position`
        : `${frame.indices.length} elements are in their final positions`;
  }
}

function barClass(view: SortView, index: number): string {
  if (view.writing.includes(index)) return 'bg-rose-500';
  if (view.comparing.includes(index)) return 'bg-amber-400';
  if (view.sorted[index]) return 'bg-emerald-500';
  return 'bg-indigo-500 dark:bg-indigo-400';
}

const LEGEND = [
  { label: 'Unsorted', className: 'bg-indigo-500 dark:bg-indigo-400' },
  { label: 'Comparing', className: 'bg-amber-400' },
  { label: 'Swap / write', className: 'bg-rose-500' },
  { label: 'Sorted', className: 'bg-emerald-500' },
];

export function SortingPage() {
  const [algorithmId, setAlgorithmId] = useState<SortAlgorithmId>('bubble');
  const [size, setSize] = useState(30);
  const [speed, setSpeed] = useState(6);
  const [array, setArray] = useState(() => randomBars(30));

  const algorithm = SORT_ALGORITHMS[algorithmId];
  const frames = useMemo<SortFrame[]>(
    () => collectFrames(algorithm.generator, array),
    [algorithm, array],
  );
  const initialView = useMemo(() => initialSortView(array), [array]);
  const player = useFramePlayer(frames, initialView, applySortFrame, delayForSpeed(speed));
  const { view, isPlaying, isDone } = player;
  const locked = isPlaying;
  const showValues = view.array.length <= 20;

  const changeSize = (next: number) => {
    setSize(next);
    setArray(randomBars(next));
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Sorting"
        subtitle="Pick an algorithm, generate an array and watch every comparison and swap."
      />
      <Panel>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <Select
              label="Algorithm"
              value={algorithmId}
              options={SORT_ALGORITHM_LIST.map((a) => ({ value: a.id, label: a.name }))}
              onChange={setAlgorithmId}
              disabled={locked}
            />
            <Slider
              label="Array size"
              value={size}
              min={5}
              max={100}
              onChange={changeSize}
              disabled={locked}
            />
            <Slider
              label="Speed"
              value={speed}
              min={1}
              max={10}
              onChange={setSpeed}
              display={`${delayForSpeed(speed)} ms/step`}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setArray(randomBars(size))} disabled={locked}>
              Randomize
            </Button>
            <PlaybackButtons
              isPlaying={isPlaying}
              isDone={isDone}
              canPlay={frames.length > 0}
              onPlay={player.play}
              onPause={player.pause}
              onStep={player.step}
              onFinish={player.finish}
              onReset={player.reset}
            />
          </div>
        </div>
      </Panel>

      <Panel>
        <StatusBar
          message={describeFrame(view, isDone, frames.length)}
          tone={isDone && frames.length > 0 ? 'success' : 'neutral'}
          stats={[
            { label: 'Step', value: `${player.index}/${player.total}` },
            { label: 'Comparisons', value: view.comparisons },
            { label: 'Writes', value: view.writes },
          ]}
        />
        <div
          role="img"
          aria-label={`Array of ${view.array.length} bars: ${view.array.join(', ')}`}
          className="mt-4 flex h-64 items-end gap-px sm:h-80 sm:gap-0.5"
        >
          {view.array.map((value, i) => (
            <div key={i} className="flex h-full min-w-0 flex-1 flex-col justify-end">
              <div
                data-testid="bar"
                className={`w-full rounded-t-sm transition-colors duration-100 ${barClass(view, i)}`}
                style={{ height: `${(value / MAX_VALUE) * 100}%` }}
              />
              {showValues && (
                <span className="mt-1 text-center font-mono text-[10px] text-slate-500 dark:text-slate-400">
                  {value}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3">
          <Legend items={LEGEND} />
        </div>
      </Panel>

      <ComplexityTable
        name={algorithm.name}
        description={algorithm.description}
        rows={[
          { label: 'Best', value: algorithm.complexity.best },
          { label: 'Average', value: algorithm.complexity.average },
          { label: 'Worst', value: algorithm.complexity.worst },
          { label: 'Space', value: algorithm.complexity.space },
          { label: 'Stable', value: algorithm.stable ? 'Yes' : 'No' },
        ]}
      />
    </div>
  );
}
