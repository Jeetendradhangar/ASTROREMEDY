'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { Sparkles, Home, MessageSquare, User, LogOut } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout/');
    } catch (e) {
      console.error("Logout failed", e);
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  const navItems = [
    { label: 'Home', href: '/dashboard', icon: Home },
    { label: 'My Inquiries', href: '/dashboard#inquiries', icon: MessageSquare },
    { label: 'Profile', href: '/dashboard/profile', icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-parchment-canvas text-ink-primary pb-20 md:pb-0">
      
      {/* Desktop Sticky Header */}
      <header className="sticky top-0 z-40 hidden md:flex items-center justify-between px-8 py-4 bg-ink-primary border-b border-gold-accent/15 text-parchment-bg">
        <Link href="/dashboard" className="flex items-center gap-2 text-gold-accent">
          <Sparkles className="h-5 w-5 text-gold-accent fill-gold-accent" />
          <span className="font-display-h2 font-bold text-lg tracking-widest uppercase font-cinzel">AstroRemedy</span>
        </Link>
 
        <nav className="flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href.includes('#') && pathname === '/dashboard');
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`text-xs font-semibold uppercase tracking-wider transition-colors hover:text-gold-accent ${
                  isActive ? 'text-gold-accent' : 'text-parchment-bg'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          
          <button
            onClick={handleLogout}
            className="btn-gold-ghost !py-1.5 !px-4 text-[11px] border-gold-accent/40 hover:bg-gold-accent/10"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </nav>
      </header>
 
      {/* Main Page Area */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
 
      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex items-center justify-around h-16 bg-ink-primary border-t border-gold-accent/15 text-parchment-bg px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href.includes('#') && pathname === '/dashboard');
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 text-center py-2 transition-all ${
                isActive ? 'text-gold-accent' : 'text-parchment-bg/70 hover:text-parchment-bg'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center gap-1 flex-1 text-center py-2 text-danger/80 hover:text-danger"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[10px] font-medium tracking-wide">Logout</span>
        </button>
      </nav>
    </div>
  );
}
