'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../store/authStore';
import api from '../../../../lib/api';
import VoiceUploader from '../../../../components/consultation/VoiceUploader';
import {
  ArrowLeft, Sparkles, Calendar, MapPin, Clock, MessageSquare,
  Play, ShoppingBag, Send, Star, AlertCircle, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import MysticalAudioPlayer from '../../../../components/consultation/MysticalAudioPlayer';

interface Product {
  id: number;
  name: string;
  price: string;
}

interface RecommendedRemedy {
  product: Product;
  instructions: string;
}

interface VoiceNote {
  file_url: string;
  duration: number | null;
}

interface VoiceReply {
  file_url: string;
  duration: number | null;
  astrologer: number;
}

interface UserDetails {
  id: number;
  email: string;
  username: string;
  phone_number: string | null;
  profile_photo: string | null;
  first_name: string;
  last_name: string;
}

interface Consultation {
  id: number;
  inquiry_number: number | null;
  user: number;
  user_details?: UserDetails;
  date_of_birth: string;
  birth_time: string;
  birth_place: string;
  problem_desc: string;
  status: 'pending' | 'paid' | 'in_review' | 'replied' | 'closed';
  amount_paid: string | null;
  voice_note: VoiceNote | null;
  voice_reply: VoiceReply | null;
  recommendations: RecommendedRemedy[];
  created_at: string;
}



export default function ConsultationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const consultationId = parseInt(resolvedParams.id);

  const { isAuthenticated } = useAuthStore();

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [paying, setPaying] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const fetchConsultation = async () => {
    try {
      const response = await api.get(`/api/consultations/${consultationId}/`);
      setConsultation(response.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load consultation details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchConsultation();
  }, [isAuthenticated, consultationId, router]);

  const handleCheckoutPayment = async () => {
    setPaying(true);
    setError('');
    try {
      const orderRes = await api.post('/api/payments/create-order/', {
        consultation_id: consultationId,
        amount: 50000
      });

      const { razorpay_order_id } = orderRes.data;

      const verifyRes = await api.post('/api/payments/verify/', {
        consultation_id: consultationId,
        razorpay_order_id,
        razorpay_payment_id: `pay_${Math.random().toString(36).substring(2, 11)}`,
        razorpay_signature: 'mock_signature'
      });

      if (verifyRes.data.status === 'success') {
        await fetchConsultation();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Payment gateway failed.');
    } finally {
      setPaying(false);
    }
  };

  const handleOrderRemedy = async (productId: number) => {
    try {
      const response = await api.get(`/api/orders/whatsapp-link/?product_id=${productId}`);
      if (response.data.whatsapp_url) {
        window.open(response.data.whatsapp_url, '_blank');
      }
    } catch (err) {
      console.error("Failed to generate WhatsApp order link", err);
      alert("Failed to create WhatsApp link. Please contact administrator manually.");
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    try {
      await api.post('/api/reviews/', {
        consultation: consultationId,
        rating,
        comment
      });
      setReviewSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setReviewError(err.response?.data?.error || 'Failed to submit review.');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-parchment-canvas max-w-4xl w-full mx-auto px-6 py-12 sm:px-8 space-y-8 animate-pulse">
        <div className="h-6 bg-ink-primary/15 rounded w-24"></div>
        <div className="nm-card p-6 space-y-4 bg-parchment-bg">
          <div className="h-5 bg-ink-primary/15 rounded w-1/4"></div>
          <div className="h-8 bg-ink-primary/20 rounded w-1/2"></div>
        </div>
        <div className="nm-card p-8 space-y-6 bg-parchment-bg">
          <div className="h-6 bg-ink-primary/15 rounded w-1/3 border-b border-ink-primary/10 pb-2"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-16 bg-ink-primary/10 rounded-xl"></div>
            <div className="h-16 bg-ink-primary/10 rounded-xl"></div>
            <div className="h-16 bg-ink-primary/10 rounded-xl"></div>
          </div>
          <div className="h-24 bg-ink-primary/10 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="flex-1 bg-parchment-canvas max-w-4xl mx-auto px-6 py-12 text-center z-10 relative animate-stardust-reveal flex items-center justify-center">
        <div className="nm-card p-8 space-y-6 w-full max-w-md bg-parchment-bg">
          <div className="inline-flex h-16 w-16 items-center justify-center border border-danger/25 bg-danger/5 rounded-2xl text-danger mb-2">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="font-display-h3 text-lg text-ink-primary font-bold">Inquiry Not Found</h2>
          <p className="text-mystic-muted font-garamond text-sm leading-relaxed italic">
            This consultation request does not exist or you do not have permission to view it.
          </p>
          <div className="pt-2">
            <Link href="/dashboard" className="nm-btn px-5 py-3 text-xs font-bold text-mystic-muted hover:text-gold-text flex items-center justify-center gap-2 mx-auto w-fit" style={{ textDecoration: 'none' }}>
              <ArrowLeft className="h-4 w-4" /> Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-parchment-canvas min-h-screen text-ink-primary pb-16 font-sans">
      <div className="max-w-4xl w-full mx-auto px-6 py-12 sm:px-8 relative z-10 animate-stardust-reveal">
        {/* Navigation */}
        <Link
          href="/dashboard"
          className="btn-text-link text-xs font-semibold text-mystic-muted hover:text-gold-text mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Dashboard
        </Link>

        {error && (
          <div className="mb-8 border border-danger/20 bg-danger/5 rounded-lg p-4 text-xs font-semibold text-danger">
            {error}
          </div>
        )}

        {/* Main Details Panel */}
        <div className="space-y-8">

          {/* Status Card */}
          <div className="nm-card p-6 flex flex-col gap-6 relative overflow-hidden bg-parchment-bg">
            <div className="flex flex-row justify-between items-center w-full">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-display-h3 text-[10px] text-mystic-muted tracking-widest uppercase">Request Details</span>
                  <span className="text-[10px] font-sans text-mystic-muted uppercase tracking-wider">Submitted {new Date(consultation.created_at).toLocaleDateString()}</span>
                </div>
                <h2 className="font-display-h2 text-2xl text-ink-primary">Inquiry #{consultation.inquiry_number || consultation.id}</h2>
              </div>
            </div>

            <div className="w-full">
              {consultation.status === 'pending' && (
                <button
                  onClick={handleCheckoutPayment}
                  disabled={paying}
                  className="nm-btn-gold w-full py-4 text-xs font-bold tracking-widest uppercase cursor-pointer flex items-center justify-center gap-2"
                >
                  {paying ? 'Routing to Razorpay...' : 'Activate for ₹500.00'}
                </button>
              )}

              {consultation.status === 'paid' && (
                <div className="nm-inset p-4.5 bg-parchment-canvas rounded-xl flex items-start gap-3 border border-success/10">
                  <div className="p-2 bg-success/10 text-success rounded-lg shrink-0 mt-0.5">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-sans text-success uppercase tracking-wider">Awaiting Seer Review</h4>
                    <p className="text-[11px] font-sans text-mystic-muted mt-1 leading-relaxed">
                      Your details are locked. A certified Vedic expert is currently analyzing your birth chart and planetary transitions.
                    </p>
                  </div>
                </div>
              )}

              {consultation.status === 'in_review' && (
                <div className="nm-inset p-4.5 bg-parchment-canvas rounded-xl flex items-start gap-3 border border-mystic-muted/10">
                  <div className="p-2 bg-mystic-muted/10 text-mystic-muted rounded-lg shrink-0 mt-0.5">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-sans text-mystic-muted uppercase tracking-wider">Seer Analyzing Chart</h4>
                    <p className="text-[11px] font-sans text-mystic-muted mt-1 leading-relaxed">
                      The astrologer is currently recording your personalized voice reply. Your remedies and cosmic reading will be ready soon.
                    </p>
                  </div>
                </div>
              )}

              {consultation.status === 'replied' && (
                <div className="nm-inset p-4.5 bg-parchment-canvas rounded-xl flex items-start gap-3 border border-gold-accent/15">
                  <div className="p-2 bg-gold-accent/10 text-gold-text rounded-lg shrink-0 mt-0.5">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-sans text-gold-text uppercase tracking-wider">Advice Delivered</h4>
                    <p className="text-[11px] font-sans text-mystic-muted mt-1 leading-relaxed">
                      Vedic analysis is complete! Scroll down to listen to your voice note and order your recommended authenticated remedies.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Birth Chart Data */}
          <div className="nm-card p-8 bg-parchment-bg">
            <h3 className="font-display-h3 text-base text-ink-primary mb-6 pb-2 border-b border-gold-accent/15 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-mystic-muted" />
              Birth Details & Problem
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="border border-ink-primary/20 bg-parchment-canvas rounded-lg p-4 flex flex-col gap-1">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-mystic-muted">Date of Birth</span>
                <span className="text-sm font-semibold text-ink-primary flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-mystic-muted" /> {consultation.date_of_birth}
                </span>
              </div>
              <div className="border border-ink-primary/20 bg-parchment-canvas rounded-lg p-4 flex flex-col gap-1">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-mystic-muted">Time of Birth</span>
                <span className="text-sm font-semibold text-ink-primary flex items-center gap-2">
                  <Clock className="h-4 w-4 text-mystic-muted" /> {consultation.birth_time}
                </span>
              </div>
              <div className="border border-ink-primary/20 bg-parchment-canvas rounded-lg p-4 flex flex-col gap-1">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-mystic-muted">Place of Birth</span>
                <span className="text-sm font-semibold text-ink-primary flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-mystic-muted" /> {consultation.birth_place}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-mystic-muted block mb-1">Inquiry Description</span>
              <p className="border border-ink-primary/20 bg-parchment-canvas rounded-lg p-5 text-ink-primary font-sans text-sm leading-relaxed whitespace-pre-line">
                {consultation.problem_desc}
              </p>
            </div>
          </div>

          {/* User Voice Note Section */}
          {consultation.status !== 'pending' && (
            <div className="space-y-3">
              {!consultation.voice_note ? (
                <VoiceUploader
                  consultationId={consultation.id}
                  onUploadSuccess={fetchConsultation}
                  apiClient={api}
                />
              ) : (
                <div className="nm-card p-6 bg-parchment-bg">
                  <h3 className="font-display-h3 text-base text-ink-primary mb-4 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-mystic-muted" />
                    Your Voice Clarification
                  </h3>
                  <MysticalAudioPlayer src={consultation.voice_note.file_url} className="nm-dark-card" />
                </div>
              )}
            </div>
          )}

          {/* Astrologer Response (replied status) */}
          {consultation.status === 'replied' && (
            <div className="space-y-8">

              {/* Audio Response */}
              {consultation.voice_reply && (
                <div className="nm-card p-8 bg-parchment-bg">
                  <h3 className="font-display-h3 text-base text-gold-text mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-gold-accent fill-gold-accent" />
                    Seer Voice Advice
                  </h3>
                  <p className="font-garamond text-sm text-mystic-muted mb-6 italic">
                    Please listen to this personalized birth chart analysis and remedy instruction.
                  </p>
                  <div className="w-full">
                    <MysticalAudioPlayer src={consultation.voice_reply.file_url} className="nm-dark-card border border-gold-accent/10" />
                  </div>
                </div>
              )}

              {/* Remedies Recommended */}
              {consultation.recommendations && consultation.recommendations.length > 0 && (
                <div className="nm-card p-8 bg-parchment-bg">
                  <h3 className="font-display-h3 text-base text-ink-primary mb-6 flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-mystic-muted" />
                    Prescribed Remedies
                  </h3>
                  <div className="space-y-6">
                    {consultation.recommendations.map((rec, index) => (
                      <div key={index} className="border border-ink-primary/20 bg-parchment-canvas rounded-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-baseline gap-3">
                            <h4 className="font-display-h3 text-sm text-ink-primary tracking-wide">{rec.product.name}</h4>
                            <span className="text-xs font-bold text-mystic-muted">
                              ₹{rec.product.price}
                            </span>
                          </div>
                          <p className="font-sans text-xs text-mystic-muted leading-relaxed">
                            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-mystic-muted block mb-1">Wearing Instructions</span>
                            {rec.instructions || 'No specific instructions provided.'}
                          </p>
                        </div>

                        <button
                          onClick={() => handleOrderRemedy(rec.product.id)}
                          className="nm-btn-gold px-5 py-3 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer shrink-0 w-full md:w-auto"
                        >
                          <ShoppingBag className="h-4 w-4" /> Order via WhatsApp
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Review Card */}
              {!reviewSubmitted ? (
                <div className="nm-card p-8 bg-parchment-bg">
                  <h3 className="font-display-h3 text-base text-ink-primary mb-2 flex items-center gap-2">
                    <Star className="h-5 w-5 text-mystic-muted" />
                    Leave a Testimonial
                  </h3>
                  <p className="font-garamond text-sm text-mystic-muted mb-6 italic">
                    Sharing your experience helps other seekers trust our astrological guidance.
                  </p>

                  {reviewError && (
                    <div className="mb-6 border border-danger/20 bg-danger/5 rounded-lg p-4 text-xs font-semibold text-danger">
                      {reviewError}
                    </div>
                  )}

                  <form onSubmit={submitReview} className="space-y-6">
                    <div className="flex items-center gap-3">
                      <span className="text-ink-primary/80 font-sans font-semibold text-[11px] uppercase tracking-wider block">Rating:</span>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((stars) => (
                          <button
                            key={stars}
                            type="button"
                            onClick={() => setRating(stars)}
                            className="transition-transform hover:scale-120 cursor-pointer"
                          >
                            <Star
                              className={`h-6 w-6 transition-all ${rating >= stars
                                  ? 'text-gold-accent fill-gold-accent drop-shadow-[0_0_4px_rgba(201,168,76,0.3)]'
                                  : 'text-mystic-muted/30'
                                }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="comment" className="text-ink-primary/80 font-sans font-semibold text-[11px] uppercase tracking-wider block mb-1">
                        Feedback Comments
                      </label>
                      <div className="nm-inset w-full">
                        <textarea
                          id="comment"
                          rows={3}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="w-full bg-transparent p-4 text-ink-primary focus:outline-none text-sm font-medium resize-y"
                          placeholder="The voice reply was very deep, and the remedies really helped..."
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="nm-btn-gold px-6 py-3.5 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="h-4 w-4" /> Submit Testimonial
                    </button>
                  </form>
                </div>
              ) : (
                <div className="nm-card p-8 text-center space-y-4 bg-parchment-bg">
                  <Star className="h-10 w-10 text-gold-accent fill-gold-accent mx-auto animate-pulse" />
                  <h4 className="font-display-h3 text-base text-mystic-muted">Testimonial Submitted</h4>
                  <p className="font-garamond text-sm text-mystic-muted max-w-md mx-auto leading-relaxed">
                    Your feedback was submitted and is awaiting administrator moderation. Thank you for your review.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
