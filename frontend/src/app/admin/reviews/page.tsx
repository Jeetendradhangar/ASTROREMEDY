'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../lib/api';
import Link from 'next/link';
import { ArrowLeft, Sparkles, LogOut, CheckCircle, AlertCircle, RefreshCw, Star, ThumbsUp, Trash2, Plus } from 'lucide-react';

interface Review {
  id: number;
  user: number;
  user_email: string;
  consultation: number;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // New states for review creation
  const [consultations, setConsultations] = useState<any[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/reviews/');
      const reviewList = Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || []);
      setReviews(reviewList);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch user testimonials.');
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultations = async () => {
    try {
      const response = await api.get('/api/consultations/');
      const items = Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || []);
      setConsultations(items);
    } catch (err) {
      console.error("Failed to load consultations", err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user && !user.is_astrologer && !user.is_staff) {
      router.push('/dashboard');
      return;
    }
    fetchReviews();
    fetchConsultations();
  }, [isAuthenticated, user, router]);

  const handleApprove = async (id: number) => {
    setUpdatingId(id);
    setError('');
    setSuccess('');
    try {
      await api.patch(`/api/reviews/${id}/`, { is_approved: true });
      setSuccess('Testimonial approved successfully.');
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_approved: true } : r))
      );
    } catch (err: any) {
      console.error(err);
      setError('Failed to approve review.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleHide = async (id: number) => {
    setUpdatingId(id);
    setError('');
    setSuccess('');
    try {
      await api.patch(`/api/reviews/${id}/`, { is_approved: false });
      setSuccess('Testimonial set to hidden state.');
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_approved: false } : r))
      );
    } catch (err: any) {
      console.error(err);
      setError('Failed to hide review.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this feedback?')) return;
    setUpdatingId(id);
    setError('');
    setSuccess('');
    try {
      await api.delete(`/api/reviews/${id}/`);
      setSuccess('Feedback deleted permanently.');
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      console.error(err);
      setError('Failed to delete review.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsultation || !newComment) {
      setError('Please select a consultation and write a comment.');
      return;
    }
    setSubmittingReview(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/api/reviews/', {
        consultation: parseInt(selectedConsultation),
        rating: newRating,
        comment: newComment,
        is_approved: false
      });
      setSuccess('Testimonial created successfully. Review and approve it below.');
      setNewComment('');
      setSelectedConsultation('');
      setNewRating(5);
      fetchReviews();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to create review.');
    } finally {
      setSubmittingReview(false);
    }
  };

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

  return (
    <div className="flex-1 bg-parchment-canvas min-h-screen text-ink-primary pb-16 font-sans">
      <div className="max-w-7xl w-full mx-auto px-6 py-12 sm:px-8 relative z-10 animate-stardust-reveal flex flex-col gap-8">
        <div className="constellation-layer" />

        {/* Header */}
        <header className="nm-card bg-parchment-bg p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-mystic-muted font-display-h3 text-[11px] tracking-widest uppercase">
              <Sparkles className="h-4 w-4" /> Moderation Console
            </div>
            <h1 className="font-display-h1 text-2xl text-ink-primary">User Testimonials</h1>
            <p className="text-mystic-muted font-sans text-xs uppercase tracking-wider">Astrologer Console</p>
          </div>

          <div className="flex gap-4">
            <Link href="/admin" className="nm-btn px-5 py-3 text-[11px] font-bold text-mystic-muted hover:text-gold-text flex items-center gap-2 transition-all">
              <ArrowLeft className="h-4 w-4" /> Consultation Queue
            </Link>
            <button onClick={handleLogout} className="nm-btn px-5 py-3 text-[11px] font-bold text-mystic-muted hover:text-gold-text flex items-center gap-2 transition-all cursor-pointer">
              <LogOut className="h-4 w-4" /> Logout Console
            </button>
          </div>
        </header>

        {error && (
          <div className="border border-danger/20 bg-danger/5 rounded-lg p-4 text-xs font-semibold text-danger flex items-center gap-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-danger" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="border border-success/20 bg-success/5 rounded-lg p-4 text-xs font-semibold text-success flex items-center gap-3">
            <CheckCircle className="h-4 w-4 shrink-0 text-success" />
            <span>{success}</span>
          </div>
        )}

        {/* Add Testimonial Form */}
        <div className="nm-card bg-parchment-bg p-6 space-y-4">
          <h3 className="font-display-h3 text-sm text-ink-primary tracking-widest uppercase flex items-center gap-2 border-b border-gold-accent/15 pb-2">
            <Plus className="h-4.5 w-4.5 text-gold-accent" /> Add Seeker Testimonial
          </h3>
          <form onSubmit={handleCreateReview} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-ink-primary/80 font-sans font-semibold text-[10px] uppercase tracking-wider block">
                Select Seeker Consultation
              </label>
              <select
                value={selectedConsultation}
                onChange={(e) => setSelectedConsultation(e.target.value)}
                className="w-full bg-parchment-canvas border border-ink-primary/20 rounded-md px-3 py-2 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-gold-accent"
              >
                <option value="">-- Choose Seeker/Inquiry --</option>
                {consultations.map((c) => (
                  <option key={c.id} value={c.id}>
                    Inquiry #{c.inquiry_number || c.id} — {c.user_details?.email || `User #${c.user}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-ink-primary/80 font-sans font-semibold text-[10px] uppercase tracking-wider block">
                Rating
              </label>
              <select
                value={newRating}
                onChange={(e) => setNewRating(parseInt(e.target.value))}
                className="w-full bg-parchment-canvas border border-ink-primary/20 rounded-md px-3 py-2 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-gold-accent"
              >
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>

            <div className="md:col-span-4 space-y-1.5">
              <label className="text-ink-primary/80 font-sans font-semibold text-[10px] uppercase tracking-wider block">
                Feedback Comment
              </label>
              <input
                type="text"
                placeholder="e.g. The voice reply was extremely accurate..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full bg-parchment-canvas border border-ink-primary/20 rounded-md px-3 py-2 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-gold-accent"
                required
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submittingReview}
                className="w-full bg-gold-cta hover:bg-gold-cta/90 text-white font-sans text-xs font-bold py-2.5 rounded-md uppercase tracking-wider transition-colors cursor-pointer"
              >
                {submittingReview ? 'Creating...' : 'Create Review'}
              </button>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="nm-card bg-parchment-bg p-6 divide-y divide-ink-primary/10">
            {[1, 2].map((i) => (
              <div key={i} className="py-6 flex flex-col md:flex-row gap-6 justify-between animate-pulse">
                <div className="space-y-3 flex-1">
                  <div className="h-4 bg-ink-primary/15 rounded w-24"></div>
                  <div className="h-6 bg-ink-primary/20 rounded w-5/6"></div>
                  <div className="h-4 bg-ink-primary/15 rounded w-1/3"></div>
                </div>
                <div className="h-10 bg-ink-primary/20 rounded w-32 shrink-0 self-center"></div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="nm-card bg-parchment-bg p-12 text-center space-y-4">
            <Star className="h-10 w-10 text-mystic-muted mx-auto" />
            <h3 className="font-display-h3 text-base text-ink-primary">No testimonials found</h3>
            <p className="text-mystic-muted font-garamond text-sm">When seekers leave review submissions on their completed consultations, they will appear here.</p>
          </div>
        ) : (
          <div className="nm-card bg-parchment-bg overflow-hidden">
            <div className="divide-y divide-ink-primary/10">
              {reviews.map((r, index) => (
                <div 
                  key={r.id} 
                  className={`p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center transition-colors ${
                    index % 2 === 0 ? 'bg-transparent' : 'bg-ink-primary/5'
                  }`}
                >
                  
                  <div className="space-y-3 flex-1 w-full">
                    <div className="flex items-center gap-4 pb-2 border-b border-ink-primary/10 w-full">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            className={r.rating >= s ? 'text-gold-accent fill-gold-accent' : 'text-mystic-muted/30'}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-sans text-mystic-muted uppercase tracking-wider">
                        Submitted: {new Date(r.created_at).toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-sans font-bold uppercase rounded-md tracking-wider ${
                        r.is_approved ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                      }`}>
                        {r.is_approved ? 'Approved' : 'Hidden'}
                      </span>
                    </div>

                    <p className="font-garamond italic text-base text-ink-primary leading-relaxed max-w-3xl">
                      "{r.comment}"
                    </p>

                    <div className="text-xs font-sans text-mystic-muted flex gap-3">
                      <span>Seeker Email: <strong>{r.user_email}</strong></span>
                      <span>Consultation Ref: <strong>Inquiry #{r.consultation}</strong></span>
                    </div>
                  </div>

                  {/* Moderation Actions */}
                  <div className="flex gap-3 w-full md:w-auto shrink-0 md:self-center">
                    {r.is_approved ? (
                      <button
                        onClick={() => handleHide(r.id)}
                        disabled={updatingId === r.id}
                        className="flex-1 md:flex-none border border-danger/35 hover:bg-danger/5 text-danger text-xs font-bold py-2 px-4 rounded transition-colors cursor-pointer uppercase tracking-wider"
                      >
                        Hide
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApprove(r.id)}
                        disabled={updatingId === r.id}
                        className="flex-1 md:flex-none bg-gold-cta hover:bg-gold-cta/90 text-white text-xs font-bold py-2 px-4 rounded transition-colors cursor-pointer uppercase tracking-wider flex items-center justify-center gap-1.5"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" /> Approve
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(r.id)}
                      disabled={updatingId === r.id}
                      className="flex-1 md:flex-none border border-danger/35 hover:bg-danger/5 text-danger text-xs font-bold py-2 px-4 rounded transition-colors cursor-pointer uppercase tracking-wider flex items-center justify-center gap-1.5"
                      title="Delete permanently"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
