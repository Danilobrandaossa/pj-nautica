import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { addMonths, startOfMonth, isAfter, isBefore, addDays, differenceInDays } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Service para gerenciar informações financeiras
 * Inclui parcelas, pagamentos da marina e cobranças avulsas
 */
export class FinancialService {
  /**
   * Atualiza informações financeiras de uma embarcação vinculada a um usuário
   * Cria automaticamente parcelas e pagamentos mensais da marina
   * Atualiza status do usuário baseado em pagamentos em atraso
   * 
   * @param userVesselId - ID da vinculação usuário-embarcação
   * @param data - Dados financeiros (totalValue, downPayment, installments, etc)
   * @returns Informações financeiras atualizadas
   */
  async updateVesselFinancials(
    userVesselId: string,
    data: {
      totalValue: number;
      downPayment: number;
      totalInstallments: number;
      marinaMonthlyFee: number;
      marinaDueDay: number;
    }
  ) {
    const userVessel = await prisma.userVessel.findUnique({
      where: { id: userVesselId },
      include: { user: true, vessel: true }
    });

    if (!userVessel) {
      throw new AppError(404, 'Vínculo usuário-embarcação não encontrado');
    }

    // Calcular saldo restante
    const remainingAmount = data.totalValue - data.downPayment;

    // Atualizar dados financeiros
    const updatedUserVessel = await prisma.userVessel.update({
      where: { id: userVesselId },
      data: {
        totalValue: data.totalValue,
        downPayment: data.downPayment,
        remainingAmount: remainingAmount,
        totalInstallments: data.totalInstallments,
        marinaMonthlyFee: data.marinaMonthlyFee,
        marinaDueDay: data.marinaDueDay,
        status: remainingAmount <= 0 ? 'PAID_OFF' : 'ACTIVE'
      }
    });

    // Se há parcelas para criar, gerar as parcelas
    if (data.totalInstallments > 0 && remainingAmount > 0) {
      await this.generateInstallments(userVesselId, remainingAmount, data.totalInstallments);
    }

    // Gerar mensalidades da marina se necessário
    if (data.marinaMonthlyFee > 0) {
      await this.generateMarinaPayments(userVesselId, data.marinaMonthlyFee, data.marinaDueDay);
    }

    return updatedUserVessel;
  }

  // Gerar parcelas automaticamente
  async generateInstallments(userVesselId: string, totalAmount: number, totalInstallments: number) {
    // Remover parcelas existentes
    await prisma.installment.deleteMany({
      where: { userVesselId }
    });

    const installmentAmount = totalAmount / totalInstallments;
    const installments = [];

    // Criar parcelas mensais
    for (let i = 1; i <= totalInstallments; i++) {
      const dueDate = addMonths(new Date(), i);
      
      installments.push({
        userVesselId,
        installmentNumber: i,
        amount: installmentAmount,
        dueDate,
        status: 'PENDING' as const
      });
    }

    await prisma.installment.createMany({
      data: installments
    });

    return installments;
  }

  // Gerar mensalidades da marina
  async generateMarinaPayments(userVesselId: string, monthlyFee: number, dueDay: number) {
    // Gerar mensalidades para os próximos 12 meses
    const payments = [];
    
    for (let i = 0; i < 12; i++) {
      const dueDate = addMonths(startOfMonth(new Date()), i + 1);
      dueDate.setDate(dueDay);
      
      payments.push({
        userVesselId,
        amount: monthlyFee,
        dueDate,
        status: 'PENDING' as const
      });
    }

    await prisma.marinaPayment.createMany({
      data: payments,
      skipDuplicates: true
    });

    return payments;
  }

  // Registrar pagamento de parcela
  async payInstallment(installmentId: string, paymentDate: Date, notes?: string) {
    const installment = await prisma.installment.findUnique({
      where: { id: installmentId },
      include: { userVessel: true }
    });

    if (!installment) {
      throw new AppError(404, 'Parcela não encontrada');
    }

    const updatedInstallment = await prisma.installment.update({
      where: { id: installmentId },
      data: {
        paymentDate,
        status: 'PAID',
        notes
      }
    });

    // Verificar se todas as parcelas foram pagas
    await this.checkVesselPaidOff(installment.userVesselId);

    return updatedInstallment;
  }

