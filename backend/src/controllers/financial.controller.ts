import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { FinancialService } from '../services/financial.service';
import { AppError } from '../middleware/error-handler';

const financialService = new FinancialService();

// Schema de validação para atualizar dados financeiros
const updateFinancialsSchema = z.object({
  totalValue: z.number().min(0, 'Valor total deve ser positivo'),
  downPayment: z.number().min(0, 'Valor de entrada deve ser positivo'),
  totalInstallments: z.number().min(0, 'Quantidade de parcelas deve ser positiva'),
  marinaMonthlyFee: z.number().min(0, 'Taxa mensal deve ser positiva'),
  marinaDueDay: z.number().min(1).max(31, 'Dia de vencimento deve ser entre 1 e 31')
});

// Schema para registrar pagamento
const paymentSchema = z.object({
  paymentDate: z.string().transform(str => new Date(str)),
  notes: z.string().optional()
});

export class FinancialController {
  // Atualizar informações financeiras de uma embarcação
  async updateVesselFinancials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userVesselId } = req.params;
      const validatedData = updateFinancialsSchema.parse(req.body);

      const result = await financialService.updateVesselFinancials(
        userVesselId,
        validatedData
      );

      res.json({
        success: true,
        data: result,
        message: 'Informações financeiras atualizadas com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  // Buscar informações financeiras de um usuário
  async getUserFinancialInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      
      const financialInfo = await financialService.getUserFinancialInfo(userId);

      res.json({
        success: true,
        data: financialInfo
      });
    } catch (error) {
      next(error);
    }
  }

  // Buscar informações financeiras do usuário logado
  async getMyFinancialInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return next(new AppError(401, 'Usuário não autenticado'));
      }

      const financialInfo = await financialService.getUserFinancialInfo(userId);

      res.json({
        success: true,
        data: financialInfo
      });
    } catch (error) {
      next(error);
    }
  }

  // Buscar relatório financeiro geral (admin)
  async getFinancialReport(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await financialService.getFinancialReport();

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }

  // Registrar pagamento de parcela
  async payInstallment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { installmentId } = req.params;
      const validatedData = paymentSchema.parse(req.body);

      const result = await financialService.payInstallment(
        installmentId,
        validatedData.paymentDate,
        validatedData.notes
      );

      res.json({
        success: true,
        data: result,
        message: 'Pagamento registrado com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  // Registrar pagamento de mensalidade
  async payMarinaPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { paymentId } = req.params;
      const validatedData = paymentSchema.parse(req.body);

      const result = await financialService.payMarinaPayment(
        paymentId,
        validatedData.paymentDate,
        validatedData.notes
      );

      res.json({
        success: true,
        data: result,
        message: 'Pagamento registrado com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  // Verificar vencimentos e atualizar status (endpoint para cron)
  async checkOverduePayments(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await financialService.checkOverduePayments();

      res.json({
        success: true,
        message: 'Verificação de vencimentos concluída'
      });
    } catch (error) {
      next(error);
    }
  }

  // Registrar pagamento direto (nova funcionalidade)
  async registerPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userVesselId, amount, paymentDate, notes, type } = req.body;

      const result = await financialService.registerPayment(userVesselId, {
        amount: parseFloat(amount),
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        notes,
        type
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Buscar pagamentos por prioridade
  async getPaymentsByPriority(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payments = await financialService.getPaymentsByPriority();

      res.json({
        success: true,
        data: payments
      });
    } catch (error) {
      next(error);
    }
  }

  // Registrar pagamento rápido
  async quickPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { paymentId } = req.params;
      const { paymentType } = req.body;

      if (!['installment', 'marina', 'adhoc'].includes(paymentType)) {
        return next(new AppError(400, 'Tipo de pagamento inválido'));
      }

      const result = await financialService.quickPayment(paymentId, paymentType);

      res.json({
        success: true,
        data: result,
        message: 'Pagamento registrado com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
}
