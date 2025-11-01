import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  DollarSign, 
  AlertTriangle, 
  Clock, 
  Calendar,
  CheckCircle,
  TrendingUp,
  Users,
  Ship
} from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function FinancialPriorityPage() {
  const queryClient = useQueryClient();

  // Buscar pagamentos por prioridade
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['payments-by-priority'],
    queryFn: async () => {
      const { data } = await api.get('/financial/payments-by-priority');
      return data.data;
    },
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  });

  // Mutation para pagamento rápido
  const quickPaymentMutation = useMutation({
    mutationFn: async ({ paymentId, paymentType }: { paymentId: string; paymentType: string }) => {
      const { data } = await api.post(`/financial/quick-payment/${paymentId}`, { paymentType });
      return data;
    },
    onSuccess: () => {
      toast.success('✅ Pagamento registrado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['payments-by-priority'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao registrar pagamento');
    }
  });

  const handleQuickPayment = (paymentId: string, paymentType: string, description: string) => {
    if (window.confirm(`Confirmar pagamento de: ${description}?`)) {
      quickPaymentMutation.mutate({ paymentId, paymentType });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  const { overdue, dueToday, dueIn3Days, dueIn7Days, dueLater, summary } = paymentsData || {};

  // Componente de item de pagamento
  const PaymentItem = ({ payment, urgency }: { payment: any; urgency: 'overdue' | 'today' | '3days' | '7days' | 'later' }) => {
    const getUrgencyColor = () => {
      switch (urgency) {
        case 'overdue':
          return 'bg-red-50 border-red-200';
        case 'today':
          return 'bg-orange-50 border-orange-200';
        case '3days':
          return 'bg-yellow-50 border-yellow-200';
        case '7days':
          return 'bg-blue-50 border-blue-200';
        default:
          return 'bg-gray-50 border-gray-200';
      }
    };

    const getUrgencyIcon = () => {
      switch (urgency) {
        case 'overdue':
          return <AlertTriangle className="w-5 h-5 text-red-600" />;
        case 'today':
          return <Clock className="w-5 h-5 text-orange-600" />;
        case '3days':
          return <Calendar className="w-5 h-5 text-yellow-600" />;
        default:
          return <Calendar className="w-5 h-5 text-gray-600" />;
      }
    };

    const getStatusBadge = () => {
      if (payment.userStatus === 'OVERDUE' || payment.userStatus === 'OVERDUE_PAYMENT') {
        return <span className="badge badge-error badge-sm">Cliente em Atraso</span>;
      }
      if (payment.userStatus === 'BLOCKED') {
        return <span className="badge badge-error badge-sm">Bloqueado</span>;
      }
      return null;
    };

    return (
      <div className={`card p-4 ${getUrgencyColor()} border transition-all hover:shadow-md`}>
        <div className="flex items-center justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="mt-1">{getUrgencyIcon()}</div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-900">{payment.userName}</h3>
                {getStatusBadge()}
              </div>
              
              <p className="text-sm text-gray-600">
                <Ship className="w-4 h-4 inline mr-1" />
                {payment.vesselName}
              </p>
              
              <p className="text-sm text-gray-700 mt-1">
                {payment.description}
              </p>
              
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span>
                  📅 Vencimento: {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                </span>
                <span>
                  💰 R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => handleQuickPayment(payment.id, payment.type, payment.description)}
            disabled={quickPaymentMutation.isPending}
            className="btn btn-success btn-sm ml-4"
          >
            {quickPaymentMutation.isPending ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-1" />
                Confirmar
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <DollarSign className="w-8 h-8 mr-3 text-primary-600" />
            Painel Financeiro Simplificado
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie pagamentos por ordem de prioridade
          </p>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-red-50 border-red-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Em Atraso</p>
              <p className="text-2xl font-bold text-red-900">{overdue?.length || 0}</p>
              <p className="text-xs text-red-600">
                R$ {(summary?.overdueAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="card bg-orange-50 border-orange-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">Vence Hoje</p>
              <p className="text-2xl font-bold text-orange-900">{dueToday?.length || 0}</p>
              <p className="text-xs text-orange-600">
                R$ {(summary?.dueTodayAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="card bg-yellow-50 border-yellow-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-medium">Próximos 3 Dias</p>
              <p className="text-2xl font-bold text-yellow-900">{dueIn3Days?.length || 0}</p>
            </div>
            <Calendar className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="card bg-green-50 border-green-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Total Pendente</p>
              <p className="text-2xl font-bold text-green-900">{summary?.total || 0}</p>
              <p className="text-xs text-green-600">
                R$ {(summary?.totalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Em Atraso */}
      {overdue && overdue.length > 0 && (
        <div>
          <div className="flex items-center mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <h2 className="text-xl font-bold text-red-900">🔴 EM ATRASO ({overdue.length})</h2>
            </div>
          </div>
          <div className="space-y-3">
            {overdue.map((payment: any) => (
              <PaymentItem key={payment.id} payment={payment} urgency="overdue" />
            ))}
          </div>
        </div>
      )}

      {/* Vence Hoje */}
      {dueToday && dueToday.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-orange-900 mb-4">🟠 VENCE HOJE ({dueToday.length})</h2>
          <div className="space-y-3">
            {dueToday.map((payment: any) => (
              <PaymentItem key={payment.id} payment={payment} urgency="today" />
            ))}
          </div>
        </div>
      )}

      {/* Vence em 3 Dias */}
      {dueIn3Days && dueIn3Days.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-yellow-900 mb-4">🟡 VENCE EM 3 DIAS ({dueIn3Days.length})</h2>
          <div className="space-y-3">
            {dueIn3Days.map((payment: any) => (
              <PaymentItem key={payment.id} payment={payment} urgency="3days" />
            ))}
          </div>
        </div>
      )}

      {/* Vence em 7 Dias */}
      {dueIn7Days && dueIn7Days.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-blue-900 mb-4">🔵 VENCE EM 7 DIAS ({dueIn7Days.length})</h2>
          <div className="space-y-3">
            {dueIn7Days.map((payment: any) => (
              <PaymentItem key={payment.id} payment={payment} urgency="7days" />
            ))}
          </div>
        </div>
      )}

      {/* Vence Depois */}
      {dueLater && dueLater.length > 0 && (
        <div>
          <details className="collapse collapse-arrow bg-base-200">
            <summary className="collapse-title text-lg font-bold text-gray-900">
              ⚪ VENCE EM 7+ DIAS ({dueLater.length})
            </summary>
            <div className="collapse-content space-y-3 pt-3">
              {dueLater.map((payment: any) => (
                <PaymentItem key={payment.id} payment={payment} urgency="later" />
              ))}
            </div>
          </details>
        </div>
      )}

      {/* Mensagem se não há pagamentos pendentes */}
      {summary?.total === 0 && (
        <div className="card bg-green-50 border-green-200 p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-900 mb-2">
            Tudo em Dia! 🎉
          </h3>
          <p className="text-green-700">
            Não há pagamentos pendentes no momento.
          </p>
        </div>
      )}
    </div>
  );
}