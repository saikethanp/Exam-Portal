import AdminExamBuilder from '@/components/AdminExamBuilder';
import { getCurrentUser, getExamById } from '@/lib/actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
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
        <p className="text-slate-600 mb-8">The exam you are trying to edit does not exist.</p>
        <Link href="/dashboard/admin" className="text-blue-600 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <Link href="/dashboard/admin" className="text-blue-600 hover:underline flex items-center font-medium mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Edit Exam: {exam.title}</h1>
        <p className="text-slate-500 mt-1">Update exam details and questions.</p>
      </div>
      
      <AdminExamBuilder initialData={exam} />
    </div>
  );
}
