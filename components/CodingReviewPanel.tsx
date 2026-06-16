'use client';

import { useState, useEffect } from 'react';
import { getPendingEvaluations, getStudentAnswersForEvaluation, saveCodingEvaluation } from '@/lib/actions';
import { useToast } from '@/components/ToastProvider';
import { Check, Edit3, ClipboardList, AlertCircle, User, Book, FileCode } from 'lucide-react';

export default function CodingReviewPanel() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [selectedEval, setSelectedEval] = useState<any>(null);
  
  // Maps question ID to awarded score
  const [scores, setScores] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEvaluations();
  }, [search]);

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      const data = await getPendingEvaluations(search);
      setEvaluations(data);
    } catch (e: any) {
      showToast(e?.message || 'Failed to fetch pending coding reviews.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvaluation = async (result: any) => {
    setSelectedEval(null);
    setScores({});
    try {
      const details = await getStudentAnswersForEvaluation(result.id);
      setSelectedEval(details);
      
      // Initialize scores map with default 0 or existing
      const initialScores: Record<string, number> = {};
      details.codingAnswers.forEach(ans => {
        initialScores[ans.questionId] = 0;
      });
      setScores(initialScores);
    } catch (e: any) {
      showToast(e?.message || 'Failed to fetch student answers details.', 'error');
    }
  };

  const handleScoreChange = (qId: string, val: number, maxMarks: number) => {
    if (val < 0 || val > maxMarks) return;
    setScores(prev => ({
      ...prev,
      [qId]: val
    }));
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEval) return;

    setSubmitting(true);
    try {
      await saveCodingEvaluation(selectedEval.result.id, scores);
      showToast('Grading evaluated and finalized successfully!', 'success');
      setSelectedEval(null);
      fetchEvaluations();
    } catch (e: any) {
      showToast(e?.message || 'Failed to submit evaluation.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Pane - Pending Evaluations List */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            Pending Evaluations
          </h2>
          
          <input
            type="text"
            placeholder="Search student or exam..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all mb-4"
          />

          {loading ? (
            <div className="text-center py-8 text-slate-500 text-sm">Loading submissions...</div>
          ) : evaluations.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No pending evaluations found.</div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {evaluations.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectEvaluation(item)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-1 ${
                    selectedEval?.result?.id === item.id
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                      : 'border-slate-100 hover:border-blue-200 bg-white'
                  }`}
                >
                  <div className="font-bold text-slate-900 text-sm">{item.student.fullName}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Book className="w-3.5 h-3.5 text-slate-400" />
                    {item.exam.title}
                  </div>
                  <div className="text-[10px] bg-amber-100 text-amber-800 font-bold uppercase tracking-wider px-2 py-0.5 rounded-full self-start mt-2">
                    Pending Review
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane - Selected Detail Review & Evaluation */}
      <div className="lg:col-span-8">
        {selectedEval ? (
          <form onSubmit={handleSaveEvaluation} className="bg-white p-6 rounded-2xl border shadow-sm space-y-6">
            <div className="border-b pb-4 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-slate-500" />
                  Evaluate Student: {selectedEval.result.student.fullName}
                </h2>
                <p className="text-sm text-slate-500 mt-1">Exam: {selectedEval.result.exam.title}</p>
              </div>
            </div>

            <div className="space-y-6">
              {selectedEval.codingAnswers.map((ans: any, idx: number) => (
                <div key={ans.id} className="border border-slate-100 rounded-2xl p-6 bg-slate-50/50 space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-bold text-slate-800 flex items-center gap-1">
                      <FileCode className="w-4 h-4 text-slate-400" />
                      Coding Question #{idx + 1}
                    </span>
                    <span className="text-xs text-slate-500 font-bold bg-white border px-3 py-1 rounded-full">
                      Maximum Marks: {ans.question.marks}
                    </span>
                  </div>

                  <p className="text-slate-800 font-medium text-sm">{ans.question.text}</p>

                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-500">Student Submission:</span>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-sm overflow-x-auto max-h-60">
                      {ans.codeAnswer ? ans.codeAnswer.trim() : '// (No Answer Submitted)'}
                    </pre>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <label className="text-sm font-medium text-slate-700">Awarded Marks:</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={ans.question.marks}
                      value={scores[ans.questionId] ?? 0}
                      onChange={(e) => handleScoreChange(ans.questionId, Number(e.target.value), ans.question.marks)}
                      className="w-20 px-3 py-2 text-center rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all font-bold text-lg"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedEval(null)}
                className="px-5 py-2.5 text-sm font-semibold border rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow transition-colors flex items-center gap-2"
              >
                {submitting ? 'Submitting...' : <><Check className="w-4 h-4" /> Save Evaluation</>}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-slate-50 rounded-2xl border border-dashed p-12 text-center text-slate-400 flex flex-col items-center justify-center h-full min-h-[300px]">
            <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="font-bold text-slate-700 text-lg">Select a Student</h3>
            <p className="text-sm mt-1">Select a student from the list to evaluate their coding answers.</p>
          </div>
        )}
      </div>
    </div>
  );
}
