'use client';

import { useSearchParams } from 'next/navigation';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';
  const error = searchParams.get('error');

  return (
    <form method="POST" action="/api/login" className="flex flex-col gap-4 w-full max-w-sm">
      <input type="hidden" name="from" value={from} />

      {error && (
        <p className="text-red-500 text-sm text-center">Incorrect password. Try again.</p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-gray-300">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoFocus
          required
          className="px-4 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
          placeholder="Enter password"
        />
      </div>

      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-colors"
      >
        Sign In
      </button>
    </form>
  );
}
