import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { cache, cacheKey } from '../utils/cache';

const prisma = new PrismaClient();

export class WeeklyBlockService {
  // Criar novo bloqueio semanal
  async createWeeklyBlock(data: {
    dayOfWeek: number; // 0 = Domingo, 1 = Segunda, etc.
    reason: string;
    notes?: string;
  }) {
    // Verificar se já existe um bloqueio ativo para este dia da semana
    const existingBlock = await prisma.weeklyBlock.findFirst({
      where: {
        dayOfWeek: data.dayOfWeek,
        isActive: true
      }
    });

    if (existingBlock) {
      throw new AppError(400, `Já existe um bloqueio ativo para ${this.getDayName(data.dayOfWeek)}`);
    }

    const weeklyBlock = await prisma.weeklyBlock.create({
      data: {
        dayOfWeek: data.dayOfWeek,
        reason: data.reason,
        notes: data.notes,
        isActive: true
      }
    });

    // Invalidar todos os caches de calendário (bloqueio semanal afeta todas as embarcações)
    // Como não temos acesso direto a todas as keys, vamos usar uma abordagem conservadora
    // e invalidar quando qualquer bloqueio semanal muda
    this.invalidateAllCalendarCaches();

    return weeklyBlock;
  }

  // Listar todos os bloqueios semanais
  async getAllWeeklyBlocks() {
    return prisma.weeklyBlock.findMany({
      orderBy: [
        { dayOfWeek: 'asc' },
        { createdAt: 'desc' }
      ]
    });
  }

  // Buscar bloqueios semanais ativos
  async getActiveWeeklyBlocks() {
    return prisma.weeklyBlock.findMany({
      where: { isActive: true },
      orderBy: { dayOfWeek: 'asc' }
    });
  }

  // Atualizar bloqueio semanal
  async updateWeeklyBlock(id: string, data: {
    reason?: string;
    notes?: string;
    isActive?: boolean;
  }) {
    const weeklyBlock = await prisma.weeklyBlock.findUnique({
      where: { id }
    });

    if (!weeklyBlock) {
      throw new AppError(404, 'Bloqueio semanal não encontrado');
    }

    const updated = await prisma.weeklyBlock.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    // Invalidar todos os caches de calendário quando bloqueio semanal muda
    this.invalidateAllCalendarCaches();

    return updated;
  }

  // Deletar bloqueio semanal
  async deleteWeeklyBlock(id: string) {
    const weeklyBlock = await prisma.weeklyBlock.findUnique({
      where: { id }
    });

    if (!weeklyBlock) {
      throw new AppError(404, 'Bloqueio semanal não encontrado');
    }

    const deleted = await prisma.weeklyBlock.delete({
      where: { id }
    });

    // Invalidar todos os caches de calendário quando bloqueio semanal é deletado
    this.invalidateAllCalendarCaches();

    return deleted;
  }

  // Verificar se uma data específica está bloqueada por bloqueio semanal
  async isDateBlockedByWeeklyBlock(date: Date): Promise<{
    isBlocked: boolean;
    reason?: string;
    notes?: string;
  }> {
    const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Segunda, etc.
    
    const weeklyBlock = await prisma.weeklyBlock.findFirst({
      where: {
        dayOfWeek,
        isActive: true
      }
    });

    if (weeklyBlock) {
      return {
        isBlocked: true,
        reason: weeklyBlock.reason,
        notes: weeklyBlock.notes || undefined
      };
    }

    return { isBlocked: false };
  }

  // Obter nome do dia da semana
  private getDayName(dayOfWeek: number): string {
    const days = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado'
    ];
    return days[dayOfWeek] || 'Dia inválido';
  }

  // Invalidar todos os caches de calendário
  // Como bloqueios semanais afetam todas as embarcações, vamos invalidar
  // todas as chaves que começam com "calendar:"
  private invalidateAllCalendarCaches() {
    // Invalidar todos os caches de calendário usando prefixo
    cache.delPrefix('calendar:');
  }

  // Obter estatísticas dos bloqueios semanais
  async getWeeklyBlockStats() {
    const totalBlocks = await prisma.weeklyBlock.count();
    const activeBlocks = await prisma.weeklyBlock.count({
      where: { isActive: true }
    });
    const inactiveBlocks = totalBlocks - activeBlocks;

    // Bloqueios por dia da semana
    const blocksByDay = await prisma.weeklyBlock.groupBy({
      by: ['dayOfWeek'],
      where: { isActive: true },
      _count: { dayOfWeek: true }
    });

    return {
      totalBlocks,
      activeBlocks,
      inactiveBlocks,
      blocksByDay: blocksByDay.map(block => ({
        dayOfWeek: block.dayOfWeek,
        dayName: this.getDayName(block.dayOfWeek),
        count: block._count.dayOfWeek
      }))
    };
  }
}


