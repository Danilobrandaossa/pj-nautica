# 🌊 OVERVIEW COMPLETO DO SISTEMA - Infinity Náutica

**Gerado em:** $(date)  
**Versão:** 2.0  
**Status:** Em Produção - app.infinitynautica.com.br  

---

## 📋 ÍNDICE

1. [Arquitetura Geral](#arquitetura-geral)
2. [Backend (Node.js + Express + Prisma)](#backend)
3. [Frontend (React + Vite + Tailwind)](#frontend)
4. [Banco de Dados (PostgreSQL)](#banco-de-dados)
5. [Infraestrutura e Deploy](#infraestrutura-e-deploy)
6. [Segurança](#segurança)
7. [Erros e Problemas Críticos](#erros-e-problemas-críticos)
8. [Melhorias Necessárias](#melhorias-necessárias)
9. [Documentação de Deploy Completo](#documentação-de-deploy-completo)

---

## 🏗️ ARQUITETURA GERAL

### Stack Tecnológico

**Backend:**
- Node.js 18 Alpine
- Express.js 4.18
- TypeScript 5.3
- Prisma ORM 5.22
- PostgreSQL 15

**Frontend:**
- React 18
- Vite 4.x
- TypeScript 5.3
- TailwindCSS 3.x
- React Query (TanStack Query) v5
- React Router v6
- Axios

**Infraestrutura:**
- Docker & Docker Compose
- Nginx (reverse proxy)
- Certbot (Let's Encrypt SSL)
- n8n (automação/webhooks)

**Banco de Dados:**
- PostgreSQL 15 Alpine
- Prisma Migrations
- Soft deletes implementados

---

## 🔧 BACKEND

### Estrutura de Diretórios

```
backend/
├── prisma/
│   ├── schema.prisma          # Schema do banco
│   ├── migrations/            # Migrations aplicadas
│   └── seed.js                # Seed para admin
├── src/
│   ├── config/
│   │   └── index.ts           # Configurações centralizadas
│   ├── controllers/           # 18 controllers
│   ├── services/              # Lógica de negócio
│   ├── middleware/
│   │   ├── auth.ts            # JWT validation
│   │   ├── csrf.ts            # CSRF protection
│   │   ├── rate-limiter.ts    # Rate limiting
│   │   └── error-handler.ts   # Error handling
│   ├── routes/                # 19 rotas da API
│   ├── utils/
│   │   ├── logger.ts          # Winston logger
│   │   └── prisma.ts          # Prisma client
│   └── server.ts              # Entry point
├── Dockerfile.prod            # Docker build
└── package.json
```

### Principais Módulos

**Autenticação & Autorização:**
- JWT com refresh tokens (15min + 7 dias)
- Bcrypt (12 rounds)
- 2FA (Speakeasy + QRCode)
- Rate limiting por IP
- CSRF tokens

**Rate Limiting:**
- Geral: 100 req/15min
- Login: 5 tentativas/15min
- Alterar senha: 3 tentativas/10min
- Mutations: 30 req/10min

**Segurança:**
- Helmet.js (headers)
- CORS configurado
- Origin validation
- Trust proxy (Nginx)
- SQL injection (Prisma ORM)

**Rotas Principais:**

1. **`/api/auth`** - Login, logout, refresh, 2FA
2. **`/api/users`** - CRUD usuários, reset senha
3. **`/api/vessels`** - CRUD embarcações
4. **`/api/bookings`** - CRUD reservas
5. **`/api/blocked-dates`** - Bloqueios de datas
6. **`/api/weekly-blocks`** - Bloqueios semanais
7. **`/api/notifications`** - Notificações globais
8. **`/api/financial`** - Info financeira
9. **`/api/auto-notifications`** - Notificações automáticas
10. **`/api/ad-hoc-charges`** - Cobranças avulsas
11. **`/api/audit-logs`** - Logs de auditoria
12. **`/api/csrf-token`** - Geração CSRF
13. **`/api/pwa/manifest.json`** - PWA manifest
14. **`/health`** - Health check

---

## 💻 FRONTEND

### Estrutura de Diretórios

```
frontend/
├── public/
│   ├── icons/                 # PWA icons
│   ├── manifest.webmanifest   # PWA manifest
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── Layout/            # Layout components
│   │   ├── Calendar/          # Calendário de reservas
│   │   ├── Dashboard/         # Dashboard cards
│   │   └── ui/                # UI components
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── VesselsPage.tsx
│   │   ├── BookingsPage.tsx
│   │   ├── UsersPage.tsx
│   │   ├── NotificationManagementPage.tsx
│   │   └── ProfilePage.tsx
│   ├── lib/
│   │   └── api.ts             # Axios instance
│   ├── hooks/                 # Custom hooks
│   ├── context/               # React Context
│   ├── App.tsx                # Router config
│   └── main.tsx               # Entry point
├── vite.config.ts             # Vite config
├── tailwind.config.js
├── Dockerfile.prod            # Docker build
└── nginx.conf                 # Frontend nginx
```

### Features Principais

**PWA:**
- Service Worker
- Manifest configurado
- Instalável
- Offline-ready

**React Query:**
- Cache inteligente (30s stale, 10min gc)
- Refetch automático
- Invalidação de queries
- Optimistic updates

**UI/UX:**
- TailwindCSS
- Responsive design
- Dark/Light mode (preparado)
- Loading states
- Error boundaries

---

## 🗄️ BANCO DE DADOS

### Schema Principal

**20 Modelos:**
1. User - Usuários (ADMIN/USER)
2. RefreshToken - Tokens JWT
3. Vessel - Embarcações
4. UserVessel - Relação usuário-embarcacao
5. Booking - Reservas
6. BlockedDate - Datas bloqueadas
7. BookingLimit - Limites por embarcacao
8. AuditLog - Logs de auditoria
9. Notification - Notificações globais
10. UserNotification - Notificações por usuário
11. Installment - Parcelas
12. MarinaPayment - Pagamentos marina
13. AdHocCharge - Cobranças avulsas
14. WeeklyBlock - Bloqueios semanais
15. SystemSetting - Configurações
16. SettingsLog - Logs de settings
17. Webhook - Webhooks config
18. WebhookLog - Logs webhooks
19. WebhookReplay - Replay protection
20. NotificationLog - Logs notificações

**Soft Deletes:**
- users, vessels, bookings

**Índices:**
- Todos os FKs
- Composite indexes em queries complexas
- Índices em campos de busca

**Enums:**
- UserRole: ADMIN, USER
- UserStatus: ACTIVE, OVERDUE, OVERDUE_PAYMENT, BLOCKED
- BookingStatus: PENDING, APPROVED, COMPLETED, CANCELLED
- VesselStatus: ACTIVE, PAID_OFF, DEFAULTED, SUSPENDED
- PaymentStatus: PENDING, PAID, OVERDUE, CANCELLED

---

## 🚀 INFRAESTRUTURA E DEPLOY

### Docker Compose (Produção)

```yaml
services:
  postgres:    # PostgreSQL 15 Alpine
  backend:     # Node 18 + Express + TypeScript
  frontend:    # Nginx Alpine (build React)
  nginx:       # Reverse proxy + SSL
  certbot:     # Auto-renewal SSL
  n8n:         # Workflow automation
```

**Ports:**
- 80: HTTP (redirect para 443)
- 443: HTTPS
- 3001: Backend (interno)
- 80: Frontend (interno)
- 5678: n8n

**Volumes:**
- postgres_data_prod
- n8n_data_prod
- certbot (SSL certs)

**Networks:**
- embarcacoes_network_prod (bridge)

### Nginx Configuration

**Upstreams:**
- backend -> embarcacoes_backend_prod:3001
- frontend -> embarcacoes_frontend_prod:80
- n8n -> embarcacoes_n8n_prod:5678

**Features:**
- HTTP -> HTTPS redirect (configurado mas comentado)
- Rate limiting (general 10/s, API 30/s)
- Gzip compression
- Cache headers
- Security headers (comentados no HTTP)

### SSL/HTTPS Status

**⚠️ PROBLEMA CRÍTICO: SSL DESABILITADO**

**Current State:**
- Nginx listening HTTP only
- HTTPS block commented out
- SSL certs exist but not used
- Redirect disabled

**Impact:**
- Site serve over HTTP
- "Not secure" warning
- Credentials at risk
- SEO affected

---

## 🔐 SEGURANÇA

### Implementado ✅

**Autenticação:**
- ✅ JWT + Refresh tokens
- ✅ Bcrypt (12 rounds)
- ✅ 2FA (opcional)
- ✅ Password reset
- ✅ Session management

**Autorização:**
- ✅ Role-based (ADMIN/USER)
- ✅ Vessel-level permissions
- ✅ Status-based blocks

**Proteções:**
- ✅ Helmet.js (headers)
- ✅ CORS com origem validada
- ✅ Rate limiting (multiple tiers)
- ✅ CSRF tokens
- ✅ Origin/Referer validation
- ✅ SQL injection (Prisma)
- ✅ XSS (React escaping)

**Auditoria:**
- ✅ Audit logs
- ✅ IP tracking
- ✅ Action logging
- ✅ Failed login tracking

### Issues de Segurança ⚠️

**Crítico:**
- 🔴 SSL desabilitado (site roda HTTP)
- 🔴 Certbot não configurado corretamente
- 🔴 HSTS headers disabled

**Médio:**
- 🟡 Trust proxy configurado mas headers podem não estar 100%
- 🟡 Rate limiting não testado em produção

---

## 🚨 ERROS E PROBLEMAS CRÍTICOS

### 1. SSL/HTTPS DESABILITADO 🔴

**Status:** Não Funcionando  
**Prioridade:** CRÍTICA  

**Descrição:**
- Nginx serve apenas HTTP
- Bloco HTTPS comentado no nginx.conf
- Certbot rodando mas certs não usados
- Redirect HTTP->HTTPS desabilitado

**Causa:**
- Configuração intencional temporária
- Certificates podem estar expirados/inválidos

**Impacto:**
- Site marcado como "Not Secure"
- Credentials transitam em texto plano
- Violação PCI DSS (se aceitar pagamento)
- SEO negativo

**Solução:**
```nginx
# Ativar redirect HTTP->HTTPS
location / {
    return 301 https://$host$request_uri;
}

# Descommentar bloco HTTPS
server {
    listen 443 ssl http2;
    # ... config SSL
}
```

**Ação:**
1. Verificar certificados: `docker exec embarcacoes_certbot certbot certificates`
2. Renovar se necessário: `docker exec embarcacoes_certbot certbot renew --force-renewal`
3. Descomentarmos bloco HTTPS
4. Testar: `curl -I https://app.infinitynautica.com.br`

---

### 2. CORS E ORIGIN VALIDATION ⚠️

**Status:** Parcialmente Funcionando  
**Prioridade:** ALTA  

**Histórico:**
- ✅ Corrigido "Origin é obrigatório" error
- ✅ Normalização de URLs (http/https)
- ✅ Health checks bypassed
- ✅ Trust proxy configurado

**Status Atual:**
- ✅ Backend permite requisições sem Origin em produção
- ✅ Frontend URL hardcoded como fallback
- ⚠️ Depende de FRONTEND_URL no .env

**Issues Restantes:**
- Nginx não adiciona Origin header consistentemente
- Mesma origem com protocolos diferentes pode causar issues

---

### 3. DATABASE MIGRATIONS ✅

**Status:** Funcionando  
**Prioridade:** ALTA (Resolvido)  

**Histórico:**
- ✅ 11 migrations aplicadas
- ✅ Schema sincronizado
- ✅ Migrations no .gitignore foram habilitadas

**Status Atual:**
- ✅ Auto-deploy no Dockerfile
- ✅ Migrations versionadas no Git

---

### 4. BUILD E DOCKER ✅

**Status:** Funcionando  
**Prioridade:** MÉDIA  

**Issues Corrigidos:**
- ✅ Removido USER nginx do frontend Dockerfile
- ✅ Corrigido manualChunks (single bundle)
- ✅ Removido service worker antigo
- ✅ Corrigido cache headers

---

### 5. AUTENTICAÇÃO ✅

**Status:** Funcionando  
**Prioridade:** ALTA (Resolvido)  

**Histórico:**
- ✅ Login funcionando
- ✅ JWT tokens gerados
- ✅ Refresh tokens implementados
- ✅ Rate limiting aplicado

**Features:**
- ✅ Login com email/senha
- ✅ Refresh token rotation
- ✅ Logout (revoke token)
- ✅ 2FA (opcional)

---

### 6. REACT QUERY CACHE ⚠️

**Status:** Parcialmente Funcionando  
**Prioridade:** MÉDIA  

**Issues:**
- Cache keys inconsistentes em alguns lugares
- `staleTime` mudou várias vezes (0 -> 30s)
- Invalidação nem sempre é completa

**Recomendação:**
- Padronizar cache keys
- Documentar estratégia de cache
- Testar invalidação cross-component

---

### 7. ERROR HANDLING ⚠️

**Status:** Parcialmente Funcionando  
**Prioridade:** BAIXA  

**Issues:**
- Alguns controllers não usam `next(error)` consistentemente
- Stack traces em produção (deve ser desabilitado)
- Logs de erro não estruturados

---

### 8. PERFORMANCE 📊

**Status:** OK, mas pode melhorar  
**Prioridade:** BAIXA  

**Issues:**
- Sem Redis para cache
- Sem CDN para assets
- Frontend bundle pode ser menor
- Lazy loading não implementado

---

## 🎯 MELHORIAS NECESSÁRIAS

### Alta Prioridade 🔴

**1. Ativar SSL/HTTPS**
```bash
# Passo 1: Verificar certs
docker exec embarcacoes_certbot certbot certificates

# Passo 2: Renovar se necessário
docker exec embarcacoes_certbot certbot renew

# Passo 3: Descomentarmos HTTPS em nginx.conf
# Passo 4: Rebuild nginx
docker compose -f docker-compose.prod.yml up -d --build nginx

# Passo 5: Testar
curl -I https://app.infinitynautica.com.br
```

**2. Implementar Monitoring**
- Sentry para errors
- Prometheus + Grafana para metrics
- Uptime monitoring (UptimeRobot)

**3. Database Backups Automáticos**
```bash
# Cron job para backup diário
0 2 * * * docker exec embarcacoes_db_prod pg_dump -U embarcacoes embarcacoes_db > /backups/db_$(date +\%Y\%m\%d).sql
```

---

### Média Prioridade 🟡

**4. Cache Layer (Redis)**
- Session storage
- Rate limiting storage
- Query result cache

**5. CDN para Assets**
- Cloudflare ou similar
- Cache static files
- DDoS protection

**6. Code Splitting Frontend**
```typescript
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const VesselsPage = lazy(() => import('./pages/VesselsPage'));
```

**7. Lazy Loading Images**
```tsx
<img loading="lazy" src={...} />
```

---

### Baixa Prioridade 🟢

**8. Documentação API**
- Swagger/OpenAPI completo
- Postman collection

**9. Testes**
- Unit tests (Jest)
- Integration tests
- E2E (Playwright)

**10. CI/CD**
- GitHub Actions
- Auto-deploy on push
- Auto-tests

**11. Accessibility (A11y)**
- WCAG compliance
- Screen reader support
- Keyboard navigation

---

## 📚 DOCUMENTAÇÃO DE DEPLOY COMPLETO

### Requisitos

**VPS:**
- Ubuntu 22.04 LTS+
- 2+ cores CPU
- 4GB RAM
- 20GB SSD

**Software:**
- Docker 20.10+
- Docker Compose 2.0+
- Git 2.30+

---

### Instalação Passo a Passo

#### 1. Preparar Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y curl wget git ufw

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo apt install -y docker-compose-plugin

# Verificar instalação
docker --version
docker compose version
```

---

#### 2. Configurar Firewall

```bash
# Ativar firewall
sudo ufw --force enable

# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Verificar
sudo ufw status
```

---

#### 3. Clonar Repositório

```bash
# Criar diretório
sudo mkdir -p /opt/embarcacoes
sudo chown -R $USER:$USER /opt/embarcacoes

# Clonar repo
cd /opt/embarcacoes
git clone https://github.com/Danilobrandaossa/pj-nautica.git .

# Verificar arquivos
ls -la
```

---

#### 4. Configurar Variáveis de Ambiente

```bash
# Copiar template
cp .env.example .env

# Editar .env
nano .env
```

**Variáveis Obrigatórias:**

```env
# Node
NODE_ENV=production

# Database
POSTGRES_USER=embarcacoes
POSTGRES_PASSWORD=SUA_SENHA_FORTE_AQUI
POSTGRES_DB=embarcacoes_db
DATABASE_URL=postgresql://embarcacoes:SUA_SENHA_AQUI@postgres:5432/embarcacoes_db?schema=public

# JWT
JWT_SECRET=SUA_SECRET_JWT_AQUI_MIN_32_CHARS
JWT_REFRESH_SECRET=SUA_REFRESH_SECRET_AQUI_MIN_32_CHARS

# Frontend
FRONTEND_URL=https://app.infinitynautica.com.br
VITE_API_URL=https://app.infinitynautica.com.br/api

# n8n
N8N_USER=admin
N8N_PASSWORD=SUA_SENHA_N8N_AQUI
N8N_HOST=n8n.infinitynautica.com.br
N8N_WEBHOOK_URL=https://n8n.infinitynautica.com.br/webhook
```

---

#### 5. Build e Deploy

```bash
# Build imagens
docker compose -f docker-compose.prod.yml build

# Subir serviços
docker compose -f docker-compose.prod.yml up -d

# Verificar status
docker compose -f docker-compose.prod.yml ps

# Verificar logs
docker logs embarcacoes_backend_prod --tail=50
docker logs embarcacoes_frontend_prod --tail=50
```

---

#### 6. Configurar SSL (Opção 1: Certbot Manual)

```bash
# Parar nginx temporariamente
docker compose -f docker-compose.prod.yml stop nginx

# Executar certbot
docker run --rm \
  -v /opt/embarcacoes/certbot/conf:/etc/letsencrypt \
  -v /opt/embarcacoes/certbot/www:/var/www/certbot \
  certbot/certbot certonly --standalone \
  -d app.infinitynautica.com.br

# Verificar certificados
ls -la certbot/conf/live/app.infinitynautica.com.br/

# Ativar HTTPS no nginx.conf (descommentar bloco)
# Rebuild nginx
docker compose -f docker-compose.prod.yml up -d --build nginx

# Testar
curl -I https://app.infinitynautica.com.br
```

---

#### 7. Seed Admin User

```bash
# Verificar se admin existe
docker exec embarcacoes_db_prod psql -U embarcacoes -d embarcacoes_db -c \
  "SELECT email FROM users WHERE role = 'ADMIN';"

# Se não existir, criar
docker exec embarcacoes_backend_prod node prisma/seed.js

# Verificar novamente
docker exec embarcacoes_db_prod psql -U embarcacoes -d embarcacoes_db -c \
  "SELECT email, role FROM users WHERE role = 'ADMIN';"
```

---

#### 8. Verificação Final

```bash
# Health checks
curl http://localhost:3001/health
curl https://app.infinitynautica.com.br/api/health

# Verificar containers
docker ps --format "table {{.Names}}\t{{.Status}}"

# Verificar migrations
docker exec embarcacoes_backend_prod npx prisma migrate status

# Verificar logs de erro
docker logs embarcacoes_backend_prod --tail=100 | grep -i error
docker logs embarcacoes_frontend_prod --tail=50 | grep -i error

# Testar login
curl -X POST https://app.infinitynautica.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"senha"}'
```

---

### Comandos Úteis

```bash
# Ver logs
docker logs -f embarcacoes_backend_prod
docker logs -f embarcacoes_nginx_prod

# Reiniciar serviços
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml restart frontend

# Rebuild específico
docker compose -f docker-compose.prod.yml up -d --build backend

# Backup banco
docker exec embarcacoes_db_prod pg_dump -U embarcacoes embarcacoes_db > backup.sql

# Restore banco
docker exec -i embarcacoes_db_prod psql -U embarcacoes embarcacoes_db < backup.sql

# Limpar containers/volumes (CAREFUL!)
docker compose -f docker-compose.prod.yml down -v
docker system prune -a
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

**Infraestrutura:**
- [ ] Docker e Docker Compose instalados
- [ ] Containers rodando (6/6 healthy)
- [ ] Firewall configurado
- [ ] SSL funcionando (HTTPS)
- [ ] Certbot auto-renewal ativo

**Backend:**
- [ ] Health check OK
- [ ] Migrations aplicadas
- [ ] Admin criado
- [ ] Logs sem erros
- [ ] Rate limiting ativo

**Frontend:**
- [ ] Build sem erros
- [ ] Nginx servindo corretamente
- [ ] PWA configurado
- [ ] Cache headers OK

**Database:**
- [ ] PostgreSQL rodando
- [ ] Schema sincronizado
- [ ] Backups configurados
- [ ] Índices criados

**Segurança:**
- [ ] HTTPS ativo
- [ ] CORS configurado
- [ ] Rate limits ativos
- [ ] Headers de segurança
- [ ] Secrets no .env

**Funcionalidades:**
- [ ] Login funcionando
- [ ] Reservas criando/listando
- [ ] Calendário renderizando
- [ ] Notificações enviando
- [ ] Admin panel acessível

---

## 🎉 CONCLUSÃO

**Status Geral:** ✅ Sistema funcional mas com issues de segurança SSL

**Pontos Fortes:**
- Arquitetura sólida
- Separação de concerns
- TypeScript em tudo
- Prisma ORM
- Rate limiting
- Audit logs

**Pontos de Atenção:**
- 🔴 SSL desabilitado
- 🟡 Performance pode melhorar
- 🟢 Testes ausentes

**Recomendação Imediata:**
1. Ativar SSL/HTTPS
2. Implementar monitoring
3. Configurar backups automáticos

**Ready para Replicação:** Sim, mas ativar SSL primeiro

---

**Última atualização:** 02/01/2025  
**Versão do documento:** 1.0  
**Próxima revisão:** Após ativar SSL

