'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useEffect } from 'react';

/* ─────────────────────────────────────────────
   ETHNOTECH Academy SVG Logo
───────────────────────────────────────────── */
function EthnotechLogo() {
  return (
    <motion.div
      className="relative w-72 h-24 md:w-96 md:h-32"
      initial={{ opacity: 0, scale: 0.5, y: -40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.05, rotate: 2 }}
    >
      <motion.div
        animate={{ y: [-6, 6, -6] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="w-full h-full drop-shadow-[0_20px_15px_rgba(0,85,140,0.3)]"
        style={{
          filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.15)) drop-shadow(0 5px 10px rgba(0,0,0,0.1))'
        }}
      >
        <svg viewBox="0 0 500 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* User's Uploaded Logo Image */}
          <image href="/ethnotech.png" x="0" y="0" width="120" height="120" preserveAspectRatio="xMidYMid meet" />

          {/* Text: ETHNOTECH */}
          <text
            x="140" y="65"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="700"
            fontSize="48"
            fill="#1A1A1A"
            letterSpacing="2"
          >
            ETHNOTECH
          </text>

          {/* Text: ACADEMY */}
          <text
            x="145" y="95"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="500"
            fontSize="20"
            fill="#333333"
            letterSpacing="8"
          >
            ACADEMY
          </text>
        </svg>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Mouse Spotlight
───────────────────────────────────────────── */
function MouseSpotlight() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 80, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 80, damping: 30 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: useTransform(
          [springX, springY],
          ([x, y]) =>
            `radial-gradient(600px circle at ${x}px ${y}px, rgba(0,90,140,0.03), transparent 70%)`
        ),
      }}
    />
  );
}

/* ─────────────────────────────────────────────
   Main Landing Page
───────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <MouseSpotlight />

      {/* ── Floating background orbs ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-50/50 blur-3xl" />
        <div className="absolute top-1/3 -right-60 w-[500px] h-[500px] rounded-full bg-slate-50/50 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-blue-50/30 blur-3xl" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'linear-gradient(#005A8C 1px, transparent 1px), linear-gradient(90deg, #005A8C 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-blue-300/30"
            style={{ left: `${10 + i * 10}%`, top: `${15 + (i % 4) * 20}%` }}
            animate={{ y: [-15, 15, -15], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
          />
        ))}
      </div>

      {/* ─────────────── HERO ─────────────── */}
      <section className="relative z-10 w-full flex flex-col justify-center items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-grow">

        {/* Logo */}
        <div className="mb-8 md:mb-10 flex justify-center">
          <EthnotechLogo />
        </div>

        {/* Badge */}
        <motion.div
          className="relative inline-flex items-center px-4 py-1.5 rounded-full border text-sm font-medium mb-8 mx-auto overflow-hidden bg-white shadow-sm"
          style={{
            border: '1px solid rgba(0,90,140,0.1)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Shimmer */}
          <motion.div
            className="absolute inset-0 -translate-x-full"
            animate={{ translateX: ['-100%', '200%'] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5 }}
            style={{ background: 'linear-gradient(90deg, transparent, rgba(0,90,140,0.05), transparent)' }}
          />
          <motion.span
            className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 flex-shrink-0"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-blue-800 font-semibold mr-1">🚀 Ethnotech Assessment Platform 3.0</span>
          <span className="text-slate-500">is now live</span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6 text-center leading-tight max-w-4xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          The Future of{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#005A8C] to-[#0088CC]">
            Intelligent Assessments.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 mb-10 text-center leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          Enterprise-grade assessment infrastructure designed for universities, institutions, training organizations, and modern education ecosystems.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/register"
              id="cta-get-started"
              className="group inline-flex items-center justify-center px-8 py-3.5 text-white text-lg font-semibold rounded-xl shadow-lg transition-all duration-300 w-full sm:w-auto"
              style={{
                background: 'linear-gradient(135deg, #005A8C 0%, #0088CC 100%)',
                boxShadow: '0 8px 25px rgba(0,90,140,0.25)',
              }}
            >
              <span className="relative z-10">Get Started</span>
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/login"
              id="cta-student-login"
              className="inline-flex items-center justify-center px-8 py-3.5 text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 text-lg font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-300 w-full sm:w-auto"
            >
              Student Login
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ─────────────── FOOTER ─────────────── */}
      <footer className="relative z-10 w-full border-t border-slate-100 bg-white/80 backdrop-blur-md py-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} Ethnotech Academy. All rights reserved.
          </p>

          <div className="flex gap-6 text-sm text-slate-400">
            <Link href="#" className="hover:text-slate-700 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-slate-700 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-slate-700 transition-colors">Contact</Link>
          </div>
        </div>

        {/* Sub-footer: THANVEX + creator credit */}
        <div className="border-t border-slate-100 mt-4 pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          {/* Powered by THANVEX */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Powered by</span>
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wider"
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#60a5fa',
                letterSpacing: '0.08em',
              }}
            >
              THANVEX
            </span>
          </div>

          <span className="hidden sm:block text-slate-200">·</span>

          {/* Creator credit */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Crafted with</span>
            <span className="text-red-400 text-sm">♥</span>
            <span>by</span>
            <span
              className="font-semibold text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #2563EB, #6366F1)' }}
            >
              K-MINTS
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
