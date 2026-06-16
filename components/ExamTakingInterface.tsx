'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { submitExamResult, saveStudentAnswersDraft, getSavedAnswersDraft } from '@/lib/actions';
import type { Exam, Question } from '@/lib/db';
import { AlertTriangle, Clock, CheckCircle2, ChevronLeft, ChevronRight, Code } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './ToastProvider';
import ConfirmModal from './ConfirmModal';

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

  const answersRef = useRef(answers);
  const submittingRef = useRef(false);

  // Sync ref
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { submittingRef.current = submitting; }, [submitting]);

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


  const doSubmit = useCallback(async (auto = false) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    try {
      // Final save draft before evaluation
      await saveStudentAnswersDraft(exam.id, answersRef.current);

      await submitExamResult(exam.id);

      // Clean up timer
      localStorage.removeItem(`exam_timer_${exam.id}_${studentId}`);

      showToast(
        auto ? 'Your exam has been auto-submitted.' : 'Exam submitted successfully!',
        auto ? 'error' : 'success',
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

  // Keyboard shortcuts
  useEffect(() => {
    if (!started) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return; // ignore in coding editor
      if (e.key === 'ArrowRight' && currentQIndex < exam.questions.length - 1) {
        setDirection(1);
        setCurrentQIndex(prev => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentQIndex > 0) {
        setDirection(-1);
        setCurrentQIndex(prev => prev - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [started, currentQIndex, exam.questions.length]);

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
            className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-left mb-8 space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h3 className="font-bold text-blue-900 border-b border-blue-100 pb-2 mb-3">Exam Rules & Instructions</h3>
            <p className="flex text-sm text-blue-800"><CheckCircle2 className="w-5 h-5 mr-2 text-blue-500 shrink-0"/> The exam lasts exactly {exam.durationMinutes} minutes. Auto-submits when time runs out.</p>
            <p className="flex text-sm text-blue-800"><CheckCircle2 className="w-5 h-5 mr-2 text-blue-500 shrink-0"/> Total marks: {exam.totalMarks}. Answer all questions to score maximum.</p>
            <p className="flex text-sm text-blue-800"><CheckCircle2 className="w-5 h-5 mr-2 text-blue-500 shrink-0"/> Use arrow keys (← →) to navigate between questions.</p>
          </motion.div>
          
          <motion.button
            onClick={() => setStarted(true)}
            className="w-full py-4 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded-xl shadow-md"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            Begin Exam
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

  return (
    <div className="fixed inset-0 bg-slate-50 z-[100] flex flex-col select-none">
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
        <h2 className="font-bold text-lg text-slate-900">{exam.title}</h2>
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

                {q.type === 'MCQ' ? (
                  <div className="space-y-3">
                    {['A', 'B', 'C', 'D'].map((opt, optIndex) => {
                      const optLetter = opt as 'A'|'B'|'C'|'D';
                      const isSelected = answers[q.id]?.selectedOption === optLetter;
                      return (
                        <motion.button 
                          key={opt}
                          onClick={() => setAnswers({
                            ...answers,
                            [q.id]: { ...answers[q.id], selectedOption: optLetter }
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
                            {opt}
                          </div>
                          <span className={`text-lg transition-colors ${isSelected ? 'text-blue-900 font-medium' : 'text-slate-700'}`}>
                            {q.options?.[optLetter]}
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
  );
}
