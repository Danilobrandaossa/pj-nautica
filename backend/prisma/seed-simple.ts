import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do sistema Master...');

  // Criar usuário master
  console.log('👑 Criando usuário master...');
  const hashedPassword = await bcrypt.hash('Master@123', 12);
  
  const masterUser = await prisma.user.upsert({
    where: { email: 'master@embarcacoes.com' },
    update: {},
    create: {
      email: 'master@embarcacoes.com',
      password: hashedPassword,
      name: 'Master Admin',
      role: 'ADMIN', // Usar ADMIN por enquanto
      status: 'ACTIVE',
      isActive: true
    }
  });

  console.log('✅ Usuário master criado');
  console.log('🔑 Credenciais Master:');
  console.log('Email: master@embarcacoes.com');
  console.log('Senha: Master@123');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.\();
  });
