'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { useToastStore } from '../../../store/toastStore';
import api from '../../../lib/api';
import { Sparkles, User as UserIcon, Phone, Mail, ArrowLeft, Save, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function SeekerProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, setAuth } = useAuthStore();
  const { addToast } = useToastStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await api.get('/api/auth/me/');
        const data = response.data;
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setPhoneNumber(data.phone_number || '');
        setUsername(data.username || '');
        setEmail(data.email || '');
      } catch (err: any) {
        console.error(err);
        addToast('Failed to fetch profile details.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await api.patch('/api/auth/me/', {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        username: username,
      });
      // Update state in Zustand store
      if (user) {
        setAuth(null, null, {
          ...user,
          first_name: response.data.first_name,
          last_name: response.data.last_name,
          phone_number: response.data.phone_number,
          username: response.data.username,
        });
      }
      addToast('Profile updated successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      addToast(err.response?.data?.error || 'Failed to save profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 max-w-2xl w-full mx-auto px-6 py-12 animate-pulse space-y-6">
        <div className="h-8 bg-bloom/30 rounded w-1/4"></div>
        <div className="nm-card p-8 space-y-6">
          <div className="h-12 bg-bloom/20 rounded"></div>
          <div className="h-12 bg-bloom/20 rounded"></div>
          <div className="h-12 bg-bloom/20 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-parchment-canvas min-h-screen text-ink-primary pb-16 font-sans">
      <div className="max-w-2xl w-full mx-auto px-6 py-12 relative z-10 animate-stardust-reveal">
        <div className="constellation-layer" />

        {/* Navigation */}
        <Link href="/dashboard" className="btn-text-link text-xs font-semibold text-mystic-muted hover:text-gold-text mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <header className="mb-8 pb-4 border-b border-gold-accent/15">
          <div className="flex items-center gap-2 text-mystic-muted font-display-h3 text-[11px] tracking-widest uppercase">
            <Sparkles className="h-4 w-4" /> Personal Coordinates
          </div>
          <h1 className="font-display-h1 text-3xl text-ink-primary">My Profile</h1>
        </header>

        <form onSubmit={handleSave} className="nm-card bg-parchment-bg p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-ink-primary/80 font-sans font-semibold text-[11px] uppercase tracking-wider block mb-1">First Name</label>
              <div className="nm-inset">
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-transparent px-4 py-2.5 text-ink-primary focus:outline-none transition-all text-sm font-medium"
                  placeholder="e.g. John"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-ink-primary/80 font-sans font-semibold text-[11px] uppercase tracking-wider block mb-1">Last Name</label>
              <div className="nm-inset">
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-transparent px-4 py-2.5 text-ink-primary focus:outline-none transition-all text-sm font-medium"
                  placeholder="e.g. Doe"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-ink-primary/80 font-sans font-semibold text-[11px] uppercase tracking-wider block mb-1">Username</label>
            <div className="nm-inset">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-transparent px-4 py-2.5 text-ink-primary focus:outline-none transition-all text-sm font-medium"
                placeholder="e.g. johndoe"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-ink-primary/80 font-sans font-semibold text-[11px] uppercase tracking-wider block mb-1">Phone Number</label>
            <div className="nm-inset relative flex items-center pl-4">
              <Phone className="h-4 w-4 text-mystic-muted shrink-0" />
              <input
                type="text"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-transparent pl-3 pr-4 py-2.5 text-ink-primary focus:outline-none transition-all text-sm font-medium"
                placeholder="e.g. +919999999999"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-ink-primary/80 font-sans font-semibold text-[11px] uppercase tracking-wider block mb-1">Email Address (Locked)</label>
            <div className="nm-inset relative flex items-center pl-4 opacity-65 cursor-not-allowed">
              <Mail className="h-4 w-4 text-mystic-muted shrink-0" />
              <input
                type="email"
                disabled
                value={email}
                className="w-full bg-transparent pl-3 pr-4 py-2.5 text-ink-primary/60 cursor-not-allowed focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gold-accent/15">
            <button
              type="submit"
              disabled={saving}
              className="nm-btn-gold w-full py-4 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Save className="h-4 w-4 text-white" />
              )}
              {saving ? 'Updating Coordinates...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
