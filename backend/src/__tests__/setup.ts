import { PrismaClient } from '@prisma/client';

// Mock do Prisma para testes
jest.mock('../utils/prisma', () => ({
  prisma: {} as PrismaClient,
}));

// Configurações globais de teste
beforeAll(() => {
  // Configurações antes de todos os testes
});

afterAll(() => {
  // Limpeza após todos os testes
});

beforeEach(() => {
  // Configurações antes de cada teste
});

afterEach(() => {
  // Limpeza após cada teste
});






