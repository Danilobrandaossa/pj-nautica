# 🚀 Executar Verificação Completa no Servidor

Este guia fornece os comandos **exatos** para executar no servidor VPS.

## 📋 Pré-requisitos

Você deve ter acesso SSH ao servidor como root.

---

## 1️⃣ Fazer Pull das Últimas Alterações

```bash
# Entrar no diretório do projeto
cd /opt/embarcacoes

# Baixar última versão do código
git pull origin main
```

---

## 2️⃣ Criar Backup ANTES de Qualquer Mudança

```bash
# Criar diretório de backups se não existir
mkdir -p backups

# Criar backup completo do banco
docker exec embarcacoes_db_prod pg_dump -U postgres embarcacoes > backups/backup_$(date +%Y%m%d_%H%M%S).sql

echo "✅ Backup criado com sucesso!"
ls -lh backups/ | tail -5
```

---

## 3️⃣ Reconstruir e Reiniciar Containers

```bash
# Reconstruir todos os containers com as últimas mudanças
docker compose -f docker-compose.prod.yml down

# Reconstruir imagens
docker compose -f docker-compose.prod.yml build --no-cache

# Subir containers (as migrations serão aplicadas automaticamente)
docker compose -f docker-compose.prod.yml up -d

# Aguardar containers inicializarem
sleep 10

# Verificar status
docker compose -f docker-compose.prod.yml ps
```

---

## 4️⃣ Verificar Status das Migrations

```bash
# Ver se todas as migrations foram aplicadas
docker exec embarcacoes_backend_prod npx prisma migrate status

# Seu output deve mostrar algo como:
# ✅ All migrations have already been applied
```

---

## 5️⃣ Executar Script de Verificação SQL

```bash
# Copiar script para dentro do container do banco
docker cp backend/scripts/check-database.sql embarcacoes_db_prod:/tmp/

# Executar script de verificação
docker exec embarcacoes_db_prod psql -U postgres -d embarcacoes -f /tmp/check-database.sql

# Ou executar comandos SQL específicos manualmente:
docker exec embarcacoes_db_prod psql -U postgres -d embarcacoes -c "
SELECT 
    'Usuários ativos' as item, COUNT(*)::text as valor
FROM users WHERE \"deletedAt\" IS NULL
UNION ALL
SELECT 'Embarcações ativas', COUNT(*)::text 
FROM vessels WHERE \"deletedAt\" IS NULL
UNION ALL
SELECT 'Reservas ativas', COUNT(*)::text 
FROM bookings WHERE \"deletedAt\" IS NULL;
"
```

---

## 6️⃣ Verificar Admin e Login

```bash
# Verificar se o admin existe
docker exec embarcacoes_db_prod psql -U postgres -d embarcacoes -c "
SELECT id, email, name, role, \"isActive\", status, \"lastLoginAt\"
FROM users
WHERE role = 'ADMIN' AND \"deletedAt\" IS NULL;
"

# Se o admin não existir, criar usando o seed
docker exec embarcacoes_backend_prod node prisma/seed.js
```

---

## 7️⃣ Verificar Logs em Busca de Erros

```bash
# Logs do Backend (últimas 100 linhas)
echo "=== LOGS DO BACKEND ==="
docker logs embarcacoes_backend_prod --tail=100 | grep -i error

# Logs do Banco (últimas 100 linhas)
echo "=== LOGS DO BANCO ==="
docker logs embarcacoes_db_prod --tail=100 | grep -i error

# Logs do Frontend (últimas 50 linhas)
echo "=== LOGS DO FRONTEND ==="
docker logs embarcacoes_frontend_prod --tail=50 | grep -i error

# Se não houver erros, você verá apenas os headers acima
```

---

## 8️⃣ Verificar Saúde dos Serviços

```bash
# Verificar healthcheck dos containers
docker ps --format "table {{.Names}}\t{{.Status}}"

# Todos devem mostrar "healthy" ou "running"

# Testar health endpoint do backend
curl -f http://localhost:3001/health

# Testar se a aplicação está respondendo
curl -I https://app.infinitynautica.com.br/health
curl -I https://app.infinitynautica.com.br/api/health
```

---

## 9️⃣ Testar Funcionalidades Críticas

```bash
# Testar login (substituir com credenciais corretas)
echo "Testando endpoint de login..."
curl -X POST https://app.infinitynautica.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "danilo@danilobrandao.com.br",
    "password": "SUA_SENHA_AQUI"
  }'

# Se retornar um token JWT, o login está funcionando!
```

---

## 🔟 Verificar Dados Específicos

```bash
# Verificar tabelas principais
docker exec embarcacoes_db_prod psql -U postgres -d embarcacoes -c "
SELECT 
    'users' as tabela, COUNT(*) as total FROM users WHERE \"deletedAt\" IS NULL
UNION ALL
SELECT 'vessels', COUNT(*) FROM vessels WHERE \"deletedAt\" IS NULL AND \"isActive\" = true
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings WHERE \"deletedAt\" IS NULL
UNION ALL
SELECT 'user_vessels', COUNT(*) FROM user_vessels;
"

# Verificar reservas recentes
docker exec embarcacoes_db_prod psql -U postgres -d embarcacoes -c "
SELECT 
    TO_CHAR(b.\"bookingDate\", 'DD/MM/YYYY') as data,
    b.status,
    u.email as usuario,
    v.name as embarcacao
FROM bookings b
JOIN users u ON b.\"userId\" = u.id
JOIN vessels v ON b.\"vesselId\" = v.id
WHERE b.\"deletedAt\" IS NULL
ORDER BY b.\"bookingDate\" DESC
LIMIT 10;
"
```

