import type { User as PrismaUser, Exam as PrismaExam, Question as PrismaQuestion, Result as PrismaResult, Role as PrismaRole } from '@prisma/client';

export type Role = PrismaRole;

export type User = PrismaUser;

export type Question = PrismaQuestion & {
  options: any; // Prisma Json type resolved here
};

export type Exam = PrismaExam & {
  questions: Question[];
};

export type Result = PrismaResult;

