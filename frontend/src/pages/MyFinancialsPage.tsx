import { useQuery } from '@tanstack/react-query';
import { CreditCard, Calendar, AlertTriangle, CheckCircle, Clock, History, Plus } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

export default function MyFinancialsPage() {
  const { user } = useAuthStore();
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedVesselId, setSelectedVesselId] = useState<string | null>(null);

  const { data: userData, isLoading } = useQuery({
    queryKey: ['user-financials', user?.id],
    queryFn: async () => {
      const { data } = await api.get('/financial/my-financials');
      return data;
    },
    enabled: !!user?.id,
  });

  // Buscar histórico financeiro da embarcação selecionada
  const { data: financialHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['financial-history', selectedVesselId],
    queryFn: async () => {
      const { data } = await api.get(`/ad-hoc-charges/user-vessel/${selectedVesselId}/financial-history`);
      return data.data;
    },
    enabled: !!selectedVesselId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const vessels = userData?.data || [];

  // Calcular estatísticas
  const totalValue = vessels.reduce((total: number, uv: any) => total + (uv.totalValue || 0), 0);
  const totalDownPayment = vessels.reduce((total: number, uv: any) => total + (uv.downPayment || 0), 0);
  const totalRemaining = vessels.reduce((total: number, uv: any) => total + (uv.remainingAmount || 0), 0);
  const totalMarinaMonthly = vessels.reduce((total: number, uv: any) => total + (uv.marinaMonthlyFee || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <CreditCard className="w-8 h-8 mr-3 text-primary-600" />
            Minhas Finanças
          </h1>
          <p className="text-gray-600 mt-1">
            Acompanhe suas informações financeiras e pagamentos
          </p>
        </div>
      </div>

      {/* Status do Usuário */}
      {user?.status && user.status !== 'ACTIVE' && (
        <div className={`card ${
          user.status === 'BLOCKED' ? 'bg-red-50 border-red-200' :
          user.status === 'OVERDUE_PAYMENT' ? 'bg-orange-50 border-orange-200' :
          'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center">
            <AlertTriangle className={`w-6 h-6 mr-3 ${
              user.status === 'BLOCKED' ? 'text-red-600' :
              user.status === 'OVERDUE_PAYMENT' ? 'text-orange-600' :
              'text-yellow-600'
            }`} />
            <div>
              <h3 className={`font-semibold ${
                user.status === 'BLOCKED' ? 'text-red-900' :
                user.status === 'OVERDUE_PAYMENT' ? 'text-orange-900' :
                'text-yellow-900'
              }`}>
                {user.status === 'BLOCKED' ? '🚫 Conta Bloqueada' :
                 user.status === 'OVERDUE_PAYMENT' ? '💳 Pagamentos em Atraso' :
                 '⏰ Situação em Atraso'}
              </h3>
              <p className={`text-sm ${
                user.status === 'BLOCKED' ? 'text-red-700' :
                user.status === 'OVERDUE_PAYMENT' ? 'text-orange-700' :
                'text-yellow-700'
              }`}>
                {user.status === 'BLOCKED' ? 'Sua conta está bloqueada. Entre em contato com o administrador.' :
                 user.status === 'OVERDUE_PAYMENT' ? 'Você possui pagamentos em atraso. Regularize sua situação para continuar fazendo reservas.' :
                 'Você possui pendências. Por favor, regularize sua situação.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900">Valor Total</h3>
              <p className="text-2xl font-bold text-blue-700">
                R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-blue-600">Em embarcações</p>
            </div>
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900">Entrada Paga</h3>
              <p className="text-2xl font-bold text-green-700">
                R$ {totalDownPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-green-600">Valor de entrada</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="card bg-orange-50 border-orange-200">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-orange-900">Saldo Restante</h3>
              <p className="text-2xl font-bold text-orange-700">
                R$ {totalRemaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-orange-600">A pagar</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-purple-900">Marina/Mês</h3>
              <p className="text-2xl font-bold text-purple-700">
                R$ {totalMarinaMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-purple-600">Taxa mensal</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Detalhes por Embarcação */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Detalhes por Embarcação</h2>
        {vessels.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma embarcação vinculada
            </h3>
            <p className="text-gray-600">
              Entre em contato com o administrador para vincular embarcações à sua conta.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {vessels.map((userVessel: any) => (
              <div key={userVessel.id} className="border border-gray-200 rounded-lg p-6 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    🚤 {userVessel.vessel.name}
                  </h3>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    userVessel.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    userVessel.status === 'PAID_OFF' ? 'bg-blue-100 text-blue-800' :
                    userVessel.status === 'DEFAULTED' ? 'bg-red-100 text-red-800' :
                    userVessel.status === 'SUSPENDED' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {userVessel.status === 'ACTIVE' ? '✅ Ativa' :
                     userVessel.status === 'PAID_OFF' ? '💰 Quitada' :
                     userVessel.status === 'DEFAULTED' ? '🚫 Inadimplente' :
                     userVessel.status === 'SUSPENDED' ? '⏸️ Suspensa' :
                     'Ativa'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Valor Total</h4>
                    <p className="text-xl font-bold text-gray-900">
                      R$ {userVessel.totalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Entrada Paga</h4>
                    <p className="text-xl font-bold text-green-600">
                      R$ {userVessel.downPayment?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Saldo Restante</h4>
                    <p className="text-xl font-bold text-orange-600">
                      R$ {userVessel.remainingAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Parcelas</h4>
                    <p className="text-xl font-bold text-blue-600">
                      {userVessel.totalInstallments || 0}x
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-purple-700 mb-2">Taxa Mensal da Marina</h4>
                      <p className="text-xl font-bold text-purple-900">
                        R$ {userVessel.marinaMonthlyFee?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                      </p>
                      <p className="text-sm text-purple-600 mt-1">
                        Vence todo dia {userVessel.marinaDueDay || 5} de cada mês
                      </p>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-700 mb-2">Valor da Parcela</h4>
                      <p className="text-xl font-bold text-blue-900">
                        {userVessel.totalInstallments > 0 ? 
                          `R$ ${((userVessel.remainingAmount || 0) / userVessel.totalInstallments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` :
                          'R$ 0,00'
                        }
                      </p>
                      <p className="text-sm text-blue-600 mt-1">
                        {userVessel.totalInstallments || 0} parcelas restantes
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        setSelectedVesselId(userVessel.id);
                        setShowHistoryModal(true);
                      }}
                      className="btn btn-outline flex items-center text-sm"
                    >
                      <History className="w-4 h-4 mr-2" />
                      Ver Histórico Completo
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informações Importantes */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">📋 Informações Importantes</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• Os valores mostrados são baseados nas informações cadastradas no sistema.</p>
          <p>• Para atualizações ou dúvidas sobre pagamentos, entre em contato com o administrador.</p>
          <p>• Mantenha seus dados sempre atualizados para receber notificações corretas.</p>
          <p>• Em caso de inadimplência, suas reservas podem ser suspensas.</p>
        </div>
      </div>

      {/* Modal de Histórico Financeiro */}
      {showHistoryModal && selectedVesselId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Histórico Financeiro</h2>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedVesselId(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : !financialHistory || financialHistory.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum histórico encontrado
                </h3>
                <p className="text-gray-600">
                  Ainda não há registros financeiros para esta embarcação.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {financialHistory.map((item: any) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {item.status === 'PAID' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : item.status === 'PENDING' ? (
                          <Clock className="w-5 h-5 text-yellow-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">{item.title}</h3>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {item.type === 'installment' ? 'Parcela' : 
                               item.type === 'marina' ? 'Marina' : 'Cobrança Avulsa'}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              item.status === 'PAID' ? 'bg-green-100 text-green-800' :
                              item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              item.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.status === 'PAID' ? 'Pago' :
                               item.status === 'PENDING' ? 'Pendente' :
                               item.status === 'OVERDUE' ? 'Em Atraso' :
                               item.status === 'CANCELLED' ? 'Cancelado' : item.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <div className="text-sm text-gray-600 space-y-1">
                          {item.dueDate && (
                            <p>Vence: {new Date(item.dueDate).toLocaleDateString('pt-BR')}</p>
                          )}
                          {item.paymentDate && (
                            <p>Pago: {new Date(item.paymentDate).toLocaleDateString('pt-BR')}</p>
                          )}
                          <p>Criado: {new Date(item.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                    </div>
                    
                    {item.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <strong>Observações:</strong> {item.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}