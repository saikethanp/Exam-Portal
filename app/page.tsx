'use client';

import Link from 'next/link';
import { ShieldCheck, BarChart3, Clock, ArrowRight, BrainCircuit } from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <motion.div
          className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium text-sm mb-8 shadow-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
          ExamSphere 2.0 is now live
        </motion.div>

        <motion.h1
          className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          The Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Online Assessments.</span>
        </motion.h1>

        <motion.p
          className="max-w-2xl mx-auto text-xl text-slate-600 mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          A premium, enterprise-grade examination platform with advanced anti-cheating, real-time analytics, and an impossibly clean interface.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link href="/register" className="group px-8 py-4 text-white bg-blue-600 hover:bg-blue-700 text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center">
            Get Started For Free <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/login" className="px-8 py-4 text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 text-lg font-medium rounded-xl shadow-sm transition-all hover:shadow-md">
            Student Login
          </Link>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="w-full bg-white py-24 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Uncompromising Security & Precision</h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">Everything you need to run high-stakes exams effortlessly.</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ShieldCheck className="w-8 h-8 text-blue-600" />}
              title="Built-in Anti-Cheat"
              desc="Fullscreen enforcement, tab switching detection, and background auto-save keep exams secure and reliable."
              delay={0}
            />
            <FeatureCard 
              icon={<BarChart3 className="w-8 h-8 text-purple-600" />}
              title="Instant Analytics"
              desc="Automatic grading and comprehensive score reports delivered the moment the timer hits zero."
              delay={0.1}
            />
            <FeatureCard 
              icon={<Clock className="w-8 h-8 text-blue-600" />}
              title="Auto-Submission"
              desc="Precision timers with background saving. Exams auto-submit seamlessly when the duration expires."
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-slate-900 py-12 text-slate-400 text-center">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <BrainCircuit className="w-10 h-10 text-blue-500 mb-6" />
          <p className="mb-2">&copy; {new Date().getFullYear()} ExamSphere Inc. All rights reserved.</p>
          <p className="text-sm">Built with Next.js, React, and Tailwind CSS.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, delay }: { icon: React.ReactNode, title: string, desc: string, delay: number }) {
  return (
    <motion.div
      className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all text-left group cursor-default"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4 }}
    >
      <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{desc}</p>
    </motion.div>
  );
}
