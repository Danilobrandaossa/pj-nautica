import { Request, Response, NextFunction } from 'express';
import { settingsService } from '../services/settings.service';

export class SettingsController {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingsService.list();
      res.json({ settings });
    } catch (error) {
      next(error);
    }
  }

  async upsert(req: Request, res: Response, next: NextFunction) {
    try {
      const { key, value, type } = req.body as { key: string; value: unknown; type?: string };
      const userId = req.user?.userId;
      const saved = await settingsService.set({ key, value: value as any, type: type as any, updatedBy: userId });
      res.json({ success: true, setting: saved });
    } catch (error) {
      next(error);
    }
  }
}

export default new SettingsController();





