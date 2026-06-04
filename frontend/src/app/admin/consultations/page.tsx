'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../lib/api';
import {
  Sparkles, MessageSquare, Play, Square, Mic, Upload,
  Trash2, LogOut, CheckCircle, AlertCircle, ShoppingBag, Eye, ArrowLeft, ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import MysticalAudioPlayer from '../../../components/consultation/MysticalAudioPlayer';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  price: string;
  stock_count: number;
}

interface VoiceNote {
  file_url: string;
  duration: number | null;
}

interface RecommendedRemedy {
  product: { id: number; name: string };
  instructions: string;
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
  recommendations: RecommendedRemedy[];
  created_at: string;
}

export default function AdminConsultationsPage() {
  const router = useRouter();
  const { user, clearAuth, isAuthenticated } = useAuthStore();

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [activeConsultation, setActiveConsultation] = useState<Consultation | null>(null);
  const [tab, setTab] = useState<'pending' | 'in_review' | 'completed'>('pending');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [count, setCount] = useState(0);

  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [replyPreviewUrl, setReplyPreviewUrl] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [remedyInstructions, setRemedyInstructions] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user && !user.is_astrologer && !user.is_staff) {
      router.push('/dashboard');
      return;
    }

    fetchData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAuthenticated, user, router, currentPage]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [consultationsRes, productsRes] = await Promise.all([
        api.get(`/api/consultations/?page=${currentPage}`),
        api.get('/api/orders/products/')
      ]);

      if (consultationsRes.data.results) {
        setConsultations(consultationsRes.data.results);
        setCount(consultationsRes.data.count || 0);
      } else {
        setConsultations(consultationsRes.data);
        setCount(consultationsRes.data.length || 0);
      }

      const productList = Array.isArray(productsRes.data)
        ? productsRes.data
        : (productsRes.data.results || []);
      setProducts(productList.filter((p: any) => p.is_active));
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch data from the server.');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredConsultations = () => {
    if (tab === 'pending') {
      return consultations.filter(c => c.status === 'paid');
    }
    if (tab === 'in_review') {
      return consultations.filter(c => c.status === 'in_review');
    }
    return consultations.filter(c => c.status === 'replied' || c.status === 'closed');
  };

  const handleStartReview = async (consultation: Consultation) => {
    setActiveConsultation(consultation);
    setError('');
    setSuccessMsg('');
    setReplyFile(null);
    setReplyPreviewUrl(null);
    setSelectedProductIds([]);
    setRemedyInstructions('');

    if (consultation.status === 'paid') {
      try {
        await api.patch(`/api/consultations/${consultation.id}/status/`, {
          status: 'in_review'
        });

        setConsultations(prev =>
          prev.map(c => c.id === consultation.id ? { ...c, status: 'in_review' } : c)
        );

        setActiveConsultation(prev => prev ? { ...prev, status: 'in_review' } : null);
      } catch (err) {
        console.error("Failed to update status to in_review", err);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReplyFile(file);
      setReplyPreviewUrl(URL.createObjectURL(file));
    }
  };

  const startRecording = async () => {
    audioChunksRef.current = [];
    setReplyFile(null);
    setReplyPreviewUrl(null);
    setRecordingSeconds(0);
    setError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const file = new File([audioBlob], 'reply_recording.wav', { type: 'audio/wav' });
        setReplyFile(file);
        setReplyPreviewUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError('Could not access microphone for reply recording.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const toggleProductSelect = (pId: number) => {
    setSelectedProductIds(prev =>
      prev.includes(pId) ? prev.filter(id => id !== pId) : [...prev, pId]
    );
  };

  const submitAstrologerReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConsultation) return;
    if (!replyFile) {
      setError('Please record or upload a voice reply file.');
      return;
    }

    setSubmittingReply(true);
    setError('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('voice_reply', replyFile);
    formData.append('product_ids', JSON.stringify(selectedProductIds));
    formData.append('instructions', remedyInstructions);

    try {
      await api.post(`/api/consultations/${activeConsultation.id}/reply/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccessMsg('Reply and remedy recommendations saved successfully!');
      await fetchData();

      setActiveConsultation(null);
      setReplyFile(null);
      setReplyPreviewUrl(null);
      setSelectedProductIds([]);
      setRemedyInstructions('');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to submit voice reply.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const formatSeconds = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const totalPages = Math.ceil(count / 10) || 1;

  return (
    <div className="flex-1 bg-parchment-canvas min-h-screen text-ink-primary pb-16 font-sans">
      <div className="max-w-7xl w-full mx-auto px-6 py-12 sm:px-8 relative z-10 animate-stardust-reveal flex flex-col gap-8">
        <div className="constellation-layer" />

        {/* Header */}
        <header className="nm-card bg-parchment-bg p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-mystic-muted font-display-h3 text-[11px] tracking-widest uppercase">
              <Sparkles className="h-4 w-4" /> Celestial Sanctuary
            </div>
            <h1 className="font-display-h1 text-2xl text-ink-primary">Consultation Queue</h1>
            <p className="text-mystic-muted font-sans text-xs uppercase tracking-wider">Logged in: {user?.email}</p>
          </div>

          <div className="flex gap-4">
            <Link href="/admin" className="nm-btn px-5 py-3 text-[11px] font-bold text-mystic-muted hover:text-gold-text flex items-center gap-2 transition-all">
              <ArrowLeft className="h-4 w-4" /> Console Dashboard
            </Link>
          </div>
        </header>

        {error && (
          <div className="border border-danger/20 bg-danger/5 rounded-lg p-4 text-xs font-semibold text-danger flex items-center gap-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-danger" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="border border-success/20 bg-success/5 rounded-lg p-4 text-xs font-semibold text-success flex items-center gap-3">
            <CheckCircle className="h-4 w-4 shrink-0 text-success" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Queue List */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex rounded-xl border border-ink-primary/20 bg-parchment-canvas p-1 gap-1">
              <button
                onClick={() => { setTab('pending'); setActiveConsultation(null); }}
                className={`flex-1 rounded-lg py-2.5 text-[10px] sm:text-[11px] font-display-h3 tracking-wider uppercase transition-all cursor-pointer ${tab === 'pending' ? 'bg-[#c9a84c] text-white font-bold shadow-sm' : 'text-mystic-muted hover:text-ink-primary'
                  }`}
              >
                Paid
              </button>
              <button
                onClick={() => { setTab('in_review'); setActiveConsultation(null); }}
                className={`flex-1 rounded-lg py-2.5 text-[10px] sm:text-[11px] font-display-h3 tracking-wider uppercase transition-all cursor-pointer ${tab === 'in_review' ? 'bg-[#c9a84c] text-white font-bold shadow-sm' : 'text-mystic-muted hover:text-ink-primary'
                  }`}
              >
                Analyzing
              </button>
              <button
                onClick={() => { setTab('completed'); setActiveConsultation(null); }}
                className={`flex-1 rounded-lg py-2.5 text-[10px] sm:text-[11px] font-display-h3 tracking-wider uppercase transition-all cursor-pointer ${tab === 'completed' ? 'bg-[#c9a84c] text-white font-bold shadow-sm' : 'text-mystic-muted hover:text-ink-primary'
                  }`}
              >
                Replied
              </button>
            </div>

            {loading ? (
              <div className="nm-card bg-parchment-bg p-6 divide-y divide-ink-primary/10">
                {[1, 2].map((i) => (
                  <div key={i} className="py-4 space-y-4 animate-pulse">
                    <div className="flex justify-between items-center pb-2 border-b border-ink-primary/10">
                      <div className="h-4 bg-ink-primary/15 rounded w-16"></div>
                      <div className="h-4 bg-ink-primary/10 rounded w-24"></div>
                    </div>
                    <div className="h-4 bg-ink-primary/15 rounded w-full"></div>
                    <div className="h-4 bg-ink-primary/10 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : getFilteredConsultations().length === 0 ? (
              <div className="nm-card bg-parchment-bg p-8 text-center font-garamond text-mystic-muted italic">
                No consultations in this state on this page.
              </div>
            ) : (
              <div className="nm-card bg-parchment-bg overflow-hidden max-h-[60vh] overflow-y-auto pr-2">
                <div className="divide-y divide-ink-primary/10">
                  {getFilteredConsultations().map((c, index) => (
                    <div
                      key={c.id}
                      onClick={() => handleStartReview(c)}
                      className={`cursor-pointer p-6 relative transition-colors ${activeConsultation?.id === c.id
                          ? 'bg-gold-accent/10'
                          : index % 2 === 0 ? 'bg-transparent' : 'bg-ink-primary/5'
                        }`}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gold-accent"></div>

                      <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-gold-accent/15">
                        <span className="font-display-h3 text-[10px] text-gold-accent tracking-widest bg-ink-primary px-2 py-0.5 rounded-md">
                          Inquiry #{c.inquiry_number || c.id}
                        </span>
                        <span className="text-[10px] font-sans text-mystic-muted uppercase tracking-wider">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="text-xs font-sans text-ink-primary mb-3 flex items-center gap-1.5 font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-gold-accent"></span>
                        Client: {c.user_details ? `${c.user_details.first_name} ${c.user_details.last_name || ''}`.trim() : `User #${c.user}`}
                      </div>

                      <p className="text-ink-primary/80 font-sans text-xs line-clamp-2 mb-4 leading-relaxed">
                        {c.problem_desc}
                      </p>

                      <div className="flex justify-between items-center text-[10px] font-sans text-mystic-muted pt-3 border-t border-gold-accent/15 uppercase tracking-wider">
                        <div>
                          {c.date_of_birth} | {c.birth_time}
                        </div>
                        {c.voice_note && (
                          <span className="text-mystic-muted font-semibold flex items-center gap-1">
                            <Play className="h-2.5 w-2.5 fill-mystic-muted text-mystic-muted stroke-[1.5]" /> Voice Attached
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-ink-primary/10">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1 || loading}
                  className="border border-ink-primary/20 hover:bg-ink-primary/5 rounded px-4 py-2 text-xs disabled:opacity-40 flex items-center gap-1 cursor-pointer font-semibold text-mystic-muted transition-all"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <span className="text-xs font-sans text-ink-primary">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || loading}
                  className="border border-ink-primary/20 hover:bg-ink-primary/5 rounded px-4 py-2 text-xs disabled:opacity-40 flex items-center gap-1 cursor-pointer font-semibold text-mystic-muted transition-all"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right Active Review Workspace */}
          <div className="lg:col-span-7">
            {!activeConsultation ? (
              <div className="nm-card bg-parchment-bg p-12 text-center h-full flex flex-col justify-center items-center space-y-4">
                <div className="h-14 w-14 rounded-2xl border border-ink-primary/10 bg-parchment-canvas text-gold-accent flex items-center justify-center">
                  <Eye className="h-6 w-6 stroke-[1.25]" />
                </div>
                <h3 className="font-display-h3 text-base text-ink-primary">Select inquiry from queue</h3>
                <p className="text-mystic-muted font-garamond text-sm max-w-sm leading-relaxed">
                  Click any consultation card on the left panel to review birth chart configurations, play recordings, and submit voice responses.
                </p>
              </div>
            ) : (
              <div className="nm-card bg-parchment-bg p-8 space-y-6">

                <div className="flex justify-between items-center border-b border-gold-accent/15 pb-4">
                  <div>
                    <h3 className="font-display-h3 text-base text-ink-primary">Reviewing Inquiry #{activeConsultation.inquiry_number || activeConsultation.id}</h3>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-sans text-mystic-muted mt-1">
                      <span>
                        <strong>Client:</strong> {activeConsultation.user_details ? `${activeConsultation.user_details.first_name} ${activeConsultation.user_details.last_name || ''}`.trim() : `User #${activeConsultation.user}`}
                      </span>
                      {activeConsultation.user_details?.phone_number && (
                        <span>• <strong>Phone:</strong> {activeConsultation.user_details.phone_number}</span>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 text-[10px] rounded-lg tracking-wider uppercase font-semibold text-center ${activeConsultation.status === 'paid' ? 'badge-paid' :
                      activeConsultation.status === 'in_review' ? 'badge-in-review animate-pulse' :
                        'badge-closed'
                    }`}>
                    {activeConsultation.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="border border-ink-primary/20 bg-parchment-canvas rounded-lg p-4 grid grid-cols-3 gap-4 text-[11px] font-sans text-ink-primary">
                  <div>
                    <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-mystic-muted block mb-1">DOB</span>
                    <span className="font-semibold text-ink-primary text-sm">{activeConsultation.date_of_birth}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-mystic-muted block mb-1">Time</span>
                    <span className="font-semibold text-ink-primary text-sm">{activeConsultation.birth_time}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-mystic-muted block mb-1">Place</span>
                    <span className="font-semibold text-ink-primary text-sm truncate block">{activeConsultation.birth_place}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-mystic-muted block mb-1">Query Description</span>
                  <p className="border border-ink-primary/20 bg-parchment-canvas rounded-lg p-4 text-xs font-sans text-ink-primary leading-relaxed whitespace-pre-line">
                    {activeConsultation.problem_desc}
                  </p>
                </div>

                {activeConsultation.voice_note ? (
                  <div className="space-y-2">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-mystic-muted block mb-1">Seeker Voice Intake</span>
                    <MysticalAudioPlayer src={activeConsultation.voice_note.file_url} className="nm-dark-card" />
                  </div>
                ) : (
                  <div className="border border-ink-primary/20 bg-parchment-canvas rounded-lg p-4 text-xs font-sans text-mystic-muted text-center italic">
                    No voice note submitted by client.
                  </div>
                )}

                {activeConsultation.status === 'in_review' ? (
                  <form onSubmit={submitAstrologerReply} className="space-y-6 border-t border-gold-accent/15 pt-6">

                    <div className="space-y-2">
                      <label className="text-ink-primary/80 font-sans font-semibold text-[11px] uppercase tracking-wider block mb-1">Record Voice Response</label>

                      <div className="flex items-center gap-4 border border-ink-primary/20 bg-parchment-canvas rounded-lg p-4">
                        {isRecording ? (
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="flex h-12 w-12 items-center justify-center rounded-full text-white recording-ripple-active cursor-pointer shadow-lg"
                          >
                            <Square className="h-4 w-4 fill-white text-white" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={startRecording}
                            disabled={submittingReply}
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-accent hover:opacity-95 text-ink-primary disabled:opacity-50 transition-all duration-200 cursor-pointer shadow-md"
                          >
                            <Mic className="h-5 w-5 stroke-[2]" />
                          </button>
                        )}

                        <div className="flex-1 font-sans space-y-2">
                          <p className="text-xs font-semibold text-ink-primary">
                            {isRecording ? `Recording... ${formatSeconds(recordingSeconds)}` : "Record your voice advice"}
                          </p>
                          {replyPreviewUrl && (
                            <MysticalAudioPlayer src={replyPreviewUrl} className="nm-dark-card" />
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => document.getElementById('admin-upload-audio')?.click()}
                          disabled={submittingReply}
                          className="border border-ink-primary/20 hover:bg-ink-primary/5 rounded px-4 py-2.5 text-[10px] text-mystic-muted flex items-center justify-center gap-1 cursor-pointer font-bold transition-all"
                        >
                          <Upload className="h-4 w-4" /> Upload
                        </button>
                        <input
                          type="file"
                          id="admin-upload-audio"
                          accept="audio/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-ink-primary/80 font-sans font-semibold text-[11px] uppercase tracking-wider block mb-1">Recommend Remedy Products</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[25vh] overflow-y-auto border border-ink-primary/20 bg-parchment-canvas rounded-lg p-3">
                        {products.map((p) => {
                          const isSelected = selectedProductIds.includes(p.id);
                          return (
                            <div
                              key={p.id}
                              onClick={() => toggleProductSelect(p.id)}
                              className={`rounded-lg p-3 cursor-pointer flex justify-between items-center transition-all border ${isSelected
                                  ? 'border-gold-accent bg-gold-accent/10'
                                  : 'border-ink-primary/10 hover:bg-ink-primary/5'
                                }`}
                            >
                              <div className="font-sans text-xs flex-1 text-ink-primary">
                                <span className="font-semibold block">{p.name}</span>
                                <span className="text-mystic-muted font-bold">₹{p.price}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-mystic-muted font-medium">Stock: {p.stock_count}</span>
                                {isSelected && (
                                  <div className="h-5 w-5 bg-gold-accent text-white rounded-full flex items-center justify-center scale-100 transition-all duration-300">
                                    <Check className="h-3 w-3 stroke-[3]" />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="instructions" className="text-ink-primary/80 font-sans font-semibold text-[11px] uppercase tracking-wider block mb-1">Wearing Instructions & Mantras</label>
                      <textarea
                        id="instructions"
                        rows={3}
                        value={remedyInstructions}
                        onChange={(e) => setRemedyInstructions(e.target.value)}
                        className="w-full bg-parchment-canvas border border-ink-primary/20 rounded-md p-4 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-gold-accent transition-colors resize-y"
                        placeholder="Wear it on a yellow thread on Monday morning after chanting Surya Mantra..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingReply}
                      className="bg-gold-cta hover:bg-gold-cta/90 text-white font-sans text-xs font-bold w-full py-4 rounded-md tracking-widest uppercase cursor-pointer transition-colors"
                    >
                      Deliver Astrological Reply
                    </button>

                  </form>
                ) : (
                  <div className="nm-dark-card p-6 text-center font-sans text-xs text-bloom/90 leading-relaxed italic">
                    This inquiry is in state <span className="font-semibold text-gold-accent">"{activeConsultation.status}"</span>. Replies can only be uploaded when in state "in_review".
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
