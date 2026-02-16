'use client';

import Link from 'next/link';
import { Home, AlertTriangle } from 'lucide-react';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-red-500/10 border border-red-500/20 rounded-full p-6 mb-8">
        <AlertTriangle size={48} className="text-red-400" />
      </div>

      <h1 className="text-4xl font-bold text-white mb-4">Er ging iets mis</h1>

      <p className="text-gray-400 text-lg max-w-md mb-10 leading-relaxed">
        Er is een onverwachte fout opgetreden. Probeer het opnieuw of ga terug naar de homepage.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-all transform hover:scale-105"
        >
          Probeer opnieuw
        </button>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-gray-200 font-bold rounded-xl hover:bg-gray-700 transition-all border border-gray-700"
        >
          <Home size={18} />
          Naar homepage
        </Link>
      </div>
    </div>
  );
}
