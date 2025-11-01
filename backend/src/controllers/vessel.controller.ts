import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { VesselService } from '../services/vessel.service';
import { AppError } from '../middleware/error-handler';

const vesselService = new VesselService();

const createVesselSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  location: z.string().optional(),
  imageUrl: z.string().optional().refine((val) => !val || val.startsWith('http'), {
    message: 'URL da imagem deve começar com http:// ou https://'
  }),
  maxActiveBookings: z.number().int().positive().optional(),
  calendarDaysAhead: z.number().int().min(7).max(365).optional(),
});

const updateVesselSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  location: z.string().optional(),
  imageUrl: z.string().optional().refine((val) => !val || val.startsWith('http'), {
    message: 'URL da imagem deve começar com http:// ou https://'
  }),
  isActive: z.boolean().optional(),
  maxActiveBookings: z.number().int().positive().optional(),
  calendarDaysAhead: z.number().int().min(7).max(365).optional(),
});

const addUserSchema = z.object({
  userId: z.string().uuid(),
});

export class VesselController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createVesselSchema.parse(req.body);
      const createdBy = req.user!.userId;

      if (!data.name) {
        return next(new AppError(400, 'Nome é obrigatório'));
      }

      const vessel = await vesselService.create({
        name: data.name,
        description: data.description,
        capacity: data.capacity,
        location: data.location,
        imageUrl: data.imageUrl,
        maxActiveBookings: data.maxActiveBookings,
        calendarDaysAhead: data.calendarDaysAhead,
      }, createdBy);

      res.status(201).json(vessel);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { isActive } = req.query;

      const vessels = await vesselService.findAll({
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      });

      res.json(vessels);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const vessel = await vesselService.findById(id);

      res.json(vessel);
    } catch (error) {
      next(error);
    }
  }

  async findByUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const vessels = await vesselService.findByUser(userId);

      res.json(vessels);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateVesselSchema.parse(req.body);
      const updatedBy = req.user!.userId;

      const vessel = await vesselService.update(id, data, updatedBy);

      res.json(vessel);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deletedBy = req.user!.userId;

      await vesselService.delete(id, deletedBy);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async addUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { userId } = addUserSchema.parse(req.body);
      const addedBy = req.user!.userId;

      const result = await vesselService.addUser(id, userId, addedBy);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async removeUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, userId } = req.params;
      const removedBy = req.user!.userId;

      await vesselService.removeUser(id, userId, removedBy);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

