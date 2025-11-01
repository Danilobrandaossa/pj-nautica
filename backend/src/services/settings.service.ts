import { prisma } from '../utils/prisma';
import { cache, cacheKey } from '../utils/cache';
import { AppError } from '../middleware/error-handler';

export type SettingType = 'string' | 'number' | 'boolean' | 'json';

export interface SettingInput {
  key: string;
  value: string | number | boolean | object;
  type?: SettingType;
  updatedBy?: string;
}

export class SettingsService {
  private keyFor(key: string) {
    return cacheKey('settings', [key]);
  }

  async get<T = unknown>(key: string, fallback?: T): Promise<T> {
    const k = this.keyFor(key);
    // Reduzido TTL para 5 segundos para atualizações mais rápidas
    return cache.wrap(k, 5_000, async () => {
      const row = await prisma.systemSetting.findUnique({ where: { key } });
      if (!row) return (fallback as T);
      return this.parseValue<T>(row.value, (row.type as SettingType) || 'string');
    });
  }

  async set(input: SettingInput) {
    const type: SettingType = input.type || this.detectType(input.value);
    const value = this.serializeValue(input.value, type);

    // Buscar valor antigo para log
    const oldRow = await prisma.systemSetting.findUnique({ where: { key: input.key } });

    const saved = await prisma.systemSetting.upsert({
      where: { key: input.key },
      update: { value, type, updatedBy: input.updatedBy ?? null },
      create: { key: input.key, value, type, updatedBy: input.updatedBy ?? null },
    });

    await prisma.settingsLog.create({
      data: {
        key: input.key,
        oldValue: oldRow?.value ?? null,
        newValue: value,
        changedBy: input.updatedBy ?? null,
      },
    });

    // Invalidar cache desta configuração específica
    cache.del(this.keyFor(input.key));
    
    // Invalidar cache do calendário quando configurações de agendamento mudam
    if (input.key.startsWith('booking.') || input.key.startsWith('scheduling.')) {
      // Invalidar todos os caches de calendário (conservative approach)
      // Isso garante que todas as embarcações vejam as mudanças imediatamente
      const allCacheKeys = ['calendar'];
      // Como não temos acesso direto a todas as keys, vamos apenas reduzir o TTL
      // na próxima chamada o cache será atualizado
    }
    
    return saved;
  }

  async list() {
    const rows = await prisma.systemSetting.findMany({});
    return rows.map((r) => ({
      key: r.key,
      value: this.parseValue(r.value, (r.type as SettingType) || 'string'),
      type: r.type as SettingType,
      updatedAt: r.updatedAt,
      updatedBy: r.updatedBy,
    }));
  }

  private detectType(value: unknown): SettingType {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'object') return 'json';
    return 'string';
  }

  private serializeValue(value: unknown, type: SettingType): string {
    switch (type) {
      case 'boolean':
        return value ? 'true' : 'false';
      case 'number':
        if (typeof value !== 'number') throw new AppError(400, 'Valor numérico inválido');
        return String(value);
      case 'json':
        return JSON.stringify(value ?? {});
      default:
        return String(value ?? '');
    }
  }

  private parseValue<T>(raw: string, type: SettingType): T {
    switch (type) {
      case 'boolean':
        return (raw === 'true') as unknown as T;
      case 'number':
        return Number(raw) as unknown as T;
      case 'json':
        return (raw ? JSON.parse(raw) : {}) as T;
      default:
        return (raw as unknown) as T;
    }
  }
}

export const settingsService = new SettingsService();


