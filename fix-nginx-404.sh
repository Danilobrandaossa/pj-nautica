#!/bin/bash

# 🔧 Script para Corrigir Erro 404 do Nginx
# Execute no servidor: bash fix-nginx-404.sh

set -e

echo "🔧 CORRIGINDO CONFIGURAÇÃO DO NGINX"
echo "===================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd /opt/embarcacoes

echo "1️⃣ Verificando containers em execução..."
echo "-----------------------------------"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "2️⃣ Verificando se Nginx do sistema está rodando..."
echo "-----------------------------------"
if systemctl is-active --quiet nginx; then
    echo -e "${YELLOW}⚠️  Nginx do sistema está rodando!${NC}"
    echo "   Isso pode estar causando conflito com o container Nginx"
    echo ""
    read -p "Deseja parar o Nginx do sistema? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "   Parando Nginx do sistema..."
        systemctl stop nginx
        systemctl disable nginx
        echo -e "${GREEN}✅ Nginx do sistema parado${NC}"
    fi
else
    echo -e "${GREEN}✅ Nginx do sistema não está rodando${NC}"
fi

echo ""
echo "3️⃣ Verificando container Nginx..."
echo "-----------------------------------"
NGINX_CONTAINER=$(docker ps --format "{{.Names}}" | grep nginx || echo "")
if [ -z "$NGINX_CONTAINER" ]; then
    echo -e "${RED}❌ Container Nginx não está rodando!${NC}"
    echo "   Iniciando container Nginx..."
    docker-compose -f docker-compose.prod.yml up -d nginx
    sleep 5
else
    echo -e "${GREEN}✅ Container Nginx: $NGINX_CONTAINER${NC}"
fi

echo ""
echo "4️⃣ Verificando configuração do Nginx..."
echo "-----------------------------------"
if [ -f "nginx/nginx.conf" ]; then
    echo -e "${GREEN}✅ Arquivo nginx.conf encontrado${NC}"
    echo ""
    echo "   Conteúdo básico da configuração:"
    head -20 nginx/nginx.conf | grep -E "server|location|proxy_pass" || echo "   Configuração não mostra proxy direto"
else
    echo -e "${RED}❌ Arquivo nginx/nginx.conf não encontrado!${NC}"
    echo "   Criando configuração básica..."
    
    mkdir -p nginx
    cat > nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3001;
    }

    upstream frontend {
        server frontend:80;
    }

    server {
        listen 80;
        server_name _;

        client_max_body_size 10M;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://backend/health;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # PWA Manifest
        location /api/pwa {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF
    echo -e "${GREEN}✅ Configuração criada${NC}"
fi

echo ""
echo "5️⃣ Verificando se containers estão na mesma rede..."
echo "-----------------------------------"
docker network ls | grep embarcacoes || echo "   Rede embarcacoes não encontrada"

echo ""
echo "6️⃣ Verificando conectividade entre containers..."
echo "-----------------------------------"
NGINX_CONTAINER=$(docker ps --format "{{.Names}}" | grep nginx | head -1)
if [ -n "$NGINX_CONTAINER" ]; then
    echo "   Testando conexão do Nginx para Frontend..."
    docker exec $NGINX_CONTAINER ping -c 1 frontend > /dev/null 2>&1 && \
        echo -e "${GREEN}✅ Nginx consegue alcançar Frontend${NC}" || \
        echo -e "${RED}❌ Nginx NÃO consegue alcançar Frontend${NC}"
    
    echo "   Testando conexão do Nginx para Backend..."
    docker exec $NGINX_CONTAINER ping -c 1 backend > /dev/null 2>&1 && \
        echo -e "${GREEN}✅ Nginx consegue alcançar Backend${NC}" || \
        echo -e "${RED}❌ Nginx NÃO consegue alcançar Backend${NC}"
fi

echo ""
echo "7️⃣ Reiniciando containers Nginx..."
echo "-----------------------------------"
docker-compose -f docker-compose.prod.yml restart nginx
sleep 5

echo ""
echo "8️⃣ Verificando logs do Nginx..."
echo "-----------------------------------"
docker-compose -f docker-compose.prod.yml logs --tail=20 nginx

echo ""
echo "9️⃣ Testando acesso interno..."
echo "-----------------------------------"
echo "   Testando Frontend diretamente..."
FRONTEND_CONTAINER=$(docker ps --format "{{.Names}}" | grep frontend | head -1)
if [ -n "$FRONTEND_CONTAINER" ]; then
    docker exec $FRONTEND_CONTAINER wget -q -O- http://localhost/ | head -5 || echo "   Frontend não responde"
fi

echo "   Testando Backend diretamente..."
BACKEND_CONTAINER=$(docker ps --format "{{.Names}}" | grep backend | head -1)
if [ -n "$BACKEND_CONTAINER" ]; then
    docker exec $BACKEND_CONTAINER wget -q -O- http://localhost:3001/health || echo "   Backend não responde"
fi

echo ""
echo "🔟 Verificando portas..."
echo "-----------------------------------"
echo "   Porta 80:"
netstat -tuln | grep ":80 " || ss -tuln | grep ":80 " || echo "   Porta 80 não está em uso"
echo "   Portas dos containers Nginx:"
docker port $(docker ps --format "{{.Names}}" | grep nginx | head -1) 2>/dev/null || echo "   Container Nginx não encontrado"

echo ""
echo "===================================="
echo "✅ CORREÇÃO CONCLUÍDA!"
echo "===================================="
echo ""
echo "Próximos passos:"
echo "1. Verifique os logs: docker-compose -f docker-compose.prod.yml logs -f nginx"
echo "2. Teste o acesso: curl http://localhost"
echo "3. Verifique se o Nginx do sistema está desabilitado: systemctl status nginx"
echo ""
echo "Se ainda não funcionar, verifique:"
echo "- docker-compose -f docker-compose.prod.yml ps (todos containers devem estar 'Up')"
echo "- docker-compose -f docker-compose.prod.yml logs frontend"
echo "- docker-compose -f docker-compose.prod.yml logs backend"


