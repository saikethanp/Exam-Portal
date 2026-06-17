'use server'

import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// ===== Validation Helpers =====
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitize(str: string): string {
  return str.trim();
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

// ===== Auth Actions =====
export async function registerUser(formData: FormData) {
  const email = sanitize(formData.get('email') as string || '');
  const rawPassword = formData.get('password') as string || '';
  const fullName = sanitize(formData.get('fullName') as string || '');
  const phone = sanitize(formData.get('phone') as string || '');
  const rollNumber = sanitize(formData.get('rollNumber') as string || '');
  const department = sanitize(formData.get('department') as string || '');

  // Server-side validation
  if (!fullName || fullName.length < 2) {
    return { error: 'Full name must be at least 2 characters.' };
  }
  if (!validateEmail(email)) {
    return { error: 'Please enter a valid email address.' };
  }
  if (rawPassword.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }
  if (!phone || phone.length < 7) {
    return { error: 'Please enter a valid phone number.' };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: 'Email already registered.' };
  }
  
  const hashedPassword = await bcrypt.hash(rawPassword, 12);

  await prisma.user.create({
    data: {
      fullName,
      email,
      phone,
      rollNumber: rollNumber || null,
      department: department || null,
      password: hashedPassword,
      role: 'STUDENT',
    }
  });

  return { success: true };
}

export async function loginUser(formData: FormData) {
  const email = sanitize(formData.get('email') as string || '');
  const password = formData.get('password') as string || '';
  const isAdminLogin = formData.get('isAdmin') === 'true';

  if (!validateEmail(email) || !password) {
    return { error: 'Invalid email or password.' };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) return { error: 'Invalid email or password.' };
  
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return { error: 'Invalid email or password.' };
  
  if (isAdminLogin && user.role === 'STUDENT') {
    return { error: 'Invalid admin credentials.' };
  }

  const cookieStore = await cookies();
  cookieStore.set('auth_user', JSON.stringify({ id: user.id, role: user.role }), COOKIE_OPTIONS);

  return { success: true, role: user.role };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_user');
  redirect('/');
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth_user');
  if (!authCookie) return null;
  try {
    const session = JSON.parse(authCookie.value);
    if (!session?.id) return null;
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    return user || null;
  } catch {
    return null;
  }
}

// ===== Exam Actions =====
export async function createExam(examData: any) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized');
  }

  const { questions, ...examCore } = examData;

  // Validate exam data server-side
  if (!examCore.title || !examCore.durationMinutes) {
    throw new Error('Missing required exam fields (title, duration).');
  }
  if (!questions || questions.length === 0) {
    throw new Error('Exam must have at least one question.');
  }

  // Auto-calculate totalMarks from questions
  const totalMarks = questions.reduce((sum: number, q: any) => sum + (Number(q.marks) || 0), 0);

  await prisma.exam.create({
    data: {
      title: sanitize(examCore.title),
      subject: examCore.subject || '',
      description: examCore.description || '',
      durationMinutes: Number(examCore.durationMinutes),
      totalMarks,
      passingMarks: Number(examCore.passingMarks) || 0,
      instructions: examCore.instructions || '',
      published: examCore.published ?? true,
      createdBy: user.id,
      questions: {
        create: questions.map((q: any) => ({
          type: q.type || 'MCQ',
          text: sanitize(q.text),
          options: q.type === 'CODING' ? null : q.options,
          correctOption: q.type === 'CODING' ? null : q.correctOption,
          marks: Number(q.marks) || 1,
        }))
      }
    }
  });
  
  redirect('/dashboard/admin');
}

export async function updateExam(id: string, examData: any) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized');
  }

  const { questions, ...examCore } = examData;

  if (!examCore.title || !examCore.durationMinutes) {
    throw new Error('Missing required exam fields (title, duration).');
  }
  if (!questions || questions.length === 0) {
    throw new Error('Exam must have at least one question.');
  }

  // Auto-calculate totalMarks from questions
  const totalMarks = questions.reduce((sum: number, q: any) => sum + (Number(q.marks) || 0), 0);

  // Delete all existing questions first, then recreate them
  await prisma.question.deleteMany({
    where: { examId: id }
  });

  await prisma.exam.update({
    where: { id },
    data: {
      title: sanitize(examCore.title),
      subject: examCore.subject || '',
      description: examCore.description || '',
      durationMinutes: Number(examCore.durationMinutes),
      totalMarks,
      passingMarks: Number(examCore.passingMarks) || 0,
      instructions: examCore.instructions || '',
      published: examCore.published ?? true,
      questions: {
        create: questions.map((q: any) => ({
          type: q.type || 'MCQ',
          text: sanitize(q.text),
          options: q.type === 'CODING' ? null : q.options,
          correctOption: q.type === 'CODING' ? null : q.correctOption,
          marks: Number(q.marks) || 1,
        }))
      }
    }
  });

  redirect('/dashboard/admin');
}

