#!/bin/bash

# =====================================================
# SCRIPT PARA EXECUTAR NO SERVIDOR
# Corrige todos os problemas automaticamente
# =====================================================

set -e

echo "=================================================="
echo "🔧 CORRIGINDO PROBLEMAS CRÍTICOS"
echo "=================================================="
echo ""

# 1. Criar backup
echo "1️⃣ Criando backup..."
cd /opt/embarcacoes
mkdir -p backups
docker exec embarcacoes_db_prod pg_dump -U embarcacoes embarcacoes_db > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Pull código
echo ""
echo "2️⃣ Atualizando código..."
git pull origin main

# 3. Verificar e ativar SSL
echo ""
echo "3️⃣ Verificando SSL..."
if [ -d "certbot/conf/live/app.infinitynautica.com.br" ]; then
    echo "✅ Certificados encontrados!"
    
    # Ativar SSL no Nginx
    if [ -f "nginx/nginx.conf.ssl" ]; then
        echo "Ativando HTTPS..."
        cp nginx/nginx.conf nginx/nginx.conf.backup
        cp nginx/nginx.conf.ssl nginx/nginx.conf
        echo "✅ SSL ativado!"
    fi
else
    echo "⚠️  Certificados não encontrados"
    echo "Execute: bash setup-ssl.sh app.infinitynautica.com.br"
fi

# 4. Rebuild
echo ""
echo "4️⃣ Rebuild containers..."
docker compose -f docker-compose.prod.yml build --no-cache

# 5. Restart
echo ""
echo "5️⃣ Reiniciando serviços..."
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# 6. Aguardar
echo ""
echo "6️⃣ Aguardando inicialização..."
sleep 20

# 7. Verificar
echo ""
echo "7️⃣ Verificando status..."
docker ps | grep embarcacoes
echo ""
docker exec embarcacoes_backend_prod npx prisma migrate status

echo ""
echo "=================================================="
echo "✅ CORREÇÃO CONCLUÍDA!"
echo "=================================================="

