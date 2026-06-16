'use client';

import { useState } from 'react';
import { loginUser } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BrainCircuit, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { useToast } from '@/components/ToastProvider';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await loginUser(formData);
      if (res?.error) {
        showToast(res.error, 'error', 4000);
        setLoading(false);
      } else if (res?.success) {
        showToast('Login successful! Redirecting...', 'success', 2000);
        setTimeout(() => {
          if (res.role === 'STUDENT') {
            router.push('/dashboard/student');
          } else {
            router.push('/dashboard/admin');
          }
        }, 500);
      }
    } catch (err) {
      showToast('Something went wrong. Please try again.', 'error', 4000);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100"
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
          >
            <BrainCircuit className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
          <p className="text-slate-500 mt-2">Log in to ExamSphere to continue</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
            <input 
              name="email" 
              type="email" 
              required 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              placeholder="you@example.com"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <div className="relative">
              <input 
                name="password" 
                type={showPassword ? 'text' : 'password'} 
                required 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </motion.div>

          <motion.div
            className="flex items-center"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
          >
            <input 
              id="isAdmin" 
              name="isAdmin" 
              type="checkbox" 
              value="true"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-900 font-medium">
              Are you an Admin?
            </label>
          </motion.div>

          <motion.button 
            type="submit" 
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {loading ? (
              <><span className="spinner" /> Authenticating...</>
            ) : (
              'Log in'
            )}
          </motion.button>
        </form>

        <motion.p
          className="mt-8 text-center text-sm text-slate-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Not registered yet?{' '}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
            Create an account
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
