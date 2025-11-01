import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Edit2, Trash2, Shield, Ship, Search, X } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [vesselFinancials, setVesselFinancials] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [vesselFilter, setVesselFilter] = useState<string>('');

  // Função para inicializar os dados financeiros quando abrir o modal
  const initializeVesselFinancials = (user: any) => {
    if (user?.vessels && user.vessels.length > 0) {
      // Carregar dados existentes
      const financials = user.vessels.map((uv: any) => ({
        vesselId: uv.vessel.id,
        totalValue: uv.totalValue || 0,
        downPayment: uv.downPayment || 0,
        totalInstallments: uv.totalInstallments || 0,
        marinaMonthlyFee: uv.marinaMonthlyFee || 0,
        marinaDueDay: uv.marinaDueDay || 5
      }));
      setVesselFinancials(financials);
    } else {
      // Limpar dados se não há embarcações
      setVesselFinancials([]);
    }
  };

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data as any[];
    },
  });

  // Filtrar usuários
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter((user: any) => {
      // Busca por nome ou email
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          user.name?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      // Filtro de status
      if (statusFilter && user.status !== statusFilter) {
        return false;
      }
      
      // Filtro de embarcação
      if (vesselFilter) {
        const hasVessel = user.vessels?.some((uv: any) => uv.vessel.id === vesselFilter);
        if (!hasVessel) return false;
      }
      
      return true;
    });
  }, [users, searchTerm, statusFilter, vesselFilter]);

  const total = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paginatedUsers = useMemo(() => {
    if (!filteredUsers) return [];
    const start = (page - 1) * limit;
    return filteredUsers.slice(start, start + limit);
  }, [filteredUsers, page, limit]);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, vesselFilter]);

  // Buscar embarcações para o formulário
  const { data: vessels } = useQuery({
    queryKey: ['vessels'],
    queryFn: async () => {
      const { data } = await api.get('/vessels');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingUser) {
        return api.put(`/users/${editingUser.id}`, data);
      }
      return api.post('/users', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(editingUser ? 'Usuário atualizado!' : 'Usuário criado!');
      setShowModal(false);
      setEditingUser(null);
    },
    onError: (error: any) => {
      // Mostrar mensagem de erro mais detalhada
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message ||
                          error.message ||
                          'Erro ao salvar usuário';
      
      // Se for erro de validação Zod, mostrar detalhes
      if (error.response?.data?.details && Array.isArray(error.response.data.details)) {
        const details = error.response.data.details;
        const detailsText = details.map((detail: any) => 
          `${detail.field}: ${detail.message}`
        ).join(', ');
        toast.error(`Erro de validação: ${detailsText}`, { duration: 6000 });
      } else if (error.response?.data?.issues && Array.isArray(error.response.data.issues)) {
        const issues = error.response.data.issues;
        const detailsText = issues.map((issue: any) => 
          `${issue.path?.join('.') || 'campo'}: ${issue.message}`
        ).join(', ');
        toast.error(`Erro de validação: ${detailsText}`, { duration: 6000 });
      } else {
        toast.error(errorMessage);
      }
      
      console.error('Erro ao salvar usuário:', error.response?.data || error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário excluído!');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Função auxiliar para limpar strings vazias
    const cleanValue = (value: FormDataEntryValue | null) => {
      if (!value || value === '') return undefined;
      return value;
    };

    // Função auxiliar para converter número
    const parseNumber = (value: FormDataEntryValue | null) => {
      if (!value || value === '') return undefined;
      const num = parseInt(value as string);
      return isNaN(num) ? undefined : num;
    };

    const data: any = {
      name: cleanValue(formData.get('name')),
      email: cleanValue(formData.get('email')),
      phone: cleanValue(formData.get('phone')),
      // Campos adicionais
      birthDate: cleanValue(formData.get('birthDate')),
      licenseType: cleanValue(formData.get('licenseType')),
      registrationNumber: cleanValue(formData.get('registrationNumber')),
      licenseExpiry: cleanValue(formData.get('licenseExpiry')),
      billingDueDay: parseNumber(formData.get('billingDueDay')),
      // Dados de endereço
      address: cleanValue(formData.get('address')),
      zipCode: cleanValue(formData.get('zipCode')),
      addressNumber: cleanValue(formData.get('addressNumber')),
      state: cleanValue(formData.get('state')),
      neighborhood: cleanValue(formData.get('neighborhood')),
      city: cleanValue(formData.get('city')),
      complement: cleanValue(formData.get('complement')),
    };

    // Remover campos undefined
    Object.keys(data).forEach(key => {
      if (data[key] === undefined || data[key] === '') {
        delete data[key];
      }
    });

    if (!editingUser) {
      // Para criação de usuário, usar CPF como senha
      const cpf = cleanValue(formData.get('cpf')) as string | undefined;
      // Remover caracteres não numéricos do CPF
      const cleanCpf = cpf ? cpf.replace(/\D/g, '') : undefined;
      
      if (cleanCpf && cleanCpf.length === 11) {
        data.cpf = cleanCpf; // CPF será usado como senha
      } else {
        const password = cleanValue(formData.get('password')) as string | undefined;
        if (password && password.length >= 6) {
          data.password = password;
        } else if (!cleanCpf || cleanCpf.length !== 11) {
          // Se CPF não foi fornecido ou está inválido, e não há senha, mostrar erro
          toast.error('CPF deve ter 11 dígitos ou informe uma senha com no mínimo 6 caracteres');
          return;
        }
      }
      
      const role = cleanValue(formData.get('role'));
      if (role) {
        data.role = role;
      }

      // Filtrar e validar vesselFinancials
      const validVesselFinancials = vesselFinancials.filter(f => 
        f.vesselId && (
          (f.totalValue && f.totalValue > 0) || 
          (f.downPayment && f.downPayment > 0) || 
          (f.totalInstallments && f.totalInstallments > 0) || 
          (f.marinaMonthlyFee && f.marinaMonthlyFee > 0)
        )
      ).map(f => ({
        vesselId: f.vesselId,
        totalValue: f.totalValue || 0,
        downPayment: f.downPayment || 0,
        totalInstallments: f.totalInstallments || 0,
        marinaMonthlyFee: f.marinaMonthlyFee || 0,
        marinaDueDay: f.marinaDueDay || 5
      }));

      if (validVesselFinancials.length > 0) {
        data.vesselFinancials = validVesselFinancials;
      }
    } else {
      const status = cleanValue(formData.get('status'));
      if (status) {
        data.status = status;
      }

      // Filtrar e validar vesselFinancials
      const validVesselFinancials = vesselFinancials.filter(f => 
        f.vesselId && (
          (f.totalValue && f.totalValue > 0) || 
          (f.downPayment && f.downPayment > 0) || 
          (f.totalInstallments && f.totalInstallments > 0) || 
          (f.marinaMonthlyFee && f.marinaMonthlyFee > 0)
        )
      ).map(f => ({
        vesselId: f.vesselId,
        totalValue: f.totalValue || 0,
        downPayment: f.downPayment || 0,
        totalInstallments: f.totalInstallments || 0,
        marinaMonthlyFee: f.marinaMonthlyFee || 0,
        marinaDueDay: f.marinaDueDay || 5
      }));

      if (validVesselFinancials.length > 0) {
        data.vesselFinancials = validVesselFinancials;
      }
    }

    createMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-600 mt-1">Gerencie os usuários do sistema</p>
        </div>
        <button onClick={() => { 
          setEditingUser(null); 
          setVesselFinancials([]);
          setShowModal(true); 
        }} className="btn btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Novo Usuário
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="card p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Campo de Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full pl-10 pr-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtro de Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full"
            >
              <option value="">Todos os Status</option>
              <option value="ACTIVE">✅ Ativo</option>
              <option value="OVERDUE">⏰ Em Atraso</option>
              <option value="OVERDUE_PAYMENT">💳 Inadimplente</option>
              <option value="BLOCKED">🚫 Bloqueado</option>
            </select>
          </div>

          {/* Filtro de Embarcação */}
          <div>
            <select
              value={vesselFilter}
              onChange={(e) => setVesselFilter(e.target.value)}
              className="input w-full"
            >
              <option value="">Todas as Embarcações</option>
              {vessels?.map((vessel: any) => (
                <option key={vessel.id} value={vessel.id}>
                  🚤 {vessel.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botão para limpar filtros */}
        {(searchTerm || statusFilter || vesselFilter) && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setVesselFilter('');
              }}
              className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      <div className="card overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-600">
            Total: <span className="font-medium">{total}</span>
            {total !== (users?.length || 0) && (
              <span className="text-gray-400 ml-2">
                (de {users?.length || 0} usuários)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Itens por página:</span>
            <select
              className="input bg-white text-gray-900 text-sm"
              value={limit}
              onChange={(e) => { setPage(1); setLimit(parseInt(e.target.value)); }}
            >
              {[5,10,20,50].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
        <table className="table">
          <thead className="table-head">
            <tr>
              <th className="table-header">Nome</th>
              <th className="table-header">Email</th>
              <th className="table-header">Embarcações</th>
              <th className="table-header">Status</th>
              <th className="table-header">Perfil</th>
              <th className="table-header">Ações</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {paginatedUsers?.map((user: any) => (
              <tr key={user.id}>
                <td className="table-cell font-medium">{user.name}</td>
                <td className="table-cell">{user.email}</td>
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
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role === 'ADMIN' ? 'Admin' : 'Usuário'}
                  </span>
                </td>
                <td className="table-cell space-x-2">
                  <button 
                    onClick={() => { 
                      setEditingUser(user); 
                      initializeVesselFinancials(user);
                      setShowModal(true); 
                    }} 
                    className="btn btn-outline text-xs px-3 py-1"
                    title="Editar usuário"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => { 
                      setEditingUser(user); 
                      initializeVesselFinancials(user);
                      setShowModal(true);
                    }} 
                    className="btn btn-primary text-xs px-3 py-1"
                    title="Gerenciar embarcações"
                  >
                    <Ship className="w-3 h-3" />
                  </button>
                  <button onClick={() => { if(confirm('Excluir?')) deleteMutation.mutate(user.id); }} className="btn btn-danger text-xs px-3 py-1">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between mt-3">
          <button
            className="btn btn-outline px-3 py-1 text-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </button>
          <div className="text-sm text-gray-600">
            Página <span className="font-medium">{page}</span> de <span className="font-medium">{totalPages}</span>
          </div>
          <button
            className="btn btn-outline px-3 py-1 text-sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Próxima
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nome *</label>
                <input name="name" type="text" defaultValue={editingUser?.name} className="input bg-white text-gray-900" required />
              </div>
              <div>
                <label className="label">Email *</label>
                <input name="email" type="email" defaultValue={editingUser?.email} className="input bg-white text-gray-900" required disabled={!!editingUser} />
              </div>
              {!editingUser && (
                <>
                  <div>
                    <label className="label">Senha *</label>
                    <input name="password" type="password" className="input bg-white text-gray-900" placeholder="Senha padrão (opcional)" />
                    <p className="text-xs text-gray-500 mt-1">
                      Deixe em branco para usar apenas o CPF como senha
                    </p>
                  </div>
                  <div>
                    <label className="label">Perfil *</label>
                    <select name="role" className="input bg-white text-gray-900" required>
                      <option value="USER">Usuário</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="label">Telefone</label>
                <input name="phone" type="tel" defaultValue={editingUser?.phone} className="input bg-white text-gray-900" placeholder="(11) 99999-9999" />
              </div>
              
              {/* Campos adicionais para dados pessoais */}
              {!editingUser && (
                <>
                  <div>
                    <label className="label">Data de Nascimento</label>
                    <input name="birthDate" type="date" className="input bg-white text-gray-900" />
                  </div>
                  
                  <div>
                    <label className="label">Tipo de Licença</label>
                    <select name="licenseType" className="input bg-white text-gray-900">
                      <option value="">Selecione...</option>
                      <option value="ARRAIS_AMADOR">Arrais Amador</option>
                      <option value="MOTONAUTA">Motonauta</option>
                      <option value="ARRAIS_AMADOR_MOTONAUTA">Arrais Amador e Motonauta</option>
                      <option value="MESTRE_AMADOR">Mestre Amador</option>
                      <option value="CAPITAO_AMADOR">Capitão Amador</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="label">Número da Inscrição</label>
                    <input name="registrationNumber" type="text" className="input bg-white text-gray-900" placeholder="Número da inscrição na marinha" />
                  </div>
                  
                  <div>
                    <label className="label">Data de Validade da Licença</label>
                    <input name="licenseExpiry" type="date" className="input bg-white text-gray-900" />
                  </div>
                  
                  <div>
                    <label className="label">Dia de Vencimento do Boleto</label>
                    <select name="billingDueDay" className="input bg-white text-gray-900">
                      <option value="">Selecione...</option>
                      {Array.from({length: 31}, (_, i) => (
                        <option key={i+1} value={i+1}>{i+1}º dia</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Seção de Endereço */}
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Dados de Endereço</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="label">Endereço</label>
                        <input name="address" type="text" className="input bg-white text-gray-900" placeholder="Rua, Avenida, etc." />
                      </div>
                      <div>
                        <label className="label">CEP</label>
                        <input name="zipCode" type="text" className="input bg-white text-gray-900" placeholder="00000-000" />
                      </div>
                      <div>
                        <label className="label">Nº</label>
                        <input name="addressNumber" type="text" className="input bg-white text-gray-900" placeholder="123" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="label">Estado</label>
                        <select name="state" className="input bg-white text-gray-900">
                          <option value="">Selecione...</option>
                          <option value="SP">São Paulo</option>
                          <option value="RJ">Rio de Janeiro</option>
                          <option value="SC">Santa Catarina</option>
                          <option value="RS">Rio Grande do Sul</option>
                          <option value="PR">Paraná</option>
                          <option value="BA">Bahia</option>
                          <option value="ES">Espírito Santo</option>
                          <option value="PE">Pernambuco</option>
                          <option value="CE">Ceará</option>
                          <option value="MG">Minas Gerais</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Bairro</label>
                        <input name="neighborhood" type="text" className="input bg-white text-gray-900" placeholder="Bairro" />
                      </div>
                      <div>
                        <label className="label">Cidade</label>
                        <input name="city" type="text" className="input bg-white text-gray-900" placeholder="Cidade" />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="label">Complemento</label>
                      <input name="complement" type="text" className="input bg-white text-gray-900" placeholder="Apartamento, casa, etc." />
                    </div>
                  </div>
                </>
              )}
              {!editingUser && (
                <div>
                  <label className="label">CPF (será usado como senha) *</label>
                  <input 
                    name="cpf" 
                    type="text" 
                    placeholder="12345678901" 
                    className="input bg-white text-gray-900" 
                    pattern="[0-9]{11}"
                    maxLength={11}
                    required
                    onChange={(e) => {
                      // Remover caracteres não numéricos
                      const value = e.target.value.replace(/\D/g, '');
                      e.target.value = value;
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Digite apenas os números (11 dígitos). Exemplo: 12345678901
                  </p>
                </div>
              )}
              {editingUser && (
                <div>
                  <label className="label">Status do Usuário</label>
                  <select name="status" className="input bg-white text-gray-900" defaultValue={editingUser?.status || 'ACTIVE'}>
                    <option value="ACTIVE">✅ Ativo</option>
                    <option value="OVERDUE">⏰ Em Atraso</option>
                    <option value="OVERDUE_PAYMENT">💳 Inadimplente</option>
                    <option value="BLOCKED">🚫 Bloqueado</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    • Bloqueado: não pode fazer reservas<br/>
                    • Inadimplente/Em Atraso: aviso para regularizar
                  </p>
                </div>
              )}

              {/* Seleção de Embarcações */}
              <div>
                <label className="label">Embarcações Vinculadas</label>
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-3">
                    Selecione as embarcações que este usuário pode usar:
                  </p>
                  {vessels?.map((vessel: any) => {
                    const userVessel = editingUser?.vessels?.find((uv: any) => uv.vessel.id === vessel.id);
                    const isSelected = vesselFinancials.some(f => f.vesselId === vessel.id);
                    
                    return (
                      <div key={vessel.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  // Adicionar embarcação
                                  setVesselFinancials([...vesselFinancials, {
                                    vesselId: vessel.id,
                                    totalValue: userVessel?.totalValue || 0,
                                    downPayment: userVessel?.downPayment || 0,
                                    totalInstallments: userVessel?.totalInstallments || 0,
                                    marinaMonthlyFee: userVessel?.marinaMonthlyFee || 0,
                                    marinaDueDay: userVessel?.marinaDueDay || 5
                                  }]);
                                } else {
                                  // Remover embarcação
                                  setVesselFinancials(vesselFinancials.filter(f => f.vesselId !== vessel.id));
                                }
                              }}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="font-semibold text-gray-900">🚤 {vessel.name}</span>
                          </label>
                          {userVessel && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Vinculada</span>}
                        </div>

                        {/* Campos financeiros - só aparecem se a embarcação estiver selecionada */}
                        {isSelected && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h5 className="font-medium text-gray-900 mb-3">💰 Dados Financeiros</h5>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-medium text-gray-700">Valor Total (R$)</label>
                            <input 
                              type="number" 
                              step="0.01"
                              className="input text-sm bg-white text-gray-900" 
                              placeholder="0.00"
                              value={vesselFinancials.find(f => f.vesselId === vessel.id)?.totalValue || ''}
                              onChange={(e) => {
                                const newFinancials = [...vesselFinancials];
                                const index = newFinancials.findIndex(f => f.vesselId === vessel.id);
                                if (index >= 0) {
                                  newFinancials[index].totalValue = parseFloat(e.target.value) || 0;
                                } else {
                                  newFinancials.push({
                                    vesselId: vessel.id,
                                    totalValue: parseFloat(e.target.value) || 0,
                                    downPayment: 0,
                                    totalInstallments: 0,
                                    marinaMonthlyFee: 0,
                                    marinaDueDay: 5
                                  });
                                }
                                setVesselFinancials(newFinancials);
                              }}
                            />
                          </div>
                          
                          <div>
                            <label className="text-xs font-medium text-gray-700">Valor de Entrada (R$)</label>
                            <input 
                              type="number" 
                              step="0.01"
                              className="input text-sm bg-white text-gray-900" 
                              placeholder="0.00"
                              value={vesselFinancials.find(f => f.vesselId === vessel.id)?.downPayment || ''}
                              onChange={(e) => {
                                const newFinancials = [...vesselFinancials];
                                const index = newFinancials.findIndex(f => f.vesselId === vessel.id);
                                if (index >= 0) {
                                  newFinancials[index].downPayment = parseFloat(e.target.value) || 0;
                                } else {
                                  newFinancials.push({
                                    vesselId: vessel.id,
                                    totalValue: 0,
                                    downPayment: parseFloat(e.target.value) || 0,
                                    totalInstallments: 0,
                                    marinaMonthlyFee: 0,
                                    marinaDueDay: 5
                                  });
                                }
                                setVesselFinancials(newFinancials);
                              }}
                            />
                          </div>
                          
                          <div>
                            <label className="text-xs font-medium text-gray-700">Quantidade de Parcelas</label>
                            <input 
                              type="number" 
                              className="input text-sm bg-white text-gray-900" 
                              placeholder="0"
                              value={vesselFinancials.find(f => f.vesselId === vessel.id)?.totalInstallments || ''}
                              onChange={(e) => {
                                const newFinancials = [...vesselFinancials];
                                const index = newFinancials.findIndex(f => f.vesselId === vessel.id);
                                if (index >= 0) {
                                  newFinancials[index].totalInstallments = parseInt(e.target.value) || 0;
                                } else {
                                  newFinancials.push({
                                    vesselId: vessel.id,
                                    totalValue: 0,
                                    downPayment: 0,
                                    totalInstallments: parseInt(e.target.value) || 0,
                                    marinaMonthlyFee: 0,
                                    marinaDueDay: 5
                                  });
                                }
                                setVesselFinancials(newFinancials);
                              }}
                            />
                          </div>
                          
                          <div>
                            <label className="text-xs font-medium text-gray-700">Taxa Mensal Marina (R$)</label>
                            <input 
                              type="number" 
                              step="0.01"
                              className="input text-sm bg-white text-gray-900" 
                              placeholder="0.00"
                              value={vesselFinancials.find(f => f.vesselId === vessel.id)?.marinaMonthlyFee || ''}
                              onChange={(e) => {
                                const newFinancials = [...vesselFinancials];
                                const index = newFinancials.findIndex(f => f.vesselId === vessel.id);
                                if (index >= 0) {
                                  newFinancials[index].marinaMonthlyFee = parseFloat(e.target.value) || 0;
                                } else {
                                  newFinancials.push({
                                    vesselId: vessel.id,
                                    totalValue: 0,
                                    downPayment: 0,
                                    totalInstallments: 0,
                                    marinaMonthlyFee: parseFloat(e.target.value) || 0,
                                    marinaDueDay: 5
                                  });
                                }
                                setVesselFinancials(newFinancials);
                              }}
                            />
                          </div>
                          
                          <div className="col-span-2">
                            <label className="text-xs font-medium text-gray-700">Dia de Vencimento da Marina</label>
                            <select 
                              className="input text-sm bg-white text-gray-900"
                              value={vesselFinancials.find(f => f.vesselId === vessel.id)?.marinaDueDay || 5}
                              onChange={(e) => {
                                const newFinancials = [...vesselFinancials];
                                const index = newFinancials.findIndex(f => f.vesselId === vessel.id);
                                if (index >= 0) {
                                  newFinancials[index].marinaDueDay = parseInt(e.target.value);
                                } else {
                                  newFinancials.push({
                                    vesselId: vessel.id,
                                    totalValue: 0,
                                    downPayment: 0,
                                    totalInstallments: 0,
                                    marinaMonthlyFee: 0,
                                    marinaDueDay: parseInt(e.target.value)
                                  });
                                }
                                setVesselFinancials(newFinancials);
                              }}
                            >
                              {Array.from({length: 31}, (_, i) => (
                                <option key={i+1} value={i+1}>{i+1}º dia</option>
                              ))}
                            </select>
                          </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowModal(false); setEditingUser(null); }} className="flex-1 btn btn-outline">
                  Cancelar
                </button>
                <button type="submit" disabled={createMutation.isPending} className="flex-1 btn btn-primary">
                  {createMutation.isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
