import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BookingService } from '../services/booking.service';
import { BookingStatus, UserRole } from '@prisma/client';
import { isValidUUID } from '../middleware/validation';
import { AppError } from '../middleware/error-handler';

const bookingService = new BookingService();

const createBookingSchema = z.object({
  vesselId: z.string().uuid('ID da embarcação inválido'),
  bookingDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  notes: z.string().max(500, 'Notas muito longas').optional().transform((val) => val?.trim()),
});

const cancelBookingSchema = z.object({
  reason: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
});

export class BookingController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createBookingSchema.parse(req.body);
      const userId = req.user!.userId;
      const ip = req.ip || req.socket.remoteAddress;

      const booking = await bookingService.create(
        {
          vesselId: data.vesselId,
          bookingDate: new Date(data.bookingDate),
          notes: data.notes,
        },
        userId,
        ip
      );

      res.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const querySchema = z.object({
        vesselId: z.string().uuid('ID da embarcação inválido').optional(),
        status: z.nativeEnum(BookingStatus).optional(),
        startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
        endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
      });
      
      const { vesselId, status, startDate, endDate } = querySchema.parse(req.query);
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const filters: {
        userId?: string;
        vesselId?: string;
        status?: BookingStatus;
        startDate?: Date;
        endDate?: Date;
      } = {};

      // Usuários normais só veem suas próprias reservas
      if (userRole !== UserRole.ADMIN) {
        filters.userId = userId;
      }

      if (vesselId) filters.vesselId = vesselId;
      if (status) filters.status = status;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);

      const bookings = await bookingService.findAll(filters);

      res.json(bookings);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const booking = await bookingService.findById(id);

      // Verificar permissão
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      if (userRole !== UserRole.ADMIN && booking.user.id !== userId) {
        return next(new AppError(403, 'Sem permissão para ver esta reserva'));
      }

      res.json(booking);
    } catch (error) {
      next(error);
    }
  }

  async getCalendar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { vesselId } = req.params;
      
      // Validar UUID
      if (!isValidUUID(vesselId)) {
        return next(new AppError(400, 'ID da embarcação inválido'));
      }
      
      const querySchema = z.object({
        startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
        endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
      });
      
      const { startDate, endDate } = querySchema.parse(req.query);

      const calendar = await bookingService.getCalendar(
        vesselId,
        new Date(startDate),
        new Date(endDate)
      );

      res.json(calendar);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validar UUID
      if (!isValidUUID(id)) {
        return next(new AppError(400, 'ID inválido'));
      }
      
      const { reason } = cancelBookingSchema.parse(req.body);
      const userId = req.user!.userId;
      const isAdmin = req.user!.role === UserRole.ADMIN;

      const booking = await bookingService.cancel(id, userId, isAdmin, reason || undefined);

      res.json(booking);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validar UUID
      if (!isValidUUID(id)) {
        return next(new AppError(400, 'ID inválido'));
      }
      
      const { status } = updateStatusSchema.parse(req.body);
      const updatedBy = req.user!.userId;

      const booking = await bookingService.updateStatus(id, status, updatedBy);

      res.json(booking);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validar UUID
      if (!isValidUUID(id)) {
        return next(new AppError(400, 'ID inválido'));
      }
      
      const deletedBy = req.user!.userId;

      await bookingService.delete(id, deletedBy);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}



