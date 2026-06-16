'use client';

import { useState } from 'react';
import { useToast } from './ToastProvider';
import ConfirmModal from './ConfirmModal';
import { deleteExam } from '@/lib/actions';
import { useRouter } from 'next/navigation';

export default function AdminExamActions({ examId }: { examId: string }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/dashboard/admin/exams/edit/${examId}`);
  };

  const handleResults = () => {
    router.push(`/dashboard/admin/exams/${examId}/results`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteExam(examId);
      showToast('Exam deleted successfully.', 'success', 3000);
      router.refresh(); // Refresh the page to show the updated list
    } catch (error: any) {
      console.error(error);
      showToast(error?.message || 'Failed to delete exam.', 'error', 4000);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <button 
        onClick={handleResults} 
        className="text-green-600 hover:text-green-900 mr-4 font-medium transition-colors"
      >
        Results
      </button>
      <button 
        onClick={handleEdit} 
        className="text-blue-600 hover:text-blue-900 mr-4 font-medium transition-colors"
      >
        Edit
      </button>
      <button 
        onClick={() => setShowDeleteConfirm(true)} 
        disabled={isDeleting}
        className="text-red-600 hover:text-red-900 font-medium transition-colors disabled:opacity-50"
      >
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>

      <ConfirmModal
        open={showDeleteConfirm}
        title="Delete Exam"
        message="Are you sure you want to delete this exam? This action cannot be undone and will delete all associated questions and student results."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
