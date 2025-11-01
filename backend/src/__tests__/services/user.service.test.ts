import { UserService } from '../../services/user.service';
import { FinancialService } from '../../services/financial.service';
import { prisma } from '../../utils/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

// Mock do Prisma
jest.mock('../../utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    userVessel: {
      upsert: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

// Mock do FinancialService
jest.mock('../../services/financial.service');

// Mock do bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UserService', () => {
  let userService: UserService;
  let mockFinancialService: jest.Mocked<FinancialService>;

  beforeEach(() => {
    userService = new UserService();
    mockFinancialService = {
      updateVesselFinancials: jest.fn(),
    } as unknown as jest.Mocked<FinancialService>;
    
    // Substituir o financialService do userService
    (userService as any).financialService = mockFinancialService;
    
    jest.clearAllMocks();
  });

  describe('create', () => {
    const mockUserData = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
      phone: '+55 11 99999-9999',
      role: UserRole.USER,
      vesselIds: ['vessel-1', 'vessel-2'],
    };

    const mockCreatedUser = {
      id: 'user-123',
      email: mockUserData.email,
      name: mockUserData.name,
      role: UserRole.USER,
      phone: mockUserData.phone,
      isActive: true,
      createdAt: new Date(),
    };

    it('should successfully create a new user', async () => {
      // Arrange
      const createdBy = 'admin-123';
      const hashedPassword = 'hashed-password';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);
      (prisma.userVessel.createMany as jest.Mock).mockResolvedValue({ count: 2 });
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

      // Act
      const result = await userService.create(mockUserData, createdBy);

      // Assert
      expect(result).toEqual(mockCreatedUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockUserData.email },
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(mockUserData.password, 12);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: mockUserData.email,
          password: hashedPassword,
          name: mockUserData.name,
          phone: mockUserData.phone,
          role: mockUserData.role || UserRole.USER,
        }),
        select: expect.any(Object),
      });
      expect(prisma.userVessel.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          { userId: mockCreatedUser.id, vesselId: 'vessel-1' },
          { userId: mockCreatedUser.id, vesselId: 'vessel-2' },
        ]),
      });
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      // Arrange
      const createdBy = 'admin-123';
      const existingUser = { id: 'existing-user', email: mockUserData.email };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      // Act & Assert
      await expect(userService.create(mockUserData, createdBy)).rejects.toThrow('Email já está em uso');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should create user with CPF as password if provided', async () => {
      // Arrange
      const createdBy = 'admin-123';
      const userDataWithCpf = {
        ...mockUserData,
        cpf: '12345678900',
        password: undefined,
      };
      const hashedPassword = 'hashed-cpf';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);
      (prisma.userVessel.createMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

      // Act
      await userService.create(userDataWithCpf, createdBy);

      // Assert
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(userDataWithCpf.cpf, 12);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: hashedPassword,
          }),
        })
      );
    });

    it('should throw error if neither password nor CPF is provided', async () => {
      // Arrange
      const createdBy = 'admin-123';
      const userDataWithoutPassword = {
        ...mockUserData,
        password: undefined,
        cpf: undefined,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(userService.create(userDataWithoutPassword, createdBy)).rejects.toThrow('Senha é obrigatória');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should create user with vessel financials if provided', async () => {
      // Arrange
      const createdBy = 'admin-123';
      const userDataWithFinancials = {
        ...mockUserData,
        vesselFinancials: [
          {
            vesselId: 'vessel-1',
            totalValue: 100000,
            downPayment: 20000,
            totalInstallments: 10,
            marinaMonthlyFee: 500,
            marinaDueDay: 5,
          },
        ],
      };
      const hashedPassword = 'hashed-password';
      const mockUserVessel = {
        id: 'user-vessel-1',
        userId: mockCreatedUser.id,
        vesselId: 'vessel-1',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);
      (prisma.userVessel.upsert as jest.Mock).mockResolvedValue(mockUserVessel);
      mockFinancialService.updateVesselFinancials.mockResolvedValue(mockUserVessel as any);
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

      // Act
      await userService.create(userDataWithFinancials, createdBy);

      // Assert
      expect(prisma.userVessel.upsert).toHaveBeenCalled();
      expect(mockFinancialService.updateVesselFinancials).toHaveBeenCalledWith(
        mockUserVessel.id,
        expect.objectContaining({
          totalValue: 100000,
          downPayment: 20000,
          totalInstallments: 10,
          marinaMonthlyFee: 500,
          marinaDueDay: 5,
        })
      );
    });

    it('should create user with default role USER if not provided', async () => {
      // Arrange
      const createdBy = 'admin-123';
      const userDataWithoutRole = {
        ...mockUserData,
        role: undefined,
      };
      const hashedPassword = 'hashed-password';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        ...mockCreatedUser,
        role: UserRole.USER,
      });
      (prisma.userVessel.createMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

      // Act
      await userService.create(userDataWithoutRole, createdBy);

      // Assert
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: UserRole.USER,
          }),
        })
      );
    });
  });

  describe('findAll', () => {
    const mockUsers = [
      {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User 1',
        role: UserRole.USER,
        isActive: true,
      },
      {
        id: 'user-2',
        email: 'user2@example.com',
        name: 'User 2',
        role: UserRole.ADMIN,
        isActive: true,
      },
    ];

    it('should return all users without filters', async () => {
      // Arrange
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      // Act
      const result = await userService.findAll();

      // Assert
      expect(result).toEqual(mockUsers);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter users by role', async () => {
      // Arrange
      const filters = { role: UserRole.USER };
      (prisma.user.findMany as jest.Mock).mockResolvedValue([mockUsers[0]]);

      // Act
      const result = await userService.findAll(filters);

      // Assert
      expect(result).toEqual([mockUsers[0]]);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: UserRole.USER,
          }),
        })
      );
    });

    it('should filter users by isActive status', async () => {
      // Arrange
      const filters = { isActive: true };
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      // Act
      await userService.findAll(filters);

      // Assert
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        })
      );
    });
  });

  describe('findById', () => {
    const mockUser = {
      id: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
      role: UserRole.USER,
      phone: '+55 11 99999-9999',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return user by id', async () => {
      // Arrange
      const userId = 'user-123';
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await userService.findById(userId);

      // Assert
      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: expect.any(Object),
      });
    });

    it('should throw error if user not found', async () => {
      // Arrange
      const userId = 'non-existent-user';
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(userService.findById(userId)).rejects.toThrow('Usuário não encontrado');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: expect.any(Object),
      });
    });
  });

  describe('update', () => {
    const mockUpdateData = {
      name: 'Updated Name',
      phone: '+55 11 88888-8888',
      isActive: true,
      status: 'ACTIVE' as const,
    };

    const mockUpdatedUser = {
      id: 'user-123',
      email: 'user@example.com',
      name: 'Updated Name',
      role: UserRole.USER,
      phone: '+55 11 88888-8888',
      isActive: true,
    };

    it('should successfully update user', async () => {
      // Arrange
      const userId = 'user-123';
      const updatedBy = 'admin-123';

      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

      // Act
      const result = await userService.update(userId, mockUpdateData, updatedBy);

      // Assert
      expect(result).toEqual(mockUpdatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({
          name: mockUpdateData.name,
          phone: mockUpdateData.phone,
          isActive: mockUpdateData.isActive,
          status: mockUpdateData.status,
        }),
        select: expect.any(Object),
      });
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should update user vessels if vesselIds provided', async () => {
      // Arrange
      const userId = 'user-123';
      const updatedBy = 'admin-123';
      const updateDataWithVessels = {
        ...mockUpdateData,
        vesselIds: ['vessel-1', 'vessel-2'],
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);
      (prisma.userVessel.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.userVessel.createMany as jest.Mock).mockResolvedValue({ count: 2 });
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

      // Act
      await userService.update(userId, updateDataWithVessels, updatedBy);

      // Assert
      expect(prisma.userVessel.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prisma.userVessel.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          { userId, vesselId: 'vessel-1' },
          { userId, vesselId: 'vessel-2' },
        ]),
      });
    });

    it('should update user with vessel financials if provided', async () => {
      // Arrange
      const userId = 'user-123';
      const updatedBy = 'admin-123';
      const updateDataWithFinancials = {
        ...mockUpdateData,
        vesselFinancials: [
          {
            vesselId: 'vessel-1',
            totalValue: 150000,
            downPayment: 30000,
            totalInstallments: 12,
            marinaMonthlyFee: 600,
            marinaDueDay: 10,
          },
        ],
      };
      const mockUserVessel = {
        id: 'user-vessel-1',
        userId,
        vesselId: 'vessel-1',
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);
      (prisma.userVessel.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.userVessel.create as jest.Mock).mockResolvedValue(mockUserVessel);
      mockFinancialService.updateVesselFinancials.mockResolvedValue(mockUserVessel as any);
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

      // Act
      await userService.update(userId, updateDataWithFinancials, updatedBy);

      // Assert
      expect(prisma.userVessel.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prisma.userVessel.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          vesselId: 'vessel-1',
          totalValue: 150000,
          downPayment: 30000,
          remainingAmount: 120000, // 150000 - 30000
          totalInstallments: 12,
          marinaMonthlyFee: 600,
          marinaDueDay: 10,
        }),
      });
      expect(mockFinancialService.updateVesselFinancials).toHaveBeenCalledWith(
        mockUserVessel.id,
        expect.objectContaining({
          totalValue: 150000,
          downPayment: 30000,
          totalInstallments: 12,
          marinaMonthlyFee: 600,
          marinaDueDay: 10,
        })
      );
    });

    it('should handle empty vesselIds array in update', async () => {
      // Arrange
      const userId = 'user-123';
      const updatedBy = 'admin-123';
      const updateDataWithEmptyVessels = {
        ...mockUpdateData,
        vesselIds: [],
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);
      (prisma.userVessel.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

      // Act
      await userService.update(userId, updateDataWithEmptyVessels, updatedBy);

      // Assert
      expect(prisma.userVessel.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prisma.userVessel.createMany).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should successfully delete user', async () => {
      // Arrange
      const userId = 'user-123';
      const deletedBy = 'admin-123';

      (prisma.user.delete as jest.Mock).mockResolvedValue({ id: userId });
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

      // Act
      await userService.delete(userId, deletedBy);

      // Assert
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: deletedBy,
            action: 'USER_DELETED',
            entityType: 'user',
            entityId: userId,
          }),
        })
      );
    });
  });

  describe('changePassword', () => {
    const mockUser = {
      id: 'user-123',
      email: 'user@example.com',
      password: 'current-hashed-password',
      name: 'Test User',
    };

    it('should successfully change password with valid current password', async () => {
      // Arrange
      const userId = 'user-123';
      const currentPassword = 'current-password';
      const newPassword = 'new-password-123';
      const newHashedPassword = 'new-hashed-password';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedBcrypt.hash.mockResolvedValue(newHashedPassword as never);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: newHashedPassword,
      });

      // Act
      await userService.changePassword(userId, currentPassword, newPassword);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(currentPassword, mockUser.password);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: newHashedPassword },
      });
    });

    it('should throw error if user not found', async () => {
      // Arrange
      const userId = 'non-existent-user';
      const currentPassword = 'current-password';
      const newPassword = 'new-password';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        userService.changePassword(userId, currentPassword, newPassword)
      ).rejects.toThrow('Usuário não encontrado');
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw error if current password is incorrect', async () => {
      // Arrange
      const userId = 'user-123';
      const currentPassword = 'wrong-password';
      const newPassword = 'new-password-123';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(
        userService.changePassword(userId, currentPassword, newPassword)
      ).rejects.toThrow('Senha atual incorreta');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(currentPassword, mockUser.password);
      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});

