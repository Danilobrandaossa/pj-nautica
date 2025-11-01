# 🔍 Verificação Completa do Banco de Dados - Infinity Náutica

## 📋 Procedimento de Verificação e Atualização Segura

Este documento descreve o procedimento completo para verificar a integridade do banco de dados e garantir que todos os dados estejam intactos, sincronizados e acessíveis.

---

## 🎯 Objetivos

1. ✅ Verificar integridade de todas as tabelas principais
2. ✅ Validar dados de usuários e autenticação
3. ✅ Confirmar que reservas/bookings estão íntegras
4. ✅ Aplicar migrations pendentes
5. ✅ Revisar logs em busca de erros
6. ✅ Garantir que login e autenticação funcionem

---

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

#### 1. **users** - Usuários do Sistema
- Campos críticos: `email`, `password`, `name`, `role`, `status`, `isActive`, `deletedAt`
- Índices: `email`, `role`, `status`
- Relacionamentos: Bookings, RefreshTokens, Vessels, Notifications

#### 2. **bookings** - Reservas
- Campos críticos: `userId`, `vesselId`, `bookingDate`, `status`, `deletedAt`
- Índices: `userId`, `vesselId`, `bookingDate`, `status`, `(userId, status)`, `(vesselId, bookingDate, status)`, `deletedAt`
- Relacionamentos: User, Vessel

#### 3. **vessels** - Embarcações
- Campos críticos: `name`, `isActive`, `deletedAt`
- Índices: `name`, `isActive`, `deletedAt`
- Relacionamentos: Bookings, UserVessels, BlockedDates

#### 4. **user_vessels** - Relação Usuário-Embarcação
- Campos críticos: `userId`, `vesselId`, `status`, `totalValue`
- Índices: `userId`, `vesselId`
- Relacionamentos: User, Vessel

#### 5. **refresh_tokens** - Tokens de Autenticação
- Campos críticos: `token`, `userId`, `expiresAt`, `isRevoked`
- Índices: `token`, `userId`
- Relacionamentos: User

#### 6. **audit_logs** - Logs de Auditoria
- Campos críticos: `userId`, `action`, `entityType`, `createdAt`
- Índices: `userId`, `action`, `entityType`, `createdAt`

#### 7. **notifications** - Notificações
- Campos críticos: `title`, `message`, `type`, `isGlobal`, `isActive`
- Índices: `isActive`, `isGlobal`, `targetRole`, `createdAt`

#### 8. **blocked_dates** - Datas Bloqueadas
- Campos críticos: `vesselId`, `startDate`, `endDate`, `reason`
- Índices: `vesselId`, `startDate`, `endDate`

#### 9. **weekly_blocks** - Bloqueios Semanais
- Campos críticos: `dayOfWeek`, `reason`, `isActive`
- Índices: `dayOfWeek`, `isActive`

#### 10. **Tabelas Financeiras**
- `installments` - Parcelas
- `marina_payments` - Pagamentos da Marina
- `ad_hoc_charges` - Cobranças Adicionais

#### 11. **Tabelas de Sistema**
- `system_settings` - Configurações do Sistema
- `settings_logs` - Logs de Configurações
- `webhooks` - Webhooks
- `webhook_logs` - Logs de Webhooks
- `webhook_replays` - Replays de Webhooks
- `notification_logs` - Logs de Notificações

---

## 🔧 Comandos de Verificação

### 1. Conectar ao Banco de Dados via Docker

```bash
# Entrar no container do PostgreSQL
docker exec -it embarcacoes_db_prod psql -U postgres -d embarcacoes
```

### 2. Verificar Todas as Tabelas Existentes

```sql
-- Listar todas as tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 3. Verificar Integridade da Tabela `users`

```sql
-- Contar usuários ativos e deletados
SELECT 
    COUNT(*) FILTER (WHERE "deletedAt" IS NULL) as usuarios_ativos,
    COUNT(*) FILTER (WHERE "deletedAt" IS NOT NULL) as usuarios_deletados,
    COUNT(*) FILTER (WHERE role = 'ADMIN') as administradores,
    COUNT(*) FILTER (WHERE role = 'USER') as usuarios_comuns
FROM users;

-- Listar administradores ativos
SELECT id, email, name, role, "isActive", status, "lastLoginAt", "createdAt"
FROM users
WHERE role = 'ADMIN' AND "deletedAt" IS NULL
ORDER BY "createdAt" DESC;

