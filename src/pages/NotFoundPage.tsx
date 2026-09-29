import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">That route doesn&apos;t exist.</p>
      <Link
        to="/"
        className="mt-6 inline-block text-indigo-600 hover:underline dark:text-indigo-400"
      >
        Back to home
      </Link>
    </div>
  );
}
