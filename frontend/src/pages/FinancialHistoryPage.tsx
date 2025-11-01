import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, CreditCard, Calendar, DollarSign, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function FinancialHistoryPage() {
  const navigate = useNavigate();
  const { userVesselId } = useParams();
  const queryClient = useQueryClient();
  const [showChargeModal, setShowChargeModal] = useState(false);

  // Buscar histórico financeiro
  const { data: history, isLoading } = useQuery({
    queryKey: ['financial-history', userVesselId],
    queryFn: async () => {
      const { data } = await api.get(`/ad-hoc-charges/user-vessel/${userVesselId}/financial-history`);
      return data.data;
    },
    enabled: !!userVesselId,
  });

  // Buscar informações do usuário/embarcação
  const { data: userVesselInfo } = useQuery({
    queryKey: ['user-vessel-info', userVesselId],
    queryFn: async () => {
      const { data } = await api.get(`/users`);
      const user = data.find((u: any) => 
        u.vessels?.some((v: any) => v.id === userVesselId)
      );
      const vessel = user?.vessels?.find((v: any) => v.id === userVesselId);
      return { user, vessel };
    },
    enabled: !!userVesselId,
  });

  // Mutation para criar cobrança avulsa
  const createChargeMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post(`/ad-hoc-charges/user-vessel/${userVesselId}/charges`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-history', userVesselId] });
      toast.success('Cobrança avulsa criada com sucesso!');
      setShowChargeModal(false);
    },
    onError: (error: any) => {
      toast.error('Erro ao criar cobrança: ' + (error.response?.data?.message || 'Erro desconhecido'));
    },
  });

  // Mutation para pagar cobrança
  const payChargeMutation = useMutation({
    mutationFn: async ({ chargeId, paymentData }: { chargeId: string; paymentData: any }) => {
      return api.post(`/ad-hoc-charges/charge/${chargeId}/pay`, paymentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-history', userVesselId] });
      toast.success('Pagamento registrado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao registrar pagamento: ' + (error.response?.data?.message || 'Erro desconhecido'));
    },
  });

  const handleCreateCharge = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const chargeData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      amount: parseFloat(formData.get('amount') as string),
      dueDate: formData.get('dueDate') as string || undefined,
    };

    createChargeMutation.mutate(chargeData);
  };

  const handlePayCharge = (chargeId: string) => {
    const paymentData = {
      paymentDate: new Date().toISOString().split('T')[0],
      notes: 'Pagamento registrado via sistema'
    };

    payChargeMutation.mutate({ chargeId, paymentData });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'OVERDUE':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Pago';
      case 'PENDING':
        return 'Pendente';
      case 'OVERDUE':
        return 'Em Atraso';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'installment':
        return 'Parcela';
      case 'marina':
        return 'Marina';
      case 'ad_hoc':
        return 'Cobrança Avulsa';
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-outline flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <CreditCard className="w-8 h-8 mr-3 text-primary-600" />
              Histórico Financeiro
            </h1>
            <p className="text-gray-600 mt-1">
              {userVesselInfo?.user?.name} - 🚤 {userVesselInfo?.vessel?.vessel?.name}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowChargeModal(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Cobrança
        </button>
      </div>

      {/* Histórico */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Histórico de Pagamentos</h2>
        {!history || history.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum histórico encontrado
            </h3>
            <p className="text-gray-600">
              Ainda não há registros financeiros para esta embarcação.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item: any) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(item.status)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {getTypeText(item.type)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          item.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          item.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getStatusText(item.status)}
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

                {item.type === 'ad_hoc' && item.status === 'PENDING' && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => handlePayCharge(item.id)}
                      className="btn btn-primary text-sm"
                      disabled={payChargeMutation.isPending}
                    >
                      {payChargeMutation.isPending ? 'Registrando...' : 'Registrar Pagamento'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para criar cobrança avulsa */}
      {showChargeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Nova Cobrança Avulsa</h2>
            <form onSubmit={handleCreateCharge} className="space-y-4">
              <div>
                <label className="label">Título *</label>
                <input
                  name="title"
                  type="text"
                  className="input bg-white text-gray-900"
                  placeholder="Ex: Combustível, Manutenção"
                  required
                />
              </div>
              <div>
                <label className="label">Descrição</label>
                <textarea
                  name="description"
                  className="input bg-white text-gray-900"
                  rows={3}
                  placeholder="Descrição detalhada da cobrança"
                />
              </div>
              <div>
                <label className="label">Valor (R$) *</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  className="input bg-white text-gray-900"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="label">Data de Vencimento</label>
                <input
                  name="dueDate"
                  type="date"
                  className="input bg-white text-gray-900"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowChargeModal(false)}
                  className="flex-1 btn btn-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createChargeMutation.isPending}
                  className="flex-1 btn btn-primary"
                >
                  {createChargeMutation.isPending ? 'Criando...' : 'Criar Cobrança'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


