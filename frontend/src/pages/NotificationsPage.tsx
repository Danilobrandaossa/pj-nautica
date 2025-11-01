import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle, AlertCircle, Info, Wrench, Clock, CreditCard } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['my-notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/my-notifications');
      return data;
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return api.post(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return api.post('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
      toast.success('Todas as notificações foram marcadas como lidas');
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'MAINTENANCE':
        return <Wrench className="w-5 h-5 text-orange-600" />;
      case 'PAYMENT':
        return <CreditCard className="w-5 h-5 text-red-600" />;
      case 'WARNING':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'INFO':
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'MAINTENANCE':
        return 'Manutenção';
      case 'PAYMENT':
        return 'Pagamento';
      case 'WARNING':
        return 'Aviso';
      case 'INFO':
      default:
        return 'Informação';
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'MAINTENANCE':
        return 'bg-orange-50 border-orange-200';
      case 'PAYMENT':
        return 'bg-red-50 border-red-200';
      case 'WARNING':
        return 'bg-yellow-50 border-yellow-200';
      case 'INFO':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const unreadNotifications = notifications?.filter((n: any) => !n.isRead) || [];
  const readNotifications = notifications?.filter((n: any) => n.isRead) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Bell className="w-8 h-8 mr-3 text-primary-600" />
            Informações e Avisos
          </h1>
          <p className="text-gray-600 mt-1">
            Avisos da marina, manutenções, horários e informações importantes
          </p>
        </div>
        {unreadNotifications.length > 0 && (
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="btn btn-outline flex items-center"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Não Lidas</p>
              <p className="text-2xl font-bold text-blue-900">{unreadNotifications.length}</p>
            </div>
            <Bell className="w-10 h-10 text-blue-400" />
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Lidas</p>
              <p className="text-2xl font-bold text-green-900">{readNotifications.length}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
        </div>

        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-purple-900">{notifications?.length || 0}</p>
            </div>
            <Info className="w-10 h-10 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Notificações Não Lidas */}
      {unreadNotifications.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-primary-600" />
            Não Lidas ({unreadNotifications.length})
          </h2>
          {unreadNotifications.map((notif: any) => (
            <div
              key={notif.id}
              className={`card ${getBgColor(notif.notification.type)} border-2 hover:shadow-lg transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                  <div className="mt-1 mr-4">
                    {getIcon(notif.notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 mr-2">
                        {getTypeLabel(notif.notification.type)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(notif.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">
                      {notif.notification.title}
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {notif.notification.message}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => markAsReadMutation.mutate(notif.notification.id)}
                  disabled={markAsReadMutation.isPending}
                  className="btn btn-outline text-sm px-3 py-1 ml-4"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Marcar como lida
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notificações Lidas */}
      {readNotifications.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            Lidas ({readNotifications.length})
          </h2>
          {readNotifications.map((notif: any) => (
            <div
              key={notif.id}
              className="card bg-gray-50 border-gray-200 opacity-75"
            >
              <div className="flex items-start">
                <div className="mt-1 mr-4 opacity-50">
                  {getIcon(notif.notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 mr-2">
                      {getTypeLabel(notif.notification.type)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {format(new Date(notif.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </span>
                    {notif.readAt && (
                      <span className="text-xs text-gray-400 ml-2">
                        • Lida em {format(new Date(notif.readAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-700 mb-2">
                    {notif.notification.title}
                  </h3>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {notif.notification.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {(!notifications || notifications.length === 0) && (
        <div className="card text-center py-12">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium mb-2">
            Nenhuma notificação no momento
          </p>
          <p className="text-gray-400 text-sm">
            Você será notificado sobre manutenções, horários da marina e avisos importantes aqui.
          </p>
        </div>
      )}

      {/* Informações */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start">
          <Info className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">
              Sobre as Notificações
            </h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Informações Gerais:</strong> Avisos da marina, horários de funcionamento</p>
              <p>• <strong>Manutenções:</strong> Informações sobre manutenção programada das embarcações</p>
              <p>• <strong>Pagamentos:</strong> Lembretes e avisos relacionados a pagamentos</p>
              <p>• <strong>Avisos da Embarcação:</strong> Informações específicas da sua embarcação vinculada</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

