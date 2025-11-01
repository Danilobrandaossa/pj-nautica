import { Request, Response } from 'express';
import { z } from 'zod';
import { WeeklyBlockService } from '../services/weekly-block.service';
import { logger } from '../utils/logger';

const weeklyBlockService = new WeeklyBlockService();

// Schema de validação para criar bloqueio semanal
const createWeeklyBlockSchema = z.object({
  dayOfWeek: z.number().min(0).max(6, 'Dia da semana deve ser entre 0 (Domingo) e 6 (Sábado)'),
  reason: z.string().min(1, 'Motivo é obrigatório'),
  notes: z.string().optional()
});

// Schema de validação para atualizar bloqueio semanal
const updateWeeklyBlockSchema = z.object({
  reason: z.string().min(1).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional()
});

export class WeeklyBlockController {
  // Criar novo bloqueio semanal
  async createWeeklyBlock(req: Request, res: Response) {
    try {
      const validatedData = createWeeklyBlockSchema.parse(req.body);

      if (validatedData.dayOfWeek === undefined || !validatedData.reason) {
        return res.status(400).json({
          success: false,
          message: 'Dia da semana e motivo são obrigatórios'
        });
      }

      const weeklyBlock = await weeklyBlockService.createWeeklyBlock({
        dayOfWeek: validatedData.dayOfWeek,
        reason: validatedData.reason,
        notes: validatedData.notes,
      });

      return res.status(201).json({
        success: true,
        data: weeklyBlock,
        message: 'Bloqueio semanal criado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao criar bloqueio semanal:', error);
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  // Listar todos os bloqueios semanais
  async getAllWeeklyBlocks(_req: Request, res: Response) {
    try {
      const weeklyBlocks = await weeklyBlockService.getAllWeeklyBlocks();

      res.json({
        success: true,
        data: weeklyBlocks
      });
    } catch (error) {
      logger.error('Erro ao buscar bloqueios semanais:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Listar bloqueios semanais ativos
  async getActiveWeeklyBlocks(_req: Request, res: Response) {
    try {
      const weeklyBlocks = await weeklyBlockService.getActiveWeeklyBlocks();

      res.json({
        success: true,
        data: weeklyBlocks
      });
    } catch (error) {
      logger.error('Erro ao buscar bloqueios semanais ativos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Atualizar bloqueio semanal
  async updateWeeklyBlock(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateWeeklyBlockSchema.parse(req.body);

      const weeklyBlock = await weeklyBlockService.updateWeeklyBlock(id, validatedData);

      res.json({
        success: true,
        data: weeklyBlock,
        message: 'Bloqueio semanal atualizado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao atualizar bloqueio semanal:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  // Deletar bloqueio semanal
  async deleteWeeklyBlock(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await weeklyBlockService.deleteWeeklyBlock(id);

      res.json({
        success: true,
        message: 'Bloqueio semanal deletado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao deletar bloqueio semanal:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  // Obter estatísticas dos bloqueios semanais
  async getWeeklyBlockStats(_req: Request, res: Response) {
    try {
      const stats = await weeklyBlockService.getWeeklyBlockStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Erro ao buscar estatísticas dos bloqueios semanais:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}


