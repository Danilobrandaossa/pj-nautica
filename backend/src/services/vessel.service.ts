import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error-handler';
import { cache, cacheKey } from '../utils/cache';

export class VesselService {
  async create(
    data: {
      name: string;
      description?: string;
      capacity?: number;
      location?: string;
      imageUrl?: string;
      maxActiveBookings?: number;
      calendarDaysAhead?: number;
    },
    createdBy: string
  ) {
    const vessel = await prisma.vessel.create({
      data: {
        name: data.name,
        description: data.description,
        capacity: data.capacity,
        location: data.location,
        imageUrl: data.imageUrl,
        calendarDaysAhead: data.calendarDaysAhead || 62,
        bookingLimit: {
          create: {
            maxActiveBookings: data.maxActiveBookings || 2,
          },
        },
      },
      include: {
        bookingLimit: true,
      },
    });

    // Invalidate relevant cache
    cache.del(cacheKey('vessels:list', [true]));
    cache.del(cacheKey('vessels:list', [false]));

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: createdBy,
        action: 'VESSEL_CREATED',
        entityType: 'vessel',
        entityId: vessel.id,
        details: { name: vessel.name },
      },
    });

    return vessel;
  }

  async findAll(filters?: { isActive?: boolean }) {
    const key = cacheKey('vessels:list', [filters?.isActive]);
    return cache.wrap(key, 60_000, async () => {
      return prisma.vessel.findMany({
        where: {
          deletedAt: null, // Excluir deletadas por padrão
          ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
        },
        include: {
          bookingLimit: true,
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              bookings: true,
              blockedDates: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    });
  }

  async findById(id: string) {
    const key = cacheKey('vessels:item', [id]);
    const vessel = await cache.wrap(key, 60_000, async () => {
      return prisma.vessel.findFirst({
        where: { 
          id,
          deletedAt: null, // Não retornar se foi deletada
        },
        include: {
          bookingLimit: true,
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          _count: {
            select: {
              bookings: true,
              blockedDates: true,
            },
          },
        },
      });
    });

    if (!vessel) {
      throw new AppError(404, 'Embarcação não encontrada');
    }

    return vessel;
  }

  async findByUser(userId: string) {
    const userVessels = await prisma.userVessel.findMany({
      where: { 
        userId,
        vessel: {
          deletedAt: null, // Excluir embarcações deletadas
        },
      },
      include: {
        vessel: {
          include: {
            bookingLimit: true,
          },
        },
      },
    });

    return userVessels.map((uv) => uv.vessel);
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      capacity?: number;
      location?: string;
      imageUrl?: string;
      isActive?: boolean;
      maxActiveBookings?: number;
      calendarDaysAhead?: number;
    },
    updatedBy: string
  ) {
    const vessel = await prisma.vessel.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.calendarDaysAhead !== undefined && { calendarDaysAhead: data.calendarDaysAhead }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        bookingLimit: true,
      },
    });

    // Atualizar limite de reservas
    if (data.maxActiveBookings !== undefined) {
      await prisma.bookingLimit.upsert({
        where: { vesselId: id },
        update: { maxActiveBookings: data.maxActiveBookings },
        create: {
          vesselId: id,
          maxActiveBookings: data.maxActiveBookings,
        },
      });
    }

    // Invalidate relevant cache
    cache.del(cacheKey('vessels:item', [id]));
    cache.del(cacheKey('vessels:list', [true]));
    cache.del(cacheKey('vessels:list', [false]));

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: updatedBy,
        action: 'VESSEL_UPDATED',
        entityType: 'vessel',
        entityId: id,
        details: data,
      },
    });

    return vessel;
  }

  /**
   * Soft delete de embarcação - marca como deletada ao invés de remover
   * Preserva dados para auditoria e histórico
   * 
   * @param id - ID da embarcação a ser deletada
   * @param deletedBy - ID do usuário que está deletando
   */
  async delete(id: string, deletedBy: string) {
    await prisma.vessel.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Invalidate cache
    cache.del(cacheKey('vessels:item', [id]));
    cache.del(cacheKey('vessels:list', [true]));
    cache.del(cacheKey('vessels:list', [false]));

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: deletedBy,
        action: 'VESSEL_DELETED',
        entityType: 'vessel',
        entityId: id,
      },
    });
  }

  async addUser(vesselId: string, userId: string, addedBy: string) {
    // Verificar se embarcação e usuário existem
    const vessel = await prisma.vessel.findUnique({ where: { id: vesselId } });
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!vessel) {
      throw new AppError(404, 'Embarcação não encontrada');
    }

    if (!user) {
      throw new AppError(404, 'Usuário não encontrado');
    }

    // Adicionar vínculo
    const userVessel = await prisma.userVessel.create({
      data: {
        vesselId,
        userId,
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
    });

    // Invalidate cache
    cache.del(cacheKey('vessels:item', [vesselId]));

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: addedBy,
        action: 'VESSEL_UPDATED',
        entityType: 'vessel',
        entityId: vesselId,
        details: {
          action: 'user_added',
          userName: user.name,
          userEmail: user.email,
        },
      },
    });

    return userVessel;
  }

  async removeUser(vesselId: string, userId: string, removedBy: string) {
    await prisma.userVessel.delete({
      where: {
        userId_vesselId: {
          userId,
          vesselId,
        },
      },
    });

    // Invalidate cache
    cache.del(cacheKey('vessels:item', [vesselId]));

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: removedBy,
        action: 'VESSEL_UPDATED',
        entityType: 'vessel',
        entityId: vesselId,
        details: {
          action: 'user_removed',
          userId,
        },
      },
    });
  }
}

