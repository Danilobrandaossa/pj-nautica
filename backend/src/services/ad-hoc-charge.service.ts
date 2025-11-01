import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error-handler';

const prisma = new PrismaClient();

export class AdHocChargeService {
  // Criar nova cobrança avulsa
  async createCharge(userVesselId: string, data: {
    title: string;
    description?: string;
    amount: number;
    dueDate?: Date;
  }) {
    const userVessel = await prisma.userVessel.findUnique({
      where: { id: userVesselId },
      include: { user: true, vessel: true }
    });

    if (!userVessel) {
      throw new AppError(404, 'Vínculo usuário-embarcação não encontrado');
    }

    const charge = await prisma.adHocCharge.create({
      data: {
        userVesselId,
        title: data.title,
        description: data.description,
        amount: data.amount,
        dueDate: data.dueDate,
        status: 'PENDING'
      },
      include: {
        userVessel: {
          include: {
            user: true,
            vessel: true
          }
        }
      }
    });

    return charge;
  }

  // Listar cobranças avulsas de um usuário/embarcação
  async getCharges(userVesselId: string) {
    return prisma.adHocCharge.findMany({
      where: { userVesselId },
      orderBy: { createdAt: 'desc' },
      include: {
        userVessel: {
          include: {
            user: true,
            vessel: true
          }
        }
      }
    });
  }

  // Listar todas as cobranças avulsas (admin)
  async getAllCharges(filters?: {
    userId?: string;
    vesselId?: string;
    status?: string;
  }) {
    const where: any = {};
    
    if (filters?.userId) {
      where.userVessel = { userId: filters.userId };
    }
    
    if (filters?.vesselId) {
      where.userVessel = { ...where.userVessel, vesselId: filters.vesselId };
    }
    
    if (filters?.status) {
      where.status = filters.status;
    }

    return prisma.adHocCharge.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        userVessel: {
          include: {
            user: true,
            vessel: true
          }
        }
      }
    });
  }

  // Pagar cobrança avulsa
  async payCharge(chargeId: string, data: {
    paymentDate: Date;
    notes?: string;
  }) {
    const charge = await prisma.adHocCharge.findUnique({
      where: { id: chargeId },
      include: {
        userVessel: {
          include: {
            user: true,
            vessel: true
          }
        }
      }
    });

    if (!charge) {
      throw new AppError(404, 'Cobrança não encontrada');
    }

    if (charge.status === 'PAID') {
      throw new AppError(400, 'Esta cobrança já foi paga');
    }

    const updatedCharge = await prisma.adHocCharge.update({
      where: { id: chargeId },
      data: {
        status: 'PAID',
        paymentDate: data.paymentDate,
        notes: data.notes
      },
      include: {
        userVessel: {
          include: {
            user: true,
            vessel: true
          }
        }
      }
    });

    return updatedCharge;
  }

  // Cancelar cobrança avulsa
  async cancelCharge(chargeId: string, reason?: string) {
    const charge = await prisma.adHocCharge.findUnique({
      where: { id: chargeId }
    });

    if (!charge) {
      throw new AppError(404, 'Cobrança não encontrada');
    }

    if (charge.status === 'PAID') {
      throw new AppError(400, 'Não é possível cancelar uma cobrança já paga');
    }

    return prisma.adHocCharge.update({
      where: { id: chargeId },
      data: {
        status: 'CANCELLED',
        notes: reason ? `Cancelada: ${reason}` : 'Cobrança cancelada'
      }
    });
  }

  // Atualizar cobrança avulsa
  async updateCharge(chargeId: string, data: {
    title?: string;
    description?: string;
    amount?: number;
    dueDate?: Date;
  }) {
    const charge = await prisma.adHocCharge.findUnique({
      where: { id: chargeId }
    });

    if (!charge) {
      throw new AppError(404, 'Cobrança não encontrada');
    }

    if (charge.status === 'PAID') {
      throw new AppError(400, 'Não é possível editar uma cobrança já paga');
    }

    return prisma.adHocCharge.update({
      where: { id: chargeId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        userVessel: {
          include: {
            user: true,
            vessel: true
          }
        }
      }
    });
  }

  // Deletar cobrança avulsa
  async deleteCharge(chargeId: string) {
    const charge = await prisma.adHocCharge.findUnique({
      where: { id: chargeId }
    });

    if (!charge) {
      throw new AppError(404, 'Cobrança não encontrada');
    }

    if (charge.status === 'PAID') {
      throw new AppError(400, 'Não é possível deletar uma cobrança já paga');
    }

    return prisma.adHocCharge.delete({
      where: { id: chargeId }
    });
  }

  // Buscar histórico financeiro completo de um usuário
  async getFinancialHistory(userVesselId: string) {
    const [installments, marinaPayments, adHocCharges] = await Promise.all([
      prisma.installment.findMany({
        where: { userVesselId },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.marinaPayment.findMany({
        where: { userVesselId },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.adHocCharge.findMany({
        where: { userVesselId },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Combinar todos os pagamentos em um histórico unificado
    const history = [
      ...installments.map(i => ({
        id: i.id,
        type: 'installment' as const,
        title: `Parcela ${i.installmentNumber}`,
        description: `Parcela da embarcação`,
        amount: i.amount,
        status: i.status,
        dueDate: i.dueDate,
        paymentDate: i.paymentDate,
        notes: i.notes,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt
      })),
      ...marinaPayments.map(m => ({
        id: m.id,
        type: 'marina' as const,
        title: 'Taxa da Marina',
        description: `Taxa mensal da marina`,
        amount: m.amount,
        status: m.status,
        dueDate: m.dueDate,
        paymentDate: m.paymentDate,
        notes: m.notes,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt
      })),
      ...adHocCharges.map(a => ({
        id: a.id,
        type: 'ad_hoc' as const,
        title: a.title,
        description: a.description,
        amount: a.amount,
        status: a.status,
        dueDate: a.dueDate,
        paymentDate: a.paymentDate,
        notes: a.notes,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return history;
  }
}