-- Verificar usuários com campos obrigatórios faltando
SELECT id, email, name, role, status
FROM users
WHERE email IS NULL 
   OR password IS NULL 
   OR name IS NULL
   OR status IS NULL;
```

### 4. Verificar Integridade da Tabela `bookings`

```sql
-- Contar reservas por status
SELECT 
    status,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE "deletedAt" IS NULL) as ativas,
    COUNT(*) FILTER (WHERE "deletedAt" IS NOT NULL) as deletadas
FROM bookings
GROUP BY status
ORDER BY status;

-- Listar reservas recentes
SELECT 
    b.id,
    b."bookingDate",
    b.status,
    u.email as usuario_email,
    v.name as embarcacao_nome,
    b."createdAt"
FROM bookings b
JOIN users u ON b."userId" = u.id
JOIN vessels v ON b."vesselId" = v.id
WHERE b."deletedAt" IS NULL
ORDER BY b."bookingDate" DESC
LIMIT 20;

-- Verificar reservas órfãs (sem usuário ou embarcação válida)
SELECT b.id, b."userId", b."vesselId", b."bookingDate"
FROM bookings b
LEFT JOIN users u ON b."userId" = u.id
LEFT JOIN vessels v ON b."vesselId" = v.id
WHERE u.id IS NULL OR v.id IS NULL;
```

### 5. Verificar Integridade da Tabela `vessels`

```sql
-- Contar embarcações ativas e deletadas
SELECT 
    COUNT(*) FILTER (WHERE "deletedAt" IS NULL AND "isActive" = true) as ativas,
    COUNT(*) FILTER (WHERE "deletedAt" IS NOT NULL) as deletadas,
    COUNT(*) as total
FROM vessels;

-- Listar todas as embarcações
SELECT id, name, "isActive", "deletedAt", "createdAt"
FROM vessels
ORDER BY "createdAt" DESC;
```

### 6. Verificar Tokens de Autenticação

```sql
-- Contar tokens válidos e revogados
SELECT 
    COUNT(*) FILTER (WHERE "isRevoked" = false AND "expiresAt" > NOW()) as tokens_validos,
    COUNT(*) FILTER (WHERE "isRevoked" = true) as tokens_revogados,
    COUNT(*) FILTER (WHERE "expiresAt" <= NOW()) as tokens_expirados
FROM refresh_tokens;

-- Limpar tokens expirados (opcional)
DELETE FROM refresh_tokens WHERE "expiresAt" <= NOW();
```

### 7. Verificar Índices e Constraints

```sql
-- Listar todos os índices
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Verificar foreign keys
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

### 8. Verificar Logs de Auditoria

```sql
-- Contar ações recentes
SELECT action, COUNT(*) as total
FROM audit_logs
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY action
ORDER BY total DESC;

-- Ver últimas 20 ações
SELECT action, "entityType", "createdAt"
FROM audit_logs
ORDER BY "createdAt" DESC
LIMIT 20;
```

---

## 🚀 Aplicação de Migrations

### Verificar Migrations Aplicadas

```bash
# Dentro do container do backend
docker exec -it embarcacoes_backend_prod npx prisma migrate status
```

### Aplicar Migrations Pendentes Manualmente

```bash
# Se necessário, aplicar migrations manualmente
docker exec -it embarcacoes_backend_prod npx prisma migrate deploy
```

### Forçar Sincronização (ATENÇÃO: Use com cuidado!)

```bash
# Se houver problemas de schema, você pode usar prisma db push
# MAS ATENÇÃO: Isso não cria migrations e pode causar perda de dados
docker exec -it embarcacoes_backend_prod npx prisma db push
```

---

## 📝 Verificação de Dados Específicos

### Verificar Se Admin Existe

```bash
# Verificar se o admin danilo@danilobrandao.com.br existe
docker exec -it embarcacoes_backend_prod node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findUnique({ 
  where: { email: 'danilo@danilobrandao.com.br' } 
}).then(u => console.log('Admin existe:', !!u)).finally(() => prisma.\$disconnect());
"
```

### Verificar Contagens Totais

```sql
-- Resumo geral
SELECT 
    'users' as tabela, COUNT(*) as total_registros
FROM users
WHERE "deletedAt" IS NULL
UNION ALL
SELECT 'vessels', COUNT(*) FROM vessels WHERE "deletedAt" IS NULL
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings WHERE "deletedAt" IS NULL
UNION ALL
SELECT 'user_vessels', COUNT(*) FROM user_vessels
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications WHERE "isActive" = true;
```

---

## 🔍 Revisão de Logs

### Logs do Backend

