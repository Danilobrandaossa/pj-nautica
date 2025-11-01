#!/bin/bash

# 🚀 SCRIPT DE DEPLOY PARA SUBDOMÍNIO - inffinity.goredirect.com.br
# Execute este script no VPS para configurar o sistema no subdomínio

set -e

echo "🚀 INICIANDO DEPLOY PARA SUBDOMÍNIO"
echo "====================================="
echo "Domínio: inffinity.goredirect.com.br"
echo "n8n: n8n.inffinity.goredirect.com.br"
echo ""

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
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release nginx certbot python3-certbot-nginx

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

# Copiar docker-compose
log "Copiando docker-compose.subdominio.yml..."
cp docker-compose.subdominio.yml docker-compose.prod.yml

# Copiar nginx config
log "Copiando nginx.subdominio.conf..."
cp nginx.subdominio.conf nginx/nginx.conf

# Copiar env
log "Copiando env.subdominio..."
cp env.subdominio .env

log "=== FASE 4: CONFIGURANDO SSL ==="

# Parar nginx se estiver rodando
systemctl stop nginx || true

# Obter certificados SSL
log "Obtendo certificados SSL..."

# Certificado para domínio principal
certbot certonly --standalone -d inffinity.goredirect.com.br --non-interactive --agree-tos --email contato@danilobrandao.com.br

# Certificado para n8n
certbot certonly --standalone -d n8n.inffinity.goredirect.com.br --non-interactive --agree-tos --email contato@danilobrandao.com.br

# Copiar certificados para o diretório do projeto
log "Copiando certificados..."
cp -r /etc/letsencrypt/* ./certbot/conf/

log "=== FASE 5: CONFIGURANDO VARIÁVEIS DE AMBIENTE ==="

log "Configurando variáveis de ambiente..."
cat > .env << 'EOF'
# Database Configuration
POSTGRES_USER=embarcacoes
POSTGRES_PASSWORD=Embarcacoes2024!@#Seguro
POSTGRES_DB=embarcacoes_db

# Backend Configuration
NODE_ENV=production
JWT_SECRET=JWT_Secret_Super_Seguro_2024_Embarcacoes_Inffinity!@#$%^&*()
JWT_REFRESH_SECRET=Refresh_Secret_Super_Seguro_2024_Embarcacoes_Inffinity!@#$%^&*()

# URLs
FRONTEND_URL=https://inffinity.goredirect.com.br
VITE_API_URL=https://inffinity.goredirect.com.br/api

# n8n Configuration
N8N_USER=admin
N8N_PASSWORD=AdminN8N2024!@#Seguro
N8N_HOST=n8n.inffinity.goredirect.com.br
N8N_WEBHOOK_URL=https://n8n.inffinity.goredirect.com.br/webhook
EOF

log "=== FASE 6: INICIANDO APLICAÇÃO ==="

log "Construindo e iniciando containers..."
docker-compose -f docker-compose.prod.yml up -d --build

log "Aguardando containers iniciarem..."
sleep 30

log "Executando migrações do banco de dados..."
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate

log "Inicializando banco de dados (criando conta admin)..."
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:seed

log "Verificando status dos containers..."
docker-compose -f docker-compose.prod.yml ps

log "=== DEPLOY CONCLUÍDO! ==="
echo ""
info "🌐 URLs de Acesso:"
echo "   Sistema: https://inffinity.goredirect.com.br"
echo "   API: https://inffinity.goredirect.com.br/api"
echo "   n8n: https://n8n.inffinity.goredirect.com.br"
echo ""
info "🔑 Suas Credenciais de Admin:"
echo "   Email: contato@danilobrandao.com.br"
echo "   Senha: Zy598859D@n"
echo ""
info "🔐 Credenciais do n8n:"
echo "   Usuário: admin"
echo "   Senha: AdminN8N2024!@#Seguro"
echo ""
info "🚀 Próximos Passos:"
echo "   1. Acesse: https://inffinity.goredirect.com.br"
echo "   2. Faça login com suas credenciais"
echo "   3. Cadastre suas embarcações"
echo "   4. Cadastre seus usuários"
echo "   5. Configure o sistema conforme necessário"
echo ""
info "📊 Para monitorar os logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
info "🛠️ Para parar a aplicação:"
echo "   docker-compose -f docker-compose.prod.yml down"
echo ""
log "✅ Sistema de Embarcações deployado com sucesso no subdomínio!"

