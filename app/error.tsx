'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error caught by boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#faf7ee] text-slate-900 font-mono text-center">
      <div className="border-4 border-[#1e3a8a] bg-white p-8 rounded-3xl shadow-xl max-w-md w-full">
        <h2 className="text-3xl font-black mb-3 text-rose-600">Game Error</h2>
        <p className="text-xs text-slate-700 font-bold mb-6">
          A crayon broke while drawing this screen. Let&apos;s reset the notebook!
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-[#16a34a] hover:bg-[#15803d] text-white font-black rounded-2xl border-4 border-[#14532d] uppercase tracking-wide text-sm transition-all shadow-md active:scale-95"
        >
          Reset Notebook
        </button>
      </div>
    </div>
  );
}
