#!/bin/bash

echo "=========================================="
echo "🔍 VERIFICAÇÃO COMPLETA DE ERROS"
echo "=========================================="
echo ""

echo "1️⃣ Status dos Containers:"
echo "----------------------------------------"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "2️⃣ Logs do Backend (últimos 30 erros):"
echo "----------------------------------------"
docker logs embarcacoes_backend_prod --tail=100 2>&1 | grep -i error | tail -30
if [ $? -ne 0 ]; then
    echo "Nenhum erro encontrado nos logs recentes"
fi
echo ""

echo "3️⃣ Logs do Frontend (últimos 30 erros):"
echo "----------------------------------------"
docker logs embarcacoes_frontend_prod --tail=100 2>&1 | grep -i error | tail -30
if [ $? -ne 0 ]; then
    echo "Nenhum erro encontrado nos logs recentes"
fi
echo ""

echo "4️⃣ Logs do Nginx (últimos 30 erros):"
echo "----------------------------------------"
docker logs embarcacoes_nginx_prod --tail=100 2>&1 | grep -i error | tail -30
if [ $? -ne 0 ]; then
    echo "Nenhum erro encontrado nos logs recentes"
fi
echo ""

echo "5️⃣ Testando Endpoints Principais:"
echo "----------------------------------------"
echo -n "GET /health: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health || echo "ERRO"
echo ""

echo -n "GET /api/pwa/manifest.json: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/pwa/manifest.json || echo "ERRO"
echo ""

echo -n "GET /api/pwa/manifest.json (via nginx): "
curl -s -o /dev/null -w "%{http_code}" http://app.infinitynautica.com.br/api/pwa/manifest.json || echo "ERRO"
echo ""

echo -n "GET / (frontend): "
curl -s -o /dev/null -w "%{http_code}" http://app.infinitynautica.com.br/ || echo "ERRO"
echo ""

echo "6️⃣ Erros de CORS no Backend:"
echo "----------------------------------------"
docker logs embarcacoes_backend_prod --tail=100 2>&1 | grep -i "Origin é obrigatório" | tail -10
echo ""

echo "7️⃣ Erros de Conexão com Banco:"
echo "----------------------------------------"
docker logs embarcacoes_backend_prod --tail=100 2>&1 | grep -iE "database|prisma|connection" | grep -i error | tail -10
echo ""

echo "8️⃣ Resumo de Health Checks:"
echo "----------------------------------------"
echo -n "Backend health: "
docker inspect embarcacoes_backend_prod --format='{{.State.Health.Status}}' 2>/dev/null || echo "N/A"
echo -n "Frontend health: "
docker inspect embarcacoes_frontend_prod --format='{{.State.Health.Status}}' 2>/dev/null || echo "N/A"
echo -n "PostgreSQL health: "
docker inspect embarcacoes_db_prod --format='{{.State.Health.Status}}' 2>/dev/null || echo "N/A"
echo ""

echo "9️⃣ Últimas 20 linhas de log do Backend:"
echo "----------------------------------------"
docker logs embarcacoes_backend_prod --tail=20
echo ""

echo "=========================================="
echo "✅ Verificação concluída!"
echo "=========================================="

