import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserService } from '../services/user.service';
import { UserRole } from '@prisma/client';
import { validateCPF, sanitizeString, isValidUUID } from '../middleware/validation';
import { AppError } from '../middleware/error-handler';

const userService = new UserService();

const createUserSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase().trim(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(100, 'Senha muito longa').optional(),
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100, 'Nome muito longo').transform(sanitizeString),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Telefone inválido').optional(),
  cpf: z.string()
    .regex(/^\d{11}$/, 'CPF deve ter exatamente 11 dígitos numéricos')
    .refine(validateCPF, 'CPF inválido')
    .optional(), // CPF será usado como senha
  role: z.nativeEnum(UserRole).optional(),
  vesselIds: z.array(z.string()).optional(),
  // Campos adicionais
  birthDate: z.string().optional(),
  licenseType: z.string().optional(),
  registrationNumber: z.string().optional(),
  licenseExpiry: z.string().optional(),
  billingDueDay: z.number().min(1).max(31).optional(),
  // Dados de endereço
  address: z.string().optional(),
  zipCode: z.string().optional(),
  addressNumber: z.string().optional(),
  state: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  complement: z.string().optional(),
  // Campos financeiros para embarcações
  vesselFinancials: z.array(z.object({
    vesselId: z.string(),
    totalValue: z.number().min(0).optional(),
    downPayment: z.number().min(0).optional(),
    totalInstallments: z.number().min(0).optional(),
    marinaMonthlyFee: z.number().min(0).optional(),
    marinaDueDay: z.number().min(1).max(31).optional()
  })).optional()
});

const updateUserSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100, 'Nome muito longo').transform(sanitizeString).optional(),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Telefone inválido').optional(),
  isActive: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'OVERDUE', 'OVERDUE_PAYMENT', 'BLOCKED']).optional(),
  vesselIds: z.array(z.string()).optional(),
  // Campos financeiros para embarcações
  vesselFinancials: z.array(z.object({
    vesselId: z.string(),
    totalValue: z.number().min(0).optional(),
    downPayment: z.number().min(0).optional(),
    totalInstallments: z.number().min(0).optional(),
    marinaMonthlyFee: z.number().min(0).optional(),
    marinaDueDay: z.number().min(1).max(31).optional()
  })).optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres'),
});

export class UserController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createUserSchema.parse(req.body);
      const createdBy = req.user!.userId;

      // Garantir que email e name estejam presentes
      if (!data.email || !data.name) {
        return next(new AppError(400, 'Email e nome são obrigatórios'));
      }

      const user = await userService.create({
        email: data.email,
        password: data.password,
        cpf: data.cpf,
        name: data.name,
        phone: data.phone,
        role: data.role,
        vesselIds: data.vesselIds,
        birthDate: data.birthDate,
        licenseType: data.licenseType,
        registrationNumber: data.registrationNumber,
        licenseExpiry: data.licenseExpiry,
        billingDueDay: data.billingDueDay,
        address: data.address,
        zipCode: data.zipCode,
        addressNumber: data.addressNumber,
        state: data.state,
        neighborhood: data.neighborhood,
        city: data.city,
        complement: data.complement,
        // Passar vesselFinancials como any para o serviço processar
        vesselFinancials: data.vesselFinancials,
      } as any, createdBy);

      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const querySchema = z.object({
        role: z.nativeEnum(UserRole).optional(),
        isActive: z.string().transform((val) => {
          if (val === 'true') return true;
          if (val === 'false') return false;
          return undefined;
        }).optional(),
      });
      
      const { role, isActive } = querySchema.parse(req.query);

      const users = await userService.findAll({
        role,
        isActive,
      });

      res.json(users);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      // Validar UUID
      if (!isValidUUID(id)) {
        return next(new AppError(400, 'ID inválido'));
      }

      const user = await userService.findById(id);

      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      // Validar UUID
      if (!isValidUUID(id)) {
        return next(new AppError(400, 'ID inválido'));
      }
      
      const data = updateUserSchema.parse(req.body);
      const updatedBy = req.user!.userId;

      // Garantir que vesselFinancials tenham vesselId obrigatório
      const vesselFinancials = data.vesselFinancials?.map(vf => {
        if (!vf.vesselId) {
          throw new AppError(400, 'vesselId é obrigatório em vesselFinancials');
        }
        return {
          vesselId: vf.vesselId,
          totalValue: vf.totalValue,
          downPayment: vf.downPayment,
          totalInstallments: vf.totalInstallments,
          marinaMonthlyFee: vf.marinaMonthlyFee,
          marinaDueDay: vf.marinaDueDay,
        };
      });

      const user = await userService.update(id, {
        name: data.name,
        phone: data.phone,
        isActive: data.isActive,
        status: data.status,
        vesselIds: data.vesselIds,
        vesselFinancials,
      }, updatedBy);

      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      // Validar UUID
      if (!isValidUUID(id)) {
        return next(new AppError(400, 'ID inválido'));
      }
      
      const deletedBy = req.user!.userId;

      await userService.delete(id, deletedBy);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

      await userService.changePassword(userId, currentPassword, newPassword);

      res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
      next(error);
    }
  }
}

