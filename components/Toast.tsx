'use client';

import { useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { ToastItem } from './ToastProvider';

const variantConfig = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-gradient-to-r from-emerald-500 to-green-600',
    progressBg: 'bg-emerald-300/50',
    iconColor: 'text-white',
  },
  error: {
    icon: XCircle,
    bg: 'bg-gradient-to-r from-red-500 to-rose-600',
    progressBg: 'bg-red-300/50',
    iconColor: 'text-white',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    progressBg: 'bg-amber-300/50',
    iconColor: 'text-white',
  },
  info: {
    icon: Info,
    bg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    progressBg: 'bg-blue-300/50',
    iconColor: 'text-white',
  },
};

export default function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const config = variantConfig[toast.variant];
  const Icon = config.icon;
  const duration = toast.duration ?? 4000;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.85 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.85, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`${config.bg} rounded-2xl shadow-2xl overflow-hidden pointer-events-auto min-w-[320px]`}
      style={{ backdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-start gap-3 p-4 pr-3">
        <div className={`shrink-0 mt-0.5 ${config.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-white text-sm font-medium leading-relaxed flex-1 pr-1">
          {toast.message}
        </p>
        <button
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {/* Auto-dismiss progress bar */}
      <div className="h-1 w-full bg-white/10">
        <motion.div
          className={`h-full ${config.progressBg}`}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
}
