import { Router } from 'express';

const router = Router();

const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Embarcações API',
    version: '1.0.0',
    description: 'API para sistema de gerenciamento de agendamentos de embarcações',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    { url: '/api', description: 'Servidor Principal' },
  ],
  tags: [
    { name: 'Auth', description: 'Autenticação e autorização' },
    { name: 'Users', description: 'Gerenciamento de usuários' },
    { name: 'Vessels', description: 'Gerenciamento de embarcações' },
    { name: 'Bookings', description: 'Reservas e agendamentos' },
    { name: 'Notifications', description: 'Notificações do sistema' },
    { name: 'Financial', description: 'Informações financeiras' },
    { name: 'Health', description: 'Health checks e status do sistema' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', description: 'Mensagem de erro' },
          statusCode: { type: 'number', description: 'Código HTTP' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['ADMIN', 'USER'] },
          status: { type: 'string', enum: ['ACTIVE', 'OVERDUE', 'OVERDUE_PAYMENT', 'BLOCKED'] },
          phone: { type: 'string' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Booking: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          vesselId: { type: 'string', format: 'uuid' },
          bookingDate: { type: 'string', format: 'date' },
          status: { type: 'string', enum: ['PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED'] },
          notes: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Vessel: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string' },
          capacity: { type: 'number' },
          location: { type: 'string' },
          imageUrl: { type: 'string', format: 'uri' },
          isActive: { type: 'boolean' },
          calendarDaysAhead: { type: 'number' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check básico',
        description: 'Verifica se o servidor está funcionando',
        responses: {
          '200': {
            description: 'Servidor funcionando',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' },
                    uptime: { type: 'number' },
                    environment: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/health/detailed': {
      get: {
        tags: ['Health'],
        summary: 'Health check detalhado',
        description: 'Verifica status do servidor e dependências (banco, n8n)',
        responses: {
          '200': {
            description: 'Status do sistema',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                    checks: {
                      type: 'object',
                      properties: {
                        database: { type: 'object' },
                        n8n: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
          },
          '503': {
            description: 'Serviço indisponível',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        description: 'Autentica usuário e retorna tokens de acesso',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login realizado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Credenciais inválidas',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh token',
        description: 'Renova o token de acesso usando refresh token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Token renovado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Token inválido',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Perfil do usuário',
        description: 'Retorna informações do usuário autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Perfil do usuário',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          '401': {
            description: 'Não autenticado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout',
        description: 'Invalida o refresh token',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Logout realizado',
          },
          '401': {
            description: 'Não autenticado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'Listar usuários',
        description: 'Retorna lista de usuários (apenas Admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de usuários',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
          '403': {
            description: 'Acesso negado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Criar usuário',
        description: 'Cria novo usuário (apenas Admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'name'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                  name: { type: 'string' },
                  role: { type: 'string', enum: ['ADMIN', 'USER'] },
                  phone: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Usuário criado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          '403': {
            description: 'Acesso negado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Buscar usuário por ID',
        description: 'Retorna detalhes do usuário (apenas Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Usuário encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          '404': {
            description: 'Usuário não encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/users/change-password': {
      post: {
        tags: ['Users'],
        summary: 'Alterar senha',
        description: 'Altera a senha do usuário autenticado',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string' },
                  newPassword: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Senha alterada com sucesso',
          },
          '401': {
            description: 'Senha atual incorreta',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/vessels': {
      get: {
        tags: ['Vessels'],
        summary: 'Listar embarcações',
        description: 'Retorna lista de embarcações ativas',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de embarcações',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Vessel' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Vessels'],
        summary: 'Criar embarcação',
        description: 'Cria nova embarcação (apenas Admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  capacity: { type: 'number' },
                  location: { type: 'string' },
                  imageUrl: { type: 'string', format: 'uri' },
                  maxActiveBookings: { type: 'number' },
                  calendarDaysAhead: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Embarcação criada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Vessel' },
              },
            },
          },
          '403': {
            description: 'Acesso negado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/bookings': {
      get: {
        tags: ['Bookings'],
        summary: 'Listar reservas',
        description: 'Retorna lista de reservas do usuário ou todas (se Admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de reservas',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Booking' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Bookings'],
        summary: 'Criar reserva',
        description: 'Cria nova reserva para uma embarcação',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['vesselId', 'bookingDate'],
                properties: {
                  vesselId: { type: 'string', format: 'uuid' },
                  bookingDate: { type: 'string', format: 'date' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Reserva criada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Booking' },
              },
            },
          },
          '400': {
            description: 'Data inválida ou indisponível',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/bookings/calendar/{vesselId}': {
      get: {
        tags: ['Bookings'],
        summary: 'Calendário da embarcação',
        description: 'Retorna calendário com reservas e datas bloqueadas',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'vesselId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'startDate',
            in: 'query',
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'endDate',
            in: 'query',
            schema: { type: 'string', format: 'date' },
          },
        ],
        responses: {
          '200': {
            description: 'Calendário retornado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    bookings: { type: 'array' },
                    blockedDates: { type: 'array' },
                    weeklyBlocks: { type: 'array' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/notifications/my-notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Minhas notificações',
        description: 'Retorna notificações do usuário autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de notificações',
          },
        },
      },
    },
    '/notifications/unread-count': {
      get: {
        tags: ['Notifications'],
        summary: 'Contagem de não lidas',
        description: 'Retorna quantidade de notificações não lidas',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Contagem de não lidas',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    count: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/financial/my-financials': {
      get: {
        tags: ['Financial'],
        summary: 'Minhas informações financeiras',
        description: 'Retorna informações financeiras do usuário autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Informações financeiras',
          },
        },
      },
    },
  },
};

router.get('/openapi.json', (_req, res) => {
  res.json(openapi);
});

router.get('/docs', (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html>
  <head>
    <title>Embarcações API Docs</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.css" />
  </head>
  <body>
    <redoc spec-url="/api/openapi.json"></redoc>
    <script src="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"></script>
  </body>
</html>`);
});

export default router;
