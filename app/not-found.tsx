import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#faf7ee] text-slate-900 font-mono text-center">
      <div className="border-4 border-[#1e3a8a] bg-white p-8 rounded-3xl shadow-xl max-w-md w-full">
        <h2 className="text-4xl font-black mb-2 text-[#1e3a8a]">404</h2>
        <p className="text-sm text-slate-700 font-bold mb-6">
          Whoops! This notebook page doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-[#16a34a] hover:bg-[#15803d] text-white font-black rounded-2xl border-4 border-[#14532d] uppercase tracking-wide text-sm transition-all shadow-md active:scale-95"
        >
          Back to Game
        </Link>
      </div>
    </div>
  );
}
