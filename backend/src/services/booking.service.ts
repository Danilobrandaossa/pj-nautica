import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error-handler';
import { BookingStatus } from '@prisma/client';
import { startOfDay, isBefore, isAfter, differenceInHours, addDays } from 'date-fns';
import { WebhookService } from './webhook.service';
import { WeeklyBlockService } from './weekly-block.service';
import { logger } from '../utils/logger';
import { cache, cacheKey } from '../utils/cache';
import { settingsService } from './settings.service';
import { webhookPublisher } from './webhook-publisher.service';

const webhookService = new WebhookService();
const weeklyBlockService = new WeeklyBlockService();

/**
 * Service para gerenciar reservas de embarcações
 * Inclui validações de negócio, limites de reservas e integração com webhooks
 */
export class BookingService {
  /**
   * Cria uma nova reserva para uma embarcação
   * Validações incluídas:
   * - Acesso do usuário à embarcação
   * - Status do usuário (não bloqueado/em atraso)
   * - Antecedência mínima de 24h
   * - Limite de dias à frente configurado
   * - Verificação de datas bloqueadas
   * - Verificação de bloqueios semanais
   * - Limite de reservas ativas por embarcação
   * 
   * @param data - Dados da reserva (vesselId, bookingDate, notes)
   * @param userId - ID do usuário que está criando a reserva
   * @param ip - IP do usuário para auditoria
   * @returns Reserva criada com dados relacionados (user, vessel)
   * @throws AppError com status code apropriado em caso de erro de validação
   */
  async create(
    data: {
      vesselId: string;
      bookingDate: Date;
      notes?: string;
    },
    userId: string,
    ip?: string
  ) {
    // 1. Verificar se usuário tem acesso à embarcação
    const userVessel = await prisma.userVessel.findUnique({
      where: {
        userId_vesselId: {
          userId,
          vesselId: data.vesselId,
        },
      },
      include: {
        vessel: {
          include: {
            bookingLimit: true,
          },
        },
        user: true,
      },
    });

    // Verificar se o usuário é admin - admins podem fazer reservas em qualquer embarcação
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, status: true }
    });

    if (!userVessel && user?.role !== 'ADMIN') {
      throw new AppError(403, 'Você não tem acesso a esta embarcação');
    }

    // Se for admin e não tiver userVessel, buscar a embarcação diretamente
    let vessel, bookingLimit;
    if (userVessel) {
      vessel = userVessel.vessel;
      bookingLimit = vessel.bookingLimit;
    } else if (user?.role === 'ADMIN') {
      vessel = await prisma.vessel.findUnique({
        where: { id: data.vesselId },
        include: { bookingLimit: true }
      });
      if (!vessel) {
        throw new AppError(404, 'Embarcação não encontrada');
      }
      bookingLimit = vessel.bookingLimit;
    }

    // 1.1 Verificar status do usuário (apenas para usuários normais, admins podem sempre reservar)
    if (userVessel && userVessel.user.status === 'BLOCKED') {
      throw new AppError(403, 'Sua conta está bloqueada. Entre em contato com o administrador.');
    }

    if (userVessel && userVessel.user.status === 'OVERDUE_PAYMENT') {
      throw new AppError(403, 'Você possui pagamentos em atraso. Regularize sua situação para continuar fazendo reservas.');
    }

    if (userVessel && userVessel.user.status === 'OVERDUE') {
      throw new AppError(403, 'Você possui pendências. Por favor, regularize sua situação para continuar fazendo reservas.');
    }

    // 2. Regras globais vindas das configurações
    const minAdvanceHours = await settingsService.get<number>('booking.minAdvanceHours', 24);
    const allowSameDay = await settingsService.get<boolean>('booking.allowSameDay', false);
    const globalMaxDaysAhead = await settingsService.get<number>('booking.maxDaysAhead', 60);

    // 2.1 Verificar antecedência mínima
    const now = new Date();
    const bookingDateTime = startOfDay(new Date(data.bookingDate));
    const hoursDifference = differenceInHours(bookingDateTime, now);

    if (!allowSameDay && hoursDifference < 0) {
      throw new AppError(400, 'Não é permitido reservar para o mesmo dia');
    }

    if (hoursDifference < minAdvanceHours && hoursDifference >= 0) {
      throw new AppError(400, `Reservas devem ser feitas com no mínimo ${minAdvanceHours} horas de antecedência`);
    }

    // 3. Verificar se a data não está no passado
    if (isBefore(bookingDateTime, startOfDay(now))) {
      throw new AppError(400, 'Não é possível reservar datas passadas');
    }

    // 4. Verificar limite máximo de dias à frente (global ou por embarcação)
    const maxDaysAhead = vessel?.calendarDaysAhead || globalMaxDaysAhead || 62;
    const maxAllowedDate = addDays(startOfDay(now), maxDaysAhead);
    if (isAfter(bookingDateTime, maxAllowedDate)) {
      throw new AppError(400, `Reservas só podem ser feitas até ${maxDaysAhead} dias à frente (até ${maxAllowedDate.toLocaleDateString('pt-BR')})`);
    }

    // 5. Verificar se a data está bloqueada
    const blockedDate = await prisma.blockedDate.findFirst({
      where: {
        vesselId: data.vesselId,
        startDate: { lte: bookingDateTime },
        endDate: { gte: bookingDateTime },
      },
    });

    if (blockedDate) {
      throw new AppError(400, `Data bloqueada: ${blockedDate.notes || blockedDate.reason}`);
    }

    // 6. Verificar bloqueios semanais (apenas para usuários normais, admins podem sempre reservar)
    if (userVessel) {
      const weeklyBlock = await weeklyBlockService.isDateBlockedByWeeklyBlock(bookingDateTime);
      if (weeklyBlock.isBlocked) {
        throw new AppError(400, `Data bloqueada (${weeklyBlock.reason}): ${weeklyBlock.notes || 'Bloqueio semanal ativo'}`);
      }
    }

    // 7. Verificar se já existe reserva para esta data
    const existingBooking = await prisma.booking.findUnique({
      where: {
        vesselId_bookingDate: {
          vesselId: data.vesselId,
          bookingDate: bookingDateTime,
        },
      },
    });

    if (existingBooking) {
      throw new AppError(409, 'Já existe uma reserva para esta data');
    }

    // 7. Verificar limite de reservas ativas NESTA EMBARCAÇÃO
    const maxActiveBookings = bookingLimit?.maxActiveBookings || 2;
    
    // Buscar reservas ativas APENAS NESTA EMBARCAÇÃO
    const activeBookingsThisVessel = await prisma.booking.findMany({
      where: {
        userId,
        vesselId: data.vesselId, // Importante: apenas desta embarcação
        status: { in: ['PENDING', 'APPROVED'] },
        bookingDate: { gte: startOfDay(now) },
      },
      orderBy: { bookingDate: 'asc' },
    });

    if (activeBookingsThisVessel.length >= maxActiveBookings) {
      // Verificar se a primeira reserva já passou
      const firstBooking = activeBookingsThisVessel[0];
      if (isAfter(startOfDay(now), new Date(firstBooking.bookingDate))) {
        // Primeira reserva já passou, pode reservar
      } else {
        throw new AppError(
          400,
          `Limite de ${maxActiveBookings} reservas ativas atingido para ${vessel?.name}. Você poderá reservar novamente nesta embarcação após a data ${new Date(firstBooking.bookingDate).toLocaleDateString('pt-BR')} passar.`
        );
      }
    }

    // 8. Criar a reserva
    const booking = await prisma.booking.create({
      data: {
        userId,
        vesselId: data.vesselId,
        bookingDate: bookingDateTime,
        status: BookingStatus.APPROVED, // Auto-aprovar
        notes: data.notes,
        createdByIp: ip,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        vessel: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    // Invalidate calendar cache for this vessel (conservative)
    cache.del(cacheKey('calendar', [data.vesselId]));

    // 8. Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'BOOKING_CREATED',
        entityType: 'booking',
        entityId: booking.id,
        ipAddress: ip,
        details: {
          vesselName: booking.vessel.name,
          bookingDate: booking.bookingDate,
        },
      },
    });

    // 9. Enviar notificação WhatsApp via webhook
    try {
      await webhookService.sendBookingCreated(booking);
    } catch (error) {
      logger.error('Erro ao enviar webhook:', error);
      // Não bloquear a criação da reserva se o webhook falhar
    }

    // 9.1 Publicar evento para n8n (outgoing)
    try {
      await webhookPublisher.publish('booking.created', {
        id: booking.id,
        vesselId: booking.vesselId,
        userId: booking.userId,
        bookingDate: booking.bookingDate,
        status: booking.status,
      });
    } catch (e) {
      logger.warn('Falha ao publicar evento outgoing booking.created', { error: (e as Error).message });
    }

    return booking;
  }

  /**
   * Lista todas as reservas com filtros opcionais
   * 
   * @param filters - Filtros opcionais (userId, vesselId, status, startDate, endDate)
   * @returns Lista de reservas com dados relacionados (user, vessel)
   */
  async findAll(filters?: {
    userId?: string;
    vesselId?: string;
    status?: BookingStatus;
    startDate?: Date;
    endDate?: Date;
  }) {
    return prisma.booking.findMany({
      where: {
        deletedAt: null, // Excluir deletadas por padrão
        ...(filters?.userId && { userId: filters.userId }),
        ...(filters?.vesselId && { vesselId: filters.vesselId }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.startDate && {
          bookingDate: { gte: filters.startDate },
        }),
        ...(filters?.endDate && {
          bookingDate: { lte: filters.endDate },
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        vessel: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: { bookingDate: 'desc' },
    });
  }

  async findById(id: string) {
    const booking = await prisma.booking.findFirst({
      where: { 
        id,
        deletedAt: null, // Não retornar se foi deletada
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        vessel: {
          select: {
            id: true,
            name: true,
            description: true,
            location: true,
            capacity: true,
          },
        },
      },
    });

    if (!booking) {
      throw new AppError(404, 'Reserva não encontrada');
    }

    return booking;
  }

  /**
   * Busca calendário de uma embarcação com reservas, datas bloqueadas e bloqueios semanais
   * Resultado é cacheado por 30 segundos para melhorar performance
   * 
   * @param vesselId - ID da embarcação
   * @param startDate - Data inicial do período
   * @param endDate - Data final do período
   * @returns Objeto com bookings, blockedDates e weeklyBlocks
   */
  async getCalendar(vesselId: string, startDate: Date, endDate: Date) {
    const key = cacheKey('calendar', [vesselId, startDate.toISOString(), endDate.toISOString()]);
    // Reduzido TTL para 10 segundos para atualizações mais rápidas de bloqueios
    return cache.wrap(key, 10_000, async () => {
      // Buscar todas as reservas no período
      const bookings = await prisma.booking.findMany({
        where: {
          vesselId,
          bookingDate: {
            gte: startOfDay(startDate),
            lte: startOfDay(endDate),
          },
          status: { in: ['PENDING', 'APPROVED'] },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Buscar datas bloqueadas no período
      const blockedDates = await prisma.blockedDate.findMany({
        where: {
          vesselId,
          OR: [
            {
              startDate: { lte: endDate },
              endDate: { gte: startDate },
            },
          ],
        },
      });

      // Buscar bloqueios semanais ativos
      const activeWeeklyBlocks = await weeklyBlockService.getActiveWeeklyBlocks();

      return {
        bookings,
        blockedDates,
        weeklyBlocks: activeWeeklyBlocks,
      };
    });
  }

  async cancel(id: string, userId: string, isAdmin: boolean, reason?: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        vessel: true,
      },
    });

    if (!booking) {
      throw new AppError(404, 'Reserva não encontrada');
    }

    // Verificar permissão
    if (!isAdmin && booking.userId !== userId) {
      throw new AppError(403, 'Você não tem permissão para cancelar esta reserva');
    }

    // Verificar se a reserva já foi cancelada
    if (booking.status === BookingStatus.CANCELLED) {
      throw new AppError(400, 'Esta reserva já foi cancelada');
    }

    // Verificar se a reserva já passou
    if (booking.status === BookingStatus.COMPLETED) {
      throw new AppError(400, 'Não é possível cancelar uma reserva concluída');
    }

    // Cancelar a reserva
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        vessel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Invalidate calendar cache
    cache.del(cacheKey('calendar', [booking.vesselId]));

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'BOOKING_CANCELLED',
        entityType: 'booking',
        entityId: id,
        details: {
          vesselName: booking.vessel.name,
          bookingDate: booking.bookingDate,
          reason,
        },
      },
    });

    // Enviar notificação WhatsApp via webhook
    try {
      await webhookService.sendBookingCancelled(updatedBooking, reason);
    } catch (error) {
      logger.error('Erro ao enviar webhook:', error);
    }

    return updatedBooking;
  }

  async updateStatus(
    id: string,
    status: BookingStatus,
    updatedBy: string
  ) {
    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        vessel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Invalidate calendar cache
    cache.del(cacheKey('calendar', [booking.vesselId]));

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: updatedBy,
        action: 'BOOKING_UPDATED',
        entityType: 'booking',
        entityId: id,
        details: {
          status,
          vesselName: booking.vessel.name,
          bookingDate: booking.bookingDate,
        },
      },
    });

    return booking;
  }

  /**
   * Soft delete de reserva - marca como deletada ao invés de remover
   * Preserva dados para auditoria e histórico
   * 
   * @param id - ID da reserva a ser deletada
   * @param deletedBy - ID do usuário que está deletando
   */
  async delete(id: string, deletedBy: string) {
    const booking = await prisma.booking.findFirst({ 
      where: { id, deletedAt: null } 
    });
    if (!booking) {
      throw new AppError(404, 'Reserva não encontrada');
    }
    await prisma.booking.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Invalidate calendar cache
    if (booking) {
      cache.del(cacheKey('calendar', [booking.vesselId]));
    }

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: deletedBy,
        action: 'BOOKING_DELETED',
        entityType: 'booking',
        entityId: id,
      },
    });
  }
}

