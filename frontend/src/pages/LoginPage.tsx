import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ship, Mail, Lock } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [appName, setAppName] = useState('Sistema de Embarcações');

  useEffect(() => {
    (async () => {
      try {
        // Buscar nome do app do manifest público para evitar 401 em /admin/settings
        const resp = await fetch('/api/pwa/manifest.json', { cache: 'no-store' });
        if (resp.ok) {
          const manifest = await resp.json();
          const name = manifest?.name || 'Sistema de Embarcações';
          setAppName(name);
          document.title = name;
          return;
        }
      } catch (e) {
        // ignora e mantém padrão
      }
      document.title = 'Sistema de Embarcações';
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      toast.success('Login realizado com sucesso!');
      navigate('/');
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { error?: string } } };
      toast.error(apiError?.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 px-4">
      <div className="max-w-md w-full">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-600 mb-4">
            <Ship className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{appName}</h1>
          <p className="text-gray-600">
            Faça login para acessar o sistema
          </p>
        </div>

        {/* Formulário */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10 bg-white text-gray-900"
                  placeholder="seu@email.com"
                  disabled={loading}
                  required
                  aria-label="Email"
                  aria-required="true"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="label">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  aria-label="Senha"
                  aria-required="true"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 bg-white text-gray-900"
                  placeholder="••••••••"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3 text-lg"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-8">{appName} © 2025</p>
      </div>
    </div>
  );
}

