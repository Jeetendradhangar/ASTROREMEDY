'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { Sparkles, MessageSquare, Plus, LogOut, Package, Star, Clock, ArrowRight, XCircle } from 'lucide-react';
import Link from 'next/link';

interface Consultation {
  id: number;
  inquiry_number: number | null;
  date_of_birth: string;
  birth_time: string;
  birth_place: string;
  problem_desc: string;
  status: 'pending' | 'paid' | 'in_review' | 'replied' | 'closed';
  amount_paid: string | null;
  voice_note: { file_url: string; duration: number | null } | null;
  voice_reply: { file_url: string; duration: number | null } | null;
  created_at: string;
}

interface Order {
  id: number;
  status: 'draft_lock' | 'pending_whatsapp' | 'received' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: string;
  tracking_number: string | null;
  created_at: string;
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  user_email: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, clearAuth, isAuthenticated } = useAuthStore();

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.is_astrologer) {
      router.push('/admin');
      return;
    }

    const fetchData = async () => {
      try {
        const [consultationsRes, ordersRes, reviewsRes] = await Promise.all([
          api.get('/api/consultations/'),
          api.get('/api/orders/'),
          api.get('/api/reviews/')
        ]);

        const consultationList = Array.isArray(consultationsRes.data)
          ? consultationsRes.data
          : (consultationsRes.data.results || []);

        const orderList = Array.isArray(ordersRes.data)
          ? ordersRes.data
          : (ordersRes.data.results || []);

        const reviewList = Array.isArray(reviewsRes.data)
          ? reviewsRes.data
          : (reviewsRes.data.results || []);

        setConsultations(consultationList);
        setOrders(orderList);
        setReviews(reviewList);
      } catch (err: any) {
        console.error(err);
        setError('Failed to fetch dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user, router]);

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

  const CANCELABLE_STATUSES = ['draft_lock', 'pending_whatsapp', 'received', 'confirmed'];

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) return;
    setCancellingId(orderId);
    try {
      await api.post(`/api/orders/${orderId}/cancel/`);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' as const } : o))
      );
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to cancel order.');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge-pending">Awaiting Payment</span>;
      case 'paid':
        return <span className="badge-paid">Paid — In Queue</span>;
      case 'in_review':
        return <span className="badge-in-review">In Review</span>;
      case 'replied':
        return <span className="badge-replied">Response Ready</span>;
      case 'closed':
        return <span className="badge-closed">Closed</span>;
      default:
        return <span className="badge-closed">{status}</span>;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return <span className="badge-pending">Received</span>;
      case 'packed':
        return <span className="badge-paid">Packed</span>;
      case 'shipped':
        return <span className="badge-shipped">Shipped</span>;
      case 'delivered':
        return <span className="badge-delivered">Delivered</span>;
      case 'cancelled':
        return <span className="badge-closed">Cancelled</span>;
      default:
        return <span className="badge-closed">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-parchment-canvas min-h-screen max-w-7xl w-full mx-auto px-6 py-12 sm:px-8 space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="border-b border-ink-primary/15 pb-8 space-y-3">
          <div className="h-4 bg-ink-primary/10 rounded w-24"></div>
          <div className="h-8 bg-ink-primary/15 rounded w-1/3"></div>
          <div className="h-4 bg-ink-primary/10 rounded w-1/4"></div>
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main List Skeleton */}
          <div className="lg:col-span-8 space-y-6">
            <div className="h-6 bg-ink-primary/15 rounded w-1/4 mb-4"></div>
            {[1, 2].map((i) => (
              <div key={i} className="nm-card p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-ink-primary/10 pb-3">
                  <div className="h-5 bg-ink-primary/15 rounded w-24"></div>
                  <div className="h-4 bg-ink-primary/10 rounded w-32"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-ink-primary/15 rounded w-full"></div>
                  <div className="h-4 bg-ink-primary/15 rounded w-5/6"></div>
                </div>
                <div className="h-4 bg-ink-primary/10 rounded w-1/2 pt-2"></div>
              </div>
            ))}
          </div>

          {/* Sidebar Skeleton */}
          <div className="lg:col-span-4 space-y-6">
            <div className="h-6 bg-ink-primary/15 rounded w-1/3 mb-4"></div>
            <div className="nm-card p-6 space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-2 border-b border-ink-primary/10 last:border-0 pb-3 last:pb-0">
                  <div className="h-4 bg-ink-primary/15 rounded w-1/3"></div>
                  <div className="h-4 bg-ink-primary/10 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-parchment-canvas min-h-screen text-ink-primary pb-16 font-sans">

      {/* SECTION 1 — HERO HEADER */}
      <div className="bg-ink-primary text-parchment-canvas relative pb-16 pt-16 flex flex-col items-center justify-center text-center px-6">
        <div className="text-gold-accent text-4xl mb-3 animate-[pulse_3s_infinite] select-none">✦</div>
        <h1 className="font-display-h1 text-3xl font-cinzel text-gold-accent tracking-widest uppercase">
          Namaste, {user?.first_name || 'Seeker'}
        </h1>
        <p className="font-cinzel italic text-xs tracking-wider opacity-70 mt-2">
          Your stars are aligned today
        </p>

        {/* Bottom Curved Divider */}
        <div className="absolute left-0 right-0 bottom-0 h-10 bg-parchment-canvas rounded-t-[50%]"></div>
      </div>

      {/* SECTION 2 — STAT CARDS ROW */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 -mt-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="nm-card p-6 text-center flex flex-col justify-center gap-1 bg-parchment-bg">
            <span className="font-cinzel text-2xl font-bold text-mystic-muted">
              {consultations.filter(c => c.status !== 'closed' && c.status !== 'pending').length}
            </span>
            <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-mystic-muted">
              Active Inquiries
            </span>
          </div>

          <div className="nm-card p-6 text-center flex flex-col justify-center gap-1 bg-parchment-bg">
            <span className="font-cinzel text-2xl font-bold text-mystic-muted">
              {consultations.filter(c => c.status === 'paid' || c.status === 'in_review').length}
            </span>
            <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-mystic-muted">
              Awaiting Reply
            </span>
          </div>

          <div className="nm-card p-6 text-center flex flex-col justify-center gap-1 bg-parchment-bg">
            <span className="font-cinzel text-2xl font-bold text-mystic-muted">
              {orders.length}
            </span>
            <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-mystic-muted">
              Remedy Orders
            </span>
          </div>

          <div className="nm-card p-6 text-center flex flex-col justify-center gap-1 bg-parchment-bg">
            <span className="font-cinzel text-2xl font-bold text-mystic-muted">
              {consultations.filter(c => c.status === 'replied').length}
            </span>
            <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-mystic-muted">
              Replied
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 3 — INQUIRY FEED & SIDEBAR */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* Left Column: Inquiry Feed */}
        <div className="lg:col-span-8 space-y-6">
          <div className="text-[10px] font-sans font-bold uppercase tracking-widest text-mystic-muted mb-4">
            Your inquiries
          </div>

          {error && (
            <div className="border border-danger/20 bg-danger/5 rounded-lg p-4 text-xs font-semibold text-danger">
              {error}
            </div>
          )}

          {consultations.length === 0 ? (
            <div className="nm-card p-12 text-center space-y-6 bg-parchment-bg">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-ink-primary/5 text-mystic-muted">
                <Clock className="h-6 w-6 stroke-[1.25]" />
              </div>
              <h3 className="font-display-h3 text-base text-ink-primary">No active inquiries</h3>
              <p className="text-mystic-muted font-garamond text-sm max-w-md mx-auto leading-relaxed">
                Submit your birth details (date of birth, coordinates, and exact time) along with a voice clarification to receive guidance.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {consultations.map((c) => (
                <div
                  key={c.id}
                  className="nm-card bg-parchment-bg overflow-hidden flex group"
                >
                  {/* Left color strip */}
                  <div
                    className="w-2 shrink-0"
                    style={{
                      background: c.status === 'replied' ? 'var(--gold-accent)'
                        : c.status === 'paid' || c.status === 'in_review' ? 'var(--mystic-muted)'
                        : c.status === 'pending' ? 'var(--danger)'
                        : 'var(--ink-primary)',
                    }}
                  />

                  {/* Ticket body */}
                  <div className="flex-1 px-5 py-4 space-y-3">
                    {/* Row 1: Inquiry number + Status */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-mystic-muted shrink-0" />
                        <h4 className="font-cinzel text-sm font-bold text-ink-primary tracking-wide uppercase">
                          INQ-{c.inquiry_number || c.id}
                        </h4>
                      </div>
                      {getStatusBadge(c.status)}
                    </div>

                    {/* Row 2: Date · Time · Place */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-sans text-mystic-muted">
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>
                      <span className="hidden sm:inline">·</span>
                      <span className="hidden sm:inline">{c.birth_time}</span>
                      <span className="hidden sm:inline">·</span>
                      <span className="hidden sm:inline truncate max-w-[180px]">{c.birth_place}</span>
                    </div>

                    {/* Row 3: Description (2 lines) */}
                    <p className="text-ink-primary/70 font-sans text-xs leading-relaxed line-clamp-2">
                      {c.problem_desc}
                    </p>

                    {/* Row 4: Action */}
                    <div className="flex justify-end pt-1">
                      <Link
                        href={`/dashboard/consultations/${c.id}`}
                        className="nm-btn px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-mystic-muted hover:text-gold-text transition-all"
                      >
                        View Details & Remedies →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: CTA & Remedy Shipments Sidebar */}
        <div className="lg:col-span-4 space-y-8">

          {/* SECTION 4 — NEW INQUIRY CTA ROW */}
          <div className="space-y-4">
            <div 
              onClick={() => router.push('/dashboard/consultations/new')} 
              className="border border-ink-primary/20 bg-parchment-canvas rounded-xl p-6 flex items-center gap-4 cursor-pointer hover:opacity-95 transition-all group"
            >
              <div className="h-10 w-10 rounded-full bg-gold-accent text-white flex items-center justify-center shrink-0 shadow-md">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-cinzel text-xs font-bold text-ink-primary uppercase tracking-wide group-hover:text-gold-text transition-colors">New Inquiry</h4>
                <p className="text-[11px] font-sans text-mystic-muted">Submit birth details & voice note</p>
              </div>
            </div>

            <button 
              onClick={() => router.push('/dashboard/consultations/new')} 
              className="nm-btn-gold w-full py-4 text-xs font-bold tracking-widest uppercase transition-all"
            >
              Start new inquiry →
            </button>
          </div>

          {/* Sidebar Shipments */}
          <div className="space-y-4">
            <div className="text-[10px] font-sans font-bold uppercase tracking-widest text-mystic-muted">
              Remedy Shipments
            </div>

            <div className="nm-card p-6 space-y-6 bg-parchment-bg">
              {orders.length === 0 ? (
                <p className="text-center py-6 font-garamond text-sm text-mystic-muted italic">
                  No shipments found. recommended products ordered via WhatsApp will appear here with active tracking.
                </p>
              ) : (
                <div className="space-y-6">
                  {orders.map((o) => (
                    <div key={o.id} className="border-b border-gold-accent/10 last:border-0 pb-4 last:pb-0 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-display-h3 text-xs tracking-wider text-ink-primary">Order #{o.id}</span>
                        {getOrderStatusBadge(o.status)}
                      </div>

                      <div className="flex justify-between font-sans text-xs text-mystic-muted">
                        <span>{new Date(o.created_at).toLocaleDateString()}</span>
                        <span className="font-semibold text-mystic-muted">₹{o.total_amount}</span>
                      </div>

                      {o.tracking_number && (
                        <div className="border border-ink-primary/20 bg-parchment-canvas rounded-lg p-3 text-xs font-sans text-mystic-muted">
                          <span className="text-[9px] tracking-wider uppercase font-semibold block mb-1">DTDC Tracking</span>
                          <span className="font-mono text-ink-primary tracking-wide">{o.tracking_number}</span>
                        </div>
                      )}

                      {CANCELABLE_STATUSES.includes(o.status) && (
                        <button
                          onClick={() => handleCancelOrder(o.id)}
                          disabled={cancellingId === o.id}
                          className="nm-btn w-full py-2.5 text-[10px] font-bold uppercase tracking-wider text-danger hover:bg-danger/10 flex items-center justify-center gap-2 cursor-pointer transition-all border border-danger/20 rounded-lg mt-1"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          {cancellingId === o.id ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 5 — TESTIMONIAL STRIP */}
          {reviews.length > 0 && (
            <div className="space-y-4">
              <div className="text-[10px] font-sans font-bold uppercase tracking-widest text-mystic-muted">
                Seeker Reflections
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide w-full">
                {reviews.map((r) => (
                  <div key={r.id} className="nm-card p-6 space-y-2 w-48 shrink-0 flex flex-col justify-between h-44 bg-parchment-bg">
                    <div className="space-y-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={10}
                            className={r.rating >= s ? 'text-gold-accent fill-gold-accent' : 'text-mystic-muted/20'}
                          />
                        ))}
                      </div>
                      <p className="font-garamond italic text-[13px] text-ink-primary/80 leading-relaxed line-clamp-3">
                        "{r.comment}"
                      </p>
                    </div>
                    <span className="text-[9px] font-sans text-mystic-muted uppercase tracking-wider block border-t border-ink-primary/10 pt-2">
                      {r.user_email.split('@')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
