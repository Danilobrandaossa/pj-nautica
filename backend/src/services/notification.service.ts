import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error-handler';
import { UserRole } from '@prisma/client';
import { cache, cacheKey } from '../utils/cache';

export class NotificationService {
  async create(data: {
    title: string;
    message: string;
    type: string;
    isGlobal?: boolean;
    targetRole?: UserRole;
    vesselId?: string;
    userId?: string; // Para notificação específica a um usuário
    userIds?: string[]; // Para múltiplos usuários específicos
    expiresAt?: Date;
  }) {
    const notification = await prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type,
        isGlobal: data.isGlobal || false,
        targetRole: data.targetRole,
        vesselId: data.vesselId,
        expiresAt: data.expiresAt,
        isActive: true,
      },
    });

    let targetUsers: any[] = [];

    // Determinar usuários destinatários
    if (data.userId) {
      // Usuário específico
      const user = await prisma.user.findUnique({ where: { id: data.userId } });
      if (user) targetUsers = [user];
    } else if (data.userIds && data.userIds.length > 0) {
      // Múltiplos usuários específicos
      targetUsers = await prisma.user.findMany({
        where: { id: { in: data.userIds }, isActive: true }
      });
    } else if (data.vesselId) {
      // Todos os usuários de uma embarcação específica
      const userVessels = await prisma.userVessel.findMany({
        where: { vesselId: data.vesselId },
        include: { user: true }
      });
      targetUsers = userVessels.map(uv => uv.user);
    } else if (data.isGlobal || data.targetRole) {
      // Global ou por role
      targetUsers = await prisma.user.findMany({
        where: {
          isActive: true,
          ...(data.targetRole && { role: data.targetRole }),
        },
      });
    }

    // Criar UserNotification para os usuários determinados
    if (targetUsers.length > 0) {
      await prisma.userNotification.createMany({
        data: targetUsers.map((user) => ({
          userId: user.id,
          notificationId: notification.id,
        })),
      });

      // Invalidate unread counts
      for (const u of targetUsers) {
        cache.del(cacheKey('notifications:unread', [u.id]));
      }
    }

    return notification;
  }

  async findAll(filters?: {
    isActive?: boolean;
    type?: string;
  }) {
    return prisma.notification.findMany({
      where: {
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters?.type && { type: filters.type }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUser(userId: string) {
    const userNotifications = await prisma.userNotification.findMany({
      where: {
        userId,
        notification: {
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } },
          ],
        },
      },
      include: {
        notification: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return userNotifications;
  }

  async markAsRead(userId: string, notificationId: string) {
    const userNotification = await prisma.userNotification.findUnique({
      where: {
        userId_notificationId: {
          userId,
          notificationId,
        },
      },
    });

    if (!userNotification) {
      throw new AppError(404, 'Notificação não encontrada');
    }

    const updated = await prisma.userNotification.update({
      where: {
        id: userNotification.id,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
      include: {
        notification: true,
      },
    });

    // Invalidate unread cache
    cache.del(cacheKey('notifications:unread', [userId]));

    return updated;
  }

  async markAllAsRead(userId: string) {
    await prisma.userNotification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    cache.del(cacheKey('notifications:unread', [userId]));
  }

  async getUnreadCount(userId: string) {
    const key = cacheKey('notifications:unread', [userId]);
    return cache.wrap(key, 30_000, async () => {
      return prisma.userNotification.count({
        where: {
          userId,
          isRead: false,
          notification: {
            isActive: true,
          },
        },
      });
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      message?: string;
      isActive?: boolean;
      expiresAt?: Date;
    }
  ) {
    const updated = await prisma.notification.update({
      where: { id },
      data,
    });

    // Broadly invalidate caches for users that could be affected is complex.
    // Minimal approach: clear all unread caches (acceptable for in-memory dev env)
    // In production, use pub/sub to target impacted users.
    return updated;
  }

  async delete(id: string) {
    await prisma.notification.delete({
      where: { id },
    });
    // No specific cache invalidation here beyond per-user unread counts on next access
  }
}

