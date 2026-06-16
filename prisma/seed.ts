import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@examportal.com' },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    
    await prisma.user.create({
      data: {
        fullName: 'Super Admin',
        email: 'admin@examportal.com',
        phone: '0000000000',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
      },
    });
    console.log('✅ Default Super Admin created.');
  } else {
    console.log('✅ Super Admin already exists. Skipping...');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
