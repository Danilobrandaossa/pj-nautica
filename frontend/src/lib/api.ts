import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Função para obter token CSRF
let csrfToken: string | null = null;
let csrfTokenExpiry: number = 0;

async function getCSRFToken(): Promise<string | null> {
  // Se o token ainda é válido (com 5 min de margem), reutilizar
  if (csrfToken && csrfTokenExpiry > Date.now() + 5 * 60 * 1000) {
    return csrfToken;
  }

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }

    const response = await axios.get(`${API_URL}/csrf-token`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    csrfToken = response.data.csrfToken;
    // Token expira em 1 hora (3600 segundos)
    csrfTokenExpiry = Date.now() + (response.data.expiresIn * 1000 || 3600 * 1000);
    
    return csrfToken;
  } catch (error) {
    console.warn('Erro ao obter token CSRF:', error);
    return null;
  }
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token e CSRF
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    
    // Adicionar token CSRF para métodos mutáveis
    const mutableMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (mutableMethods.includes(config.method?.toUpperCase() || '')) {
      try {
        const csrf = await getCSRFToken();
        if (csrf) {
          config.headers['X-CSRF-Token'] = csrf;
        } else {
          // Se não conseguir obter token CSRF, logar aviso mas continuar
          // O backend pode estar configurado para não exigir CSRF em desenvolvimento
          console.warn('Token CSRF não obtido, mas continuando com a requisição');
        }
      } catch (error) {
        // Em caso de erro ao obter CSRF, continuar mesmo assim
        // O backend pode ter CSRF desabilitado em desenvolvimento
        console.warn('Erro ao obter token CSRF:', error);
      }
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Erro 401 - Token expirado
    if (error.response?.status === 401) {
      // Token expirado, tentar refresh
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });
          localStorage.setItem('token', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          
          // Limpar token CSRF para obter novo
          csrfToken = null;
          csrfTokenExpiry = 0;
          
          // Retry request original
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          
          // Obter novo token CSRF se for método mutável
          const mutableMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
          if (mutableMethods.includes(error.config.method?.toUpperCase() || '')) {
            const csrf = await getCSRFToken();
            if (csrf) {
              error.config.headers['X-CSRF-Token'] = csrf;
            }
          }
          
          return axios(error.config);
        } catch (refreshError: unknown) {
          // Refresh falhou, fazer logout
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    
    // Erro 403 - Token CSRF inválido ou expirado
    if (error.response?.status === 403 && error.response?.data?.error?.includes('CSRF')) {
      // Limpar token CSRF e tentar novamente
      csrfToken = null;
      csrfTokenExpiry = 0;
      
      const mutableMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
      if (mutableMethods.includes(error.config.method?.toUpperCase() || '')) {
        try {
          const csrf = await getCSRFToken();
          if (csrf && error.config) {
            error.config.headers['X-CSRF-Token'] = csrf;
            return axios(error.config);
          }
        } catch (csrfError) {
          console.error('Erro ao obter novo token CSRF:', csrfError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;


