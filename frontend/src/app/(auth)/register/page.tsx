'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../lib/api';
import { User, Phone, Sparkles, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpArray, setOtpArray] = useState<string[]>(Array(6).fill(''));
  const [step, setStep] = useState<'details' | 'otp'>('details');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer countdown
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [cooldown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!firstName || !lastName || !phoneNumber) {
      setError('First name, last name, and phone number are required.');
      return;
    }
    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      await api.post('/api/auth/send-otp/', {
        phone_number: phoneNumber,
        first_name: firstName,
        last_name: lastName,
      });
      setStep('otp');
      setCooldown(60);
      setInfoMessage(`An OTP code was sent to ${phoneNumber}.`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to request OTP code. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otpArray.join('');
    if (otpCode.length < 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/verify-otp/', {
        phone_number: phoneNumber,
        otp_code: otpCode,
      });
      const { user: loggedUser } = response.data;
      setAuth(null, null, loggedUser);
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    window.location.href = `${backendUrl}/api/auth/google/start/`;
  };

  // OTP Input handler
  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otpArray];
    newOtp[index] = value.substring(value.length - 1);
    setOtpArray(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (pasteData.length === 6 && !isNaN(Number(pasteData))) {
      const newOtp = pasteData.split('');
      setOtpArray(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  return (
    <div className="flex-1 bg-parchment-canvas flex flex-col items-center justify-center px-6 py-16 sm:px-8 relative z-10 animate-stardust-reveal">
      
      {/* Background Grid */}
      <div className="constellation-layer"></div>

      <div className="w-full max-w-md mb-6">
        <Link
          href="/"
          className="btn-text-link text-xs font-semibold text-mystic-muted hover:text-gold-text"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Home
        </Link>
      </div>

      <div className="w-full max-w-md space-y-6 nm-card bg-parchment-bg p-8 relative">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center nm-inset text-mystic-muted mb-3">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="font-display-h2 text-2xl tracking-widest text-ink-primary">
            Create Account
          </h2>
          <p className="mt-2 text-sm font-garamond text-mystic-muted italic">
            Join the Vedic Portal for your personalized consultation
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-danger/20 bg-danger/5 p-4 text-xs font-semibold text-danger whitespace-pre-line">
            <AlertCircle className="h-4 w-4 shrink-0 text-danger" />
            <span className="font-sans">{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="flex items-center gap-3 rounded-xl border border-mystic-muted/20 bg-mystic-muted/5 p-4 text-xs font-semibold text-mystic-muted">
            <Sparkles className="h-4 w-4 shrink-0 text-mystic-muted animate-pulse" />
            <span className="font-sans">{infoMessage}</span>
          </div>
        )}

        {step === 'details' ? (
          <form onSubmit={(e) => handleSendOtp(e)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="firstName" className="text-ink-primary/80 font-sans font-semibold text-[11px] uppercase tracking-wider block mb-1">
                  First Name
                </label>
                <div className="nm-inset relative flex items-center pl-3">
                  <User className="h-4 w-4 stroke-[1.5] text-mystic-muted" />
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-transparent pl-2.5 pr-4 py-2.5 text-ink-primary focus:outline-none transition-all text-sm font-medium"
                    placeholder="John"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="lastName" className="text-ink-primary/80 font-sans font-semibold text-[11px] uppercase tracking-wider block mb-1">
                  Last Name
                </label>
                <div className="nm-inset relative flex items-center pl-3">
                  <User className="h-4 w-4 stroke-[1.5] text-mystic-muted" />
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-transparent pl-2.5 pr-4 py-2.5 text-ink-primary focus:outline-none transition-all text-sm font-medium"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="phone" className="text-ink-primary/80 font-sans font-semibold text-[11px] uppercase tracking-wider block mb-1">
                Phone Number
              </label>
              <div className="nm-inset relative flex items-center pl-3">
                <Phone className="h-4 w-4 stroke-[1.5] text-mystic-muted" />
                <input
                  id="phone"
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-transparent pl-2.5 pr-4 py-2.5 text-ink-primary focus:outline-none transition-all text-sm font-medium"
                  placeholder="+919917632142"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="nm-btn-gold w-full py-4 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {loading ? 'Sending OTP...' : 'Send Verification Code'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="space-y-2">
              <label className="text-ink-primary/80 font-sans font-semibold text-[11px] uppercase tracking-wider text-center block w-full mb-1">
                Verification Code (OTP)
              </label>
              
              <div className="flex gap-2.5 justify-center py-2">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="w-12 h-14 nm-inset flex items-center justify-center">
                    <input
                      type="text"
                      maxLength={1}
                      value={otpArray[i]}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                      className="w-full h-full bg-transparent text-center font-mono text-xl text-ink-primary focus:outline-none transition-all duration-200"
                      placeholder="•"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-xs font-sans pt-2">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="btn-text-link text-xs text-mystic-muted hover:text-gold-text"
                >
                  Change register details
                </button>

                {cooldown > 0 ? (
                  <span className="text-mystic-muted">Resend in {cooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={loading}
                    className="btn-text-link text-xs font-semibold text-mystic-muted hover:text-gold-text"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="nm-btn-gold w-full py-4 text-xs font-bold tracking-widest uppercase cursor-pointer"
            >
              {loading ? 'Verifying...' : 'Verify & Create Account'}
            </button>
          </form>
        )}

        <div className="text-center my-4">
          <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-mystic-muted">Or register with</span>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="nm-btn w-full py-3.5 px-6 font-sans text-xs font-bold tracking-wider uppercase text-mystic-muted flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
            <path d="M12.24 10.285V13.4h6.887c-.648 2.41-2.519 4.13-5.136 4.13A5.72 5.72 0 0 1 8.2 11.8a5.72 5.72 0 0 1 5.79-5.735c1.47 0 2.82.528 3.882 1.487l2.44-2.44A9.13 9.13 0 0 0 13.99 2 9.17 9.17 0 0 0 4.8 11.2a9.17 9.17 0 0 0 9.19 9.2c5.07 0 9.21-3.666 9.21-9.2 0-.6-.05-1.17-.16-1.715H12.24Z" />
          </svg>
          Google Sign-up
        </button>

        <p className="text-center text-xs font-sans text-mystic-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-mystic-muted font-semibold hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
