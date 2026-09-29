import { useCallback, useMemo, useState } from 'react';
import {
  SEARCH_ALGORITHMS,
  SEARCH_ALGORITHM_LIST,
  applySearchFrame,
  initialSearchView,
  type SearchAlgorithmId,
  type SearchFrame,
  type SearchView,
} from '../algorithms/searching';
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
import { randomArray, randomInt } from '../lib/random';

const MIN_VALUE = 1;
const MAX_VALUE = 99;

function cellClass(view: SearchView, index: number, isBinary: boolean): string {
  if (view.foundIndex === index) return 'bg-emerald-500 text-white ring-2 ring-emerald-300';
  if (view.current === index) return 'bg-amber-400 text-slate-900 ring-2 ring-amber-200';
  const started = view.status !== 'idle';
  const eliminated = isBinary
    ? started && (index < view.low || index > view.high || view.status === 'not-found')
    : started && (view.current === null ? view.status === 'not-found' : index < view.current);
  if (eliminated) return 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600';
  return 'bg-indigo-500 text-white dark:bg-indigo-500/80';
}

function pointerLabels(view: SearchView, index: number, isBinary: boolean): string[] {
  if (view.status === 'idle' || view.status === 'not-found') return [];
  const labels: string[] = [];
  if (isBinary) {
    if (index === view.low) labels.push('low');
    if (index === view.current) labels.push('mid');
    if (index === view.high) labels.push('high');
  } else if (index === view.current) {
    labels.push('i');
  }
  return labels;
}

const LEGEND = [
  { label: 'Candidate', className: 'bg-indigo-500' },
  { label: 'Checking', className: 'bg-amber-400' },
  { label: 'Eliminated', className: 'bg-slate-300 dark:bg-slate-700' },
  { label: 'Found', className: 'bg-emerald-500' },
];

export function SearchingPage() {
  const [algorithmId, setAlgorithmId] = useState<SearchAlgorithmId>('binary');
  const [size, setSize] = useState(15);
  const [speed, setSpeed] = useState(3);
  const [baseArray, setBaseArray] = useState(() => randomArray(15, MIN_VALUE, MAX_VALUE));
  const [targetInput, setTargetInput] = useState(() => String(baseArray[randomInt(0, 14)]));

  const algorithm = SEARCH_ALGORITHMS[algorithmId];
  const isBinary = algorithm.requiresSorted;
  const array = useMemo(
    () => (isBinary ? [...baseArray].sort((a, b) => a - b) : baseArray),
    [baseArray, isBinary],
  );
  const trimmed = targetInput.trim();
  const target = trimmed === '' ? NaN : Number(trimmed);
  const targetValid = Number.isInteger(target);

  const frames = useMemo<SearchFrame[]>(
    () => (targetValid ? Array.from(algorithm.generator(array, target)) : []),
    [algorithm, array, target, targetValid],
  );
  const initialView = useMemo(() => initialSearchView(array.length), [array.length]);
  const apply = useCallback(
    (v: SearchView, f: SearchFrame) => applySearchFrame(v, f, array, target),
    [array, target],
  );
  const player = useFramePlayer(frames, initialView, apply, delayForSpeed(speed));
  const { view, isPlaying, isDone } = player;
  const locked = isPlaying;

  const regenerate = (nextSize: number) => {
    const next = randomArray(nextSize, MIN_VALUE, MAX_VALUE);
    setBaseArray(next);
    setTargetInput(String(next[randomInt(0, nextSize - 1)]));
  };

  const pickMissing = () => {
    const present = new Set(array);
    const candidates: number[] = [];
    for (let v = MIN_VALUE; v <= MAX_VALUE; v++) if (!present.has(v)) candidates.push(v);
    if (candidates.length > 0)
      setTargetInput(String(candidates[randomInt(0, candidates.length - 1)]));
  };

  const message = !targetValid ? 'Enter a whole-number target to search for.' : view.message;
  const tone =
    view.status === 'found' ? 'success' : view.status === 'not-found' ? 'error' : 'neutral';

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Searching"
        subtitle="Choose a target value and watch how each algorithm narrows down where it could be."
      />
      <Panel>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <Select
              label="Algorithm"
              value={algorithmId}
              options={SEARCH_ALGORITHM_LIST.map((a) => ({ value: a.id, label: a.name }))}
              onChange={setAlgorithmId}
              disabled={locked}
            />
            <div className="min-w-[8rem] flex-1">
              <label
                htmlFor="search-target"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
              >
                Target
              </label>
              <input
                id="search-target"
                type="number"
                inputMode="numeric"
                value={targetInput}
                disabled={locked}
                onChange={(e) => setTargetInput(e.target.value)}
                aria-invalid={!targetValid}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <Slider
              label="Array size"
              value={size}
              min={5}
              max={30}
              disabled={locked}
              onChange={(n) => {
                setSize(n);
                regenerate(n);
              }}
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
            <Button onClick={() => regenerate(size)} disabled={locked}>
              Randomize
            </Button>
            <Button
              onClick={() => setTargetInput(String(array[randomInt(0, array.length - 1)]))}
              disabled={locked}
            >
              Pick existing target
            </Button>
            <Button onClick={pickMissing} disabled={locked}>
              Pick missing target
            </Button>
            <PlaybackButtons
              isPlaying={isPlaying}
              isDone={isDone}
              canPlay={targetValid}
              onPlay={player.play}
              onPause={player.pause}
              onStep={player.step}
              onFinish={player.finish}
              onReset={player.reset}
            />
          </div>
        </div>
      </Panel>

      {isBinary && (
        <div
          role="note"
          className="rounded-xl border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-200"
        >
          <strong>Binary Search needs a sorted array.</strong> The array below has been sorted in
          ascending order so each comparison can safely discard half of the remaining range. On an
          unsorted array it could miss the target entirely.
        </div>
      )}

      <Panel>
        <StatusBar
          message={message}
          tone={tone}
          stats={[
            { label: 'Steps', value: view.steps },
            ...(isBinary && view.status !== 'idle'
              ? [
                  {
                    label: 'Range',
                    value: view.low <= view.high ? `[${view.low}, ${view.high}]` : 'empty',
                  },
                ]
              : []),
            { label: 'Target', value: targetValid ? target : '—' },
          ]}
        />
        <ol aria-label="Array" className="mt-4 flex flex-wrap gap-2">
          {array.map((value, i) => {
            const labels = pointerLabels(view, i, isBinary);
            return (
              <li
                key={i}
                data-testid="search-cell"
                className="flex w-10 flex-col items-center sm:w-12"
              >
                <span className="text-[10px] text-slate-400">{i}</span>
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-lg font-mono text-sm font-semibold transition-colors sm:h-12 sm:w-12 ${cellClass(view, i, isBinary)}`}
                >
                  {value}
                </span>
                <span className="mt-1 h-4 text-[10px] font-semibold uppercase text-amber-600 dark:text-amber-400">
                  {labels.join(' ')}
                </span>
              </li>
            );
          })}
        </ol>
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
          { label: 'Needs sorted input', value: algorithm.requiresSorted ? 'Yes' : 'No' },
        ]}
      />
    </div>
  );
}
