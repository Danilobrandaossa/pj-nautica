import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do sistema Master...');

  // 1. Criar planos
  console.log('📋 Criando planos...');
  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { id: 'plan-basic' },
      update: {},
      create: {
        id: 'plan-basic',
        name: 'Básico',
        description: 'Plano básico para pequenas empresas',
        price: 99.00,
        billingCycle: 'monthly',
        maxUsers: 5,
        maxVessels: 3,
        maxBookingsPerMonth: 50,
        features: {
          notifications: true,
          reports: false,
          integrations: false,
          whitelabel: false
        }
      }
    }),
    prisma.plan.upsert({
      where: { id: 'plan-pro' },
      update: {},
      create: {
        id: 'plan-pro',
        name: 'Pro',
        description: 'Plano profissional para empresas médias',
        price: 199.00,
        billingCycle: 'monthly',
        maxUsers: 15,
        maxVessels: 10,
        maxBookingsPerMonth: 200,
        features: {
          notifications: true,
          reports: true,
          integrations: true,
          whitelabel: false
        }
      }
    }),
    prisma.plan.upsert({
      where: { id: 'plan-premium' },
      update: {},
      create: {
        id: 'plan-premium',
        name: 'Premium',
        description: 'Plano premium para grandes empresas',
        price: 399.00,
        billingCycle: 'monthly',
        maxUsers: 50,
        maxVessels: 25,
        maxBookingsPerMonth: 500,
        features: {
          notifications: true,
          reports: true,
          integrations: true,
          whitelabel: true
        }
      }
    }),
    prisma.plan.upsert({
      where: { id: 'plan-enterprise' },
      update: {},
      create: {
        id: 'plan-enterprise',
        name: 'Enterprise',
        description: 'Plano empresarial com recursos ilimitados',
        price: 799.00,
        billingCycle: 'monthly',
        maxUsers: -1,
        maxVessels: -1,
        maxBookingsPerMonth: -1,
        features: {
          notifications: true,
          reports: true,
          integrations: true,
          whitelabel: true,
          customDomain: true,
          prioritySupport: true
        }
      }
    })
  ]);

  console.log(\✅ \ planos criados\);

  // 2. Criar empresa padrão
  console.log('🏢 Criando empresa padrão...');
  const defaultCompany = await prisma.company.upsert({
    where: { id: 'company-default' },
    update: {},
    create: {
      id: 'company-default',
      name: 'Empresa Padrão',
      slug: 'default',
      email: 'admin@embarcacoes.com',
      status: 'ACTIVE',
      planId: 'plan-pro',
      settings: {
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR'
      },
      whitelabelConfig: {
        logo: null,
        primaryColor: '#3b82f6',
        secondaryColor: '#1e40af'
      }
    }
  });

  console.log('✅ Empresa padrão criada');

  // 3. Atualizar usuários existentes para empresa padrão
  console.log('👥 Atualizando usuários existentes...');
  const updatedUsers = await prisma.user.updateMany({
    where: { companyId: null },
    data: { companyId: 'company-default' }
  });

  console.log(\✅ \ usuários atualizados\);

  // 4. Criar usuário master
  console.log('👑 Criando usuário master...');
  const hashedPassword = await bcrypt.hash('Master@123', 12);
  
  const masterUser = await prisma.user.upsert({
    where: { email: 'master@embarcacoes.com' },
    update: {},
    create: {
      email: 'master@embarcacoes.com',
      password: hashedPassword,
      name: 'Master Admin',
      role: 'MASTER',
      status: 'ACTIVE',
      companyId: null, // Master não pertence a empresa específica
      isActive: true
    }
  });

  console.log('✅ Usuário master criado');

  console.log('🎉 Seed do sistema Master concluído!');
  console.log('');
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
