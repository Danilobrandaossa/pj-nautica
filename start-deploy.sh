#!/bin/bash

# Script para iniciar o deploy após upload dos arquivos
# Execute este script no servidor VPS após fazer upload dos arquivos

set -e

echo "🚀 Iniciando aplicação..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
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

# Verificar se está no diretório correto
if [ ! -f "docker-compose.prod.yml" ]; then
    error "Arquivo docker-compose.prod.yml não encontrado. Execute este script no diretório do projeto."
fi

# Verificar se arquivo .env existe
if [ ! -f ".env" ]; then
    warn "Arquivo .env não encontrado. Copiando env.production para .env"
    cp env.production .env
fi

log "Parando containers existentes..."
docker-compose -f docker-compose.prod.yml down || true

log "Removendo containers e volumes antigos..."
docker system prune -f || true

log "Construindo e iniciando containers..."
docker-compose -f docker-compose.prod.yml up -d --build

log "Aguardando banco de dados inicializar..."
sleep 30

log "Executando migrações do banco de dados..."
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate

log "Executando seed do banco de dados..."
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:seed

log "Verificando status dos containers..."
docker-compose -f docker-compose.prod.yml ps

log "✅ Deploy concluído com sucesso!"
echo ""
info "🌐 Aplicação disponível em:"
echo "   Frontend: http://145.223.93.235"
echo "   Backend API: http://145.223.93.235/api"
echo "   n8n: http://145.223.93.235:5678"
echo ""
info "📊 Para monitorar os logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
info "🛠️ Para parar a aplicação:"
echo "   docker-compose -f docker-compose.prod.yml down"
