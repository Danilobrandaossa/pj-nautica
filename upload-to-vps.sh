#!/bin/bash

# 📤 SCRIPT DE UPLOAD PARA VPS
# Execute este script do seu computador local para fazer upload dos arquivos

set -e

echo "📤 INICIANDO UPLOAD DOS ARQUIVOS PARA VPS"
echo "========================================"

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

# Configurações
VPS_IP="145.223.93.235"
VPS_USER="root"
VPS_PATH="/opt/embarcacoes"

log "=== CONFIGURAÇÕES ==="
echo "VPS IP: $VPS_IP"
echo "VPS User: $VPS_USER"
echo "VPS Path: $VPS_PATH"
echo ""

# Verificar se SCP está disponível
if ! command -v scp &> /dev/null; then
    error "SCP não encontrado. Instale o OpenSSH client."
fi

# Verificar se SSH está disponível
if ! command -v ssh &> /dev/null; then
    error "SSH não encontrado. Instale o OpenSSH client."
fi

log "=== FAZENDO UPLOAD DOS ARQUIVOS ==="

# Criar arquivo .rsyncignore para excluir arquivos desnecessários
cat > .rsyncignore << 'EOF'
node_modules
.git
.env
.env.local
.env.production
*.log
dist
build
.DS_Store
Thumbs.db
*.tmp
*.temp
coverage
.nyc_output
.vscode
.idea
*.swp
*.swo
*~
EOF

# Fazer upload usando rsync (mais eficiente)
log "Fazendo upload dos arquivos..."
rsync -avz --progress --exclude-from=.rsyncignore . $VPS_USER@$VPS_IP:$VPS_PATH/

# Remover arquivo temporário
rm -f .rsyncignore

log "=== CONFIGURANDO PERMISSÕES ==="

# Configurar permissões no VPS
log "Configurando permissões..."
ssh $VPS_USER@$VPS_IP "cd $VPS_PATH && chmod +x deploy-vps.sh"

log "=== UPLOAD CONCLUÍDO! ==="
echo ""
info "📋 PRÓXIMOS PASSOS NO VPS:"
echo ""
info "1. Conecte ao VPS:"
echo "   ssh $VPS_USER@$VPS_IP"
echo ""
info "2. Navegue para o diretório:"
echo "   cd $VPS_PATH"
echo ""
info "3. Configure as variáveis de ambiente:"
echo "   nano .env"
echo ""
info "4. Execute o script de preparação:"
echo "   ./deploy-vps.sh"
echo ""
info "5. Inicie o sistema:"
echo "   docker-compose -f docker-compose.prod.yml up -d --build"
echo ""
info "6. Execute as migrações:"
echo "   docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate"
echo ""
info "7. Execute o seed:"
echo "   docker-compose -f docker-compose.prod.yml exec backend npm run prisma:seed"
echo ""

log "✅ Upload concluído com sucesso!"

