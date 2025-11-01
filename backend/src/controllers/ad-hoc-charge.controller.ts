import { Request, Response } from 'express';
import { z } from 'zod';
import { AdHocChargeService } from '../services/ad-hoc-charge.service';
import { logger } from '../utils/logger';

const adHocChargeService = new AdHocChargeService();

// Schema de validação para criar cobrança
const createChargeSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  dueDate: z.string().transform(str => str ? new Date(str) : undefined).optional()
}).required({ title: true, amount: true });

// Schema de validação para pagar cobrança
const payChargeSchema = z.object({
  paymentDate: z.string().min(1, 'Data de pagamento é obrigatória').transform(str => new Date(str)),
  notes: z.string().optional()
});

// Schema de validação para atualizar cobrança
const updateChargeSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  amount: z.number().min(0.01).optional(),
  dueDate: z.string().transform(str => str ? new Date(str) : undefined).optional()
});

export class AdHocChargeController {
  // Criar nova cobrança avulsa
  async createCharge(req: Request, res: Response) {
    try {
      const { userVesselId } = req.params;
      const validatedData = createChargeSchema.parse(req.body);

      const charge = await adHocChargeService.createCharge(userVesselId, {
        title: validatedData.title,
        description: validatedData.description,
        amount: validatedData.amount,
        dueDate: validatedData.dueDate,
      });

      res.json({
        success: true,
        data: charge,
        message: 'Cobrança avulsa criada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao criar cobrança avulsa:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  // Listar cobranças avulsas de um usuário/embarcação
  async getCharges(req: Request, res: Response) {
    try {
      const { userVesselId } = req.params;

      const charges = await adHocChargeService.getCharges(userVesselId);

      res.json({
        success: true,
        data: charges
      });
    } catch (error) {
      logger.error('Erro ao buscar cobranças:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Listar todas as cobranças avulsas (admin)
  async getAllCharges(req: Request, res: Response) {
    try {
      const { userId, vesselId, status } = req.query;

      const charges = await adHocChargeService.getAllCharges({
        userId: userId as string,
        vesselId: vesselId as string,
        status: status as string
      });

      res.json({
        success: true,
        data: charges
      });
    } catch (error) {
      logger.error('Erro ao buscar todas as cobranças:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Pagar cobrança avulsa
  async payCharge(req: Request, res: Response) {
    try {
      const { chargeId } = req.params;
      const validatedData = payChargeSchema.parse(req.body);

      const charge = await adHocChargeService.payCharge(chargeId, {
        paymentDate: validatedData.paymentDate,
        notes: validatedData.notes,
      });

      res.json({
        success: true,
        data: charge,
        message: 'Cobrança paga com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao pagar cobrança:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  // Cancelar cobrança avulsa
  async cancelCharge(req: Request, res: Response) {
    try {
      const { chargeId } = req.params;
      const { reason } = req.body;

      const charge = await adHocChargeService.cancelCharge(chargeId, reason);

      res.json({
        success: true,
        data: charge,
        message: 'Cobrança cancelada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao cancelar cobrança:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  // Atualizar cobrança avulsa
  async updateCharge(req: Request, res: Response) {
    try {
      const { chargeId } = req.params;
      const validatedData = updateChargeSchema.parse(req.body);

      const charge = await adHocChargeService.updateCharge(chargeId, validatedData);

      res.json({
        success: true,
        data: charge,
        message: 'Cobrança atualizada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao atualizar cobrança:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  // Deletar cobrança avulsa
  async deleteCharge(req: Request, res: Response) {
    try {
      const { chargeId } = req.params;

      await adHocChargeService.deleteCharge(chargeId);

      res.json({
        success: true,
        message: 'Cobrança deletada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao deletar cobrança:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  // Buscar histórico financeiro completo
  async getFinancialHistory(req: Request, res: Response) {
    try {
      const { userVesselId } = req.params;

      const history = await adHocChargeService.getFinancialHistory(userVesselId);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      logger.error('Erro ao buscar histórico financeiro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}


