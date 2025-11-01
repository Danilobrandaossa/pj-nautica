import { PrismaClient } from '@prisma/client';

// Obter URL do banco de teste ou usar o banco principal em desenvolvimento
const getDatabaseUrl = () => {
  // Prioridade: TEST_DATABASE_URL > DATABASE_URL > default
  if (process.env.TEST_DATABASE_URL) {
    return process.env.TEST_DATABASE_URL;
  }
  
  // Em desenvolvimento, usar o banco principal se não houver banco de teste
  if (process.env.DATABASE_URL) {
    // Se não há banco de teste configurado, usar o banco principal mesmo
    // (em produção isso deve ser evitado)
    return process.env.DATABASE_URL;
  }
  
  // URL padrão para testes
  return 'postgresql://postgres:postgres123@localhost:5434/embarcacoes_test';
};

const databaseUrl = getDatabaseUrl();

// Criar instância do Prisma com URL específica
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

// Limpar banco antes dos testes
export async function cleanupDatabase() {
  try {
    // Deletar usando Prisma para garantir ordem correta
    await prisma.auditLog.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.blockedDate.deleteMany();
    await prisma.adHocCharge.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.weeklyBlock.deleteMany();
    await prisma.userVessel.deleteMany();
    await prisma.user.deleteMany();
    await prisma.vessel.deleteMany();
    // BookingLimit será deletado em cascade com Vessel
  } catch (error) {
    // Ignorar erros - banco pode não estar configurado ainda
    console.warn('Erro ao limpar banco:', error);
  }
}

// Seed inicial para testes
export async function seedTestData() {
  // Criar admin de teste
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqKfKt8Q5e', // password123
      name: 'Admin Test',
      role: 'ADMIN',
      status: 'ACTIVE',
      isActive: true,
    },
  });

  // Criar usuário de teste
  const user = await prisma.user.upsert({
    where: { email: 'user@test.com' },
    update: {},
    create: {
      email: 'user@test.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqKfKt8Q5e', // password123
      name: 'User Test',
      role: 'USER',
      status: 'ACTIVE',
      isActive: true,
    },
  });

  // Criar embarcação de teste
  const vessel = await prisma.vessel.upsert({
    where: { id: 'test-vessel-1' },
    update: {},
    create: {
      id: 'test-vessel-1',
      name: 'Test Vessel',
      description: 'Embarcação de teste',
      capacity: 10,
      calendarDaysAhead: 62,
      bookingLimit: {
        create: {
          maxActiveBookings: 2,
        },
      },
    },
    include: {
      bookingLimit: true,
    },
  });

  // Criar relação user-vessel
  await prisma.userVessel.upsert({
    where: {
      userId_vesselId: {
        userId: user.id,
        vesselId: vessel.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      vesselId: vessel.id,
      status: 'ACTIVE',
    },
  });

  return { admin, user, vessel };
}

export async function closeDatabase() {
  await prisma.$disconnect();
}

export { prisma };

