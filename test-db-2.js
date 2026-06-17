const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Connecting...');
  await prisma.$connect();
  console.log('Connected.');
  
  for (let i = 1; i <= 3; i++) {
    const start = Date.now();
    await prisma.user.count();
    console.log(`Query ${i} took ${Date.now() - start}ms`);
  }
}

main().then(() => prisma.$disconnect());
