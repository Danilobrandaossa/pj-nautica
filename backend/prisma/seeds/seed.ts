import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Master Panel...');

  const masterPassword = await bcrypt.hash('Master123!@#', 12);
  
  const masterUser = await prisma.masterUser.upsert({
    where: { email: 'master@reservapro.com' },
    update: {},
    create: {
      email: 'master@reservapro.com',
      name: 'Master Owner',
      password: masterPassword,
      role: 'MASTER_OWNER',
      isActive: true
    }
  });

  console.log('Master user created:', masterUser.email);
}

main().catch(console.error).finally(async () => {
  await prisma.disconnect();
});
