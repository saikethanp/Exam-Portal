const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const studentId = "student-123";
  const examId = "exam-123";
  
  const draftEntries = Array.from({ length: 50 }).map((_, i) => [
    `q-${i}`,
    { selectedOption: "A" }
  ]);

  console.log('Testing optimized autosave...');
  const start = Date.now();
  
  await prisma.$transaction([
    prisma.studentAnswer.deleteMany({
      where: {
        studentId,
        examId,
      }
    }),
    prisma.studentAnswer.createMany({
      data: draftEntries.map(([qId, ans]) => ({
        studentId,
        examId,
        questionId: qId,
        selectedOption: ans.selectedOption || null,
        codeAnswer: ans.codeAnswer || null,
      }))
    })
  ]);

  const duration = Date.now() - start;
  console.log(`Optimized autosave took ${duration}ms`);
}

main().then(() => prisma.$disconnect());
