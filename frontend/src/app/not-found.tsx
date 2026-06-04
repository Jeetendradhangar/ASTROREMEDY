'use client';

import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[75vh] px-6 py-12 text-center animate-stardust-reveal">
      <div className="constellation-layer" />
      <div className="w-full max-w-md nm-card p-8 space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center nm-inset text-gold mb-2">
          <Compass className="h-8 w-8" style={{ transform: 'rotate(45deg)' }} />
        </div>
        <h2 className="font-display-h2 text-xl tracking-widest text-ink uppercase font-cinzel">
          404 — Lost in Orbit
        </h2>
        <p className="text-mist font-garamond text-sm italic leading-relaxed">
          The cosmic coordinates you seek do not align with any celestial entities in our sanctuary. Let us guide you back.
        </p>
        <Link href="/" className="nm-btn-gold w-full py-4.5 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer" style={{ textDecoration: 'none', borderRadius: 'var(--nm-radius-btn)' }}>
          Back to Celestial Home
        </Link>
      </div>
    </div>
  );
}
