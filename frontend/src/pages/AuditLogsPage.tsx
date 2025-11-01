import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Filter, Calendar, User, Ship, AlertCircle, Download } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AuditLogsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    startDate: '',
    endDate: '',
  });

  const { data: auditData, isLoading } = useQuery({
    queryKey: ['audit-logs', filters, user?.id],
    queryFn: async () => {
      const params: any = { limit: 100 };
      
      // Usuários comuns só veem seus próprios logs
      if (!isAdmin) {
        params.userId = user?.id;
      }
      
      if (filters.action) params.action = filters.action;
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.startDate) params.startDate = new Date(filters.startDate).toISOString();
      if (filters.endDate) params.endDate = new Date(filters.endDate).toISOString();

      const { data } = await api.get('/audit-logs', { params });
      return data;
    },
  });

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      USER_CREATED: 'Usuário Criado',
      USER_UPDATED: 'Usuário Atualizado',
      USER_DELETED: 'Usuário Excluído',
      VESSEL_CREATED: 'Embarcação Criada',
      VESSEL_UPDATED: 'Embarcação Atualizada',
      VESSEL_DELETED: 'Embarcação Excluída',
      BOOKING_CREATED: 'Reserva Criada',
      BOOKING_UPDATED: 'Reserva Atualizada',
      BOOKING_CANCELLED: 'Reserva Cancelada',
      BOOKING_DELETED: 'Reserva Excluída',
      DATE_BLOCKED: 'Data Bloqueada',
      DATE_UNBLOCKED: 'Data Desbloqueada',
      LIMIT_UPDATED: 'Limite Atualizado',
      LOGIN: 'Login',
      LOGOUT: 'Logout',
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATED')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATED')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETED') || action.includes('CANCELLED')) return 'bg-red-100 text-red-800';
    if (action.includes('BLOCKED')) return 'bg-orange-100 text-orange-800';
    if (action === 'LOGIN') return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('BOOKING') || action.includes('RESERVATION')) return '📅';
    if (action.includes('VESSEL') || action.includes('EMBARCAÇÃO')) return '🚤';
    if (action.includes('USER') || action.includes('USUÁRIO')) return '👤';
    if (action.includes('BLOCKED')) return '🚫';
    if (action === 'LOGIN') return '🔐';
    return '📝';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const logs = auditData?.logs || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <FileText className="w-8 h-8 mr-3 text-primary-600" />
          {isAdmin ? 'Histórico de Auditoria' : 'Meu Histórico'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isAdmin 
            ? 'Todas as ações realizadas no sistema com filtros avançados'
            : 'Histórico completo de suas ações no sistema'}
        </p>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-bold text-gray-900">Filtros</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label">Tipo de Ação</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="input"
            >
              <option value="">Todas</option>
              <option value="BOOKING_CREATED">Reserva Criada</option>
              <option value="BOOKING_CANCELLED">Reserva Cancelada</option>
              <option value="BOOKING_UPDATED">Reserva Atualizada</option>
              {isAdmin && (
                <>
                  <option value="USER_CREATED">Usuário Criado</option>
                  <option value="VESSEL_CREATED">Embarcação Criada</option>
                  <option value="DATE_BLOCKED">Data Bloqueada</option>
                  <option value="LOGIN">Login</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="label">Tipo de Entidade</label>
            <select
              value={filters.entityType}
              onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
              className="input"
            >
              <option value="">Todas</option>
              <option value="booking">Reservas</option>
              {isAdmin && (
                <>
                  <option value="user">Usuários</option>
                  <option value="vessel">Embarcações</option>
                  <option value="blocked_date">Bloqueios</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="label">Data Inicial</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="label">Data Final</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="input"
            />
          </div>
        </div>

        {(filters.action || filters.entityType || filters.startDate || filters.endDate) && (
          <div className="mt-4">
            <button
              onClick={() => setFilters({ action: '', entityType: '', startDate: '', endDate: '' })}
              className="btn btn-outline text-sm"
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total de Ações</p>
              <p className="text-2xl font-bold text-blue-900">{auditData?.total || 0}</p>
            </div>
            <FileText className="w-10 h-10 text-blue-400" />
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Exibindo</p>
              <p className="text-2xl font-bold text-green-900">{logs.length}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-green-400" />
          </div>
        </div>

        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Período</p>
              <p className="text-sm font-bold text-purple-900">
                {filters.startDate && filters.endDate 
                  ? `${format(new Date(filters.startDate), 'dd/MM', { locale: ptBR })} - ${format(new Date(filters.endDate), 'dd/MM', { locale: ptBR })}`
                  : 'Todos'}
              </p>
            </div>
            <Calendar className="w-10 h-10 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Timeline de Logs */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            Histórico de Ações ({logs.length})
          </h2>
        </div>

        {logs.length > 0 ? (
          <div className="space-y-3">
            {logs.map((log: any) => (
              <div
                key={log.id}
                className="border-l-4 border-primary-500 pl-4 py-3 bg-gray-50 rounded-r-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getActionIcon(log.action)}</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                      {log.entityType && (
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">
                          {log.entityType}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      {isAdmin && log.user && (
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          <span className="font-medium">{log.user.name}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{format(new Date(log.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      </div>
                      {log.ipAddress && (
                        <div className="flex items-center text-xs">
                          <span className="text-gray-400">IP: {log.ipAddress}</span>
                        </div>
                      )}
                    </div>

                    {log.details && Object.keys(log.details).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-primary-600 cursor-pointer hover:text-primary-800">
                          Ver detalhes
                        </summary>
                        <div className="mt-2 p-3 bg-white rounded border text-xs">
                          <pre className="whitespace-pre-wrap text-gray-700">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">
              Nenhum registro encontrado
            </p>
            <p className="text-gray-400 text-sm">
              {filters.action || filters.entityType || filters.startDate || filters.endDate
                ? 'Tente ajustar os filtros para ver mais resultados'
                : 'Ainda não há ações registradas no histórico'}
            </p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start">
          <AlertCircle className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">
              Sobre o Histórico
            </h3>
            <div className="text-sm text-blue-800 space-y-1">
              {isAdmin ? (
                <>
                  <p>• <strong>Auditoria Completa:</strong> Todas as ações de todos os usuários são registradas</p>
                  <p>• <strong>Filtros Avançados:</strong> Use os filtros para encontrar ações específicas</p>
                  <p>• <strong>Rastreamento de IP:</strong> Cada ação registra o endereço IP de origem</p>
                  <p>• <strong>Detalhes Completos:</strong> Clique em "Ver detalhes" para informações adicionais</p>
                </>
              ) : (
                <>
                  <p>• <strong>Suas Ações:</strong> Veja todas as suas ações no sistema</p>
                  <p>• <strong>Histórico de Reservas:</strong> Acompanhe suas reservas criadas e canceladas</p>
                  <p>• <strong>Transparência:</strong> Tenha visibilidade completa do que você faz no sistema</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

