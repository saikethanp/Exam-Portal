const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting query at', new Date().toISOString());
  const start = Date.now();
  
  try {
    const users = await prisma.user.count();
    console.log(`Counted ${users} users.`);
  } catch (e) {
    console.error('Error:', e);
  }
  
  const duration = Date.now() - start;
  console.log(`Query took ${duration}ms`);
}

main().then(() => prisma.$disconnect());