// Optimized & Paginated Exams Query
export async function getExams(search = '', page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const where = search
    ? {
        title: { contains: search, mode: 'insensitive' as const }
      }
    : {};

  const [exams, total] = await Promise.all([
    prisma.exam.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.exam.count({ where })
  ]);

  return { exams, total };
}

export async function getStudentCount() {
  return await prisma.user.count({
    where: { role: 'STUDENT' }
  });
}

export async function getExamById(id: string) {
  if (!id || typeof id !== 'string') return null;
  return await prisma.exam.findUnique({
    where: { id },
    include: { questions: { orderBy: { createdAt: 'asc' } } }
  });
}

// ===== StudentAnswer Auto-Save Actions =====
export async function saveStudentAnswersDraft(examId: string, answerDrafts: Record<string, { selectedOption?: string; codeAnswer?: string }>) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'STUDENT') throw new Error('Unauthorized');

  // Prevent autosave if they already submitted a result for this exam
  const submitted = await prisma.result.findFirst({
    where: { studentId: user.id, examId }
  });
  if (submitted) return { error: 'Exam already submitted.' };

  const draftEntries = Object.entries(answerDrafts);
  if (draftEntries.length === 0) return { success: true };

  // Optimized: Use deleteMany + createMany instead of N upserts
  // This reduces 50 queries down to just 2 queries, fixing the 60-second lag
  await prisma.$transaction([
    prisma.studentAnswer.deleteMany({
      where: {
        studentId: user.id,
        examId,
      }
    }),
    prisma.studentAnswer.createMany({
      data: draftEntries.map(([qId, ans]) => ({
        studentId: user.id,
        examId,
        questionId: qId,
        selectedOption: ans.selectedOption || null,
        codeAnswer: ans.codeAnswer || null,
      }))
    })
  ]);

  return { success: true };
}

export async function getSavedAnswersDraft(examId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'STUDENT') throw new Error('Unauthorized');

  const answers = await prisma.studentAnswer.findMany({
    where: { studentId: user.id, examId }
  });

  return answers;
}

// ===== Result Actions =====
export async function submitExamResult(examId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'STUDENT') throw new Error('Unauthorized');

  // Prevent duplicate submissions
  const existingResult = await prisma.result.findFirst({
    where: { studentId: user.id, examId }
  });
  if (existingResult) {
    throw new Error('You have already submitted this exam.');
  }

  // Fetch exam questions and student answers
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { questions: true }
  });
  if (!exam) throw new Error('Exam not found.');

  const answers = await prisma.studentAnswer.findMany({
    where: { studentId: user.id, examId }
  });

  const answersMap = new Map(answers.map(a => [a.questionId, a]));

  let score = 0;
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  let hasCoding = false;

  exam.questions.forEach(q => {
    const ans = answersMap.get(q.id);
    if (q.type === 'CODING') {
      hasCoding = true;
      if (!ans || !ans.codeAnswer || !ans.codeAnswer.trim()) {
        skipped++;
      }
    } else {
      // MCQ
      if (!ans || !ans.selectedOption) {
        skipped++;
      } else if (ans.selectedOption === q.correctOption) {
        correct++;
        score += q.marks;
      } else {
        wrong++;
      }
    }
  });

  const percentage = exam.totalMarks > 0 ? (score / exam.totalMarks) * 100 : 0;
  let status = 'FAIL';
  if (hasCoding) {
    status = 'PENDING_REVIEW';
  } else {
    status = score >= exam.passingMarks ? 'PASS' : 'FAIL';
  }

  const result = await prisma.result.create({
    data: {
      studentId: user.id,
      examId,
      score,
      totalMarks: exam.totalMarks,
      percentage,
      status,
      correctAnswers: correct,
      wrongAnswers: wrong,
      skippedQuestions: skipped,
      date: new Date(),
    }
  });

  return result.id;
}

