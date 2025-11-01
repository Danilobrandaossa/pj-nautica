# ✅ RESUMO: Executar Verificação de Banco no Servidor

## 🎯 Objetivo

Verificar e garantir que o banco de dados do sistema Infinity Náutica está íntegro, com todas as tabelas, dados de usuários e reservas intactos e acessíveis.

---

## 🚀 COMANDOS PARA EXECUTAR NO SERVIDOR

### 1️⃣ Pull das Últimas Alterações

```bash
cd /opt/embarcacoes
git pull origin main
```

### 2️⃣ Backup ANTES de Qualquer Mudança

```bash
mkdir -p backups
docker exec embarcacoes_db_prod pg_dump -U postgres embarcacoes > backups/backup_$(date +%Y%m%d_%H%M%S).sql
echo "✅ Backup criado!"
```

### 3️⃣ Reconstruir Containers (Aplicar Migrations)

```bash
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
sleep 15
```

### 4️⃣ Verificar Migrations

```bash
docker exec embarcacoes_backend_prod npx prisma migrate status
# Deve mostrar: "All migrations have already been applied"
```

### 5️⃣ Executar Verificação SQL

```bash
docker cp backend/scripts/check-database.sql embarcacoes_db_prod:/tmp/
docker exec embarcacoes_db_prod psql -U postgres -d embarcacoes -f /tmp/check-database.sql
```

### 6️⃣ Verificar Admin Existe

```bash
docker exec embarcacoes_db_prod psql -U postgres -d embarcacoes -c "
SELECT id, email, name, role, \"isActive\", status
FROM users WHERE role = 'ADMIN' AND \"deletedAt\" IS NULL;
"
```

### 7️⃣ Verificar Logs

```bash
echo "=== LOGS DO BACKEND ==="
docker logs embarcacoes_backend_prod --tail=100 | grep -i error

echo "=== LOGS DO BANCO ==="
docker logs embarcacoes_db_prod --tail=100 | grep -i error
```

### 8️⃣ Testar Health

```bash
curl -f http://localhost:3001/health && echo "✅ Backend OK"
curl -f https://app.infinitynautica.com.br/api/health && echo "✅ API OK"
```

### 9️⃣ Verificar Contagens

```bash
docker exec embarcacoes_db_prod psql -U postgres -d embarcacoes -c "
SELECT 
    'Usuários' as item, COUNT(*)::text FROM users WHERE \"deletedAt\" IS NULL
UNION ALL
SELECT 'Embarcações', COUNT(*)::text FROM vessels WHERE \"deletedAt\" IS NULL
UNION ALL
SELECT 'Reservas', COUNT(*)::text FROM bookings WHERE \"deletedAt\" IS NULL;
"
```

### 🔟 Verificar Reservas Recentes

```bash
docker exec embarcacoes_db_prod psql -U postgres -d embarcacoes -c "
SELECT 
    TO_CHAR(b.\"bookingDate\", 'DD/MM/YYYY') as data,
    b.status, u.email, v.name
FROM bookings b
JOIN users u ON b.\"userId\" = u.id
JOIN vessels v ON b.\"vesselId\" = v.id
WHERE b.\"deletedAt\" IS NULL
ORDER BY b.\"bookingDate\" DESC LIMIT 10;
"
```

---

## 📋 CHECKLIST RÁPIDO

Execute estes comandos para verificar rapidamente:

```bash
echo "=== CHECKLIST ==="

echo "1️⃣ Containers..."
docker ps | grep embarcacoes | awk '{print $1, $7}'

echo ""
echo "2️⃣ Migrations..."
docker exec embarcacoes_backend_prod npx prisma migrate status 2>&1 | grep -E "applied|pending"

echo ""
echo "3️⃣ Admin..."
docker exec embarcacoes_db_prod psql -U postgres -d embarcacoes -t -c "
SELECT COUNT(*) FROM users WHERE role = 'ADMIN' AND \"deletedAt\" IS NULL;
" | xargs echo "Admins ativos:"

echo ""
echo "4️⃣ Erros nos logs..."
docker logs embarcacoes_backend_prod --tail=100 2>&1 | grep -c "error\|ERROR" || echo "✅ Nenhum erro"

echo ""
echo "5️⃣ Health check..."
curl -s -o /dev/null -w "Status: %{http_code}\n" https://app.infinitynautica.com.br/api/health

echo ""
echo "=== FIM CHECKLIST ==="
```

---

## ⚡ COMANDO TUDO-EM-UM

Copie e cole este bloco completo no servidor:

```bash
#!/bin/bash
set -e

cd /opt/embarcacoes

echo "🔄 Pull do código..."
git pull origin main

echo "💾 Backup..."
mkdir -p backups
docker exec embarcacoes_db_prod pg_dump -U postgres embarcacoes > backups/backup_$(date +%Y%m%d_%H%M%S).sql

echo "🔨 Rebuild..."
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

echo "⏳ Aguardando..."
sleep 15

echo "✅ Status..."
docker compose -f docker-compose.prod.yml ps

echo "✅ Migrations..."
docker exec embarcacoes_backend_prod npx prisma migrate status

echo "✅ Verificação..."
docker exec embarcacoes_db_prod psql -U postgres -d embarcacoes -c "
SELECT 
    'users' as tabela, COUNT(*) as total FROM users WHERE \"deletedAt\" IS NULL
UNION ALL SELECT 'vessels', COUNT(*) FROM vessels WHERE \"deletedAt\" IS NULL
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings WHERE \"deletedAt\" IS NULL;
"

echo ""
echo "🎉 Concluído! Verificar logs manualmente."
```

---

## 🆘 SE O ADMIN NÃO EXISTIR

Criar admin usando seed:

```bash
docker exec embarcacoes_backend_prod node prisma/seed.js
```

---

## 📚 DOCUMENTAÇÃO COMPLETA

- 📄 **Guia Detalhado**: `VERIFICACAO-BANCO-DADOS.md`
- 🚀 **Execução no Servidor**: `EXECUTE-VERIFICACAO-SERVIDOR.md`
- 🚀 **Deploy Completo**: `GUIA-DEPLOY-COMPLETO.md`

---

## 🎉 RESULTADO ESPERADO

Após executar todos os comandos:

```
✅ Banco de dados atualizado com sucesso.
✅ Todos os dados íntegros e acessíveis.
✅ Login funcionando normalmente.
✅ Migrations aplicadas corretamente.
✅ Sistema 100% estável.
```

