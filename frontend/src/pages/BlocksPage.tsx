import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldBan, Plus, Trash2, Edit, Calendar, Clock } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' }
];

const BLOCK_REASONS = [
  { value: 'MANUTENÇÃO', label: 'Manutenção' },
  { value: 'SORTEIO', label: 'Sorteio' },
  { value: 'INDISPONÍVEL', label: 'Indisponível' },
  { value: 'FUNCIONAMENTO', label: 'Funcionamento' },
  { value: 'OUTROS', label: 'Outros' }
];

type TabType = 'dates' | 'weekly';

export default function BlocksPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dates');
  const queryClient = useQueryClient();

  // Datas Bloqueadas
  const [showDateModal, setShowDateModal] = useState(false);
  const { data: blockedDates, isLoading: isLoadingDates } = useQuery({
    queryKey: ['blocked-dates'],
    queryFn: async () => {
      const { data } = await api.get('/blocked-dates');
      return data;
    },
  });

  const { data: vessels } = useQuery({
    queryKey: ['vessels'],
    queryFn: async () => {
      const { data } = await api.get('/vessels');
      return data;
    },
  });

  const createDateMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/blocked-dates', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-dates'] });
      toast.success('Bloqueio criado!');
      setShowDateModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao criar bloqueio');
    },
  });

  const deleteDateMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/blocked-dates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-dates'] });
      toast.success('Bloqueio removido!');
    },
  });

  const handleDateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createDateMutation.mutate({
      vesselId: formData.get('vesselId'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      reason: formData.get('reason'),
      notes: formData.get('notes'),
    });
  };

  // Bloqueios Semanais
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<any>(null);
  const [formData, setFormData] = useState({
    dayOfWeek: '',
    reason: '',
    notes: ''
  });

  const { data: weeklyBlocks, isLoading: isLoadingWeekly } = useQuery({
    queryKey: ['weekly-blocks'],
    queryFn: async () => {
      const { data } = await api.get('/weekly-blocks');
      return data.data;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['weekly-blocks-stats'],
    queryFn: async () => {
      const { data } = await api.get('/weekly-blocks/stats');
      return data.data;
    }
  });

  const createWeeklyMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: response } = await api.post('/weekly-blocks', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-blocks'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-blocks-stats'] });
      toast.success('Bloqueio semanal criado!');
      setShowWeeklyModal(false);
      resetWeeklyForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao criar bloqueio semanal');
    }
  });

  const updateWeeklyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { data: response } = await api.put(`/weekly-blocks/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-blocks'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-blocks-stats'] });
      toast.success('Bloqueio semanal atualizado!');
      setShowWeeklyModal(false);
      setEditingBlock(null);
      resetWeeklyForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar bloqueio semanal');
    }
  });

  const deleteWeeklyMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/weekly-blocks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-blocks'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-blocks-stats'] });
      toast.success('Bloqueio semanal removido!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao remover bloqueio semanal');
    }
  });

  const resetWeeklyForm = () => {
    setFormData({
      dayOfWeek: '',
      reason: '',
      notes: ''
    });
  };

  const handleWeeklySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      dayOfWeek: parseInt(formData.dayOfWeek)
    };

    if (editingBlock) {
      updateWeeklyMutation.mutate({ id: editingBlock.id, data });
    } else {
      createWeeklyMutation.mutate(data);
    }
  };

  const handleEdit = (block: any) => {
    setEditingBlock(block);
    setFormData({
      dayOfWeek: block.dayOfWeek.toString(),
      reason: block.reason,
      notes: block.notes || ''
    });
    setShowWeeklyModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar este bloqueio semanal?')) {
      deleteWeeklyMutation.mutate(id);
    }
  };

  const toggleBlockStatus = async (id: string, isActive: boolean) => {
    try {
      await api.put(`/weekly-blocks/${id}`, { isActive: !isActive });
      queryClient.invalidateQueries({ queryKey: ['weekly-blocks'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-blocks-stats'] });
      toast.success(`Bloqueio ${!isActive ? 'ativado' : 'desativado'}!`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar status');
    }
  };

  const isLoading = isLoadingDates || isLoadingWeekly;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bloqueios</h1>
          <p className="text-gray-600 mt-1">Gerencie bloqueios de datas e bloqueios semanais</p>
        </div>
        {activeTab === 'dates' ? (
          <button onClick={() => setShowDateModal(true)} className="btn btn-primary flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Nova Data Bloqueada
          </button>
        ) : (
          <button
            onClick={() => {
              setEditingBlock(null);
              resetWeeklyForm();
              setShowWeeklyModal(true);
            }}
            className="btn btn-primary flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Bloqueio Semanal
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('dates')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dates'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Datas Bloqueadas
            </div>
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'weekly'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Bloqueios Semanais
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content: Datas Bloqueadas */}
      {activeTab === 'dates' && (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead className="table-head">
              <tr>
                <th className="table-header">Embarcação</th>
                <th className="table-header">Data Início</th>
                <th className="table-header">Data Fim</th>
                <th className="table-header">Motivo</th>
                <th className="table-header">Ações</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {blockedDates?.map((block: any) => (
                <tr key={block.id}>
                  <td className="table-cell font-medium">{block.vessel.name}</td>
                  <td className="table-cell">{format(new Date(block.startDate), 'dd/MM/yyyy', { locale: ptBR })}</td>
                  <td className="table-cell">{format(new Date(block.endDate), 'dd/MM/yyyy', { locale: ptBR })}</td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      block.reason === 'MAINTENANCE' ? 'bg-red-100 text-red-800' :
                      block.reason === 'DRAW' ? 'bg-gray-800 text-white' :
                      block.reason === 'UNAVAILABLE' ? 'bg-orange-100 text-orange-800' :
                      block.reason === 'OVERDUE_PAYMENT' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {block.reason === 'MAINTENANCE' ? '🔴 Manutenção' :
                       block.reason === 'DRAW' ? '⚫ Sorteio' :
                       block.reason === 'UNAVAILABLE' ? '🟠 Indisponível' :
                       block.reason === 'OVERDUE_PAYMENT' ? '🟡 Inadimplência' :
                       '⚪ Outro'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => { if(confirm('Remover bloqueio?')) deleteDateMutation.mutate(block.id); }}
                      className="text-red-600 hover:text-red-800"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content: Bloqueios Semanais */}
      {activeTab === 'weekly' && (
        <>
          {/* Estatísticas */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Bloqueios</p>
                    <p className="text-2xl font-bold text-primary-600">{stats.totalBlocks}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-primary-600" />
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Bloqueios Ativos</p>
                    <p className="text-2xl font-bold text-green-600">{stats.activeBlocks}</p>
                  </div>
                  <Clock className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Bloqueios Inativos</p>
                    <p className="text-2xl font-bold text-gray-500">{stats.inactiveBlocks}</p>
                  </div>
                  <Clock className="w-8 h-8 text-gray-500" />
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Dias Bloqueados</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.blocksByDay.length}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>
          )}

          {/* Lista de bloqueios semanais */}
          <div className="card overflow-x-auto">
            <table className="table">
              <thead className="table-head">
                <tr>
                  <th className="table-header">Dia da Semana</th>
                  <th className="table-header">Motivo</th>
                  <th className="table-header">Observações</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Criado em</th>
                  <th className="table-header">Ações</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {weeklyBlocks?.map((block: any) => (
                  <tr key={block.id}>
                    <td className="table-cell font-medium">
                      {DAYS_OF_WEEK.find(d => d.value === block.dayOfWeek)?.label}
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        block.reason === 'MANUTENÇÃO' ? 'bg-red-100 text-red-800' :
                        block.reason === 'SORTEIO' ? 'bg-gray-800 text-white' :
                        block.reason === 'INDISPONÍVEL' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {BLOCK_REASONS.find(r => r.value === block.reason)?.label || block.reason}
                      </span>
                    </td>
                    <td className="table-cell">{block.notes || '-'}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          block.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {block.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                        <button
                          onClick={() => toggleBlockStatus(block.id, block.isActive)}
                          className="text-sm text-primary-600 hover:text-primary-800"
                          title={block.isActive ? 'Desativar' : 'Ativar'}
                        >
                          {block.isActive ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </td>
                    <td className="table-cell">{new Date(block.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(block)}
                          className="text-primary-600 hover:text-primary-800"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(block.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Deletar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal: Nova Data Bloqueada */}
      {showDateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Nova Data Bloqueada</h3>
              <form onSubmit={handleDateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Embarcação *</label>
                  <select name="vesselId" className="input w-full" required>
                    <option value="">Selecione...</option>
                    {vessels?.map((v: any) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Início *</label>
                  <input name="startDate" type="date" className="input w-full" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim *</label>
                  <input name="endDate" type="date" className="input w-full" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
                  <select name="reason" className="input w-full" required>
                    <option value="MAINTENANCE">🔴 Manutenção</option>
                    <option value="DRAW">⚫ Sorteio</option>
                    <option value="UNAVAILABLE">🟠 Indisponível</option>
                    <option value="OVERDUE_PAYMENT">🟡 Inadimplência</option>
                    <option value="OTHER">⚪ Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea name="notes" className="input w-full" rows={3}></textarea>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowDateModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createDateMutation.isPending}
                    className="btn btn-primary flex-1"
                  >
                    {createDateMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Novo/Editar Bloqueio Semanal */}
      {showWeeklyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                {editingBlock ? 'Editar Bloqueio Semanal' : 'Novo Bloqueio Semanal'}
              </h3>
              
              <form onSubmit={handleWeeklySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dia da Semana *
                  </label>
                  <select
                    name="dayOfWeek"
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                    className="input w-full"
                    required
                  >
                    <option value="">Selecione o dia</option>
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo do Bloqueio *
                  </label>
                  <select
                    name="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="input w-full"
                    required
                  >
                    <option value="">Selecione o motivo</option>
                    {BLOCK_REASONS.map(reason => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input w-full"
                    rows={3}
                    placeholder="Observações adicionais sobre o bloqueio..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowWeeklyModal(false);
                      setEditingBlock(null);
                      resetWeeklyForm();
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
                    disabled={createWeeklyMutation.isPending || updateWeeklyMutation.isPending}
                  >
                    {createWeeklyMutation.isPending || updateWeeklyMutation.isPending ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      editingBlock ? 'Atualizar' : 'Criar'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