export async function getResultsForStudent(studentId: string) {
  return await prisma.result.findMany({
    where: { studentId },
    include: { exam: true },
    orderBy: { date: 'desc' }
  });
}

export async function deleteExam(id: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized');
  }

  await prisma.exam.delete({
    where: { id }
  });
}

export async function getAllResults(search = '', page = 1, limit = 15) {
  const skip = (page - 1) * limit;
  const where: any = {};
  
  if (search) {
    where.OR = [
      { student: { fullName: { contains: search, mode: 'insensitive' as const } } },
      { student: { email: { contains: search, mode: 'insensitive' as const } } },
      { exam: { title: { contains: search, mode: 'insensitive' as const } } }
    ];
  }

  const [results, total] = await Promise.all([
    prisma.result.findMany({
      where,
      include: { student: true, exam: true },
      orderBy: { date: 'desc' },
      skip,
      take: limit
    }),
    prisma.result.count({ where })
  ]);

  return { results, total };
}

export async function getExamResultsById(examId: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized');
  }

  return await prisma.result.findMany({
    where: { examId },
    include: { student: true, exam: true },
    orderBy: { score: 'desc' }
  });
}

// ===== Admin Coding grading / evaluations actions =====
export async function getPendingEvaluations(search = '') {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized');
  }

  const where: any = {
    status: 'PENDING_REVIEW'
  };

  if (search) {
    where.OR = [
      { student: { fullName: { contains: search, mode: 'insensitive' as const } } },
      { student: { email: { contains: search, mode: 'insensitive' as const } } },
      { exam: { title: { contains: search, mode: 'insensitive' as const } } }
    ];
  }

  return await prisma.result.findMany({
    where,
    include: {
      student: true,
      exam: {
        include: {
          questions: {
            where: { type: 'CODING' }
          }
        }
      }
    },
    orderBy: { date: 'desc' }
  });
}

export async function getStudentAnswersForEvaluation(resultId: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized');
  }

  const result = await prisma.result.findUnique({
    where: { id: resultId },
    include: { student: true, exam: true }
  });
  if (!result) throw new Error('Result not found');

  const codingAnswers = await prisma.studentAnswer.findMany({
    where: {
      studentId: result.studentId,
      examId: result.examId,
      question: { type: 'CODING' }
    },
    include: { question: true }
  });

  return { result, codingAnswers };
}

export async function saveCodingEvaluation(resultId: string, evaluations: Record<string, number>) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized');
  }

  const result = await prisma.result.findUnique({
    where: { id: resultId },
    include: { exam: { include: { questions: true } } }
  });
  if (!result) throw new Error('Result not found');

  // Compute MCQ score part
  const mcqQuestions = result.exam.questions.filter(q => q.type === 'MCQ');
  const studentAnswers = await prisma.studentAnswer.findMany({
    where: { studentId: result.studentId, examId: result.examId }
  });
  const answersMap = new Map(studentAnswers.map(a => [a.questionId, a]));

  let mcqScore = 0;
  mcqQuestions.forEach(q => {
    const ans = answersMap.get(q.id);
    if (ans && ans.selectedOption === q.correctOption) {
      mcqScore += q.marks;
    }
  });

  // Add all evaluated coding question marks
  let codingScore = 0;
  for (const [qId, marks] of Object.entries(evaluations)) {
    const question = result.exam.questions.find(q => q.id === qId);
    if (!question) throw new Error('Invalid question evaluated.');
    if (marks < 0 || marks > question.marks) {
      throw new Error(`Awarded marks for question must be between 0 and ${question.marks}.`);
    }
    codingScore += marks;
  }

  const finalScore = mcqScore + codingScore;
  const percentage = result.exam.totalMarks > 0 ? (finalScore / result.exam.totalMarks) * 100 : 0;
  const status = finalScore >= result.exam.passingMarks ? 'PASS' : 'FAIL';

  await prisma.result.update({
    where: { id: resultId },
    data: {
      score: finalScore,
      percentage,
      status
    }
  });

  return { success: true };
}

