// BookingService será importado após os mocks
import { prisma } from '../../utils/prisma';
import { BookingStatus, UserRole, UserStatus } from '@prisma/client';
import { addDays, startOfDay } from 'date-fns';

// Mock do Prisma
jest.mock('../../utils/prisma', () => ({
  prisma: {
    userVessel: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    vessel: {
      findUnique: jest.fn(),
    },
    blockedDate: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    booking: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

// Criar objetos mock compartilhados globalmente (usar objeto global para evitar hoisting issues)
const mockInstances: {
  weeklyBlock?: {
    isDateBlockedByWeeklyBlock: jest.Mock;
    getActiveWeeklyBlocks: jest.Mock;
  };
  webhook?: {
    sendBookingCreated: jest.Mock;
    sendBookingCancelled: jest.Mock;
  };
} = {};

// Mock do WeeklyBlockService
jest.mock('../../services/weekly-block.service', () => {
  const mockInstance = {
    isDateBlockedByWeeklyBlock: jest.fn(),
    getActiveWeeklyBlocks: jest.fn(),
  };
  mockInstances.weeklyBlock = mockInstance;
  return {
    WeeklyBlockService: jest.fn(() => mockInstance),
  };
});

// Mock do WebhookService
jest.mock('../../services/webhook.service', () => {
  const mockInstance = {
    sendBookingCreated: jest.fn(),
    sendBookingCancelled: jest.fn(),
  };
  mockInstances.webhook = mockInstance;
  return {
    WebhookService: jest.fn(() => mockInstance),
  };
});

// Criar aliases para facilitar o uso nos testes
const weeklyBlockMock = () => mockInstances.weeklyBlock!;
const webhookMock = () => mockInstances.webhook!;

// Mock do logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

// Importar BookingService somente após configurar os mocks
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { BookingService } = require('../../services/booking.service');

describe('BookingService', () => {
  let bookingService: InstanceType<typeof BookingService>;

  // Mock de data atual fixa para testes
  const mockNow = new Date('2025-10-30T10:00:00Z');
  
  beforeEach(() => {
    // Limpar mocks antes de cada teste
    jest.clearAllMocks();
    
    // Configurar valores padrão dos mocks (usando as instâncias compartilhadas)
    weeklyBlockMock().isDateBlockedByWeeklyBlock.mockResolvedValue({ isBlocked: false });
    weeklyBlockMock().getActiveWeeklyBlocks.mockResolvedValue([]);
    webhookMock().sendBookingCreated.mockResolvedValue(undefined);
    webhookMock().sendBookingCancelled.mockResolvedValue(undefined);
    
    bookingService = new BookingService();

    // Mock de Date.now para usar data fixa
    jest.spyOn(Date, 'now').mockReturnValue(mockNow.getTime());
    // Usar jest.useFakeTimers para controlar o tempo
    jest.useFakeTimers({ now: mockNow });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe('create', () => {
    const mockUserVessel = {
      id: 'user-vessel-1',
      userId: 'user-123',
      vesselId: 'vessel-1',
      status: 'ACTIVE',
      user: {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        status: UserStatus.ACTIVE,
        role: UserRole.USER,
      },
      vessel: {
        id: 'vessel-1',
        name: 'Infinity ONE',
        calendarDaysAhead: 62,
        bookingLimit: {
          id: 'limit-1',
          maxActiveBookings: 2,
        },
      },
    };

    const mockBookingData = {
      vesselId: 'vessel-1',
      bookingDate: addDays(mockNow, 2), // 2 dias no futuro (48h de antecedência)
      notes: 'Reserva de teste',
    };

    const mockCreatedBooking = {
      id: 'booking-123',
      userId: 'user-123',
      vesselId: 'vessel-1',
      bookingDate: startOfDay(mockBookingData.bookingDate),
      status: BookingStatus.APPROVED,
      notes: 'Reserva de teste',
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'user@example.com',
        phone: '+55 11 99999-9999',
      },
      vessel: {
        id: 'vessel-1',
        name: 'Infinity ONE',
        description: 'Descrição',
      },
    };

    it('should successfully create a booking with valid data', async () => {
      // Arrange
      const userId = 'user-123';
      const ip = '127.0.0.1';

      (prisma.userVessel.findUnique as jest.Mock).mockResolvedValue(mockUserVessel);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      });
      (prisma.blockedDate.findFirst as jest.Mock).mockResolvedValue(null);
      weeklyBlockMock().isDateBlockedByWeeklyBlock.mockResolvedValue({ isBlocked: false });
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.booking.create as jest.Mock).mockResolvedValue(mockCreatedBooking);
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});
      webhookMock().sendBookingCreated.mockResolvedValue(undefined);

      // Act
      const result = await bookingService.create(mockBookingData, userId, ip);

      // Assert
      expect(result).toEqual(mockCreatedBooking);
      expect(prisma.booking.create).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalled();
      expect(webhookMock().sendBookingCreated).toHaveBeenCalled();
    });

    it('should throw error if user does not have access to vessel', async () => {
      // Arrange
      const userId = 'user-123';

      (prisma.userVessel.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      });

      // Act & Assert
      await expect(
        bookingService.create(mockBookingData, userId)
      ).rejects.toThrow('Você não tem acesso a esta embarcação');
    });

    it('should allow admin to book any vessel even without userVessel', async () => {
      // Arrange
      const userId = 'admin-123';
      const mockVessel = {
        id: 'vessel-1',
        name: 'Infinity ONE',
        calendarDaysAhead: 62,
        bookingLimit: {
          id: 'limit-1',
          maxActiveBookings: 2,
        },
      };

      (prisma.userVessel.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });
      (prisma.vessel.findUnique as jest.Mock).mockResolvedValue(mockVessel);
      (prisma.blockedDate.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.booking.create as jest.Mock).mockResolvedValue(mockCreatedBooking);
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});
      webhookMock().sendBookingCreated.mockResolvedValue(undefined);

      // Act
      const result = await bookingService.create(mockBookingData, userId);

      // Assert
      expect(result).toEqual(mockCreatedBooking);
      expect(prisma.vessel.findUnique).toHaveBeenCalledWith({
        where: { id: mockBookingData.vesselId },
        include: { bookingLimit: true },
      });
    });

    it('should throw error if user status is BLOCKED', async () => {
      // Arrange
      const userId = 'user-123';
      const blockedUserVessel = {
        ...mockUserVessel,
        user: {
          ...mockUserVessel.user,
          status: UserStatus.BLOCKED,
        },
      };

      (prisma.userVessel.findUnique as jest.Mock).mockResolvedValue(blockedUserVessel);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.USER,
        status: UserStatus.BLOCKED,
      });

      // Act & Assert
      await expect(
        bookingService.create(mockBookingData, userId)
      ).rejects.toThrow('Sua conta está bloqueada');
    });

    it('should throw error if user status is OVERDUE_PAYMENT', async () => {
      // Arrange
      const userId = 'user-123';
      const overdueUserVessel = {
        ...mockUserVessel,
        user: {
          ...mockUserVessel.user,
          status: UserStatus.OVERDUE_PAYMENT,
        },
      };

      (prisma.userVessel.findUnique as jest.Mock).mockResolvedValue(overdueUserVessel);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.USER,
        status: UserStatus.OVERDUE_PAYMENT,
      });

      // Act & Assert
      await expect(
        bookingService.create(mockBookingData, userId)
      ).rejects.toThrow('Você possui pagamentos em atraso');
    });

    it('should throw error if user status is OVERDUE', async () => {
      // Arrange
      const userId = 'user-123';
      const overdueUserVessel = {
        ...mockUserVessel,
        user: {
          ...mockUserVessel.user,
          status: UserStatus.OVERDUE,
        },
      };

      (prisma.userVessel.findUnique as jest.Mock).mockResolvedValue(overdueUserVessel);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.USER,
        status: UserStatus.OVERDUE,
      });

      // Act & Assert
      await expect(
        bookingService.create(mockBookingData, userId)
      ).rejects.toThrow('Você possui pendências');
    });

    it('should throw error if booking date is less than 24 hours ahead', async () => {
      // Arrange
      const userId = 'user-123';
      const bookingDataInsufficientAdvance = {
        ...mockBookingData,
        bookingDate: addDays(mockNow, 0.5), // 12 horas no futuro
      };

      (prisma.userVessel.findUnique as jest.Mock).mockResolvedValue(mockUserVessel);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      });

      // Act & Assert
      await expect(
        bookingService.create(bookingDataInsufficientAdvance, userId)
      ).rejects.toThrow('Reservas devem ser feitas com no mínimo 24 horas de antecedência');
    });

    it('should throw error if booking date is in the past', async () => {
      // Arrange
      const userId = 'user-123';
      // Criar uma data que está no passado mas não cai na validação de 24h
      const pastDate = new Date(mockNow);
      pastDate.setDate(pastDate.getDate() - 2); // 2 dias no passado
      const pastBookingData = {
        ...mockBookingData,
        bookingDate: pastDate,
      };

      (prisma.userVessel.findUnique as jest.Mock).mockResolvedValue(mockUserVessel);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      });

      // Act & Assert
      await expect(
        bookingService.create(pastBookingData, userId)
      ).rejects.toThrow('Reservas devem ser feitas com no mínimo 24 horas de antecedência');
    });

    it('should throw error if booking date exceeds max days ahead', async () => {
      // Arrange
      const userId = 'user-123';
      const farFutureBookingData = {
        ...mockBookingData,
        bookingDate: addDays(mockNow, 100), // 100 dias no futuro
      };

      (prisma.userVessel.findUnique as jest.Mock).mockResolvedValue(mockUserVessel);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      });

      // Act & Assert
      await expect(
        bookingService.create(farFutureBookingData, userId)
      ).rejects.toThrow('Reservas só podem ser feitas até');
    });

    it('should throw error if date is blocked', async () => {
      // Arrange
      const userId = 'user-123';
      const mockBlockedDate = {
        id: 'blocked-1',
        vesselId: 'vessel-1',
        startDate: startOfDay(mockBookingData.bookingDate),
        endDate: startOfDay(mockBookingData.bookingDate),
        reason: 'MAINTENANCE',
        notes: 'Manutenção programada',
      };

      (prisma.userVessel.findUnique as jest.Mock).mockResolvedValue(mockUserVessel);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      });
      (prisma.blockedDate.findFirst as jest.Mock).mockResolvedValue(mockBlockedDate);

      // Act & Assert
      await expect(
        bookingService.create(mockBookingData, userId)
      ).rejects.toThrow('Data bloqueada');
    });

    it('should throw error if date is blocked by weekly block (for regular users)', async () => {
      // Arrange
      const userId = 'user-123';

      (prisma.userVessel.findUnique as jest.Mock).mockResolvedValue(mockUserVessel);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      });
      (prisma.blockedDate.findFirst as jest.Mock).mockResolvedValue(null);
      weeklyBlockMock().isDateBlockedByWeeklyBlock.mockResolvedValue({
        isBlocked: true,
        reason: 'MANUTENÇÃO',
        notes: 'Manutenção semanal',
      });

      // Act & Assert
      await expect(
        bookingService.create(mockBookingData, userId)
      ).rejects.toThrow('Data bloqueada');
    });

    it('should not check weekly blocks for admin users', async () => {
      // Arrange
      const userId = 'admin-123';
      const mockVessel = {
        id: 'vessel-1',
        name: 'Infinity ONE',
        calendarDaysAhead: 62,
        bookingLimit: {
          id: 'limit-1',
          maxActiveBookings: 2,
        },
      };

      (prisma.userVessel.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });
      (prisma.vessel.findUnique as jest.Mock).mockResolvedValue(mockVessel);
      (prisma.blockedDate.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.booking.create as jest.Mock).mockResolvedValue(mockCreatedBooking);
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});
      webhookMock().sendBookingCreated.mockResolvedValue(undefined);

      // Act
      await bookingService.create(mockBookingData, userId);

      // Assert
      expect(weeklyBlockMock().isDateBlockedByWeeklyBlock).not.toHaveBeenCalled();
    });

    it('should throw error if booking already exists for the date', async () => {
      // Arrange
      const userId = 'user-123';
      const existingBooking = {
        id: 'existing-booking',
        vesselId: 'vessel-1',
        bookingDate: startOfDay(mockBookingData.bookingDate),
      };

      (prisma.userVessel.findUnique as jest.Mock).mockResolvedValue(mockUserVessel);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      });
      (prisma.blockedDate.findFirst as jest.Mock).mockResolvedValue(null);
      weeklyBlockMock().isDateBlockedByWeeklyBlock.mockResolvedValue({ isBlocked: false });
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(existingBooking);

      // Act & Assert
      await expect(
        bookingService.create(mockBookingData, userId)
      ).rejects.toThrow('Já existe uma reserva para esta data');
    });

    it('should throw error if user reached max active bookings limit', async () => {
      // Arrange
      const userId = 'user-123';
      const activeBookings = [
        {
          id: 'booking-1',
          bookingDate: addDays(mockNow, 3),
          status: BookingStatus.APPROVED,
        },
        {
          id: 'booking-2',
          bookingDate: addDays(mockNow, 5),
          status: BookingStatus.APPROVED,
        },
      ];

      (prisma.userVessel.findUnique as jest.Mock).mockResolvedValue(mockUserVessel);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      });
      (prisma.blockedDate.findFirst as jest.Mock).mockResolvedValue(null);
      weeklyBlockMock().isDateBlockedByWeeklyBlock.mockResolvedValue({ isBlocked: false });
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.booking.findMany as jest.Mock).mockResolvedValue(activeBookings);

      // Act & Assert
      await expect(
        bookingService.create(mockBookingData, userId)
      ).rejects.toThrow('Limite de');
    });

    it('should allow booking if first active booking has passed', async () => {
      // Arrange
      const userId = 'user-123';
      const activeBookings = [
        {
          id: 'booking-1',
          bookingDate: addDays(mockNow, -1), // Passado
          status: BookingStatus.APPROVED,
        },
        {
          id: 'booking-2',
          bookingDate: addDays(mockNow, 5),
          status: BookingStatus.APPROVED,
        },
      ];

      (prisma.userVessel.findUnique as jest.Mock).mockResolvedValue(mockUserVessel);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      });
      (prisma.blockedDate.findFirst as jest.Mock).mockResolvedValue(null);
      weeklyBlockMock().isDateBlockedByWeeklyBlock.mockResolvedValue({ isBlocked: false });
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.booking.findMany as jest.Mock).mockResolvedValue(activeBookings);
      (prisma.booking.create as jest.Mock).mockResolvedValue(mockCreatedBooking);
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});
      webhookMock().sendBookingCreated.mockResolvedValue(undefined);

      // Act
      const result = await bookingService.create(mockBookingData, userId);

      // Assert
      expect(result).toEqual(mockCreatedBooking);
    });

    it('should handle webhook error gracefully without blocking booking creation', async () => {
      // Arrange
      const userId = 'user-123';

      (prisma.userVessel.findUnique as jest.Mock).mockResolvedValue(mockUserVessel);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      });
      (prisma.blockedDate.findFirst as jest.Mock).mockResolvedValue(null);
      weeklyBlockMock().isDateBlockedByWeeklyBlock.mockResolvedValue({ isBlocked: false });
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.booking.create as jest.Mock).mockResolvedValue(mockCreatedBooking);
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});
      webhookMock().sendBookingCreated.mockRejectedValue(new Error('Webhook failed'));

      // Act
      const result = await bookingService.create(mockBookingData, userId);

      // Assert
      expect(result).toEqual(mockCreatedBooking);
      expect(prisma.booking.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const mockBookings = [
      {
        id: 'booking-1',
        userId: 'user-123',
        vesselId: 'vessel-1',
        bookingDate: new Date('2025-11-01'),
        status: BookingStatus.APPROVED,
        user: {
          id: 'user-123',
          name: 'User 1',
          email: 'user1@example.com',
          phone: '+55 11 99999-9999',
        },
        vessel: {
          id: 'vessel-1',
          name: 'Infinity ONE',
          location: 'Marina A',
        },
      },
      {
        id: 'booking-2',
        userId: 'user-124',
        vesselId: 'vessel-1',
        bookingDate: new Date('2025-11-02'),
        status: BookingStatus.PENDING,
        user: {
          id: 'user-124',
          name: 'User 2',
          email: 'user2@example.com',
          phone: '+55 11 88888-8888',
        },
        vessel: {
          id: 'vessel-1',
          name: 'Infinity ONE',
          location: 'Marina A',
        },
      },
    ];

    it('should return all bookings without filters', async () => {
      // Arrange
      (prisma.booking.findMany as jest.Mock).mockResolvedValue(mockBookings);

      // Act
      const result = await bookingService.findAll();

      // Assert
      expect(result).toEqual(mockBookings);
      expect(prisma.booking.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        orderBy: { bookingDate: 'desc' },
      });
    });

    it('should filter bookings by userId', async () => {
      // Arrange
      const filters = { userId: 'user-123' };
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([mockBookings[0]]);

      // Act
      await bookingService.findAll(filters);

      // Assert
      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
          }),
        })
      );
    });

    it('should filter bookings by vesselId', async () => {
      // Arrange
      const filters = { vesselId: 'vessel-1' };
      (prisma.booking.findMany as jest.Mock).mockResolvedValue(mockBookings);

      // Act
      await bookingService.findAll(filters);

      // Assert
      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            vesselId: 'vessel-1',
          }),
        })
      );
    });

    it('should filter bookings by status', async () => {
      // Arrange
      const filters = { status: BookingStatus.APPROVED };
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([mockBookings[0]]);

      // Act
      await bookingService.findAll(filters);

      // Assert
      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: BookingStatus.APPROVED,
          }),
        })
      );
    });

    it('should filter bookings by date range', async () => {
      // Arrange
      const startDate = new Date('2025-11-01');
      const endDate = new Date('2025-11-30');
      const filters = { startDate, endDate };
      (prisma.booking.findMany as jest.Mock).mockResolvedValue(mockBookings);

      // Act
      await bookingService.findAll(filters);

      // Assert
      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            bookingDate: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('findById', () => {
    const mockBooking = {
      id: 'booking-123',
      userId: 'user-123',
      vesselId: 'vessel-1',
      bookingDate: new Date('2025-11-01'),
      status: BookingStatus.APPROVED,
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'user@example.com',
        phone: '+55 11 99999-9999',
      },
      vessel: {
        id: 'vessel-1',
        name: 'Infinity ONE',
        description: 'Descrição',
        location: 'Marina A',
        capacity: 10,
      },
    };

    it('should return booking by id', async () => {
      // Arrange
      const bookingId = 'booking-123';
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);

      // Act
      const result = await bookingService.findById(bookingId);

      // Assert
      expect(result).toEqual(mockBooking);
      expect(prisma.booking.findUnique).toHaveBeenCalledWith({
        where: { id: bookingId },
        include: expect.any(Object),
      });
    });

    it('should throw error if booking not found', async () => {
      // Arrange
      const bookingId = 'non-existent-booking';
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(bookingService.findById(bookingId)).rejects.toThrow('Reserva não encontrada');
    });
  });

  describe('getCalendar', () => {
    const mockBookings = [
      {
        id: 'booking-1',
        bookingDate: new Date('2025-11-01'),
        user: {
          id: 'user-123',
          name: 'User 1',
        },
      },
    ];

    const mockBlockedDates = [
      {
        id: 'blocked-1',
        vesselId: 'vessel-1',
        startDate: new Date('2025-11-05'),
        endDate: new Date('2025-11-05'),
        reason: 'MAINTENANCE',
      },
    ];

    const mockWeeklyBlocks = [
      {
        id: 'weekly-1',
        dayOfWeek: 0, // Domingo
        reason: 'MANUTENÇÃO',
        notes: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return calendar with bookings, blocked dates and weekly blocks', async () => {
      // Arrange
      const vesselId = 'vessel-1';
      const startDate = new Date('2025-11-01');
      const endDate = new Date('2025-11-30');

      (prisma.booking.findMany as jest.Mock).mockResolvedValue(mockBookings);
      (prisma.blockedDate.findMany as jest.Mock).mockResolvedValue(mockBlockedDates);
      weeklyBlockMock().getActiveWeeklyBlocks.mockResolvedValue(mockWeeklyBlocks);

      // Act
      const result = await bookingService.getCalendar(vesselId, startDate, endDate);

      // Assert
      expect(result).toEqual({
        bookings: mockBookings,
        blockedDates: mockBlockedDates,
        weeklyBlocks: mockWeeklyBlocks,
      });
      expect(prisma.booking.findMany).toHaveBeenCalledWith({
        where: {
          vesselId,
          bookingDate: {
            gte: startOfDay(startDate),
            lte: startOfDay(endDate),
          },
          status: { in: ['PENDING', 'APPROVED'] },
        },
        include: expect.any(Object),
      });
      expect(weeklyBlockMock().getActiveWeeklyBlocks).toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    const mockBooking = {
      id: 'booking-123',
      userId: 'user-123',
      vesselId: 'vessel-1',
      bookingDate: addDays(mockNow, 5),
      status: BookingStatus.APPROVED,
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'user@example.com',
        phone: '+55 11 99999-9999',
      },
      vessel: {
        id: 'vessel-1',
        name: 'Infinity ONE',
      },
    };

    const mockCancelledBooking = {
      ...mockBooking,
      status: BookingStatus.CANCELLED,
      cancelledAt: mockNow,
      cancellationReason: 'Cancelamento de teste',
    };

    it('should successfully cancel booking', async () => {
      // Arrange
      const bookingId = 'booking-123';
      const userId = 'user-123';
      const isAdmin = false;
      const reason = 'Cancelamento de teste';

      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);
      (prisma.booking.update as jest.Mock).mockResolvedValue({
        ...mockCancelledBooking,
        user: mockBooking.user,
        vessel: mockBooking.vessel,
      });
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});
      webhookMock().sendBookingCancelled.mockResolvedValue(undefined);

      // Act
      const result = await bookingService.cancel(bookingId, userId, isAdmin, reason);

      // Assert
      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: bookingId },
        data: expect.objectContaining({
          status: BookingStatus.CANCELLED,
          cancellationReason: reason,
        }),
        include: expect.any(Object),
      });
      expect(prisma.auditLog.create).toHaveBeenCalled();
      expect(webhookMock().sendBookingCancelled).toHaveBeenCalled();
    });

    it('should throw error if booking not found', async () => {
      // Arrange
      const bookingId = 'non-existent-booking';
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        bookingService.cancel(bookingId, 'user-123', false)
      ).rejects.toThrow('Reserva não encontrada');
    });

    it('should throw error if user does not have permission', async () => {
      // Arrange
      const bookingId = 'booking-123';
      const userId = 'user-456'; // Diferente do dono da reserva
      const isAdmin = false;

      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);

      // Act & Assert
      await expect(
        bookingService.cancel(bookingId, userId, isAdmin)
      ).rejects.toThrow('Você não tem permissão para cancelar esta reserva');
    });

    it('should allow admin to cancel any booking', async () => {
      // Arrange
      const bookingId = 'booking-123';
      const userId = 'admin-123';
      const isAdmin = true;

      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);
      (prisma.booking.update as jest.Mock).mockResolvedValue({
        ...mockCancelledBooking,
        user: mockBooking.user,
        vessel: mockBooking.vessel,
      });
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});
      webhookMock().sendBookingCancelled.mockResolvedValue(undefined);

      // Act
      const result = await bookingService.cancel(bookingId, userId, isAdmin);

      // Assert
      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('should throw error if booking already cancelled', async () => {
      // Arrange
      const bookingId = 'booking-123';
      const cancelledBooking = {
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      };

      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(cancelledBooking);

      // Act & Assert
      await expect(
        bookingService.cancel(bookingId, 'user-123', false)
      ).rejects.toThrow('Esta reserva já foi cancelada');
    });

    it('should throw error if booking already completed', async () => {
      // Arrange
      const bookingId = 'booking-123';
      const completedBooking = {
        ...mockBooking,
        status: BookingStatus.COMPLETED,
      };

      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(completedBooking);

      // Act & Assert
      await expect(
        bookingService.cancel(bookingId, 'user-123', false)
      ).rejects.toThrow('Não é possível cancelar uma reserva concluída');
    });

    it('should handle webhook error gracefully without blocking cancellation', async () => {
      // Arrange
      const bookingId = 'booking-123';
      const userId = 'user-123';

      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);
      (prisma.booking.update as jest.Mock).mockResolvedValue({
        ...mockCancelledBooking,
        user: mockBooking.user,
        vessel: mockBooking.vessel,
      });
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});
      webhookMock().sendBookingCancelled.mockRejectedValue(new Error('Webhook failed'));

      // Act
      const result = await bookingService.cancel(bookingId, userId, false, 'Reason');

      // Assert
      expect(result.status).toBe(BookingStatus.CANCELLED);
    });
  });

  describe('updateStatus', () => {
    const mockUpdatedBooking = {
      id: 'booking-123',
      userId: 'user-123',
      vesselId: 'vessel-1',
      bookingDate: new Date('2025-11-01'),
      status: BookingStatus.PENDING,
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'user@example.com',
      },
      vessel: {
        id: 'vessel-1',
        name: 'Infinity ONE',
      },
    };

    it('should successfully update booking status', async () => {
      // Arrange
      const bookingId = 'booking-123';
      const newStatus = BookingStatus.PENDING;
      const updatedBy = 'admin-123';

      (prisma.booking.update as jest.Mock).mockResolvedValue(mockUpdatedBooking);
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

      // Act
      const result = await bookingService.updateStatus(bookingId, newStatus, updatedBy);

      // Assert
      expect(result).toEqual(mockUpdatedBooking);
      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: bookingId },
        data: { status: newStatus },
        include: expect.any(Object),
      });
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should successfully delete booking', async () => {
      // Arrange
      const bookingId = 'booking-123';
      const deletedBy = 'admin-123';

      (prisma.booking.delete as jest.Mock).mockResolvedValue({ id: bookingId });
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

      // Act
      await bookingService.delete(bookingId, deletedBy);

      // Assert
      expect(prisma.booking.delete).toHaveBeenCalledWith({
        where: { id: bookingId },
      });
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: deletedBy,
          action: 'BOOKING_DELETED',
          entityType: 'booking',
          entityId: bookingId,
        }),
      });
    });
  });
});

