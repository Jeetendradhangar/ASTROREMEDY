'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[75vh] px-6 py-12 text-center animate-stardust-reveal">
      <div className="constellation-layer" />
      <div className="w-full max-w-md nm-card p-8 space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center nm-inset text-danger mb-2">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="font-display-h2 text-xl tracking-widest text-ink uppercase font-cinzel">
          Alignment Disrupted
        </h2>
        <p className="text-mist font-garamond text-sm italic leading-relaxed">
          An unexpected disturbance has occurred in our sanctuary. We are re-aligning the chart configurations.
        </p>
        <div className="flex flex-col gap-3 pt-2">
          <button onClick={() => reset()} className="nm-btn-gold w-full py-4 text-xs font-bold tracking-widest uppercase cursor-pointer" style={{ borderRadius: 'var(--nm-radius-btn)' }}>
            Attempt Realignment
          </button>
          <a href="/" className="nm-btn w-full py-3.5 text-xs font-bold text-mystic hover:text-gold uppercase tracking-wider text-center" style={{ textDecoration: 'none' }}>
            Return Home
          </a>
        </div>
      </div>
    </div>
  );
}
