import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useId } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400',
  secondary:
    'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700',
  danger:
    'bg-white text-rose-700 ring-1 ring-inset ring-rose-300 hover:bg-rose-50 dark:bg-slate-800 dark:text-rose-300 dark:ring-rose-800 dark:hover:bg-rose-950',
};

export function Button({
  variant = 'secondary',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={`rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

const fieldLabel =
  'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  display?: string;
}) {
  const id = useId();
  return (
    <div className="min-w-[8rem] flex-1">
      <label htmlFor={id} className={fieldLabel}>
        {label}{' '}
        <span className="font-mono normal-case text-slate-700 dark:text-slate-200">
          {display ?? value}
        </span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="min-w-[10rem] flex-1">
      <label htmlFor={id} className={fieldLabel}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {children}
    </section>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
    </div>
  );
}

export function Legend({ items }: { items: ReadonlyArray<{ label: string; className: string }> }) {
  return (
    <ul
      aria-label="Legend"
      className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400"
    >
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={`inline-block h-3 w-3 rounded-sm ${item.className}`}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export function StatusBar({
  message,
  stats,
  tone = 'neutral',
}: {
  message: string;
  stats: ReadonlyArray<{ label: string; value: string | number }>;
  tone?: 'neutral' | 'success' | 'error';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-emerald-700 dark:text-emerald-300'
      : tone === 'error'
        ? 'text-rose-700 dark:text-rose-300'
        : 'text-slate-700 dark:text-slate-200';
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p role="status" aria-live="polite" className={`text-sm font-medium ${toneClass}`}>
        {message}
      </p>
      <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        {stats.map((s) => (
          <div key={s.label} className="flex gap-1">
            <dt>{s.label}:</dt>
            <dd className="font-mono text-slate-800 dark:text-slate-100">{s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function ComplexityTable({
  name,
  description,
  rows,
}: {
  name: string;
  description: string;
  rows: ReadonlyArray<{ label: string; value: string }>;
}) {
  return (
    <Panel>
      <h2 className="text-lg font-semibold">{name}</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {rows.map((r) => (
          <div key={r.label} className="rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800">
            <dt className="text-xs text-slate-500 dark:text-slate-400">{r.label}</dt>
            <dd className="font-mono text-sm font-semibold">{r.value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

export function PlaybackButtons({
  isPlaying,
  isDone,
  canPlay = true,
  onPlay,
  onPause,
  onStep,
  onFinish,
  onReset,
  playLabel = 'Play',
}: {
  isPlaying: boolean;
  isDone: boolean;
  canPlay?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onFinish: () => void;
  onReset: () => void;
  playLabel?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {isPlaying ? (
        <Button variant="primary" onClick={onPause}>
          Pause
        </Button>
      ) : (
        <Button variant="primary" onClick={onPlay} disabled={isDone || !canPlay}>
          {playLabel}
        </Button>
      )}
      <Button onClick={onStep} disabled={isPlaying || isDone || !canPlay}>
        Step
      </Button>
      <Button onClick={onFinish} disabled={isPlaying || isDone || !canPlay}>
        Skip to end
      </Button>
      <Button onClick={onReset} disabled={isPlaying}>
        Reset
      </Button>
    </div>
  );
}
