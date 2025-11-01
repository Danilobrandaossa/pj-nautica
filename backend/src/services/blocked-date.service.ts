import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error-handler';
import { BlockedDateReason } from '@prisma/client';
import { startOfDay } from 'date-fns';
import { cache } from '../utils/cache';

export class BlockedDateService {
  async create(
    data: {
      vesselId: string;
      startDate: Date;
      endDate: Date;
      reason: BlockedDateReason;
      notes?: string;
    },
    createdBy: string
  ) {
    // Verificar se embarcação existe
    const vessel = await prisma.vessel.findUnique({
      where: { id: data.vesselId },
    });

    if (!vessel) {
      throw new AppError(404, 'Embarcação não encontrada');
    }

    // Verificar se as datas são válidas
    const startDate = startOfDay(new Date(data.startDate));
    const endDate = startOfDay(new Date(data.endDate));

    if (endDate < startDate) {
      throw new AppError(400, 'Data final deve ser maior ou igual à data inicial');
    }

    // Criar bloqueio
    const blockedDate = await prisma.blockedDate.create({
      data: {
        vesselId: data.vesselId,
        startDate,
        endDate,
        reason: data.reason,
        notes: data.notes,
      },
      include: {
        vessel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: createdBy,
        action: 'DATE_BLOCKED',
        entityType: 'blocked_date',
        entityId: blockedDate.id,
        details: {
          vesselName: vessel.name,
          startDate,
          endDate,
          reason: data.reason,
        },
      },
    });

    // Invalidar cache do calendário para esta embarcação
    // Invalidar todas as chaves que começam com "calendar:{vesselId}:"
    cache.delPrefix(`calendar:${data.vesselId}:`);

    return blockedDate;
  }

  async findAll(filters?: { vesselId?: string }) {
    return prisma.blockedDate.findMany({
      where: {
        ...(filters?.vesselId && { vesselId: filters.vesselId }),
      },
      include: {
        vessel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findById(id: string) {
    const blockedDate = await prisma.blockedDate.findUnique({
      where: { id },
      include: {
        vessel: true,
      },
    });

    if (!blockedDate) {
      throw new AppError(404, 'Bloqueio não encontrado');
    }

    return blockedDate;
  }

  async delete(id: string, deletedBy: string) {
    const blockedDate = await prisma.blockedDate.findUnique({
      where: { id },
      include: { vessel: true },
    });

    if (!blockedDate) {
      throw new AppError(404, 'Bloqueio não encontrado');
    }

    await prisma.blockedDate.delete({
      where: { id },
    });

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: deletedBy,
        action: 'DATE_UNBLOCKED',
        entityType: 'blocked_date',
        entityId: id,
        details: {
          vesselName: blockedDate.vessel.name,
          startDate: blockedDate.startDate,
          endDate: blockedDate.endDate,
        },
      },
    });

    // Invalidar cache do calendário para esta embarcação
    // Invalidar todas as chaves que começam com "calendar:{vesselId}:"
    cache.delPrefix(`calendar:${blockedDate.vesselId}:`);
  }
}



