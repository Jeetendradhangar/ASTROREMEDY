'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../store/authStore';
import api from '../../../../lib/api';
import { ArrowLeft, Sparkles, Send, AlertCircle, Moon } from 'lucide-react';
import Link from 'next/link';

export default function NewConsultationPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [dob, setDob] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [desc, setDesc] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dob || !time || !place || !desc) {
      setError('All fields are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/consultations/', {
        date_of_birth: dob,
        birth_time: time,
        birth_place: place,
        problem_desc: desc
      });

      const newId = response.data.id;
      router.push(`/dashboard/consultations/${newId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to submit birth chart inquiry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-parchment-canvas min-h-screen text-ink-primary pb-16 font-sans">
      <div className="max-w-2xl w-full mx-auto px-6 py-12 sm:px-8 relative z-10 animate-stardust-reveal">
        {/* Navigation */}
        <Link
          href="/dashboard"
          className="btn-text-link text-xs font-semibold text-mystic-muted hover:text-gold-text mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Cancel & Return
        </Link>

        <div className="nm-card p-8 relative bg-parchment-bg">
          <div className="mb-8 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center border border-ink-primary/10 rounded-xl text-mystic-muted bg-parchment-canvas mb-4">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="font-display-h2 text-2xl tracking-widest text-ink-primary">Ask a Seer</h2>
            <p className="text-mystic-muted font-garamond text-base mt-2 italic">
              Provide precise birth coordinates. Our panel reviews planetary alignments.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-danger/20 bg-danger/5 p-4 text-xs font-semibold text-danger">
              <AlertCircle className="h-5 w-5 shrink-0 text-danger" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label htmlFor="dob" className="text-ink-primary/80 font-sans font-semibold text-[11px] uppercase tracking-wider block mb-1">
                  Date of Birth
                </label>
                <div className="nm-inset w-full">
                  <input
                    id="dob"
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-transparent px-4 py-3 text-ink-primary focus:outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="time" className="text-ink-primary/80 font-sans font-semibold text-[11px] uppercase tracking-wider block mb-1">
                  Time of Birth
                </label>
                <div className="nm-inset w-full">
                  <input
                    id="time"
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-transparent px-4 py-3 text-ink-primary focus:outline-none text-sm font-medium"
                  />
                </div>
              </div>

            </div>

            <div className="space-y-2">
              <label htmlFor="place" className="text-ink-primary/80 font-sans font-semibold text-[11px] uppercase tracking-wider block mb-1">
                Place of Birth (City, Country)
              </label>
              <div className="nm-inset w-full">
                <input
                  id="place"
                  type="text"
                  required
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  className="w-full bg-transparent px-4 py-3 text-ink-primary focus:outline-none text-sm font-medium"
                  placeholder="Mumbai, India"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="desc" className="text-ink-primary/80 font-sans font-semibold text-[11px] uppercase tracking-wider block mb-1">
                Your Problem Description or Question
              </label>
              <div className="nm-inset w-full">
                <textarea
                  id="desc"
                  rows={4}
                  required
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full bg-transparent p-4 text-ink-primary focus:outline-none text-sm font-medium resize-y"
                  placeholder="Please elaborate on career prospects, relationship alignment, health remedies, or any specific planetary concerns..."
                />
              </div>
            </div>

            <div className="border border-ink-primary/10 bg-parchment-canvas rounded-xl p-5 text-xs font-sans text-mystic-muted leading-relaxed">
              <span className="text-mystic-muted font-semibold uppercase tracking-wider text-[10px] block mb-1">What happens next?</span>
              After creating the inquiry, you will be redirected to upload an optional voice note describing your question and submit payment. Certified astrologers reply within 24–48 hours.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="nm-btn-gold w-full py-4 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="h-4 w-4" /> {loading ? 'Submitting...' : 'Proceed to Voice & Payment'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
