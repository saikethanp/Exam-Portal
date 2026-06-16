import { getCurrentUser, getExams, getResultsForStudent } from '@/lib/actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Award, Clock } from 'lucide-react';

export default async function StudentDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'STUDENT') {
    redirect('/login');
  }

  const { exams: allExams } = await getExams('', 1, 100);
  const results = await getResultsForStudent(user.id);
  const resultExamIds = results.map(r => r.examId);

  // Filter exams that are published
  const availableExams = allExams.filter(e => e.published && !resultExamIds.includes(e.id));
  const completedExams = results.map(r => {
    const ex = allExams.find(e => e.id === r.examId);
    return { ...r, examTitle: ex?.title || 'Unknown Exam' };
  });


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Student Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome, {user.fullName}. Here are your pending assessments and performance reports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* Available Exams */}
        <section>
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
              <BookOpen className="w-5 h-5"/>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Available Exams</h2>
          </div>
          
          {availableExams.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
              <p>No exams available right now.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableExams.map(exam => (
                <div key={exam.id} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{exam.title}</h3>
                    <div className="flex items-center text-sm text-slate-500 mt-2 space-x-4">
                      <span className="flex items-center"><Clock className="w-4 h-4 mr-1 text-slate-400"/> {exam.durationMinutes} mins</span>
                      <span className="bg-slate-100 px-2.5 py-0.5 rounded-full text-xs font-medium text-slate-600">{exam.totalMarks} marks</span>
                    </div>
                  </div>
                  <Link href={`/exam/${exam.id}`} className="w-full sm:w-auto text-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm transition-colors">
                    Take Exam
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Results */}
        <section>
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mr-3">
              <Award className="w-5 h-5"/>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Your Results</h2>
          </div>
          
          {completedExams.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
              <p>You haven&apos;t taken any exams yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedExams.map(result => (
                <div key={result.id} className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{result.examTitle}</h3>
                    <p className="text-sm text-slate-500 mt-1">Taken on {new Date(result.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right flex items-center justify-between sm:block w-full sm:w-auto">
                    <div className={`text-2xl font-bold ${
                      result.status === 'PASS' || result.status === 'Pass' ? 'text-green-600' :
                      result.status === 'PENDING_REVIEW' ? 'text-amber-500 font-medium' : 'text-red-500'
                    }`}>
                      {result.status === 'PENDING_REVIEW' ? '—' : `${result.percentage.toFixed(1)}%`}
                    </div>
                    <div className={`text-xs font-bold uppercase tracking-wide mt-1 ${
                      result.status === 'PASS' || result.status === 'Pass' ? 'text-green-600' :
                      result.status === 'PENDING_REVIEW' ? 'text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-block' : 'text-red-500'
                    }`}>
                      {result.status === 'PENDING_REVIEW' ? 'Pending Review' : result.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
