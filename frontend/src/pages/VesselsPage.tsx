import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ship, Plus, Edit2, Trash2, Users as UsersIcon, Calendar } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import OptimizedImage from '@/components/OptimizedImage';

export default function VesselsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editingVessel, setEditingVessel] = useState<any>(null);

  const { data: vessels, isLoading } = useQuery({
    queryKey: ['vessels'],
    queryFn: async () => {
      const { data } = await api.get(isAdmin ? '/vessels' : '/vessels/my-vessels');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingVessel) {
        return api.put(`/vessels/${editingVessel.id}`, data);
      }
      return api.post('/vessels', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vessels'] });
      toast.success(editingVessel ? 'Embarcação atualizada!' : 'Embarcação criada!');
      setShowModal(false);
      setEditingVessel(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao salvar embarcação');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vessels/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vessels'] });
      toast.success('Embarcação excluída!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao excluir embarcação');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      capacity: formData.get('capacity') ? parseInt(formData.get('capacity') as string) : undefined,
      location: formData.get('location'),
      imageUrl: formData.get('imageUrl'),
      maxActiveBookings: formData.get('maxActiveBookings') ? parseInt(formData.get('maxActiveBookings') as string) : 2,
    };
    createMutation.mutate(data);
  };

  const handleEdit = (vessel: any) => {
    setEditingVessel(vessel);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta embarcação?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewCalendar = (vessel: any) => {
    navigate(`/bookings?vessel=${vessel.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Embarcações</h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? 'Gerencie as embarcações do sistema' : 'Suas embarcações vinculadas'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setEditingVessel(null);
              setShowModal(true);
            }}
            className="btn btn-primary flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Embarcação
          </button>
        )}
      </div>

      {/* Vessels Grid */}
      {vessels && vessels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vessels.map((vessel: any) => (
            <div key={vessel.id} className="card hover:shadow-lg transition-shadow">
              {/* Image */}
              <div className="relative h-48 -mx-6 -mt-6 mb-4 bg-gradient-to-br from-blue-500 to-blue-700 rounded-t-lg overflow-hidden">
                {vessel.imageUrl ? (
                  <OptimizedImage
                    src={vessel.imageUrl}
                    alt={vessel.name}
                    className="w-full h-full"
                    width={400}
                    height={192}
                    loading="lazy"
                    objectFit="cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Ship className="w-24 h-24 text-white opacity-50" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{vessel.name}</h3>
                {vessel.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {vessel.description}
                  </p>
                )}

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {vessel.capacity && (
                    <div className="flex items-center">
                      <UsersIcon className="w-4 h-4 mr-2" />
                      Capacidade: {vessel.capacity} pessoas
                    </div>
                  )}
                  {vessel.location && (
                    <div className="flex items-center">
                      <span className="mr-2">📍</span>
                      {vessel.location}
                    </div>
                  )}
                  {vessel.bookingLimit && (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Limite: {vessel.bookingLimit.maxActiveBookings} reservas ativas
                    </div>
                  )}
                </div>

                {/* Stats */}
                {isAdmin && vessel._count && (
                  <div className="flex gap-4 mb-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary-600">
                        {vessel._count.bookings}
                      </p>
                      <p className="text-xs text-gray-500">Reservas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary-600">
                        {vessel.users?.length || 0}
                      </p>
                      <p className="text-xs text-gray-500">Usuários</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewCalendar(vessel)}
                    className="flex-1 btn btn-primary text-sm"
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    Agendar
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => handleEdit(vessel)}
                        className="btn btn-outline text-sm p-2"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(vessel.id)}
                        className="btn btn-danger text-sm p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Ship className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {isAdmin ? 'Nenhuma embarcação cadastrada' : 'Você não possui embarcações vinculadas'}
          </p>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary mt-4"
            >
              Cadastrar Primeira Embarcação
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingVessel ? 'Editar Embarcação' : 'Nova Embarcação'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Nome *</label>
                  <input
                    name="name"
                    type="text"
                    defaultValue={editingVessel?.name}
                    className="input bg-white text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="label">Descrição</label>
                  <textarea
                    name="description"
                    defaultValue={editingVessel?.description}
                    className="input bg-white text-gray-900"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Capacidade</label>
                    <input
                      name="capacity"
                      type="number"
                      defaultValue={editingVessel?.capacity}
                      className="input bg-white text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="label">Limite de Reservas Ativas</label>
                    <input
                      name="maxActiveBookings"
                      type="number"
                      defaultValue={editingVessel?.bookingLimit?.maxActiveBookings || 2}
                      className="input bg-white text-gray-900"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Localização</label>
                  <input
                    name="location"
                    type="text"
                    defaultValue={editingVessel?.location}
                    className="input bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="label">Dias à Frente no Calendário *</label>
                  <input
                    name="calendarDaysAhead"
                    type="number"
                    defaultValue={editingVessel?.calendarDaysAhead || 62}
                    className="input bg-white text-gray-900"
                    min="7"
                    max="365"
                    required
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Quantos dias à frente o calendário deve mostrar para reservas (padrão: 62 dias = 2 meses)
                  </p>
                </div>

                <div>
                  <label className="label">URL da Imagem</label>
                  <input
                    name="imageUrl"
                    type="url"
                    defaultValue={editingVessel?.imageUrl}
                    className="input bg-white text-gray-900"
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingVessel(null);
                    }}
                    className="flex-1 btn btn-outline"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 btn btn-primary"
                  >
                    {createMutation.isPending ? 'Salvando...' : 'Salvar'}
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

