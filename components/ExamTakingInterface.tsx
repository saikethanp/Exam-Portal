'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { submitExamResult, saveStudentAnswersDraft, getSavedAnswersDraft } from '@/lib/actions';
import type { Exam, Question } from '@/lib/db';
import { AlertTriangle, Clock, CheckCircle2, ChevronLeft, ChevronRight, Code, ShieldAlert, Maximize, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './ToastProvider';
import ConfirmModal from './ConfirmModal';

// ===== Seeded Random Shuffle Utility =====
// Deterministic hash from string → number (djb2 algorithm)
function hashCode(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Seeded pseudo-random number generator (LCG)
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// Fisher-Yates shuffle with seed
function shuffleArray<T>(arr: T[], seed: number): T[] {
  const shuffled = [...arr];
  const rng = seededRandom(seed);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Build a shuffle mapping for MCQ options per question per student
// Returns { displayOrder: ['C','A','D','B'], reverseMap: { 'A': 'C', 'B': 'A', ... } }
type OptionLetter = 'A' | 'B' | 'C' | 'D';
interface ShuffleMap {
  displayOrder: OptionLetter[];
  // Maps display position letter → original option letter
  displayToOriginal: Record<OptionLetter, OptionLetter>;
  // Maps original option letter → display position letter
  originalToDisplay: Record<OptionLetter, OptionLetter>;
}

function buildShuffleMap(studentId: string, questionId: string): ShuffleMap {
  const seed = hashCode(`${studentId}_${questionId}_shuffle`);
  const original: OptionLetter[] = ['A', 'B', 'C', 'D'];
  const shuffled = shuffleArray(original, seed);

  const displayToOriginal: Record<string, OptionLetter> = {};
  const originalToDisplay: Record<string, OptionLetter> = {};

  shuffled.forEach((origLetter, displayIndex) => {
    const displayLetter = original[displayIndex]; // A, B, C, D in display order
    displayToOriginal[displayLetter] = origLetter;
    originalToDisplay[origLetter] = displayLetter;
  });

  return {
    displayOrder: shuffled,
    displayToOriginal: displayToOriginal as Record<OptionLetter, OptionLetter>,
    originalToDisplay: originalToDisplay as Record<OptionLetter, OptionLetter>,
  };
}

// ===== Anti-Cheat Constants =====
const MAX_FULLSCREEN_VIOLATIONS = 3;
const MAX_TAB_SWITCH_WARNINGS = 1; // warn on 1st, auto-submit on 2nd

export default function ExamTakingInterface({ exam, studentId }: { exam: Exam, studentId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [started, setStarted] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  
  // Format answers locally as { [questionId]: { selectedOption?: string, codeAnswer?: string } }
  const [answers, setAnswers] = useState<Record<string, { selectedOption?: string; codeAnswer?: string }>>({});
  const [timeLeft, setTimeLeft] = useState(exam.durationMinutes * 60);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [direction, setDirection] = useState(0); // -1 = prev, 1 = next

  // Anti-cheat state
  const [isPageBlurred, setIsPageBlurred] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [fullscreenViolations, setFullscreenViolations] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [violationBanner, setViolationBanner] = useState<{ message: string; type: 'warning' | 'danger' } | null>(null);

  const answersRef = useRef(answers);
  const submittingRef = useRef(false);
  const fullscreenViolationsRef = useRef(0);
  const tabSwitchCountRef = useRef(0);

  // Sync refs
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { submittingRef.current = submitting; }, [submitting]);
  useEffect(() => { fullscreenViolationsRef.current = fullscreenViolations; }, [fullscreenViolations]);
  useEffect(() => { tabSwitchCountRef.current = tabSwitchCount; }, [tabSwitchCount]);

  // ===== Precompute shuffle maps for all MCQ questions =====
  const shuffleMaps = useMemo(() => {
    const maps: Record<string, ShuffleMap> = {};
    exam.questions.forEach((q) => {
      if (q.type === 'MCQ') {
        maps[q.id] = buildShuffleMap(studentId, q.id);
      }
    });
    return maps;
  }, [exam.questions, studentId]);

  // Load draft and timer state from server / localStorage upon start
  useEffect(() => {
    if (!started) return;

    const loadDraftState = async () => {
      try {
        const drafts = await getSavedAnswersDraft(exam.id);
        const answersMap: Record<string, { selectedOption?: string; codeAnswer?: string }> = {};
        drafts.forEach(d => {
          answersMap[d.questionId] = {
            selectedOption: d.selectedOption || undefined,
            codeAnswer: d.codeAnswer || undefined
          };
        });
        setAnswers(answersMap);
      } catch (e) {
        console.error('Failed to load answers draft from DB:', e);
      }

      // Restore Timer state
      const savedTimerKey = `exam_timer_${exam.id}_${studentId}`;
      const savedEndTime = localStorage.getItem(savedTimerKey);
      if (savedEndTime) {
        const remaining = Math.max(0, Math.floor((Number(savedEndTime) - Date.now()) / 1000));
        setTimeLeft(remaining);
      } else {
        const endTime = Date.now() + exam.durationMinutes * 60 * 1000;
        localStorage.setItem(savedTimerKey, endTime.toString());
        setTimeLeft(exam.durationMinutes * 60);
      }
    };

    loadDraftState();
  }, [started, exam.id, exam.durationMinutes, studentId]);


  const doSubmit = useCallback(async (auto = false, cheatReason?: string) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    try {
      // Final save draft before evaluation
      await saveStudentAnswersDraft(exam.id, answersRef.current);

      await submitExamResult(exam.id);

      // Clean up timer
      localStorage.removeItem(`exam_timer_${exam.id}_${studentId}`);

      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      showToast(
        cheatReason
          ? `Exam auto-submitted: ${cheatReason}`
          : auto ? 'Your exam has been auto-submitted.' : 'Exam submitted successfully!',
        cheatReason ? 'error' : auto ? 'error' : 'success',
        5000
      );

      setTimeout(() => {
        router.push('/dashboard/student');
      }, 1000);
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || 'Error submitting exam. Please try again.', 'error', 5000);
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [exam.id, studentId, router, showToast]);

  // ===== Fullscreen Enforcement =====
  const requestFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      setShowFullscreenWarning(false);
    } catch (err) {
      console.error('Fullscreen request failed:', err);
      setShowFullscreenWarning(true);
    }
  }, []);

  useEffect(() => {
    if (!started) return;

    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);

      if (!isFs && !submittingRef.current) {
        const newCount = fullscreenViolationsRef.current + 1;
        setFullscreenViolations(newCount);

        if (newCount >= MAX_FULLSCREEN_VIOLATIONS) {
          doSubmit(true, 'Exited fullscreen too many times (cheating detected)');
        } else {
          setShowFullscreenWarning(true);
          setViolationBanner({
            message: `⚠️ Fullscreen violation ${newCount}/${MAX_FULLSCREEN_VIOLATIONS}. Exam will auto-submit after ${MAX_FULLSCREEN_VIOLATIONS} violations.`,
            type: newCount >= 2 ? 'danger' : 'warning'
          });
          setTimeout(() => setViolationBanner(null), 5000);
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [started, doSubmit]);

  // ===== Tab Switch / Visibility Detection =====
  useEffect(() => {
    if (!started) return;

    const handleVisibilityChange = () => {
      if (document.hidden && !submittingRef.current) {
        const newCount = tabSwitchCountRef.current + 1;
        setTabSwitchCount(newCount);

        if (newCount > MAX_TAB_SWITCH_WARNINGS) {
          doSubmit(true, 'Tab switch detected — cheating suspected');
        } else {
          showToast(
            `⚠️ Tab switch detected! This is your ONLY warning. Switching again will auto-submit your exam.`,
            'error',
            6000
          );
          setViolationBanner({
            message: `🚨 Tab switch warning ${newCount}/${MAX_TAB_SWITCH_WARNINGS + 1}. Next switch will end your exam!`,
            type: 'danger'
          });
          setTimeout(() => setViolationBanner(null), 6000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [started, doSubmit, showToast]);

  // ===== Page Blur (Google Lens / Screenshot Protection) =====
  useEffect(() => {
    if (!started) return;

    const handleBlur = () => {
      if (!submittingRef.current) {
        setIsPageBlurred(true);
      }
    };

    const handleFocus = () => {
      setIsPageBlurred(false);
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [started]);

  // ===== Keyboard Shortcut Hardening =====
  useEffect(() => {
    if (!started) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow arrow keys for navigation (but not in textarea)
      if (e.target instanceof HTMLTextAreaElement) return;

      // Block dangerous shortcuts
      const blockedCombos = [
        // Copy, Paste, Print, Select All
        e.ctrlKey && e.key === 'c',
        e.ctrlKey && e.key === 'v',
        e.ctrlKey && e.key === 'p',
        e.ctrlKey && e.key === 'a',
        // Dev tools
        e.ctrlKey && e.shiftKey && e.key === 'I',
        e.ctrlKey && e.shiftKey && e.key === 'J',
        e.ctrlKey && e.shiftKey && e.key === 'C',
        e.ctrlKey && e.key === 'u',
        // F12 dev tools
        e.key === 'F12',
        // Print Screen
        e.key === 'PrintScreen',
        // Escape (we handle fullscreen separately)
      ];

      if (blockedCombos.some(Boolean)) {
        e.preventDefault();
        e.stopPropagation();
        showToast('⛔ This action is blocked during the exam.', 'error', 2000);
        return;
      }

      // Arrow key navigation
      if (e.key === 'ArrowRight' && currentQIndex < exam.questions.length - 1) {
        setDirection(1);
        setCurrentQIndex(prev => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentQIndex > 0) {
        setDirection(-1);
        setCurrentQIndex(prev => prev - 1);
      }
    };

    // Block right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      showToast('⛔ Right-click is disabled during the exam.', 'error', 2000);
    };

    // Block copy/cut/paste events
    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      showToast('⛔ Copy/paste is disabled during the exam.', 'error', 2000);
    };

    // Block print
    const handleBeforePrint = (e: Event) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    window.addEventListener('beforeprint', handleBeforePrint);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      window.removeEventListener('beforeprint', handleBeforePrint);
    };
  }, [started, currentQIndex, exam.questions.length, showToast]);

  // Periodic Auto-Save every 10 seconds
  useEffect(() => {
    if (!started || submittingRef.current) return;

    const autoSaveInterval = setInterval(async () => {
      try {
        await saveStudentAnswersDraft(exam.id, answersRef.current);
      } catch (e) {
        console.error('Autosave failed:', e);
      }
    }, 10000);

    return () => clearInterval(autoSaveInterval);
  }, [started, exam.id]);

  useEffect(() => {
    if (!started || submittingRef.current) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          showToast('Time is up! Auto-submitting your exam...', 'warning', 4000);
          doSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [started, doSubmit, showToast]);

  const handleManualSubmit = () => {
    setShowConfirmModal(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const goToQuestion = (index: number) => {
    setDirection(index > currentQIndex ? 1 : -1);
    setCurrentQIndex(index);
  };

  // ===== Begin Exam Handler (requests fullscreen) =====
  const handleBeginExam = async () => {
    setStarted(true);
    // Small delay to let React update before requesting fullscreen
    setTimeout(() => {
      requestFullscreen();
    }, 100);
  };

  // Pre-exam instructions screen
  if (!started) {
    return (
      <motion.div
        className="max-w-2xl mx-auto py-12 px-4 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-slate-200">
          <motion.h1
            className="text-3xl font-bold text-slate-900 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {exam.title}
          </motion.h1>
          <motion.p
            className="text-slate-600 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            {exam.questions.length} questions · {exam.totalMarks} marks · {exam.durationMinutes} minutes
          </motion.p>
          
          <motion.div
            className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-left mb-6 space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h3 className="font-bold text-blue-900 border-b border-blue-100 pb-2 mb-3">Exam Rules & Instructions</h3>
            <p className="flex text-sm text-blue-800"><CheckCircle2 className="w-5 h-5 mr-2 text-blue-500 shrink-0"/> The exam lasts exactly {exam.durationMinutes} minutes. Auto-submits when time runs out.</p>
            <p className="flex text-sm text-blue-800"><CheckCircle2 className="w-5 h-5 mr-2 text-blue-500 shrink-0"/> Total marks: {exam.totalMarks}. Answer all questions to score maximum.</p>
            <p className="flex text-sm text-blue-800"><CheckCircle2 className="w-5 h-5 mr-2 text-blue-500 shrink-0"/> Use arrow keys (← →) to navigate between questions.</p>
          </motion.div>

          {/* Anti-Cheat Rules */}
          <motion.div
            className="bg-red-50 border border-red-200 rounded-2xl p-6 text-left mb-8 space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <h3 className="font-bold text-red-900 border-b border-red-100 pb-2 mb-3 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              Anti-Cheat Protection Enabled
            </h3>
            <p className="flex text-sm text-red-800"><AlertTriangle className="w-5 h-5 mr-2 text-red-400 shrink-0"/> The exam requires <strong className="mx-1">fullscreen mode</strong>. Exiting fullscreen 3 times will auto-submit.</p>
            <p className="flex text-sm text-red-800"><AlertTriangle className="w-5 h-5 mr-2 text-red-400 shrink-0"/> <strong className="mr-1">Tab switching</strong> is monitored. 1 warning, then auto-submit.</p>
            <p className="flex text-sm text-red-800"><AlertTriangle className="w-5 h-5 mr-2 text-red-400 shrink-0"/> The screen will <strong className="mx-1">blur</strong> if you switch apps (blocks Google Lens).</p>
            <p className="flex text-sm text-red-800"><AlertTriangle className="w-5 h-5 mr-2 text-red-400 shrink-0"/> Copy, paste, right-click, and developer tools are <strong className="ml-1">disabled</strong>.</p>
          </motion.div>
          
          <motion.button
            onClick={handleBeginExam}
            className="w-full py-4 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded-xl shadow-md flex items-center justify-center gap-2"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <Maximize className="w-5 h-5" />
            Begin Exam (Enters Fullscreen)
          </motion.button>
        </div>
      </motion.div>
    );
  }

  const q = exam.questions[currentQIndex];
  const answeredCount = Object.values(answers).filter(
    (ans) => ans.selectedOption || (ans.codeAnswer && ans.codeAnswer.trim())
  ).length;
  const isCriticalTime = timeLeft <= 60;

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  // Get shuffle map for current MCQ question
  const currentShuffleMap = q.type === 'MCQ' ? shuffleMaps[q.id] : null;

  return (
    <>
      {/* ===== Page Blur Overlay (Google Lens / Screenshot Protection) ===== */}
      {isPageBlurred && (
        <div className="exam-blur-overlay">
          <EyeOff className="blur-icon" />
          <h2>Exam Content Hidden</h2>
          <p>Return to this window to continue your exam. Content is hidden to prevent cheating.</p>
        </div>
      )}

      {/* ===== Fullscreen Warning Overlay ===== */}
      {showFullscreenWarning && !submitting && (
        <div className="fullscreen-warning-overlay">
          <motion.div
            className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl max-w-md text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Maximize className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Fullscreen Required</h2>
            <p className="text-slate-600 mb-2">
              You must be in fullscreen mode to take this exam. 
            </p>
            <p className="text-red-600 font-semibold text-sm mb-6">
              Violation {fullscreenViolations}/{MAX_FULLSCREEN_VIOLATIONS} — Your exam will auto-submit after {MAX_FULLSCREEN_VIOLATIONS} violations.
            </p>
            <button
              onClick={requestFullscreen}
              className="w-full py-4 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              <Maximize className="w-5 h-5" />
              Re-enter Fullscreen
            </button>
          </motion.div>
        </div>
      )}

      {/* ===== Violation Warning Banner ===== */}
      <AnimatePresence>
        {violationBanner && (
          <motion.div
            className={`violation-banner ${violationBanner.type}`}
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
          >
            <ShieldAlert className="w-4 h-4" />
            {violationBanner.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Main Exam Interface ===== */}
      <div className={`fixed inset-0 bg-slate-50 z-[100] flex flex-col select-none ${isPageBlurred ? 'exam-blurred' : ''}`}>
        <ConfirmModal
          open={showConfirmModal}
          title="Submit Exam?"
          message={`You have answered ${answeredCount} out of ${exam.questions.length} questions. Once submitted, you cannot change your answers.`}
          confirmText="Submit Final"
          cancelText="Continue Exam"
          variant="warning"
          onConfirm={() => { setShowConfirmModal(false); doSubmit(false); }}
          onCancel={() => setShowConfirmModal(false)}
        />

        {/* Header */}
        <header className="glass border-b px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-lg text-slate-900">{exam.title}</h2>
            {/* Anti-cheat status indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-lg">
              <Eye className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs font-semibold text-green-700">Proctored</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">

            <motion.div
              className={`flex items-center font-mono text-xl font-bold px-4 py-2 rounded-xl ${
                isCriticalTime ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-800'
              }`}
              animate={isCriticalTime ? { scale: [1, 1.03, 1] } : {}}
              transition={isCriticalTime ? { repeat: Infinity, duration: 1 } : {}}
            >
              <Clock className={`w-5 h-5 mr-2 ${isCriticalTime ? 'text-red-500' : 'text-slate-500'}`} />
              {formatTime(timeLeft)}
            </motion.div>

            <motion.button
              disabled={submitting}
              onClick={handleManualSubmit}
              className="px-5 py-2 font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {submitting ? (
                <><span className="spinner" /> Submitting...</>
              ) : (
                'Submit Final'
              )}
            </motion.button>
          </div>
        </header>

        {/* Main Layout */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar Nav */}
          <div className="w-64 bg-white border-r p-6 overflow-y-auto shrink-0 hide-scrollbar">
            <h3 className="font-bold text-slate-500 text-sm tracking-wider uppercase mb-4">Questions</h3>
            <div className="text-xs text-slate-400 mb-3">
              {answeredCount}/{exam.questions.length} answered
            </div>
            <div className="grid grid-cols-4 gap-2">
              {exam.questions.map((qItem, i) => {
                const currentAns = answers[qItem.id];
                const isAnswered = currentAns && (currentAns.selectedOption || (currentAns.codeAnswer && currentAns.codeAnswer.trim()));
                const isActive = currentQIndex === i;
                return (
                  <motion.button 
                    key={i} 
                    onClick={() => goToQuestion(i)}
                    className={`h-10 rounded-lg text-sm font-bold border transition-colors ${
                      isActive ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-[0_0_0_2px_rgba(37,99,235,0.2)]' : 
                      isAnswered ? 'bg-blue-600 text-white border-transparent' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                    }`}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {i + 1}
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between text-xs text-slate-500 mb-2">
                <span>Progress</span>
                <span>{Math.round((answeredCount / exam.questions.length) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(answeredCount / exam.questions.length) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                />
              </div>
            </div>

            {/* Violation Counter */}
            {(fullscreenViolations > 0 || tabSwitchCount > 0) && (
              <div className="mt-6 pt-4 border-t space-y-2">
                <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider">Violations</h4>
                {fullscreenViolations > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Fullscreen exits</span>
                    <span className="font-bold text-red-600">{fullscreenViolations}/{MAX_FULLSCREEN_VIOLATIONS}</span>
                  </div>
                )}
                {tabSwitchCount > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Tab switches</span>
                    <span className="font-bold text-red-600">{tabSwitchCount}/{MAX_TAB_SWITCH_WARNINGS + 1}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Question Canvas */}
          <div className="flex-1 overflow-y-auto p-8 relative flex flex-col justify-between">
            <div className="max-w-3xl mx-auto w-full">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentQIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <div className="mb-8">
                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full mb-4">Point Value: {q.marks}</span>
                    <h1 className="text-2xl md:text-3xl font-medium text-slate-900 leading-relaxed">
                      <span className="text-slate-400 font-bold mr-3">{currentQIndex + 1}.</span>
                      {q.text}
                    </h1>
                  </div>

                  {q.type === 'MCQ' && currentShuffleMap ? (
                    <div className="space-y-3">
                      {/* Render options in shuffled order */}
                      {(['A', 'B', 'C', 'D'] as OptionLetter[]).map((displayLetter, optIndex) => {
                        // displayLetter = the letter shown to the user (A, B, C, D in order)
                        // originalLetter = the actual option in the database this maps to
                        const originalLetter = currentShuffleMap.displayToOriginal[displayLetter];
                        const selectedOriginal = answers[q.id]?.selectedOption as OptionLetter | undefined;
                        const isSelected = selectedOriginal === originalLetter;
                        
                        return (
                          <motion.button 
                            key={displayLetter}
                            onClick={() => setAnswers({
                              ...answers,
                              [q.id]: { ...answers[q.id], selectedOption: originalLetter }
                            })}
                            className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center group ${
                              isSelected 
                                ? 'border-blue-600 bg-blue-50 shadow-md shadow-blue-100' 
                                : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                            }`}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: optIndex * 0.05 }}
                          >
                            <div className={`w-9 h-9 rounded-xl shrink-0 flex justify-center items-center font-bold mr-4 transition-all ${
                              isSelected ? 'bg-blue-600 text-white scale-110' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                            }`}>
                              {displayLetter}
                            </div>
                            <span className={`text-lg transition-colors ${isSelected ? 'text-blue-900 font-medium' : 'text-slate-700'}`}>
                              {q.options?.[originalLetter]}
                            </span>
                            {isSelected && (
                              <motion.div
                                className="ml-auto"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 500 }}
                              >
                                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                              </motion.div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold">
                        <Code className="w-5 h-5 text-blue-600" />
                        <span>Write your solution in the code editor below:</span>
                      </div>
                      <textarea
                        rows={12}
                        value={answers[q.id]?.codeAnswer || ''}
                        onChange={(e) => setAnswers({
                          ...answers,
                          [q.id]: { ...answers[q.id], codeAnswer: e.target.value }
                        })}
                        className="w-full font-mono text-base p-6 rounded-2xl border-2 border-slate-200 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all bg-slate-900 text-slate-100 select-text"
                        placeholder="// Write code here..."
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="max-w-3xl mx-auto w-full flex justify-between mt-12 glass p-4 rounded-2xl">
              <motion.button 
                disabled={currentQIndex === 0} 
                onClick={() => { setDirection(-1); setCurrentQIndex(currentQIndex - 1); }}
                className="px-6 py-3 font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </motion.button>
              <div className="flex items-center text-sm text-slate-500 font-medium">
                {currentQIndex + 1} of {exam.questions.length}
              </div>
              <motion.button 
                disabled={currentQIndex === exam.questions.length - 1} 
                onClick={() => { setDirection(1); setCurrentQIndex(currentQIndex + 1); }}
                className="px-6 py-3 font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                Next <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
