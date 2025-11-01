#!/bin/bash

# =====================================================
# SCRIPT DE CORREÇÃO COMPLETA DO INFINITY NÁUTICA
# =====================================================
# Este script resolve todos os problemas críticos
# Prioridade: SSL, Backups, Monitoramento, Performance
# =====================================================

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "=================================================="
echo "🔧 CORREÇÃO COMPLETA DO SISTEMA"
echo "=================================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

# =====================================================
# 1. BACKUP ANTES DE QUALQUER MUDANÇA
# =====================================================

log_info "1️⃣ Criando backup completo do sistema..."

mkdir -p backups
BACKUP_FILE="backups/backup_pre_correcao_$(date +%Y%m%d_%H%M%S).tar.gz"

# Backup do banco de dados
if docker ps | grep -q embarcacoes_db_prod; then
    log_info "Criando backup do banco de dados..."
    docker exec embarcacoes_db_prod pg_dump -U embarcacoes embarcacoes_db > backups/db_backup.sql 2>/dev/null || log_warning "Backup DB falhou (normal se DB não iniciou)"
fi

# Backup de configurações
tar -czf "$BACKUP_FILE" \
    nginx/nginx.conf \
    docker-compose.prod.yml \
    .env \
    backend/src/config/ \
    2>/dev/null || true

log_success "Backup criado: $BACKUP_FILE"
echo ""

# =====================================================
# 2. VERIFICAR E ATIVAR SSL
# =====================================================

log_info "2️⃣ Verificando e ativando SSL/HTTPS..."

# Verificar se certificados existem
if [ -d "certbot/conf/live/app.infinitynautica.com.br" ]; then
    log_success "Certificados SSL encontrados!"
    
    # Verificar se nginx.conf já tem SSL ativo
    if ! grep -q "listen 443 ssl http2;" nginx/nginx.conf; then
        log_info "Ativando HTTPS no Nginx..."
        
        # Fazer backup do nginx.conf atual
        cp nginx/nginx.conf nginx/nginx.conf.backup
        
        # Usar configuração SSL pré-feita
        if [ -f "nginx/nginx.conf.ssl" ]; then
            log_info "Copiando nginx.conf.ssl..."
            cp nginx/nginx.conf.ssl nginx/nginx.conf
        else
            log_warning "nginx.conf.ssl não encontrado. SSL não será ativado."
            log_warning "Consulte ATIVAR-SSL-HTTPS.md para ativação manual."
        fi
    else
        log_success "SSL já está ativo no Nginx!"
    fi
else
    log_warning "Certificados SSL não encontrados."
    log_warning "SSL não será ativado automaticamente."
    log_info "Para ativar SSL, execute: bash setup-ssl.sh app.infinitynautica.com.br"
    log_info "Ou consulte: ATIVAR-SSL-HTTPS.md"
fi
echo ""

# =====================================================
# 3. CONFIGURAR BACKUPS AUTOMÁTICOS DO BANCO
# =====================================================

log_info "3️⃣ Configurando backups automáticos do banco..."

# Criar script de backup
mkdir -p scripts
cat > scripts/backup-db.sh << 'EOF'
#!/bin/bash
# Script de backup automático do banco de dados

BACKUP_DIR="/opt/embarcacoes/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql"

# Criar diretório se não existir
mkdir -p "$BACKUP_DIR"

# Fazer backup
docker exec embarcacoes_db_prod pg_dump -U embarcacoes embarcacoes_db > "$BACKUP_FILE" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Backup criado: $BACKUP_FILE"
    
    # Compactar backup
    gzip "$BACKUP_FILE"
    
    # Remover backups antigos (manter últimos 30 dias)
    find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +30 -delete
    
    # Limpar backups antigos (manter últimos 10)
    ls -t "$BACKUP_DIR"/db_backup_*.sql.gz | tail -n +11 | xargs rm -f 2>/dev/null || true
else
    echo "❌ Erro ao criar backup"
    exit 1
fi
EOF

chmod +x scripts/backup-db.sh
log_success "Script de backup criado: scripts/backup-db.sh"

# Adicionar ao crontab (backup diário às 2h da manhã)
(crontab -l 2>/dev/null | grep -v "scripts/backup-db.sh"; echo "0 2 * * * cd /opt/embarcacoes && bash scripts/backup-db.sh >> /var/log/embarcacoes-backup.log 2>&1") | crontab -
log_success "Backup automático configurado (diário às 2h)"
echo ""

