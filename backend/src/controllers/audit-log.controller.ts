import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuditLogService } from '../services/audit-log.service';
import { AuditAction } from '@prisma/client';

const auditLogService = new AuditLogService();

const filterSchema = z.object({
  userId: z.string().uuid().optional(),
  action: z.nativeEnum(AuditAction).optional(),
  entityType: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  offset: z.string().transform(Number).pipe(z.number().int().min(0)).optional(),
});

export class AuditLogController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = filterSchema.parse(req.query);

      const result = await auditLogService.findAll({
        userId: filters.userId,
        action: filters.action,
        entityType: filters.entityType,
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        limit: filters.limit,
        offset: filters.offset,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;

      const stats = await auditLogService.getStatistics(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}



