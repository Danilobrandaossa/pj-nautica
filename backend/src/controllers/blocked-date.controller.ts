import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BlockedDateService } from '../services/blocked-date.service';
import { BlockedDateReason } from '@prisma/client';

const blockedDateService = new BlockedDateService();

const createBlockedDateSchema = z.object({
  vesselId: z.string().uuid(),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  reason: z.nativeEnum(BlockedDateReason),
  notes: z.string().optional(),
});

export class BlockedDateController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createBlockedDateSchema.parse(req.body);
      const createdBy = req.user!.userId;

      const blockedDate = await blockedDateService.create(
        {
          vesselId: data.vesselId,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          reason: data.reason,
          notes: data.notes,
        },
        createdBy
      );

      res.status(201).json(blockedDate);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { vesselId } = req.query;

      const blockedDates = await blockedDateService.findAll({
        vesselId: vesselId as string,
      });

      res.json(blockedDates);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const blockedDate = await blockedDateService.findById(id);

      res.json(blockedDate);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deletedBy = req.user!.userId;

      await blockedDateService.delete(id, deletedBy);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}



