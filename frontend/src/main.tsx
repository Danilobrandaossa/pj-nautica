import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 1,
      staleTime: 30000, // 30 segundos - dados ficam frescos por 30s
      gcTime: 600000, // 10 minutos - manter cache por 10min (antes era cacheTime no v4)
    },
  },
});

// Registrar Service Worker (TEMPORARIAMENTE DESATIVADO em produção)
// Motivo: estabilizar login/atualizações até finalizarmos ajustes do SW
// if ('serviceWorker' in navigator && import.meta.env.PROD) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker
//       .register('/api/pwa/service-worker.js', { scope: '/' })
//       .then((registration) => {
//         console.log('Service Worker registrado:', registration.scope);
//         setInterval(() => { registration.update(); }, 60 * 60 * 1000);
//       })
//       .catch((error) => {
//         console.error('Erro ao registrar Service Worker:', error);
//       });
//   });
// }

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);



