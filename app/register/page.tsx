'use client';

import { useState } from 'react';
import { registerUser } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '@/components/ToastProvider';

export default function RegisterPage() {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    // Basic password confirm check client side
    if (formData.get('password') !== formData.get('confirmPassword')) {
      showToast('Passwords do not match.', 'error', 4000);
      setLoading(false);
      return;
    }

    const password = formData.get('password') as string;
    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'warning', 4000);
      setLoading(false);
      return;
    }

    try {
      const res = await registerUser(formData);
      if (res?.error) {
        showToast(res.error, 'error', 4000);
        setLoading(false);
      } else if (res?.success) {
        setSuccess(true);
        showToast('Account created successfully! 🎉', 'success', 3000);
        setTimeout(() => {
          router.push('/login');
        }, 2500);
      }
    } catch (err) {
      showToast('Registration failed. Please try again.', 'error', 4000);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-green-100 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <motion.div
              className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.15 }}
            >
              <CheckCircle2 className="w-10 h-10" />
            </motion.div>
            <motion.h2
              className="text-2xl font-bold text-slate-900 mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Account Created Successfully!
            </motion.h2>
            <motion.p
              className="text-slate-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Redirecting you to the login page...
            </motion.p>

            {/* Celebration particles */}
            <div className="relative mt-6 h-2">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`absolute w-2 h-2 rounded-full ${['bg-green-400', 'bg-blue-400', 'bg-purple-400', 'bg-amber-400', 'bg-pink-400', 'bg-teal-400'][i]}`}
                  style={{ left: `${15 + i * 14}%` }}
                  initial={{ y: 0, opacity: 1 }}
                  animate={{ y: [-20, -40 - Math.random() * 20], opacity: [1, 0], x: [(i % 2 === 0 ? -1 : 1) * (10 + Math.random() * 15)] }}
                  transition={{ duration: 1, delay: 0.3 + i * 0.08, ease: 'easeOut' }}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            className="max-w-xl w-full bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.15 }}
              >
                <div className="w-16 h-16 mx-auto mb-4">
                  <img src="/ethnotech.png" alt="Ethnotech Academy Logo" className="w-full h-full object-contain" />
                </div>
              </motion.div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Create your account</h2>
              <p className="text-slate-500 mt-2">Join Ethnotech Academy and elevate your testing experience.</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                  <input name="fullName" type="text" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                  <input name="email" type="email" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all" placeholder="john@example.com" />
                </div>
              </motion.div>

              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                  <input name="phone" type="tel" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all" placeholder="+91 9876543210" />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Roll Number</label>
                  <input name="rollNumber" type="text" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all" placeholder="21CS001" />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                  <input name="department" type="text" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all" placeholder="CSE" />
                </div>
              </motion.div>

              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                  <div className="relative">
                    <input name="password" type={showPassword ? 'text' : 'password'} required minLength={6} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all pr-12" placeholder="Min. 6 characters" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
                  <input name="confirmPassword" type={showPassword ? 'text' : 'password'} required minLength={6} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all" placeholder="Repeat password" />
                </div>
              </motion.div>

              <motion.button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 mt-6 border border-transparent rounded-xl shadow-md text-base font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-70 transition-all"
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                {loading ? (
                  <><span className="spinner" /> Creating account...</>
                ) : (
                  'Create Account'
                )}
              </motion.button>
            </form>

            <motion.p
              className="mt-8 text-center text-sm text-slate-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Already registered?{' '}
              <Link href="/login" className="font-medium text-purple-600 hover:text-purple-500 hover:underline">
                Log in to your account
              </Link>
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
