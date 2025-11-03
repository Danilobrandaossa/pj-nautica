import { Router, Request, Response, NextFunction } from 'express';
import { settingsService } from '../services/settings.service';

const router = Router();

// Middleware CORS para todas as rotas PWA (públicas)
router.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  return next();
});

/**
 * GET /api/pwa/manifest.json
 * Retorna o manifest.json dinâmico baseado nas configurações do sistema
 */
router.get('/manifest.json', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Buscar configurações PWA do banco
    const pwaName = await settingsService.get<string>('pwa.name', 'Sistema Embarcações');
    const pwaShortName = await settingsService.get<string>('pwa.shortName', 'Embarcações');
    const pwaDescription = await settingsService.get<string>('pwa.description', 'Sistema completo de agendamentos para embarcações');
    const pwaStartUrl = await settingsService.get<string>('pwa.startUrl', '/');
    const pwaDisplay = await settingsService.get<string>('pwa.display', 'standalone');
    const pwaThemeColor = await settingsService.get<string>('pwa.themeColor', '#3b82f6');
    const pwaBackgroundColor = await settingsService.get<string>('pwa.backgroundColor', '#ffffff');
    const pwaIconBase64 = await settingsService.get<string>('pwa.iconBase64', '');

    // Buscar URL do ícone ou usar padrão
    let iconUrl = '/icons/icon-192x192.png';
    if (pwaIconBase64) {
      // Se houver ícone em base64, usar endpoint específico
      iconUrl = '/api/pwa/icon';
    }

    const manifest = {
      name: pwaName,
      short_name: pwaShortName,
      description: pwaDescription,
      start_url: pwaStartUrl,
      display: pwaDisplay,
      background_color: pwaBackgroundColor,
      theme_color: pwaThemeColor,
      orientation: 'portrait-primary' as const,
      scope: '/',
      icons: [
        {
          src: iconUrl,
          sizes: '72x72',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: iconUrl,
          sizes: '96x96',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: iconUrl,
          sizes: '128x128',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: iconUrl,
          sizes: '144x144',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: iconUrl,
          sizes: '152x152',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: iconUrl,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: iconUrl,
          sizes: '384x384',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: iconUrl,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable any'
        }
      ],
      categories: ['business', 'productivity', 'utilities'],
      lang: 'pt-BR',
      shortcuts: [
        {
          name: 'Agendamentos',
          short_name: 'Agendamentos',
          description: 'Acessar sistema de agendamentos',
          url: '/bookings',
          icons: [
            {
              src: iconUrl,
              sizes: '96x96'
            }
          ]
        },
        {
          name: 'Minhas Finanças',
          short_name: 'Finanças',
          description: 'Visualizar situação financeira',
          url: '/my-financials',
          icons: [
            {
              src: iconUrl,
              sizes: '96x96'
            }
          ]
        }
      ]
    };

    res.setHeader('Content-Type', 'application/manifest+json');
    res.json(manifest);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/pwa/icon
 * Retorna o ícone do PWA em base64 (se configurado)
 */
router.get('/icon', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const iconBase64 = await settingsService.get<string>('pwa.iconBase64', '');
    
    if (!iconBase64) {
      return res.redirect('/icons/icon-192x192.png');
    }

    // Extrair data URL do base64
    const base64Data = iconBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(imageBuffer);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/pwa/service-worker.js
 * Retorna o service worker dinâmico baseado nas configurações
 */
router.get('/service-worker.js', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const offlineEnabled = await settingsService.get<boolean>('pwa.offlineEnabled', true);
    const autoUpdate = await settingsService.get<boolean>('pwa.autoUpdate', true);

    const cacheVersion = `embarcacoes-v${Date.now()}`;
    
    const serviceWorker = `
const CACHE_NAME = '${cacheVersion}';
const OFFLINE_ENABLED = ${offlineEnabled};
const AUTO_UPDATE = ${autoUpdate};

// Recursos para cache
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event
self.addEventListener('install', (event) => {
  if (self.location.hostname === 'localhost') {
    self.skipWaiting();
    return;
  }

  if (!OFFLINE_ENABLED) {
    return;
  }

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache:', CACHE_NAME);
      return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
    }).catch((error) => {
      console.error('Cache install failed:', error);
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  if (self.location.hostname === 'localhost') {
    event.waitUntil(
      (async () => {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
        await self.registration.unregister();
        const allClients = await self.clients.matchAll({ includeUncontrolled: true });
        allClients.forEach((client) => client.navigate(client.url));
      })()
    );
    return;
  }

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - Cache First Strategy
self.addEventListener('fetch', (event) => {
  // Bypass para localhost/dev
  if (self.location.hostname === 'localhost') {
    return;
  }

  if (!OFFLINE_ENABLED) {
    return;
  }

  // Ignorar requisições para API
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - retornar do cache
      if (response) {
        return response;
      }

      // Cache miss - buscar da rede
      return fetch(event.request).then((response) => {
        // Verificar se resposta é válida
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clonar resposta para cache
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Offline - retornar página offline ou fallback
        if (event.request.destination === 'document') {
          return caches.match('/offline.html');
        }
        // Para outros recursos, tentar retornar do cache genérico
        return caches.match(event.request);
      })
    )
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      handleOfflineActions()
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Nova notificação',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || ''
      },
      actions: [
        {
          action: 'explore',
          title: 'Ver Detalhes',
          icon: '/icons/icon-96x96.png'
        },
        {
          action: 'close',
          title: 'Fechar',
          icon: '/icons/icon-96x96.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Notificação', options)
    );
  }
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/notifications')
    );
  }
});

// Auto-update check
if (AUTO_UPDATE) {
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });

  // Check for updates every hour
  setInterval(() => {
    self.registration.update().catch(() => {
      // Silently fail
    });
  }, 3600000);
}

// Handle offline actions
async function handleOfflineActions() {
  try {
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        await removeOfflineAction(action.id);
      } catch (error) {
        console.error('Failed to sync offline action:', error);
      }
    }
  } catch (error) {
    console.error('Error handling offline actions:', error);
  }
}

// IndexedDB functions for offline storage
function getOfflineActions() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EmbarcacoesOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offlineActions'], 'readonly');
      const store = transaction.objectStore('offlineActions');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offlineActions')) {
        db.createObjectStore('offlineActions', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function removeOfflineAction(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EmbarcacoesOffline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offlineActions'], 'readwrite');
      const store = transaction.objectStore('offlineActions');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}
    `.trim();

    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Service-Worker-Allowed', '/');
    // Evitar cache agressivo do service worker
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(serviceWorker);
  } catch (error) {
    next(error);
  }
});

export default router;




