'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import Link from 'next/link';
import { 
  Sparkles, MessageSquare, Package, ShoppingBag, Star, 
  ArrowRight, Users, TrendingUp, Settings, FileText
} from 'lucide-react';

export default function AdminDashboardHub() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  
  const [stats, setStats] = useState({
    consultations: 0,
    orders: 0,
    products: 0,
    reviews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user && !user.is_astrologer && !user.is_staff) {
      router.push('/dashboard');
      return;
    }

    const fetchStats = async () => {
      try {
        const [consultationsRes, ordersRes, productsRes, reviewsRes] = await Promise.all([
          api.get('/api/consultations/'),
          api.get('/api/orders/'),
          api.get('/api/orders/products/'),
          api.get('/api/reviews/')
        ]);

        setStats({
          consultations: consultationsRes.data.count || (Array.isArray(consultationsRes.data) ? consultationsRes.data.length : 0),
          orders: ordersRes.data.count || (Array.isArray(ordersRes.data) ? ordersRes.data.length : 0),
          products: productsRes.data.count || (Array.isArray(productsRes.data) ? productsRes.data.length : 0),
          reviews: reviewsRes.data.count || (Array.isArray(reviewsRes.data) ? reviewsRes.data.length : 0),
        });
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 sm:px-8 space-y-8 animate-pulse">
        <div className="h-8 bg-bloom/30 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-bloom/20 border border-gold/10 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const sections = [
    {
      title: 'Consultations Queue',
      desc: 'Review birth charts, listen to voice notes, and submit audio guides.',
      count: stats.consultations,
      href: '/admin/consultations',
      icon: MessageSquare,
      color: 'var(--color-mystic)',
    },
    {
      title: 'Remedy Orders',
      desc: 'Track and ship Rudraksh beads ordered via the WhatsApp flow.',
      count: stats.orders,
      href: '/admin/orders',
      icon: Package,
      color: 'var(--color-gold)',
    },
    {
      title: 'Product Catalog',
      desc: 'Add, edit, or adjust stock counts for rudraksh remedies.',
      count: stats.products,
      href: '/admin/products',
      icon: ShoppingBag,
      color: 'var(--color-success)',
    },
    {
      title: 'Reviews Moderation',
      desc: 'Moderate user feedback and approve positive seeker testimonials.',
      count: stats.reviews,
      href: '/admin/reviews',
      icon: Star,
      color: 'var(--color-danger)',
    },
  ];

  return (
    <div className="flex-1 bg-parchment-canvas min-h-screen text-ink-primary pb-16 font-sans">
      <div className="max-w-7xl w-full mx-auto px-6 py-12 sm:px-8 relative z-10 animate-stardust-reveal flex flex-col gap-8">
        <div className="constellation-layer" />

        {/* Header */}
        <header className="nm-card bg-parchment-bg p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-mystic-muted font-display-h3 text-[11px] tracking-widest uppercase">
              <Sparkles className="h-4 w-4" /> Celestial Control Center
            </div>
            <h1 className="font-display-h1 text-2xl text-ink-primary">Sanctuary Command Hub</h1>
            <p className="text-mystic-muted font-sans text-xs uppercase tracking-wider">Welcome back, Astrologer {user?.first_name || user?.username}</p>
          </div>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {sections.map((sec, index) => {
            const Icon = sec.icon;
            return (
              <Link 
                key={index}
                href={sec.href}
                className="nm-card bg-parchment-bg p-6 flex flex-col justify-between h-48 transition-all hover:translate-y-[-2px] group"
              >
                <div className="flex justify-between items-start">
                  <div className="p-3 nm-inset text-mystic-muted group-hover:text-gold-text transition-colors flex items-center justify-center shrink-0">
                    <Icon className="h-6 w-6 stroke-[1.25]" />
                  </div>
                  <span className="font-sans text-3xl font-bold text-mystic-muted/40 group-hover:text-mystic-muted transition-colors">
                    {sec.count}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-display-h3 text-base text-ink-primary tracking-wide font-bold flex items-center gap-1">
                    {sec.title}
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-gold-text" />
                  </h3>
                  <p className="text-xs text-mystic-muted font-sans leading-relaxed">
                    {sec.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Activity Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 nm-card bg-parchment-bg p-8 space-y-4">
            <h3 className="font-display-h3 text-sm text-ink-primary tracking-widest uppercase flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-mystic-muted" /> Quick Actions & Astrological Guidelines
            </h3>
            <div className="font-sans text-xs text-ink-primary/80 leading-relaxed space-y-3">
              <p>
                1. **Check Consultations:** Review the newest birth chart inquiries as soon as they pay to maintain a short turnaround time.
              </p>
              <p>
                2. **Record Clear Audios:** Find a quiet space when recording guidance replies. Seekers look forward to clear voice advice.
              </p>
              <p>
                3. **Review Orders:** Ensure packing slips are updated and DTDC tracking numbers are posted correctly.
              </p>
            </div>
          </div>

          <div className="nm-card bg-parchment-bg p-8 flex flex-col justify-center space-y-4">
            <h3 className="font-display-h3 text-sm text-ink-primary tracking-widest uppercase flex items-center gap-2">
              <Settings className="h-4 w-4 text-mystic-muted" /> Console Configuration
            </h3>
            <p className="text-xs font-sans text-mystic-muted leading-relaxed">
              All database settings, CORS headers, API limiters, and system bypass tools are active. SimpleJWT sessions will expire after 60 minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