  // Registrar pagamento de mensalidade
  async payMarinaPayment(paymentId: string, paymentDate: Date, notes?: string) {
    const payment = await prisma.marinaPayment.findUnique({
      where: { id: paymentId }
    });

    if (!payment) {
      throw new AppError(404, 'Pagamento não encontrado');
    }

    return await prisma.marinaPayment.update({
      where: { id: paymentId },
      data: {
        paymentDate,
        status: 'PAID',
        notes
      }
    });
  }

  // Verificar se embarcação foi quitada
  async checkVesselPaidOff(userVesselId: string) {
    const userVessel = await prisma.userVessel.findUnique({
      where: { id: userVesselId },
      include: {
        installments: true
      }
    });

    if (!userVessel) return;

    const allPaid = userVessel.installments.every(
      installment => installment.status === 'PAID'
    );

    if (allPaid && userVessel.status !== 'PAID_OFF') {
      await prisma.userVessel.update({
        where: { id: userVesselId },
        data: {
          status: 'PAID_OFF',
          remainingAmount: 0
        }
      });

      // Atualizar status do usuário se não há outras embarcações em aberto
      await this.updateUserStatus(userVessel.userId);
    }
  }

  // Atualizar status do usuário baseado no financeiro
  async updateUserStatus(userId: string) {
    const userVessels = await prisma.userVessel.findMany({
      where: { userId },
      include: {
        installments: { where: { status: 'OVERDUE' } },
        marinaPayments: { where: { status: 'OVERDUE' } }
      }
    });

    const hasOverdueInstallments = userVessels.some(uv => uv.installments.length > 0);
    const hasOverdueMarinaPayments = userVessels.some(uv => uv.marinaPayments.length > 0);
    const hasActiveVessels = userVessels.some(uv => uv.status === 'ACTIVE' || uv.status === 'DEFAULTED');

    let newStatus: 'ACTIVE' | 'OVERDUE' | 'OVERDUE_PAYMENT' | 'BLOCKED' = 'ACTIVE';

    if (hasOverdueInstallments || hasOverdueMarinaPayments) {
      newStatus = hasOverdueInstallments ? 'OVERDUE_PAYMENT' : 'OVERDUE';
    } else if (!hasActiveVessels) {
      newStatus = 'ACTIVE';
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: newStatus }
    });
  }

  // Buscar informações financeiras de um usuário
  async getUserFinancialInfo(userId: string) {
    const userVessels = await prisma.userVessel.findMany({
      where: { userId },
      include: {
        vessel: {
          select: {
            id: true,
            name: true,
            description: true,
            capacity: true,
            location: true,
            imageUrl: true,
          },
        },
        installments: {
          orderBy: { installmentNumber: 'asc' },
          select: {
            id: true,
            installmentNumber: true,
            amount: true,
            dueDate: true,
            paymentDate: true,
            status: true,
            notes: true,
          },
        },
        marinaPayments: {
          orderBy: { dueDate: 'asc' },
          select: {
            id: true,
            amount: true,
            dueDate: true,
            paymentDate: true,
            status: true,
            notes: true,
          },
        },
        adHocCharges: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            description: true,
            amount: true,
            dueDate: true,
            paymentDate: true,
            status: true,
            notes: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            installments: true,
            marinaPayments: true,
            adHocCharges: true,
          },
        },
      },
    });

    // Otimizar contagens: buscar todas de uma vez para todos os userVessels
    const userVesselIds = userVessels.map(uv => uv.id);
    
    // Buscar todas as contagens de uma vez
    const [installmentCounts, marinaPaymentCounts, adHocChargeCounts] = await Promise.all([
      prisma.installment.groupBy({
        by: ['userVesselId', 'status'],
        where: { userVesselId: { in: userVesselIds } },
        _count: true,
      }),
      prisma.marinaPayment.groupBy({
        by: ['userVesselId', 'status'],
        where: { userVesselId: { in: userVesselIds } },
        _count: true,
      }),
      prisma.adHocCharge.groupBy({
        by: ['userVesselId', 'status'],
        where: { userVesselId: { in: userVesselIds } },
        _count: true,
      }),
    ]);

    // Criar mapas para acesso rápido
    const installmentMap = new Map<string, Map<string, number>>();
    installmentCounts.forEach(item => {
      if (!installmentMap.has(item.userVesselId)) {
        installmentMap.set(item.userVesselId, new Map());
      }
      installmentMap.get(item.userVesselId)!.set(item.status, item._count);
    });

    const marinaPaymentMap = new Map<string, Map<string, number>>();
    marinaPaymentCounts.forEach(item => {
      if (!marinaPaymentMap.has(item.userVesselId)) {
        marinaPaymentMap.set(item.userVesselId, new Map());
      }
      marinaPaymentMap.get(item.userVesselId)!.set(item.status, item._count);
    });

    const adHocChargeMap = new Map<string, Map<string, number>>();
    adHocChargeCounts.forEach(item => {
      if (!adHocChargeMap.has(item.userVesselId)) {
        adHocChargeMap.set(item.userVesselId, new Map());
      }
      adHocChargeMap.get(item.userVesselId)!.set(item.status, item._count);
    });

    // Mapear resultados
    return userVessels.map((uv) => {
      const installments = installmentMap.get(uv.id) || new Map();
      const marinaPayments = marinaPaymentMap.get(uv.id) || new Map();
      const adHocCharges = adHocChargeMap.get(uv.id) || new Map();

      return {
        id: uv.id,
        vessel: uv.vessel,
        status: uv.status,
        totalValue: uv.totalValue,
        downPayment: uv.downPayment,
        remainingAmount: uv.remainingAmount,
        totalInstallments: uv.totalInstallments,
        marinaMonthlyFee: uv.marinaMonthlyFee,
        marinaDueDay: uv.marinaDueDay,
        installments: uv.installments,
        marinaPayments: uv.marinaPayments,
        adHocCharges: uv.adHocCharges,
        paidInstallments: installments.get('PAID') || 0,
        pendingInstallments: installments.get('PENDING') || 0,
        overdueInstallments: installments.get('OVERDUE') || 0,
        paidMarinaPayments: marinaPayments.get('PAID') || 0,
        pendingMarinaPayments: marinaPayments.get('PENDING') || 0,
        overdueMarinaPayments: marinaPayments.get('OVERDUE') || 0,
        paidAdHocCharges: adHocCharges.get('PAID') || 0,
        pendingAdHocCharges: adHocCharges.get('PENDING') || 0,
      };
    });
  }

  // Buscar relatório financeiro geral (admin)
  async getFinancialReport() {
    const userVessels = await prisma.userVessel.findMany({
      include: {
        user: true,
        vessel: true,
        installments: true,
        marinaPayments: true
      }
    });

    const totalUsers = await prisma.user.count({ where: { role: 'USER' } });
    const activeVessels = userVessels.filter(uv => uv.status === 'ACTIVE').length;
    const paidOffVessels = userVessels.filter(uv => uv.status === 'PAID_OFF').length;
    const defaultedVessels = userVessels.filter(uv => uv.status === 'DEFAULTED').length;

    const totalRevenue = userVessels.reduce((sum, uv) => {
      const installmentRevenue = uv.installments
        .filter(i => i.status === 'PAID')
        .reduce((s, i) => s + i.amount, 0);
      
      const marinaRevenue = uv.marinaPayments
        .filter(p => p.status === 'PAID')
        .reduce((s, p) => s + p.amount, 0);
      
      return sum + installmentRevenue + marinaRevenue;
    }, 0);

    const pendingRevenue = userVessels.reduce((sum, uv) => {
      const pendingInstallments = uv.installments
        .filter(i => i.status === 'PENDING')
        .reduce((s, i) => s + i.amount, 0);
      
      const pendingMarina = uv.marinaPayments
        .filter(p => p.status === 'PENDING')
        .reduce((s, p) => s + p.amount, 0);
      
      return sum + pendingInstallments + pendingMarina;
    }, 0);

    const overdueAmount = userVessels.reduce((sum, uv) => {
      const overdueInstallments = uv.installments
        .filter(i => i.status === 'OVERDUE')
        .reduce((s, i) => s + i.amount, 0);
      
      const overdueMarina = uv.marinaPayments
        .filter(p => p.status === 'OVERDUE')
        .reduce((s, p) => s + p.amount, 0);
      
      return sum + overdueInstallments + overdueMarina;
    }, 0);

    return {
      totalUsers,
      activeVessels,
      paidOffVessels,
      defaultedVessels,
      totalRevenue,
      pendingRevenue,
      overdueAmount,
      userVessels: userVessels.map(uv => ({
        id: uv.id,
        user: { id: uv.user.id, name: uv.user.name, email: uv.user.email },
        vessel: { id: uv.vessel.id, name: uv.vessel.name },
        status: uv.status,
        totalValue: uv.totalValue,
        remainingAmount: uv.remainingAmount,
        installments: uv.installments.length,
        paidInstallments: uv.installments.filter(i => i.status === 'PAID').length,
        overdueInstallments: uv.installments.filter(i => i.status === 'OVERDUE').length,
        marinaPayments: uv.marinaPayments.length,
        paidMarinaPayments: uv.marinaPayments.filter(p => p.status === 'PAID').length,
        overdueMarinaPayments: uv.marinaPayments.filter(p => p.status === 'OVERDUE').length
      }))
    };
  }

  // Verificar vencimentos e atualizar status automaticamente
  async checkOverduePayments() {
    const now = new Date();
    
    // Atualizar parcelas em atraso
    await prisma.installment.updateMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: now }
      },
      data: { status: 'OVERDUE' }
    });

    // Atualizar mensalidades em atraso
    await prisma.marinaPayment.updateMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: now }
      },
      data: { status: 'OVERDUE' }
    });

    // Atualizar status das embarcações
    const overdueVessels = await prisma.userVessel.findMany({
      where: {
        OR: [
          {
            installments: {
              some: { status: 'OVERDUE' }
            }
          },
          {
            marinaPayments: {
              some: { status: 'OVERDUE' }
            }
          }
        ]
      }
    });

    for (const vessel of overdueVessels) {
      await prisma.userVessel.update({
        where: { id: vessel.id },
        data: { status: 'DEFAULTED' }
      });

      await this.updateUserStatus(vessel.userId);
    }
  }

  // Registrar pagamento direto (nova funcionalidade)
  async registerPayment(userVesselId: string, data: {
    amount: number;
    paymentDate: Date;
    notes?: string;
    type: 'installment' | 'marina';
  }) {
    const userVessel = await prisma.userVessel.findUnique({
      where: { id: userVesselId },
      include: {
        vessel: true,
        user: true,
        installments: { where: { status: 'PENDING' }, orderBy: { installmentNumber: 'asc' } },
        marinaPayments: { where: { status: 'PENDING' }, orderBy: { dueDate: 'asc' } }
      }
    });

    if (!userVessel) {
      throw new AppError(404, 'Vínculo usuário-embarcação não encontrado');
    }

    if (data.type === 'installment') {
      // Encontrar a próxima parcela pendente
      let nextInstallment = userVessel.installments[0];
      
      // Se não há parcelas pendentes, criar uma nova
      if (!nextInstallment) {
        if (userVessel.totalInstallments <= 0 || userVessel.remainingAmount <= 0) {
          throw new AppError(400, 'Não há parcelas para registrar pagamento. Configure os dados financeiros primeiro.');
        }
        
        // Verificar qual é o próximo número de parcela disponível
        const existingInstallments = await prisma.installment.findMany({
          where: { userVesselId },
          orderBy: { installmentNumber: 'desc' }
        });
        
        const nextInstallmentNumber = existingInstallments.length > 0 
          ? existingInstallments[0].installmentNumber + 1 
          : 1;
        
        // Criar uma nova parcela
        const installmentAmount = userVessel.remainingAmount / userVessel.totalInstallments;
        nextInstallment = await prisma.installment.create({
          data: {
            userVesselId,
            installmentNumber: nextInstallmentNumber,
            amount: installmentAmount,
            dueDate: new Date(),
            status: 'PENDING'
          }
        });
      }

      // Registrar pagamento da parcela
      const updatedInstallment = await prisma.installment.update({
        where: { id: nextInstallment.id },
        data: {
          status: 'PAID',
          paymentDate: data.paymentDate,
          notes: data.notes
        }
      });

      // Atualizar saldo restante
      const newRemainingAmount = userVessel.remainingAmount - data.amount;
      await prisma.userVessel.update({
        where: { id: userVesselId },
        data: {
          remainingAmount: Math.max(0, newRemainingAmount),
          status: newRemainingAmount <= 0 ? 'PAID_OFF' : userVessel.status
        }
      });

      return updatedInstallment;
    } else if (data.type === 'marina') {
      // Encontrar a próxima mensalidade da marina pendente
      const nextMarinaPayment = userVessel.marinaPayments[0];
      if (!nextMarinaPayment) {
        // Criar nova mensalidade se não houver
        const nextMonth = new Date(data.paymentDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(userVessel.marinaDueDay);

        const newMarinaPayment = await prisma.marinaPayment.create({
          data: {
            userVesselId,
            amount: userVessel.marinaMonthlyFee,
            dueDate: nextMonth,
            status: 'PAID',
            paymentDate: data.paymentDate,
            notes: data.notes
          }
        });

        return newMarinaPayment;
      }

      // Registrar pagamento da mensalidade
      const updatedMarinaPayment = await prisma.marinaPayment.update({
        where: { id: nextMarinaPayment.id },
        data: {
          status: 'PAID',
          paymentDate: data.paymentDate,
          notes: data.notes
        }
      });

      return updatedMarinaPayment;
    }

    throw new AppError(400, 'Tipo de pagamento inválido');
  }

  // Buscar todos os pagamentos pendentes organizados por prioridade
  async getPaymentsByPriority() {
    const today = new Date();
    const threeDaysFromNow = addDays(today, 3);
    const sevenDaysFromNow = addDays(today, 7);

    // Buscar todas as parcelas pendentes
    const installments = await prisma.installment.findMany({
      where: {
        status: { in: ['PENDING', 'OVERDUE'] }
      },
      include: {
        userVessel: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                status: true
              }
            },
            vessel: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    // Buscar todas as mensalidades da marina pendentes
    const marinaPayments = await prisma.marinaPayment.findMany({
      where: {
        status: { in: ['PENDING', 'OVERDUE'] }
      },
      include: {
        userVessel: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                status: true
              }
            },
            vessel: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    // Buscar cobranças avulsas pendentes
    const adHocCharges = await prisma.adHocCharge.findMany({
      where: {
        status: { in: ['PENDING', 'OVERDUE'] }
      },
      include: {
        userVessel: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                status: true
              }
            },
            vessel: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    // Transformar e categorizar os pagamentos
    const allPayments = [
      ...installments.map(inst => ({
        id: inst.id,
        type: 'installment' as const,
        userVesselId: inst.userVesselId,
        userName: inst.userVessel.user.name,
        userEmail: inst.userVessel.user.email,
        userStatus: inst.userVessel.user.status,
        vesselName: inst.userVessel.vessel.name,
        amount: inst.amount,
        dueDate: inst.dueDate,
        status: inst.status,
        description: `Parcela ${inst.installmentNumber}/${inst.userVessel.totalInstallments || '?'}`,
        installmentNumber: inst.installmentNumber,
        totalInstallments: inst.userVessel.totalInstallments
      })),
      ...marinaPayments.map(marina => ({
        id: marina.id,
        type: 'marina' as const,
        userVesselId: marina.userVesselId,
        userName: marina.userVessel.user.name,
        userEmail: marina.userVessel.user.email,
        userStatus: marina.userVessel.user.status,
        vesselName: marina.userVessel.vessel.name,
        amount: marina.amount,
        dueDate: marina.dueDate,
        status: marina.status,
        description: `Marina ${(marina as any).referenceMonth}`,
        referenceMonth: (marina as any).referenceMonth
      })),
      ...adHocCharges.map(charge => ({
        id: charge.id,
        type: 'adhoc' as const,
        userVesselId: charge.userVesselId,
        userName: charge.userVessel.user.name,
        userEmail: charge.userVessel.user.email,
        userStatus: charge.userVessel.user.status,
        vesselName: charge.userVessel.vessel.name,
        amount: charge.amount,
        dueDate: charge.dueDate || today,
        status: charge.status,
        description: charge.description,
        chargeType: (charge as any).chargeType
      }))
    ];

    // Categorizar por prioridade
    const overdue = allPayments.filter(p => p.status === 'OVERDUE' || (p.dueDate && isBefore(p.dueDate, today)));
    const dueToday = allPayments.filter(p => p.status !== 'OVERDUE' && p.dueDate && 
      differenceInDays(p.dueDate, today) === 0);
    const dueIn3Days = allPayments.filter(p => p.status !== 'OVERDUE' && p.dueDate && 
      isAfter(p.dueDate, today) && 
      isBefore(p.dueDate, threeDaysFromNow));
    const dueIn7Days = allPayments.filter(p => p.status !== 'OVERDUE' && p.dueDate && 
      isAfter(p.dueDate, threeDaysFromNow) && 
      isBefore(p.dueDate, sevenDaysFromNow));
    const dueLater = allPayments.filter(p => p.status !== 'OVERDUE' && p.dueDate && 
      isAfter(p.dueDate, sevenDaysFromNow));

    return {
      overdue: overdue.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()),
      dueToday: dueToday.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()),
      dueIn3Days: dueIn3Days.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()),
      dueIn7Days: dueIn7Days.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()),
      dueLater: dueLater.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()),
      summary: {
        total: allPayments.length,
        totalAmount: allPayments.reduce((sum, p) => sum + p.amount, 0),
        overdueCount: overdue.length,
        overdueAmount: overdue.reduce((sum, p) => sum + p.amount, 0),
        dueTodayCount: dueToday.length,
        dueTodayAmount: dueToday.reduce((sum, p) => sum + p.amount, 0)
      }
    };
  }

  // Registrar pagamento rápido (ação rápida)
  async quickPayment(paymentId: string, paymentType: 'installment' | 'marina' | 'adhoc') {
    const today = new Date();

    if (paymentType === 'installment') {
      const installment = await prisma.installment.findUnique({
        where: { id: paymentId }
      });

      if (!installment) {
        throw new AppError(404, 'Parcela não encontrada');
      }

      if (installment.status === 'PAID') {
        throw new AppError(400, 'Esta parcela já foi paga');
      }

      return await prisma.installment.update({
        where: { id: paymentId },
        data: {
          status: 'PAID',
          paymentDate: today
        }
      });
    }

    if (paymentType === 'marina') {
      const marinaPayment = await prisma.marinaPayment.findUnique({
        where: { id: paymentId }
      });

      if (!marinaPayment) {
        throw new AppError(404, 'Mensalidade da marina não encontrada');
      }

      if (marinaPayment.status === 'PAID') {
        throw new AppError(400, 'Esta mensalidade já foi paga');
      }

      return await prisma.marinaPayment.update({
        where: { id: paymentId },
        data: {
          status: 'PAID',
          paymentDate: today
        }
      });
    }

    if (paymentType === 'adhoc') {
      const adHocCharge = await prisma.adHocCharge.findUnique({
        where: { id: paymentId }
      });

      if (!adHocCharge) {
        throw new AppError(404, 'Cobrança avulsa não encontrada');
      }

      if (adHocCharge.status === 'PAID') {
        throw new AppError(400, 'Esta cobrança já foi paga');
      }

      return await prisma.adHocCharge.update({
        where: { id: paymentId },
        data: {
          status: 'PAID',
          paymentDate: today
        }
      });
    }

    throw new AppError(400, 'Tipo de pagamento inválido');
  }
}