---

## 1️⃣1️⃣ Limpar Tokens Expirados (Opcional)

```bash
# Deletar tokens expirados para limpar o banco
docker exec embarcacoes_db_prod psql -U postgres -d embarcacoes -c "
DELETE FROM refresh_tokens WHERE \"expiresAt\" <= NOW();
SELECT 'Tokens expirados deletados' as resultado;
"
```

---

## 1️⃣2️⃣ Verificar Índices e Performance

```bash
# Verificar se todos os índices existem
docker exec embarcacoes_db_prod psql -U postgres -d embarcacoes -c "
SELECT 
    tablename as tabela,
    COUNT(*) as total_indices
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
"

# Verificar foreign keys
docker exec embarcacoes_db_prod psql -U postgres -d embarcacoes -c "
SELECT
    tc.table_name as tabela, 
    COUNT(*) as total_fks
FROM information_schema.table_constraints AS tc
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
GROUP BY tc.table_name
ORDER BY tc.table_name;
"
```

---

## ✅ Checklist Final

Execute este checklist e verifique cada item:

```bash
echo "=== CHECKLIST DE VERIFICAÇÃO ==="
echo ""

# 1. Containers rodando
echo "1️⃣ Containers rodando..."
docker ps | grep embarcacoes

# 2. Health checks OK
echo ""
echo "2️⃣ Health checks..."
docker ps --format "{{.Names}}: {{.Status}}" | grep embarcacoes

# 3. Migrations aplicadas
echo ""
echo "3️⃣ Migrations aplicadas..."
docker exec embarcacoes_backend_prod npx prisma migrate status

# 4. Banco acessível
echo ""
echo "4️⃣ Banco acessível..."
docker exec embarcacoes_db_prod psql -U postgres -d embarcacoes -c "SELECT 'OK' as banco;" | grep OK

# 5. Admin existe
echo ""
echo "5️⃣ Admin existe..."
docker exec embarcacoes_db_prod psql -U postgres -d embarcacoes -c "
SELECT COUNT(*) as total_admins FROM users WHERE role = 'ADMIN' AND \"deletedAt\" IS NULL;
" | grep -A 1 total_admins

# 6. Sem erros nos logs
echo ""
echo "6️⃣ Erros nos logs do backend..."
docker logs embarcacoes_backend_prod --tail=50 | grep -c "error\|ERROR" || echo "Nenhum erro encontrado"

# 7. Frontend acessível
echo ""
echo "7️⃣ Frontend acessível..."
curl -I -s https://app.infinitynautica.com.br | head -1

# 8. API acessível
echo ""
echo "8️⃣ API acessível..."
curl -I -s https://app.infinitynautica.com.br/api/health | head -1

echo ""
echo "=== FIM DO CHECKLIST ==="
```

---

## 🎯 Comando Tudo-em-Um

Se quiser executar tudo de uma vez:

```bash
#!/bin/bash
set -e

cd /opt/embarcacoes

echo "🔄 Fazendo pull das últimas alterações..."
git pull origin main

echo "💾 Criando backup..."
mkdir -p backups
docker exec embarcacoes_db_prod pg_dump -U postgres embarcacoes > backups/backup_$(date +%Y%m%d_%H%M%S).sql

echo "🔨 Reconstruindo containers..."
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

echo "⏳ Aguardando inicialização..."
sleep 15

echo "✅ Verificando status..."
docker compose -f docker-compose.prod.yml ps

echo "✅ Verificando migrations..."
docker exec embarcacoes_backend_prod npx prisma migrate status

echo ""
echo "🎉 Concluído! Execute os comandos de verificação manual para confirmar."
```

Salve este script como `verificar-tudo.sh`, torne-o executável e execute:

```bash
chmod +x verificar-tudo.sh
./verificar-tudo.sh
```

---

## 🆘 Se Algo Der Errado

### Restaurar Backup

```bash
# Parar containers
docker compose -f docker-compose.prod.yml down

# Listar backups disponíveis
ls -lh backups/

# Restaurar backup mais recente
docker exec -i embarcacoes_db_prod psql -U postgres embarcacoes < backups/backup_YYYYMMDD_HHMMSS.sql

# Subir containers novamente
docker compose -f docker-compose.prod.yml up -d
```

### Forçar Rebuild Completo

```bash
# Remover todos os containers, volumes e imagens
docker compose -f docker-compose.prod.yml down -v
docker system prune -a --volumes -f

# Limpar cache do build
docker builder prune -a -f

# Reconstruir do zero
cd /opt/embarcacoes
git pull origin main
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

---

## 📞 Próximos Passos

Depois de executar todas as verificações:

1. ✅ Teste o login no navegador
2. ✅ Verifique se as reservas aparecem no calendário
3. ✅ Teste criar nova reserva
4. ✅ Teste criar novo usuário (como admin)
5. ✅ Verifique logs em tempo real: `docker logs -f embarcacoes_backend_prod`

---

## 🎉 Resultado Esperado

Ao final, você deve ver:

```
✅ Banco de dados atualizado com sucesso.
✅ Todos os dados de usuários, reservas e embarcações foram verificados.
✅ Login funcionando normalmente.
✅ Migrations aplicadas corretamente.
✅ Zero erros nos logs.
✅ Sistema 100% estável.
```

