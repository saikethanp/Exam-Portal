import { getExamById, getCurrentUser } from '@/lib/actions';
import ExamTakingInterface from '@/components/ExamTakingInterface';
import { redirect } from 'next/navigation';

export default async function TakeExamPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== 'STUDENT') redirect('/login');

  const exam = await getExamById(resolvedParams.id);
  
  if (!exam) {
    return (
      <div className="max-w-3xl mx-auto py-24 px-4 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Exam Not Found</h1>
        <p className="text-slate-600">The requested examination does not exist or has been removed.</p>
      </div>
    );
  }

  return <ExamTakingInterface exam={exam} studentId={user.id} />;
}
