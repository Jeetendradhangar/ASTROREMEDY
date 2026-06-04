'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, MessageSquare, ShieldCheck, Heart, ArrowRight, Play, Star, ExternalLink, Mic, Clock, Package, Send } from 'lucide-react';
import api from '../lib/api';

interface Review {
  id: number;
  user_email: string;
  rating: number;
  comment: string;
  is_approved?: boolean;
}

// ── Inline SVG mascot: a little Vedic sage character (paper-scroll style, WROTH-inspired) ──
const SageMascotLeft = () => (
  <svg width="110" height="140" viewBox="0 0 110 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="select-none">
    {/* Body - scroll/robe */}
    <ellipse cx="55" cy="105" rx="32" ry="30" fill="#d4edda" stroke="#2d6a4f" strokeWidth="2" />
    {/* Arms */}
    <path d="M23 100 Q10 95 8 82" stroke="#2d6a4f" strokeWidth="3" strokeLinecap="round" fill="none" />
    <path d="M87 100 Q100 95 102 82" stroke="#2d6a4f" strokeWidth="3" strokeLinecap="round" fill="none" />
    {/* Scroll held in left hand */}
    <rect x="2" y="74" width="16" height="22" rx="3" fill="#fff" stroke="#2d6a4f" strokeWidth="1.5" strokeDasharray="3 2" />
    <line x1="6" y1="80" x2="14" y2="80" stroke="#2d6a4f" strokeWidth="1" />
    <line x1="6" y1="84" x2="14" y2="84" stroke="#2d6a4f" strokeWidth="1" />
    <line x1="6" y1="88" x2="11" y2="88" stroke="#2d6a4f" strokeWidth="1" />
    {/* Head */}
    <circle cx="55" cy="62" r="26" fill="#fffbe6" stroke="#2d6a4f" strokeWidth="2" />
    {/* Turban */}
    <ellipse cx="55" cy="42" rx="22" ry="10" fill="#52b788" stroke="#2d6a4f" strokeWidth="1.5" />
    <ellipse cx="55" cy="38" rx="14" ry="7" fill="#40916c" stroke="#2d6a4f" strokeWidth="1.5" />
    {/* Turban jewel */}
    <circle cx="55" cy="35" r="3" fill="#f4a261" stroke="#2d6a4f" strokeWidth="1" />
    {/* Eyes */}
    <circle cx="47" cy="63" r="3.5" fill="#fff" stroke="#2d6a4f" strokeWidth="1.5" />
    <circle cx="63" cy="63" r="3.5" fill="#fff" stroke="#2d6a4f" strokeWidth="1.5" />
    <circle cx="48" cy="64" r="1.5" fill="#1b4332" />
    <circle cx="64" cy="64" r="1.5" fill="#1b4332" />
    {/* Smile */}
    <path d="M48 72 Q55 78 62 72" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Bindi */}
    <circle cx="55" cy="57" r="2" fill="#e63946" />
    {/* Stars floating */}
    <text x="88" y="30" fontSize="12" fill="#f4a261">✦</text>
    <text x="10" y="45" fontSize="9" fill="#52b788">✦</text>
    <text x="95" y="55" fontSize="7" fill="#2d6a4f">✦</text>
  </svg>
);

