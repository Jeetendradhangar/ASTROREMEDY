'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const getErrorMessage = (code: string | null) => {
    switch (code) {
      case 'invalid_code_exchange':
        return 'Failed to exchange authorization code with Google.';
      case 'failed_userinfo':
        return 'Failed to retrieve profile information from Google.';
      case 'not_configured':
        return 'Google OAuth credentials are not configured on the server.';
      case 'no_email':
        return 'Could not retrieve email address from your Google account.';
      case 'no_code':
        return 'Authorization code missing in Google callback response.';
      case 'exception':
        return 'An internal exception occurred during Google OAuth callback processing.';
      default:
        return code ? `An unexpected authentication error occurred: ${code}` : 'Google authentication failed.';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 nm-card relative text-center bg-parchment-bg">
      <div className="inline-flex h-16 w-16 items-center justify-center nm-inset text-danger mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>
      
      <h2 className="font-display-h2 text-xl tracking-widest text-ink-primary mb-3 uppercase">
        Authentication Error
      </h2>
      
      <p className="text-sm font-sans text-ink-primary leading-relaxed mb-6">
        {getErrorMessage(error)}
      </p>

      <p className="text-xs font-garamond text-mystic-muted italic mb-8">
        Redirecting you to login portal in {countdown} seconds...
      </p>

      <Link href="/login" className="nm-btn-gold w-full py-4 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer" style={{ textDecoration: 'none' }}>
        <ArrowLeft className="h-4 w-4" /> Return to Login
      </Link>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 sm:px-8 relative z-10 animate-stardust-reveal">
      <div className="constellation-layer"></div>
      <Suspense fallback={
        <div className="w-full max-w-md mx-auto p-8 nm-card text-center">
          <div className="h-10 w-10 animate-spin rounded border-2 border-gold border-t-transparent mx-auto mb-4"></div>
          <p className="text-xs tracking-widest text-mist animate-pulse">Processing callback...</p>
        </div>
      }>
        <CallbackContent />
      </Suspense>
    </div>
  );
}
