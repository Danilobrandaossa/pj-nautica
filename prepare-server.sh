#!/bin/bash

# Script de Deploy Completo - Sistema de Embarcações
# Execute este script no servidor VPS

set -e

echo "🚀 Iniciando deploy do sistema de embarcações..."

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

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    error "Este script deve ser executado como root"
fi

log "Atualizando sistema..."
apt update && apt upgrade -y

log "Instalando dependências necessárias..."
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

log "Instalando Docker..."
# Remover versões antigas
apt remove -y docker docker-engine docker.io containerd runc

# Instalar Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Iniciar e habilitar Docker
systemctl start docker
systemctl enable docker

log "Instalando Docker Compose standalone..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

log "Verificando instalações..."
docker --version
docker-compose --version

log "Criando diretório do projeto..."
mkdir -p /opt/embarcacoes
cd /opt/embarcacoes

log "Limpando diretório anterior (se existir)..."
rm -rf * .*

log "Criando estrutura de diretórios..."
mkdir -p nginx ssl certbot/conf certbot/www

log "Deploy concluído! Agora você precisa:"
echo "1. Fazer upload dos arquivos do projeto para /opt/embarcacoes"
echo "2. Configurar o arquivo .env com as variáveis de ambiente"
echo "3. Executar: docker-compose -f docker-compose.prod.yml up -d"

info "Sistema preparado para receber os arquivos do projeto!"
