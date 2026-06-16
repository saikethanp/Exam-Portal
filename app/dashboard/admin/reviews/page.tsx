import CodingReviewPanel from '@/components/CodingReviewPanel';
import { getCurrentUser } from '@/lib/actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function AdminReviewsPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    redirect('/login');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <Link href="/dashboard/admin" className="text-blue-600 hover:underline flex items-center font-medium mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Coding Exam Evaluations</h1>
        <p className="text-slate-500 mt-1">Review student code answers and grade evaluations to finalize results.</p>
      </div>

      <CodingReviewPanel />
    </div>
  );
}
