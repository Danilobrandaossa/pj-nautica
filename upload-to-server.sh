#!/bin/bash

# Script para fazer upload dos arquivos para o servidor
# Execute este script do seu computador local

set -e

echo "📤 Fazendo upload dos arquivos para o servidor..."

# Configurações do servidor
SERVER_IP="145.223.93.235"
SERVER_USER="root"
SERVER_PATH="/opt/embarcacoes"

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

# Verificar se rsync está disponível
if ! command -v rsync &> /dev/null; then
    error "rsync não está instalado. Instale com: apt install rsync (Linux) ou brew install rsync (macOS)"
fi

log "Fazendo upload dos arquivos do projeto..."
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.env' \
    --exclude '*.log' \
    --exclude 'dist' \
    --exclude 'build' \
    . ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/

log "Fazendo upload do arquivo de configuração de produção..."
scp env.production ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/.env

log "Fazendo upload dos scripts de deploy..."
scp prepare-server.sh ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/
scp start-deploy.sh ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/

log "Tornando scripts executáveis..."
ssh ${SERVER_USER}@${SERVER_IP} "chmod +x ${SERVER_PATH}/prepare-server.sh ${SERVER_PATH}/start-deploy.sh"

log "✅ Upload concluído com sucesso!"
echo ""
info "🌐 Próximos passos:"
echo "1. Conecte ao servidor: ssh ${SERVER_USER}@${SERVER_IP}"
echo "2. Execute: cd ${SERVER_PATH}"
echo "3. Execute: ./start-deploy.sh"
echo ""
info "📊 Para monitorar o deploy:"
echo "   ssh ${SERVER_USER}@${SERVER_IP} 'cd ${SERVER_PATH} && docker-compose -f docker-compose.prod.yml logs -f'"
