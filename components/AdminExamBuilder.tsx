'use client';

import { useState, useMemo } from 'react';
import { createExam, updateExam } from '@/lib/actions';
import { FileSpreadsheet, CheckCircle, AlertCircle, Trash2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './ToastProvider';

interface FormattedQuestion {
  type: 'MCQ' | 'CODING';
  text: string;
  options: { A: string; B: string; C: string; D: string };
  correctOption: string;
  marks: number;
}

export default function AdminExamBuilder({ initialData }: { initialData?: any }) {
  const { showToast } = useToast();

  const [title, setTitle] = useState(initialData?.title || '');
  const [durationMinutes, setDurationMinutes] = useState(initialData?.durationMinutes || 60);
  const [mcqMarks, setMcqMarks] = useState(1);
  const [codingMarks, setCodingMarks] = useState(10);

  const [questions, setQuestions] = useState<FormattedQuestion[]>(
    initialData?.questions?.length > 0
      ? initialData.questions.map((q: any) => ({
          type: q.type || 'MCQ',
          text: q.text,
          options: q.options || { A: '', B: '', C: '', D: '' },
          correctOption: q.correctOption || 'A',
          marks: q.marks || 1
        }))
      : []
  );

  const [bulkText, setBulkText] = useState('');
  const [bulkPreview, setBulkPreview] = useState<{ parsed: FormattedQuestion[]; errors: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  // Live stats
  const stats = useMemo(() => {
    const mcqQuestions = questions.filter(q => q.type === 'MCQ');
    const codingQuestions = questions.filter(q => q.type === 'CODING');
    const mcqTotal = mcqQuestions.reduce((sum, q) => sum + q.marks, 0);
    const codingTotal = codingQuestions.reduce((sum, q) => sum + q.marks, 0);
    return {
      mcqCount: mcqQuestions.length,
      codingCount: codingQuestions.length,
      mcqTotal,
      codingTotal,
      totalMarks: mcqTotal + codingTotal,
      totalQuestions: questions.length,
    };
  }, [questions]);

  // Bulk Question Parser
  const parseBulkImport = () => {
    if (!bulkText.trim()) {
      showToast('Bulk box is empty.', 'warning', 3000);
      return;
    }

    const sections = bulkText.split(/\r?\n\r?\n/);
    const parsed: FormattedQuestion[] = [];
    const errors: string[] = [];

    sections.forEach((section, idx) => {
      const cleanSection = section.trim();
      if (!cleanSection) return;

      const lines = cleanSection.split('\n').map(l => l.trim());
      const typeLine = lines.find(l => l.toUpperCase().startsWith('TYPE:'));
      if (!typeLine) {
        errors.push(`Block #${idx + 1}: Missing "TYPE:" declaration (MCQ or CODING).`);
        return;
      }

      const type = typeLine.split(':')[1]?.trim().toUpperCase();
      if (type !== 'MCQ' && type !== 'CODING') {
        errors.push(`Block #${idx + 1}: Unknown type "${type}". Must be MCQ or CODING.`);
        return;
      }

      const qLine = lines.find(l => l.toUpperCase().startsWith('QUESTION:'));
      if (!qLine) {
        errors.push(`Block #${idx + 1}: Missing "QUESTION:" key.`);
        return;
      }
      const text = qLine.substring(qLine.indexOf(':') + 1).trim();

      // Use MARKS from the text if provided, otherwise use the default from the form
      const marksLine = lines.find(l => l.toUpperCase().startsWith('MARKS:'));
      let marks: number;
      if (marksLine) {
        marks = Number(marksLine.split(':')[1]?.trim()) || (type === 'MCQ' ? mcqMarks : codingMarks);
      } else {
        marks = type === 'MCQ' ? mcqMarks : codingMarks;
      }

      if (type === 'MCQ') {
        const optA = lines.find(l => l.startsWith('A:'))?.substring(2).trim();
        const optB = lines.find(l => l.startsWith('B:'))?.substring(2).trim();
        const optC = lines.find(l => l.startsWith('C:'))?.substring(2).trim();
        const optD = lines.find(l => l.startsWith('D:'))?.substring(2).trim();

        const ansLine = lines.find(l => l.toUpperCase().startsWith('ANSWER:'));
        const correctOption = ansLine?.split(':')[1]?.trim().toUpperCase() || '';

        if (!optA || !optB || !optC || !optD) {
          errors.push(`Block #${idx + 1}: MCQ requires options A:, B:, C:, and D:.`);
          return;
        }

        if (!['A', 'B', 'C', 'D'].includes(correctOption)) {
          errors.push(`Block #${idx + 1}: MCQ requires correct ANSWER: (A, B, C, or D).`);
          return;
        }

        parsed.push({
          type: 'MCQ',
          text,
          options: { A: optA, B: optB, C: optC, D: optD },
          correctOption,
          marks
        });
      } else {
        // CODING
        parsed.push({
          type: 'CODING',
          text,
          options: { A: '', B: '', C: '', D: '' },
          correctOption: '',
          marks
        });
      }
    });

    setBulkPreview({ parsed, errors });
    if (errors.length > 0) {
      showToast('Found formatting errors in bulk text. Review highlights.', 'error', 5000);
    } else {
      showToast(`Parsed ${parsed.length} questions successfully! Review preview below.`, 'success', 3000);
    }
  };

  const importBulkQuestions = () => {
    if (!bulkPreview || bulkPreview.parsed.length === 0) return;
    setQuestions([...questions, ...bulkPreview.parsed]);
    setBulkPreview(null);
    setBulkText('');
    showToast('Imported questions successfully!', 'success', 3000);
  };

  const handleClearAll = () => {
    setQuestions([]);
    showToast('Cleared all questions.', 'info', 2000);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
    showToast('Question removed.', 'info', 2000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Please enter an exam title.', 'warning', 3000);
      return;
    }
    if (!durationMinutes || durationMinutes < 1) {
      showToast('Duration must be at least 1 minute.', 'warning', 3000);
      return;
    }
    if (questions.length === 0) {
      showToast('Please import questions via the Bulk Import box before publishing.', 'warning', 4000);
      return;
    }

    setLoading(true);

    const examData = {
      title: title.trim(),
      durationMinutes: Number(durationMinutes),
      totalMarks: stats.totalMarks,
      passingMarks: 0,
      questions: questions.map(q => ({
        ...q,
        id: Math.random().toString(36).substring(2, 9)
      })),
      published: true
    };

    try {
      if (initialData) {
        await updateExam(initialData.id, examData);
        showToast('Exam updated successfully! 🎉', 'success', 3000);
      } else {
        await createExam(examData);
        showToast('Exam published successfully! 🎉', 'success', 3000);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || (initialData ? 'Failed to update exam.' : 'Failed to create exam.'), 'error', 5000);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto pb-24 space-y-8">
      {/* Exam Details — Simplified */}
      <motion.div
        className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b pb-4">Exam Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Exam Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
              placeholder="e.g. Final Exam — Data Structures"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Duration (minutes)</label>
            <input
              required
              type="number"
              min="1"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
              placeholder="60"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Marks per MCQ</label>
              <input
                type="number"
                min="1"
                value={mcqMarks}
                onChange={(e) => setMcqMarks(Number(e.target.value) || 1)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Marks per Coding</label>
              <input
                type="number"
                min="1"
                value={codingMarks}
                onChange={(e) => setCodingMarks(Number(e.target.value) || 1)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Live stats bar */}
        <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Summary</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-xl border border-slate-100">
              <div className="text-2xl font-bold text-blue-600">{stats.mcqCount}</div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-1">MCQ Questions</div>
              <div className="text-xs font-bold text-blue-500 mt-0.5">{stats.mcqTotal} marks</div>
            </div>
            <div className="text-center p-3 bg-white rounded-xl border border-slate-100">
              <div className="text-2xl font-bold text-amber-600">{stats.codingCount}</div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-1">Coding Questions</div>
              <div className="text-xs font-bold text-amber-500 mt-0.5">{stats.codingTotal} marks</div>
            </div>
            <div className="text-center p-3 bg-white rounded-xl border border-slate-100">
              <div className="text-2xl font-bold text-slate-900">{stats.totalQuestions}</div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-1">Total Questions</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="text-2xl font-bold text-green-700">{stats.totalMarks}</div>
              <div className="text-[10px] font-semibold text-green-600 uppercase tracking-wider mt-1">Total Marks</div>
              <div className="text-[10px] text-green-500 mt-0.5">Auto-calculated</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bulk Question Import Box */}
      <motion.div
        className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <FileSpreadsheet className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-bold text-slate-900">Bulk Question Import</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Paste multiple questions separated by empty lines. If MARKS: is omitted, the default marks per question type (set above) will be used.
        </p>
        <textarea
          rows={12}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          className="w-full font-mono text-sm px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none transition-all"
          placeholder={`TYPE: MCQ\nQUESTION: What is Python?\nA: Programming Language\nB: Animal\nC: Car\nD: Operating System\nANSWER: A\nMARKS: 1\n\nTYPE: CODING\nQUESTION: Write a Python function to reverse a string.\nMARKS: 10`}
        />
        <div className="mt-4 flex gap-4">
          <button
            type="button"
            onClick={parseBulkImport}
            className="px-5 py-2.5 bg-green-600 text-white font-medium text-sm rounded-xl hover:bg-green-700 transition-colors shadow-sm"
          >
            Parse & Validate Questions
          </button>
        </div>

        {/* Bulk Preview */}
        <AnimatePresence>
          {bulkPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 border-t pt-6"
            >
              {bulkPreview.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center text-red-800 font-bold text-sm mb-2">
                    <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
                    Invalid Configurations Found ({bulkPreview.errors.length}):
                  </div>
                  <ul className="list-disc pl-5 text-xs text-red-700 space-y-1">
                    {bulkPreview.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {bulkPreview.parsed.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-green-800 font-bold text-sm">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Parsed {bulkPreview.parsed.length} Questions (Ready to Import):
                    </div>
                    <button
                      type="button"
                      onClick={importBulkQuestions}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow"
                    >
                      Import to Exam
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-3 p-3 bg-slate-50 border rounded-xl">
                    {bulkPreview.parsed.map((q, i) => (
                      <div key={i} className="text-xs p-3 bg-white border rounded shadow-sm">
                        <div className="flex justify-between font-bold mb-1 text-slate-700">
                          <span>Question {i + 1} ({q.type})</span>
                          <span>{q.marks} Marks</span>
                        </div>
                        <p className="text-slate-800 font-medium">{q.text}</p>
                        {q.type === 'MCQ' && (
                          <div className="grid grid-cols-2 gap-1 mt-2 text-slate-500">
                            <div>A: {q.options.A}</div>
                            <div>B: {q.options.B}</div>
                            <div>C: {q.options.C}</div>
                            <div>D: {q.options.D}</div>
                            <div className="col-span-2 text-green-600 font-bold mt-1">Answer: {q.correctOption}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Question Bank List */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Imported Questions</h2>
          {questions.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-red-600 hover:underline font-bold"
            >
              Clear All Questions
            </button>
          )}
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-2xl text-slate-400">
            No questions imported yet. Use the Bulk box above to write and load questions.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-2">
            {questions.map((q, index) => (
              <div key={index} className="py-4 first:pt-0 last:pb-0 group">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold">#{index + 1}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                      q.type === 'CODING' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {q.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500 shrink-0">{q.marks} Marks</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(index)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-slate-800 text-sm font-medium">{q.text}</p>
                {q.type === 'MCQ' && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-slate-500 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>A: {q.options.A}</div>
                    <div>B: {q.options.B}</div>
                    <div>C: {q.options.C}</div>
                    <div>D: {q.options.D}</div>
                    <div className="col-span-2 text-green-700 font-bold mt-1.5 border-t border-slate-200/60 pt-1.5">Correct Answer: {q.correctOption}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* MCQ / Coding counts inline */}
        {questions.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs font-semibold">
            <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full">
              MCQ: {stats.mcqCount} questions · {stats.mcqTotal} marks
            </span>
            <span className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full">
              Coding: {stats.codingCount} questions · {stats.codingTotal} marks
            </span>
          </div>
        )}
      </div>

      {/* Floating Bottom Bar */}
      <motion.div
        className="sticky bottom-6 glass p-4 rounded-2xl border border-slate-200 shadow-xl flex justify-between items-center z-20"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <span className="text-slate-500 text-sm">Questions: </span>
            <span className="font-bold text-slate-900">{stats.totalQuestions}</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div>
            <span className="text-slate-500 text-sm">Total Marks: </span>
            <span className="font-bold text-green-700">{stats.totalMarks}</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div>
            <span className="text-slate-500 text-sm">Duration: </span>
            <span className="font-bold text-slate-900">{durationMinutes} min</span>
          </div>
        </div>
        <motion.button
          type="submit"
          disabled={loading || questions.length === 0}
          className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          {loading ? (
            <><span className="spinner" /> {initialData ? 'Updating...' : 'Publishing...'}</>
          ) : (
            initialData ? 'Update Exam' : 'Save & Publish Exam'
          )}
        </motion.button>
      </motion.div>
    </form>
  );
}
