#!/bin/bash
# Comandos corrigidos para verificação do banco de dados
# Usuário correto: embarcacoes (não postgres)

echo "=================================="
echo "VERIFICAÇÃO DO BANCO DE DADOS"
echo "=================================="
echo ""

echo "1️⃣ Criando backup..."
mkdir -p backups
docker exec embarcacoes_db_prod pg_dump -U embarcacoes embarcacoes_db > backups/backup_$(date +%Y%m%d_%H%M%S).sql
echo "✅ Backup criado!"
echo ""

echo "2️⃣ Verificando migrations..."
docker exec embarcacoes_backend_prod npx prisma migrate status
echo ""

echo "3️⃣ Verificando Admin..."
docker exec embarcacoes_db_prod psql -U embarcacoes -d embarcacoes_db -c "
SELECT id, email, name, role, \"isActive\", status
FROM users WHERE role = 'ADMIN' AND \"deletedAt\" IS NULL;
"
echo ""

echo "4️⃣ Contagem de registros..."
docker exec embarcacoes_db_prod psql -U embarcacoes -d embarcacoes_db -c "
SELECT 
    'Usuários' as item, COUNT(*)::text FROM users WHERE \"deletedAt\" IS NULL
UNION ALL
SELECT 'Embarcações', COUNT(*)::text FROM vessels WHERE \"deletedAt\" IS NULL
UNION ALL
SELECT 'Reservas', COUNT(*)::text FROM bookings WHERE \"deletedAt\" IS NULL
UNION ALL
SELECT 'Relações', COUNT(*)::text FROM user_vessels;
"
echo ""

echo "5️⃣ Verificando reservas recentes..."
docker exec embarcacoes_db_prod psql -U embarcacoes -d embarcacoes_db -c "
SELECT 
    TO_CHAR(b.\"bookingDate\", 'DD/MM/YYYY') as data,
    b.status, u.email, v.name
FROM bookings b
JOIN users u ON b.\"userId\" = u.id
JOIN vessels v ON b.\"vesselId\" = v.id
WHERE b.\"deletedAt\" IS NULL
ORDER BY b.\"bookingDate\" DESC LIMIT 10;
"
echo ""

echo "6️⃣ Verificando logs do backend..."
docker logs embarcacoes_backend_prod --tail=50 | grep -i error || echo "✅ Nenhum erro encontrado"
echo ""

echo "7️⃣ Testando health check..."
curl -f http://localhost:3001/health && echo "✅ Backend OK"
curl -f https://app.infinitynautica.com.br/api/health && echo "✅ API OK"
echo ""

echo "=================================="
echo "VERIFICAÇÃO CONCLUÍDA!"
echo "=================================="

