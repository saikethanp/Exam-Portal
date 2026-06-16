'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BrainCircuit } from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage() {
return ( <div className="flex flex-col justify-between items-center min-h-screen bg-white">
{/* Hero Section */} <section className="w-full flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 text-center flex-grow">

    {/* Animated Logo */}
    <motion.div
      className="mb-4 md:mb-6 flex justify-center"
      initial={{ opacity: 0, scale: 0.5, y: -40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <motion.div
        animate={{
          y: [-8, 8, -8],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative w-32 h-32 md:w-48 md:h-48 drop-shadow-[0_20px_20px_rgba(37,99,235,0.15)]"
      >
        <Image
          src="/logo (2).png"
          alt="Kmints Logo"
          fill
          priority
          className="object-contain"
        />
      </motion.div>
    </motion.div>

    {/* Badge */}
    <motion.div
      className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-medium text-sm mb-4 md:mb-6 shadow-sm mx-auto"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
      <span className="font-bold text-blue-800 mr-1">kmints</span>
      Exam Portal 2.0 is now live
    </motion.div>

    {/* Heading */}
    <motion.h1
      className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-4 md:mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      The Future of <br className="hidden md:block" />
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
        Online Assessments.
      </span>
    </motion.h1>

    {/* Description */}
    <motion.p
      className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 mb-6 md:mb-8 leading-relaxed"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      A premium, enterprise-grade examination platform with advanced
      anti-cheating, real-time analytics, and an impossibly clean interface.
    </motion.p>

    {/* Buttons */}
    <motion.div
      className="flex flex-col sm:flex-row justify-center items-center gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
    >
      <Link
        href="/register"
        className="group inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 text-white bg-blue-600 hover:bg-blue-700 text-base md:text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
      >
        Get Started For Free
        <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
      </Link>

      <Link
        href="/login"
        className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 text-base md:text-lg font-medium rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
      >
        Student Login
      </Link>
    </motion.div>
  </section>

  {/* Footer */}
  <footer className="w-full bg-slate-900 py-6 text-slate-400 text-center flex-shrink-0">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-4 sm:px-6 lg:px-8 w-full gap-4">
      <div className="flex items-center space-x-2 text-white">
        <BrainCircuit className="w-6 h-6 text-blue-500" />
        <span className="text-lg font-bold">
          <span className="text-blue-500">k</span>mints
        </span>
      </div>

      <p className="text-sm">
        &copy; {new Date().getFullYear()} kmints Exam Portal Inc. All rights
        reserved.
      </p>
    </div>
  </footer>
</div>

);
}
