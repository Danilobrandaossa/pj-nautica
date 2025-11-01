import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Master Panel data...');

  // Criar planos
  const basicPlan = await prisma.plan.upsert({
    where: { id: 'plan-basic' },
    update: {},
    create: {
      id: 'plan-basic',
      name: 'Básico',
      type: 'BASIC',
      description: 'Plano básico',
      price: 99.00,
      maxUsers: 5,
      maxVessels: 3,
      maxBookingsPerMonth: 50
    }
  });

  const proPlan = await prisma.plan.upsert({
    where: { id: 'plan-pro' },
    update: {},
    create: {
      id: 'plan-pro',
      name: 'Pro',
      type: 'PRO',
      description: 'Plano profissional',
      price: 199.00,
      maxUsers: 15,
      maxVessels: 10,
      maxBookingsPerMonth: 200
    }
  });

  // Criar usuário Master
  const masterPassword = await bcrypt.hash('Master123!@#', 12);
  const masterUser = await prisma.masterUser.upsert({
    where: { email: 'master@reservapro.com' },
    update: {},
    create: {
      email: 'master@reservapro.com',
      name: 'Master Owner',
      password: masterPassword,
      role: 'MASTER_OWNER',
      isActive: true,
      allowedIPs: ['127.0.0.1', '::1']
    }
  });

  // Criar tenant demo
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo-empresa' },
    update: {},
    create: {
      name: 'Demo Empresa',
      slug: 'demo-empresa',
      domain: 'demo.reservapro.com',
      email: 'contato@demo-empresa.com',
      status: 'ACTIVE',
      planId: 'plan-pro',
      schemaName: 'tenant_demo_empresa'
    }
  });

  console.log('✅ Seed concluído!');
  console.log('Master: master@reservapro.com / Master123!@#');
  console.log('Tenant: Demo Empresa');
}

main().catch(console.error).finally(() => prisma.\());
