# 🚤 Sistema de Agendamento de Embarcações

SaaS completo para gestão de agendamentos de embarcações com acesso diferenciado para Admins e Usuários.

## 🎯 Funcionalidades

### 👨‍💼 Admin
- ✅ Criar e gerenciar usuários
- ✅ Cadastrar embarcações e vincular múltiplos usuários
- ✅ Bloquear datas (manutenção, inadimplência)
- ✅ Configurar limites de reservas por embarcação
- ✅ Painel centralizado de gestão com filtros avançados
- ✅ Histórico completo de ações

### 👤 Usuário
- ✅ Visualizar calendário das embarcações vinculadas
- ✅ Criar reservas (mínimo 24h de antecedência)
- ✅ Cancelar reservas
- ✅ Visualizar histórico pessoal
- ✅ Receber avisos no painel

### 📱 Notificações WhatsApp (via n8n)
- ✅ Notificações de novos agendamentos
- ✅ Notificações de cancelamentos
- ✅ Grupos por embarcação para admins
- ✅ Mensagens individuais para clientes

## 🛠 Stack Tecnológica

### Backend
- Node.js 20 + Express + TypeScript
- Prisma ORM
- PostgreSQL 15
- JWT Authentication
- Zod Validation

### Frontend
- React 18 + TypeScript
- Vite
- TanStack Query
- React Router
- Tailwind CSS + shadcn/ui
- FullCalendar

### Infraestrutura
- Docker + Docker Compose
- Nginx (Reverse Proxy)
- Ubuntu Server com VPN
- n8n para automações

## 🚀 Instalação Rápida

### Pré-requisitos
- Node.js 20+
- Docker e Docker Compose
- PostgreSQL 15+ (ou via Docker)

### 1. Clone e Configure

```bash
# Clone o repositório
cd Inffinity

# Copie as variáveis de ambiente
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Configure as variáveis no backend/.env
```

### 2. Rode com Docker (Recomendado)

```bash
# Inicia todos os serviços (backend, frontend, postgres)
docker-compose up -d

# Rode as migrations
docker-compose exec backend npm run prisma:migrate

# Crie o usuário admin inicial
docker-compose exec backend npm run seed
```

O sistema estará disponível em:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Banco de dados: localhost:5432

### 3. Ou rode localmente

```bash
# Backend
cd backend
npm install
npm run prisma:migrate
npm run dev

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev
```

## 📦 Deploy em Ubuntu Server

### Instalação Completa

```bash
# 1. Instale as dependências
sudo apt update
sudo apt install -y nodejs npm postgresql docker.io docker-compose nginx

# 2. Clone o projeto
git clone <seu-repositorio>
cd Inffinity

# 3. Configure as variáveis de ambiente
cp backend/.env.example backend/.env
nano backend/.env  # Configure com dados de produção

# 4. Inicie com Docker
docker-compose -f docker-compose.prod.yml up -d

# 5. Configure Nginx (arquivo de exemplo em nginx.conf)
sudo cp nginx.conf /etc/nginx/sites-available/embarcacoes
sudo ln -s /etc/nginx/sites-available/embarcacoes /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 6. Configure SSL (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com
```

## 🔐 Credenciais Iniciais

Após rodar o seed:
- **Email:** admin@embarcacoes.com
- **Senha:** Admin@123

⚠️ **IMPORTANTE:** Altere a senha imediatamente após o primeiro login!

## 📱 Configuração WhatsApp (n8n)

### 1. Configure o n8n
```bash
# O n8n pode ser instalado via Docker
docker run -d --name n8n -p 5678:5678 n8nio/n8n
```

### 2. Configure o Webhook no Backend
No arquivo `backend/.env`:
```env
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/agendamentos
N8N_WEBHOOK_TOKEN=seu-token-secreto
```

### 3. Importe o Workflow
- Acesse n8n em http://localhost:5678
- Importe o arquivo `n8n-workflow.json`
- Configure suas credenciais de API do WhatsApp

## 📊 Regras de Negócio

### Agendamentos
- ✅ Antecedência mínima de 24 horas
- ✅ Não permite reserva no mesmo dia
- ✅ Limite configurável de reservas ativas por usuário
- ✅ Usuário só pode reservar novamente após primeira reserva passar

### Exemplo
```
Danilo tem limite de 2 reservas na "Infinity ONE"
Reservou: 19/10/25 e 22/10/25
Poderá reservar novamente em: 20/10/25 (após a primeira passar)
```

## 🗄 Estrutura do Banco

```
users           → Usuários (admin/user)
vessels         → Embarcações
user_vessels    → Vínculo usuário-embarcação
bookings        → Reservas/Agendamentos
blocked_dates   → Bloqueios de datas
booking_limits  → Limites de reservas
audit_logs      → Histórico de ações
notifications   → Avisos do sistema
```

## 🔧 Scripts Úteis

```bash
# Backend
npm run dev              # Desenvolvimento
npm run build            # Build de produção
npm run start            # Produção
npm run prisma:migrate   # Rodar migrations
npm run prisma:studio    # Interface visual do DB
npm run seed             # Criar dados iniciais

# Frontend
npm run dev              # Desenvolvimento
npm run build            # Build de produção
npm run preview          # Preview da build
```

## 📝 Endpoints da API

### Autenticação
```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh
GET    /api/auth/me
```

### Usuários (Admin)
```
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
```

### Embarcações
```
GET    /api/vessels
POST   /api/vessels           (Admin)
GET    /api/vessels/:id
PUT    /api/vessels/:id       (Admin)
DELETE /api/vessels/:id       (Admin)
POST   /api/vessels/:id/users (Admin)
```

### Agendamentos
```
GET    /api/bookings
POST   /api/bookings
GET    /api/bookings/:id
PUT    /api/bookings/:id
DELETE /api/bookings/:id
GET    /api/bookings/calendar/:vesselId
```

### Bloqueios (Admin)
```
GET    /api/blocked-dates
POST   /api/blocked-dates
DELETE /api/blocked-dates/:id
```

### Histórico
```
GET    /api/audit-logs
GET    /api/audit-logs/export
```

## 🔒 Segurança

- ✅ JWT com refresh tokens
- ✅ Senhas com bcrypt (12 rounds)
- ✅ Rate limiting
- ✅ CORS configurado
- ✅ Headers de segurança (helmet)
- ✅ Validação de entrada (Zod)
- ✅ Audit logs de todas as ações
- ✅ IP tracking

## 📈 Monitoramento

O sistema registra:
- Todas as ações de usuários (audit_logs)
- IPs de acesso
- Timestamps de criação/atualização
- Status de reservas

## 🤝 Suporte

Para dúvidas ou problemas:
1. Verifique os logs: `docker-compose logs -f`
2. Acesse o Prisma Studio: `npm run prisma:studio`
3. Verifique o status dos webhooks no n8n

## 📄 Licença

Proprietary - Todos os direitos reservados



