import { Link } from 'react-router-dom';

const CATEGORIES = [
  {
    to: '/sorting',
    title: 'Sorting',
    description:
      'Watch Bubble, Selection, Insertion, Merge, Quick and Heap Sort compare, swap and settle values.',
    tags: ['6 algorithms', 'O(n log n) vs O(n²)'],
    preview: (
      <div aria-hidden="true" className="flex h-16 items-end gap-1">
        {[40, 70, 25, 90, 55, 80, 35, 60].map((h, i) => (
          <span key={i} className="w-3 rounded-t bg-indigo-500/80" style={{ height: `${h}%` }} />
        ))}
      </div>
    ),
  },
  {
    to: '/searching',
    title: 'Searching',
    description:
      'Step through Linear and Binary Search with live pointers, ranges and step counts.',
    tags: ['2 algorithms', 'O(n) vs O(log n)'],
    preview: (
      <div aria-hidden="true" className="flex h-16 items-center gap-1">
        {[2, 5, 8, 12, 16, 23, 38].map((v, i) => (
          <span
            key={v}
            className={`flex h-8 w-8 items-center justify-center rounded text-xs font-semibold ${
              i === 3
                ? 'bg-amber-400 text-slate-900'
                : i < 3
                  ? 'bg-slate-300 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                  : 'bg-indigo-500/80 text-white'
            }`}
          >
            {v}
          </span>
        ))}
      </div>
    ),
  },
  {
    to: '/pathfinding',
    title: 'Pathfinding',
    description:
      'Draw walls on a grid and compare how BFS, DFS, Dijkstra and A* explore to find a route.',
    tags: ['4 algorithms', 'Interactive grid'],
    preview: (
      <div aria-hidden="true" className="grid h-16 w-24 grid-cols-6 gap-0.5">
        {Array.from({ length: 24 }, (_, i) => {
          const path = [0, 1, 2, 8, 14, 15, 16, 17, 23].includes(i);
          const wall = [3, 9, 10, 20].includes(i);
          return (
            <span
              key={i}
              className={`rounded-sm ${path ? 'bg-amber-400' : wall ? 'bg-slate-700 dark:bg-slate-300' : 'bg-sky-300/70 dark:bg-sky-700/70'}`}
            />
          );
        })}
      </div>
    ),
  },
] as const;

export function LandingPage() {
  return (
    <div className="py-4 sm:py-10">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
          See algorithms <span className="text-indigo-600 dark:text-indigo-400">think</span>
        </h1>
        <p className="mt-4 text-base text-slate-600 sm:text-lg dark:text-slate-400">
          Interactive, step-by-step visualizations of classic sorting, searching and pathfinding
          algorithms — with complexity notes and live statistics.
        </p>
      </div>
      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => (
          <li key={c.to}>
            <Link
              to={c.to}
              className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500"
            >
              {c.preview}
              <h2 className="mt-4 text-xl font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                {c.title}
              </h2>
              <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">
                {c.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {c.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
