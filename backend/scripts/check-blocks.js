const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBlocks() {
  try {
    console.log('🔍 Verificando bloqueios no banco de dados...\n');

    // Verificar bloqueios de datas específicas
    const blockedDates = await prisma.blockedDate.findMany({
      include: {
        vessel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log(`📅 Bloqueios de Datas: ${blockedDates.length}`);
    if (blockedDates.length > 0) {
      blockedDates.forEach((bd) => {
        console.log(`  - Embarcação: ${bd.vessel.name}`);
        console.log(`    Período: ${bd.startDate.toISOString().split('T')[0]} até ${bd.endDate.toISOString().split('T')[0]}`);
        console.log(`    Motivo: ${bd.reason}`);
        console.log(`    ID: ${bd.id}\n`);
      });
    }

    // Verificar bloqueios semanais
    const weeklyBlocks = await prisma.weeklyBlock.findMany({
      orderBy: { dayOfWeek: 'asc' },
    });

    console.log(`📆 Bloqueios Semanais: ${weeklyBlocks.length}`);
    if (weeklyBlocks.length > 0) {
      const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      weeklyBlocks.forEach((wb) => {
        console.log(`  - ${days[wb.dayOfWeek]}: ${wb.isActive ? '✅ ATIVO' : '❌ Inativo'}`);
        console.log(`    Motivo: ${wb.reason}`);
        console.log(`    ID: ${wb.id}\n`);
      });
    }

    // Verificar bloqueios semanais ATIVOS
    const activeWeeklyBlocks = await prisma.weeklyBlock.findMany({
      where: { isActive: true },
      orderBy: { dayOfWeek: 'asc' },
    });

    if (activeWeeklyBlocks.length > 0) {
      console.log(`⚠️  ATENÇÃO: ${activeWeeklyBlocks.length} bloqueio(s) semanal(is) ATIVO(S)!`);
      console.log('   Isso pode estar bloqueando vários dias do calendário.\n');
    } else {
      console.log('✅ Nenhum bloqueio semanal ativo.\n');
    }

    if (blockedDates.length === 0 && weeklyBlocks.length === 0) {
      console.log('✅ Não há bloqueios cadastrados no sistema.');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar bloqueios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBlocks();




