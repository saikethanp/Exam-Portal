import { getCurrentUser, getExams, getStudentCount } from '@/lib/actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, FileText, Settings, Users, BookOpen } from 'lucide-react';
import AdminExamActions from '@/components/AdminExamActions';

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    redirect('/login');
  }

  const { exams } = await getExams();
  const studentCount = await getStudentCount();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {user.fullName}. Manage your exams and students here.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Link href="/dashboard/admin/reviews" className="flex items-center justify-center px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl shadow-sm transition-all text-sm">
            Coding Reviews
          </Link>
          <Link href="/dashboard/admin/exams/create" className="flex items-center justify-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm transition-all text-sm shrink-0">
            <PlusCircle className="w-5 h-5 mr-2" />
            Create New Exam
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <StatCard icon={<FileText />} title="Total Exams" value={exams.length} color="blue" />
        <StatCard icon={<Users />} title="Total Students" value={studentCount} color="purple" />
        <StatCard icon={<BookOpen />} title="Active Exams" value={exams.filter(e => e.published).length} color="teal" />
        <StatCard icon={<Settings />} title="System Status" value="Healthy" color="slate" />
      </div>


      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Exams</h2>
        {exams.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-lg font-medium">No exams created yet.</p>
            <p className="text-sm mt-1 mb-6">Create your first exam to get started.</p>
            <Link href="/dashboard/admin/exams/create" className="text-blue-600 font-medium hover:underline">
              Create Exam &rarr;
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-medium text-sm">
                <tr>
                  <th className="px-6 py-4 text-left tracking-wider">Exam Title</th>
                  <th className="px-6 py-4 text-left tracking-wider">Duration</th>
                  <th className="px-6 py-4 text-left tracking-wider">Total Marks</th>
                  <th className="px-6 py-4 text-left tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-slate-900">{exam.title}</td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600">{exam.durationMinutes} mins</td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600">{exam.totalMarks}</td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${exam.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {exam.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <AdminExamActions examId={exam.id} />
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

function StatCard({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: string | number, color: string }) {
  const colorMap: Record<string, string> = {
    blue: "text-blue-600 bg-blue-100",
    purple: "text-purple-600 bg-purple-100",
    teal: "text-teal-600 bg-teal-100",
    slate: "text-slate-600 bg-slate-100",
  };
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center">
      <div className={`p-4 rounded-xl ${colorMap[color]} mr-4`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
