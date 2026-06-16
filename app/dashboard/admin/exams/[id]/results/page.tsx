import { getExamResultsById, getExamById, getCurrentUser } from '@/lib/actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Trophy } from 'lucide-react';

export default async function ExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    redirect('/login');
  }

  const resolvedParams = await params;
  const exam = await getExamById(resolvedParams.id);
  
  if (!exam) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Exam Not Found</h1>
        <p className="text-slate-600 mb-8">The exam you are trying to view results for does not exist.</p>
        <Link href="/dashboard/admin" className="text-blue-600 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const results = await getExamResultsById(resolvedParams.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <Link href="/dashboard/admin" className="text-blue-600 hover:underline flex items-center font-medium mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Results: {exam.title}</h1>
        <p className="text-slate-500 mt-1 flex items-center gap-4">
          <span className="flex items-center"><Users className="w-4 h-4 mr-1" /> {results.length} Students Completed</span>
          <span className="flex items-center"><Trophy className="w-4 h-4 mr-1 text-amber-500" /> Total Marks: {exam.totalMarks}</span>
        </p>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
        {results.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No students have completed this exam yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-medium text-sm">
                <tr>
                  <th className="px-6 py-4 text-left tracking-wider">Student Name</th>
                  <th className="px-6 py-4 text-left tracking-wider">Roll Number</th>
                  <th className="px-6 py-4 text-left tracking-wider">Marks Obtained</th>
                  <th className="px-6 py-4 text-left tracking-wider">Percentage</th>
                  <th className="px-6 py-4 text-left tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {results.map((result) => (
                  <tr key={result.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{result.student.fullName}</div>
                      <div className="text-xs text-slate-500">{result.student.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">
                      {result.student.rollNumber || <span className="text-slate-400 italic">Not Provided</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                      {result.score} <span className="text-slate-400 font-normal">/ {result.totalMarks}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                      {result.percentage.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {result.status === 'PENDING_REVIEW' ? (
                        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-amber-100 text-amber-800">
                          Pending Review
                        </span>
                      ) : result.status === 'PASS' ? (
                        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-green-100 text-green-800">
                          Passed
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-red-100 text-red-800">
                          Failed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