const SageMascotRight = () => (
  <svg width="100" height="130" viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="select-none">
    {/* Body */}
    <ellipse cx="50" cy="98" rx="28" ry="26" fill="#b7e4c7" stroke="#2d6a4f" strokeWidth="2" />
    {/* Arms */}
    <path d="M22 93 Q12 88 10 76" stroke="#2d6a4f" strokeWidth="3" strokeLinecap="round" fill="none" />
    <path d="M78 93 Q88 88 90 76" stroke="#2d6a4f" strokeWidth="3" strokeLinecap="round" fill="none" />
    {/* Star wand right hand */}
    <line x1="90" y1="76" x2="98" y2="58" stroke="#2d6a4f" strokeWidth="2" />
    <text x="92" y="56" fontSize="14" fill="#f4a261">★</text>
    {/* Head */}
    <circle cx="50" cy="56" r="24" fill="#fffbe6" stroke="#2d6a4f" strokeWidth="2" />
    {/* Turban */}
    <ellipse cx="50" cy="38" rx="20" ry="9" fill="#74c69d" stroke="#2d6a4f" strokeWidth="1.5" />
    <ellipse cx="50" cy="34" rx="12" ry="6" fill="#52b788" stroke="#2d6a4f" strokeWidth="1.5" />
    <circle cx="50" cy="31" r="2.5" fill="#e63946" stroke="#2d6a4f" strokeWidth="1" />
    {/* Eyes - happy squint */}
    <path d="M42 56 Q44 53 46 56" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M54 56 Q56 53 58 56" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Big smile */}
    <path d="M42 64 Q50 72 58 64" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Bindi */}
    <circle cx="50" cy="51" r="1.8" fill="#e63946" />
    {/* Floating elements */}
    <text x="4" y="40" fontSize="11" fill="#f4a261">✦</text>
    <text x="80" y="20" fontSize="9" fill="#52b788">✦</text>
  </svg>
);

const PlanetIllustration = () => (
  <svg width="320" height="220" viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="select-none w-full max-w-xs mx-auto">
    {/* Sky bg */}
    <rect width="320" height="220" rx="20" fill="#d8f3dc" />
    {/* Hills */}
    <ellipse cx="80" cy="200" rx="100" ry="55" fill="#52b788" />
    <ellipse cx="250" cy="210" rx="110" ry="60" fill="#40916c" />
    <ellipse cx="160" cy="215" rx="180" ry="50" fill="#2d6a4f" />
    {/* Sun/Moon */}
    <circle cx="260" cy="55" r="32" fill="#fffbe6" stroke="#b7e4c7" strokeWidth="2" />
    <text x="245" y="62" fontSize="22" textAnchor="middle">☽</text>
    {/* Stars */}
    <text x="40" y="35" fontSize="14" fill="#40916c">✦</text>
    <text x="150" y="25" fontSize="10" fill="#52b788">✦</text>
    <text x="200" y="50" fontSize="8" fill="#2d6a4f">✦</text>
    <text x="70" y="70" fontSize="10" fill="#74c69d">✦</text>
    {/* Birth chart circle */}
    <circle cx="160" cy="105" r="50" fill="white" fillOpacity="0.85" stroke="#2d6a4f" strokeWidth="1.5" strokeDasharray="5 3" />
    <circle cx="160" cy="105" r="35" fill="none" stroke="#52b788" strokeWidth="1" strokeDasharray="3 3" />
    {/* Chart lines */}
    <line x1="160" y1="55" x2="160" y2="155" stroke="#2d6a4f" strokeWidth="0.8" strokeDasharray="3 2" />
    <line x1="110" y1="105" x2="210" y2="105" stroke="#2d6a4f" strokeWidth="0.8" strokeDasharray="3 2" />
    <line x1="125" y1="70" x2="195" y2="140" stroke="#40916c" strokeWidth="0.8" strokeDasharray="3 2" />
    <line x1="125" y1="140" x2="195" y2="70" stroke="#40916c" strokeWidth="0.8" strokeDasharray="3 2" />
    {/* Planet dots */}
    <circle cx="160" cy="68" r="5" fill="#f4a261" stroke="#2d6a4f" strokeWidth="1" />
    <circle cx="196" cy="82" r="4" fill="#e63946" stroke="#2d6a4f" strokeWidth="1" />
    <circle cx="196" cy="128" r="4" fill="#52b788" stroke="#2d6a4f" strokeWidth="1" />
    <circle cx="160" cy="142" r="5" fill="#4361ee" stroke="#2d6a4f" strokeWidth="1" />
    <circle cx="124" cy="128" r="3.5" fill="#7b2d8b" stroke="#2d6a4f" strokeWidth="1" />
    <circle cx="124" cy="82" r="3.5" fill="#f4a261" stroke="#2d6a4f" strokeWidth="1" />
    {/* Center OM */}
    <text x="160" y="112" fontSize="16" textAnchor="middle" fill="#2d6a4f" fontWeight="bold">ॐ</text>
  </svg>
);

