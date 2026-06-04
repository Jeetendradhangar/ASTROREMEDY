'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

export default function Hydration({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const setHydrated = useAuthStore((state) => state.setHydrated);

  useEffect(() => {
    const checkSession = async () => {
      const isAuthPage = typeof window !== 'undefined' && (
        window.location.pathname === '/login' || 
        window.location.pathname === '/register'
      );

      if (isAuthPage) {
        setHydrated(true);
        return;
      }

      try {
        const response = await api.get('/api/auth/me/');
        setUser(response.data);
      } catch (e) {
        setUser(null);
      } finally {
        setHydrated(true);
      }
    };
    checkSession();
  }, [setUser, setHydrated]);

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fdf9] text-forest-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded border-2 border-forest-primary border-t-transparent"></div>
          <p className="font-display-h3 text-xs tracking-widest text-text-secondary animate-pulse">Aligning stars...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
