import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Plus, Users, Ship, Globe, User, Send } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function NotificationManagementPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [notificationType, setNotificationType] = useState<'GLOBAL' | 'ROLE' | 'VESSEL' | 'USER' | 'USERS'>('GLOBAL');
  const [selectedVessel, setSelectedVessel] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Buscar usuários e embarcações para os formulários
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
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

  // Buscar notificações existentes
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data;
    },
  });

  // Mutation para criar notificação
  const createNotificationMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/notifications', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      toast.success('Notificação enviada com sucesso!');
      setShowModal(false);
      // Reset form
      setNotificationType('GLOBAL');
      setSelectedVessel('');
      setSelectedUser('');
      setSelectedUsers([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao enviar notificação');
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: any = {
      title: formData.get('title'),
      message: formData.get('message'),
      type: formData.get('type'),
    };

    // Adicionar campos específicos baseados no tipo
    switch (notificationType) {
      case 'GLOBAL':
        data.isGlobal = true;
        break;
      case 'ROLE':
        data.targetRole = formData.get('targetRole');
        break;
      case 'VESSEL':
        data.vesselId = selectedVessel;
        break;
      case 'USER':
        data.userId = selectedUser;
        break;
      case 'USERS':
        data.userIds = selectedUsers;
        break;
    }

    // Adicionar data de expiração se fornecida
    const expiresAt = formData.get('expiresAt');
    if (expiresAt) {
      data.expiresAt = new Date(expiresAt as string).toISOString();
    }

    createNotificationMutation.mutate(data);
  };

  const getRecipientDescription = (notification: any) => {
    if (notification.isGlobal) return '🌍 Todos os usuários';
    if (notification.targetRole) return `👥 Todos os ${notification.targetRole === 'ADMIN' ? 'administradores' : 'usuários'}`;
    if (notification.vesselId) {
      const vessel = vessels?.find((v: any) => v.id === notification.vesselId);
      return vessel ? `🚤 ${vessel.name}` : '🚤 Embarcação específica';
    }
    return '👤 Usuário específico';
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Bell className="w-8 h-8 mr-3 text-primary-600" />
            Gerenciar Notificações
          </h1>
          <p className="text-gray-600 mt-1">
            Envie notificações para usuários específicos, embarcações ou todos
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Notificação
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900">Total de Notificações</h3>
              <p className="text-2xl font-bold text-blue-700">
                {notifications?.length || 0}
              </p>
            </div>
            <Bell className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900">Notificações Ativas</h3>
              <p className="text-2xl font-bold text-green-700">
                {notifications?.filter((n: any) => n.isActive).length || 0}
              </p>
            </div>
            <Send className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-purple-900">Usuários</h3>
              <p className="text-2xl font-bold text-purple-700">
                {users?.filter((u: any) => u.role === 'USER').length || 0}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="card bg-orange-50 border-orange-200">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-orange-900">Embarcações</h3>
              <p className="text-2xl font-bold text-orange-700">
                {vessels?.length || 0}
              </p>
            </div>
            <Ship className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Lista de Notificações */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Notificações Enviadas</h2>
        {notifications?.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma notificação enviada
            </h3>
            <p className="text-gray-600">
              Clique em "Nova Notificação" para enviar a primeira notificação.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-head">
                <tr>
                  <th className="table-header">Título</th>
                  <th className="table-header">Tipo</th>
                  <th className="table-header">Destinatário</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Criada em</th>
                  <th className="table-header">Expira em</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {notifications?.map((notification: any) => (
                  <tr key={notification.id}>
                    <td className="table-cell">
                      <div>
                        <div className="font-medium">{notification.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {notification.message}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        notification.type === 'INFO' ? 'bg-blue-100 text-blue-800' :
                        notification.type === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
                        notification.type === 'PAYMENT' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {notification.type === 'INFO' ? 'ℹ️ Info' :
                         notification.type === 'WARNING' ? '⚠️ Aviso' :
                         notification.type === 'PAYMENT' ? '💳 Pagamento' :
                         '🔧 Manutenção'}
                      </span>
                    </td>
                    <td className="table-cell">
                      {getRecipientDescription(notification)}
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        notification.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {notification.isActive ? '✅ Ativa' : '❌ Inativa'}
                      </span>
                    </td>
                    <td className="table-cell">
                      {new Date(notification.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="table-cell">
                      {notification.expiresAt 
                        ? new Date(notification.expiresAt).toLocaleDateString('pt-BR')
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Nova Notificação */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              📢 Nova Notificação
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo de Destinatário */}
              <div>
                <label className="label">Destinatário</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => setNotificationType('GLOBAL')}
                    className={`p-3 text-center border rounded-lg transition-colors ${
                      notificationType === 'GLOBAL'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Globe className="w-6 h-6 mx-auto mb-1" />
                    <div className="text-xs font-medium">Todos</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setNotificationType('ROLE')}
                    className={`p-3 text-center border rounded-lg transition-colors ${
                      notificationType === 'ROLE'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Users className="w-6 h-6 mx-auto mb-1" />
                    <div className="text-xs font-medium">Por Perfil</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setNotificationType('VESSEL')}
                    className={`p-3 text-center border rounded-lg transition-colors ${
                      notificationType === 'VESSEL'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Ship className="w-6 h-6 mx-auto mb-1" />
                    <div className="text-xs font-medium">Embarcação</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setNotificationType('USER')}
                    className={`p-3 text-center border rounded-lg transition-colors ${
                      notificationType === 'USER'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <User className="w-6 h-6 mx-auto mb-1" />
                    <div className="text-xs font-medium">Usuário</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setNotificationType('USERS')}
                    className={`p-3 text-center border rounded-lg transition-colors ${
                      notificationType === 'USERS'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Users className="w-6 h-6 mx-auto mb-1" />
                    <div className="text-xs font-medium">Múltiplos</div>
                  </button>
                </div>
              </div>

              {/* Campos específicos baseados no tipo */}
              {notificationType === 'ROLE' && (
                <div>
                  <label className="label">Perfil</label>
                  <select name="targetRole" className="input bg-white text-gray-900" required>
                    <option value="">Selecione...</option>
                    <option value="USER">👥 Usuários</option>
                    <option value="ADMIN">👑 Administradores</option>
                  </select>
                </div>
              )}

              {notificationType === 'VESSEL' && (
                <div>
                  <label className="label">Embarcação</label>
                  <select 
                    value={selectedVessel} 
                    onChange={(e) => setSelectedVessel(e.target.value)}
                    className="input bg-white text-gray-900" 
                    required
                  >
                    <option value="">Selecione uma embarcação...</option>
                    {vessels?.map((vessel: any) => (
                      <option key={vessel.id} value={vessel.id}>
                        🚤 {vessel.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Todos os usuários vinculados a esta embarcação receberão a notificação
                  </p>
                </div>
              )}

              {notificationType === 'USER' && (
                <div>
                  <label className="label">Usuário</label>
                  <select 
                    value={selectedUser} 
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="input bg-white text-gray-900" 
                    required
                  >
                    <option value="">Selecione um usuário...</option>
                    {users?.filter((u: any) => u.role === 'USER').map((user: any) => (
                      <option key={user.id} value={user.id}>
                        👤 {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {notificationType === 'USERS' && (
                <div>
                  <label className="label">Usuários</label>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
                    {users?.filter((u: any) => u.role === 'USER').map((user: any) => (
                      <label key={user.id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">👤 {user.name} ({user.email})</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedUsers.length} usuário(s) selecionado(s)
                  </p>
                </div>
              )}

              {/* Campos comuns */}
              <div>
                <label className="label">Título</label>
                <input name="title" className="input bg-white text-gray-900" placeholder="Título da notificação" required />
              </div>

              <div>
                <label className="label">Mensagem</label>
                <textarea 
                  name="message" 
                  className="input bg-white text-gray-900" 
                  rows={4}
                  placeholder="Conteúdo da notificação..."
                  required 
                />
              </div>

              <div>
                <label className="label">Tipo</label>
                <select name="type" className="input bg-white text-gray-900" required>
                  <option value="">Selecione...</option>
                  <option value="INFO">ℹ️ Informação</option>
                  <option value="WARNING">⚠️ Aviso</option>
                  <option value="PAYMENT">💳 Pagamento</option>
                  <option value="MAINTENANCE">🔧 Manutenção</option>
                </select>
              </div>

              <div>
                <label className="label">Data de Expiração (opcional)</label>
                <input name="expiresAt" type="datetime-local" className="input bg-white text-gray-900" />
                <p className="text-xs text-gray-500 mt-1">
                  A notificação será automaticamente desativada após esta data
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 btn btn-outline"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={createNotificationMutation.isPending}
                  className="flex-1 btn btn-primary"
                >
                  {createNotificationMutation.isPending ? 'Enviando...' : 'Enviar Notificação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
