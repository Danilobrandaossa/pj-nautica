import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  DollarSign, 
  AlertTriangle, 
  Clock, 
  Calendar,
  CheckCircle,
  TrendingUp,
  Users,
  Ship,
  TrendingDown,
  Zap
} from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

type TabType = 'priority' | 'control';

export default function FinancialManagementPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('priority');

  // ==========================================
  // DADOS PARA PAINEL POR PRIORIDADE
  // ==========================================
  const { data: paymentsData, isLoading: isLoadingPriority } = useQuery({
    queryKey: ['payments-by-priority'],
    queryFn: async () => {
      const { data } = await api.get('/financial/payments-by-priority');
      return data.data;
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    enabled: activeTab === 'priority' // Só carrega quando a tab está ativa
  });

  // ==========================================
  // DADOS PARA CONTROLE FINANCEIRO
  // ==========================================
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
    enabled: activeTab === 'control' // Só carrega quando a tab está ativa
  });

  const { data: vessels, isLoading: vesselsLoading } = useQuery({
    queryKey: ['vessels'],
    queryFn: async () => {
      const { data } = await api.get('/vessels');
      return data;
    },
    enabled: activeTab === 'control' // Só carrega quando a tab está ativa
  });

  // ==========================================
  // STATES PARA MODAIS E CONTROLES
  // ==========================================
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'installment' | 'marina'>('installment');

  // ==========================================
  // MUTATIONS
  // ==========================================
  const quickPaymentMutation = useMutation({
    mutationFn: async ({ paymentId, paymentType }: { paymentId: string; paymentType: string }) => {
      const { data } = await api.post(`/financial/quick-payment/${paymentId}`, { paymentType });
      return data;
    },
    onSuccess: () => {
      toast.success('✅ Pagamento registrado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['payments-by-priority'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao registrar pagamento');
    }
  });

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleQuickPayment = (paymentId: string, paymentType: string, description: string) => {
    if (window.confirm(`Confirmar pagamento de: ${description}?`)) {
      quickPaymentMutation.mutate({ paymentId, paymentType });
    }
  };

  // ==========================================
  // CALCULADOS DO CONTROLE FINANCEIRO
  // ==========================================
  const totalUsers = users?.length || 0;
  const totalVessels = vessels?.length || 0;
  const activeUsers = users?.filter((u: any) => u.status === 'ACTIVE').length || 0;
  const overdueUsers = users?.filter((u: any) => u.status === 'OVERDUE' || u.status === 'OVERDUE_PAYMENT').length || 0;
  
  const estimatedRevenue = users?.reduce((total: number, user: any) => {
    if (user.vessels) {
      return total + user.vessels.reduce((userTotal: number, uv: any) => {
        return userTotal + (uv.totalValue || 0);
      }, 0);
    }
    return total;
  }, 0) || 0;

  // ==========================================
  // LOADING STATES
  // ==========================================
  const isLoading = (activeTab === 'priority' && isLoadingPriority) || 
                    (activeTab === 'control' && (usersLoading || vesselsLoading));

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // ==========================================
  // COMPONENTE DE ITEM DE PAGAMENTO (Priority Tab)
  // ==========================================
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
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Cliente em Atraso</span>;
      }
      if (payment.userStatus === 'BLOCKED') {
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Bloqueado</span>;
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

  const { overdue, dueToday, dueIn3Days, dueIn7Days, dueLater, summary } = paymentsData || {};

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão Financeira</h1>
          <p className="text-gray-600 mt-1">Gerencie pagamentos e controle financeiro completo</p>
        </div>
        {activeTab === 'control' && (
          <button
            onClick={() => setShowPaymentModal(true)}
            className="btn btn-primary flex items-center"
          >
            <DollarSign className="w-5 h-5 mr-2" />
            Registrar Pagamento
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('priority')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'priority'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Painel por Prioridade
            </div>
          </button>
          <button
            onClick={() => setActiveTab('control')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'control'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Controle Financeiro
            </div>
          </button>
        </nav>
      </div>

      {/* TAB: PAINEL POR PRIORIDADE */}
      {activeTab === 'priority' && (
        <div className="space-y-6">
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
      )}

      {/* TAB: CONTROLE FINANCEIRO */}
      {activeTab === 'control' && (
        <div className="space-y-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card bg-blue-50 border-blue-200">
              <div className="flex items-center">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900">Total de Usuários</h3>
                  <p className="text-2xl font-bold text-blue-700">{totalUsers}</p>
                  <p className="text-sm text-blue-600">{activeUsers} ativos</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="card bg-green-50 border-green-200">
              <div className="flex items-center">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-900">Embarcações</h3>
                  <p className="text-2xl font-bold text-green-700">{totalVessels}</p>
                  <p className="text-sm text-green-600">Cadastradas</p>
                </div>
                <Ship className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="card bg-yellow-50 border-yellow-200">
              <div className="flex items-center">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-yellow-900">Em Atraso</h3>
                  <p className="text-2xl font-bold text-yellow-700">{overdueUsers}</p>
                  <p className="text-sm text-yellow-600">Usuários</p>
                </div>
                <TrendingDown className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            <div className="card bg-purple-50 border-purple-200">
              <div className="flex items-center">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-purple-900">Receita Estimada</h3>
                  <p className="text-2xl font-bold text-purple-700">
                    R$ {estimatedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-purple-600">Valor total</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Controle de Pagamentos */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">💳 Controle de Pagamentos</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users?.map((user: any) => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      user.status === 'OVERDUE' ? 'bg-yellow-100 text-yellow-800' :
                      user.status === 'OVERDUE_PAYMENT' ? 'bg-orange-100 text-orange-800' :
                      user.status === 'BLOCKED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status === 'ACTIVE' ? '✅ Ativo' :
                       user.status === 'OVERDUE' ? '⏰ Em Atraso' :
                       user.status === 'OVERDUE_PAYMENT' ? '💳 Inadimplente' :
                       user.status === 'BLOCKED' ? '🚫 Bloqueado' : 'Ativo'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">{user.email}</p>
                    
                    {user.vessels?.map((uv: any) => (
                      <div key={uv.vessel.id} className="border-t pt-2">
                        <p className="font-medium text-blue-600">🚤 {uv.vessel.name}</p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <span className="text-gray-500">Total:</span>
                            <p className="font-medium">R$ {uv.totalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Entrada:</span>
                            <p className="font-medium text-green-600">R$ {uv.downPayment?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Restante:</span>
                            <p className="font-medium text-orange-600">R$ {uv.remainingAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</p>
                            <p className="text-xs text-gray-500">
                              {uv.paidInstallments || 0}/{uv.totalInstallments || 0} parcelas
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Marina:</span>
                            <p className="font-medium text-purple-600">R$ {uv.marinaMonthlyFee?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}/mês</p>
                          </div>
                        </div>
                        
                        <div className="mt-3 space-y-2">
                          <button
                            onClick={() => {
                              setSelectedUser({ ...user, vessel: uv });
                              setShowFinancialModal(true);
                            }}
                            className="w-full btn btn-primary text-xs py-1"
                          >
                            ⚙️ Configurar Finanças
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser({ ...user, vessel: uv });
                              setPaymentType('installment');
                              setShowPaymentModal(true);
                            }}
                            className="w-full btn btn-outline text-xs py-1"
                          >
                            💰 Registrar Parcela
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser({ ...user, vessel: uv });
                              setPaymentType('marina');
                              setShowPaymentModal(true);
                            }}
                            className="w-full btn btn-outline text-xs py-1"
                          >
                            🏢 Registrar Marina
                          </button>
                          <button
                            onClick={() => {
                              window.open(`/financial-history/${uv.id}`, '_blank');
                            }}
                            className="w-full btn btn-outline text-xs py-1"
                          >
                            📋 Histórico Completo
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lista de Usuários com Informações Financeiras */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Usuários e Embarcações</h2>
            {users?.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum usuário cadastrado
                </h3>
                <p className="text-gray-600">
                  Cadastre usuários para começar a acompanhar as finanças.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-head">
                    <tr>
                      <th className="table-header">Usuário</th>
                      <th className="table-header">Status</th>
                      <th className="table-header">Embarcações</th>
                      <th className="table-header">Valor Total</th>
                      <th className="table-header">Entrada</th>
                      <th className="table-header">Parcelas</th>
                      <th className="table-header">Marina/Mês</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {users?.map((user: any) => (
                      <tr key={user.id}>
                        <td className="table-cell">
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            user.status === 'OVERDUE' ? 'bg-yellow-100 text-yellow-800' :
                            user.status === 'OVERDUE_PAYMENT' ? 'bg-orange-100 text-orange-800' :
                            user.status === 'BLOCKED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.status === 'ACTIVE' ? '✅ Ativo' :
                             user.status === 'OVERDUE' ? '⏰ Em Atraso' :
                             user.status === 'OVERDUE_PAYMENT' ? '💳 Inadimplente' :
                             user.status === 'BLOCKED' ? '🚫 Bloqueado' : 'Ativo'}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex flex-wrap gap-1">
                            {user.vessels?.length > 0 ? (
                              user.vessels.map((uv: any) => (
                                <span key={uv.vessel.id} className="inline-flex px-2 py-1 text-xs font-medium rounded bg-blue-50 text-blue-700 border border-blue-200">
                                  🚤 {uv.vessel.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400">Nenhuma</span>
                            )}
                          </div>
                        </td>
                        <td className="table-cell">
                          {user.vessels?.length > 0 ? (
                            <div className="text-sm">
                              {user.vessels.map((uv: any) => (
                                <div key={uv.vessel.id} className="text-right">
                                  R$ {uv.totalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="table-cell">
                          {user.vessels?.length > 0 ? (
                            <div className="text-sm">
                              {user.vessels.map((uv: any) => (
                                <div key={uv.vessel.id} className="text-right">
                                  R$ {uv.downPayment?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="table-cell">
                          {user.vessels?.length > 0 ? (
                            <div className="text-sm">
                              {user.vessels.map((uv: any) => (
                                <div key={uv.vessel.id} className="text-right">
                                  {uv.totalInstallments || 0}x
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="table-cell">
                          {user.vessels?.length > 0 ? (
                            <div className="text-sm">
                              {user.vessels.map((uv: any) => (
                                <div key={uv.vessel.id} className="text-right">
                                  R$ {uv.marinaMonthlyFee?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Resumo por Embarcação */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Resumo por Embarcação</h2>
            {vessels?.length === 0 ? (
              <div className="text-center py-12">
                <Ship className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhuma embarcação cadastrada
                </h3>
                <p className="text-gray-600">
                  Cadastre embarcações para começar a acompanhar as finanças.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vessels?.map((vessel: any) => {
                  const vesselUsers = users?.filter((user: any) => 
                    user.vessels?.some((uv: any) => uv.vessel.id === vessel.id)
                  ) || [];
                  
                  const totalValue = vesselUsers.reduce((total: number, user: any) => {
                    const userVessel = user.vessels?.find((uv: any) => uv.vessel.id === vessel.id);
                    return total + (userVessel?.totalValue || 0);
                  }, 0);

                  const totalMarina = vesselUsers.reduce((total: number, user: any) => {
                    const userVessel = user.vessels?.find((uv: any) => uv.vessel.id === vessel.id);
                    return total + (userVessel?.marinaMonthlyFee || 0);
                  }, 0);

                  return (
                    <div key={vessel.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                        🚤 {vessel.name}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Usuários:</span>
                          <span className="font-medium">{vesselUsers.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Valor Total:</span>
                          <span className="font-medium text-green-600">
                            R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Marina/Mês:</span>
                          <span className="font-medium text-blue-600">
                            R$ {totalMarina.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para Configurar Dados Financeiros */}
      {showFinancialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              ⚙️ Configurar Dados Financeiros
            </h2>

            {selectedUser && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedUser.name}</p>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
                <p className="text-sm text-blue-600">🚤 {selectedUser.vessel?.vessel?.name}</p>
              </div>
            )}

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              
              const financialData = {
                vesselFinancials: [{
                  vesselId: selectedUser?.vessel?.vessel?.id,
                  totalValue: parseFloat(formData.get('totalValue') as string) || 0,
                  downPayment: parseFloat(formData.get('downPayment') as string) || 0,
                  totalInstallments: parseInt(formData.get('totalInstallments') as string) || 0,
                  marinaMonthlyFee: parseFloat(formData.get('marinaMonthlyFee') as string) || 0,
                  marinaDueDay: parseInt(formData.get('marinaDueDay') as string) || 5,
                }]
              };

              api.put(`/users/${selectedUser.id}`, financialData)
                .then(() => {
                  toast.success('Dados financeiros atualizados com sucesso!');
                  queryClient.invalidateQueries({ queryKey: ['users'] });
                  setShowFinancialModal(false);
                  setSelectedUser(null);
                })
                .catch((error) => {
                  toast.error('Erro ao atualizar dados financeiros');
                });
            }} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total (R$) *</label>
                  <input 
                    name="totalValue" 
                    type="number" 
                    step="0.01" 
                    className="input w-full" 
                    placeholder="25000.00"
                    defaultValue={selectedUser?.vessel?.totalValue || ''}
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor de Entrada (R$) *</label>
                  <input 
                    name="downPayment" 
                    type="number" 
                    step="0.01" 
                    className="input w-full" 
                    placeholder="15000.00"
                    defaultValue={selectedUser?.vessel?.downPayment || ''}
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade de Parcelas *</label>
                  <input 
                    name="totalInstallments" 
                    type="number" 
                    className="input w-full" 
                    placeholder="5"
                    defaultValue={selectedUser?.vessel?.totalInstallments || ''}
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taxa Mensal Marina (R$) *</label>
                  <input 
                    name="marinaMonthlyFee" 
                    type="number" 
                    step="0.01" 
                    className="input w-full" 
                    placeholder="350.00"
                    defaultValue={selectedUser?.vessel?.marinaMonthlyFee || ''}
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dia de Vencimento da Marina *</label>
                <select 
                  name="marinaDueDay" 
                  className="input w-full" 
                  defaultValue={selectedUser?.vessel?.marinaDueDay || 5}
                  required 
                >
                  {Array.from({length: 31}, (_, i) => (
                    <option key={i+1} value={i+1}>{i+1}º dia</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowFinancialModal(false);
                    setSelectedUser(null);
                  }} 
                  className="flex-1 btn btn-secondary"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 btn btn-primary"
                >
                  Salvar Dados Financeiros
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Registrar Pagamento */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              💳 Registrar Pagamento
            </h2>

            {selectedUser ? (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedUser.name}</p>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
                <p className="text-sm text-blue-600">🚤 {selectedUser.vessel?.vessel?.name}</p>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Selecione Usuário e Embarcação</label>
                <select
                  className="input w-full"
                  onChange={(e) => {
                    const [userId, vesselId] = e.target.value.split('|');
                    const user = users?.find((u: any) => u.id === userId);
                    const uv = user?.vessels?.find((uv: any) => uv.vessel.id === vesselId);
                    if (user && uv) {
                      setSelectedUser({ ...user, vessel: uv });
                    }
                  }}
                >
                  <option value="">Selecione...</option>
                  {users?.map((user: any) =>
                    user.vessels?.map((uv: any) => (
                      <option key={`${user.id}|${uv.vessel.id}`} value={`${user.id}|${uv.vessel.id}`}>
                        {user.name} - 🚤 {uv.vessel.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!selectedUser?.vessel) {
                toast.error('Selecione um usuário e embarcação');
                return;
              }
              
              const formData = new FormData(e.currentTarget);
              
              const paymentData = {
                userVesselId: selectedUser?.vessel?.id,
                amount: parseFloat(formData.get('amount') as string),
                paymentDate: formData.get('paymentDate') as string,
                notes: formData.get('notes') as string,
                type: paymentType
              };

              try {
                await api.post('/financial/register-payment', paymentData);
                toast.success('Pagamento registrado com sucesso!');
                queryClient.invalidateQueries({ queryKey: ['users'] });
                queryClient.invalidateQueries({ queryKey: ['payments-by-priority'] });
                setShowPaymentModal(false);
                setSelectedUser(null);
              } catch (error: any) {
                toast.error('Erro ao registrar pagamento: ' + (error.response?.data?.message || 'Erro desconhecido'));
              }
            }} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pagamento</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType('installment')}
                    className={`flex-1 p-3 text-center border rounded-lg transition-colors ${
                      paymentType === 'installment'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    💰 Parcela da Embarcação
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('marina')}
                    className={`flex-1 p-3 text-center border rounded-lg transition-colors ${
                      paymentType === 'marina'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    🏢 Taxa da Marina
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Pago (R$) *</label>
                <input 
                  name="amount" 
                  type="number" 
                  step="0.01" 
                  className="input w-full" 
                  placeholder="0.00"
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data do Pagamento *</label>
                <input 
                  name="paymentDate" 
                  type="date" 
                  className="input w-full" 
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea 
                  name="notes" 
                  className="input w-full" 
                  rows={3}
                  placeholder="Ex: Pagamento via PIX, transferência, etc."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedUser(null);
                  }} 
                  className="flex-1 btn btn-secondary"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 btn btn-primary"
                  disabled={!selectedUser?.vessel}
                >
                  Registrar Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}




