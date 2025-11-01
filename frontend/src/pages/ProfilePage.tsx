import { useAuthStore } from '@/stores/authStore';

export default function ProfilePage() {
  const { user } = useAuthStore();
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>
        <div className="space-y-4">
          <div>
            <label className="label">Nome</label>
            <p className="text-lg">{user?.name}</p>
          </div>
          <div>
            <label className="label">Email</label>
            <p className="text-lg">{user?.email}</p>
          </div>
          <div>
            <label className="label">Perfil</label>
            <p className="text-lg">{user?.role === 'ADMIN' ? 'Administrador' : 'Usuário'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}



