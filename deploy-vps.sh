#!/bin/bash

# 🚀 SCRIPT DE DEPLOY COMPLETO - SISTEMA DE EMBARCAÇÕES
# Execute este script no VPS para subir todo o projeto

set -e

echo "🚀 INICIANDO DEPLOY COMPLETO DO SISTEMA DE EMBARCAÇÕES"
echo "=================================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    error "Este script deve ser executado como root (sudo)"
fi

log "=== FASE 1: PREPARANDO SERVIDOR ==="

# Atualizar sistema
log "Atualizando sistema..."
apt update && apt upgrade -y

# Instalar dependências
log "Instalando dependências necessárias..."
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Instalar Docker
log "Instalando Docker..."
apt remove -y docker docker-engine docker.io containerd runc || true
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Iniciar Docker
systemctl start docker
systemctl enable docker

# Instalar Docker Compose standalone
log "Instalando Docker Compose standalone..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verificar instalações
log "Verificando instalações..."
docker --version
docker-compose --version

log "=== FASE 2: PREPARANDO DIRETÓRIO ==="

# Criar diretório do projeto
log "Criando diretório do projeto..."
mkdir -p /opt/embarcacoes
cd /opt/embarcacoes

# Limpar diretório anterior
log "Limpando diretório anterior..."
rm -rf * .*

# Criar estrutura de diretórios
log "Criando estrutura de diretórios..."
mkdir -p nginx ssl certbot/conf certbot/www

log "=== FASE 3: CRIANDO ARQUIVOS DE CONFIGURAÇÃO ==="

# Criar docker-compose.prod.yml
log "Criando docker-compose.prod.yml..."
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: embarcacoes_db_prod
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-embarcacoes}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-embarcacoes_db}
    volumes:
      - postgres_data_prod:/var/lib/postgresql/data
    networks:
      - embarcacoes_network_prod
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-embarcacoes}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: embarcacoes_backend_prod
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER:-embarcacoes}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-embarcacoes_db}?schema=public
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      FRONTEND_URL: ${FRONTEND_URL}
      PORT: 3001
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - embarcacoes_network_prod
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        VITE_API_URL: ${VITE_API_URL}
    container_name: embarcacoes_frontend_prod
    restart: always
    depends_on:
      - backend
    networks:
      - embarcacoes_network_prod

  nginx:
    image: nginx:alpine
    container_name: embarcacoes_nginx_prod
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - frontend
    networks:
      - embarcacoes_network_prod

  n8n:
    image: n8nio/n8n:latest
    container_name: embarcacoes_n8n_prod
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER:-admin}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - N8N_HOST=${N8N_HOST:-145.223.93.235}
      - N8N_PROTOCOL=http
      - NODE_ENV=production
      - WEBHOOK_URL=${N8N_WEBHOOK_URL}
    volumes:
      - n8n_data_prod:/home/node/.n8n
    networks:
      - embarcacoes_network_prod

volumes:
  postgres_data_prod:
    driver: local
  n8n_data_prod:
    driver: local

networks:
  embarcacoes_network_prod:
    driver: bridge
EOF

# Criar arquivo .env
log "Criando arquivo .env..."
cat > .env << 'EOF'
# Database Configuration
POSTGRES_USER=embarcacoes
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=embarcacoes_db

# Backend Configuration
NODE_ENV=production
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}

# URLs
FRONTEND_URL=${FRONTEND_URL}
VITE_API_URL=${VITE_API_URL}

# n8n Configuration
N8N_USER=${N8N_USER}
N8N_PASSWORD=${N8N_PASSWORD}
N8N_HOST=${N8N_HOST}
N8N_WEBHOOK_URL=${N8N_WEBHOOK_URL}
EOF

# Criar configuração do Nginx
log "Criando configuração do Nginx..."
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

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api {
            proxy_pass http://backend;
            proxy_set_header Host $host;
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
    }
}
EOF

log "=== FASE 4: PREPARANDO ARQUIVOS DO PROJETO ==="

# Criar diretórios do projeto
log "Criando estrutura do projeto..."
mkdir -p backend/src
mkdir -p frontend/src
mkdir -p backend/prisma
mkdir -p frontend/public

log "=== FASE 5: INSTRUÇÕES PARA UPLOAD ==="

echo ""
info "📋 PRÓXIMOS PASSOS:"
echo ""
info "1. Faça upload dos arquivos do projeto para /opt/embarcacoes/"
echo ""
info "2. Configure as variáveis de ambiente no arquivo .env:"
echo "   - POSTGRES_PASSWORD (senha segura para o banco)"
echo "   - JWT_SECRET (chave JWT segura)"
echo "   - JWT_REFRESH_SECRET (chave refresh segura)"
echo "   - FRONTEND_URL (URL do frontend)"
echo "   - VITE_API_URL (URL da API)"
echo "   - N8N_PASSWORD (senha do n8n)"
echo ""
info "3. Execute o comando para iniciar o sistema:"
echo "   docker-compose -f docker-compose.prod.yml up -d --build"
echo ""
info "4. Execute as migrações do banco:"
echo "   docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate"
echo ""
info "5. Execute o seed para criar sua conta admin:"
echo "   docker-compose -f docker-compose.prod.yml exec backend npm run prisma:seed"
echo ""

log "=== PREPARAÇÃO CONCLUÍDA! ==="
echo ""
info "🌐 URLs de Acesso:"
echo "   Frontend: http://145.223.93.235"
echo "   Backend API: http://145.223.93.235/api"
echo "   n8n: http://145.223.93.235:5678"
echo ""
info "🔑 Suas Credenciais de Admin:"
echo "   Email: contato@danilobrandao.com.br"
echo "   Senha: Zy598859D@n"
echo ""
info "📊 Para monitorar os logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
info "🛠️ Para parar a aplicação:"
echo "   docker-compose -f docker-compose.prod.yml down"
echo ""
log "✅ Sistema preparado para deploy!"

