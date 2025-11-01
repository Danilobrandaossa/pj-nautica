const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('\n📋 USUÁRIOS CADASTRADOS:\n');
    console.log('='.repeat(60));
    
    if (users.length === 0) {
      console.log('Nenhum usuário encontrado no banco de dados.');
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Ativo: ${user.isActive ? 'Sim' : 'Não'}`);
        console.log(`   Criado em: ${user.createdAt.toLocaleString('pt-BR')}`);
        console.log(`   ID: ${user.id}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`\nTotal: ${users.length} usuário(s)\n`);
    
    // Nota sobre senhas
    console.log('⚠️  NOTA: As senhas são armazenadas com hash (bcrypt) e não podem ser recuperadas.');
    console.log('   Para redefinir uma senha, use a funcionalidade de "Alterar Senha" no sistema.\n');
    
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();




