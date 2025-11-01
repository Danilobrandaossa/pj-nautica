#!/bin/bash

# 🚀 Script de Deploy no Servidor VPS
# Este script é executado no servidor após o código ser atualizado

set -e

echo "🚀 INICIANDO DEPLOY NO SERVIDOR"
echo "================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.prod.yml" ]; then
    error "Arquivo docker-compose.prod.yml não encontrado. Execute este script no diretório raiz do projeto."
fi

# Verificar se .env existe
if [ ! -f ".env" ]; then
    warn "Arquivo .env não encontrado!"
    if [ -f "env.production.example" ]; then
        info "Copiando env.production.example para .env..."
        cp env.production.example .env
        warn "⚠️  Configure as variáveis de ambiente no arquivo .env antes de continuar!"
        exit 1
    else
        error "Arquivo env.production.example não encontrado!"
    fi
fi

log "=== FASE 1: PREPARANDO AMBIENTE ==="

# Criar diretórios necessários
log "Criando diretórios necessários..."
mkdir -p nginx/ssl certbot/conf certbot/www
mkdir -p backend/dist frontend/dist

# Garantir permissões corretas
log "Ajustando permissões..."
chmod -R 755 nginx certbot || true

log "=== FASE 2: PARANDO CONTAINERS ANTIGOS ==="

# Parar containers existentes
log "Parando containers existentes..."
docker-compose -f docker-compose.prod.yml down || true

# Limpar imagens antigas (opcional, comentado para não perder tempo)
# log "Limpando imagens antigas..."
# docker-compose -f docker-compose.prod.yml down --rmi all || true

log "=== FASE 3: CONSTRUINDO IMAGENS ==="

# Build das imagens
log "Construindo imagens Docker..."
docker-compose -f docker-compose.prod.yml build --no-cache

log "=== FASE 4: INICIANDO CONTAINERS ==="

# Iniciar containers
log "Iniciando containers..."
docker-compose -f docker-compose.prod.yml up -d

# Aguardar containers iniciarem
log "Aguardando containers iniciarem..."
sleep 30

# Verificar saúde dos containers
log "Verificando saúde dos containers..."
for i in {1..30}; do
    if docker-compose -f docker-compose.prod.yml ps | grep -q "healthy\|Up"; then
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

log "=== FASE 5: EXECUTANDO MIGRAÇÕES ==="

# Executar migrações do banco
log "Executando migrações do Prisma..."
docker-compose -f docker-compose.prod.yml exec -T backend npm run prisma:generate || true
docker-compose -f docker-compose.prod.yml exec -T backend npm run prisma:migrate || warn "Migrações falharam ou já estão atualizadas"

log "=== FASE 6: LIMPEZA ==="

# Limpar containers órfãos e volumes não utilizados
log "Limpando recursos não utilizados..."
docker-compose -f docker-compose.prod.yml up -d --remove-orphans
docker system prune -f || true

log "=== FASE 7: VERIFICAÇÃO FINAL ==="

# Verificar status dos containers
log "Status dos containers:"
docker-compose -f docker-compose.prod.yml ps

# Verificar logs recentes
log "Últimas linhas dos logs (últimos 20):"
docker-compose -f docker-compose.prod.yml logs --tail=20

# Testar endpoints
log "Testando endpoints..."
if command -v curl &> /dev/null; then
    sleep 5
    if curl -f http://localhost/api/health &> /dev/null; then
        log "✅ Backend está respondendo!"
    else
        warn "⚠️  Backend ainda não está respondendo (pode estar iniciando...)"
    fi
else
    warn "curl não está instalado, pulando teste de endpoints"
fi

log "================================"
log "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
log "================================"
info "📊 Para ver os logs em tempo real:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
info "🛠️  Para reiniciar os containers:"
echo "   docker-compose -f docker-compose.prod.yml restart"
echo ""
info "🔄 Para ver o status:"
echo "   docker-compose -f docker-compose.prod.yml ps"