export default function LandingPage() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await api.get('/api/reviews/');
        const reviewList = Array.isArray(response.data)
          ? response.data
          : (response.data.results || []);
        const approvedList = reviewList.filter((r: any) => r.is_approved === true);
        setReviews(approvedList);
      } catch (err) {
        console.error("Failed to load testimonials", err);
        setReviews([]);
      }
    };
    fetchReviews();
  }, []);

  return (
    <div
      className="flex-1 flex flex-col relative overflow-hidden bg-parchment-canvas font-garamond"
    >

      {/* ── NAVBAR ── */}
      <nav
        className="w-full max-w-7xl mx-auto px-6 sm:px-10 py-5 flex justify-between items-center z-20 sticky top-0"
        style={{
          background: 'rgba(252, 249, 245, 0.92)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 15px rgba(160, 148, 130, 0.15)',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'var(--nm-bg)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '2px 2px 5px var(--nm-shadow-dark), -2px -2px 5px var(--nm-shadow-light)'
            }}
          >
            <span style={{ color: 'var(--color-gold)', fontSize: 18, fontWeight: 'bold' }}>ॐ</span>
          </div>
          <span
            className="font-cinzel"
            style={{
              fontWeight: 900, fontSize: 18,
              letterSpacing: '0.08em', color: 'var(--color-ink)',
              textTransform: 'uppercase',
            }}
          >
            Astro<span style={{ color: 'var(--color-gold)' }}>Remedy</span>
          </span>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'Remedies', 'Pricing', 'About', 'Contact'].map(item => (
            <a
              key={item}
              href="#"
              style={{
                fontSize: 12, fontFamily: 'sans-serif',
                color: 'var(--color-mystic)', fontWeight: 600,
                textDecoration: 'none', letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="nm-btn px-5 py-2.5 text-xs font-bold text-mystic hover:text-gold transition-all duration-150"
            style={{ textDecoration: 'none' }}
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="nm-btn-gold px-5 py-2.5 text-xs font-bold tracking-wider uppercase transition-all duration-150"
            style={{ textDecoration: 'none', borderRadius: 'var(--nm-radius-btn)' }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        className="w-full relative"
        style={{
          background: 'linear-gradient(180deg, var(--parchment-canvas) 0%, rgba(201, 168, 76, 0.08) 60%, rgba(74, 63, 107, 0.06) 100%)',
          minHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-end',
          overflow: 'hidden',
          paddingTop: '60px',
        }}
      >
        {/* Trust badge */}
        <div className="flex justify-center mb-6 z-10">
          <div
            className="nm-inset"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              borderRadius: 100, padding: '8px 20px',
              fontSize: 11, fontFamily: 'sans-serif',
              color: 'var(--color-ink)', fontWeight: 600,
              letterSpacing: '0.02em'
            }}
          >
            <span style={{ fontSize: 13 }}>⭐</span>
            <strong style={{ color: 'var(--color-gold)' }}>Trusted by 10k+ Seekers</strong>
            — Authentic Vedic Guidance
          </div>
        </div>

        {/* Big headline */}
        <h1
          className="text-center z-10 px-4 font-cinzel"
          style={{
            fontWeight: 900,
            fontSize: 'clamp(36px, 7vw, 80px)',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: 'var(--color-ink)',
            textTransform: 'uppercase',
            maxWidth: 900,
          }}
        >
          CONSULT THE STARS,<br />
          <span style={{ color: 'var(--color-mystic)' }}>HEAL YOUR KARMA</span>
        </h1>

        <p
          className="text-center z-10 mt-6 px-4 font-sans max-w-3xl"
          style={{
            fontSize: 15,
            color: 'var(--color-ink)', opacity: 0.8, lineHeight: 1.6,
          }}
        >
          Submit your birth details to receive personalized voice analyses
          from certified Vedic experts — and order authenticated remedies.
        </p>

        {/* CTA buttons */}
        <div className="flex items-center gap-6 mt-8 z-10 flex-wrap justify-center font-sans">
          <Link
            href="/dashboard/consultations/new"
            className="nm-btn-gold py-4 px-8 text-sm font-bold tracking-widest uppercase flex items-center gap-2"
            style={{ borderRadius: 'var(--nm-radius-btn)', textDecoration: 'none' }}
          >
            Get Started <ArrowRight size={16} />
          </Link>
          <Link
            href="/login"
            className="nm-btn py-4 px-8 text-sm font-bold text-mystic hover:text-gold flex items-center gap-2"
            style={{ textDecoration: 'none' }}
          >
            <Play size={15} /> Watch Demo
          </Link>
        </div>

        {/* Mascots + Hero illustration row */}
        <div
          className="w-full z-10 flex items-end justify-center gap-0 mt-10 px-4"
          style={{ maxWidth: 960, margin: '40px auto 0' }}
        >
          {/* Left mascot */}
          <div className="hidden md:block" style={{ alignSelf: 'flex-end', marginBottom: 0 }}>
            <SageMascotLeft />
          </div>

          {/* Center - chart card floating */}
          <div
            className="nm-card w-full"
            style={{
              flex: 1, maxWidth: 340,
              padding: 20,
              margin: '0 12px 20px',
              position: 'relative',
            }}
          >
            <div
              style={{
                fontSize: 11, fontFamily: 'sans-serif',
                color: 'var(--color-gold)', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              ✦ Birth Chart Analysis
            </div>
            <PlanetIllustration />
            <div
              className="nm-inset"
              style={{
                borderRadius: 10,
                padding: '10px 14px',
                marginTop: 12,
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <div
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'var(--color-gold)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Sparkles size={14} className="text-ink mx-auto" />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'sans-serif' }}>
                  Planetary Balance
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-mist)', fontFamily: 'sans-serif' }}>
                  Customized to your exact birth alignment
                </div>
              </div>
            </div>
          </div>

          {/* Right mascot */}
          <div className="hidden md:block" style={{ alignSelf: 'flex-end', marginBottom: 20 }}>
            <SageMascotRight />
          </div>
        </div>
      </section>

      {/* ── LOGO / TRUST STRIP ── */}
      <section className="w-full py-8 my-10 max-w-7xl mx-auto nm-card flex items-center justify-center">
        <div
          className="w-full px-6 flex items-center justify-center flex-wrap gap-10"
          style={{ opacity: 0.7 }}
        >
          {['Vedic Academy', 'Rudraksh Board', 'ISHA Foundation', 'Cosmic Trust', 'Jyotish Guild'].map(name => (
            <span
              key={name}
              style={{
                fontSize: 12, fontFamily: 'sans-serif',
                fontWeight: 700, color: 'var(--color-mystic)',
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}
            >
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* ── FEATURES / TRUST BADGES ── */}
      <section className="max-w-6xl mx-auto px-6 py-12 w-full">
        {/* Section label */}
        <div className="flex justify-center mb-4">
          <span
            className="nm-inset"
            style={{
              fontSize: 11, fontFamily: 'sans-serif',
              color: 'var(--color-gold)', fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              borderRadius: 100, padding: '5px 14px',
            }}
          >
            FEATURES
          </span>
        </div>

        <h2
          className="text-center mb-4 font-cinzel"
          style={{
            fontWeight: 900, fontSize: 'clamp(28px, 5vw, 48px)',
            textTransform: 'uppercase', color: 'var(--color-ink)',
            lineHeight: 1.1, letterSpacing: '-0.01em',
          }}
        >
          BOOST SPIRITUAL<br />
          WELLNESS WITH VEDIC WISDOM
        </h2>

        <p
          className="text-center mb-14"
          style={{
            fontFamily: 'sans-serif', fontSize: 15,
            color: 'var(--color-ink)', opacity: 0.7, maxWidth: 480, margin: '0 auto 56px',
          }}
        >
          Ancient Vedic wisdom meets modern convenience — delivered
          faster than ever, right to your door and inbox.
        </p>

        {/* Feature cards grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            {
              icon: <Mic size={22} color="#fff" />,
              iconBg: '#e63946',
              title: 'Voice Responses',
              desc: 'Detailed vocal explanations directly from certified Vedic seers within 48 hours.',
              tag: 'Audio',
            },
            {
              icon: <Clock size={22} color="#fff" />,
              iconBg: '#f4a261',
              title: '48h Turnaround',
              desc: 'Receive birth chart reviews and cosmic guidance swiftly — never wait weeks.',
              tag: 'Fast',
            },
            {
              icon: <Package size={22} color="#fff" />,
              iconBg: '#2d6a4f',
              title: 'Genuine Remedies',
              desc: 'Certified Rudraksh beads with complete lab-tested authenticity validation.',
              tag: 'Certified',
            },
            {
              icon: <Send size={22} color="#fff" />,
              iconBg: '#4361ee',
              title: 'WhatsApp Checkout',
              desc: 'Simple order flow directly via personal secure WhatsApp message.',
              tag: 'Easy',
            },
          ].map((feat, i) => (
            <div
              key={i}
              className="nm-card p-6 flex flex-col gap-4 transition-all hover:translate-y-[-4px]"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div
                  style={{
                    width: 42, height: 42, borderRadius: 10,
                    background: feat.iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  className="mx-0"
                >
                  {feat.icon}
                </div>
                <span
                  className="nm-inset"
                  style={{
                    fontSize: 9, fontFamily: 'sans-serif',
                    fontWeight: 700, color: 'var(--color-mystic)',
                    borderRadius: 100,
                    padding: '3px 10px',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    marginLeft: 'auto'
                  }}
                >
                  {feat.tag}
                </span>
              </div>
              <h3
                className="font-garamond"
                style={{
                  fontWeight: 800, fontSize: 16,
                  color: 'var(--color-ink)', textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                }}
              >
                {feat.title}
              </h3>
              <p
                className="font-sans"
                style={{
                  fontSize: 13,
                  color: 'var(--color-ink)', opacity: 0.8, lineHeight: 1.6, flex: 1,
                }}
              >
                {feat.desc}
              </p>
              <a
                href="#"
                className="font-sans"
                style={{
                  fontSize: 12,
                  color: 'var(--color-gold)', fontWeight: 700,
                  textDecoration: 'none', display: 'flex',
                  alignItems: 'center', gap: 5,
                  marginTop: 4,
                }}
              >
                Learn More →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── REMEDY CATALOG ── */}
      <section
        className="py-20 bg-parchment-bg"
        style={{ borderTop: '1px solid rgba(160, 148, 130, 0.25)', borderBottom: '1px solid rgba(160, 148, 130, 0.25)' }}
      >
        <div className="max-w-6xl mx-auto px-6 w-full">
          {/* Label */}
          <div className="flex justify-center mb-4">
            <span
              className="nm-inset"
              style={{
                fontSize: 11, fontFamily: 'sans-serif',
                color: 'var(--color-gold)', fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                borderRadius: 100, padding: '5px 14px',
              }}
            >
              REMEDY CATALOG
            </span>
          </div>

          <h2
            className="text-center mb-3 font-cinzel"
            style={{
              fontWeight: 900, fontSize: 'clamp(26px, 5vw, 46px)',
              textTransform: 'uppercase', color: 'var(--color-ink)',
              lineHeight: 1.1,
            }}
          >
            GENUINE VEDIC REMEDIES
          </h2>
          <p
            className="text-center mb-14"
            style={{
              fontFamily: 'sans-serif', fontSize: 15,
              color: 'var(--color-ink)', opacity: 0.7, maxWidth: 480, margin: '0 auto 56px',
            }}
          >
            Recommended specifically according to your charts to manifest
            focus, remove obstacles, and cultivate inner peace.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: '1 Mukhi Rudraksh',
                price: '₹3,500',
                desc: 'Highly auspicious bead representing Lord Shiva. Enhances focus and clarity of mind.',
                img: 'https://images.unsplash.com/photo-1605296867304-46d5465a25f1?auto=format&fit=crop&w=400&q=80',
                badge: 'Rare',
                badgeColor: '#e63946',
              },
              {
                name: '3 Mukhi Rudraksh',
                price: '₹1,200',
                desc: 'Represents Agni (Fire). Purifies past karma and helps overcome anxiety and guilt.',
                img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80',
                badge: 'Popular',
                badgeColor: '#2d6a4f',
              },
              {
                name: '5 Mukhi Rudraksh',
                price: '₹500',
                desc: 'Brings peace of mind, good health, and general well-being. Ideal for meditation.',
                img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=400&q=80',
                badge: 'Bestseller',
                badgeColor: '#f4a261',
              },
              {
                name: 'Ganesh Rudraksh',
                price: '₹1,500',
                desc: 'Features a trunk-like protrusion. Blesses the wearer with wisdom and success.',
                img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80',
                badge: 'Sacred',
                badgeColor: '#4361ee',
              },
            ].map((prod, i) => (
              <div
                key={i}
                className="nm-card flex flex-col overflow-hidden transition-all hover:translate-y-[-4px]"
              >
                {/* Image */}
                <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                  <img
                    src={prod.img}
                    alt={prod.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span
                    style={{
                      position: 'absolute', top: 10, right: 10,
                      background: prod.badgeColor, color: '#fff',
                      fontSize: 10, fontFamily: 'sans-serif',
                      fontWeight: 700, borderRadius: 100,
                      padding: '3px 10px',
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}
                  >
                    {prod.badge}
                  </span>
                </div>

                {/* Content */}
                <div style={{ padding: '18px 18px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3
                      className="font-garamond"
                      style={{
                        fontWeight: 800, fontSize: 14,
                        color: 'var(--color-ink)', textTransform: 'uppercase',
                        lineHeight: 1.3,
                      }}
                    >
                      {prod.name}
                    </h3>
                    <span
                      className="font-sans"
                      style={{
                        fontWeight: 700,
                        fontSize: 14, color: 'var(--color-gold)',
                        whiteSpace: 'nowrap', marginLeft: 'auto',
                      }}
                    >
                      {prod.price}
                    </span>
                  </div>
                  <p
                    className="font-sans"
                    style={{
                      fontSize: 12.5,
                      color: 'var(--color-ink)', opacity: 0.8, lineHeight: 1.55, flex: 1,
                    }}
                  >
                    {prod.desc}
                  </p>
                  <Link
                    href="/dashboard/consultations/new"
                    className="font-sans"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      fontSize: 12,
                      color: 'var(--color-gold)', fontWeight: 700,
                      textDecoration: 'none', marginTop: 6,
                      paddingTop: 10,
                      borderTop: '1px solid rgba(160, 148, 130, 0.2)',
                    }}
                  >
                    Prescribe for My Chart <ExternalLink size={11} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      {reviews.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-20 w-full">
          <div className="flex justify-center mb-4">
            <span
              className="nm-inset"
              style={{
                fontSize: 11, fontFamily: 'sans-serif',
                color: 'var(--color-gold)', fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                borderRadius: 100, padding: '5px 14px',
              }}
            >
              TESTIMONIALS
            </span>
          </div>

          <h2
            className="text-center mb-3 font-cinzel"
            style={{
              fontWeight: 900, fontSize: 'clamp(26px, 5vw, 46px)',
              textTransform: 'uppercase', color: 'var(--color-ink)', lineHeight: 1.1,
            }}
          >
            SEEKER EXPERIENCES
          </h2>
          <p
            className="text-center mb-14 font-sans"
            style={{
              fontSize: 15,
              color: 'var(--color-ink)', opacity: 0.7, maxWidth: 420, margin: '0 auto 56px',
            }}
          >
            Verified experiences from individuals who consulted our Vedic experts.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.map((rev) => {
              const email = rev.user_email || 'seeker@example.com';
              const initial = (email[0] || 'S').toUpperCase();
              const name = email.split('@')[0] || 'Seeker';
              return (
                <div
                  key={rev.id}
                  className="nm-card p-6 flex flex-col gap-4"
                >
                  {/* Stars */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        size={14}
                        style={{ color: rev.rating >= s ? 'var(--color-gold)' : '#e5e7eb' }}
                        fill={rev.rating >= s ? 'var(--color-gold)' : 'none'}
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <p
                    className="font-garamond max-w-3xl"
                    style={{
                      fontSize: 14, color: 'var(--color-ink)',
                      lineHeight: 1.7, fontStyle: 'italic', flex: 1,
                    }}
                  >
                    "{rev.comment}"
                  </p>

                  {/* Author */}
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      paddingTop: 12, borderTop: '1px solid rgba(160, 148, 130, 0.2)',
                    }}
                  >
                    <div
                      style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'var(--nm-bg)', border: '1.5px solid var(--color-gold)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: 'var(--color-ink)',
                        fontFamily: 'sans-serif',
                        boxShadow: '1px 1px 3px var(--nm-shadow-dark), -1px -1px 3px var(--nm-shadow-light)'
                      }}
                      className="flex items-center justify-center shrink-0"
                    >
                      {initial}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 11, fontFamily: 'sans-serif',
                          fontWeight: 700, color: 'var(--color-ink)',
                          textTransform: 'uppercase', letterSpacing: '0.08em',
                        }}
                      >
                        {name}
                      </div>
                      <div style={{ fontSize: 10, fontFamily: 'sans-serif', color: 'var(--color-gold)' }}>
                        Verified Seeker
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── CTA BANNER ── */}
      <section
        className="w-full relative py-20 px-6 text-center"
        style={{
          background: 'var(--color-ink)',
          borderTop: '1px solid rgba(201, 168, 76, 0.15)',
          boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.4)',
        }}
      >
        {/* Decorative dots */}
        <div
          style={{
            position: 'absolute', inset: 0, opacity: 0.06,
            backgroundImage: 'radial-gradient(#52b788 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(201,168,76,0.15)',
              border: '1px solid rgba(201,168,76,0.4)',
              borderRadius: 100, padding: '5px 14px', marginBottom: 20,
              fontSize: 11, fontFamily: 'sans-serif',
              color: 'var(--color-gold)', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}
          >
            ✦ Start Your Journey
          </div>
          <h2
            className="font-cinzel"
            style={{
              fontWeight: 900, fontSize: 'clamp(28px, 6vw, 56px)',
              textTransform: 'uppercase', color: '#fff',
              lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: 16,
            }}
          >
            YOUR PLANETS ARE<br />
            <span style={{ color: 'var(--color-gold)' }}>WAITING FOR YOU</span>
          </h2>
          <p
            style={{
              fontFamily: 'sans-serif', fontSize: 15,
              color: 'var(--color-bloom)', opacity: 0.85, maxWidth: 400,
              margin: '0 auto 36px', lineHeight: 1.6,
            }}
          >
            Get a personalized Vedic birth chart reading and discover
            your authentic cosmic remedies today.
          </p>
          <Link
            href="/login"
            className="nm-btn-gold-dark py-4 px-8 text-sm font-bold tracking-widest uppercase flex items-center gap-2"
            style={{ display: 'inline-flex', borderRadius: 'var(--nm-radius-btn)', textDecoration: 'none' }}
          >
            Consult a Seer Now <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="w-full py-12 px-6 text-center"
        style={{
          background: '#0f0f1c',
          borderTop: '1px solid rgba(201, 168, 76, 0.1)',
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div style={{ display: 'flex', itemsAlign: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
            <div
              style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'var(--color-gold)',
                display: 'flex', itemsAlign: 'center', justifyContent: 'center',
              }}
              className="flex items-center justify-center shrink-0"
            >
              <span className="text-ink font-bold text-sm">ॐ</span>
            </div>
            <span
              className="font-cinzel"
              style={{
                fontWeight: 900, fontSize: 15,
                color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em',
              }}
            >
              Astro<span style={{ color: 'var(--color-gold)' }}>Remedy</span>
            </span>
          </div>
          <p style={{ fontFamily: 'sans-serif', fontSize: 12, color: 'var(--color-gold)', marginBottom: 6, opacity: 0.8 }}>
            © 2026 AstroRemedy Platform. All Rights Reserved.
          </p>
          <p style={{ fontFamily: 'sans-serif', fontSize: 11, color: 'var(--color-mist)', opacity: 0.6 }}>
            Secured payments • Authenticated Vedic Rudraksh remedies shipped worldwide
          </p>
        </div>
      </footer>

    </div>
  );
}