```bash
# Ver logs recentes do backend
docker logs embarcacoes_backend_prod --tail=100 | grep -i error

# Ver todos os logs
docker logs embarcacoes_backend_prod --tail=500
```

### Logs do Banco de Dados

```bash
# Ver logs do PostgreSQL
docker logs embarcacoes_db_prod --tail=100 | grep -i error

# Entrar no banco e verificar configurações
docker exec -it embarcacoes_db_prod psql -U postgres -c "
SELECT name, setting 
FROM pg_settings 
WHERE name LIKE '%log%' OR name LIKE '%error%'
ORDER BY name;
"
```

---

## 🛠️ Correções Comuns

### Problema 1: Coluna `deletedAt` Não Existe

```sql
-- Adicionar coluna deletedAt se não existir
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "vessels" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
```

### Problema 2: Índices Faltando

```sql
-- Criar índices faltando
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
CREATE INDEX IF NOT EXISTS "users_status_idx" ON "users"("status");
CREATE INDEX IF NOT EXISTS "users_deletedAt_idx" ON "users"("deletedAt");

CREATE INDEX IF NOT EXISTS "bookings_userId_idx" ON "bookings"("userId");
CREATE INDEX IF NOT EXISTS "bookings_vesselId_idx" ON "bookings"("vesselId");
CREATE INDEX IF NOT EXISTS "bookings_bookingDate_idx" ON "bookings"("bookingDate");
CREATE INDEX IF NOT EXISTS "bookings_status_idx" ON "bookings"("status");
CREATE INDEX IF NOT EXISTS "bookings_userId_status_idx" ON "bookings"("userId", "status");
CREATE INDEX IF NOT EXISTS "bookings_deletedAt_idx" ON "bookings"("deletedAt");
```

### Problema 3: Restaurar Usuário Deletado

```sql
-- Restaurar usuário específico
UPDATE users 
SET "deletedAt" = NULL 
WHERE email = 'email@example.com';
```

### Problema 4: Limpar Tokens Expirados

```sql
-- Deletar tokens expirados
DELETE FROM refresh_tokens WHERE "expiresAt" <= NOW();
```

---

## ✅ Checklist de Verificação

- [ ] Todas as tabelas principais existem
- [ ] Coluna `deletedAt` existe em `users`, `vessels`, `bookings`
- [ ] Índices estão criados corretamente
- [ ] Admin `danilo@danilobrandao.com.br` existe e está ativo
- [ ] Login funciona normalmente
- [ ] Reservas são listadas corretamente
- [ ] Calendário mostra reservas
- [ ] Migrations estão aplicadas (`prisma migrate status` mostra OK)
- [ ] Não há erros nos logs do backend
- [ ] Não há erros nos logs do banco
- [ ] Soft deletes estão funcionando
- [ ] Tokens JWT funcionam

---

## 🎯 Procedimento de Deploy Seguro

### 1. Backup ANTES de Qualquer Mudança

```bash
# Criar backup do banco
docker exec embarcacoes_db_prod pg_dump -U postgres embarcacoes > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Pull do Código Mais Recente

```bash
cd /opt/embarcacoes
git pull origin main
```

### 3. Reconstruir Containers

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 4. Verificar Migrations

```bash
docker exec -it embarcacoes_backend_prod npx prisma migrate status
```

### 5. Verificar Logs

```bash
docker logs embarcacoes_backend_prod --tail=50
docker logs embarcacoes_db_prod --tail=50
```

### 6. Testar Login e Funcionalidades

```bash
# Testar health check
curl https://app.infinitynautica.com.br/health

# Verificar que o backend está respondendo
curl https://app.infinitynautica.com.br/api/health
```

---

## 📞 Suporte

Se encontrar problemas:

1. Verificar logs: `docker logs embarcacoes_backend_prod --tail=100`
2. Verificar conexão com banco: `docker exec -it embarcacoes_db_prod psql -U postgres -d embarcacoes -c "SELECT 1"`
3. Verificar migrations: `docker exec -it embarcacoes_backend_prod npx prisma migrate status`
4. Restaurar backup se necessário

---

## 🎉 Resultado Esperado

Após executar todas as verificações:

```
✅ Banco de dados atualizado com sucesso.
✅ Todos os dados de usuários, reservas e embarcações foram verificados e estão acessíveis.
✅ Login funcionando normalmente e sistema 100% estável.
✅ Migrations aplicadas corretamente.
✅ Índices e constraints funcionando.
✅ Soft deletes funcionando.
✅ Zero erros nos logs.
```