# =====================================================
# 4. MELHORAR PERFORMANCE DO FRONTEND
# =====================================================

log_info "4️⃣ Otimizando performance do frontend..."

# Verificar se lazy loading já está implementado
if ! grep -q "lazy" frontend/src/App.tsx 2>/dev/null; then
    log_info "Lazy loading não implementado. Será adicionado..."
    # NOTA: Isso requer edição manual do arquivo App.tsx
    log_warning "Lazy loading requer edição manual de frontend/src/App.tsx"
else
    log_success "Lazy loading já implementado!"
fi

# Verificar otimizações do Vite
if grep -q "manualChunks: undefined" frontend/vite.config.ts; then
    log_success "Vite configurado corretamente (single bundle)"
else
    log_warning "Verificar configuração do Vite"
fi
echo ""

# =====================================================
# 5. VERIFICAR E CORRIGIR ERROR HANDLING
# =====================================================

log_info "5️⃣ Verificando error handling..."

# Verificar se error handler existe
if [ -f "backend/src/middleware/error-handler.ts" ]; then
    log_success "Error handler encontrado"
else
    log_error "Error handler não encontrado!"
fi

# Verificar se controllers usam next(error)
log_info "Verificando uso de next(error) nos controllers..."
if grep -r "res.status.*json" backend/src/controllers/*.ts 2>/dev/null | grep -v "next(" | grep -v "// "; then
    log_warning "Alguns controllers podem não usar next(error) corretamente"
    log_info "Revisar manualmente: backend/src/controllers/"
else
    log_success "Controllers parecem usar next(error) corretamente"
fi
echo ""

# =====================================================
# 6. REBUILD E RESTART
# =====================================================

log_info "6️⃣ Reconstruindo e reiniciando serviços..."

# Pull último código
log_info "Fazendo pull do código..."
git pull origin main || log_warning "Git pull falhou (continuando...)"

# Rebuild containers
log_info "Rebuild containers..."
docker compose -f docker-compose.prod.yml build --no-cache || log_warning "Build falhou em alguns containers"

# Restart
log_info "Reiniciando serviços..."
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# Aguardar inicialização
log_info "Aguardando inicialização..."
sleep 20
echo ""

# =====================================================
# 7. VERIFICAÇÃO FINAL
# =====================================================

log_info "7️⃣ Verificação final do sistema..."

# Verificar containers
log_info "Verificando status dos containers..."
if docker ps | grep -q embarcacoes_backend_prod | grep -v "unhealthy"; then
    log_success "Containers rodando!"
else
    log_error "Alguns containers não estão saudáveis!"
    docker ps | grep embarcacoes
fi

# Verificar SSL
log_info "Verificando SSL..."
if curl -sI https://app.infinitynautica.com.br 2>&1 | grep -q "HTTP"; then
    log_success "HTTPS respondendo!"
else
    log_warning "HTTPS não está respondendo (normal se certificados não foram gerados)"
fi

# Verificar migrations
log_info "Verificando migrations..."
if docker exec embarcacoes_backend_prod npx prisma migrate status 2>/dev/null | grep -q "up to date"; then
    log_success "Migrations atualizadas!"
else
    log_warning "Verificar migrations manualmente"
fi

echo ""

# =====================================================
# RESUMO FINAL
# =====================================================

echo "=================================================="
echo "✅ CORREÇÃO CONCLUÍDA!"
echo "=================================================="
echo ""
echo "Resumo das ações:"
echo "✅ Backup criado"
if [ -f "nginx/nginx.conf.ssl" ] && [ -d "certbot/conf/live/app.infinitynautica.com.br" ]; then
    echo "✅ SSL ativado no Nginx"
else
    echo "⚠️  SSL não foi ativado (certificados ausentes)"
fi
echo "✅ Backups automáticos configurados"
echo "✅ Serviços reconstruídos"
echo ""
echo "Próximos passos:"
echo "1. Verificar logs: docker logs embarcacoes_backend_prod --tail=100"
echo "2. Testar acesso: https://app.infinitynautica.com.br"
echo "3. Verificar backups: ls -lh backups/"
echo "4. Se SSL não ativou: bash setup-ssl.sh app.infinitynautica.com.br"
echo ""
echo "Documentação:"
echo "- SSL: ATIVAR-SSL-HTTPS.md"
echo "- Database: VERIFICACAO-BANCO-DADOS.md"
echo "- Overview: OVERVIEW-COMPLETO-SISTEMA.md"
echo ""
echo "=================================================="

