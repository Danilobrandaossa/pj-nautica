import { prisma } from '../utils/prisma';
import { AuditAction } from '@prisma/client';

export class AuditLogService {
  async findAll(filters?: {
    userId?: string;
    action?: AuditAction;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const { limit = 100, offset = 0, ...where } = filters || {};

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          ...(where.userId && { userId: where.userId }),
          ...(where.action && { action: where.action }),
          ...(where.entityType && { entityType: where.entityType }),
          ...(where.startDate && {
            createdAt: { gte: where.startDate },
          }),
          ...(where.endDate && {
            createdAt: { lte: where.endDate },
          }),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({
        where: {
          ...(where.userId && { userId: where.userId }),
          ...(where.action && { action: where.action }),
          ...(where.entityType && { entityType: where.entityType }),
          ...(where.startDate && {
            createdAt: { gte: where.startDate },
          }),
          ...(where.endDate && {
            createdAt: { lte: where.endDate },
          }),
        },
      }),
    ]);

    return {
      logs,
      total,
      limit,
      offset,
    };
  }

  async getStatistics(startDate?: Date, endDate?: Date) {
    const where = {
      ...(startDate && { createdAt: { gte: startDate } }),
      ...(endDate && { createdAt: { lte: endDate } }),
    };

    const [actionStats, entityStats, userStats] = await Promise.all([
      // Estatísticas por ação
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
      }),
      // Estatísticas por tipo de entidade
      prisma.auditLog.groupBy({
        by: ['entityType'],
        where,
        _count: true,
      }),
      // Usuários mais ativos
      prisma.auditLog.groupBy({
        by: ['userId'],
        where,
        _count: true,
        orderBy: {
          _count: {
            userId: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    return {
      byAction: actionStats,
      byEntityType: entityStats,
      topUsers: userStats,
    };
  }
}



