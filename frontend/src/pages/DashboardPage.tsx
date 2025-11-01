import { useQuery } from '@tanstack/react-query';
import { Ship, Calendar, Users, AlertCircle, Bell } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const { data: vessels } = useQuery({
    queryKey: ['vessels'],
    queryFn: async () => {
      const { data } = await api.get(isAdmin ? '/vessels' : '/vessels/my-vessels');
      return data;
    },
  });

  const { data: bookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data } = await api.get('/bookings');
      return data;
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
    enabled: isAdmin,
  });

  const { data: notifications } = useQuery({
    queryKey: ['my-notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/my-notifications');
      return data;
    },
  });

  const activeBookings = bookings?.filter((b: any) => 
    ['PENDING', 'APPROVED'].includes(b.status)
  );

  const myBookings = bookings?.filter((b: any) => b.user.id === user?.id);

  const unreadNotifications = notifications?.filter((n: any) => !n.isRead);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bem-vindo, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-1">
          {isAdmin ? 'Painel Administrativo' : 'Suas reservas e embarcações'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Embarcações</p>
              <p className="text-3xl font-bold mt-2">{vessels?.length || 0}</p>
            </div>
            <Ship className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">
                {isAdmin ? 'Reservas Ativas' : 'Minhas Reservas'}
              </p>
              <p className="text-3xl font-bold mt-2">
                {isAdmin ? (activeBookings?.length || 0) : (myBookings?.length || 0)}
              </p>
            </div>
            <Calendar className="w-12 h-12 text-green-200" />
          </div>
        </div>

        {isAdmin && (
          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Usuários</p>
                <p className="text-3xl font-bold mt-2">{users?.length || 0}</p>
              </div>
              <Users className="w-12 h-12 text-purple-200" />
            </div>
          </div>
        )}

        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Notificações</p>
              <p className="text-3xl font-bold mt-2">
                {unreadNotifications?.length || 0}
              </p>
            </div>
            <AlertCircle className="w-12 h-12 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Avisos de Status do Usuário */}
      {user?.status === 'BLOCKED' && (
        <div className="card bg-red-50 border-2 border-red-300">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-red-900 mb-2">
                🚫 Conta Bloqueada
              </h3>
              <p className="text-red-800">
                Sua conta está bloqueada e você não pode fazer novas reservas. 
                Entre em contato com o administrador para regularizar sua situação.
              </p>
            </div>
          </div>
        </div>
      )}

      {user?.status === 'OVERDUE_PAYMENT' && (
        <div className="card bg-orange-50 border-2 border-orange-300">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-orange-900 mb-2">
                💳 Pagamento Pendente
              </h3>
              <p className="text-orange-800">
                Você possui pagamentos em atraso. Por favor, regularize sua situação para continuar fazendo reservas.
              </p>
            </div>
          </div>
        </div>
      )}

      {user?.status === 'OVERDUE' && (
        <div className="card bg-yellow-50 border-2 border-yellow-300">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-yellow-900 mb-2">
                ⏰ Pendências em Aberto
              </h3>
              <p className="text-yellow-800">
                Você possui pendências. Por favor, regularize sua situação para continuar fazendo reservas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notificações Ativas */}
      {unreadNotifications && unreadNotifications.length > 0 && (
        <div className="card bg-blue-50 border border-blue-200">
          <div className="flex items-start">
            <Bell className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">
                📬 Você tem {unreadNotifications.length} notificação(ões) não lida(s)
              </h3>
              <div className="space-y-2">
                {unreadNotifications.slice(0, 3).map((notif: any) => (
                  <div key={notif.id} className="text-sm text-blue-800">
                    <strong>{notif.notification.title}:</strong> {notif.notification.message}
                  </div>
                ))}
              </div>
              {unreadNotifications.length > 3 && (
                <Link 
                  to="/notifications"
                  className="text-sm text-blue-700 hover:text-blue-900 font-medium mt-2 inline-block"
                >
                  Ver todas →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Bookings */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {isAdmin ? 'Reservas Recentes' : 'Minhas Reservas Recentes'}
        </h2>
        
        {bookings && bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-head">
                <tr>
                  <th className="table-header">Embarcação</th>
                  {isAdmin && <th className="table-header">Usuário</th>}
                  <th className="table-header">Data</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {(isAdmin ? bookings : myBookings)?.slice(0, 5).map((booking: any) => (
                  <tr key={booking.id}>
                    <td className="table-cell font-medium">{booking.vessel.name}</td>
                    {isAdmin && (
                      <td className="table-cell">{booking.user.name}</td>
                    )}
                    <td className="table-cell">
                      {new Date(booking.bookingDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        booking.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        booking.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status === 'APPROVED' ? 'Aprovado' :
                         booking.status === 'CANCELLED' ? 'Cancelado' :
                         booking.status === 'COMPLETED' ? 'Concluído' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            Nenhuma reserva encontrada
          </p>
        )}

        <div className="mt-4 text-center">
          <Link to="/bookings" className="btn btn-outline">
            Ver Todas as Reservas
          </Link>
        </div>
      </div>

      {/* Calendário Rápido (apenas para usuários) */}
      {!isAdmin && vessels && vessels.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-primary-600" />
            Agendamento Rápido
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Clique em uma embarcação para ver o calendário e fazer sua reserva rapidamente.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vessels.map((vessel: any) => (
              <Link
                key={vessel.id}
                to={`/bookings?vessel=${vessel.id}`}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Ship className="w-10 h-10 text-primary-600 mr-3" />
                    <div>
                      <h3 className="font-bold text-gray-900">{vessel.name}</h3>
                      {vessel.location && (
                        <p className="text-xs text-gray-500">{vessel.location}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-primary-600">
                    <Calendar className="w-6 h-6" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/vessels" className="card hover:shadow-lg transition-shadow">
          <Ship className="w-8 h-8 text-primary-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Embarcações</h3>
          <p className="text-sm text-gray-600">
            Visualize {isAdmin ? 'e gerencie' : 'suas'} embarcações {isAdmin ? 'disponíveis' : 'vinculadas'}
          </p>
        </Link>

        <Link to="/bookings" className="card hover:shadow-lg transition-shadow">
          <Calendar className="w-8 h-8 text-primary-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Agendamentos</h3>
          <p className="text-sm text-gray-600">
            {isAdmin ? 'Gerencie todas as reservas' : 'Faça e gerencie suas reservas'}
          </p>
        </Link>

        {isAdmin ? (
          <Link to="/users" className="card hover:shadow-lg transition-shadow">
            <Users className="w-8 h-8 text-primary-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Usuários</h3>
            <p className="text-sm text-gray-600">
              Gerencie usuários e permissões
            </p>
          </Link>
        ) : (
          <Link to="/notifications" className="card hover:shadow-lg transition-shadow">
            <AlertCircle className="w-8 h-8 text-primary-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Informações</h3>
            <p className="text-sm text-gray-600">
              Avisos da marina, manutenções e informações
            </p>
          </Link>
        )}
      </div>
    </div>
  );
}

